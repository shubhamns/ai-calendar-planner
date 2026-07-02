from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker
from app.config import settings

engine = create_engine(settings.DATABASE_URL or "sqlite:///./app.db", pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def sync_schema() -> None:
    import app.models
    Base.metadata.create_all(bind=engine)
    _ensure_columns()


def _ensure_columns() -> None:
    from sqlalchemy import inspect, text
    insp = inspect(engine)
    if "calendar_events" not in insp.get_table_names():
        return
    cols = {c["name"] for c in insp.get_columns("calendar_events")}
    if "reminder_sent_at" not in cols:
        with engine.begin() as conn:
            conn.execute(text("ALTER TABLE calendar_events ADD COLUMN reminder_sent_at DATETIME"))
    _drop_legacy_columns()


def _drop_legacy_columns() -> None:
    from sqlalchemy import inspect, text
    insp = inspect(engine)
    drops: list[str] = []
    if "calendar_events" in insp.get_table_names():
        cols = {c["name"] for c in insp.get_columns("calendar_events")}
        if "category" in cols:
            drops.append("ALTER TABLE calendar_events DROP COLUMN category")
    if "user_settings" in insp.get_table_names():
        cols = {c["name"] for c in insp.get_columns("user_settings")}
        if "theme_preference" in cols:
            drops.append("ALTER TABLE user_settings DROP COLUMN theme_preference")
    if drops:
        with engine.begin() as conn:
            for stmt in drops:
                conn.execute(text(stmt))


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
