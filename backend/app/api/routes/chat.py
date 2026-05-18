import uuid

from fastapi import APIRouter, HTTPException, Request
from sqlalchemy import func
from sqlmodel import col, select

from app.api.deps import CurrentUser, SessionDep
from app.models import (
    ChatMessage,
    ChatSession,
    HealthNeed,
    TriageAnswerOption,
    TriageQuestion,
    get_datetime_utc,
)
from app.schemas.chat import (
    ChatAnswerRequest,
    ChatMessagePublic,
    ChatNluDebugRequest,
    ChatRequest,
    ChatResponse,
    ChatSessionCreate,
    ChatSessionDetail,
    ChatSessionPublic,
    ChatSessionsPublic,
)
from app.services.chatbot import (
    build_nlu_debug_response,
    build_recommendation_response,
    handle_initial_chat,
)
from app.services.i18n import (
    get_locale,
    localize_chat_payload,
    localize_chat_response,
    translate_text,
)

router = APIRouter()


def get_owned_chat_session(
    *,
    session: SessionDep,
    chat_session_id: uuid.UUID,
    owner_id: uuid.UUID,
) -> ChatSession:
    chat_session = session.get(ChatSession, chat_session_id)
    if not chat_session or chat_session.owner_id != owner_id:
        raise HTTPException(status_code=404, detail="Chat session not found")
    return chat_session


def build_chat_title(message: str) -> str:
    normalized = " ".join(message.split())
    if not normalized:
        return "Nueva consulta"
    return normalized[:117] + "..." if len(normalized) > 120 else normalized


def create_chat_session(
    *,
    session: SessionDep,
    owner_id: uuid.UUID,
    title: str | None = None,
    city: str | None = None,
) -> ChatSession:
    chat_session = ChatSession(
        owner_id=owner_id,
        title=title or "Nueva consulta",
        city=city,
    )
    session.add(chat_session)
    return chat_session


def persist_chat_exchange(
    *,
    session: SessionDep,
    chat_session: ChatSession,
    user_text: str,
    response: ChatResponse,
) -> ChatResponse:
    now = get_datetime_utc()
    chat_session.updated_at = now
    if chat_session.title == "Nueva consulta" and user_text:
        chat_session.title = build_chat_title(user_text)

    response.chat_session_id = chat_session.id
    session.add(chat_session)
    session.add(
        ChatMessage(
            chat_session_id=chat_session.id,
            sender="user",
            text=user_text,
        )
    )
    session.add(
        ChatMessage(
            chat_session_id=chat_session.id,
            sender="bot",
            text=response.message,
            response_payload=response.model_dump(mode="json"),
        )
    )
    session.commit()
    return response


@router.post("/sessions", response_model=ChatSessionPublic)
async def create_session(
    request: ChatSessionCreate,
    session: SessionDep,
    current_user: CurrentUser,
):
    chat_session = create_chat_session(
        session=session,
        owner_id=current_user.id,
        title=request.title,
        city=request.city,
    )
    session.commit()
    session.refresh(chat_session)
    return chat_session


@router.get("/sessions", response_model=ChatSessionsPublic)
async def read_sessions(
    request: Request,
    session: SessionDep,
    current_user: CurrentUser,
    skip: int = 0,
    limit: int = 20,
):
    statement = (
        select(ChatSession)
        .where(ChatSession.owner_id == current_user.id)
        .order_by(col(ChatSession.updated_at).desc())
        .offset(skip)
        .limit(limit)
    )
    count = session.exec(
        select(func.count())
        .select_from(ChatSession)
        .where(ChatSession.owner_id == current_user.id)
    ).one()

    locale = get_locale(request.headers.get("accept-language"))
    chat_sessions = []
    for chat_session in session.exec(statement).all():
        public_session = ChatSessionPublic.model_validate(chat_session)
        if locale == "ru":
            public_session.title = public_session.title.replace(
                "Nueva consulta",
                "Новая консультация",
            )
        chat_sessions.append(public_session)

    return ChatSessionsPublic(data=chat_sessions, count=count)


@router.get("/sessions/{chat_session_id}", response_model=ChatSessionDetail)
async def read_session(
    request: Request,
    chat_session_id: uuid.UUID,
    session: SessionDep,
    current_user: CurrentUser,
):
    chat_session = get_owned_chat_session(
        session=session,
        chat_session_id=chat_session_id,
        owner_id=current_user.id,
    )
    messages = session.exec(
        select(ChatMessage)
        .where(ChatMessage.chat_session_id == chat_session.id)
        .order_by(col(ChatMessage.created_at))
    ).all()

    locale = get_locale(request.headers.get("accept-language"))
    localized_messages = []
    for message in messages:
        public_message = ChatMessagePublic.model_validate(message)
        if locale == "ru":
            if public_message.sender == "bot":
                public_message.text = (
                    translate_text(public_message.text, locale) or public_message.text
                )
            public_message.response_payload = localize_chat_payload(
                public_message.response_payload,
                locale,
            )
        localized_messages.append(public_message)

    return ChatSessionDetail(
        id=chat_session.id,
        title=chat_session.title.replace("Nueva consulta", "Новая консультация")
        if locale == "ru"
        else chat_session.title,
        city=chat_session.city,
        created_at=chat_session.created_at,
        updated_at=chat_session.updated_at,
        messages=localized_messages,
    )


@router.post("", response_model=ChatResponse)
async def chat_with_bot(
    request: Request,
    chat_request: ChatRequest,
    session: SessionDep,
):
    """
    Identify the user's health need and either ask triage questions or return a
    local PostgreSQL-based recommendation.
    """
    response = await handle_initial_chat(
        session=session,
        message=chat_request.message,
        city=chat_request.city,
    )
    return localize_chat_response(
        response,
        get_locale(request.headers.get("accept-language")),
    )


@router.post("/nlu-debug")
async def nlu_debug(
    request: ChatNluDebugRequest,
    session: SessionDep,
):
    return await build_nlu_debug_response(session=session, message=request.message)


@router.post("/answer", response_model=ChatResponse)
async def answer_triage(
    request: Request,
    chat_request: ChatAnswerRequest,
    session: SessionDep,
):
    """
    Receive all required triage answers, calculate the total risk score, and
    return one final recommendation.
    """
    health_need = session.get(HealthNeed, chat_request.health_need_id)
    if not health_need:
        raise HTTPException(status_code=404, detail="Health need not found")

    if not chat_request.answers:
        raise HTTPException(status_code=400, detail="At least one answer is required")

    required_question_ids = set(
        session.exec(
            select(TriageQuestion.id)
            .where(TriageQuestion.health_need_id == health_need.id)
            .where(TriageQuestion.is_required == True)  # noqa: E712
        ).all()
    )
    answered_by_question = {
        answer.question_id: answer for answer in chat_request.answers
    }
    if len(answered_by_question) != len(chat_request.answers):
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
    for answer in chat_request.answers:
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

    response = build_recommendation_response(
        session=session,
        health_need=health_need,
        risk_score=total_risk_score,
        city=chat_request.city,
    )
    return localize_chat_response(
        response,
        get_locale(request.headers.get("accept-language")),
    )
