"""Tests for metrics_parser module"""

import pytest
from core import metrics_parser


class TestParse:
    """Tests for metrics parsing"""

    def test_full_valid_input(self):
        """Should parse complete valid metrics"""
        raw = {
            "solid": {"score": 4.0, "notes": "Good separation"},
            "clean_code": {"score": 3.5, "notes": "Minor issues"},
            "oop": {"score": 4.5, "notes": "Well structured"},
            "error_handling": {"score": 3.0, "notes": "Basic handling"},
            "testing": {"score": 2.0, "notes": "Few tests"},
            "documentation": {"score": 3.0, "notes": "Adequate docs"},
            "complexity": {"score": 4.0, "notes": "Low complexity"},
            "feedback": "Good overall",
            "recommendations": ["Add more tests", "Improve docs"],
        }

        result = metrics_parser.parse(raw)

        assert result.solid.score == 4.0
        assert result.testing.score == 2.0
        assert len(result.recommendations) == 2

    def test_missing_keys(self):
        """Should handle missing keys with defaults"""
        raw = {"solid": {"score": 3.0, "notes": "OK"}}

        result = metrics_parser.parse(raw)

        assert result.solid.score == 3.0
        assert result.testing.score == 0.0
        assert result.testing.notes == "Could not evaluate."

    def test_bare_numbers(self):
        """Should handle bare numeric scores"""
        raw = {"solid": 4.0, "clean_code": 3}

        result = metrics_parser.parse(raw)

        assert result.solid.score == 4.0
        assert result.clean_code.score == 3.0
