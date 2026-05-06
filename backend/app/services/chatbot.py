import unicodedata

from sqlmodel import Session, select

from app.models import (
    HealthNeed,
    MedicalCenter,
    MedicalCenterService,
    MedicalCenterSpecialty,
    MedicalInstitutionType,
    MedicalService,
    MedicalSpecialty,
    NeedServiceRule,
    RecommendationRule,
    TriageAnswerOption,
    TriageQuestion,
)
from app.schemas.chat import (
    ChatRecommendationResponse,
    ChatTriageResponse,
    ChatUnknownNeedResponse,
)
from app.schemas.medical_catalog import (
    MedicalInstitutionTypePublic,
    MedicalServicePublic,
    MedicalSpecialtyPublic,
    TriageAnswerOptionPublic,
    TriageQuestionPublic,
)
from app.schemas.medical_center import MedicalCenterPublic


def normalize_text(value: str) -> str:
    normalized = unicodedata.normalize("NFKD", value.casefold())
    return "".join(char for char in normalized if not unicodedata.combining(char))


def identify_health_need(session: Session, message: str) -> HealthNeed | None:
    normalized_message = normalize_text(message)
    health_needs = session.exec(select(HealthNeed)).all()

    best_match: tuple[int, HealthNeed] | None = None
    for need in health_needs:
        score = 0
        for keyword in need.keywords or []:
            if normalize_text(keyword) in normalized_message:
                score += len(keyword)
        if score and (best_match is None or score > best_match[0]):
            best_match = (score, need)

    return best_match[1] if best_match else None


def get_triage_questions(session: Session, health_need_id: int) -> list[TriageQuestion]:
    statement = (
        select(TriageQuestion)
        .where(TriageQuestion.health_need_id == health_need_id)
        .order_by(TriageQuestion.priority)
    )
    return list(session.exec(statement).all())


def build_triage_response(
    session: Session,
    health_need: HealthNeed,
) -> ChatTriageResponse:
    questions = []
    for question in get_triage_questions(session, health_need.id):
        options = session.exec(
            select(TriageAnswerOption)
            .where(TriageAnswerOption.question_id == question.id)
            .order_by(TriageAnswerOption.id)
        ).all()
        questions.append(
            TriageQuestionPublic(
                id=question.id,
                question_text=question.question_text,
                answer_type=question.answer_type,
                priority=question.priority,
                is_required=question.is_required,
                answer_options=[
                    TriageAnswerOptionPublic(
                        id=option.id,
                        option_text=option.option_text,
                        risk_score=option.risk_score,
                        next_question_id=option.next_question_id,
                    )
                    for option in options
                ],
            )
        )

    return ChatTriageResponse(
        message="Necesito hacer unas preguntas basicas para recomendar el tipo de institucion adecuado.",
        health_need_id=health_need.id,
        health_need_name=health_need.name,
        questions=questions,
    )


def calculate_risk_score(session: Session, selected_option_ids: list[int]) -> int:
    if not selected_option_ids:
        return 0
    options = session.exec(
        select(TriageAnswerOption).where(TriageAnswerOption.id.in_(selected_option_ids))
    ).all()
    return sum(option.risk_score for option in options)


def select_recommendation_rule(
    session: Session,
    health_need_id: int,
    risk_score: int,
) -> RecommendationRule | None:
    statement = (
        select(RecommendationRule)
        .where(RecommendationRule.health_need_id == health_need_id)
        .where(RecommendationRule.min_risk_score <= risk_score)
        .where(RecommendationRule.max_risk_score >= risk_score)
        .order_by(RecommendationRule.priority)
    )
    return session.exec(statement).first()


def select_default_need_rule(
    session: Session,
    health_need_id: int,
) -> NeedServiceRule | None:
    statement = (
        select(NeedServiceRule)
        .where(NeedServiceRule.health_need_id == health_need_id)
        .order_by(NeedServiceRule.priority)
    )
    return session.exec(statement).first()


