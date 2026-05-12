from typing import Any

import httpx

from app.core.config import settings

RasaResult = dict[str, Any]


async def parse_message_with_rasa(message: str) -> RasaResult | None:
    if not message.strip():
        return None

    url = f"{settings.RASA_URL.rstrip('/')}/model/parse"
    try:
        async with httpx.AsyncClient(timeout=2.5) as client:
            response = await client.post(url, json={"text": message})
    except (httpx.TimeoutException, httpx.RequestError):
        return None

    if response.status_code != 200:
        return None

    data = response.json()
    intent = data.get("intent") if isinstance(data, dict) else None
    confidence = intent.get("confidence", 0) if isinstance(intent, dict) else 0

    if not isinstance(confidence, int | float):
        return None

    if confidence < settings.RASA_CONFIDENCE_THRESHOLD:
        return None

    return data
