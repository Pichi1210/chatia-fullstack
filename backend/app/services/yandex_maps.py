
import httpx
import logging
from app.core.config import settings

logger = logging.getLogger(__name__)

async def search_medical_centers(query: str, city: str) -> list[dict]:
    logger.info("Checking for YANDEX_API_KEY. Is present: %s", bool(settings.YANDEX_API_KEY))
    if not settings.YANDEX_API_KEY:
        logger.warning("YANDEX_API_KEY is not configured; skipping Yandex Maps search.")
        return []

    search_text = f"{query} {city}".strip()
    api_url = f"https://search-maps.yandex.ru/v1/?text={search_text}&type=biz&lang=ru_RU&apikey={settings.YANDEX_API_KEY}"
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(api_url)
            response.raise_for_status()  # Raise an exception for bad status codes
            data = response.json()
            
            # Normalize Yandex API response to our model
            normalized_data = []
            for feature in data.get("features", []):
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

        except httpx.HTTPStatusError as e:
            # Handle HTTP errors (e.g., 4xx, 5xx)
            print(f"HTTP error occurred: {e}")
            return []
        except httpx.RequestError as e:
            # Handle network errors
            print(f"An error occurred while requesting from Yandex Maps: {e}")
            return []
