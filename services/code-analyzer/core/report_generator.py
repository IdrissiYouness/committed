"""Typst PDF report generation"""

import json
import logging
import math
import os
import subprocess
import textwrap
from datetime import datetime
from typing import Optional

from config import Config
from models.metrics_schema import MetricsSchema, EnhancedContent, Recommendation

logger = logging.getLogger(__name__)

# Ordered metric keys used consistently throughout
METRIC_KEYS = ["solid", "clean_code", "oop", "error_handling", "testing", "documentation", "complexity"]


# ── Radar chart ───────────────────────────────────────────────────────────────


def generate_radar_svg(scores: list, labels: list, max_val: float = 5.0) -> str:
    """
    Generate a spider/radar chart as a self-contained SVG string.

    Args:
        scores: List of numeric values (same length as labels)
        labels: List of axis label strings; use \\n for line breaks
        max_val: Maximum value on each axis

    Returns:
        SVG markup as a string
    """
    N = len(scores)
    if N == 0:
        return '<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"></svg>'

    W, H = 500, 460
    cx, cy = 250, 228
    radius = 152
    label_r = 194

    def to_xy(r: float, angle: float):
        return cx + r * math.cos(angle), cy + r * math.sin(angle)

    # Angles start at top (-π/2) and go clockwise
    angles = [-math.pi / 2 + 2 * math.pi * i / N for i in range(N)]

    parts = [
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" '
        f'width="{W}" height="{H}">',
        f'<rect width="{W}" height="{H}" fill="white"/>',
    ]

    # Grid rings (1–5)
    for level in range(1, 6):
        r = radius * level / max_val
        pts = " ".join(f"{to_xy(r, a)[0]:.1f},{to_xy(r, a)[1]:.1f}" for a in angles)
        fill = "rgba(219,234,254,0.25)" if level % 2 == 0 else "none"
        parts.append(
            f'<polygon points="{pts}" fill="{fill}" stroke="#cbd5e1" stroke-width="0.8"/>'
        )

    # Ring level numbers along the first (top) axis
    for level in range(1, 6):
        r = radius * level / max_val
        x, y = to_xy(r, angles[0])
        parts.append(
            f'<text x="{x + 5:.1f}" y="{y:.1f}" font-size="9" fill="#94a3b8" '
            f'font-family="Arial,sans-serif" dominant-baseline="middle">{level}</text>'
        )

    # Axis spokes
    for a in angles:
        x, y = to_xy(radius, a)
        parts.append(
            f'<line x1="{cx}" y1="{cy}" x2="{x:.1f}" y2="{y:.1f}" '
            f'stroke="#cbd5e1" stroke-width="0.9"/>'
        )

    # Data polygon
    data_pts = [to_xy(radius * max(0.0, min(s, max_val)) / max_val, a) for s, a in zip(scores, angles)]
    pts_str = " ".join(f"{x:.1f},{y:.1f}" for x, y in data_pts)
    parts.append(
        f'<polygon points="{pts_str}" fill="rgba(37,99,235,0.18)" '
        f'stroke="#2563eb" stroke-width="2.5" stroke-linejoin="round"/>'
    )

    # Data dots
    for x, y in data_pts:
        parts.append(
            f'<circle cx="{x:.1f}" cy="{y:.1f}" r="4.5" fill="#2563eb" '
            f'stroke="white" stroke-width="2"/>'
        )

    # Axis labels
    for i, label in enumerate(labels):
        a = angles[i]
        x, y = to_xy(label_r, a)

        anchor = "middle"
        if x < cx - 20:
            anchor = "end"
        elif x > cx + 20:
            anchor = "start"

        lines = label.split("\n")
        line_h = 14
        start_y = y - (len(lines) - 1) * line_h / 2

        parts.append(
            f'<text text-anchor="{anchor}" font-size="11.5" font-weight="600" '
            f'fill="#334155" font-family="Arial,sans-serif">'
        )
        for j, line in enumerate(lines):
            ty = start_y + j * line_h
            parts.append(f'<tspan x="{x:.1f}" y="{ty:.1f}">{line}</tspan>')
        parts.append("</text>")

    parts.append("</svg>")
    return "\n".join(parts)


