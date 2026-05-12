import uuid
from datetime import datetime

from sqlmodel import Field, SQLModel

from app.schemas.medical_catalog import TriageQuestionPublic
from app.schemas.medical_center import MedicalCenterPublic


class ChatRequest(SQLModel):
    message: str
    chat_session_id: uuid.UUID | None = None
    city: str | None = None


class ChatAnswer(SQLModel):
    question_id: int
    answer_option_id: int
    risk_score: int | None = None


class ChatAnswerRequest(SQLModel):
    health_need_id: int
    chat_session_id: uuid.UUID | None = None
    answers: list[ChatAnswer] = Field(default_factory=list)
    selected_option_ids: list[int] = Field(default_factory=list)
    city: str | None = None


class ChatResponse(SQLModel):
    chat_session_id: uuid.UUID | None = None
    message: str
    health_need_id: int | None = None
    health_need_name: str | None = None
    recommended_service: str | None = None
    recommended_specialty: str | None = None
    recommended_institution_type: str | None = None
    explanation: str | None = None
    risk_level: str = "low"
    risk_score: int = 0
    questions: list[TriageQuestionPublic] = Field(default_factory=list)
    recommendations: list[MedicalCenterPublic] = Field(default_factory=list)
    supported_needs: list[str] = Field(default_factory=list)


class ChatSessionCreate(SQLModel):
    title: str | None = Field(default=None, max_length=120)
    city: str | None = Field(default=None, max_length=120)


class ChatMessagePublic(SQLModel):
    id: uuid.UUID
    sender: str
    text: str
    response_payload: dict | None = None
    created_at: datetime


class ChatSessionPublic(SQLModel):
    id: uuid.UUID
    title: str
    city: str | None = None
    created_at: datetime
    updated_at: datetime


class ChatSessionDetail(ChatSessionPublic):
    messages: list[ChatMessagePublic] = Field(default_factory=list)


class ChatSessionsPublic(SQLModel):
    data: list[ChatSessionPublic]
    count: int
