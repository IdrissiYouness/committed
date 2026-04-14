"""Git repository handler for cloning and managing code repositories."""

import logging
import os
import re
import shutil
import subprocess

from config import Config

logger = logging.getLogger(__name__)


def validate_url(url: str) -> None:
    """Validate that *url* is from an allowed host and has a proper path.

    The list of accepted host prefixes is driven by ``Config.ALLOWED_HOSTS`` so
    that self-hosted instances (Gitea, Bitbucket, …) can be enabled without
    changing code.

    Raises:
        ValueError: If the URL host is not in the allow-list or the path does
            not look like ``/<owner>/<repo>``.
    """
    if not any(url.startswith(h) for h in Config.ALLOWED_HOSTS):
        allowed = ", ".join(Config.ALLOWED_HOSTS)
        raise ValueError(
            f"Repository URL must start with one of: {allowed}. Got: {url}"
        )

    # Require at least two non-empty path segments after the host.
    if not re.match(r"^https?://[^/]+/[^/]+/[^/]+", url):
        raise ValueError(f"URL does not look like a valid repository: {url}")


def clone(repo_url: str, submission_id: int) -> str:
    """Clone *repo_url* into a temporary directory.

    Uses a shallow clone (depth = ``Config.CLONE_DEPTH``) to keep the operation
    fast while still fetching enough history for commit hygiene analysis.

    Args:
        repo_url: URL of the repository to clone.
        submission_id: Unique identifier for this submission (used as directory
            name to avoid collisions).

    Returns:
        Absolute path to the cloned repository.

    Raises:
        ValueError: If the URL fails validation.
        RuntimeError: If ``git clone`` exits with a non-zero status.
    """
    validate_url(repo_url)
    target = os.path.join(Config.TEMP_DIR, f"sub_{submission_id}")

    if os.path.exists(target):
        shutil.rmtree(target)

    os.makedirs(Config.TEMP_DIR, exist_ok=True)

    # TODO: Consider adding a repo size guard (e.g. reject repos over 200 MB)
    #       to prevent runaway disk usage when students commit large binaries.
    logger.info("Cloning %s (depth=%d) → %s", repo_url, Config.CLONE_DEPTH, target)
    result = subprocess.run(
        ["git", "clone", "--depth", str(Config.CLONE_DEPTH), repo_url, target],
        timeout=Config.CLONE_TIMEOUT,
        capture_output=True,
        text=True,
    )

    if result.returncode != 0:
        raise RuntimeError(f"Git clone failed: {result.stderr.strip()}")

    logger.info("Clone complete: %s", target)
    return target


def cleanup(path: str) -> None:
    """Remove the cloned repository directory.

    Silently ignores missing paths so the pipeline ``finally`` block is safe
    to call unconditionally.
    """
    if path and os.path.exists(path):
        shutil.rmtree(path, ignore_errors=True)
        logger.debug("Cleaned up %s", path)