# ── AI enhancement ────────────────────────────────────────────────────────────


def enhance_content_with_ai(
    metrics: MetricsSchema, classification: dict
) -> Optional[dict]:
    """
    Use the kilo report-content agent to generate personalized feedback.

    Returns enhanced content dict or None if generation fails or is disabled.
    """
    if not getattr(Config, "ENABLE_AI_REPORTS", True):
        logger.info("AI report enhancement disabled via ENABLE_AI_REPORTS")
        return None

    try:
        input_data = {
            "student_level": classification.get("student_level", "intermediate"),
            "grade": classification["grade"],
            "percentage": classification["percentage"],
            "metrics": {
                key: {
                    "score": getattr(metrics, key).score,
                    "notes": getattr(metrics, key).notes,
                }
                for key in METRIC_KEYS
            },
            "original_feedback": metrics.feedback,
            "original_recommendations": [
                r.title if isinstance(r, Recommendation) else str(r)
                for r in metrics.recommendations
            ],
        }

        script_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        wrapper_path = os.path.join(script_dir, "scripts", "kilo-report-content.py")

        if not os.path.exists(wrapper_path):
            logger.warning("AI enhancement wrapper not found at %s; using fallback", wrapper_path)
            return None

        result = subprocess.run(
            ["python3", wrapper_path, json.dumps(input_data)],
            capture_output=True,
            text=True,
            timeout=30,
        )

        if result.returncode != 0:
            logger.warning(
                "AI enhancement wrapper failed (exit %s): %s",
                result.returncode,
                (result.stderr or "").strip(),
            )
            return None

        enhanced = EnhancedContent.model_validate_json(result.stdout)
        logger.info("AI enhancement applied successfully")
        return enhanced.model_dump()

    except Exception as exc:
        logger.warning("AI enhancement failed; using fallback content: %s", exc)
        return None


# ── Helpers ───────────────────────────────────────────────────────────────────


def _to_rec_dict(r) -> dict:
    """Normalise any recommendation form to a plain dict for JSON serialisation."""
    if isinstance(r, str):
        return {"title": r, "description": r, "priority": "medium", "effort": "", "evidence": []}
    if isinstance(r, Recommendation):
        return r.model_dump()
    if isinstance(r, dict):
        d = dict(r)
        if "title" not in d:
            d["title"] = d.get("description", "Recommendation")
        if "description" not in d:
            d["description"] = d.get("title", "")
        d.setdefault("priority", "medium")
        d.setdefault("effort", "")
        d.setdefault("evidence", [])
        return d
    return {"title": str(r), "description": str(r), "priority": "medium", "effort": "", "evidence": []}


# ── Main entry point ──────────────────────────────────────────────────────────


