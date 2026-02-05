# AI Analysis Service Development Skill

## Service Overview

**Service Name**: AI Analysis Service (Code Analyzer)  
**Technology**: Python Flask  
**Language**: Python 3.11+  
**Port**: 5000  
**IDE**: VSCode  
**Package Manager**: pip  
**Database**: None (receives data from Gateway via HTTP)

---

## Technology Stack & Versions

### Core Dependencies

```txt
Flask==3.0.0
Flask-CORS==4.0.0
requests==2.31.0
openai==1.6.1
python-dotenv==1.0.0
gunicorn==21.2.0
```

### Development Dependencies

```txt
pytest==7.4.3
pytest-cov==4.1.0
pytest-asyncio==0.21.1
black==23.12.1
flake8==7.0.0
mypy==1.8.0
```

---

## Project Structure

```
services/code-analyzer/
├── app.py                          # Flask application entry point
├── config.py                       # Configuration management
├── requirements.txt                  # Python dependencies
├── requirements-dev.txt             # Development dependencies
├── Dockerfile                       # Docker build instructions
├── .env.example                    # Environment template
├── .env                            # Environment variables (not committed)
├── .gitignore
├── README.md
│
├── analyzer/                       # Analysis modules
│   ├── __init__.py
│   ├── git_handler.py              # Git repository operations
│   ├── kilo_code_cli.py          # Kilo Code CLI integration
│   ├── classifier.py               # Code quality classification
│   ├── ai_feedback.py             # OpenAI integration
│   ├── report_generator.py         # PDF report generation
│   └── metrics_extractor.py       # Code metrics extraction
│
├── models/                         # Data models
│   ├── __init__.py
│   ├── analysis_request.py
│   ├── analysis_result.py
│   ├── code_metrics.py
│   └── classification.py
│
├── services/                        # Business logic
│   ├── __init__.py
│   ├── analysis_service.py
│   ├── notification_service.py
│   └── queue_service.py
│
├── utils/                          # Utility functions
│   ├── __init__.py
│   ├── logger.py
│   ├── validators.py
│   └── helpers.py
│
├── templates/                      # Email/report templates
│   ├── feedback_poor.html
│   ├── feedback_good.html
│   └── feedback_excellent.html
│
├── tests/                          # Test files
│   ├── __init__.py
│   ├── test_analyzer.py
│   ├── test_classifier.py
│   ├── test_ai_feedback.py
│   └── test_services.py
│
└── logs/                           # Application logs
    └── analyzer.log
```

---

## Code Style & Conventions

### Naming Conventions

#### Classes
```python
# Use PascalCase
class CodeAnalyzer:
class GitHandler:
class ClassificationAlgorithm:
```

#### Functions and Methods
```python
# Use snake_case
def analyze_repository(repo_url: str) -> dict:
def clone_repository(repo_url: str, target_dir: str) -> bool:
def calculate_quality_score(metrics: dict) -> float:
```

#### Variables
```python
# Use snake_case
repo_url = "https://github.com/user/repo"
analysis_result = {}
quality_score = 85.5
is_analyzed = True
```

#### Constants
```python
# Use UPPER_SNAKE_CASE
MAX_CLONE_TIMEOUT = 300  # 5 minutes
TEMP_CLONE_DIR = "/tmp/code-analysis"
QUALITY_THRESHOLDS = {
    "POOR": 50,
    "AVERAGE": 70,
    "GOOD": 85,
    "EXCELLENT": 95
}
```

### Code Formatting

Use **Black** for code formatting:

```bash
# Format code
black .

# Check formatting
black --check .

# Format with line length
black --line-length 100 .
```

### Type Hints

```python
from typing import Dict, List, Optional, Tuple
from datetime import datetime

def analyze_code(
    repo_url: str,
    submission_id: int,
    student_id: int
) -> Dict[str, any]:
    """Analyze code repository and return results."""
    pass

def get_quality_category(score: float) -> str:
    """Get quality category based on score."""
    pass
```

---

## Architecture Patterns

### Layered Architecture

```
Controller Layer (Flask Routes)
    ↓
Service Layer (Business Logic)
    ↓
Analyzer Layer (Code Analysis)
    ↓
External Services (Git, Kilo Code CLI, OpenAI)
```

### Flask Application Structure

