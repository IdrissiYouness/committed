# Code Analyzer Service

AI-powered code analysis service for the Committed platform. Analyzes student code submissions, generates metrics, assigns grades (A-F), and produces professional PDF reports.

## 🎯 Status

**Phase 1 Complete** - Project scaffolding finished, 14 tests passing, ready for Phase 2 implementation.

See [Implementation Plan](../../docs/ai-analysis-service-plan.md) for full roadmap.

## 📋 Overview

This service:
1. Clones student repositories from GitHub/GitLab
2. Runs AI analysis (OpenAI or Kilo Code CLI)
3. Extracts code quality metrics (SOLID, clean code, testing, etc.)
4. Classifies work with A-F grade using weighted scoring
5. Generates professional PDF reports using Typst
6. Returns metrics + PDF to Gateway service

**Architecture**: No database access - receives all data from Gateway via HTTP requests.

## 🏗️ Project Structure

```
services/code-analyzer/
├── app.py                    # Flask API (health, analyze, reports endpoints)
├── config.py                 # Environment-based configuration
├── requirements.txt          # Production dependencies
├── requirements-dev.txt      # Development dependencies
├── Dockerfile                # Docker image with Typst PDF compiler
├── .env.example              # Environment variables template
│
├── core/                     # Core analysis pipeline
│   ├── git_handler.py        # Repository cloning & validation
│   ├── agent_runner.py       # AI agent execution (OpenAI/Kilo)
│   ├── metrics_parser.py     # Metrics normalization
│   ├── classifier.py         # Grade calculation (A-F)
│   ├── report_generator.py   # PDF generation via Typst
│   └── pipeline.py           # Orchestration of all steps
│
├── models/                   # Pydantic data schemas
│   └── metrics_schema.py     # Metrics validation models
│
├── templates/                # Report templates
│   └── report.typ            # Typst PDF template
│
└── tests/                    # Unit tests (14 tests, all passing ✅)
    ├── test_git_handler.py
    ├── test_metrics_parser.py
    ├── test_classifier.py
    └── test_report_generator.py
```

## 🚀 Quick Start

### 1. Setup Environment

```bash
cd services/code-analyzer

# Create virtual environment
python3 -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
pip install -r requirements-dev.txt

# Configure environment
cp .env.example .env
# Edit .env and add your OPENAI_API_KEY
```

### 2. Run Tests

```bash
pytest -v                    # Run all tests
pytest --cov=core            # With coverage
pytest tests/test_classifier.py -v  # Specific test
```

### 3. Start Development Server

```bash
python app.py
# Service available at http://localhost:5000
```

### 4. Test API

```bash
# Health check
curl http://localhost:5000/health

# Analyze repository (returns placeholder until pipeline is connected)
curl -X POST http://localhost:5000/analyze \
  -H "Content-Type: application/json" \
  -d '{"submissionId": 123, "repoUrl": "https://github.com/user/repo"}'
```

## 🔧 Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `OPENAI_API_KEY` | - | **Required** for OpenAI backend |
| `AGENT_BACKEND` | `openai` | AI backend: "openai" or "kilocode" |
| `TEMP_DIR` | `/tmp/code-analysis` | Directory for cloned repositories |
| `REPORTS_DIR` | `/tmp/reports` | Directory for generated PDF reports |
| `CLONE_TIMEOUT` | `120` | Git clone timeout (seconds) |
| `AGENT_TIMEOUT` | `300` | AI analysis timeout (seconds) |
| `PORT` | `5000` | Flask server port |
| `FLASK_DEBUG` | `false` | Enable debug mode |
| `NOTIFICATION_SERVICE_URL` | `http://notifications:5001` | Notification service URL |

## 📡 API Endpoints

### `GET /health`
Health check endpoint

**Response:**
```json
{
  "status": "UP",
  "service": "code-analyzer",
  "timestamp": "2026-04-04T18:23:55Z"
}
```

### `POST /analyze`
Analyze a code repository

**Request:**
```json
{
  "submissionId": 123,
  "repoUrl": "https://github.com/user/repo"
}
```

**Response (when pipeline is connected):**
```json
{
  "submissionId": 123,
  "status": "completed",
  "grade": "B",
  "percentage": 73.4,
  "breakdown": {
    "solid": {"score": 3.5, "max": 5, "weighted_contribution": 14.0},
    "clean_code": {"score": 4.0, "max": 5, "weighted_contribution": 16.0},
    ...
  },
  "metrics": {
    "solid": {"score": 3.5, "notes": "Good separation..."},
    "feedback": "Overall solid code...",
    "recommendations": ["Add more tests", "Improve documentation"]
  },
  "reportUrl": "/reports/123.pdf",
  "analyzedAt": "2026-04-04T18:00:00+00:00"
}
```

### `GET /reports/<filename>`
Serve generated PDF reports

## 🐳 Docker

### Build Image

```bash
docker build -t code-analyzer:latest .
```

### Run Container

