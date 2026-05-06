
from typing import Any
from fastapi import APIRouter, HTTPException
from sqlmodel import func, select

from app.api.deps import SessionDep
from app.models import MedicalCenter
from app.schemas.medical_center import (
    MedicalCenterPublic,
    MedicalCentersPublic,
)
from app.services.yandex_maps import search_medical_centers
from sqlmodel import SQLModel

router = APIRouter()

class SearchRequest(SQLModel):
    query: str
    city: str

@router.post("/search", response_model=None)
async def search_and_save_medical_centers(search_request: SearchRequest):
    """
    Search for medical centers using Yandex Maps API and return the service result.
    """
    return await search_medical_centers(
        query=search_request.query,
        city=search_request.city,
    )

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
