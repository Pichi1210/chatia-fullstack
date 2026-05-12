import uuid
from datetime import datetime, timezone
from typing import Any

from pydantic import EmailStr
from sqlalchemy import Column, DateTime, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlmodel import Field, Relationship, SQLModel


def get_datetime_utc() -> datetime:
    return datetime.now(timezone.utc)


# Shared properties
class UserBase(SQLModel):
    email: EmailStr = Field(unique=True, index=True, max_length=255)
    is_active: bool = True
    is_superuser: bool = False
    full_name: str | None = Field(default=None, max_length=255)


# Properties to receive via API on creation
class UserCreate(UserBase):
    password: str = Field(min_length=8, max_length=128)


class UserRegister(SQLModel):
    email: EmailStr = Field(max_length=255)
    password: str = Field(min_length=8, max_length=128)
    full_name: str | None = Field(default=None, max_length=255)


# Properties to receive via API on update, all are optional
class UserUpdate(UserBase):
    email: EmailStr | None = Field(default=None, max_length=255)  # type: ignore[assignment]
    password: str | None = Field(default=None, min_length=8, max_length=128)


class UserUpdateMe(SQLModel):
    full_name: str | None = Field(default=None, max_length=255)
    email: EmailStr | None = Field(default=None, max_length=255)


class UpdatePassword(SQLModel):
    current_password: str = Field(min_length=8, max_length=128)
    new_password: str = Field(min_length=8, max_length=128)


