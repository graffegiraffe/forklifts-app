from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, Field, field_validator


# ── Incident ──────────────────────────────────────────────────────────────────

class IncidentBase(BaseModel):
    started_at: datetime
    ended_at: datetime | None = None
    description: str | None = None


class IncidentCreate(IncidentBase):
    pass


class IncidentUpdate(BaseModel):
    started_at: datetime | None = None
    ended_at: datetime | None = None
    description: str | None = None


class IncidentRead(IncidentBase):
    id: int
    forklift_id: int
    downtime_minutes: int = Field(description="Время простоя в минутах (рассчитывается автоматически)")
    downtime_display: str = Field(description="Время простоя в формате 'Xч Yмин'")

    model_config = {"from_attributes": True}


# ── Forklift ──────────────────────────────────────────────────────────────────

class ForkliftBase(BaseModel):
    brand: str = Field(min_length=1, max_length=255)
    number: str = Field(min_length=1, max_length=255)
    load_capacity: Decimal = Field(gt=0)
    is_active: bool = True

    @field_validator("load_capacity")
    @classmethod
    def validate_capacity(cls, v: Decimal) -> Decimal:
        return round(v, 3)


class ForkliftCreate(ForkliftBase):
    modified_by: str = Field(min_length=1, max_length=255)


class ForkliftUpdate(BaseModel):
    brand: str | None = Field(default=None, min_length=1, max_length=255)
    number: str | None = Field(default=None, min_length=1, max_length=255)
    load_capacity: Decimal | None = Field(default=None, gt=0)
    is_active: bool | None = None
    modified_by: str = Field(min_length=1, max_length=255)

    @field_validator("load_capacity")
    @classmethod
    def validate_capacity(cls, v: Decimal | None) -> Decimal | None:
        if v is not None:
            return round(v, 3)
        return v


class ForkliftRead(ForkliftBase):
    id: int
    modified_at: datetime
    modified_by: str
    has_incidents: bool = False

    model_config = {"from_attributes": True}


class ForkliftReadWithIncidents(ForkliftRead):
    incidents: list[IncidentRead] = []
