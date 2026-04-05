"""AI agent runner for code analysis"""

import os
import json
import subprocess
from abc import ABC, abstractmethod
from config import Config


class BaseRunner(ABC):
    """Base interface for AI agent runners"""

    @abstractmethod
    def run(self, repo_path: str) -> dict:
        """
        Run analysis on the repository.

        Args:
            repo_path: Path to the cloned repository

        Returns:
            Dictionary containing raw metrics data
        """
        raise NotImplementedError


class KiloCodeRunner(BaseRunner):
    """Runner that uses Kilo Code CLI for analysis"""

    def run(self, repo_path: str) -> dict:
        """Run Kilo Code CLI on the repository using the analyzer agent"""
        script_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        wrapper_path = os.path.join(script_dir, "scripts", "kilo-analyze-wrapper.py")

        if not os.path.exists(wrapper_path):
            raise RuntimeError(f"Kilo analyzer wrapper not found at {wrapper_path}")

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

        return json.loads(stdout)


def get_runner() -> BaseRunner:
    return KiloCodeRunner()
