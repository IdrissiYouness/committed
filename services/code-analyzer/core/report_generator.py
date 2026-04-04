"""Typst PDF report generation"""

import os
import subprocess
import textwrap
from config import Config
from models.metrics_schema import MetricsSchema


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

    # Build the metrics table rows as Typst content
    metric_rows = []
    for key, detail in classification["breakdown"].items():
        notes = getattr(metrics, key).notes.replace('"', '\\"')
        metric_rows.append(
            f"[{key.replace('_', ' ').title()}], [{detail['score']:.1f}], "
            f"[{detail['max']:.0f}], [{notes}],"
        )

    # Build recommendations array
    recommendations_typst = "\n".join(
        f"  (rec{i},)," for i, _ in enumerate(metrics.recommendations)
    )
    escaped_recs = [r.replace('"', r"\"") for r in metrics.recommendations]
    rec_defs = "\n".join(f'#let rec{i} = "{rec}"' for i, rec in enumerate(escaped_recs))

    # Escape feedback
    escaped_feedback = metrics.feedback.replace('"', r"\"")

    # Create Typst data file
    typst_source = textwrap.dedent(f"""
        #let repo_url = "{repo_url}"
        #let submission_id = "{submission_id}"
        #let analyzed_at = "{analyzed_at}"
        #let grade = "{classification["grade"]}"
        #let percentage = "{classification["percentage"]}"
        #let feedback = "{escaped_feedback}"
        {rec_defs}
        #let recommendations = ({recommendations_typst})
        #let metrics_rows = (
            {chr(10).join(metric_rows)}
        )
        #include "report.typ"
    """)

    src_path = os.path.join(Config.REPORTS_DIR, f"{submission_id}_data.typ")
    pdf_path = os.path.join(Config.REPORTS_DIR, f"{submission_id}.pdf")

    # Write data file
    with open(src_path, "w") as f:
        f.write(typst_source)

    # Compile to PDF
    result = subprocess.run(
        [Config.TYPST_BIN, "compile", src_path, pdf_path],
        capture_output=True,
        text=True,
        timeout=30,
    )

    if result.returncode != 0:
        raise RuntimeError(f"Typst compilation failed: {result.stderr}")

    # Cleanup intermediate file
    os.remove(src_path)

    return pdf_path
