
from typing import Any
from fastapi import APIRouter, HTTPException
from sqlmodel import SQLModel, func, select

from app.api.deps import SessionDep
from app.models import MedicalCenter
from app.schemas.medical_center import (
    MedicalCenterPublic,
    MedicalCentersPublic,
)

router = APIRouter()

class SearchRequest(SQLModel):
    query: str | None = None
    city: str | None = None
    institution_type_id: int | None = None
    has_emergency: bool | None = None
    is_public: bool | None = None


@router.post("/search", response_model=list[MedicalCenterPublic])
async def search_medical_centers(search_request: SearchRequest, session: SessionDep):
    """
    Search medical centers locally in PostgreSQL.
    """
    statement = select(MedicalCenter)

    if search_request.city:
        statement = statement.where(MedicalCenter.city == search_request.city)
    if search_request.institution_type_id:
        statement = statement.where(
            MedicalCenter.institution_type_id == search_request.institution_type_id
        )
    if search_request.has_emergency is not None:
        statement = statement.where(
            MedicalCenter.has_emergency == search_request.has_emergency
        )
    if search_request.is_public is not None:
        statement = statement.where(MedicalCenter.is_public == search_request.is_public)

    centers = list(session.exec(statement).all())
    if search_request.query:
        query = search_request.query.casefold()
        centers = [
            center
            for center in centers
            if query in center.name.casefold()
            or query in (center.description or "").casefold()
            or query in (center.address or "").casefold()
        ]

    centers.sort(key=lambda center: center.rating or 0, reverse=True)
    return centers

@router.get("/", response_model=MedicalCentersPublic)
def get_medical_centers(session: SessionDep, skip: int = 0, limit: int = 100) -> Any:
    """
    Retrieve medical centers.
    """
    count_statement = select(func.count()).select_from(MedicalCenter)
    count = session.exec(count_statement).one()
    statement = select(MedicalCenter).offset(skip).limit(limit)
    centers = session.exec(statement).all()

    return MedicalCentersPublic(data=centers, count=count)


@router.get("/{id}", response_model=MedicalCenterPublic)
def get_medical_center(session: SessionDep, id: int) -> Any:
    """
    Get medical center by ID.
    """
    center = session.get(MedicalCenter, id)
    if not center:
        raise HTTPException(status_code=404, detail="Medical center not found")
    return center
