import re
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
from app.schemas.chat import ChatResponse
from app.schemas.medical_catalog import (
    TriageAnswerOptionPublic,
    TriageQuestionPublic,
)
from app.schemas.medical_center import MedicalCenterPublic

PREFERRED_HEALTH_NEEDS = {
    "Knee pain",
    "Joint pain",
    "General fever",
    "Weakness",
    "General malaise",
    "Body pain",
    "Headache",
    "Headache with fever",
    "Wound or trauma",
    "Tetanus vaccination",
    "Child vaccination",
    "Vision problems",
    "Abdominal pain",
    "Back pain",
    "Dermatological problem",
    "Ear pain",
    "Blood pressure control",
    "Diabetes control",
    "Pediatric consultation",
    "Gynecological consultation",
    "Cardiology consultation",
    "Ophthalmology consultation",
    "Pharmacy need",
    "Prolonged menstrual bleeding",
    "Irregular menstruation",
    "Severe menstrual pain",
    "Abnormal vaginal bleeding",
    "Pelvic pain",
    "Possible pregnancy",
    "Pregnancy control",
}


def normalize_text(value: str) -> str:
    lowered = value.casefold()
    normalized = unicodedata.normalize("NFKD", lowered)
    without_accents = "".join(
        char for char in normalized if not unicodedata.combining(char)
    )
    without_punctuation = re.sub(r"[^\w\s]", " ", without_accents, flags=re.UNICODE)
    return re.sub(r"\s+", " ", without_punctuation).strip()


def normalize_city(value: str | None) -> str:
    if not value:
        return "Курск"
    normalized = normalize_text(value)
    if normalized in {"kursk", "курск"}:
        return "Курск"
    return value


def has_any(normalized_message: str, terms: set[str]) -> bool:
    return any(normalize_text(term) in normalized_message for term in terms)


def score_health_needs(
    session: Session,
    message: str,
) -> list[tuple[int, HealthNeed]]:
    normalized_message = normalize_text(message)
    health_needs = session.exec(select(HealthNeed)).all()

    scored: list[tuple[int, HealthNeed]] = []
    for need in health_needs:
        score = 0
        matches = 0
        for keyword in need.keywords or []:
            normalized_keyword = normalize_text(keyword)
            if normalized_keyword and normalized_keyword in normalized_message:
                matches += 1
                score += 10 + len(normalized_keyword.split()) * 4
        if score:
            scored.append((score + matches * 3, need))

    scored.sort(
        key=lambda item: (item[0], item[1].name in PREFERRED_HEALTH_NEEDS),
        reverse=True,
    )
    return scored


def get_need_by_name(session: Session, name: str) -> HealthNeed | None:
    return session.exec(select(HealthNeed).where(HealthNeed.name == name)).first()


