import logging
from typing import Any

import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)

RasaResult = dict[str, Any]


def build_rasa_error(error: str, details: str) -> RasaResult:
    return {
        "error": error,
        "details": details,
    }


def is_rasa_error(rasa_result: RasaResult | None) -> bool:
    return bool(rasa_result and isinstance(rasa_result.get("error"), str))


def format_exception_details(url: str, exc: Exception) -> str:
    return f"url={url} error={str(exc) or repr(exc)}"


async def parse_message_with_rasa(message: str) -> RasaResult | None:
    if not message.strip():
        return None

    url = f"{settings.RASA_URL}/model/parse"
    logger.info("Calling Rasa at %s", settings.RASA_URL)
    try:
        async with httpx.AsyncClient(timeout=2.5) as client:
            response = await client.post(url, json={"text": message})
    except httpx.TimeoutException as exc:
        logger.warning("Rasa request timed out: %s", exc)
        return build_rasa_error("RASA_CONNECTION_ERROR", format_exception_details(url, exc))
    except httpx.RequestError as exc:
        logger.warning("Rasa request failed: %s", exc)
        return build_rasa_error("RASA_CONNECTION_ERROR", format_exception_details(url, exc))

    logger.info("Rasa status code: %s", response.status_code)
    if response.status_code != 200:
        return build_rasa_error(
            "RASA_HTTP_ERROR",
            f"status={response.status_code} body={response.text}",
        )

    try:
        data = response.json()
    except ValueError:
        logger.warning("Rasa returned invalid JSON: %s", response.text)
        return build_rasa_error("RASA_INVALID_RESPONSE", response.text)

    if not isinstance(data, dict):
        logger.warning("Rasa returned a non-object response: %s", data)
        return build_rasa_error("RASA_INVALID_RESPONSE", repr(data))

    logger.info("Rasa response: %s", data)
    return data
