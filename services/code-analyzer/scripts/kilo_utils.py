"""Shared utilities for kilo CLI wrapper scripts."""

import json
import re


def extract_json(output: str, anchor_key: str) -> dict:
    """Extract a JSON object from kilo CLI output.

    Strategy:
    1. Strip common markdown code-fence wrappers that models sometimes emit
       around their JSON output (e.g. `` ```json … ``` ``).
    2. Scan the cleaned output for the first ``{`` and attempt a
       ``json.JSONDecoder.raw_decode()`` from that position.
       ``raw_decode`` stops exactly at the end of the first valid JSON value,
       so trailing model commentary never causes "extra data" errors.
    3. Only accept an object that contains *anchor_key* so that preamble JSON
       blobs (e.g. tool-call results) are skipped.

    Args:
        output: Raw stdout from the kilo CLI.
        anchor_key: A key expected in the target JSON object (e.g. ``"solid"``).

    Returns:
        Parsed dictionary.

    Raises:
        RuntimeError: If no valid JSON object containing *anchor_key* can be
            extracted from *output*.
    """
    cleaned = _strip_ansi(output)
    cleaned = _strip_markdown_fences(cleaned)
    cleaned = _sanitize_json_strings(cleaned)
    decoder = json.JSONDecoder()

    for i, char in enumerate(cleaned):
        if char != "{":
            continue
        try:
            obj, _ = decoder.raw_decode(cleaned, i)
            if isinstance(obj, dict) and anchor_key in obj:
                return obj
        except json.JSONDecodeError:
            continue

    raise RuntimeError(
        f"Could not extract valid JSON (anchor key: {anchor_key!r}) from kilo output:\n"
        f"{output[:2000]}"
    )


def _strip_ansi(text: str) -> str:
    """Remove ANSI escape sequences (colors, cursor movement) from text."""
    return re.sub(r"\x1b\[[0-9;]*[A-Za-z]|\x1b[@-_][0-9;]*[A-Za-z]?", "", text)


def _sanitize_json_strings(text: str) -> str:
    """Replace literal newlines/carriage-returns inside JSON string values with escape sequences."""
    result = []
    in_string = False
    escape = False
    for char in text:
        if escape:
            result.append(char)
            escape = False
        elif char == "\\":
            result.append(char)
            escape = True
        elif char == '"':
            result.append(char)
            in_string = not in_string
        elif in_string and char == "\n":
            result.append("\\n")
        elif in_string and char == "\r":
            result.append("\\r")
        else:
            result.append(char)
    return "".join(result)


def _strip_markdown_fences(text: str) -> str:
    """Remove markdown code-fence wrappers if present.

    Handles both `` ```json … ``` `` and plain `` ``` … ``` `` variants.
    Returns the inner content, or the original string unchanged if no fences
    are found.
    """
    match = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", text, re.DOTALL)
    if match:
        return match.group(1)
    return text