```python
from flask import Flask, request, jsonify
from flask_cors import CORS
from config import Config
from services.analysis_service import AnalysisService
from utils.logger import setup_logger
import logging

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# Load configuration
config = Config()
app.config.from_object(config)

# Setup logging
logger = setup_logger(config.LOG_LEVEL)

# Initialize services
analysis_service = AnalysisService(config)

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint."""
    return jsonify({
        'status': 'UP',
        'service': 'code-analyzer',
        'timestamp': datetime.utcnow().isoformat() + 'Z'
    })

@app.route('/analyze', methods=['POST'])
def analyze():
    """Code analysis endpoint."""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                'status': 'error',
                'message': 'No JSON data provided',
                'timestamp': datetime.utcnow().isoformat() + 'Z'
            }), 400
        
        # Extract required fields
        submission_id = data.get('submissionId')
        repo_url = data.get('repoUrl')
        student_id = data.get('studentId')
        
        if not all([submission_id, repo_url]):
            return jsonify({
                'status': 'error',
                'message': 'Missing required fields: submissionId, repoUrl',
                'timestamp': datetime.utcnow().isoformat() + 'Z'
            }), 400
        
        logger.info(f"Starting analysis for submission {submission_id}")
        
        # Perform analysis
        result = analysis_service.analyze_submission(
            submission_id=submission_id,
            repo_url=repo_url,
            student_id=student_id
        )
        
        logger.info(f"Analysis completed for submission {submission_id}")
        
        return jsonify({
            'status': 'success',
            'data': result,
            'timestamp': datetime.utcnow().isoformat() + 'Z'
        })
        
    except Exception as e:
        logger.error(f"Error in analyze endpoint: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': str(e),
            'timestamp': datetime.utcnow().isoformat() + 'Z'
        }), 500

@app.route('/status/<submission_id>', methods=['GET'])
def get_status(submission_id: int):
    """Get analysis status for a submission."""
    try:
        status = analysis_service.get_analysis_status(submission_id)
        
        return jsonify({
            'submissionId': submission_id,
            'status': status,
            'timestamp': datetime.utcnow().isoformat() + 'Z'
        })
        
    except Exception as e:
        logger.error(f"Error getting status for submission {submission_id}: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': str(e),
            'timestamp': datetime.utcnow().isoformat() + 'Z'
        }), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=config.DEBUG)
```

### Service Pattern

```python
from typing import Dict, Optional
from datetime import datetime
from analyzer.git_handler import GitHandler
from analyzer.kilo_code_cli import KiloCodeCLI
from analyzer.classifier import CodeClassifier
from analyzer.ai_feedback import AIFeedbackGenerator
from analyzer.report_generator import ReportGenerator
from services.notification_service import NotificationService
from utils.logger import get_logger

logger = get_logger(__name__)

class AnalysisService:
    """Service for analyzing code submissions."""
    
    def __init__(self, config):
        self.config = config
        self.git_handler = GitHandler(config)
        self.kilo_cli = KiloCodeCLI(config)
        self.classifier = CodeClassifier(config)
        self.ai_feedback = AIFeedbackGenerator(config)
        self.report_generator = ReportGenerator(config)
        self.notification_service = NotificationService(config)
    
    def analyze_submission(
        self,
        submission_id: int,
        repo_url: str,
        student_id: int
    ) -> Dict[str, any]:
        """
        Analyze a code submission.
        
        Args:
            submission_id: The submission ID
            repo_url: GitHub repository URL
            student_id: The student ID
            
        Returns:
            Dictionary containing analysis results
        """
        try:
            # Step 1: Clone repository
            logger.info(f"Cloning repository: {repo_url}")
            clone_dir = self.git_handler.clone_repository(repo_url, submission_id)
            
            # Step 2: Run Kilo Code CLI
            logger.info(f"Running Kilo Code CLI on {clone_dir}")
            metrics = self.kilo_cli.analyze(clone_dir)
            
            # Step 3: Classify code quality
            logger.info("Classifying code quality")
            classification = self.classifier.classify(metrics)
            
            # Step 4: Generate AI feedback
            logger.info("Generating AI feedback")
            feedback = self.ai_feedback.generate_feedback(
                metrics=metrics,
                classification=classification,
                repo_url=repo_url
            )
            
            # Step 5: Generate report
            logger.info("Generating analysis report")
            report_url = self.report_generator.generate_report(
                submission_id=submission_id,
                metrics=metrics,
                classification=classification,
                feedback=feedback
            )
            
            # Step 6: Notify completion
            logger.info("Sending notification")
            self.notification_service.notify_analysis_complete(
                submission_id=submission_id,
                student_id=student_id,
                classification=classification
            )
            
            # Step 7: Cleanup
            logger.info("Cleaning up temporary files")
            self.git_handler.cleanup(clone_dir)
            
            # Return results
            return {
                'submissionId': submission_id,
                'status': 'completed',
                'metrics': metrics,
                'classification': classification,
                'feedback': feedback,
                'reportUrl': report_url,
                'analyzedAt': datetime.utcnow().isoformat() + 'Z'
            }
            
        except Exception as e:
            logger.error(f"Error analyzing submission {submission_id}: {str(e)}")
            raise
```

