"""Tests for report_generator module"""

import pytest
from unittest.mock import patch, MagicMock
from core import report_generator
from models.metrics_schema import MetricsSchema, MetricDetail


class TestGenerate:
    """Tests for PDF report generation"""

    @patch("core.report_generator.subprocess.run")
    def test_successful_generation(self, mock_run):
        """Should generate PDF successfully"""
        # Mock returns different values for AI enhancement (fails) and Typst (succeeds)
        # First call: AI enhancement (returns non-zero to simulate fallback)
        # Second call: Typst compilation (succeeds)
        mock_run.side_effect = [
            MagicMock(returncode=1, stderr="AI not available"),  # AI enhancement fails
            MagicMock(returncode=0, stderr=""),  # Typst succeeds
        ]

        metrics = MetricsSchema(
            solid=MetricDetail(score=4.0, notes="Good"),
            clean_code=MetricDetail(score=4.0, notes="Good"),
            oop=MetricDetail(score=4.0, notes="Good"),
            error_handling=MetricDetail(score=4.0, notes="Good"),
            testing=MetricDetail(score=4.0, notes="Good"),
            documentation=MetricDetail(score=4.0, notes="Good"),
            complexity=MetricDetail(score=4.0, notes="Good"),
            feedback="Overall good code",
            recommendations=["Add more tests"],
        )

        classification = {
            "grade": "B",
            "percentage": 80.0,
            "student_level": "intermediate",
            "breakdown": {
                "solid": {"score": 4.0, "max": 5.0, "weighted_contribution": 16.0}
            },
        }

        result = report_generator.generate(
            123,
            "https://github.com/user/repo",
            metrics,
            classification,
            "2026-04-01T12:00:00Z",
        )

        assert result.endswith("123.pdf")
        # Should be called twice: AI enhancement + Typst compilation
        assert mock_run.call_count == 2

    @patch("core.report_generator.subprocess.run")
    def test_typst_compilation_failure(self, mock_run):
        """Should raise error on Typst compilation failure"""
        # First call: AI enhancement (fails)
        # Second call: Typst compilation (also fails)
        mock_run.side_effect = [
            MagicMock(returncode=1, stderr="AI not available"),
            MagicMock(returncode=1, stderr="Compilation error"),
        ]

        metrics = MetricsSchema(
            solid=MetricDetail(score=3.0, notes="OK"),
            clean_code=MetricDetail(score=3.0, notes="OK"),
            oop=MetricDetail(score=3.0, notes="OK"),
            error_handling=MetricDetail(score=3.0, notes="OK"),
            testing=MetricDetail(score=3.0, notes="OK"),
            documentation=MetricDetail(score=3.0, notes="OK"),
            complexity=MetricDetail(score=3.0, notes="OK"),
        )

        classification = {
            "grade": "C",
            "percentage": 60.0,
            "student_level": "intermediate",
            "breakdown": {},
        }

        with pytest.raises(RuntimeError, match="Typst compilation failed"):
            report_generator.generate(
                456,
                "https://github.com/user/repo",
                metrics,
                classification,
                "2026-04-01T12:00:00Z",
            )
