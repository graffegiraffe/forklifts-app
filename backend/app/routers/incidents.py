from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Forklift, Incident
from app.routers.forklifts import _build_incident_read
from app.schemas import IncidentCreate, IncidentRead, IncidentUpdate

router = APIRouter(prefix="/forklifts/{forklift_id}/incidents", tags=["incidents"])


def _get_forklift_or_404(forklift_id: int, db: Session) -> Forklift:
    forklift = db.get(Forklift, forklift_id)
    if not forklift:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Погрузчик не найден")
    return forklift


@router.get("/", response_model=list[IncidentRead])
def list_incidents(forklift_id: int, db: Session = Depends(get_db)):
    _get_forklift_or_404(forklift_id, db)
    incidents = db.scalars(
        select(Incident)
        .where(Incident.forklift_id == forklift_id)
        .order_by(Incident.started_at.desc())
    ).all()
    return [_build_incident_read(inc) for inc in incidents]


@router.post("/", response_model=IncidentRead, status_code=status.HTTP_201_CREATED)
def create_incident(forklift_id: int, payload: IncidentCreate, db: Session = Depends(get_db)):
    _get_forklift_or_404(forklift_id, db)

    if payload.ended_at and payload.ended_at < payload.started_at:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Дата окончания не может быть раньше даты начала",
        )

    incident = Incident(
        forklift_id=forklift_id,
        started_at=payload.started_at,
        ended_at=payload.ended_at,
        description=payload.description,
    )
    db.add(incident)
    db.commit()
    db.refresh(incident)
    return _build_incident_read(incident)


@router.put("/{incident_id}", response_model=IncidentRead)
def update_incident(forklift_id: int, incident_id: int, payload: IncidentUpdate, db: Session = Depends(get_db)):
    _get_forklift_or_404(forklift_id, db)

    incident = db.scalar(
        select(Incident).where(Incident.id == incident_id, Incident.forklift_id == forklift_id)
    )
    if not incident:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Инцидент не найден")

    if payload.started_at is not None:
        incident.started_at = payload.started_at
    if payload.ended_at is not None:
        incident.ended_at = payload.ended_at
    if payload.description is not None:
        incident.description = payload.description

    # Allow clearing ended_at explicitly (set to None)
    if "ended_at" in payload.model_fields_set and payload.ended_at is None:
        incident.ended_at = None

    started = incident.started_at
    ended = incident.ended_at
    if ended and ended < started:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Дата окончания не может быть раньше даты начала",
        )

    db.commit()
    db.refresh(incident)
    return _build_incident_read(incident)


@router.delete("/{incident_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_incident(forklift_id: int, incident_id: int, db: Session = Depends(get_db)):
    _get_forklift_or_404(forklift_id, db)

    incident = db.scalar(
        select(Incident).where(Incident.id == incident_id, Incident.forklift_id == forklift_id)
    )
    if not incident:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Инцидент не найден")

    db.delete(incident)
    db.commit()