def generate(
    submission_id: int,
    repo_url: str,
    metrics: MetricsSchema,
    classification: dict,
    analyzed_at: str,
) -> str:
    """
    Generate a PDF report from metrics and classification data.

    Workflow:
    1. Optionally enhance feedback/recommendations with AI
    2. Build a comprehensive JSON data file consumed by the Typst template
    3. Generate a radar chart SVG
    4. Compile the Typst source to PDF
    5. Clean up temporary files

    Args:
        submission_id: Unique submission identifier
        repo_url: Repository URL that was analysed
        metrics: Normalised MetricsSchema
        classification: Classification result (grade, percentage, breakdown, …)
        analyzed_at: ISO-format timestamp of analysis

    Returns:
        Path to the generated PDF file

    Raises:
        RuntimeError: If Typst compilation fails
    """
    os.makedirs(Config.REPORTS_DIR, exist_ok=True)

    # ── AI enhancement (optional) ──────────────────────────────────────────
    enhanced_content = enhance_content_with_ai(metrics, classification)

    if enhanced_content:
        feedback = enhanced_content.get("feedback", metrics.feedback)
        raw_recs = enhanced_content.get("recommendations", metrics.recommendations)
        encouragement = enhanced_content.get("encouragement", "")
    else:
        logger.info("Using original report feedback/recommendations (AI fallback path)")
        feedback = metrics.feedback
        raw_recs = metrics.recommendations
        encouragement = ""

    recommendations = [_to_rec_dict(r) for r in raw_recs]

    # ── Floor rule explanations ────────────────────────────────────────────
    floor_rule_strings = []
    for rule in classification.get("floor_rules_triggered", []):
        metric_label = rule["metric"].replace("_", " ").title()
        floor_rule_strings.append(
            f"{metric_label} score is {rule['score']:.1f} — minimum required is "
            f"{rule['min_score']:.1f}. Your weighted score earned grade "
            f"{rule['earned_grade']} ({classification['percentage']}%), but this "
            f"floor rule caps the grade at {rule['cap_grade']}."
        )

    # ── Metrics dict ───────────────────────────────────────────────────────
    metrics_data = {
        key: {
            "score": getattr(metrics, key).score,
            "max": getattr(metrics, key).max,
            "notes": getattr(metrics, key).notes,
            "confidence": getattr(metrics, key).confidence,
        }
        for key in METRIC_KEYS
    }

    # ── Comprehensive data payload ─────────────────────────────────────────
    formatted_date = datetime.fromisoformat(analyzed_at).strftime("%-d %b %Y")

    data = {
        "repo_url": repo_url,
        "submission_id": str(submission_id),
        "analyzed_at": formatted_date,
        "grade": classification["grade"],
        "percentage": classification["percentage"],
        "student_level": classification.get("student_level", "intermediate"),
        "feedback": feedback,
        "encouragement": encouragement,
        "floor_rules": floor_rule_strings,
        "metrics": metrics_data,
        "per_file": [pf.model_dump() for pf in metrics.per_file],
        "dependencies": metrics.dependencies.model_dump(),
        "duplication_score": metrics.duplication_score,
        "commit_hygiene": metrics.commit_hygiene.model_dump(),
        "accessibility_score": metrics.accessibility_score,
        "performance_hints": metrics.performance_hints,
        "quick_wins": [qw.model_dump() for qw in metrics.quick_wins],
        "positives": metrics.positives,
        "recommendations": recommendations,
    }

    # ── File paths ─────────────────────────────────────────────────────────
    data_json_filename = f"{submission_id}_data.json"
    radar_svg_filename = f"{submission_id}_radar.svg"
    data_json_path = os.path.join(Config.REPORTS_DIR, data_json_filename)
    radar_svg_path = os.path.join(Config.REPORTS_DIR, radar_svg_filename)
    src_path = os.path.join(Config.REPORTS_DIR, f"{submission_id}_data.typ")
    pdf_path = os.path.join(Config.REPORTS_DIR, f"{submission_id}.pdf")

    # ── Write JSON ─────────────────────────────────────────────────────────
    with open(data_json_path, "w", encoding="utf-8") as fh:
        json.dump(data, fh, ensure_ascii=False, indent=2)

    # ── Generate radar SVG ─────────────────────────────────────────────────
    scores = [metrics_data[k]["score"] for k in METRIC_KEYS]
    labels = ["SOLID", "Clean\nCode", "OOP", "Errors", "Testing", "Docs", "Complexity"]
    radar_svg = generate_radar_svg(scores, labels)
    with open(radar_svg_path, "w", encoding="utf-8") as fh:
        fh.write(radar_svg)

    # ── Build Typst source ─────────────────────────────────────────────────
    template_path = os.path.join(
        os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
        "templates",
        "report.typ",
    )
    with open(template_path) as fh:
        template_body = fh.read()

    # Prepend only the two data-loading bindings; template uses data.* for everything
    typst_source = textwrap.dedent(f"""\
        #let data = json("{data_json_filename}")
        #let radar_path = "{radar_svg_filename}"
    """) + "\n" + template_body

    with open(src_path, "w", encoding="utf-8") as fh:
        fh.write(typst_source)

    # ── Compile PDF ────────────────────────────────────────────────────────
    result = subprocess.run(
        [Config.TYPST_BIN, "compile", src_path, pdf_path],
        capture_output=True,
        text=True,
        timeout=60,
    )

    if result.returncode != 0:
        raise RuntimeError(f"Typst compilation failed: {result.stderr}")

    # ── Cleanup temp files ─────────────────────────────────────────────────
    for tmp in [src_path, data_json_path, radar_svg_path]:
        try:
            os.remove(tmp)
        except OSError:
            pass

    return pdf_path
