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
    base_grade = "F"
    for threshold, letter in GRADE_THRESHOLDS:
        if percentage >= threshold:
            base_grade = letter
            break

    # 3. Apply floor rules and collect explanations for triggered ones
    grade = base_grade
    floor_rules_triggered = []
    for metric_key, min_score, cap_grade in FLOOR_RULES:
        score = getattr(metrics, metric_key).score
        if score < min_score:
            if ord(grade) < ord(cap_grade):  # 'A' < 'D' alphabetically means better grade
                floor_rules_triggered.append({
                    "metric": metric_key,
                    "score": score,
                    "min_score": min_score,
                    "cap_grade": cap_grade,
                    "earned_grade": base_grade,
                })
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

    # 5. Build result with student level inference
    result = {
        "grade": grade,
        "percentage": round(percentage, 2),
        "breakdown": breakdown,
        "floor_rules_triggered": floor_rules_triggered,
    }

    # Add inferred student level
    result["student_level"] = infer_student_level(result, metrics)

    return result


def infer_student_level(classification: dict, metrics: MetricsSchema) -> str:
    """
    Infer student skill level from analysis results.

    Args:
        classification: Classification result containing grade and percentage
        metrics: Normalized metrics schema

    Returns:
        Student level: "advanced", "intermediate", or "beginner"

    Logic:
        - Advanced: Grade A/B with most metrics >= 3.5
        - Beginner: Grade D/F, or average score < 2.0, or testing score < 1.0
        - Intermediate: Everything else
    """
    grade = classification["grade"]
    percentage = classification["percentage"]

    # Calculate average score across all metrics
    scores = [
        metrics.solid.score,
        metrics.clean_code.score,
        metrics.oop.score,
        metrics.error_handling.score,
        metrics.testing.score,
        metrics.documentation.score,
        metrics.complexity.score,
    ]
    avg_score = sum(scores) / len(scores)

    # Advanced: High grades and strong overall performance
    if grade in ["A", "B"] and avg_score >= 3.5:
        return "advanced"

    # Beginner: Low grades or critical weaknesses
    elif grade in ["D", "F"] or avg_score < 2.0 or metrics.testing.score < 1.0:
        return "beginner"

    # Intermediate: Everything else
    else:
        return "intermediate"
