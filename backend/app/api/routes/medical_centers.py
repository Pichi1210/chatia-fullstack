
from typing import Any
from fastapi import APIRouter, HTTPException
from sqlmodel import func, select

from app.api.deps import SessionDep
from app.models.medical_center import MedicalCenter
from app.schemas.medical_center import MedicalCenterCreate, MedicalCentersPublic
from app.services.yandex_maps import search_medical_centers

router = APIRouter()

class SearchRequest(SQLModel):
    query: str
    city: str

@router.post("/search", response_model=list[MedicalCenter])
async def search_and_save_medical_centers(search_request: SearchRequest, session: SessionDep):
    """
    Search for medical centers using Yandex Maps API, save them to the database,
    and return the saved centers.
    """
    centers_from_yandex = await search_medical_centers(query=search_request.query, city=search_request.city)
    if not centers_from_yandex:
        return []

    saved_centers = []
    for center_data in centers_from_yandex:
        # Check if center already exists by name and address to avoid duplicates
        statement = select(MedicalCenter).where(MedicalCenter.name == center_data["name"], MedicalCenter.address == center_data["address"])
        existing_center = session.exec(statement).first()
        
        if not existing_center:
            center_create = MedicalCenterCreate(**center_data)
            db_center = MedicalCenter.model_validate(center_create)
            session.add(db_center)
            session.commit()
            session.refresh(db_center)
            saved_centers.append(db_center)
        else:
            saved_centers.append(existing_center)

    return saved_centers

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


@router.get("/{id}", response_model=MedicalCenter)
def get_medical_center(session: SessionDep, id: int) -> Any:
    """
    Get medical center by ID.
    """
    center = session.get(MedicalCenter, id)
    if not center:
        raise HTTPException(status_code=404, detail="Medical center not found")
    return center
