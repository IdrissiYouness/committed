"""Main analysis pipeline orchestrating all steps"""

import subprocess
from datetime import datetime, timezone
from typing import Dict, Any
from core import git_handler, agent_runner, metrics_parser, classifier, report_generator


def _calculate_commit_hygiene(repo_path: str) -> dict:
    """
    Derive commit hygiene metrics from git log on the cloned repo.

    Called before cleanup so git history is still available.
    Returns a dict compatible with CommitHygiene model fields.
    """
    try:
        result = subprocess.run(
            ["git", "log", "--oneline", "--no-merges"],
            cwd=repo_path,
            capture_output=True,
            text=True,
            timeout=10,
        )
        if result.returncode != 0 or not result.stdout.strip():
            return _default_commit_hygiene("Could not read git log.")

        lines = [ln.strip() for ln in result.stdout.strip().splitlines() if ln.strip()]
        total_commits = len(lines)
        if total_commits == 0:
            return _default_commit_hygiene("No commits found.")

        # Conventional-commit prefixes considered "single-purpose"
        good_prefixes = (
            "fix", "feat", "add", "update", "refactor", "improve",
            "remove", "delete", "create", "init", "docs", "test",
            "chore", "style", "perf", "ci", "build", "revert",
        )
        good_count = 0
        for line in lines:
            # Strip the short hash (first token), inspect the message
            parts = line.split(" ", 1)
            msg = parts[1].lower().strip() if len(parts) > 1 else ""
            if len(msg) >= 10 and any(msg.startswith(p) for p in good_prefixes):
                good_count += 1

        quality_ratio = good_count / total_commits
        message_quality = round(min(5.0, quality_ratio * 5.0), 1)
        single_purpose_pct = round(quality_ratio * 100, 1)

        # Blend quality score with a small bonus for commit volume
        volume_bonus = min(1.0, total_commits / 10) * 0.5
        score = round(min(5.0, message_quality * 0.8 + volume_bonus), 1)

        if message_quality >= 4.0:
            notes = f"{total_commits} commits. Messages follow conventional commit conventions well."
        elif message_quality >= 2.5:
            notes = f"{total_commits} commits. Messages are adequate; consider adopting conventional commits (feat/fix/chore)."
        else:
            notes = f"{total_commits} commits. Messages need improvement — use descriptive prefixes like feat:, fix:, docs:."

        return {
            "score": score,
            "total_commits": total_commits,
            "single_purpose_pct": single_purpose_pct,
            "message_quality_score": message_quality,
            "notes": notes,
        }

    except Exception as exc:
        return _default_commit_hygiene(f"Analysis error: {exc}")


def _default_commit_hygiene(reason: str = "") -> dict:
    return {
        "score": 0.0,
        "total_commits": 0,
        "single_purpose_pct": 0.0,
        "message_quality_score": 0.0,
        "notes": reason or "Could not analyze commit history.",
    }


def run_analysis(submission_id: int, repo_url: str) -> Dict[str, Any]:
    """
    Run complete code analysis pipeline.

    Steps:
    1. Clone repository
    2. Run AI agent analysis
    3. Calculate commit hygiene (Python-based git log)
    4. Parse and normalize metrics
    5. Classify into A-F grade
    6. Generate PDF report
    7. Return results

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

        # Step 3: Inject commit hygiene (requires live repo before cleanup)
        raw["commit_hygiene"] = _calculate_commit_hygiene(repo_path)

        # Step 4: Parse
        metrics = metrics_parser.parse(raw)

        # Step 5: Classify
        classification = classifier.classify(metrics)

        # Step 6: Generate report
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
