"""Tests for AI-enhanced report content generation."""

from unittest.mock import MagicMock, patch

from core.report_generator import enhance_content_with_ai
from models.metrics_schema import MetricDetail, MetricsSchema


def _make_metrics() -> MetricsSchema:
    return MetricsSchema(
        solid=MetricDetail(score=3.0, notes="Decent"),
        clean_code=MetricDetail(score=2.8, notes="Some naming issues"),
        oop=MetricDetail(score=3.1, notes="Good encapsulation"),
        error_handling=MetricDetail(score=2.2, notes="Missing edge cases"),
        testing=MetricDetail(score=2.5, notes="Minimal tests"),
        documentation=MetricDetail(score=2.7, notes="Could be clearer"),
        complexity=MetricDetail(score=3.2, notes="Mostly manageable"),
        feedback="Solid start, but testing and error handling need attention.",
        recommendations=["Increase test coverage", "Handle edge cases"],
    )


@patch("core.report_generator.subprocess.run")
def test_enhance_content_returns_valid_dict(mock_run):
    """Returns parsed enhanced content when wrapper succeeds."""
    mock_run.return_value = MagicMock(
        returncode=0,
        stdout=(
            '{"feedback":"Personalized feedback",'
            '"recommendations":["Action 1","Action 2"],'
            '"encouragement":"Keep it up"}'
        ),
    )

    metrics = _make_metrics()
    classification = {
        "grade": "B",
        "percentage": 74.2,
        "student_level": "intermediate",
    }

    enhanced = enhance_content_with_ai(metrics, classification)

    assert enhanced is not None
    assert enhanced["feedback"] == "Personalized feedback"
    assert len(enhanced["recommendations"]) == 2
    assert enhanced["encouragement"] == "Keep it up"


@patch("core.report_generator.subprocess.run")
def test_enhance_content_falls_back_on_invalid_json(mock_run):
    """Returns None when wrapper output is invalid JSON."""
    mock_run.return_value = MagicMock(returncode=0, stdout="not-json")

    metrics = _make_metrics()
    classification = {
        "grade": "C",
        "percentage": 61.0,
        "student_level": "intermediate",
    }

    enhanced = enhance_content_with_ai(metrics, classification)
    assert enhanced is None


@patch("core.report_generator.subprocess.run")
def test_enhance_content_falls_back_when_wrapper_fails(mock_run):
    """Returns None when wrapper process exits non-zero."""
    mock_run.return_value = MagicMock(returncode=1, stderr="wrapper failed")

    metrics = _make_metrics()
    classification = {
        "grade": "D",
        "percentage": 43.0,
        "student_level": "beginner",
    }

    enhanced = enhance_content_with_ai(metrics, classification)
    assert enhanced is None
