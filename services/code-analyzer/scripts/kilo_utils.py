"""Shared utilities for kilo CLI wrapper scripts"""

import json


def extract_json(output: str, anchor_key: str) -> dict:
    """
    Extract a JSON object from kilo CLI output.

    Tries three strategies in order:
    1. Regex search for an object containing anchor_key
    2. Parse the entire output directly
    3. Line-by-line scan with brace counting

    Args:
        output: Raw stdout from the kilo CLI
        anchor_key: A key expected in the target JSON object (used to anchor the regex)

    Returns:
        Parsed dictionary

    Raises:
        RuntimeError: If no valid JSON object can be extracted
    """
    import re

    # Strategy 1: find an object that contains the expected key
    match = re.search(r'\{[\s\S]*"' + re.escape(anchor_key) + r'"[\s\S]*\}', output)
    if match:
        return json.loads(match.group(0))

    # Strategy 2: try the whole output
    try:
        return json.loads(output.strip())
    except json.JSONDecodeError:
        pass

    # Strategy 3: scan line by line, use brace counting to find the object boundary
    lines = output.split("\n")
    for i, line in enumerate(lines):
        if line.strip().startswith("{"):
            candidate = "\n".join(lines[i:])
            brace_count = 0
            end_idx = -1
            for j, char in enumerate(candidate):
                if char == "{":
                    brace_count += 1
                elif char == "}":
                    brace_count -= 1
                    if brace_count == 0:
                        end_idx = j + 1
                        break
            if end_idx > 0:
                try:
                    return json.loads(candidate[:end_idx])
                except json.JSONDecodeError:
                    continue

    raise RuntimeError(f"Could not extract valid JSON from kilo output:\n{output}")
