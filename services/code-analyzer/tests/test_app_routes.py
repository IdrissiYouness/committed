"""Flask route integration tests with mocked dependencies."""

from unittest.mock import patch

from app import app


# ── /analyze ──────────────────────────────────────────────────────────────────


def test_analyze_route_success_returns_pipeline_payload():
    """POST /analyze returns 200 and pipeline payload on success."""
    client = app.test_client()

    payload = {
        "submissionId": 123,
        "repoUrl": "https://github.com/example/repo",
        "studentId": 456,
    }
    pipeline_result = {
        "submissionId": 123,
        "status": "completed",
        "grade": "B",
        "percentage": 72.4,
        "student_level": "intermediate",
        "breakdown": {
            "solid": {"score": 3.5, "max": 5.0, "weighted_contribution": 14.0}
        },
        "metrics": {"feedback": "Good progress", "recommendations": []},
        "reportUrl": "/reports/123.pdf",
        "analyzedAt": "2026-04-05T12:00:00+00:00",
    }

    with patch("app.run_analysis", return_value=pipeline_result) as mock_run:
        response = client.post("/analyze", json=payload)

    assert response.status_code == 200
    data = response.get_json()
    assert data["status"] == "completed"
    assert data["student_level"] == "intermediate"
    mock_run.assert_called_once_with(123, "https://github.com/example/repo")


def test_analyze_route_failure_returns_500():
    """POST /analyze returns 500 when pipeline returns failed status."""
    client = app.test_client()

    payload = {
        "submissionId": 555,
        "repoUrl": "https://github.com/example/repo",
    }
    pipeline_result = {
        "submissionId": 555,
        "status": "failed",
        "error": "Git clone failed",
    }

    with patch("app.run_analysis", return_value=pipeline_result) as mock_run:
        response = client.post("/analyze", json=payload)

    assert response.status_code == 500
    data = response.get_json()
    assert data["status"] == "failed"
    assert "error" in data
    mock_run.assert_called_once_with(555, "https://github.com/example/repo")


def test_analyze_missing_body_returns_400():
    """POST /analyze without a JSON body returns 400."""
    client = app.test_client()
    response = client.post("/analyze", data="not json", content_type="text/plain")
    assert response.status_code == 400


def test_analyze_missing_required_fields_returns_400():
    """POST /analyze with missing submissionId returns 400."""
    client = app.test_client()
    response = client.post("/analyze", json={"repoUrl": "https://github.com/x/y"})
    assert response.status_code == 400


def test_analyze_invalid_submission_id_returns_400():
    """POST /analyze with a non-integer submissionId returns 400."""
    client = app.test_client()
    response = client.post(
        "/analyze",
        json={"submissionId": "not-a-number", "repoUrl": "https://github.com/x/y"},
    )
    assert response.status_code == 400
    assert "positive integer" in response.get_json()["error"]


def test_analyze_negative_submission_id_returns_400():
    """POST /analyze with a negative submissionId returns 400."""
    client = app.test_client()
    response = client.post(
        "/analyze",
        json={"submissionId": -1, "repoUrl": "https://github.com/x/y"},
    )
    assert response.status_code == 400


# ── /reports ──────────────────────────────────────────────────────────────────


def test_serve_report_rejects_path_traversal():
    """GET /reports/<filename> must reject path components to prevent traversal."""
    client = app.test_client()
    response = client.get("/reports/../etc/passwd")
    assert response.status_code in (400, 404)


def test_serve_report_rejects_non_pdf():
    """GET /reports/<filename> must reject files that are not .pdf."""
    client = app.test_client()
    response = client.get("/reports/report.txt")
    assert response.status_code == 400


def test_serve_report_rejects_path_with_slash():
    """GET /reports/<filename> must reject filenames containing directory separators."""
    client = app.test_client()
    response = client.get("/reports/subdir/123.pdf")
    assert response.status_code == 400
