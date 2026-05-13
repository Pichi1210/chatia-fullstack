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

    try:
        data = response.json()
    except ValueError:
        return None

    if not isinstance(data, dict):
        return None

    return data
