"""Tests for report_generator module."""

import pytest
from unittest.mock import patch, MagicMock
from core import report_generator
from models.metrics_schema import MetricsSchema, MetricDetail


def _make_metrics(**overrides) -> MetricsSchema:
    defaults = dict(
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
    defaults.update(overrides)
    return MetricsSchema(**defaults)


def _make_classification(**overrides) -> dict:
    defaults = dict(
        grade="B",
        percentage=80.0,
        student_level="intermediate",
        breakdown={"solid": {"score": 4.0, "max": 5.0, "weighted_contribution": 16.0}},
    )
    defaults.update(overrides)
    return defaults


class TestGenerate:
    """Tests for PDF report generation."""

    @patch("core.report_generator.subprocess.run")
    def test_successful_generation(self, mock_run):
        """Should generate PDF and return a path ending in the submission ID."""
        mock_run.return_value = MagicMock(returncode=0, stderr="")

        result = report_generator.generate(
            123,
            "https://github.com/user/repo",
            _make_metrics(),
            _make_classification(),
            "2026-04-01T12:00:00Z",
        )

        assert result.endswith("123.pdf")
        # Only one subprocess call: Typst compilation (AI enhancement was removed)
        assert mock_run.call_count == 1

    @patch("core.report_generator.subprocess.run")
    def test_typst_compilation_failure(self, mock_run):
        """Should raise RuntimeError on Typst compilation failure."""
        mock_run.return_value = MagicMock(returncode=1, stderr="Compilation error")

        with pytest.raises(RuntimeError, match="Typst compilation failed"):
            report_generator.generate(
                456,
                "https://github.com/user/repo",
                _make_metrics(),
                _make_classification(grade="C", percentage=60.0, breakdown={}),
                "2026-04-01T12:00:00Z",
            )

    @patch("core.report_generator.subprocess.run")
    def test_generate_with_architecture_data(self, mock_run):
        """Should not raise when architecture and class diagram data are present."""
        mock_run.return_value = MagicMock(returncode=0, stderr="")

        # Build via model_dump + update so all validators run and Pydantic
        # objects are properly created (model_copy bypasses validators).
        base = _make_metrics().model_dump()
        base.update(
            architecture_components=[
                {"id": "Server", "label": "Server", "type": "server"},
                {"id": "Client", "label": "Client", "type": "client"},
            ],
            architecture_connections=[
                {"source": "Client", "target": "Server", "label": "calls"},
            ],
            class_diagram=[
                {
                    "name": "MyClass",
                    "type": "class",
                    "fields": ["String name"],
                    "methods": ["getName()"],
                    "relationships": [],
                }
            ],
        )
        metrics = MetricsSchema(**base)

        result = report_generator.generate(
            789,
            "https://github.com/user/repo",
            metrics,
            _make_classification(),
            "2026-04-01T12:00:00Z",
        )

        assert result.endswith("789.pdf")