### Git Handler Pattern

```python
import os
import shutil
import subprocess
from typing import Optional
from datetime import datetime
from utils.logger import get_logger

logger = get_logger(__name__)

class GitHandler:
    """Handle Git repository operations."""
    
    def __init__(self, config):
        self.temp_dir = config.TEMP_CLONE_DIR
        self.max_timeout = config.MAX_CLONE_TIMEOUT
    
    def clone_repository(self, repo_url: str, submission_id: int) -> str:
        """
        Clone a Git repository.
        
        Args:
            repo_url: GitHub repository URL
            submission_id: Submission ID for directory naming
            
        Returns:
            Path to cloned repository
            
        Raises:
            Exception: If clone fails
        """
        try:
            # Create target directory
            target_dir = os.path.join(self.temp_dir, f"submission_{submission_id}")
            
            # Remove existing directory if present
            if os.path.exists(target_dir):
                shutil.rmtree(target_dir)
            
            # Clone repository
            logger.info(f"Cloning {repo_url} to {target_dir}")
            
            result = subprocess.run(
                ['git', 'clone', repo_url, target_dir],
                timeout=self.max_timeout,
                capture_output=True,
                text=True
            )
            
            if result.returncode != 0:
                raise Exception(f"Git clone failed: {result.stderr}")
            
            logger.info(f"Successfully cloned repository to {target_dir}")
            return target_dir
            
        except subprocess.TimeoutExpired:
            raise Exception(f"Git clone timed out after {self.max_timeout} seconds")
        except Exception as e:
            logger.error(f"Error cloning repository: {str(e)}")
            raise
    
    def cleanup(self, directory: str) -> None:
        """
        Clean up temporary directory.
        
        Args:
            directory: Directory to remove
        """
        try:
            if os.path.exists(directory):
                shutil.rmtree(directory)
                logger.info(f"Cleaned up directory: {directory}")
        except Exception as e:
            logger.warning(f"Failed to cleanup directory {directory}: {str(e)}")
```

### Kilo Code CLI Integration

```python
import subprocess
import json
from typing import Dict
from utils.logger import get_logger

logger = get_logger(__name__)

class KiloCodeCLI:
    """Integrate with Kilo Code CLI for code analysis."""
    
    def __init__(self, config):
        self.cli_path = config.KILO_CODE_CLI_PATH
        self.max_timeout = config.MAX_ANALYSIS_TIMEOUT
    
    def analyze(self, directory: str) -> Dict[str, any]:
        """
        Run Kilo Code CLI on a directory.
        
        Args:
            directory: Path to code directory
            
        Returns:
            Dictionary containing code metrics
            
        Raises:
            Exception: If analysis fails
        """
        try:
            logger.info(f"Running Kilo Code CLI on {directory}")
            
            # Run CLI command
            result = subprocess.run(
                ['kilo-code', 'analyze', directory, '--format', 'json'],
                timeout=self.max_timeout,
                capture_output=True,
                text=True
            )
            
            if result.returncode != 0:
                raise Exception(f"Kilo Code CLI failed: {result.stderr}")
            
            # Parse JSON output
            metrics = json.loads(result.stdout)
            
            logger.info(f"Kilo Code CLI analysis completed")
            return metrics
            
        except subprocess.TimeoutExpired:
            raise Exception(f"Kilo Code CLI timed out after {self.max_timeout} seconds")
        except json.JSONDecodeError as e:
            raise Exception(f"Failed to parse Kilo Code CLI output: {str(e)}")
        except Exception as e:
            logger.error(f"Error running Kilo Code CLI: {str(e)}")
            raise
```

