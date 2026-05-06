
from fastapi import APIRouter
from sqlmodel import select, SQLModel

from app.api.deps import SessionDep
from app.models import MedicalCenter
from app.services.chatbot import parse_message
from app.services.yandex_maps import search_medical_centers
from app.services.recommendation import rank_medical_centers

router = APIRouter()

class ChatRequest(SQLModel):
    message: str


YANDEX_SPECIALTY_TERMS = {
    "dentista": "стоматология",
    "cardiologo": "кардиология",
    "dermatologo": "дерматология",
    "pediatra": "педиатрия",
}

YANDEX_CITY_TERMS = {
    "kursk": "Курск",
    "moscu": "Москва",
    "san petersburgo": "Санкт-Петербург",
}


@router.post("", response_model=None)
async def chat_with_bot(request: ChatRequest, session: SessionDep):
    """
    Process a user message, find and rank medical centers.
    """
    # 1. Parse message to get criteria
    criteria = parse_message(request.message)
    
    # 2. Build a search query for Yandex
    specialty = criteria.get("specialty")
    yandex_specialty = YANDEX_SPECIALTY_TERMS.get(specialty, specialty)
    query_parts = [yandex_specialty, criteria.get("type"), "medical"]
    search_query = " ".join(filter(None, query_parts))
    city = criteria.get("city") or "kursk"  # Default to Kursk if no city is found
    yandex_city = YANDEX_CITY_TERMS.get(city, city)

    # 3. Search on Yandex and save new results
    centers_from_yandex = await search_medical_centers(query=search_query, city=yandex_city)
    if isinstance(centers_from_yandex, dict):
        return centers_from_yandex

    if not centers_from_yandex:
        return {
            "message": "No encontre resultados reales para esa busqueda. Revisa los logs de Yandex.",
            "results": [],
        }

    if centers_from_yandex:
        for center_data in centers_from_yandex:
            if criteria.get("specialty"):
                center_data["specialty"] = criteria["specialty"]
            center_data["city"] = city
            statement = select(MedicalCenter).where(MedicalCenter.name == center_data["name"], MedicalCenter.address == center_data["address"])
            if not session.exec(statement).first():
                db_center = MedicalCenter.model_validate(center_data)
                session.add(db_center)
        session.commit()

    # 4. Get all relevant centers from DB
    statement = select(MedicalCenter)
    statement = statement.where(MedicalCenter.city == city)
    if criteria.get("specialty"):
        statement = statement.where(MedicalCenter.specialty.contains(criteria["specialty"]))

    db_centers = session.exec(statement).all()

    # 5. Rank centers
    ranked_centers = rank_medical_centers(db_centers, criteria)

    if not ranked_centers:
        return {
            "message": "No encontre resultados reales para esa busqueda. Revisa los logs de Yandex.",
            "results": [],
        }

    return {
        "message": f"Encontre {len(ranked_centers)} resultado(s) reales.",
        "results": ranked_centers,
    }
