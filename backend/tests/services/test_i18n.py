from app.services.i18n import translate_text


def test_translates_traumatology_recommendation_to_russian() -> None:
    message = "Te recomiendo consulta con traumatologia en policlínico."

    assert translate_text(message, "ru") == (
        "Рекомендую консультацию травматолога в поликлинике."
    )


def test_generic_recommendation_translation_does_not_leave_spanish_terms() -> None:
    message = "Te recomiendo consulta con traumatologia en policlinico."

    translated = translate_text(message, "ru")

    assert translated == "Рекомендую консультацию травматолога в поликлинике."
    assert "Te recomiendo" not in translated
    assert "traumatologia" not in translated
    assert "policlinico" not in translated


def test_translates_previously_partially_translated_recommendation() -> None:
    message = "Te recomiendo consulta c traumatologia в policlinico."

    assert translate_text(message, "ru") == (
        "Рекомендую консультацию травматолога в поликлинике."
    )
