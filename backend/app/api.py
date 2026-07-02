from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session
from app.config import settings
from app.database import get_db
from app.models import User
from app.schemas import (
    AIPlanRequest,
    AIPlanResponse,
    CalendarStats,
    EventCreate,
    EventResponse,
    EventUpdate,
    HealthResponse,
    LoginRequest,
    RegisterRequest,
    TokenResponse,
    UserResponse,
)
from app import services

router = APIRouter()
auth_scheme = HTTPBearer()


def current_user(creds: HTTPAuthorizationCredentials = Depends(auth_scheme), db: Session = Depends(get_db)) -> User:
    user_id = services.read_token(creds.credentials)
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token")
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


@router.get("/health", response_model=HealthResponse)
def health():
    return HealthResponse(success=True, message="ok", version=settings.APP_VERSION)


@router.post("/auth/register", response_model=UserResponse, status_code=201)
def register(body: RegisterRequest, db: Session = Depends(get_db)):
    user = services.register(db, body)
    return UserResponse(id=user.id, email=user.email, full_name=user.full_name)


@router.post("/auth/login", response_model=TokenResponse)
def login(body: LoginRequest, db: Session = Depends(get_db)):
    return TokenResponse(access_token=services.login(db, body))


@router.get("/auth/me", response_model=UserResponse)
def me(user: User = Depends(current_user)):
    return UserResponse(id=user.id, email=user.email, full_name=user.full_name)


@router.get("/calendar/stats", response_model=CalendarStats)
def stats(user: User = Depends(current_user), db: Session = Depends(get_db)):
    return services.calendar_stats(db, user)


@router.get("/calendar/events", response_model=list[EventResponse])
def get_events(
    user: User = Depends(current_user),
    db: Session = Depends(get_db),
    start: datetime | None = Query(default=None),
    end: datetime | None = Query(default=None),
):
    return services.list_events(db, user, start, end)


@router.post("/calendar/events", response_model=EventResponse, status_code=201)
def post_event(body: EventCreate, user: User = Depends(current_user), db: Session = Depends(get_db)):
    return services.create_event(db, user, body)


@router.put("/calendar/events/{event_id}", response_model=EventResponse)
def put_event(event_id: int, body: EventUpdate, user: User = Depends(current_user), db: Session = Depends(get_db)):
    return services.update_event(db, user, event_id, body)


@router.delete("/calendar/events/{event_id}", status_code=204)
def remove_event(event_id: int, user: User = Depends(current_user), db: Session = Depends(get_db)):
    services.delete_event(db, user, event_id)


@router.post("/ai/plan", response_model=AIPlanResponse)
def plan(body: AIPlanRequest, user: User = Depends(current_user), db: Session = Depends(get_db)):
    text, left = services.generate_ai_plan(db, user, body)
    return AIPlanResponse(response=text, prompts_remaining=left)
