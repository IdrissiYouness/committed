"""AI agent runner for code analysis."""

import json
import logging
import os
import subprocess
from abc import ABC, abstractmethod

from config import Config

logger = logging.getLogger(__name__)


class BaseRunner(ABC):
    """Abstract interface for AI agent runners."""

    @abstractmethod
    def run(self, repo_path: str) -> dict:
        """Run analysis on the repository at *repo_path*.

        Args:
            repo_path: Absolute path to the cloned repository.

        Returns:
            Dictionary containing raw metrics data from the agent.
        """
        raise NotImplementedError


class KiloCodeRunner(BaseRunner):
    """Runner that delegates to the Kilo Code CLI via a subprocess wrapper."""

    def run(self, repo_path: str) -> dict:
        """Run the Kilo Code CLI analyzer on *repo_path*."""
        script_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        wrapper_path = os.path.join(script_dir, "scripts", "kilo-analyze-wrapper.py")

        if not os.path.exists(wrapper_path):
            raise RuntimeError(f"Kilo analyzer wrapper not found at {wrapper_path}")

        logger.info("Starting Kilo analysis for %s", repo_path)
        result = subprocess.run(
            ["python3", wrapper_path, repo_path],
            timeout=Config.AGENT_TIMEOUT,
            capture_output=True,
            text=True,
            cwd=script_dir,
        )

        if result.returncode != 0:
            raise RuntimeError(f"Kilo analyzer failed: {result.stderr}")

        stdout = result.stdout.strip()
        if not stdout:
            raise RuntimeError("Kilo analyzer produced no output")

        logger.info("Kilo analysis complete for %s", repo_path)
        return json.loads(stdout)


class MockRunner(BaseRunner):
    """Deterministic runner for testing and CI environments.

    Returns a minimal but structurally valid metrics payload so the rest of the
    pipeline (parser → classifier → report generator) can be exercised without
    a live Kilo CLI or network access.

    Set ``AGENT_RUNNER=mock`` in the environment to activate this runner.
    """

    def run(self, repo_path: str) -> dict:
        logger.info("MockRunner: returning stub metrics for %s", repo_path)
        return {
            "solid": {"score": 3.0, "notes": "Mock analysis.", "confidence": 0.5},
            "clean_code": {"score": 3.0, "notes": "Mock analysis.", "confidence": 0.5},
            "oop": {"score": 3.0, "notes": "Mock analysis.", "confidence": 0.5},
            "error_handling": {"score": 3.0, "notes": "Mock analysis.", "confidence": 0.5},
            "testing": {"score": 3.0, "notes": "Mock analysis.", "confidence": 0.5},
            "documentation": {"score": 3.0, "notes": "Mock analysis.", "confidence": 0.5},
            "complexity": {"score": 3.0, "notes": "Mock analysis.", "confidence": 0.5},
            "feedback": "This is a mock analysis for testing purposes.",
            "encouragement": "Keep up the great work!",
            "positives": ["Code is structured."],
            "recommendations": [
                {
                    "title": "Add tests",
                    "description": "Increase test coverage.",
                    "priority": "medium",
                    "effort": "~1h",
                }
            ],
            "quick_wins": [],
            "performance_hints": [],
            "per_file": [],
            "dependencies": {"total": 0, "outdated": 0, "vulnerable": 0, "unused": 0, "details": []},
            "duplication_score": 0.0,
            "accessibility_score": 0.0,
            "architecture_components": [],
            "architecture_connections": [],
            "class_diagram": [],
        }


def get_runner() -> BaseRunner:
    """Return the configured runner implementation.

    The runner is selected via the ``AGENT_RUNNER`` environment variable:
    - ``"kilo"`` (default) — uses the live Kilo Code CLI.
    - ``"mock"`` — returns deterministic stub data; suitable for tests/CI.
    """
    runner_type = Config.AGENT_RUNNER.lower()
    if runner_type == "mock":
        logger.info("Using MockRunner (AGENT_RUNNER=mock)")
        return MockRunner()
    return KiloCodeRunner()
