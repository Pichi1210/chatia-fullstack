from typing import Any
from sqlmodel import SQLModel


class MedicalCenterBase(SQLModel):
    name: str
    address: str | None = None
    city: str | None = None
    category: str | None = None
    specialty: str | None = None
    latitude: float | None = None
    longitude: float | None = None
    rating: float | None = None
    phone: str | None = None
    working_hours: str | None = None
    emergency_available: bool | None = None
    approximate_price_level: str | None = None
    yandex_uri: str | None = None
    raw_data: dict[str, Any] | None = None


class MedicalCenterCreate(MedicalCenterBase):
    pass


class MedicalCenterUpdate(SQLModel):
    name: str | None = None
    address: str | None = None
    city: str | None = None
    category: str | None = None
    specialty: str | None = None
    latitude: float | None = None
    longitude: float | None = None
    rating: float | None = None
    phone: str | None = None
    working_hours: str | None = None
    emergency_available: bool | None = None
    approximate_price_level: str | None = None
    yandex_uri: str | None = None
    raw_data: dict[str, Any] | None = None


class MedicalCenterPublic(MedicalCenterBase):
    id: int


class MedicalCentersPublic(SQLModel):
    data: list[MedicalCenterPublic]
    count: int
