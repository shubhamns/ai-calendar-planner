from datetime import datetime, timezone
from pydantic import BaseModel, EmailStr, Field, field_serializer


class HealthResponse(BaseModel):
    success: bool
    message: str
    version: str


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    full_name: str = Field(min_length=1, max_length=255)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserResponse(BaseModel):
    id: int
    email: EmailStr
    full_name: str


class EventCreate(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    description: str | None = None
    location: str | None = None
    start_time: datetime
    end_time: datetime


class EventUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = None
    location: str | None = None
    start_time: datetime | None = None
    end_time: datetime | None = None


class EventResponse(BaseModel):
    id: int
    title: str
    description: str | None
    location: str | None
    start_time: datetime
    end_time: datetime

    @field_serializer("start_time", "end_time")
    def serialize_dt(self, dt: datetime) -> str:
        value = dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)
        if value.tzinfo != timezone.utc:
            value = value.astimezone(timezone.utc)
        return value.strftime("%Y-%m-%dT%H:%M:%SZ")


class CalendarStats(BaseModel):
    events_today: int
    events_upcoming: int


class AIPlanRequest(BaseModel):
    prompt: str


class AIPlanResponse(BaseModel):
    response: str
    prompts_remaining: int