### Classification Algorithm

```python
from typing import Dict, Literal
from utils.logger import get_logger

logger = get_logger(__name__)

class CodeClassifier:
    """Classify code quality based on metrics."""
    
    def __init__(self, config):
        self.thresholds = config.QUALITY_THRESHOLDS
    
    def classify(self, metrics: Dict[str, any]) -> Dict[str, any]:
        """
        Classify code quality based on metrics.
        
        Args:
            metrics: Dictionary containing code metrics
            
        Returns:
            Dictionary with classification results
        """
        try:
            # Calculate weighted score
            score = self._calculate_score(metrics)
            
            # Determine category
            category = self._get_category(score)
            
            logger.info(f"Code classified as {category} with score {score}")
            
            return {
                'score': round(score, 2),
                'category': category,
                'metrics': metrics,
                'timestamp': datetime.utcnow().isoformat() + 'Z'
            }
            
        except Exception as e:
            logger.error(f"Error classifying code: {str(e)}")
            raise
    
    def _calculate_score(self, metrics: Dict[str, any]) -> float:
        """Calculate overall quality score from metrics."""
        # Weight different metrics
        weights = {
            'complexity': 0.3,
            'maintainability': 0.25,
            'test_coverage': 0.2,
            'code_smells': 0.15,
            'documentation': 0.1
        }
        
        score = 0.0
        
        for metric, weight in weights.items():
            if metric in metrics:
                normalized_value = self._normalize_metric(metric, metrics[metric])
                score += normalized_value * weight
        
        return score * 100  # Convert to percentage
    
    def _normalize_metric(self, metric: str, value: any) -> float:
        """Normalize metric value to 0-1 range."""
        # Implementation depends on metric type
        # This is a simplified example
        if isinstance(value, (int, float)):
            return min(max(value / 100, 0), 1)
        return 0.5  # Default
    
    def _get_category(self, score: float) -> str:
        """Get quality category based on score."""
        if score >= self.thresholds['EXCELLENT']:
            return 'excellent'
        elif score >= self.thresholds['GOOD']:
            return 'good'
        elif score >= self.thresholds['AVERAGE']:
            return 'average'
        else:
            return 'poor'
```

### AI Feedback Generator

```python
import openai
from typing import Dict, Optional
from utils.logger import get_logger

logger = get_logger(__name__)

class AIFeedbackGenerator:
    """Generate AI-powered feedback using OpenAI."""
    
    def __init__(self, config):
        self.client = openai.OpenAI(api_key=config.OPENAI_API_KEY)
        self.model = config.OPENAI_MODEL
        self.max_tokens = config.MAX_TOKENS
    
    def generate_feedback(
        self,
        metrics: Dict[str, any],
        classification: Dict[str, any],
        repo_url: str
    ) -> Dict[str, str]:
        """
        Generate AI feedback based on code quality.
        
        Args:
            metrics: Code metrics
            classification: Classification results
            repo_url: Repository URL
            
        Returns:
            Dictionary with feedback content
        """
        try:
            category = classification['category']
            score = classification['score']
            
            # Select template based on category
            prompt = self._build_prompt(category, score, metrics, repo_url)
            
            logger.info(f"Generating AI feedback for category: {category}")
            
            # Call OpenAI API
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": "You are a helpful code review assistant for students."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                max_tokens=self.max_tokens,
                temperature=0.7
            )
            
            feedback = response.choices[0].message.content
            
            logger.info("AI feedback generated successfully")
            
            return {
                'category': category,
                'feedback': feedback,
                'score': score,
                'timestamp': datetime.utcnow().isoformat() + 'Z'
            }
            
        except openai.APIError as e:
            logger.error(f"OpenAI API error: {str(e)}")
            raise Exception(f"Failed to generate AI feedback: {str(e)}")
        except Exception as e:
            logger.error(f"Error generating AI feedback: {str(e)}")
            raise
    
    def _build_prompt(
        self,
        category: str,
        score: float,
        metrics: Dict[str, any],
        repo_url: str
    ) -> str:
        """Build prompt for OpenAI based on category."""
        
        if category == 'poor':
            return f"""
            The student's code has been analyzed and received a quality score of {score}/100.
            
            Metrics:
            - Complexity: {metrics.get('complexity', 'N/A')}
            - Test Coverage: {metrics.get('test_coverage', 'N/A')}%
            - Code Smells: {metrics.get('code_smells', 'N/A')}
            
            Please provide:
            1. Specific areas for improvement
            2. Actionable suggestions for each issue
            3. Best practices the student should follow
            4. Encouraging tone to help them improve
            
            Keep the feedback concise (under 300 words) and actionable.
            """
        
        elif category == 'good':
            return f"""
            The student's code has been analyzed and received a quality score of {score}/100.
            
            Metrics:
            - Complexity: {metrics.get('complexity', 'N/A')}
            - Test Coverage: {metrics.get('test_coverage', 'N/A')}%
            - Code Smells: {metrics.get('code_smells', 'N/A')}
            
            Please provide:
            1. Congratulations on good work
            2. What they did well
            3. Advanced challenges to help them grow
            4. Suggestions for further improvement
            
            Keep the feedback concise (under 300 words) and encouraging.
            """
        
        else:
            return f"""
            The student's code has been analyzed and received a quality score of {score}/100.
            
            Please provide constructive feedback and suggestions for improvement.
            """
```

