
from app.models import MedicalCenter

def calculate_recommendation_score(center: MedicalCenter, criteria: dict) -> float:
    """
    Calculates a recommendation score for a medical center based on user criteria.
    """
    score = 0.0

    # 1. Specialty Match (30%)
    specialty_match = 0.0
    if criteria.get("specialty") and center.specialty:
        if criteria["specialty"].lower() in center.specialty.lower():
            specialty_match = 1.0
    score += 0.30 * specialty_match

    # 2. Distance Score (25%) - Placeholder for now
    distance_score = 0.5  # Neutral value as we don't have user location yet
    score += 0.25 * distance_score

    # 3. Rating Score (20%)
    rating_score = 0.5  # Neutral value
    if center.rating is not None:
        # Normalize rating (assuming it's 0-5) to a 0-1 scale
        rating_score = center.rating / 5.0
    score += 0.20 * rating_score

    # 4. Availability Score (15%) - Based on emergency for now
    availability_score = 0.0
    if criteria.get("emergency") and center.emergency_available:
        availability_score = 1.0
    elif not criteria.get("emergency"): # If no emergency is requested, it's a neutral match
        availability_score = 0.5
    score += 0.15 * availability_score

    # 5. Price Score (10%)
    price_score = 0.5  # Neutral value
    if criteria.get("price") and center.approximate_price_level is not None:
        if criteria["price"] == "low" and center.approximate_price_level == 1:
            price_score = 1.0
        elif criteria["price"] == "high" and center.approximate_price_level == 3:
            price_score = 1.0 # Or maybe 0.0 if high is bad? Depends on interpretation.
    score += 0.10 * price_score

    return score

def rank_medical_centers(centers: list[MedicalCenter], criteria: dict) -> list[MedicalCenter]:
    """
    Ranks medical centers based on a recommendation score.
    """
    if not centers:
        return []

    scored_centers = [
        (center, calculate_recommendation_score(center, criteria))
        for center in centers
    ]

    # Sort by score in descending order
    scored_centers.sort(key=lambda x: x[1], reverse=True)

    return [center for center, score in scored_centers]
