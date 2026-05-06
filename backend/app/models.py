from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, ForeignKey, Numeric, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Forklift(Base):
    __tablename__ = "forklifts"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    brand: Mapped[str] = mapped_column(String(255), nullable=False)
    number: Mapped[str] = mapped_column(String(255), nullable=False)
    load_capacity: Mapped[float] = mapped_column(Numeric(precision=10, scale=3), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    modified_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        server_default=func.now(),
    )
    modified_by: Mapped[str] = mapped_column(String(255), nullable=False)

    incidents: Mapped[list["Incident"]] = relationship(
        "Incident", back_populates="forklift", cascade="all, delete-orphan", lazy="select"
    )


class Incident(Base):
    __tablename__ = "incidents"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    forklift_id: Mapped[int] = mapped_column(ForeignKey("forklifts.id", ondelete="RESTRICT"), nullable=False)
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    ended_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    forklift: Mapped["Forklift"] = relationship("Forklift", back_populates="incidents")
