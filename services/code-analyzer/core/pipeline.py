"""Main analysis pipeline orchestrating all steps"""

from datetime import datetime, timezone
from typing import Dict, Any
from core import git_handler, agent_runner, metrics_parser, classifier, report_generator


def run_analysis(submission_id: int, repo_url: str) -> Dict[str, Any]:
    """
    Run complete code analysis pipeline.

    Steps:
    1. Clone repository
    2. Run AI agent analysis
    3. Parse and normalize metrics
    4. Classify into A-F grade
    5. Generate PDF report
    6. Return results

    Args:
        submission_id: Unique submission identifier
        repo_url: GitHub/GitLab repository URL

    Returns:
        Dictionary containing analysis results or error information
    """
    repo_path = None

    try:
        # Step 1: Clone
        repo_path = git_handler.clone(repo_url, submission_id)

        # Step 2: Run agent
        runner = agent_runner.get_runner()
        raw = runner.run(repo_path)

        # Step 3: Parse
        metrics = metrics_parser.parse(raw)

        # Step 4: Classify
        classification = classifier.classify(metrics)

        # Step 5-6: Generate report
        analyzed_at = datetime.now(timezone.utc).isoformat()
        pdf_path = report_generator.generate(
            submission_id, repo_url, metrics, classification, analyzed_at
        )

        # Step 7: Return results
        return {
            "submissionId": submission_id,
            "status": "completed",
            "grade": classification["grade"],
            "percentage": classification["percentage"],
            "student_level": classification.get("student_level", "intermediate"),
            "breakdown": classification["breakdown"],
            "metrics": metrics.model_dump(),
            "reportUrl": f"/reports/{submission_id}.pdf",
            "analyzedAt": analyzed_at,
        }

    except Exception as e:
        return {
            "submissionId": submission_id,
            "status": "failed",
            "error": str(e),
        }

    finally:
        # Always cleanup cloned repo
        if repo_path:
            git_handler.cleanup(repo_path)
