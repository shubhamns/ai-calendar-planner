from datetime import datetime, timedelta, timezone
import bcrypt
from fastapi import HTTPException
from jose import JWTError, jwt
from langchain_core.messages import HumanMessage, SystemMessage
from langchain_openai import ChatOpenAI
from sqlalchemy.orm import Session
from app.config import settings
from app.models import CalendarEvent, PromptUsage, User, UserSettings
from app.schemas import (
    AIPlanRequest,
    CalendarStats,
    EventCreate,
    EventResponse,
    EventUpdate,
    LoginRequest,
    RegisterRequest,
)


def hash_password(raw: str) -> str:
    return bcrypt.hashpw(raw.encode(), bcrypt.gensalt()).decode()


def check_password(raw: str, hashed: str) -> bool:
    return bcrypt.checkpw(raw.encode(), hashed.encode())


def make_token(user_id: int) -> str:
    exp = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return jwt.encode({"sub": str(user_id), "exp": exp}, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def read_token(token: str) -> int | None:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        sub = payload.get("sub")
        return int(sub) if sub else None
    except (JWTError, ValueError):
        return None


def register(db: Session, data: RegisterRequest) -> User:
    if db.query(User).filter(User.email == data.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    user = User(email=data.email, hashed_password=hash_password(data.password), full_name=data.full_name)
    db.add(user)
    db.flush()
    db.add(UserSettings(user_id=user.id, timezone=settings.DEFAULT_TIMEZONE))
    db.commit()
    db.refresh(user)
    return user


def login(db: Session, data: LoginRequest) -> str:
    user = db.query(User).filter(User.email == data.email).first()
    if not user or not check_password(data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    return make_token(user.id)


def as_utc(dt: datetime) -> datetime:
    return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)


def serialize_event(row: CalendarEvent) -> EventResponse:
    return EventResponse(
        id=row.id,
        title=row.title,
        description=row.description,
        location=row.location,
        start_time=as_utc(row.start_time),
        end_time=as_utc(row.end_time),
    )


def list_events(db: Session, user: User, start: datetime | None = None, end: datetime | None = None) -> list[EventResponse]:
    q = db.query(CalendarEvent).filter(CalendarEvent.user_id == user.id)
    if start:
        q = q.filter(CalendarEvent.end_time >= as_utc(start))
    if end:
        q = q.filter(CalendarEvent.start_time <= as_utc(end))
    return [serialize_event(row) for row in q.order_by(CalendarEvent.start_time).all()]


def create_event(db: Session, user: User, data: EventCreate) -> EventResponse:
    start, end = as_utc(data.start_time), as_utc(data.end_time)
    if end <= start:
        raise HTTPException(status_code=400, detail="End time must be after start time")
    row = CalendarEvent(
        user_id=user.id,
        title=data.title,
        description=data.description,
        location=data.location,
        start_time=start,
        end_time=end,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return serialize_event(row)


def load_event(db: Session, user: User, event_id: int) -> CalendarEvent:
    row = db.query(CalendarEvent).filter(CalendarEvent.id == event_id, CalendarEvent.user_id == user.id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Event not found")
    return row


def update_event(db: Session, user: User, event_id: int, data: EventUpdate) -> EventResponse:
    row = load_event(db, user, event_id)
    patch = data.model_dump(exclude_unset=True)
    start = as_utc(patch.get("start_time", row.start_time))
    end = as_utc(patch.get("end_time", row.end_time))
    if end <= start:
        raise HTTPException(status_code=400, detail="End time must be after start time")
    for key, val in patch.items():
        setattr(row, key, as_utc(val) if key in ("start_time", "end_time") and val is not None else val)
    if "start_time" in patch or "end_time" in patch:
        row.reminder_sent_at = None
    db.commit()
    db.refresh(row)
    return serialize_event(row)


def delete_event(db: Session, user: User, event_id: int) -> None:
    db.delete(load_event(db, user, event_id))
    db.commit()


def calendar_stats(db: Session, user: User) -> CalendarStats:
    now = datetime.now(timezone.utc)
    day_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    day_end = day_start + timedelta(days=1)
    rows = db.query(CalendarEvent).filter(
        CalendarEvent.user_id == user.id,
        CalendarEvent.end_time >= now - timedelta(days=1),
    ).all()
    today, upcoming = 0, 0
    for row in rows:
        start = as_utc(row.start_time)
        if day_start <= start < day_end:
            today += 1
        elif start >= now:
            upcoming += 1
    return CalendarStats(events_today=today, events_upcoming=upcoming)


def generate_ai_plan(db: Session, user: User, data: AIPlanRequest) -> tuple[str, int]:
    today = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    usage = db.query(PromptUsage).filter(PromptUsage.user_id == user.id, PromptUsage.usage_date == today).first()
    if not usage:
        usage = PromptUsage(user_id=user.id, usage_date=today, count=0)
        db.add(usage)
        db.flush()
    if usage.count >= settings.PROMPT_LIMIT_PER_DAY:
        raise HTTPException(status_code=429, detail="Daily prompt limit reached")
    if not settings.openai_api_key:
        raise HTTPException(status_code=503, detail="OpenAI API key not configured")
    events = list_events(db, user)
    if events:
        lines = [f"- {e.title}: {e.start_time.isoformat()} – {e.end_time.isoformat()}" for e in events[:15]]
        event_block = "\n".join(lines)
    else:
        event_block = "No events on the calendar yet."
    try:
        llm = ChatOpenAI(model=settings.OPENAI_MODEL, api_key=settings.openai_api_key, temperature=0.7)
        reply = llm.invoke([
            SystemMessage(content="You help people plan their week. Be practical and brief."),
            HumanMessage(content=f"Events:\n{event_block}\n\nQuestion:\n{data.prompt}"),
        ])
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"OpenAI request failed: {exc}") from exc
    text = reply.content if isinstance(reply.content, str) else str(reply.content)
    usage.count += 1
    db.commit()
    return text, settings.PROMPT_LIMIT_PER_DAY - usage.count
