import logging
import os

from flask import Flask, jsonify, request, send_from_directory
from datetime import datetime, timezone

from config import Config
from core import job_queue
from core.pipeline import run_analysis, dispatch_result

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)

# Validate configuration on startup; logs warnings for missing binaries.
try:
    Config.validate()
except Exception as e:
    logger.error("Configuration error on startup: %s", e)

# Initialise the background thread pool.
job_queue.init(Config.MAX_WORKERS)


@app.route("/health", methods=["GET"])
def health():
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
    Accept a code analysis request and queue it for background execution.

    Expected request body:
    {
        "submissionId": 123,
        "repoUrl": "https://github.com/user/repo",
        "studentId": 456,
        "callbackUrl": "http://gateway:8080/internal/analysis-result"  (optional)
    }

    Returns 202 immediately. Result is POSTed to callbackUrl when done.
    Poll GET /analyze/<submissionId>/status as a fallback.
    """
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
        callback_url = data.get("callbackUrl", Config.GATEWAY_CALLBACK_URL)

        if not submission_id or not repo_url:
            return jsonify({"error": "submissionId and repoUrl are required"}), 400

        try:
            submission_id = int(submission_id)
            if submission_id <= 0:
                raise ValueError
        except (TypeError, ValueError):
            return jsonify({"error": "submissionId must be a positive integer"}), 400

        # Keep studentId available for future context wiring.
        # TODO: Once the gateway forwards X-User-Id on real calls, pass studentId
        #       into the pipeline so the analyzer can provide longitudinal feedback.
        _ = student_id

        def _run():
            result = run_analysis(submission_id, repo_url)
            job_queue.mark(submission_id, result["status"])
            dispatch_result(result, callback_url)

        accepted = job_queue.submit(submission_id, _run)
        if not accepted:
            return jsonify({"status": "already_queued", "submissionId": submission_id}), 409

        logger.info("[%s] analysis queued — %s", submission_id, repo_url)
        return jsonify({"status": "accepted", "submissionId": submission_id}), 202

    except Exception as e:
        logger.exception("Unhandled error in /analyze")
        return jsonify({"status": "failed", "errorMessage": str(e)}), 500


@app.route("/analyze/<int:submission_id>/status", methods=["GET"])
def analyze_status(submission_id: int):
    """Polling fallback — returns the current job state for a submission."""
    status = job_queue.get_status(submission_id)
    if status is None:
        return jsonify({"error": "Unknown submissionId"}), 404
    return jsonify({"submissionId": submission_id, "status": status})


@app.route("/reports/<path:filename>", methods=["GET"])
def serve_report(filename: str):
    """Serve generated PDF reports.

    Only bare filenames ending in ``.pdf`` are served; path components and
    other extensions are rejected to prevent directory traversal.
    """
    # TODO: Use X-User-Id / X-User-Role headers forwarded by the gateway to
    #       verify report ownership — a student should not fetch another's report.
    safe_name = os.path.basename(filename)
    if safe_name != filename or not safe_name.endswith(".pdf"):
        return jsonify({"error": "Invalid report filename"}), 400

    return send_from_directory(Config.REPORTS_DIR, safe_name)


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=Config.PORT, debug=Config.FLASK_DEBUG)
