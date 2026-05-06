from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Forklift, Incident
from app.schemas import ForkliftCreate, ForkliftRead, ForkliftReadWithIncidents, ForkliftUpdate, IncidentRead

router = APIRouter(prefix="/forklifts", tags=["forklifts"])


def _build_incident_read(incident: Incident) -> IncidentRead:
    now = datetime.now(timezone.utc)
    end = incident.ended_at or now

    # Ensure both datetimes are timezone-aware for subtraction
    started = incident.started_at
    if started.tzinfo is None:
        started = started.replace(tzinfo=timezone.utc)
    if end.tzinfo is None:
        end = end.replace(tzinfo=timezone.utc)

    total_minutes = max(0, int((end - started).total_seconds() // 60))
    hours, mins = divmod(total_minutes, 60)
    display = f"{hours}ч {mins}мин"

    return IncidentRead(
        id=incident.id,
        forklift_id=incident.forklift_id,
        started_at=incident.started_at,
        ended_at=incident.ended_at,
        description=incident.description,
        downtime_minutes=total_minutes,
        downtime_display=display,
    )


def _build_forklift_read(forklift: Forklift, db: Session) -> ForkliftRead:
    has_incidents = db.scalar(
        select(func.count()).where(Incident.forklift_id == forklift.id)
    ) > 0
    data = ForkliftRead.model_validate(forklift)
    data.has_incidents = has_incidents
    return data


@router.get("/", response_model=list[ForkliftRead])
def list_forklifts(
    number: str | None = Query(default=None, description="Поиск по номеру погрузчика (вхождение, без учёта регистра)"),
    db: Session = Depends(get_db),
):
    stmt = select(Forklift)
    if number:
        stmt = stmt.where(Forklift.number.ilike(f"%{number}%"))
    stmt = stmt.order_by(Forklift.id)
    forklifts = db.scalars(stmt).all()
    return [_build_forklift_read(f, db) for f in forklifts]


@router.get("/{forklift_id}", response_model=ForkliftReadWithIncidents)
def get_forklift(forklift_id: int, db: Session = Depends(get_db)):
    forklift = db.get(Forklift, forklift_id)
    if not forklift:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Погрузчик не найден")

    has_incidents = db.scalar(
        select(func.count()).where(Incident.forklift_id == forklift.id)
    ) > 0

    # Incidents sorted by started_at DESC
    incidents_rows = db.scalars(
        select(Incident)
        .where(Incident.forklift_id == forklift_id)
        .order_by(Incident.started_at.desc())
    ).all()

    result = ForkliftReadWithIncidents.model_validate(forklift)
    result.has_incidents = has_incidents
    result.incidents = [_build_incident_read(inc) for inc in incidents_rows]
    return result


@router.post("/", response_model=ForkliftRead, status_code=status.HTTP_201_CREATED)
def create_forklift(payload: ForkliftCreate, db: Session = Depends(get_db)):
    forklift = Forklift(
        brand=payload.brand,
        number=payload.number,
        load_capacity=float(payload.load_capacity),
        is_active=payload.is_active,
        modified_by=payload.modified_by,
        modified_at=datetime.now(timezone.utc),
    )
    db.add(forklift)
    db.commit()
    db.refresh(forklift)
    return _build_forklift_read(forklift, db)


@router.put("/{forklift_id}", response_model=ForkliftRead)
def update_forklift(forklift_id: int, payload: ForkliftUpdate, db: Session = Depends(get_db)):
    forklift = db.get(Forklift, forklift_id)
    if not forklift:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Погрузчик не найден")

    if payload.brand is not None:
        forklift.brand = payload.brand
    if payload.number is not None:
        forklift.number = payload.number
    if payload.load_capacity is not None:
        forklift.load_capacity = float(payload.load_capacity)
    if payload.is_active is not None:
        forklift.is_active = payload.is_active

    forklift.modified_by = payload.modified_by
    forklift.modified_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(forklift)
    return _build_forklift_read(forklift, db)


@router.delete("/{forklift_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_forklift(forklift_id: int, db: Session = Depends(get_db)):
    forklift = db.get(Forklift, forklift_id)
    if not forklift:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Погрузчик не найден")

    incident_count = db.scalar(
        select(func.count()).where(Incident.forklift_id == forklift_id)
    )
    if incident_count > 0:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Удаление запрещено: для погрузчика зарегистрированы простои",
        )

    db.delete(forklift)
    db.commit()
