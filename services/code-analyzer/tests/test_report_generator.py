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
        mock_run.return_value = MagicMock(returncode=0, stderr="")

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
        mock_run.assert_called_once()

    @patch("core.report_generator.subprocess.run")
    def test_typst_compilation_failure(self, mock_run):
        """Should raise error on Typst compilation failure"""
        mock_run.return_value = MagicMock(returncode=1, stderr="Compilation error")

        metrics = MetricsSchema(
            solid=MetricDetail(score=3.0, notes="OK"),
            clean_code=MetricDetail(score=3.0, notes="OK"),
            oop=MetricDetail(score=3.0, notes="OK"),
            error_handling=MetricDetail(score=3.0, notes="OK"),
            testing=MetricDetail(score=3.0, notes="OK"),
            documentation=MetricDetail(score=3.0, notes="OK"),
            complexity=MetricDetail(score=3.0, notes="OK"),
        )

        classification = {"grade": "C", "percentage": 60.0, "breakdown": {}}

        with pytest.raises(RuntimeError, match="Typst compilation failed"):
            report_generator.generate(
                456,
                "https://github.com/user/repo",
                metrics,
                classification,
                "2026-04-01T12:00:00Z",
            )
