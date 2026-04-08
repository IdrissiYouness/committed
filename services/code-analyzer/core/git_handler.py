"""Git repository handler for cloning and managing code repositories"""

import os
import re
import shutil
import subprocess
from config import Config

ALLOWED_HOSTS = ("https://github.com/", "https://gitlab.com/")


def validate_url(url: str) -> None:
    """Validate that the URL is from an allowed host and has proper format"""
    if not any(url.startswith(h) for h in ALLOWED_HOSTS):
        raise ValueError(f"Only GitHub and GitLab URLs are accepted. Got: {url}")
    if not re.match(r"^https://(?:github|gitlab)\.com/[^/]+/[^/]+", url):
        raise ValueError(f"URL does not look like a valid repo: {url}")


def clone(repo_url: str, submission_id: int) -> str:
    """
    Clone a repository to a temporary directory.

    Args:
        repo_url: URL of the repository to clone
        submission_id: Unique identifier for this submission

    Returns:
        Path to the cloned repository

    Raises:
        ValueError: If URL is invalid
        RuntimeError: If git clone fails
    """
    validate_url(repo_url)
    target = os.path.join(Config.TEMP_DIR, f"sub_{submission_id}")

    # Clean up if directory already exists
    if os.path.exists(target):
        shutil.rmtree(target)

    os.makedirs(Config.TEMP_DIR, exist_ok=True)

    # Fetch enough history for commit hygiene analysis while keeping clones fast
    result = subprocess.run(
        ["git", "clone", "--depth", "50", repo_url, target],
        timeout=Config.CLONE_TIMEOUT,
        capture_output=True,
        text=True,
    )

    if result.returncode != 0:
        raise RuntimeError(f"Git clone failed: {result.stderr.strip()}")

    return target


def cleanup(path: str) -> None:
    """Remove cloned repository directory"""
    if path and os.path.exists(path):
        shutil.rmtree(path, ignore_errors=True)
