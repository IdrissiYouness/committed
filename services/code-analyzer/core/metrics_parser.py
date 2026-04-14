"""Metrics parsing and normalization."""

from typing import Any, Dict
from models.metrics_schema import MetricsSchema


def parse(raw: Dict[str, Any]) -> MetricsSchema:
    """Coerce raw agent output into the canonical :class:`MetricsSchema`.

    Handles both the old schema (7 metrics + feedback + recommendations as
    strings) and the new expanded schema (adds per_file, dependencies,
    confidence, structured recommendations, quick_wins, positives,
    architecture diagrams, class diagram, etc.).

    Missing keys get sensible defaults so the pipeline never hard-fails on
    schema gaps caused by a partial or older agent response.

    Args:
        raw: Raw dictionary from the AI agent.

    Returns:
        Validated and normalized :class:`MetricsSchema` instance.
    """
    normalized: Dict[str, Any] = {}

    # ── 7 core metrics ────────────────────────────────────────────────────────
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

    # ── Scalar fields ─────────────────────────────────────────────────────────
    normalized["feedback"] = raw.get("feedback", "")
    normalized["encouragement"] = raw.get("encouragement", "")
    normalized["duplication_score"] = float(raw.get("duplication_score", 0.0))
    normalized["accessibility_score"] = float(raw.get("accessibility_score", 0.0))

    # ── Simple string lists ───────────────────────────────────────────────────
    normalized["performance_hints"] = _as_str_list(raw.get("performance_hints", []))
    normalized["positives"] = _as_str_list(raw.get("positives", []))

    # ── Structured recommendations (strings or dicts) ─────────────────────────
    normalized["recommendations"] = raw.get("recommendations", [])

    # ── Quick wins ────────────────────────────────────────────────────────────
    normalized["quick_wins"] = raw.get("quick_wins", [])

    # ── Per-file analysis ─────────────────────────────────────────────────────
    normalized["per_file"] = _parse_per_file(raw.get("per_file", []))

    # ── Dependency health ─────────────────────────────────────────────────────
    normalized["dependencies"] = _parse_dependencies(raw.get("dependencies", {}))

    # ── Commit hygiene (injected by pipeline.py before parse) ─────────────────
    normalized["commit_hygiene"] = _parse_commit_hygiene(raw.get("commit_hygiene", {}))

    # ── File tree (injected by pipeline.py from filesystem, not from agent) ───
    normalized["file_tree"] = raw.get("file_tree", "")

    # ── Architecture diagram ──────────────────────────────────────────────────
    normalized["architecture_components"] = raw.get("architecture_components", [])
    normalized["architecture_connections"] = raw.get("architecture_connections", [])

    # ── Class diagram ─────────────────────────────────────────────────────────
    normalized["class_diagram"] = raw.get("class_diagram", [])

    # ── Project overview ──────────────────────────────────────────────────────
    normalized["project_overview"] = _parse_project_overview(raw.get("project_overview", {}))

    return MetricsSchema(**normalized)


# ── Helpers ───────────────────────────────────────────────────────────────────


def _as_str_list(value: Any) -> list:
    """Coerce *value* to a flat list of non-empty strings.

    Any item in *value* is converted via ``str()``; falsy items are dropped.
    Non-list values (e.g. ``None`` or a stray string) return an empty list.
    """
    if isinstance(value, list):
        return [str(item) for item in value if item]
    return []


def _parse_per_file(raw_list: Any) -> list:
    """Normalize the ``per_file`` agent output to a list of file analysis dicts.

    Each item must be a dict with at least a ``filename`` key.  Malformed
    entries are silently skipped.  Issue severity defaults to ``"medium"`` if
    absent.
    """
    if not isinstance(raw_list, list):
        return []
    result = []
    for item in raw_list:
        if not isinstance(item, dict):
            continue
        issues = []
        for iss in item.get("issues", []):
            if isinstance(iss, dict):
                issues.append(
                    {
                        "line": int(iss.get("line", 0)),
                        "severity": str(iss.get("severity", "medium")),
                        "message": str(iss.get("message", "")),
                    }
                )
        result.append(
            {
                "filename": str(item.get("filename", "unknown")),
                "lines": int(item.get("lines", 0)),
                "cyclomatic_complexity": float(item.get("cyclomatic_complexity", 0.0)),
                "duplication_pct": float(item.get("duplication_pct", 0.0)),
                "issues": issues,
            }
        )
    return result


def _parse_dependencies(raw: Any) -> dict:
    """Normalize the ``dependencies`` agent output.

    Filters out entries with blank names (placeholder rows the agent sometimes
    emits) and recomputes the summary counts from the filtered detail list so
    they stay consistent with the actual entries.
    """
    if not isinstance(raw, dict):
        return {"total": 0, "outdated": 0, "vulnerable": 0, "unused": 0, "details": []}

    details = []
    for dep in raw.get("details", []):
        if not isinstance(dep, dict):
            continue
        name = str(dep.get("name", "")).strip()
        if not name:
            continue  # Skip placeholder / empty entries the agent sometimes emits
        details.append(
            {
                "name": name,
                "current": str(dep.get("current", "")),
                "status": str(dep.get("status", "ok")),
                "note": str(dep.get("note", "")),
            }
        )

    outdated = sum(1 for d in details if d["status"] == "outdated")
    vulnerable = sum(1 for d in details if d["status"] == "vulnerable")
    unused = sum(1 for d in details if d["status"] == "unused")
    return {
        "total": len(details),
        "outdated": outdated,
        "vulnerable": vulnerable,
        "unused": unused,
        "details": details,
    }


def _parse_project_overview(raw: Any) -> dict:
    """Normalize the ``project_overview`` dict from the agent.

    Returns a dict compatible with :class:`~models.metrics_schema.ProjectOverview`.
    All fields default to empty so the section is simply omitted in the PDF when
    the agent did not produce a project overview.
    """
    if not isinstance(raw, dict):
        return {}
    return {
        "summary": str(raw.get("summary", "")),
        "contributors": _as_str_list(raw.get("contributors", [])),
        "technologies": _as_str_list(raw.get("technologies", [])),
        "implementation": str(raw.get("implementation", "")),
        "design_decisions": str(raw.get("design_decisions", "")),
        "key_features": _as_str_list(raw.get("key_features", [])),
        "setup_instructions": str(raw.get("setup_instructions", "")),
        "limitations": str(raw.get("limitations", "")),
    }


def _parse_commit_hygiene(raw: Any) -> dict:
    """Normalize the ``commit_hygiene`` dict injected by the pipeline.

    Returns zero-valued defaults when *raw* is not a dict so Pydantic
    validation never fails due to a missing git-log step.
    """
    if not isinstance(raw, dict):
        return {
            "score": 0.0,
            "total_commits": 0,
            "single_purpose_pct": 0.0,
            "message_quality_score": 0.0,
            "notes": "",
        }
    return {
        "score": float(raw.get("score", 0.0)),
        "total_commits": int(raw.get("total_commits", 0)),
        "single_purpose_pct": float(raw.get("single_purpose_pct", 0.0)),
        "message_quality_score": float(raw.get("message_quality_score", 0.0)),
        "notes": str(raw.get("notes", "")),
    }
