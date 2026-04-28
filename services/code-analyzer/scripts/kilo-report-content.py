#!/usr/bin/env python3
"""
Kilo CLI wrapper for generating personalized report content.
Called by report_generator with serialized analysis data as a JSON argument.

Usage: python kilo-report-content.py '<json_input>'
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


def generate_report_content(analysis_data: dict) -> dict:
    original_dir = os.getcwd()
    # Run from service root so kilo discovers .kilo/agent/report-content.md
    os.chdir(SERVICE_ROOT)

    try:
        prompt = (
            "Generate personalized report content for this code analysis:\n\n"
            + json.dumps(analysis_data, indent=2)
            + "\n\nOutput ONLY the JSON object with enhanced feedback, recommendations, "
            "and encouragement. Do not include markdown code blocks or any other text. "
            "Just the raw JSON object."
        )

        cmd = [Config.AGENT_CLI, "run", "--agent", "report-content", prompt]

        print("Running kilo report-content agent...", file=sys.stderr)

        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=30,
        )

        if result.returncode != 0:
            raise RuntimeError(
                f"Kilo command failed with code {result.returncode}: {result.stderr}"
            )

        return extract_json(result.stdout, anchor_key="feedback")

    finally:
        os.chdir(original_dir)


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: kilo-report-content.py '<json_input>'", file=sys.stderr)
        sys.exit(1)

    try:
        input_data = json.loads(sys.argv[1])
        result = generate_report_content(input_data)
        print(json.dumps(result, indent=2))
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)
