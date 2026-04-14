"""Classification logic to convert metrics to letter grades."""

from typing import Dict, Any
from models.metrics_schema import MetricsSchema

# Weights for each metric category.
# TODO: Make weights configurable per assignment/course so instructors can
#       emphasise different criteria (e.g. a DB assignment may weight OOP lower
#       and error handling higher).
WEIGHTS = {
    "solid": 0.20,
    "clean_code": 0.20,
    "oop": 0.15,
    "error_handling": 0.15,
    "testing": 0.15,
    "documentation": 0.10,
    "complexity": 0.05,
}

# Grade thresholds: minimum percentage → letter grade (highest threshold first).
GRADE_THRESHOLDS = [
    (85, "A"),
    (70, "B"),
    (55, "C"),
    (40, "D"),
    (0, "F"),
]

# Floor rules — (metric_key, min_score, cap_grade).
# If a metric is below min_score AND the earned grade is better than cap_grade,
# the grade is capped at cap_grade.
# Grade ordering (best → worst): A B C D F  →  ord() increases with grade severity.
FLOOR_RULES = [
    ("testing", 1.0, "D"),       # No meaningful tests → cap at D
    ("error_handling", 1.0, "D"), # No error handling → equally risky to ship
]


def classify(metrics: MetricsSchema) -> Dict[str, Any]:
    """Convert metrics to a letter grade with breakdown.

    Args:
        metrics: Normalized metrics schema.

    Returns:
        Dictionary containing grade, percentage, breakdown, triggered floor
        rules, and inferred student level.
    """
    # 1. Weighted percentage (normalised to 0–100)
    total_weight = sum(WEIGHTS.values())
    weighted_sum = sum(
        (getattr(metrics, key).score / getattr(metrics, key).max) * weight
        for key, weight in WEIGHTS.items()
    )
    percentage = (weighted_sum / total_weight) * 100

    # 2. Base grade from thresholds
    base_grade = "F"
    for threshold, letter in GRADE_THRESHOLDS:
        if percentage >= threshold:
            base_grade = letter
            break

    # 3. Apply floor rules.
    # A cap is triggered when the earned grade is *better* than the cap grade.
    # "Better" means a lower ord() value: ord('A')=65 < ord('D')=68 < ord('F')=70.
    grade = base_grade
    floor_rules_triggered = []
    for metric_key, min_score, cap_grade in FLOOR_RULES:
        score = getattr(metrics, metric_key).score
        if score < min_score and ord(grade) < ord(cap_grade):
            floor_rules_triggered.append(
                {
                    "metric": metric_key,
                    "score": score,
                    "min_score": min_score,
                    "cap_grade": cap_grade,
                    "earned_grade": base_grade,
                }
            )
            grade = cap_grade

    # 4. Breakdown per metric
    breakdown = {
        k: {
            "score": getattr(metrics, k).score,
            "max": getattr(metrics, k).max,
            "weighted_contribution": round(
                (getattr(metrics, k).score / getattr(metrics, k).max)
                * WEIGHTS.get(k, 0)
                * 100,
                2,
            ),
        }
        for k in WEIGHTS
    }

    result = {
        "grade": grade,
        "percentage": round(percentage, 2),
        "breakdown": breakdown,
        "floor_rules_triggered": floor_rules_triggered,
    }
    result["student_level"] = infer_student_level(result, metrics)
    return result


def infer_student_level(classification: dict, metrics: MetricsSchema) -> str:
    """Infer student skill level from analysis results.

    Args:
        classification: Classification result containing grade and percentage.
        metrics: Normalized metrics schema.

    Returns:
        One of ``"advanced"``, ``"intermediate"``, or ``"beginner"``.

    Logic:
        - **Advanced**: Grade A/B, average score ≥ 3.5, *and* percentage ≥ 72
          (the last guard smooths the boundary so a 70%-exactly-B with avg 3.5
          stays intermediate).
        - **Beginner**: Grade D/F, *or* average score < 2.0, *or* testing < 1.0.
        - **Intermediate**: Everything else.
    """
    grade = classification["grade"]
    percentage = classification["percentage"]

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

    # Advanced: strong grades, strong average, and comfortably above B threshold.
    if grade in ("A", "B") and avg_score >= 3.5 and percentage >= 72:
        return "advanced"

    # Beginner: low grade or critical weakness in testing.
    if grade in ("D", "F") or avg_score < 2.0 or metrics.testing.score < 1.0:
        return "beginner"

    return "intermediate"