### Report Generator

```python
import os
from typing import Dict
from datetime import datetime
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet
from utils.logger import get_logger

logger = get_logger(__name__)

class ReportGenerator:
    """Generate PDF reports for code analysis."""
    
    def __init__(self, config):
        self.output_dir = config.REPORT_OUTPUT_DIR
    
    def generate_report(
        self,
        submission_id: int,
        metrics: Dict[str, any],
        classification: Dict[str, any],
        feedback: Dict[str, str]
    ) -> str:
        """
        Generate PDF report for analysis.
        
        Args:
            submission_id: Submission ID
            metrics: Code metrics
            classification: Classification results
            feedback: AI feedback
            
        Returns:
            URL to generated report
        """
        try:
            # Create output directory if needed
            os.makedirs(self.output_dir, exist_ok=True)
            
            # Generate filename
            filename = f"analysis_report_{submission_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
            filepath = os.path.join(self.output_dir, filename)
            
            # Create PDF
            doc = SimpleDocTemplate(filepath, pagesize=letter)
            styles = getSampleStyleSheet()
            story = []
            
            # Add title
            title = Paragraph("Code Analysis Report", styles['Title'])
            story.append(title)
            story.append(Spacer(1, 12))
            
            # Add submission info
            info = Paragraph(f"Submission ID: {submission_id}", styles['Normal'])
            story.append(info)
            story.append(Spacer(1, 12))
            
            # Add classification
            category = Paragraph(
                f"Quality Category: {classification['category'].upper()}",
                styles['Heading2']
            )
            story.append(category)
            story.append(Spacer(1, 12))
            
            # Add score
            score = Paragraph(
                f"Quality Score: {classification['score']}/100",
                styles['Heading2']
            )
            story.append(score)
            story.append(Spacer(1, 12))
            
            # Add metrics
            metrics_title = Paragraph("Code Metrics", styles['Heading2'])
            story.append(metrics_title)
            story.append(Spacer(1, 12))
            
            for key, value in metrics.items():
                metric = Paragraph(f"{key}: {value}", styles['Normal'])
                story.append(metric)
            
            story.append(Spacer(1, 12))
            
            # Add feedback
            feedback_title = Paragraph("AI Feedback", styles['Heading2'])
            story.append(feedback_title)
            story.append(Spacer(1, 12))
            
            feedback_text = Paragraph(feedback['feedback'], styles['Normal'])
            story.append(feedback_text)
            
            # Build PDF
            doc.build(story)
            
            logger.info(f"Report generated: {filepath}")
            
            # Return URL (in production, this would be a cloud storage URL)
            return f"/reports/{filename}"
            
        except Exception as e:
            logger.error(f"Error generating report: {str(e)}")
            raise
```

---

## Configuration

### config.py

