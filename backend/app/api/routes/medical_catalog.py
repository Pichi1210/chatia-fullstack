from sqlmodel import select

from fastapi import APIRouter

from app.api.deps import SessionDep
from app.models import MedicalInstitutionType, MedicalService, MedicalSpecialty
from app.schemas.medical_catalog import (
    MedicalInstitutionTypePublic,
    MedicalServicePublic,
    MedicalSpecialtyPublic,
)

router = APIRouter()


@router.get(
    "/medical-institution-types",
    response_model=list[MedicalInstitutionTypePublic],
)
def get_medical_institution_types(session: SessionDep):
    return session.exec(
        select(MedicalInstitutionType).order_by(MedicalInstitutionType.name)
    ).all()


@router.get("/medical-services", response_model=list[MedicalServicePublic])
def get_medical_services(session: SessionDep):
    return session.exec(select(MedicalService).order_by(MedicalService.name)).all()


@router.get("/medical-specialties", response_model=list[MedicalSpecialtyPublic])
def get_medical_specialties(session: SessionDep):
    return session.exec(
        select(MedicalSpecialty).order_by(MedicalSpecialty.name)
    ).all()
