import logging
from typing import Any

import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

RasaResult = dict[str, Any]


def build_rasa_error(error: str, details: str, url: str) -> RasaResult:
    return {
        "error": error,
        "details": details,
        "url": url,
    }


def is_rasa_error(rasa_result: RasaResult | None) -> bool:
    return bool(rasa_result and isinstance(rasa_result.get("error"), str))


async def parse_message_with_rasa(message: str) -> RasaResult:
    url = f"{settings.RASA_URL}/model/parse"
    if not message.strip():
        return build_rasa_error("RASA_EMPTY_MESSAGE", "Message is empty", url)

    logger.info("Calling Rasa URL: %s/model/parse", settings.RASA_URL)
    logger.info("Rasa request text: %s", message)
    try:
        async with httpx.AsyncClient(timeout=30.0, trust_env=False) as client:
            response = await client.post(url, json={"text": message})
    except httpx.TimeoutException as exc:
        logger.warning("Rasa request timed out: %s", exc)
        return build_rasa_error(
            "RASA_CONNECTION_ERROR",
            str(exc) or repr(exc),
            url,
        )
    except httpx.RequestError as exc:
        logger.warning("Rasa request failed: %s", exc)
        return build_rasa_error(
            "RASA_CONNECTION_ERROR",
            str(exc) or repr(exc),
            url,
        )

    logger.info("Rasa response status: %s", response.status_code)
    logger.info("Rasa response body: %s", response.text)
    if response.status_code != 200:
        return build_rasa_error(
            "RASA_HTTP_ERROR",
            f"status={response.status_code} body={response.text}",
            url,
        )

    try:
        data = response.json()
    except ValueError:
        logger.warning("Rasa returned invalid JSON: %s", response.text)
        return build_rasa_error("RASA_INVALID_RESPONSE", response.text, url)

    if not isinstance(data, dict):
        logger.warning("Rasa returned a non-object response: %s", data)
        return build_rasa_error("RASA_INVALID_RESPONSE", repr(data), url)

    logger.info("Rasa response: %s", data)
    return data
