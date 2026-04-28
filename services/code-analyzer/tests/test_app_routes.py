"""Flask route integration tests with mocked dependencies."""

from unittest.mock import patch

from app import app


# ── /analyze ──────────────────────────────────────────────────────────────────


def test_analyze_accepted_returns_202():
    """POST /analyze queues the job and returns 202 immediately."""
    client = app.test_client()

    payload = {
        "submissionId": 123,
        "repoUrl": "https://github.com/example/repo",
        "studentId": 456,
    }

    with patch("app.job_queue.submit", return_value=True):
        response = client.post("/analyze", json=payload)

    assert response.status_code == 202
    data = response.get_json()
    assert data["status"] == "accepted"
    assert data["submissionId"] == 123


def test_analyze_already_queued_returns_409():
    """POST /analyze returns 409 when the same submissionId is already in flight."""
    client = app.test_client()

    payload = {
        "submissionId": 123,
        "repoUrl": "https://github.com/example/repo",
    }

    with patch("app.job_queue.submit", return_value=False):
        response = client.post("/analyze", json=payload)

    assert response.status_code == 409
    data = response.get_json()
    assert data["status"] == "already_queued"
    assert data["submissionId"] == 123


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


# ── /analyze/<id>/status ──────────────────────────────────────────────────────


def test_analyze_status_returns_current_state():
    """GET /analyze/<id>/status returns the job's current state."""
    client = app.test_client()

    with patch("app.job_queue.get_status", return_value="running"):
        response = client.get("/analyze/123/status")

    assert response.status_code == 200
    data = response.get_json()
    assert data["submissionId"] == 123
    assert data["status"] == "running"


def test_analyze_status_unknown_returns_404():
    """GET /analyze/<id>/status returns 404 for an unknown submissionId."""
    client = app.test_client()

    with patch("app.job_queue.get_status", return_value=None):
        response = client.get("/analyze/999/status")

    assert response.status_code == 404


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
