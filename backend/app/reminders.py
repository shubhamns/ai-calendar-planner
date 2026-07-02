import asyncio
from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session, joinedload
from app.config import Settings
from app.database import SessionLocal
from app.email_service import send_event_reminder
from app.models import CalendarEvent, User
from app.services import as_utc


def process_event_reminders() -> None:
    cfg = Settings()
    if not cfg.smtp_configured:
        return
    now = datetime.now(timezone.utc)
    lead = timedelta(minutes=cfg.REMINDER_MINUTES_BEFORE)
    db: Session = SessionLocal()
    sent = 0
    try:
        rows = (
            db.query(CalendarEvent)
            .join(User)
            .options(joinedload(CalendarEvent.user).joinedload(User.settings))
            .filter(CalendarEvent.reminder_sent_at.is_(None))
            .all()
        )
        for row in rows:
            end = as_utc(row.end_time)
            if end <= now or end - now > lead:
                continue
            user = row.user
            prefs = user.settings
            if prefs and not prefs.notifications_enabled:
                continue
            try:
                send_event_reminder(
                    to=user.email,
                    name=user.full_name,
                    title=row.title,
                    start_time=as_utc(row.start_time),
                    end_time=end,
                    location=row.location,
                    description=row.description,
                    timezone=prefs.timezone if prefs else cfg.DEFAULT_TIMEZONE,
                    cfg=cfg,
                )
                row.reminder_sent_at = now
                sent += 1
            except Exception:
                pass
        if sent:
            db.commit()
    finally:
        db.close()


async def run_reminder_loop() -> None:
    while True:
        await asyncio.to_thread(process_event_reminders)
        await asyncio.sleep(30)