def identify_combined_health_need(
    session: Session,
    message: str,
) -> tuple[HealthNeed, str] | None:
    normalized_message = normalize_text(message)
    has_fever = has_any(
        normalized_message,
        {"fiebre", "temperatura", "calentura", "febril", "температура", "жар", "лихорадка"},
    )
    has_weakness = has_any(
        normalized_message,
        {"debilidad", "debil", "débil", "cansancio", "sin fuerzas", "слабость", "усталость", "нет сил"},
    )
    has_knee = has_any(
        normalized_message,
        {"rodilla", "dolor en la rodilla", "колено", "боль в колене", "болит колено"},
    )
    has_joint = has_any(
        normalized_message,
        {"articulacion", "articulación", "сустав", "боль в суставе"},
    )
    has_headache = has_any(
        normalized_message,
        {"cabeza", "dolor de cabeza", "cefalea", "голова", "головная боль"},
    )
    has_body_pain = has_any(
        normalized_message,
        {"me duele el cuerpo", "dolor muscular", "dolor corporal", "cuerpo cortado", "ломота", "болит тело", "мышцы"},
    )
    has_throat = has_any(
        normalized_message,
        {"garganta", "dolor de garganta", "горло", "болит горло"},
    )
    has_inflammation = has_any(
        normalized_message,
        {"inflamacion", "inflamación", "hinchada", "hinchado", "опух", "воспаление"},
    )

    candidates: list[tuple[str, str]] = []
    if has_fever and has_knee:
        candidates.append(
            (
                "Knee pain",
                "Parece que tienes fiebre acompañada de dolor de rodilla. Para orientarte mejor necesito hacer unas preguntas.",
            )
        )
    if has_fever and has_joint:
        candidates.append(
            (
                "Joint pain",
                "Parece que tienes fiebre acompañada de dolor articular. Para orientarte mejor necesito hacer unas preguntas.",
            )
        )
    if has_fever and has_inflammation:
        candidates.append(
            (
                "Joint pain",
                "Parece que hay fiebre con inflamacion articular. Para orientarte mejor necesito hacer unas preguntas.",
            )
        )
    if has_fever and has_weakness:
        candidates.append(
            (
                "Weakness",
                "Parece que tienes fiebre con debilidad. Para orientarte mejor necesito hacer unas preguntas.",
            )
        )
    if has_fever and has_headache:
        candidates.append(
            (
                "Headache with fever",
                "Parece que tienes dolor de cabeza acompañado de fiebre. Para orientarte mejor necesito hacer unas preguntas.",
            )
        )
    if has_fever and has_body_pain:
        candidates.append(
            (
                "Body pain",
                "Parece que tienes dolor corporal acompañado de fiebre. Para orientarte mejor necesito hacer unas preguntas.",
            )
        )
    if has_fever and has_throat:
        candidates.append(
            (
                "Dolor de garganta",
                "Parece que tienes fiebre y dolor de garganta. Para orientarte mejor necesito hacer unas preguntas.",
            )
        )
    if has_body_pain and has_headache:
        candidates.append(
            (
                "Headache",
                "Parece que tienes dolor corporal y predominio de dolor de cabeza. Para orientarte mejor necesito hacer unas preguntas.",
            )
        )

    for need_name, message_text in candidates:
        need = get_need_by_name(session, need_name)
        if need:
            return need, message_text

    return None

def identify_health_need(session: Session, message: str) -> HealthNeed | None:
    combined = identify_combined_health_need(session, message)
    if combined:
        return combined[0]

    scored = score_health_needs(session, message)
    return scored[0][1] if scored else None


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
    message: str | None = None,
) -> ChatResponse:
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

    return ChatResponse(
        message=message
        or "Necesito hacer unas preguntas basicas para recomendarte el tipo de institucion adecuado.",
        health_need_id=health_need.id,
        health_need_name=health_need.name,
        questions=questions,
        recommendations=[],
    )


def calculate_risk_score(session: Session, selected_option_ids: list[int]) -> int:
    if not selected_option_ids:
        return 0
    options = session.exec(
        select(TriageAnswerOption).where(TriageAnswerOption.id.in_(selected_option_ids))
    ).all()
    return sum(option.risk_score for option in options)


def get_risk_level(risk_score: int) -> str:
    if risk_score >= 10:
        return "high"
    if risk_score >= 5:
        return "medium"
    return "low"


def risk_level_label(risk_level: str) -> str:
    return {
        "low": "bajo",
        "medium": "medio",
        "high": "alto",
    }.get(risk_level, "bajo")


def resolve_risk_level(
    risk_score: int,
    service: MedicalService | None,
    institution_type: MedicalInstitutionType | None,
) -> str:
    if (service and service.is_emergency_service) or (
        institution_type and institution_type.is_emergency_capable
    ):
        return "high"
    return get_risk_level(risk_score)


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
    city = normalize_city(city)
    statement = select(MedicalCenter)
    if institution_type_id is not None:
        statement = statement.where(MedicalCenter.institution_type_id == institution_type_id)
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


def build_human_explanation(
    risk_level: str,
    service: MedicalService | None,
    specialty: MedicalSpecialty | None,
    institution_type: MedicalInstitutionType | None,
    default_explanation: str | None,
) -> str:
    service_text = service.name if service else "el servicio medico adecuado"
    specialty_text = specialty.name if specialty else "la especialidad correspondiente"
    institution_text = (
        institution_type.name if institution_type else "una institucion medica adecuada"
    )
    warning = (
        " Si los sintomas aumentan, aparece fiebre, dolor intenso, dificultad para respirar, "
        "sangrado abundante o empeoramiento rapido, acude a urgencias."
    )
    base = (
        f"Segun tus respuestas, el caso parece de riesgo {risk_level_label(risk_level)}. "
        f"Se recomienda {service_text} con {specialty_text} en {institution_text}."
    )
    if default_explanation:
        base = f"{base} {default_explanation}"
    return f"{base}{warning}"


