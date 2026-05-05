
import re

def parse_message(message: str) -> dict:
    """
    Extracts criteria from a user message using simple keyword matching.
    """
    criteria = {
        "specialty": None,
        "city": None,
        "type": None,
        "emergency": False,
        "price": None,
    }

    # Lowercase for case-insensitive matching
    lower_message = message.lower()

    # Specialties (add more as needed)
    specialties = ["dentista", "cardiologo", "dermatologo", "pediatra"]
    for spec in specialties:
        if spec in lower_message:
            criteria["specialty"] = spec

    # Cities (this is a simple example, a real system would need a proper city database)
    cities = ["kursk", "moscu", "san petersburgo"]
    for city in cities:
        if city in lower_message:
            criteria["city"] = city

    # Center types
    types = ["clinica", "hospital", "farmacia", "стоматология"]
    for t in types:
        if t in lower_message:
            criteria["type"] = t

    # Emergency
    if "urgencias" in lower_message or "urgente" in lower_message:
        criteria["emergency"] = True

    # Price
    if "barato" in lower_message or "economico" in lower_message:
        criteria["price"] = "low"
    elif "caro" in lower_message:
        criteria["price"] = "high"

    return criteria
