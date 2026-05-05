
from fastapi import APIRouter, Depends
from sqlmodel import select, SQLModel

from app.api.deps import SessionDep
from app.models.medical_center import MedicalCenter
from app.services.chatbot import parse_message
from app.services.yandex_maps import search_medical_centers
from app.services.recommendation import rank_medical_centers

router = APIRouter()

class ChatRequest(SQLModel):
    message: str

@router.post("", response_model=list[MedicalCenter])
async def chat_with_bot(request: ChatRequest, session: SessionDep):
    """
    Process a user message, find and rank medical centers.
    """
    # 1. Parse message to get criteria
    criteria = parse_message(request.message)
    
    # 2. Build a search query for Yandex
    query_parts = [criteria.get("specialty"), criteria.get("type"), "medical"]
    search_query = " ".join(filter(None, query_parts))
    city = criteria.get("city", "Kursk") # Default to Kursk if no city is found

    # 3. Search on Yandex and save new results
    centers_from_yandex = await search_medical_centers(query=search_query, city=city)
    if centers_from_yandex:
        for center_data in centers_from_yandex:
            statement = select(MedicalCenter).where(MedicalCenter.name == center_data["name"], MedicalCenter.address == center_data["address"])
            if not session.exec(statement).first():
                db_center = MedicalCenter.model_validate(center_data)
                session.add(db_center)
        session.commit()

    # 4. Get all relevant centers from DB
    statement = select(MedicalCenter)
    if criteria.get("city"):
        statement = statement.where(MedicalCenter.city == criteria["city"])
    if criteria.get("specialty"):
        statement = statement.where(MedicalCenter.specialty.contains(criteria["specialty"]))

    db_centers = session.exec(statement).all()

    # 5. Rank centers
    ranked_centers = rank_medical_centers(db_centers, criteria)

    return ranked_centers
