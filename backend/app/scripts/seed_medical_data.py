import json
import logging
from pathlib import Path
from typing import Any

from sqlmodel import Session, select

from app.core.db import engine
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

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

SEED_FILE = Path(__file__).resolve().parents[1] / "seed_data" / "medical_seed.json"


def get_by_name(session: Session, model: type[Any], name: str):
    return session.exec(select(model).where(model.name == name)).first()


def create_if_missing(session: Session, model: type[Any], data: dict[str, Any]):
    existing = get_by_name(session, model, data["name"])
    if existing:
        return existing
    obj = model(**data)
    session.add(obj)
    session.commit()
    session.refresh(obj)
    logger.info("Created %s: %s", model.__name__, data["name"])
    return obj


def seed_catalog(session: Session, data: dict[str, Any]) -> None:
    for item in data["institution_types"]:
        create_if_missing(session, MedicalInstitutionType, item)
    for item in data["services"]:
        create_if_missing(session, MedicalService, item)
    for item in data["specialties"]:
        create_if_missing(session, MedicalSpecialty, item)
    for item in data["health_needs"]:
        create_if_missing(session, HealthNeed, item)


def seed_need_rules(session: Session, data: dict[str, Any]) -> None:
    for item in data["need_service_rules"]:
        health_need = get_by_name(session, HealthNeed, item["health_need"])
        service = get_by_name(session, MedicalService, item["recommended_service"])
        specialty = get_by_name(session, MedicalSpecialty, item["recommended_specialty"])
        institution_type = get_by_name(
            session,
            MedicalInstitutionType,
            item["recommended_institution_type"],
        )
        existing = session.exec(
            select(NeedServiceRule)
            .where(NeedServiceRule.health_need_id == health_need.id)
            .where(NeedServiceRule.recommended_service_id == service.id)
            .where(NeedServiceRule.recommended_specialty_id == specialty.id)
            .where(
                NeedServiceRule.recommended_institution_type_id
                == institution_type.id
            )
        ).first()
        if existing:
            continue
        session.add(
            NeedServiceRule(
                health_need_id=health_need.id,
                recommended_service_id=service.id,
                recommended_specialty_id=specialty.id,
                recommended_institution_type_id=institution_type.id,
                priority=item["priority"],
                urgency_required=item.get("urgency_required"),
                explanation=item.get("explanation"),
            )
        )
    session.commit()


def seed_triage(session: Session, data: dict[str, Any]) -> None:
    for item in data["triage_questions"]:
        health_need = get_by_name(session, HealthNeed, item["health_need"])
        question = session.exec(
            select(TriageQuestion)
            .where(TriageQuestion.health_need_id == health_need.id)
            .where(TriageQuestion.question_text == item["question_text"])
        ).first()
        if not question:
            question = TriageQuestion(
                health_need_id=health_need.id,
                question_text=item["question_text"],
                answer_type=item["answer_type"],
                priority=item["priority"],
                is_required=item["is_required"],
            )
            session.add(question)
            session.commit()
            session.refresh(question)
            logger.info("Created triage question: %s", item["question_text"])

        for option_data in item["options"]:
            existing_option = session.exec(
                select(TriageAnswerOption)
                .where(TriageAnswerOption.question_id == question.id)
                .where(TriageAnswerOption.option_text == option_data["option_text"])
            ).first()
            if existing_option:
                continue
            session.add(
                TriageAnswerOption(
                    question_id=question.id,
                    option_text=option_data["option_text"],
                    risk_score=option_data["risk_score"],
                    next_question_id=option_data.get("next_question_id"),
                )
            )
    session.commit()


def seed_recommendation_rules(session: Session, data: dict[str, Any]) -> None:
    for item in data["recommendation_rules"]:
        health_need = get_by_name(session, HealthNeed, item["health_need"])
        service = get_by_name(session, MedicalService, item["recommended_service"])
        specialty = get_by_name(session, MedicalSpecialty, item["recommended_specialty"])
        institution_type = get_by_name(
            session,
            MedicalInstitutionType,
            item["recommended_institution_type"],
        )
        existing = session.exec(
            select(RecommendationRule)
            .where(RecommendationRule.health_need_id == health_need.id)
            .where(RecommendationRule.min_risk_score == item["min_risk_score"])
            .where(RecommendationRule.max_risk_score == item["max_risk_score"])
            .where(
                RecommendationRule.recommended_institution_type_id
                == institution_type.id
            )
        ).first()
        if existing:
            continue
        session.add(
            RecommendationRule(
                health_need_id=health_need.id,
                min_risk_score=item["min_risk_score"],
                max_risk_score=item["max_risk_score"],
                recommended_institution_type_id=institution_type.id,
                recommended_service_id=service.id,
                recommended_specialty_id=specialty.id,
                message=item["message"],
                priority=item["priority"],
            )
        )
    session.commit()


def seed_centers(session: Session, data: dict[str, Any]) -> None:
    for item in data["medical_centers"]:
        institution_type = get_by_name(
            session,
            MedicalInstitutionType,
            item["institution_type"],
        )
        center = get_by_name(session, MedicalCenter, item["name"])
        center_data = {
            key: value
            for key, value in item.items()
            if key not in {"institution_type", "services", "specialties"}
        }
        center_data["institution_type_id"] = institution_type.id
        if not center:
            center = MedicalCenter(**center_data)
            session.add(center)
            session.commit()
            session.refresh(center)
            logger.info("Created medical center: %s", item["name"])

        for service_name in item["services"]:
            service = get_by_name(session, MedicalService, service_name)
            existing = session.exec(
                select(MedicalCenterService)
                .where(MedicalCenterService.medical_center_id == center.id)
                .where(MedicalCenterService.medical_service_id == service.id)
            ).first()
            if not existing:
                session.add(
                    MedicalCenterService(
                        medical_center_id=center.id,
                        medical_service_id=service.id,
                        available=True,
                        appointment_required=service.requires_appointment,
                    )
                )

        for specialty_name in item["specialties"]:
            specialty = get_by_name(session, MedicalSpecialty, specialty_name)
            existing = session.exec(
                select(MedicalCenterSpecialty)
                .where(MedicalCenterSpecialty.medical_center_id == center.id)
                .where(MedicalCenterSpecialty.medical_specialty_id == specialty.id)
            ).first()
            if not existing:
                session.add(
                    MedicalCenterSpecialty(
                        medical_center_id=center.id,
                        medical_specialty_id=specialty.id,
                        available=True,
                    )
                )
    session.commit()


def seed() -> None:
    data = json.loads(SEED_FILE.read_text(encoding="utf-8"))
    with Session(engine) as session:
        seed_catalog(session, data)
        seed_need_rules(session, data)
        seed_triage(session, data)
        seed_recommendation_rules(session, data)
        seed_centers(session, data)


if __name__ == "__main__":
    logger.info("Seeding medical recommendation data")
    seed()
    logger.info("Medical recommendation seed completed")
