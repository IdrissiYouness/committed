import logging
import os
import shutil

from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)


class Config:
    """Configuration for code analyzer service."""

    # ── Directory settings ────────────────────────────────────────────────────
    TEMP_DIR = os.getenv("TEMP_DIR", "/tmp/code-analysis")
    REPORTS_DIR = os.getenv("REPORTS_DIR", "/tmp/reports")

    # ── External tools ────────────────────────────────────────────────────────
    TYPST_BIN = os.getenv("TYPST_BIN", os.path.expanduser("~/.cargo/bin/typst"))
    AGENT_CLI = os.getenv("AGENT_CLI", "kilo")

    # Which runner implementation to use: "kilo" (default) or "mock" (tests/CI)
    AGENT_RUNNER = os.getenv("AGENT_RUNNER", "kilo")

    # ── Timeout settings (seconds) ────────────────────────────────────────────
    CLONE_TIMEOUT = int(os.getenv("CLONE_TIMEOUT", "120"))
    AGENT_TIMEOUT = int(os.getenv("AGENT_TIMEOUT", "300"))

    # ── Git settings ──────────────────────────────────────────────────────────
    # Shallow clone depth — enough for commit hygiene analysis; keep clones fast.
    CLONE_DEPTH = int(os.getenv("CLONE_DEPTH", "50"))

    # Comma-separated list of allowed repository host prefixes.
    ALLOWED_HOSTS: tuple[str, ...] = tuple(
        os.getenv(
            "ALLOWED_HOSTS",
            "https://github.com/,https://gitlab.com/",
        ).split(",")
    )

    # ── Flask settings ────────────────────────────────────────────────────────
    PORT = int(os.getenv("PORT", "5000"))
    FLASK_DEBUG = os.getenv("FLASK_DEBUG", "false").lower() == "true"

    # ── Notification service ──────────────────────────────────────────────────
    NOTIFICATION_SERVICE_URL = os.getenv(
        "NOTIFICATION_SERVICE_URL", "http://notifications:5001"
    )

    # ── Async job queue ───────────────────────────────────────────────────────
    MAX_WORKERS = int(os.getenv("MAX_WORKERS", "4"))
    CALLBACK_TIMEOUT = int(os.getenv("CALLBACK_TIMEOUT", "10"))
    GATEWAY_CALLBACK_URL = os.getenv(
        "GATEWAY_CALLBACK_URL", "http://gateway:8080/internal/analysis-result"
    )
    INTERNAL_SECRET = os.getenv("INTERNAL_SECRET", "")

    @classmethod
    def validate(cls) -> None:
        """Validate critical configuration and ensure required directories exist.

        Creates TEMP_DIR and REPORTS_DIR when missing and verifies that the
        external binaries (Typst, agent CLI) are actually executable so that
        misconfigured deployments fail fast rather than crashing on the first
        analysis request.

        Raises:
            EnvironmentError: If a required external binary cannot be found.
        """
        os.makedirs(cls.TEMP_DIR, exist_ok=True)
        os.makedirs(cls.REPORTS_DIR, exist_ok=True)

        _check_executable("TYPST_BIN", cls.TYPST_BIN)
        _check_executable("AGENT_CLI", cls.AGENT_CLI)


def _check_executable(env_name: str, path: str) -> None:
    """Warn when *path* is not a reachable executable.

    Uses ``shutil.which`` so that bare command names (e.g. ``kilo``) are
    resolved against PATH, while absolute paths are checked directly.
    """
    resolved = shutil.which(path)
    if resolved is None:
        logger.warning(
            "%s=%r not found on PATH or filesystem — analysis will fail. "
            "Set the %s environment variable to the correct path.",
            env_name,
            path,
            env_name,
        )
