from flask import Flask, jsonify, request
from datetime import datetime
import os

app = Flask(__name__)

# Configuration - No database needed, Gateway sends all required data
app.config['OPENAI_API_KEY'] = os.getenv('OPENAI_API_KEY', '')
app.config['TEMP_CLONE_DIR'] = os.getenv('TEMP_CLONE_DIR', '/tmp/code-analysis')
app.config['NOTIFICATION_SERVICE_URL'] = os.getenv('NOTIFICATION_SERVICE_URL', 'http://notifications:5001')


@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        'status': 'UP',
        'service': 'code-analyzer',
        'timestamp': datetime.utcnow().isoformat() + 'Z'
    })


@app.route('/analyze', methods=['POST'])
def analyze():
    """
    Code analysis endpoint.
    
    Receives submission data from Gateway (no database access needed).
    Gateway sends all necessary information in the request body.
    
    Expected request body:
    {
        "submissionId": "123",
        "studentId": "456",
        "repoUrl": "https://github.com/user/repo",
        "assignmentId": "789",
        "criteria": ["code_quality", "tests", "documentation"]
    }
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                'status': 'error',
                'message': 'No JSON data provided',
                'timestamp': datetime.utcnow().isoformat() + 'Z'
            }), 400
        
        # Extract submission info from request (sent by Gateway)
        submission_id = data.get('submissionId')
        student_id = data.get('studentId')
        repo_url = data.get('repoUrl')
        
        if not all([submission_id, repo_url]):
            return jsonify({
                'status': 'error',
                'message': 'Missing required fields: submissionId, repoUrl',
                'timestamp': datetime.utcnow().isoformat() + 'Z'
            }), 400
        
        # TODO: Implement actual code analysis logic here
        # 1. Clone the repository
        # 2. Run analysis (linting, tests, AI feedback)
        # 3. Return results to Gateway
        
        # Placeholder response
        return jsonify({
            'status': 'received',
            'message': 'Analysis request received - implementation pending',
            'submissionId': submission_id,
            'studentId': student_id,
            'repoUrl': repo_url,
            'timestamp': datetime.utcnow().isoformat() + 'Z'
        })
        
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e),
            'timestamp': datetime.utcnow().isoformat() + 'Z'
        }), 500


@app.route('/status/<submission_id>', methods=['GET'])
def get_status(submission_id):
    """
    Get analysis status for a submission.
    
    In a real implementation, this would check the analysis progress.
    For now, returns a placeholder response.
    """
    return jsonify({
        'submissionId': submission_id,
        'status': 'pending',
        'message': 'Status endpoint - implementation pending',
        'timestamp': datetime.utcnow().isoformat() + 'Z'
    })


if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=os.getenv('FLASK_DEBUG', 'false').lower() == 'true')
