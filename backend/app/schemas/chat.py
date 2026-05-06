from sqlmodel import Field, SQLModel

from app.schemas.medical_catalog import (
    MedicalInstitutionTypePublic,
    MedicalServicePublic,
    MedicalSpecialtyPublic,
    TriageQuestionPublic,
)
from app.schemas.medical_center import MedicalCenterPublic


class ChatRequest(SQLModel):
    message: str
    city: str | None = None


class ChatAnswerRequest(SQLModel):
    health_need_id: int
    selected_option_ids: list[int] = Field(default_factory=list)
    city: str | None = None


class ChatRecommendationResponse(SQLModel):
    message: str
    health_need_id: int | None = None
    risk_score: int = 0
    recommended_institution_type: MedicalInstitutionTypePublic | None = None
    recommended_service: MedicalServicePublic | None = None
    recommended_specialty: MedicalSpecialtyPublic | None = None
    explanation: str | None = None
    centers: list[MedicalCenterPublic] = Field(default_factory=list)


class ChatTriageResponse(SQLModel):
    message: str
    health_need_id: int
    health_need_name: str
    questions: list[TriageQuestionPublic] = Field(default_factory=list)


class ChatUnknownNeedResponse(SQLModel):
    message: str
    supported_needs: list[str] = Field(default_factory=list)