def find_matching_centers(
    session: Session,
    institution_type_id: int | None,
    service_id: int | None,
    specialty_id: int | None,
    city: str | None,
) -> list[MedicalCenter]:
    statement = select(MedicalCenter)
    if institution_type_id is not None:
        statement = statement.where(MedicalCenter.institution_type_id == institution_type_id)
    if city:
        statement = statement.where(MedicalCenter.city == city)

    centers = list(session.exec(statement).all())

    if service_id is not None:
        center_ids = set(
            session.exec(
                select(MedicalCenterService.medical_center_id)
                .where(MedicalCenterService.medical_service_id == service_id)
                .where(MedicalCenterService.available == True)  # noqa: E712
            ).all()
        )
        centers = [center for center in centers if center.id in center_ids]

    if specialty_id is not None:
        center_ids = set(
            session.exec(
                select(MedicalCenterSpecialty.medical_center_id)
                .where(MedicalCenterSpecialty.medical_specialty_id == specialty_id)
                .where(MedicalCenterSpecialty.available == True)  # noqa: E712
            ).all()
        )
        centers = [center for center in centers if center.id in center_ids]

    centers.sort(key=lambda center: center.rating or 0, reverse=True)
    return centers[:10]


def build_recommendation_response(
    session: Session,
    health_need: HealthNeed,
    risk_score: int,
    city: str | None = None,
) -> ChatRecommendationResponse:
    recommendation_rule = select_recommendation_rule(session, health_need.id, risk_score)
    default_rule = select_default_need_rule(session, health_need.id)

    institution_type_id = (
        recommendation_rule.recommended_institution_type_id
        if recommendation_rule and recommendation_rule.recommended_institution_type_id
        else default_rule.recommended_institution_type_id
        if default_rule
        else None
    )
    service_id = (
        recommendation_rule.recommended_service_id
        if recommendation_rule and recommendation_rule.recommended_service_id
        else default_rule.recommended_service_id
        if default_rule
        else None
    )
    specialty_id = (
        recommendation_rule.recommended_specialty_id
        if recommendation_rule and recommendation_rule.recommended_specialty_id
        else default_rule.recommended_specialty_id
        if default_rule
        else None
    )

    institution_type = (
        session.get(MedicalInstitutionType, institution_type_id)
        if institution_type_id
        else None
    )
    service = session.get(MedicalService, service_id) if service_id else None
    specialty = session.get(MedicalSpecialty, specialty_id) if specialty_id else None
    centers = find_matching_centers(
        session=session,
        institution_type_id=institution_type_id,
        service_id=service_id,
        specialty_id=specialty_id,
        city=city,
    )

    message = (
        recommendation_rule.message
        if recommendation_rule
        else "Puedo recomendarte una institucion medica segun tu necesidad."
    )

    return ChatRecommendationResponse(
        message=message,
        health_need_id=health_need.id,
        risk_score=risk_score,
        recommended_institution_type=MedicalInstitutionTypePublic.model_validate(
            institution_type
        )
        if institution_type
        else None,
        recommended_service=MedicalServicePublic.model_validate(service)
        if service
        else None,
        recommended_specialty=MedicalSpecialtyPublic.model_validate(specialty)
        if specialty
        else None,
        explanation=default_rule.explanation if default_rule else None,
        centers=[MedicalCenterPublic.model_validate(center) for center in centers],
    )


def handle_initial_chat(
    session: Session,
    message: str,
    city: str | None = None,
) -> ChatTriageResponse | ChatRecommendationResponse | ChatUnknownNeedResponse:
    health_need = identify_health_need(session, message)
    if not health_need:
        supported_needs = [
            need.name for need in session.exec(select(HealthNeed).order_by(HealthNeed.name))
        ]
        return ChatUnknownNeedResponse(
            message="No pude identificar la necesidad medica. Describe el problema con mas detalle.",
            supported_needs=supported_needs,
        )

    questions = get_triage_questions(session, health_need.id)
    if questions:
        return build_triage_response(session, health_need)

    return build_recommendation_response(session, health_need, risk_score=0, city=city)
