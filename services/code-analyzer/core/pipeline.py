"""Main analysis pipeline orchestrating all steps"""

import logging
import os
import subprocess
import time
from datetime import datetime, timezone
from typing import Dict, Any
from core import git_handler, agent_runner, metrics_parser, classifier, report_generator

logger = logging.getLogger(__name__)


def _generate_file_tree(repo_path: str, max_depth: int = 4, max_files: int = 80) -> str:
    """
    Generate a compact ASCII file tree from the cloned repository.

    Skips noise directories (node_modules, .git, build artifacts) and binary
    file extensions so the tree stays readable in the PDF.

    Args:
        repo_path: Absolute path to the cloned repository root
        max_depth: Maximum folder depth to recurse into
        max_files: Maximum number of file entries before truncating

    Returns:
        Multi-line string representing the tree, starting with the repo name
    """
    SKIP_DIRS = {
        ".git", "node_modules", "__pycache__", ".venv", "venv", "env",
        "vendor", "dist", "build", "target", ".idea", ".vscode",
        ".gradle", ".mvn", "bin", "obj", "out", ".pytest_cache",
        ".next", ".nuxt", "coverage", ".tox",
    }
    SKIP_EXTENSIONS = {
        ".class", ".pyc", ".pyo", ".o", ".so", ".dll", ".exe",
        ".jar", ".war", ".ear", ".min.js", ".min.css",
    }
    SKIP_FILES = {
        "package-lock.json", "yarn.lock", "bun.lock",
        "Pipfile.lock", "poetry.lock", "composer.lock",
    }

    lines: list[str] = []
    file_count = [0]

    def _walk(path: str, prefix: str, depth: int) -> None:
        if depth > max_depth or file_count[0] >= max_files:
            return
        try:
            entries = sorted(os.listdir(path))
        except OSError:
            return

        dirs = [
            e for e in entries
            if os.path.isdir(os.path.join(path, e))
            and e not in SKIP_DIRS
            and not e.startswith(".")
        ]
        files = [
            e for e in entries
            if os.path.isfile(os.path.join(path, e))
            and e not in SKIP_FILES
            and not any(e.endswith(ext) for ext in SKIP_EXTENSIONS)
        ]
        visible = dirs + files

        for i, entry in enumerate(visible):
            if file_count[0] >= max_files:
                lines.append(f"{prefix}… (truncated)")
                return
            is_last = i == len(visible) - 1
            connector = "└── " if is_last else "├── "
            extension = "    " if is_last else "│   "
            full = os.path.join(path, entry)

            if os.path.isdir(full) and entry in dirs:
                lines.append(f"{prefix}{connector}{entry}/")
                _walk(full, prefix + extension, depth + 1)
            else:
                lines.append(f"{prefix}{connector}{entry}")
                file_count[0] += 1

    repo_name = os.path.basename(repo_path.rstrip("/\\"))
    lines.append(f"{repo_name}/")
    _walk(repo_path, "", 0)
    return "\n".join(lines)


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
            if len(msg) >= 5 and any(msg.startswith(p) for p in good_prefixes):
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
    started_at = time.monotonic()

    def _elapsed(since: float) -> str:
        s = time.monotonic() - since
        return f"{s:.1f}s"

    logger.info("[%s] pipeline start — %s", submission_id, repo_url)

    try:
        # Step 1: Clone
        t = time.monotonic()
        repo_path = git_handler.clone(repo_url, submission_id)
        logger.info("[%s] step 1 clone          %s", submission_id, _elapsed(t))

        # Step 2: Run agent
        # TODO: The gateway strips the JWT and forwards X-User-Id / X-User-Role
        #       as plain headers. Once the gateway calls this service for real
        #       (replacing MockAIAgentService), thread these values through so
        #       the agent prompt can be personalised with student context.
        t = time.monotonic()
        runner = agent_runner.get_runner()
        raw = runner.run(repo_path)
        logger.info("[%s] step 2 AI agent       %s", submission_id, _elapsed(t))

        # Step 3: Inject commit hygiene and file tree (requires live repo before cleanup)
        t = time.monotonic()
        raw["commit_hygiene"] = _calculate_commit_hygiene(repo_path)
        raw["file_tree"] = _generate_file_tree(repo_path, max_depth=7)
        logger.info("[%s] step 3 hygiene+tree   %s", submission_id, _elapsed(t))

        # Step 4: Parse
        t = time.monotonic()
        metrics = metrics_parser.parse(raw)
        logger.info("[%s] step 4 parse          %s", submission_id, _elapsed(t))

        # Step 5: Classify
        t = time.monotonic()
        classification = classifier.classify(metrics)
        logger.info("[%s] step 5 classify       %s", submission_id, _elapsed(t))

        # Step 6: Generate report
        # TODO: The gateway already returns 201 to the client immediately via its
        #       CompletableFuture async thread pool (5 core / 20 max threads).
        #       However, that gateway thread stays blocked for the full ~6-minute
        #       analysis. Under concurrent submissions (e.g. assignment deadlines)
        #       this will exhaust the gateway thread pool (queue capacity: 100).
        #       Consider having code-analyzer call back to the gateway/core when
        #       done (webhook pattern) so the gateway thread is freed immediately.
        analyzed_at = datetime.now(timezone.utc).isoformat()
        elapsed = round(time.monotonic() - started_at)
        analyzed_in = f"{elapsed // 60}m {elapsed % 60}s" if elapsed >= 60 else f"{elapsed}s"

        t = time.monotonic()
        pdf_path = report_generator.generate(
            submission_id, repo_url, metrics, classification, analyzed_at,
            analyzed_in=analyzed_in,
        )
        logger.info("[%s] step 6 PDF            %s", submission_id, _elapsed(t))
        logger.info("[%s] pipeline done — %s  grade=%s", submission_id, analyzed_in, classification["grade"])

        # Step 7: Return results
        # TODO: Call the notifications service (http://notifications:5001/notify)
        #       on both completion and failure. NOTIFICATION_SERVICE_URL is already
        #       in Config but nothing in the pipeline uses it. The notifications
        #       service is currently a placeholder — wire this up once it is
        #       implemented so students are alerted when their report is ready.
        return {
            "submissionId": submission_id,
            "status": "completed",
            "grade": classification["grade"],
            "percentage": classification["percentage"],
            "student_level": classification.get("student_level", "intermediate"),
            "breakdown": classification["breakdown"],
            "metrics": metrics.model_dump(),
            "reportUrl": f"/reports/{os.path.basename(pdf_path)}",
            "analyzedAt": analyzed_at,
            "analyzedIn": analyzed_in,
        }

    except Exception as e:
        return {
            "submissionId": submission_id,
            "status": "failed",
            "errorMessage": str(e),
        }

    finally:
        # Always cleanup cloned repo
        if repo_path:
            git_handler.cleanup(repo_path)
