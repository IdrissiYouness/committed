from flask import Flask, jsonify, request, send_from_directory
from datetime import datetime
import os
from config import Config

app = Flask(__name__)

# Validate configuration on startup
try:
    Config.validate()
except Exception as e:
    print(f"Configuration error: {e}")
    # Continue with warnings, but log the issue


@app.route("/health", methods=["GET"])
def health():
    """Health check endpoint"""
    return jsonify(
        {
            "status": "UP",
            "service": "code-analyzer",
            "timestamp": datetime.utcnow().isoformat() + "Z",
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
        "breakdown": {...},
        "metrics": {...},
        "reportUrl": "/reports/123.pdf",
        "analyzedAt": "2026-04-01T12:00:00+00:00"
    }
    """
    try:
        data = request.get_json()

        if not data:
            return jsonify({"error": "Missing JSON body"}), 400

        submission_id = data.get("submissionId")
        repo_url = data.get("repoUrl")

        if not submission_id or not repo_url:
            return jsonify({"error": "submissionId and repoUrl are required"}), 400

        # TODO: Import and use pipeline.run_analysis()
        # from core.pipeline import run_analysis
        # result = run_analysis(int(submission_id), repo_url)
        # status_code = 200 if result["status"] == "completed" else 500
        # return jsonify(result), status_code

        # Placeholder response for now
        return jsonify(
            {
                "status": "received",
                "message": "Analysis request received - pipeline not yet implemented",
                "submissionId": submission_id,
                "repoUrl": repo_url,
                "timestamp": datetime.utcnow().isoformat() + "Z",
            }
        )

    except Exception as e:
        return jsonify({"status": "failed", "error": str(e)}), 500


@app.route("/reports/<path:filename>", methods=["GET"])
def serve_report(filename):
    """Serve generated PDF reports"""
    return send_from_directory(Config.REPORTS_DIR, filename)


if __name__ == "__main__":
    port = Config.PORT
    app.run(host="0.0.0.0", port=port, debug=Config.FLASK_DEBUG)
