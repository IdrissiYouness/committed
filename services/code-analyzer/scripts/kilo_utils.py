"""Shared utilities for kilo CLI wrapper scripts"""

import json


def extract_json(output: str, anchor_key: str) -> dict:
    """
    Extract a JSON object from kilo CLI output.

    Uses json.JSONDecoder.raw_decode() to find the first valid JSON object
    that contains anchor_key, stopping exactly at the end of the object
    regardless of any trailing text the model may have appended.

    Falls back to a brace-counting scan if the first pass finds nothing.

    Args:
        output: Raw stdout from the kilo CLI
        anchor_key: A key expected in the target JSON object

    Returns:
        Parsed dictionary

    Raises:
        RuntimeError: If no valid JSON object can be extracted
    """
    decoder = json.JSONDecoder()

    # Scan for every '{' and attempt a raw_decode from that position.
    # raw_decode stops exactly at the end of the first valid JSON value,
    # so trailing model commentary never causes "extra data" errors.
    for i, char in enumerate(output):
        if char != "{":
            continue
        try:
            obj, _ = decoder.raw_decode(output, i)
            if isinstance(obj, dict) and anchor_key in obj:
                return obj
        except json.JSONDecodeError:
            continue

    raise RuntimeError(f"Could not extract valid JSON from kilo output:\n{output[:500]}")

