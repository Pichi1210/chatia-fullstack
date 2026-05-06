
import httpx
import logging
from typing import Any

from app.core.config import settings

logger = logging.getLogger(__name__)

YandexSearchResult = list[dict[str, Any]] | dict[str, Any]


async def search_medical_centers(query: str, city: str) -> YandexSearchResult:
    logger.info("YANDEX_API_KEY configured: %s", bool(settings.YANDEX_API_KEY))
    if not settings.YANDEX_API_KEY:
        logger.warning("YANDEX_API_KEY is not configured; skipping Yandex Maps search.")
        return {
            "error": "YANDEX_API_KEY_NOT_CONFIGURED",
            "details": "YANDEX_API_KEY is not available in backend settings.",
        }

    search_text = f"{query} {city}".strip()
    logger.info("Calling Yandex Organization Search API with text=%s", search_text)
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(
                "https://search-maps.yandex.ru/v1/",
                params={
                    "apikey": settings.YANDEX_API_KEY,
                    "text": search_text,
                    "type": "biz",
                    "lang": "ru_RU",
                    "results": 10,
                },
            )
            logger.info("Yandex status code: %s", response.status_code)

            if response.status_code >= 400:
                logger.error("Yandex API error response: %s", response.text)
                return {
                    "error": "YANDEX_API_ERROR",
                    "status_code": response.status_code,
                    "details": response.text,
                }

            data = response.json()
            logger.info(
                "Yandex returned raw response keys: %s",
                list(data.keys()) if isinstance(data, dict) else type(data),
            )
            
            # Normalize Yandex API response to our model
            features = data.get("features", []) if isinstance(data, dict) else []
            logger.info("Yandex returned features count: %s", len(features))

            normalized_data = []
            for feature in features:
                org_meta = feature.get("properties", {}).get("CompanyMetaData", {})
                point = feature.get("geometry", {}).get("coordinates", [None, None])
                
                normalized_item = {
                    "name": org_meta.get("name"),
                    "address": org_meta.get("address"),
                    "city": city, # Assuming city is constant for the search
                    "category": ", ".join([cat.get("name") for cat in org_meta.get("Categories", [])]),
                    "specialty": query,
                    "latitude": point[1],
                    "longitude": point[0],
                    "rating": org_meta.get("rating", {}).get("score"),
                    "phone": ", ".join([phone.get("formatted") for phone in org_meta.get("Phones", [])]),
                    "working_hours": org_meta.get("Hours", {}).get("text"),
                    "yandex_uri": org_meta.get("url"),
                    "raw_data": feature
                }
                normalized_data.append(normalized_item)

            return normalized_data

        except httpx.RequestError as e:
            logger.error("Yandex request error: %s", e)
            return {
                "error": "YANDEX_REQUEST_ERROR",
                "details": str(e),
            }
        except ValueError as e:
            logger.error("Yandex returned invalid JSON: %s", response.text)
            return {
                "error": "YANDEX_INVALID_JSON",
                "details": str(e),
                "response": response.text,
            }
