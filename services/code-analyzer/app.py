import logging
import os

from flask import Flask, jsonify, request, send_from_directory
from datetime import datetime, timezone

from config import Config
from core.pipeline import run_analysis

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)

# Validate configuration on startup; logs warnings for missing binaries.
try:
    Config.validate()
except Exception as e:
    logger.error("Configuration error on startup: %s", e)


@app.route("/health", methods=["GET"])
def health():
    """Health check endpoint."""
    return jsonify(
        {
            "status": "UP",
            "service": "code-analyzer",
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
    )


@app.route("/analyze", methods=["POST"])
def analyze():
    """
    Code analysis endpoint.

    Receives submission data from Gateway.

    Expected request body:
    {
        "submissionId": 123,
        "repoUrl": "https://github.com/user/repo",
        "studentId": 456
    }

    Returns:
    {
        "submissionId": 123,
        "status": "completed" | "failed",
        "grade": "A-F",
        "percentage": 73.4,
        "student_level": "advanced|intermediate|beginner",
        "breakdown": {...},
        "metrics": {...},
        "reportUrl": "/reports/123.pdf",
        "analyzedAt": "2026-04-01T12:00:00+00:00"
    }
    """
    # TODO: The gateway's MockAIAgentService currently simulates analysis and
    #       never calls this endpoint. Replace MockAIAgentService with a real
    #       HTTP call to this service, passing X-User-Id and X-User-Role headers
    #       so the pipeline has student context available.
    # TODO: Add a lightweight request guard (e.g. check a shared secret header)
    #       to ensure only the gateway can call /analyze — currently any process
    #       on the internal Docker network can trigger an analysis.
    try:
        data = request.get_json(force=True, silent=True)

        if not data:
            return jsonify({"error": "Missing JSON body"}), 400

        submission_id = data.get("submissionId")
        repo_url = data.get("repoUrl")
        student_id = data.get("studentId")

        if not submission_id or not repo_url:
            return jsonify({"error": "submissionId and repoUrl are required"}), 400

        try:
            submission_id = int(submission_id)
            if submission_id <= 0:
                raise ValueError
        except (TypeError, ValueError):
            return jsonify({"error": "submissionId must be a positive integer"}), 400

        # Keep studentId available for future context wiring.
        # Current pipeline infers student level from analysis metrics.
        # TODO: Once the gateway forwards X-User-Id on real calls, pass studentId
        #       into the pipeline so the analyzer can provide longitudinal feedback
        #       (e.g. "your testing score improved from 1.5 to 3.0 since last
        #       submission") by querying prior results from Core.
        _ = student_id

        result = run_analysis(submission_id, repo_url)
        status_code = 200 if result.get("status") == "completed" else 500
        return jsonify(result), status_code

    except Exception as e:
        logger.exception("Unhandled error in /analyze")
        return jsonify({"status": "failed", "errorMessage": str(e)}), 500


@app.route("/reports/<path:filename>", methods=["GET"])
def serve_report(filename: str):
    """Serve generated PDF reports.

    Only bare filenames ending in ``.pdf`` are served; path components and
    other extensions are rejected to prevent directory traversal.
    """
    # TODO: The gateway handles JWT auth at the network boundary and forwards
    #       X-User-Id / X-User-Role headers. Use these headers here to verify
    #       report ownership — a student should not be able to fetch another
    #       student's report by guessing the submissionId filename.
    safe_name = os.path.basename(filename)
    if safe_name != filename or not safe_name.endswith(".pdf"):
        return jsonify({"error": "Invalid report filename"}), 400

    return send_from_directory(Config.REPORTS_DIR, safe_name)


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=Config.PORT, debug=Config.FLASK_DEBUG)
