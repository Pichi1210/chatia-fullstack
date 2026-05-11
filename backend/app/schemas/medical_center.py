from typing import Any

from sqlmodel import Field, SQLModel


class MedicalCenterBase(SQLModel):
    name: str
    institution_type_id: int | None = None
    city: str | None = None
    district: str | None = None
    address: str | None = None
    latitude: float | None = None
    longitude: float | None = None
    phone: str | None = None
    website: str | None = None
    working_hours: str | None = None
    rating: float | None = None
    price_level: str | None = None
    has_emergency: bool = False
    is_public: bool = False
    description: str | None = None
    raw_data: dict[str, Any] | None = None


class MedicalCenterCreate(MedicalCenterBase):
    pass


class MedicalCenterUpdate(SQLModel):
    name: str | None = None
    institution_type_id: int | None = None
    city: str | None = None
    district: str | None = None
    address: str | None = None
    latitude: float | None = None
    longitude: float | None = None
    phone: str | None = None
    website: str | None = None
    working_hours: str | None = None
    rating: float | None = None
    price_level: str | None = None
    has_emergency: bool | None = None
    is_public: bool | None = None
    description: str | None = None
    raw_data: dict[str, Any] | None = None


class MedicalCenterPublic(MedicalCenterBase):
    id: int
    institution_type_name: str | None = None
    main_services: list[str] = Field(default_factory=list)
    main_specialties: list[str] = Field(default_factory=list)
    recommendation_reason: str | None = None


class MedicalCentersPublic(SQLModel):
    data: list[MedicalCenterPublic]
    count: int
