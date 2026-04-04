"""Base runner interface and concrete implementations for AI agent execution"""

import os
import json
import subprocess
from typing import Dict, Any
from abc import ABC, abstractmethod
from config import Config


class BaseRunner(ABC):
    """Base interface for AI agent runners"""

    @abstractmethod
    def run(self, repo_path: str) -> Dict[str, Any]:
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

    def run(self, repo_path: str) -> Dict[str, Any]:
        """Run Kilo Code CLI on the repository"""
        result = subprocess.run(
            [Config.AGENT_CLI, "analyze", repo_path, "--output", "json"],
            timeout=Config.AGENT_TIMEOUT,
            capture_output=True,
            text=True,
        )

        if result.returncode != 0:
            raise RuntimeError(f"Agent failed: {result.stderr}")

        return json.loads(result.stdout)


class OpenAIRunner(BaseRunner):
    """Runner that uses OpenAI API directly for analysis"""

    # File sampling configuration
    SKIP_DIRS = {
        ".git",
        "node_modules",
        "vendor",
        "__pycache__",
        ".venv",
        "dist",
        "build",
    }
    CODE_EXTS = {
        ".py",
        ".js",
        ".ts",
        ".java",
        ".php",
        ".cs",
        ".go",
        ".rb",
        ".cpp",
        ".c",
    }
    MAX_FILES = 50
    MAX_LINES = 200

    def __init__(self):
        """Initialize OpenAI client"""
        from openai import OpenAI

        self.client = OpenAI(api_key=Config.OPENAI_API_KEY)

    def sample_files(self, repo_path: str) -> str:
        """
        Walk repo and collect up to MAX_FILES source files, cap each at MAX_LINES.

        Args:
            repo_path: Path to the repository

        Returns:
            String containing sampled file contents
        """
        snippets = []
        count = 0

        for root, dirs, files in os.walk(repo_path):
            # Skip unwanted directories
            dirs[:] = [d for d in dirs if d not in self.SKIP_DIRS]

            for fname in files:
                if count >= self.MAX_FILES:
                    break

                if os.path.splitext(fname)[1] in self.CODE_EXTS:
                    full = os.path.join(root, fname)
                    rel = os.path.relpath(full, repo_path)

                    try:
                        with open(full, "r", errors="ignore") as f:
                            lines = f.readlines()[: self.MAX_LINES]
                        snippets.append(f"### {rel}\n{''.join(lines)}")
                        count += 1
                    except Exception:
                        # Skip files that can't be read
                        continue

        return "\n\n".join(snippets)

    def run(self, repo_path: str) -> Dict[str, Any]:
        """Run OpenAI analysis on the repository"""
        code_sample = self.sample_files(repo_path)

        prompt = (
            """You are a senior software engineer performing a code review.
Analyze the following codebase and return ONLY valid JSON (no prose, no markdown fences)
matching this exact schema:

{
  "solid":          { "score": <float 0-5>, "notes": "<1-2 sentences>" },
  "clean_code":     { "score": <float 0-5>, "notes": "<1-2 sentences>" },
  "oop":            { "score": <float 0-5>, "notes": "<1-2 sentences>" },
  "error_handling": { "score": <float 0-5>, "notes": "<1-2 sentences>" },
  "testing":        { "score": <float 0-5>, "notes": "<1-2 sentences>" },
  "documentation":  { "score": <float 0-5>, "notes": "<1-2 sentences>" },
  "complexity":     { "score": <float 0-5>, "notes": "<1-2 sentences>" },
  "feedback":       "<3-5 sentence overall feedback paragraph>",
  "recommendations": ["<recommendation 1>", "<recommendation 2>", ...]
}

Codebase:
"""
            + code_sample
        )

        response = self.client.chat.completions.create(
            model="gpt-4",
            messages=[
                {
                    "role": "system",
                    "content": "You are a code review expert. Respond only with valid JSON.",
                },
                {"role": "user", "content": prompt},
            ],
            temperature=0.3,
        )

        content = response.choices[0].message.content
        return json.loads(content)


def get_runner() -> BaseRunner:
    """Factory function to get the configured runner"""
    if Config.AGENT_BACKEND == "kilocode":
        return KiloCodeRunner()
    elif Config.AGENT_BACKEND == "openai":
        return OpenAIRunner()
    else:
        raise ValueError(f"Unknown AGENT_BACKEND: {Config.AGENT_BACKEND}")
