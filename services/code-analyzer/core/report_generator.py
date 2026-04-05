"""Typst PDF report generation"""

import os
import subprocess
import textwrap
import json
import logging
from typing import Optional
from config import Config
from models.metrics_schema import MetricsSchema, EnhancedContent

logger = logging.getLogger(__name__)


def enhance_content_with_ai(
    metrics: MetricsSchema, classification: dict
) -> Optional[dict]:
    """
    Use the kilo report-content agent to generate personalized feedback.

    Args:
        metrics: Normalized metrics schema
        classification: Classification result with grade, percentage, and student_level

    Returns:
        Enhanced content dict or None if generation fails or is disabled
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
                for key in [
                    "solid",
                    "clean_code",
                    "oop",
                    "error_handling",
                    "testing",
                    "documentation",
                    "complexity",
                ]
            },
            "original_feedback": metrics.feedback,
            "original_recommendations": metrics.recommendations,
        }

        script_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        wrapper_path = os.path.join(script_dir, "scripts", "kilo-report-content.py")

        if not os.path.exists(wrapper_path):
            logger.warning(
                "AI enhancement wrapper not found at %s; using fallback content",
                wrapper_path,
            )
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


def generate(
    submission_id: int,
    repo_url: str,
    metrics: MetricsSchema,
    classification: dict,
    analyzed_at: str,
) -> str:
    """
    Generate a PDF report from metrics and classification data.

    Args:
        submission_id: Unique submission identifier
        repo_url: Repository URL that was analyzed
        metrics: Normalized metrics schema
        classification: Classification result with grade and breakdown
        analyzed_at: ISO timestamp of analysis

    Returns:
        Path to the generated PDF file

    Raises:
        RuntimeError: If Typst compilation fails
    """
    os.makedirs(Config.REPORTS_DIR, exist_ok=True)

    enhanced_content = enhance_content_with_ai(metrics, classification)

    if enhanced_content:
        feedback = enhanced_content.get("feedback", metrics.feedback)
        recommendations = enhanced_content.get(
            "recommendations", metrics.recommendations
        )
        encouragement = enhanced_content.get("encouragement", "")
    else:
        logger.info("Using original report feedback/recommendations (AI fallback path)")
        feedback = metrics.feedback
        recommendations = metrics.recommendations
        encouragement = ""

    metric_rows = []
    for key, detail in classification["breakdown"].items():
        notes = getattr(metrics, key).notes.replace('"', '\\"')
        metric_rows.append(
            f"[{key.replace('_', ' ').title()}], [{detail['score']:.1f}], "
            f"[{detail['max']:.0f}], [{notes}],"
        )

    recommendations_typst = "\n".join(
        f"  (rec{i},)," for i, _ in enumerate(recommendations)
    )
    escaped_recs = [r.replace('"', r"\"") for r in recommendations]
    rec_defs = "\n".join(f'#let rec{i} = "{rec}"' for i, rec in enumerate(escaped_recs))

    escaped_feedback = feedback.replace('"', r"\"")
    escaped_encouragement = encouragement.replace('"', r"\"")

    typst_source = textwrap.dedent(
        f"""
        #let repo_url = "{repo_url}"
        #let submission_id = "{submission_id}"
        #let analyzed_at = "{analyzed_at}"
        #let grade = "{classification["grade"]}"
        #let percentage = "{classification["percentage"]}"
        #let feedback = "{escaped_feedback}"
        #let encouragement = "{escaped_encouragement}"
        {rec_defs}
        #let recommendations = ({recommendations_typst})
        #let metrics_rows = (
            {chr(10).join(metric_rows)}
        )
        #include "report.typ"
    """
    )

    src_path = os.path.join(Config.REPORTS_DIR, f"{submission_id}_data.typ")
    pdf_path = os.path.join(Config.REPORTS_DIR, f"{submission_id}.pdf")

    with open(src_path, "w") as f:
        f.write(typst_source)

    result = subprocess.run(
        [Config.TYPST_BIN, "compile", src_path, pdf_path],
        capture_output=True,
        text=True,
        timeout=30,
    )

    if result.returncode != 0:
        raise RuntimeError(f"Typst compilation failed: {result.stderr}")

    os.remove(src_path)

    return pdf_path
