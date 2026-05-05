
from datetime import datetime
from typing import Any
from sqlalchemy import func, JSON
from sqlmodel import Field, SQLModel

class MedicalCenter(SQLModel, table=True):
    id: int = Field(default=None, primary_key=True)
    name: str = Field(index=True)
    address: str
    city: str = Field(index=True)
    category: str
    specialty: str | None = Field(default=None, index=True)
    latitude: float
    longitude: float
    rating: float | None = Field(default=None)
    phone: str | None = Field(default=None)
    working_hours: str | None = Field(default=None)
    emergency_available: bool = Field(default=False)
    approximate_price_level: int | None = Field(default=None)
    yandex_uri: str | None = Field(default=None)
    raw_data: dict[str, Any] | None = Field(default=None, sa_column=JSON)
    created_at: datetime = Field(default_factory=datetime.utcnow, sa_column_kwargs={"server_default": func.now()})
    updated_at: datetime = Field(default_factory=datetime.utcnow, sa_column_kwargs={"server_default": func.now(), "onupdate": func.now()})