def build_center_reason(
    center: MedicalCenter,
    service: MedicalService | None,
    specialty: MedicalSpecialty | None,
    institution_type: MedicalInstitutionType | None,
) -> str:
    parts = [f"{center.name} coincide con el tipo de atencion recomendado"]
    if institution_type:
        parts.append(f"tipo {institution_type.name}")
    if service:
        parts.append(f"servicio {service.name}")
    if specialty:
        parts.append(f"especialidad {specialty.name}")
    if center.has_emergency:
        parts.append("cuenta con urgencias")
    return ", ".join(parts) + "."


def serialize_medical_center(
    session: Session,
    center: MedicalCenter,
    service: MedicalService | None,
    specialty: MedicalSpecialty | None,
    institution_type: MedicalInstitutionType | None,
) -> MedicalCenterPublic:
    services = session.exec(
        select(MedicalService.name)
        .join(MedicalCenterService)
        .where(MedicalCenterService.medical_center_id == center.id)
        .where(MedicalCenterService.available == True)  # noqa: E712
        .order_by(MedicalService.name)
    ).all()
    specialties = session.exec(
        select(MedicalSpecialty.name)
        .join(MedicalCenterSpecialty)
        .where(MedicalCenterSpecialty.medical_center_id == center.id)
        .where(MedicalCenterSpecialty.available == True)  # noqa: E712
        .order_by(MedicalSpecialty.name)
    ).all()
    public_center = MedicalCenterPublic.model_validate(center)
    public_center.institution_type_name = (
        institution_type.name
        if institution_type and center.institution_type_id == institution_type.id
        else center.institution_type.name
        if center.institution_type
        else None
    )
    public_center.main_services = list(services)
    public_center.main_specialties = list(specialties)
    public_center.recommendation_reason = build_center_reason(
        center,
        service,
        specialty,
        institution_type,
    )
    return public_center


def build_recommendation_response(
    session: Session,
    health_need: HealthNeed,
    risk_score: int,
    city: str | None = None,
) -> ChatResponse:
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

    risk_level = resolve_risk_level(risk_score, service, institution_type)
    explanation = build_human_explanation(
        risk_level=risk_level,
        service=service,
        specialty=specialty,
        institution_type=institution_type,
        default_explanation=default_rule.explanation if default_rule else None,
    )
    message = (
        recommendation_rule.message
        if recommendation_rule
        else "Puedo recomendarte una institucion medica segun tu necesidad."
    )

    return ChatResponse(
        message=message,
        health_need_id=health_need.id,
        health_need_name=health_need.name,
        risk_score=risk_score,
        risk_level=risk_level,
        recommended_institution_type=institution_type.name if institution_type else None,
        recommended_service=service.name if service else None,
        recommended_specialty=specialty.name if specialty else None,
        explanation=explanation,
        questions=[],
        recommendations=[
            serialize_medical_center(
                session=session,
                center=center,
                service=service,
                specialty=specialty,
                institution_type=institution_type,
            )
            for center in centers
        ],
    )


def handle_initial_chat(
    session: Session,
    message: str,
    city: str | None = None,
) -> ChatResponse:
    combined = identify_combined_health_need(session, message)
    health_need = combined[0] if combined else identify_health_need(session, message)
    if not health_need:
        supported_needs = [
            need.name for need in session.exec(select(HealthNeed).order_by(HealthNeed.name))
        ]
        return ChatResponse(
            message="No pude identificar la necesidad con suficiente seguridad. Puedes describir el sintoma principal, duracion, intensidad y si estas en Kursk.",
            questions=[],
            recommendations=[],
            supported_needs=supported_needs,
        )

    questions = get_triage_questions(session, health_need.id)
    if any(question.is_required for question in questions):
        message_text = combined[1] if combined else None
        if health_need.name == "Prolonged menstrual bleeding":
            message_text = (
                "Parece que describes un sangrado menstrual prolongado. "
                "Para orientarte mejor necesito hacer unas preguntas."
            )
        return build_triage_response(
            session,
            health_need,
            message=message_text,
        )

    return build_recommendation_response(session, health_need, risk_score=0, city=city)
