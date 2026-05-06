from fastapi import APIRouter, HTTPException

from app.api.deps import SessionDep
from app.models import HealthNeed
from app.schemas.chat import ChatAnswerRequest, ChatRequest, ChatResponse
from app.services.chatbot import (
    build_recommendation_response,
    calculate_risk_score,
    handle_initial_chat,
)

router = APIRouter()


@router.post("", response_model=ChatResponse)
async def chat_with_bot(request: ChatRequest, session: SessionDep):
    """
    Identify the user's health need and either ask triage questions or return a
    local PostgreSQL-based recommendation.
    """
    return handle_initial_chat(
        session=session,
        message=request.message,
        city=request.city,
    )


@router.post("/answer", response_model=ChatResponse)
async def answer_triage(request: ChatAnswerRequest, session: SessionDep):
    """
    Receive triage answers, calculate a risk score, and return a recommendation.
    """
    health_need = session.get(HealthNeed, request.health_need_id)
    if not health_need:
        raise HTTPException(status_code=404, detail="Health need not found")

    selected_option_ids = request.selected_option_ids or [
        answer.answer_option_id for answer in request.answers
    ]
    risk_score = calculate_risk_score(session, selected_option_ids)
    return build_recommendation_response(
        session=session,
        health_need=health_need,
        risk_score=risk_score,
        city=request.city,
    )
