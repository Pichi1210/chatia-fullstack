from fastapi import APIRouter, HTTPException
from sqlmodel import select

from app.api.deps import SessionDep
from app.models import HealthNeed, TriageAnswerOption, TriageQuestion
from app.schemas.chat import ChatAnswerRequest, ChatRequest, ChatResponse
from app.services.chatbot import (
    build_recommendation_response,
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
    Receive all required triage answers, calculate the total risk score, and
    return one final recommendation.
    """
    health_need = session.get(HealthNeed, request.health_need_id)
    if not health_need:
        raise HTTPException(status_code=404, detail="Health need not found")

    if not request.answers:
        raise HTTPException(status_code=400, detail="At least one answer is required")

    required_question_ids = set(
        session.exec(
            select(TriageQuestion.id)
            .where(TriageQuestion.health_need_id == health_need.id)
            .where(TriageQuestion.is_required == True)  # noqa: E712
        ).all()
    )
    answered_by_question = {answer.question_id: answer for answer in request.answers}
    if len(answered_by_question) != len(request.answers):
        raise HTTPException(status_code=400, detail="Duplicate triage question answer")

    missing_question_ids = required_question_ids - set(answered_by_question)
    if missing_question_ids:
        raise HTTPException(
            status_code=400,
            detail={
                "message": "All required triage questions must be answered",
                "missing_question_ids": sorted(missing_question_ids),
            },
        )

    total_risk_score = 0
    for answer in request.answers:
        option = session.get(TriageAnswerOption, answer.answer_option_id)
        if not option or option.question_id != answer.question_id:
            raise HTTPException(status_code=400, detail="Invalid answer option")

        question = session.get(TriageQuestion, answer.question_id)
        if not question or question.health_need_id != health_need.id:
            raise HTTPException(status_code=400, detail="Invalid triage question")

        risk_score = (
            answer.risk_score if answer.risk_score is not None else option.risk_score
        )
        if risk_score != option.risk_score:
            raise HTTPException(status_code=400, detail="Invalid risk score")

        total_risk_score += risk_score

    return build_recommendation_response(
        session=session,
        health_need=health_need,
        risk_score=total_risk_score,
        city=request.city,
    )
