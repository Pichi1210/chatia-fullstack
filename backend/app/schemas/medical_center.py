
from sqlmodel import SQLModel
from app.models import MedicalCenter

class MedicalCenterCreate(SQLModel):
    name: str
    address: str
    city: str
    category: str
    latitude: float
    longitude: float

class MedicalCenterPublic(MedicalCenter):
    pass

class MedicalCentersPublic(SQLModel):
    data: list[MedicalCenterPublic]
    count: int