# Database model, database table inferred from class name
class User(UserBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    hashed_password: str
    created_at: datetime | None = Field(
        default_factory=get_datetime_utc,
        sa_type=DateTime(timezone=True),  # type: ignore
    )
    items: list["Item"] = Relationship(back_populates="owner", cascade_delete=True)
    chat_sessions: list["ChatSession"] = Relationship(
        back_populates="owner",
        cascade_delete=True,
    )


# Properties to return via API, id is always required
class UserPublic(UserBase):
    id: uuid.UUID
    created_at: datetime | None = None


class UsersPublic(SQLModel):
    data: list[UserPublic]
    count: int


# Shared properties
class ItemBase(SQLModel):
    title: str = Field(min_length=1, max_length=255)
    description: str | None = Field(default=None, max_length=255)


# Properties to receive on item creation
class ItemCreate(ItemBase):
    pass


# Properties to receive on item update
class ItemUpdate(ItemBase):
    title: str | None = Field(default=None, min_length=1, max_length=255)  # type: ignore[assignment]


# Database model, database table inferred from class name
class Item(ItemBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    created_at: datetime | None = Field(
        default_factory=get_datetime_utc,
        sa_type=DateTime(timezone=True),  # type: ignore
    )
    owner_id: uuid.UUID = Field(
        foreign_key="user.id", nullable=False, ondelete="CASCADE"
    )
    owner: User | None = Relationship(back_populates="items")


# Properties to return via API, id is always required
class ItemPublic(ItemBase):
    id: uuid.UUID
    owner_id: uuid.UUID
    created_at: datetime | None = None


class ItemsPublic(SQLModel):
    data: list[ItemPublic]
    count: int


class ChatSession(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    title: str = Field(default="Nueva consulta", max_length=120)
    city: str | None = Field(default=None, max_length=120)
    created_at: datetime = Field(
        default_factory=get_datetime_utc,
        sa_type=DateTime(timezone=True),  # type: ignore
    )
    updated_at: datetime = Field(
        default_factory=get_datetime_utc,
        sa_type=DateTime(timezone=True),  # type: ignore
    )
    owner_id: uuid.UUID = Field(
        foreign_key="user.id",
        nullable=False,
        ondelete="CASCADE",
        index=True,
    )

    owner: User | None = Relationship(back_populates="chat_sessions")
    messages: list["ChatMessage"] = Relationship(
        back_populates="chat_session",
        cascade_delete=True,
    )


class ChatMessage(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    chat_session_id: uuid.UUID = Field(
        foreign_key="chatsession.id",
        nullable=False,
        ondelete="CASCADE",
        index=True,
    )
    sender: str = Field(max_length=20)
    text: str
    response_payload: dict[str, Any] | None = Field(
        default=None,
        sa_column=Column(JSONB, nullable=True),
    )
    created_at: datetime = Field(
        default_factory=get_datetime_utc,
        sa_type=DateTime(timezone=True),  # type: ignore
    )

    chat_session: ChatSession | None = Relationship(back_populates="messages")


# Generic message
class Message(SQLModel):
    message: str


# JSON payload containing access token
class Token(SQLModel):
    access_token: str
    token_type: str = "bearer"


# Contents of JWT token
class TokenPayload(SQLModel):
    sub: str | None = None


class NewPassword(SQLModel):
    token: str
    new_password: str = Field(min_length=8, max_length=128)

class MedicalInstitutionType(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    name: str = Field(index=True, unique=True, max_length=255)
    description: str | None = Field(default=None)
    urgency_level: str | None = Field(default=None, max_length=50)
    is_emergency_capable: bool = Field(default=False)
    created_at: datetime = Field(
        default_factory=datetime.utcnow, sa_column_kwargs={"server_default": func.now()}
    )
    updated_at: datetime = Field(
        default_factory=datetime.utcnow,
        sa_column_kwargs={"server_default": func.now(), "onupdate": func.now()},
    )


class MedicalService(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    name: str = Field(index=True, unique=True, max_length=255)
    description: str | None = Field(default=None)
    category: str | None = Field(default=None, index=True, max_length=100)
    requires_appointment: bool = Field(default=True)
    is_emergency_service: bool = Field(default=False)
    created_at: datetime = Field(
        default_factory=datetime.utcnow, sa_column_kwargs={"server_default": func.now()}
    )
    updated_at: datetime = Field(
        default_factory=datetime.utcnow,
        sa_column_kwargs={"server_default": func.now(), "onupdate": func.now()},
    )

    center_links: list["MedicalCenterService"] = Relationship(
        back_populates="medical_service"
    )
    need_rules: list["NeedServiceRule"] = Relationship(
        back_populates="recommended_service"
    )
    recommendation_rules: list["RecommendationRule"] = Relationship(
        back_populates="recommended_service"
    )


class MedicalSpecialty(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    name: str = Field(index=True, unique=True, max_length=255)
    description: str | None = Field(default=None)
    created_at: datetime = Field(
        default_factory=datetime.utcnow, sa_column_kwargs={"server_default": func.now()}
    )
    updated_at: datetime = Field(
        default_factory=datetime.utcnow,
        sa_column_kwargs={"server_default": func.now(), "onupdate": func.now()},
    )

    center_links: list["MedicalCenterSpecialty"] = Relationship(
        back_populates="medical_specialty"
    )
    need_rules: list["NeedServiceRule"] = Relationship(
        back_populates="recommended_specialty"
    )
    recommendation_rules: list["RecommendationRule"] = Relationship(
        back_populates="recommended_specialty"
    )


class MedicalCenter(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    name: str = Field(index=True)
    institution_type_id: int | None = Field(
        default=None, foreign_key="medicalinstitutiontype.id", index=True
    )
    city: str | None = Field(default=None, index=True)
    district: str | None = Field(default=None, index=True)
    address: str | None = Field(default=None)
    latitude: float | None = Field(default=None)
    longitude: float | None = Field(default=None)
    phone: str | None = Field(default=None)
    website: str | None = Field(default=None)
    working_hours: str | None = Field(default=None)
    rating: float | None = Field(default=None)
    price_level: str | None = Field(default=None)
    has_emergency: bool = Field(default=False)
    is_public: bool = Field(default=False)
    description: str | None = Field(default=None)
    raw_data: dict | None = Field(default=None, sa_column=Column(JSONB, nullable=True))
    created_at: datetime = Field(
        default_factory=datetime.utcnow, sa_column_kwargs={"server_default": func.now()}
    )
    updated_at: datetime = Field(
        default_factory=datetime.utcnow,
        sa_column_kwargs={"server_default": func.now(), "onupdate": func.now()},
    )

    institution_type: MedicalInstitutionType | None = Relationship()
    service_links: list["MedicalCenterService"] = Relationship(
        back_populates="medical_center"
    )
    specialty_links: list["MedicalCenterSpecialty"] = Relationship(
        back_populates="medical_center"
    )


class MedicalCenterService(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    medical_center_id: int = Field(foreign_key="medicalcenter.id", index=True)
    medical_service_id: int = Field(foreign_key="medicalservice.id", index=True)
    available: bool = Field(default=True)
    price_estimate: str | None = Field(default=None)
    appointment_required: bool = Field(default=True)
    notes: str | None = Field(default=None)

    medical_center: MedicalCenter | None = Relationship(back_populates="service_links")
    medical_service: MedicalService | None = Relationship(
        back_populates="center_links"
    )


class MedicalCenterSpecialty(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    medical_center_id: int = Field(foreign_key="medicalcenter.id", index=True)
    medical_specialty_id: int = Field(foreign_key="medicalspecialty.id", index=True)
    available: bool = Field(default=True)
    doctor_count: int | None = Field(default=None)
    notes: str | None = Field(default=None)

    medical_center: MedicalCenter | None = Relationship(back_populates="specialty_links")
    medical_specialty: MedicalSpecialty | None = Relationship(
        back_populates="center_links"
    )


class HealthNeed(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    name: str = Field(index=True, unique=True, max_length=255)
    description: str | None = Field(default=None)
    urgency_level: str | None = Field(default=None, max_length=50)
    keywords: list[str] = Field(default_factory=list, sa_column=Column(JSONB))
    created_at: datetime = Field(
        default_factory=datetime.utcnow, sa_column_kwargs={"server_default": func.now()}
    )
    updated_at: datetime = Field(
        default_factory=datetime.utcnow,
        sa_column_kwargs={"server_default": func.now(), "onupdate": func.now()},
    )

    need_rules: list["NeedServiceRule"] = Relationship(back_populates="health_need")
    triage_questions: list["TriageQuestion"] = Relationship(
        back_populates="health_need"
    )
    recommendation_rules: list["RecommendationRule"] = Relationship(
        back_populates="health_need"
    )


class NeedServiceRule(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    health_need_id: int = Field(foreign_key="healthneed.id", index=True)
    recommended_service_id: int | None = Field(
        default=None, foreign_key="medicalservice.id", index=True
    )
    recommended_specialty_id: int | None = Field(
        default=None, foreign_key="medicalspecialty.id", index=True
    )
    recommended_institution_type_id: int | None = Field(
        default=None, foreign_key="medicalinstitutiontype.id", index=True
    )
    priority: int = Field(default=100, index=True)
    urgency_required: str | None = Field(default=None, max_length=50)
    explanation: str | None = Field(default=None)

    health_need: HealthNeed | None = Relationship(back_populates="need_rules")
    recommended_service: MedicalService | None = Relationship(
        back_populates="need_rules"
    )
    recommended_specialty: MedicalSpecialty | None = Relationship(
        back_populates="need_rules"
    )
    recommended_institution_type: MedicalInstitutionType | None = Relationship()


class TriageQuestion(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    health_need_id: int = Field(foreign_key="healthneed.id", index=True)
    question_text: str
    answer_type: str = Field(default="single_choice", max_length=50)
    priority: int = Field(default=100, index=True)
    is_required: bool = Field(default=True)
    created_at: datetime = Field(
        default_factory=datetime.utcnow, sa_column_kwargs={"server_default": func.now()}
    )
    updated_at: datetime = Field(
        default_factory=datetime.utcnow,
        sa_column_kwargs={"server_default": func.now(), "onupdate": func.now()},
    )

    health_need: HealthNeed | None = Relationship(back_populates="triage_questions")
    answer_options: list["TriageAnswerOption"] = Relationship(
        back_populates="question",
        sa_relationship_kwargs={
            "foreign_keys": "[TriageAnswerOption.question_id]",
        },
    )


class TriageAnswerOption(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    question_id: int = Field(foreign_key="triagequestion.id", index=True)
    option_text: str
    risk_score: int = Field(default=0)
    next_question_id: int | None = Field(
        default=None, foreign_key="triagequestion.id", index=True
    )

    question: TriageQuestion | None = Relationship(
        back_populates="answer_options",
        sa_relationship_kwargs={
            "foreign_keys": "[TriageAnswerOption.question_id]",
        },
    )
    next_question: TriageQuestion | None = Relationship(
        sa_relationship_kwargs={
            "foreign_keys": "[TriageAnswerOption.next_question_id]",
        }
    )


class RecommendationRule(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    health_need_id: int = Field(foreign_key="healthneed.id", index=True)
    min_risk_score: int = Field(default=0)
    max_risk_score: int = Field(default=999)
    recommended_institution_type_id: int | None = Field(
        default=None, foreign_key="medicalinstitutiontype.id", index=True
    )
    recommended_service_id: int | None = Field(
        default=None, foreign_key="medicalservice.id", index=True
    )
    recommended_specialty_id: int | None = Field(
        default=None, foreign_key="medicalspecialty.id", index=True
    )
    message: str
    priority: int = Field(default=100, index=True)

    health_need: HealthNeed | None = Relationship(back_populates="recommendation_rules")
    recommended_institution_type: MedicalInstitutionType | None = Relationship()
    recommended_service: MedicalService | None = Relationship(
        back_populates="recommendation_rules"
    )
    recommended_specialty: MedicalSpecialty | None = Relationship(
        back_populates="recommendation_rules"
    )