```python
import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    """Application configuration."""
    
    # Flask
    DEBUG = os.getenv('FLASK_DEBUG', 'false').lower() == 'true'
    PORT = int(os.getenv('PORT', 5000))
    HOST = os.getenv('HOST', '0.0.0.0')
    
    # OpenAI
    OPENAI_API_KEY = os.getenv('OPENAI_API_KEY', '')
    OPENAI_MODEL = os.getenv('OPENAI_MODEL', 'gpt-4')
    MAX_TOKENS = int(os.getenv('MAX_TOKENS', 500))
    
    # File paths
    TEMP_CLONE_DIR = os.getenv('TEMP_CLONE_DIR', '/tmp/code-analysis')
    REPORT_OUTPUT_DIR = os.getenv('REPORT_OUTPUT_DIR', '/tmp/reports')
    KILO_CODE_CLI_PATH = os.getenv('KILO_CODE_CLI_PATH', 'kilo-code')
    
    # Timeouts
    MAX_CLONE_TIMEOUT = int(os.getenv('MAX_CLONE_TIMEOUT', 300))  # 5 minutes
    MAX_ANALYSIS_TIMEOUT = int(os.getenv('MAX_ANALYSIS_TIMEOUT', 600))  # 10 minutes
    
    # Quality thresholds
    QUALITY_THRESHOLDS = {
        'POOR': float(os.getenv('THRESHOLD_POOR', 50)),
        'AVERAGE': float(os.getenv('THRESHOLD_AVERAGE', 70)),
        'GOOD': float(os.getenv('THRESHOLD_GOOD', 85)),
        'EXCELLENT': float(os.getenv('THRESHOLD_EXCELLENT', 95))
    }
    
    # External services
    NOTIFICATION_SERVICE_URL = os.getenv('NOTIFICATION_SERVICE_URL', 'http://notifications:5001')
    GATEWAY_SERVICE_URL = os.getenv('GATEWAY_SERVICE_URL', 'http://gateway:8080')
    
    # Logging
    LOG_LEVEL = os.getenv('LOG_LEVEL', 'INFO')
    LOG_FILE = os.getenv('LOG_FILE', 'logs/analyzer.log')
```

### .env.example

```env
# Flask Configuration
FLASK_DEBUG=false
PORT=5000
HOST=0.0.0.0

# OpenAI Configuration
OPENAI_API_KEY=sk-your-openai-api-key-here
OPENAI_MODEL=gpt-4
MAX_TOKENS=500

# File Paths
TEMP_CLONE_DIR=/tmp/code-analysis
REPORT_OUTPUT_DIR=/tmp/reports
KILO_CODE_CLI_PATH=kilo-code

# Timeouts (in seconds)
MAX_CLONE_TIMEOUT=300
MAX_ANALYSIS_TIMEOUT=600

# Quality Thresholds
THRESHOLD_POOR=50
THRESHOLD_AVERAGE=70
THRESHOLD_GOOD=85
THRESHOLD_EXCELLENT=95

# External Services
NOTIFICATION_SERVICE_URL=http://notifications:5001
GATEWAY_SERVICE_URL=http://gateway:8080

# Logging
LOG_LEVEL=INFO
LOG_FILE=logs/analyzer.log
```

---

## Error Handling

### Custom Exceptions

```python
class AnalysisException(Exception):
    """Base exception for analysis errors."""
    pass

class GitCloneException(AnalysisException):
    """Exception raised when Git clone fails."""
    pass

class KiloCodeException(AnalysisException):
    """Exception raised when Kilo Code CLI fails."""
    pass

class OpenAIException(AnalysisException):
    """Exception raised when OpenAI API fails."""
    pass

class ReportGenerationException(AnalysisException):
    """Exception raised when report generation fails."""
    pass
```

### Error Handler

```python
from flask import jsonify
from utils.logger import get_logger

logger = get_logger(__name__)

def handle_error(error: Exception) -> tuple:
    """Handle exceptions and return JSON error response."""
    logger.error(f"Error: {str(error)}")
    
    status_code = 500
    error_type = "Internal Server Error"
    
    if isinstance(error, GitCloneException):
        status_code = 400
        error_type = "Git Clone Error"
    elif isinstance(error, KiloCodeException):
        status_code = 500
        error_type = "Analysis Error"
    elif isinstance(error, OpenAIException):
        status_code = 500
        error_type = "AI Feedback Error"
    elif isinstance(error, ReportGenerationException):
        status_code = 500
        error_type = "Report Generation Error"
    
    return jsonify({
        'status': 'error',
        'error': error_type,
        'message': str(error),
        'timestamp': datetime.utcnow().isoformat() + 'Z'
    }), status_code
```

