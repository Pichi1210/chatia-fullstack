from typing import Any

from fastapi import APIRouter, HTTPException, Request
from sqlmodel import SQLModel, func, select

from app.api.deps import SessionDep
from app.models import MedicalCenter
from app.schemas.medical_center import (
    MedicalCenterPublic,
    MedicalCentersPublic,
)
from app.services.i18n import (
    get_locale,
    localize_medical_center_public,
    localize_medical_centers_public,
)

router = APIRouter()


class SearchRequest(SQLModel):
    query: str | None = None
    city: str | None = None
    institution_type_id: int | None = None
    has_emergency: bool | None = None
    is_public: bool | None = None


def serialize_center(center: MedicalCenter) -> MedicalCenterPublic:
    public_center = MedicalCenterPublic.model_validate(center)
    public_center.institution_type_name = (
        center.institution_type.name if center.institution_type else None
    )
    return public_center


@router.post("/search", response_model=list[MedicalCenterPublic])
async def search_medical_centers(
    request: Request,
    search_request: SearchRequest,
    session: SessionDep,
):
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
    locale = get_locale(request.headers.get("accept-language"))
    return [
        localize_medical_center_public(serialize_center(center), locale)
        for center in centers
    ]


@router.get("/", response_model=MedicalCentersPublic)
def get_medical_centers(
    request: Request,
    session: SessionDep,
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """
    Retrieve medical centers.
    """
    count_statement = select(func.count()).select_from(MedicalCenter)
    count = session.exec(count_statement).one()
    statement = select(MedicalCenter).offset(skip).limit(limit)
    centers = session.exec(statement).all()

    payload = MedicalCentersPublic(
        data=[serialize_center(center) for center in centers],
        count=count,
    )
    return localize_medical_centers_public(
        payload,
        get_locale(request.headers.get("accept-language")),
    )


@router.get("/{id}", response_model=MedicalCenterPublic)
def get_medical_center(request: Request, session: SessionDep, id: int) -> Any:
    """
    Get medical center by ID.
    """
    center = session.get(MedicalCenter, id)
    if not center:
        raise HTTPException(status_code=404, detail="Medical center not found")
    return localize_medical_center_public(
        serialize_center(center),
        get_locale(request.headers.get("accept-language")),
    )
