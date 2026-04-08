"""Metrics parsing and normalization"""

from typing import Dict, Any
from models.metrics_schema import MetricsSchema


def parse(raw: Dict[str, Any]) -> MetricsSchema:
    """
    Coerce raw agent output into the canonical MetricsSchema.

    Handles both the old schema (7 metrics + feedback + recommendations as strings)
    and the new expanded schema (adds per_file, dependencies, confidence, structured
    recommendations, quick_wins, positives, etc.).

    Missing keys get sensible defaults so the pipeline never hard-fails on schema gaps.

    Args:
        raw: Raw dictionary from AI agent

    Returns:
        Validated and normalized MetricsSchema instance
    """
    normalized: Dict[str, Any] = {}

    # --- 7 core metrics ---
    for key in ["solid", "clean_code", "oop", "error_handling", "testing", "documentation", "complexity"]:
        entry = raw.get(key)

        if entry is None:
            normalized[key] = {"score": 0.0, "notes": "Could not evaluate.", "confidence": 0.5}
        elif isinstance(entry, (int, float)):
            normalized[key] = {"score": float(entry), "notes": "", "confidence": 0.5}
        elif isinstance(entry, dict):
            normalized[key] = {
                "score": float(entry.get("score", 0.0)),
                "notes": entry.get("notes", ""),
                "confidence": float(entry.get("confidence", 0.8)),
            }
        else:
            normalized[key] = {"score": 0.0, "notes": "Could not evaluate.", "confidence": 0.5}

    # --- scalar fields ---
    normalized["feedback"] = raw.get("feedback", "")
    normalized["duplication_score"] = float(raw.get("duplication_score", 0.0))
    normalized["accessibility_score"] = float(raw.get("accessibility_score", 0.0))

    # --- list fields with simple string elements ---
    normalized["performance_hints"] = _as_str_list(raw.get("performance_hints", []))
    normalized["positives"] = _as_str_list(raw.get("positives", []))

    # --- structured recommendations (strings or dicts) ---
    normalized["recommendations"] = raw.get("recommendations", [])

    # --- quick_wins ---
    normalized["quick_wins"] = raw.get("quick_wins", [])

    # --- per_file ---
    raw_per_file = raw.get("per_file", [])
    normalized["per_file"] = _parse_per_file(raw_per_file)

    # --- dependencies ---
    raw_deps = raw.get("dependencies", {})
    normalized["dependencies"] = _parse_dependencies(raw_deps)

    # --- commit_hygiene (usually injected by pipeline.py before parse) ---
    raw_hygiene = raw.get("commit_hygiene", {})
    normalized["commit_hygiene"] = _parse_commit_hygiene(raw_hygiene)

    return MetricsSchema(**normalized)


# ── helpers ──────────────────────────────────────────────────────────────────


def _as_str_list(value: Any) -> list:
    if isinstance(value, list):
        return [str(item) for item in value if item]
    return []


def _parse_per_file(raw_list: Any) -> list:
    if not isinstance(raw_list, list):
        return []
    result = []
    for item in raw_list:
        if not isinstance(item, dict):
            continue
        issues = []
        for iss in item.get("issues", []):
            if isinstance(iss, dict):
                issues.append({
                    "line": int(iss.get("line", 0)),
                    "severity": str(iss.get("severity", "medium")),
                    "message": str(iss.get("message", "")),
                })
        result.append({
            "filename": str(item.get("filename", "unknown")),
            "lines": int(item.get("lines", 0)),
            "cyclomatic_complexity": float(item.get("cyclomatic_complexity", 0.0)),
            "duplication_pct": float(item.get("duplication_pct", 0.0)),
            "issues": issues,
        })
    return result


def _parse_dependencies(raw: Any) -> dict:
    if not isinstance(raw, dict):
        return {"total": 0, "outdated": 0, "vulnerable": 0, "unused": 0, "details": []}
    details = []
    for dep in raw.get("details", []):
        if not isinstance(dep, dict):
            continue
        name = str(dep.get("name", "")).strip()
        if not name:
            # Skip placeholder / empty entries the agent sometimes emits
            continue
        details.append({
            "name": name,
            "current": str(dep.get("current", "")),
            "status": str(dep.get("status", "ok")),
            "note": str(dep.get("note", "")),
        })
    # Recompute summary counts from the filtered detail list so they stay consistent
    outdated   = sum(1 for d in details if d["status"] == "outdated")
    vulnerable = sum(1 for d in details if d["status"] == "vulnerable")
    unused     = sum(1 for d in details if d["status"] == "unused")
    return {
        "total": len(details),
        "outdated": outdated,
        "vulnerable": vulnerable,
        "unused": unused,
        "details": details,
    }


def _parse_commit_hygiene(raw: Any) -> dict:
    if not isinstance(raw, dict):
        return {"score": 0.0, "total_commits": 0, "single_purpose_pct": 0.0, "message_quality_score": 0.0, "notes": ""}
    return {
        "score": float(raw.get("score", 0.0)),
        "total_commits": int(raw.get("total_commits", 0)),
        "single_purpose_pct": float(raw.get("single_purpose_pct", 0.0)),
        "message_quality_score": float(raw.get("message_quality_score", 0.0)),
        "notes": str(raw.get("notes", "")),
    }
