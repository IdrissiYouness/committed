#!/usr/bin/env python3
"""
Kilo CLI wrapper for code quality analysis.
Called by KiloCodeRunner with the path to a cloned repository.

Usage: python kilo-analyze-wrapper.py <repo_path>
"""

import sys
import os
import subprocess
import json

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
SERVICE_ROOT = os.path.dirname(SCRIPT_DIR)
if SERVICE_ROOT not in sys.path:
    sys.path.insert(0, SERVICE_ROOT)

from config import Config
from scripts.kilo_utils import extract_json


def run_kilo_analyzer(repo_path: str) -> dict:
    if not os.path.isdir(repo_path):
        raise ValueError(f"Repository path does not exist: {repo_path}")

    original_dir = os.getcwd()
    # Run from service root so kilo discovers .kilo/agent/analyzer.md
    os.chdir(SERVICE_ROOT)

    try:
        cmd = [
            Config.AGENT_CLI,
            "run",
            "--agent",
            "analyzer",
            f"Analyze the code quality of the repository at {repo_path}. "
            f"Output ONLY the JSON analysis in the exact format specified. "
            f"Do not include markdown code blocks, just the raw JSON object.",
        ]

        print(f"Running: {' '.join(cmd)}", file=sys.stderr)

        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=300,
        )

        if result.returncode != 0:
            raise RuntimeError(
                f"Kilo command failed with code {result.returncode}: {result.stderr}"
            )

        return extract_json(result.stdout, anchor_key="solid")

    finally:
        os.chdir(original_dir)


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: kilo-analyze-wrapper.py <repo_path>", file=sys.stderr)
        sys.exit(1)

    try:
        result = run_kilo_analyzer(sys.argv[1])
        print(json.dumps(result, indent=2))
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)
