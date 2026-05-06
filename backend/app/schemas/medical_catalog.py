from sqlmodel import Field, SQLModel


class MedicalInstitutionTypePublic(SQLModel):
    id: int
    name: str
    description: str | None = None
    urgency_level: str | None = None
    is_emergency_capable: bool


class MedicalServicePublic(SQLModel):
    id: int
    name: str
    description: str | None = None
    category: str | None = None
    requires_appointment: bool
    is_emergency_service: bool


class MedicalSpecialtyPublic(SQLModel):
    id: int
    name: str
    description: str | None = None


class TriageAnswerOptionPublic(SQLModel):
    id: int
    option_text: str
    risk_score: int
    next_question_id: int | None = None


class TriageQuestionPublic(SQLModel):
    id: int
    question_text: str
    answer_type: str
    priority: int
    is_required: bool
    answer_options: list[TriageAnswerOptionPublic] = Field(default_factory=list)


class HealthNeedPublic(SQLModel):
    id: int
    name: str
    description: str | None = None
    urgency_level: str | None = None
    keywords: list[str] = Field(default_factory=list)