---

## Testing

### Unit Test Example

```python
import pytest
from unittest.mock import Mock, patch
from analyzer.classifier import CodeClassifier
from config import Config

def test_classify_poor_quality():
    """Test classification of poor quality code."""
    config = Config()
    classifier = CodeClassifier(config)
    
    metrics = {
        'complexity': 90,
        'maintainability': 30,
        'test_coverage': 20,
        'code_smells': 50,
        'documentation': 10
    }
    
    result = classifier.classify(metrics)
    
    assert result['category'] == 'poor'
    assert result['score'] < config.QUALITY_THRESHOLDS['POOR']

def test_classify_good_quality():
    """Test classification of good quality code."""
    config = Config()
    classifier = CodeClassifier(config)
    
    metrics = {
        'complexity': 30,
        'maintainability': 80,
        'test_coverage': 85,
        'code_smells': 5,
        'documentation': 90
    }
    
    result = classifier.classify(metrics)
    
    assert result['category'] == 'good'
    assert result['score'] >= config.QUALITY_THRESHOLDS['GOOD']

@patch('analyzer.git_handler.subprocess.run')
def test_clone_repository_success(mock_run):
    """Test successful repository cloning."""
    from analyzer.git_handler import GitHandler
    from config import Config
    
    config = Config()
    handler = GitHandler(config)
    
    # Mock successful git clone
    mock_run.return_value = Mock(returncode=0, stdout='', stderr='')
    
    result = handler.clone_repository('https://github.com/user/repo', 123)
    
    assert 'submission_123' in result
    mock_run.assert_called_once()
```

### Integration Test Example

```python
import pytest
from app import app
import json

@pytest.fixture
def client():
    """Create test client."""
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client

def test_health_endpoint(client):
    """Test health check endpoint."""
    response = client.get('/health')
    
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['status'] == 'UP'
    assert data['service'] == 'code-analyzer'

def test_analyze_endpoint_success(client):
    """Test successful analysis."""
    request_data = {
        'submissionId': 123,
        'repoUrl': 'https://github.com/user/repo',
        'studentId': 456
    }
    
    response = client.post(
        '/analyze',
        json=request_data,
        content_type='application/json'
    )
    
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['status'] == 'success'
    assert 'data' in data

def test_analyze_endpoint_missing_fields(client):
    """Test analysis with missing required fields."""
    request_data = {
        'submissionId': 123
        # Missing repoUrl
    }
    
    response = client.post(
        '/analyze',
        json=request_data,
        content_type='application/json'
    )
    
    assert response.status_code == 400
    data = json.loads(response.data)
    assert data['status'] == 'error'
    assert 'Missing required fields' in data['message']
```

### Test Coverage Target
- **Minimum**: 80% overall coverage
- **Services**: 90% coverage
- **Analyzers**: 85% coverage
- **Utilities**: 80% coverage

---

## Best Practices

1. **Use type hints** for all function parameters and return values
2. **Handle exceptions** gracefully with custom exception classes
3. **Log important events** using structured logging
4. **Validate inputs** before processing
5. **Use async operations** for I/O-bound tasks
6. **Clean up resources** (temp files, connections)
7. **Follow PEP 8** style guide (use Black formatter)
8. **Write tests** for all business logic
9. **Use environment variables** for configuration
10. **Document complex logic** with docstrings

---

## Quick Reference Commands

```bash
# Install dependencies
pip install -r requirements.txt

# Install development dependencies
pip install -r requirements-dev.txt

# Run development server
python app.py

# Run with Gunicorn (production)
gunicorn -w 4 -b 0.0.0.0:5000 app:app

# Run tests
pytest

# Run tests with coverage
pytest --cov=. --cov-report=html

# Format code
black .

# Check code style
flake8 .

# Type checking
mypy .

# Run specific test
pytest tests/test_classifier.py

# Run tests with verbose output
pytest -v
```

---

## Resources

- [Flask Documentation](https://flask.palletsprojects.com/)
- [OpenAI API Documentation](https://platform.openai.com/docs/)
- [Python Best Practices](https://docs.python-guide.org/)
- [PEP 8 Style Guide](https://peps.python.org/pep-0008/)
- [Pytest Documentation](https://docs.pytest.org/)
- [ReportLab Documentation](https://www.reportlab.com/)
