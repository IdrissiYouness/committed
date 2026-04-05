"""Pipeline-level checks for student level and report enhancement integration."""

from unittest.mock import patch

from core import pipeline


@patch("core.pipeline.git_handler.cleanup")
@patch("core.pipeline.report_generator.generate")
@patch("core.pipeline.classifier.classify")
@patch("core.pipeline.metrics_parser.parse")
@patch("core.pipeline.agent_runner.get_runner")
@patch("core.pipeline.git_handler.clone")
def test_pipeline_returns_student_level_in_classification(
    mock_clone,
    mock_get_runner,
    mock_parse,
    mock_classify,
    mock_generate,
    mock_cleanup,
):
    """Pipeline returns completed result while preserving new classification shape."""
    mock_clone.return_value = "/tmp/repo"

    mock_runner = mock_get_runner.return_value
    mock_runner.run.return_value = {"raw": "metrics"}

    class _MockMetrics:
        def model_dump(self):
            return {"feedback": "ok", "recommendations": []}

    mock_metrics = _MockMetrics()
    mock_parse.return_value = mock_metrics

    mock_classify.return_value = {
        "grade": "B",
        "percentage": 72.4,
        "student_level": "intermediate",
        "breakdown": {
            "solid": {"score": 3.5, "max": 5.0, "weighted_contribution": 14.0}
        },
    }

    mock_generate.return_value = "/tmp/reports/123.pdf"

    result = pipeline.run_analysis(123, "https://github.com/example/repo")

    assert result["status"] == "completed"
    assert result["grade"] == "B"
    assert result["percentage"] == 72.4
    assert result["student_level"] == "intermediate"
    assert "breakdown" in result
    assert result["reportUrl"] == "/reports/123.pdf"

    mock_generate.assert_called_once()
    _, _, _, classification_arg, _ = mock_generate.call_args[0]
    assert classification_arg["student_level"] == "intermediate"

    mock_cleanup.assert_called_once_with("/tmp/repo")