```bash
docker run -p 5000:5000 \
  -e OPENAI_API_KEY=sk-your-key \
  code-analyzer:latest
```

## 💻 IDE Setup (VSCode)

### Settings (`.vscode/settings.json`)

```json
{
  "python.defaultInterpreterPath": "./.venv/bin/python",
  "python.linting.enabled": true,
  "python.formatting.provider": "black",
  "editor.formatOnSave": true
}
```

### Launch Configuration (`.vscode/launch.json`)

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Flask",
      "type": "python",
      "request": "launch",
      "module": "flask",
      "env": {
        "FLASK_APP": "app.py",
        "FLASK_DEBUG": "1"
      },
      "args": ["run", "--host=0.0.0.0", "--port=5000"],
      "jinja": true
    }
  ]
}
```

## 🧪 Testing

**Current Status**: ✅ 14 tests passing (100%)

```bash
# Run all tests
pytest

# Run with verbose output
pytest -v

# Run with coverage report
pytest --cov=core --cov=models --cov-report=html

# Run specific test class
pytest tests/test_classifier.py::TestClassify -v

# Watch mode (requires pytest-watch)
ptw
```

**Test Coverage:**
- Git handler: URL validation, cloning, error handling
- Metrics parser: Full input, missing keys, type coercion
- Classifier: Grade calculation, floor rules, breakdown
- Report generator: PDF generation, compilation errors

## 🏛️ Architecture

### Pipeline Flow

```
POST /analyze
    ↓
1. Clone repo (git_handler)
    ↓
2. Run AI agent (agent_runner)
    ↓
3. Parse metrics (metrics_parser)
    ↓
4. Calculate grade (classifier)
    ↓
5. Generate PDF (report_generator)
    ↓
6. Return results
    ↓
7. Cleanup (git_handler)
```

### Metrics Evaluated

- **SOLID Principles** (20% weight)
- **Clean Code** (20% weight)
- **OOP Design** (15% weight)
- **Error Handling** (15% weight)
- **Testing** (15% weight)
- **Documentation** (10% weight)
- **Complexity** (5% weight)

### Grading Thresholds

- **A**: ≥85%
- **B**: ≥70%
- **C**: ≥55%
- **D**: ≥40%
- **F**: <40%

**Floor Rules**: Testing score <1.0 caps grade at D

## 🛠️ Development

### Code Style

```bash
# Format code
black .

# Lint code
ruff check .

# Type checking (optional)
mypy core/ models/
```

### Adding New Metrics

1. Update `models/metrics_schema.py` to add new metric field
2. Update `core/agent_runner.py` prompt to request new metric
3. Update `core/classifier.py` to include in weight calculation
4. Add tests in `tests/test_classifier.py`

### Customizing Grade Weights

Edit `core/classifier.py`:

```python
WEIGHTS = {
    "solid": 0.20,
    "clean_code": 0.20,
    # ... adjust weights as needed
}
```

## 🗺️ Roadmap

### ✅ Phase 1 - Project Scaffolding (COMPLETE)
- [x] Directory structure
- [x] Core module skeletons
- [x] Pydantic models
- [x] Test suite (14 tests passing)
- [x] Dockerfile with Typst

### ⏳ Phase 2-8 (TODO)
- **Phase 2**: Git handler testing with real repos
- **Phase 3**: OpenAI runner implementation
- **Phase 4**: Metrics schema completion
- **Phase 5**: Classifier tuning
- **Phase 6**: Typst PDF generation testing
- **Phase 7**: Pipeline integration with Flask
- **Phase 8**: Docker Compose + Gateway integration

See [Full Implementation Plan](../../docs/ai-analysis-service-plan.md)

## 📦 Dependencies

### Production
- Flask 3.0.0 - Web framework
- OpenAI 1.6.1 - AI analysis
- Pydantic 2.6.0 - Data validation
- Requests 2.31.0 - HTTP client

### Development
- pytest 8.0.0 - Testing framework
- pytest-cov 5.0.0 - Coverage reporting
- black 24.4.2 - Code formatting
- ruff 0.3.7 - Linting

## 🐛 Troubleshooting

**Import errors**
- Ensure virtual environment is activated: `source .venv/bin/activate`
- Reinstall dependencies: `pip install -r requirements.txt`

**Tests failing**
- Check Python version: `python --version` (requires 3.11+)
- Install dev dependencies: `pip install -r requirements-dev.txt`

**OpenAI API errors**
- Verify API key is set: `echo $OPENAI_API_KEY`
- Check API key has credits at platform.openai.com

**Module not found**
- Run commands from `services/code-analyzer` directory
- Add to PYTHONPATH: `export PYTHONPATH="${PYTHONPATH}:$(pwd)"`

## 📄 License

Part of the Committed platform. See root LICENSE file.

## 🤝 Contributing

1. Follow existing code style (black + ruff)
2. Write tests for new features
3. Update documentation
4. Ensure all tests pass: `pytest`
