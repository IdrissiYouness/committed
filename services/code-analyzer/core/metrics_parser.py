"""Metrics parsing and normalization"""

from typing import Dict, Any
from models.metrics_schema import MetricsSchema


def parse(raw: Dict[str, Any]) -> MetricsSchema:
    """
    Coerce raw agent output into the canonical MetricsSchema.

    Missing keys get default score of 0 with a note that the metric
    could not be evaluated.

    Args:
        raw: Raw dictionary from AI agent

    Returns:
        Validated and normalized MetricsSchema instance
    """
    normalized = {}

    for key in [
        "solid",
        "clean_code",
        "oop",
        "error_handling",
        "testing",
        "documentation",
        "complexity",
    ]:
        entry = raw.get(key)

        if entry is None:
            # Key is missing entirely
            normalized[key] = {"score": 0.0, "notes": "Could not evaluate."}
        elif isinstance(entry, (int, float)):
            # Agent returned a bare number
            normalized[key] = {"score": float(entry), "notes": ""}
        elif isinstance(entry, dict):
            normalized[key] = {
                "score": float(entry.get("score", 0)),
                "notes": entry.get("notes", ""),
            }
        else:
            normalized[key] = {"score": 0.0, "notes": "Could not evaluate."}

    normalized["feedback"] = raw.get("feedback", "")
    normalized["recommendations"] = raw.get("recommendations", [])

    return MetricsSchema(**normalized)
