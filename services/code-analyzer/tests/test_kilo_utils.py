"""Tests for kilo_utils JSON extraction helpers."""

import pytest
from scripts.kilo_utils import extract_json, _strip_markdown_fences


class TestStripMarkdownFences:
    """Tests for markdown fence stripping."""

    def test_strips_json_fence(self):
        """Should extract content from ```json ... ``` wrapper."""
        text = '```json\n{"solid": 3.0}\n```'
        result = _strip_markdown_fences(text)
        assert result.strip() == '{"solid": 3.0}'

    def test_strips_plain_fence(self):
        """Should extract content from plain ``` ... ``` wrapper."""
        text = '```\n{"solid": 3.0}\n```'
        result = _strip_markdown_fences(text)
        assert result.strip() == '{"solid": 3.0}'

    def test_no_fence_unchanged(self):
        """Should return the original string when no fences are present."""
        text = '{"solid": 3.0}'
        assert _strip_markdown_fences(text) == text

    def test_empty_string(self):
        """Should handle empty input without error."""
        assert _strip_markdown_fences("") == ""


class TestExtractJson:
    """Tests for extract_json."""

    def test_bare_json(self):
        """Should parse a bare JSON object."""
        output = '{"solid": {"score": 4.0}, "feedback": "ok"}'
        result = extract_json(output, anchor_key="solid")
        assert result["solid"]["score"] == 4.0

    def test_json_with_leading_text(self):
        """Should skip preamble text and find the JSON object."""
        output = 'Here is the analysis:\n{"solid": {"score": 3.0}, "feedback": "x"}'
        result = extract_json(output, anchor_key="solid")
        assert result["solid"]["score"] == 3.0

    def test_json_wrapped_in_markdown_fences(self):
        """Should extract JSON from markdown code-fence wrapper."""
        output = '```json\n{"solid": {"score": 2.5}, "feedback": "y"}\n```'
        result = extract_json(output, anchor_key="solid")
        assert result["solid"]["score"] == 2.5

    def test_json_with_trailing_commentary(self):
        """Should stop at end of JSON object, ignoring trailing text."""
        output = '{"solid": {"score": 1.0}, "feedback": "z"}\nSome extra commentary.'
        result = extract_json(output, anchor_key="solid")
        assert result["feedback"] == "z"

    def test_raises_when_anchor_key_missing(self):
        """Should raise RuntimeError if no object contains the anchor key."""
        output = '{"other_key": "value"}'
        with pytest.raises(RuntimeError, match="Could not extract"):
            extract_json(output, anchor_key="solid")

    def test_raises_on_invalid_json(self):
        """Should raise RuntimeError on completely invalid input."""
        with pytest.raises(RuntimeError, match="Could not extract"):
            extract_json("not json at all", anchor_key="solid")
