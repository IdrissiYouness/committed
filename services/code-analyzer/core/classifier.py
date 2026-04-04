"""Classification logic to convert metrics to letter grades"""

from typing import Dict, Any
from models.metrics_schema import MetricsSchema

# Weights for each metric category
WEIGHTS = {
    "solid": 0.20,
    "clean_code": 0.20,
    "oop": 0.15,
    "error_handling": 0.15,
    "testing": 0.15,
    "documentation": 0.10,
    "complexity": 0.05,
}

# Grade thresholds (percentage -> letter grade)
GRADE_THRESHOLDS = [
    (85, "A"),
    (70, "B"),
    (55, "C"),
    (40, "D"),
    (0, "F"),
]

# Floor rules - minimum scores required to avoid grade caps
# Format: (metric_key, minimum_score, cap_grade)
FLOOR_RULES = [
    ("testing", 1.0, "D"),  # if testing < 1.0, cap at D
]


def classify(metrics: MetricsSchema) -> Dict[str, Any]:
    """
    Convert metrics to a letter grade with breakdown.

    Args:
        metrics: Normalized metrics schema

    Returns:
        Dictionary containing grade, percentage, and detailed breakdown
    """
    # 1. Calculate weighted percentage
    total_weight = sum(WEIGHTS.values())
    weighted_sum = sum(
        (getattr(metrics, key).score / getattr(metrics, key).max) * weight
        for key, weight in WEIGHTS.items()
    )
    percentage = (weighted_sum / total_weight) * 100

    # 2. Determine base grade from thresholds
    grade = "F"
    for threshold, letter in GRADE_THRESHOLDS:
        if percentage >= threshold:
            grade = letter
            break

    # 3. Apply floor rules
    for metric_key, min_score, cap_grade in FLOOR_RULES:
        if getattr(metrics, metric_key).score < min_score:
            # Downgrade if current grade is better than the cap
            if ord(grade) < ord(cap_grade):  # 'A' < 'D' alphabetically
                grade = cap_grade

    # 4. Build breakdown
    breakdown = {}
    for k in WEIGHTS:
        metric = getattr(metrics, k)
        breakdown[k] = {
            "score": metric.score,
            "max": metric.max,
            "weighted_contribution": round(
                (metric.score / metric.max) * WEIGHTS.get(k, 0) * 100, 2
            ),
        }

    return {"grade": grade, "percentage": round(percentage, 2), "breakdown": breakdown}
