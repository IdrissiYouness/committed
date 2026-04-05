# Code Analyzer Service

AI-powered code quality analysis service for the Committed platform. Analyzes student code submissions and generates detailed PDF reports with quality metrics and grades.

## 🎯 What Does This Service Do?

Takes a GitHub/GitLab URL → Analyzes code with AI → Assigns A-F grade → Generates PDF report

**Key Features**:
- 7 quality metrics: SOLID, clean code, OOP, error handling, testing, documentation, complexity
- AI-powered analysis (OpenAI or Kilo CLI)
- Automated grading with configurable weights
- Student level inference (beginner/intermediate/advanced)
- Hybrid AI-enhanced report content with static Typst layout
- Professional PDF reports via Typst
- Stateless microservice (no database)

## 📁 Project Structure

```
services/code-analyzer/
├── app.py                      # Flask HTTP server
├── config.py                   # Environment configuration
├── requirements.txt            # Production dependencies
├── requirements-dev.txt        # Development dependencies
├── Dockerfile                  # Production container
├── .env                        # Environment variables (local)
├── .env.example               # Environment template
│
├── .kilo/                      # Kilo CLI configuration
│   └── agent/
│       ├── analyzer.md         # Custom code analyzer agent
│       └── report-content.md   # Personalized report content agent
│
├── core/                       # Business logic
│   ├── git_handler.py         # Git clone/cleanup
│   ├── agent_runner.py        # AI analysis (OpenAI/Kilo)
│   ├── metrics_parser.py      # Normalize AI output
│   ├── classifier.py          # Calculate grades
│   ├── report_generator.py   # Generate PDFs
│   └── pipeline.py            # Orchestrate everything
│
├── models/                     # Data schemas
│   └── metrics_schema.py      # Pydantic models
│
├── templates/                  # Report templates
│   └── report.typ             # Typst PDF template
│
├── scripts/                    # Utility scripts
│   ├── kilo-analyze-wrapper.py  # Kilo CLI wrapper
│   ├── kilo-report-content.py   # Report content agent wrapper
│   ├── kilo-analyze.sh         # Bash wrapper (alternative)
│   └── manual_test_kilo.sh     # Quick manual test
│
├── tests/                      # Tests & examples
│   ├── test_classifier.py     # Grading logic tests
│   ├── test_git_handler.py    # Git operations tests
│   ├── test_metrics_parser.py # Parser tests
│   ├── test_report_generator.py # PDF generation tests
│   ├── test_report_content.py # AI enhancement tests
│   ├── test_student_level_inference.py # Level inference tests
│   ├── test_enhanced_pipeline.py # Pipeline integration checks
│   ├── test_manual_flow.py    # Manual flow simulation
│   ├── test_analysis.py       # Full pipeline test
│   ├── test_kilo_analyzer.py  # Kilo integration test
│   └── quick_test.py          # Quick verification
│
└── docs/                       # Documentation
    ├── ONBOARDING.md          # Developer onboarding guide
    ├── KILO_INTEGRATION.md    # Kilo CLI integration docs
    ├── KILO_SETUP.md          # Implementation summary
    └── REPORT_CUSTOMIZATION.md # AI report customization guide
```

## 🚀 Quick Start

### Prerequisites

- Python 3.11+
- Git
- Typst (for PDF generation)
- Kilo CLI (optional, for kilo backend)

### Installation

```bash
cd services/code-analyzer

# Create virtual environment
python3 -m venv .venv
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt
pip install -r requirements-dev.txt
```

### Configuration

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` and configure:

```bash
# Choose backend: "openai" or "kilocode" (default: openai)
AGENT_BACKEND=kilocode

# OpenAI (if using OpenAI backend)
OPENAI_API_KEY=your_key_here

# Kilo CLI command (single source of truth for wrappers)
AGENT_CLI=kilo

# AI-enhanced report content
ENABLE_AI_REPORTS=true
```

### Run the Service

```bash
# Development mode
python app.py

# Production mode
gunicorn app:app --bind 0.0.0.0:5000
```

### Run Tests

```bash
# All tests
.venv/bin/pytest tests/ -v

# Specific test
.venv/bin/pytest tests/test_classifier.py -v

# With coverage
.venv/bin/pytest --cov=core --cov=models
```

## 🧪 Testing & Examples

### Quick Tests

```bash
# Quick verification test
.venv/bin/python tests/quick_test.py

# Manual flow simulation (no AI required)
.venv/bin/python tests/test_manual_flow.py

# Kilo integration test
.venv/bin/python tests/test_kilo_analyzer.py
```

### Test with Real Repository

```bash
# Edit tests/test_analysis.py and set your repo URL
.venv/bin/python tests/test_analysis.py
```

## 🔧 Configuration

### AI Backend Options

**Option 1: OpenAI (GPT-4)**
```bash
AGENT_BACKEND=openai
OPENAI_API_KEY=sk-...
```

**Option 2: Kilo CLI (500+ models)**
```bash
AGENT_BACKEND=kilocode
AGENT_CLI=kilo
```

### Grading Configuration

Edit `core/classifier.py` to customize:

```python
# Adjust weights (must sum to 1.0)
WEIGHTS = {
    "solid": 0.20,
    "clean_code": 0.20,
    "oop": 0.15,
    "error_handling": 0.15,
    "testing": 0.15,
    "documentation": 0.10,
    "complexity": 0.05,
}

# Adjust grade thresholds
GRADE_THRESHOLDS = [
    (85, "A"),
    (70, "B"),
    (55, "C"),
    (40, "D"),
    (0, "F"),
]

# Floor rules (minimum requirements)
FLOOR_RULES = [
    ("testing", 1.0, "D"),  # Testing < 1.0 caps at D
]
```

### Student Level Inference

Student level is inferred from classification and metric profile:

- `advanced`: grade A/B and average metric score >= 3.5
- `beginner`: grade D/F, or average < 2.0, or testing < 1.0
- `intermediate`: all other cases

This is implemented in `core/classifier.py`.

### AI-Enhanced Reports

When `ENABLE_AI_REPORTS=true`, report generation attempts a personalization step:

1. Build payload from metrics, grade, and inferred student level
2. Invoke `scripts/kilo-report-content.py`
3. Validate output against `EnhancedContent` schema
4. Inject enhanced feedback/recommendations into Typst data
5. Fall back to original static content if enhancement fails

Caching is enabled via `lru_cache(maxsize=100)` for repeated similar payloads.

## 📊 API Endpoints

### POST /analyze

Analyze a code repository:

```bash
curl -X POST http://localhost:5000/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "submissionId": 123,
    "repoUrl": "https://github.com/user/repo"
  }'
```

Response:
```json
{
  "submissionId": 123,
  "status": "completed",
  "grade": "B",
  "percentage": 73.4,
  "student_level": "intermediate",
  "breakdown": {...},
  "metrics": {...},
  "reportUrl": "/reports/123.pdf",
  "analyzedAt": "2026-04-01T12:00:00+00:00"
}
```

### GET /health

Health check:

```bash
curl http://localhost:5000/health
```

### GET /reports/:filename

Download PDF report:

```bash
curl http://localhost:5000/reports/123.pdf -o report.pdf
```

## 📚 Documentation

- **[ONBOARDING.md](docs/ONBOARDING.md)** - Comprehensive developer guide (15 min read)
- **[KILO_INTEGRATION.md](docs/KILO_INTEGRATION.md)** - Kilo CLI integration details
- **[KILO_SETUP.md](docs/KILO_SETUP.md)** - Implementation summary
- **[REPORT_CUSTOMIZATION.md](docs/REPORT_CUSTOMIZATION.md)** - Report personalization customization

## 🏗️ Architecture

```
┌─────────────┐
│   Gateway   │ (Has database)
└──────┬──────┘
       │ HTTP POST /analyze
       ▼
┌─────────────────────────────────┐
│   Code Analyzer (this service)  │
│                                 │
│  1. Clone repo from URL         │
│  2. Run AI analysis             │
│  3. Parse metrics               │
│  4. Calculate grade             │
│  5. Generate PDF                │
│  6. Return results              │
│  7. Cleanup                     │
└─────────────────────────────────┘
       │ HTTP Response
       ▼
┌─────────────┐
│   Gateway   │ Saves to DB
└─────────────┘
```

## 🎓 Key Concepts

### The 7 Quality Metrics

1. **SOLID Principles** - Design pattern adherence
2. **Clean Code** - Readability, naming, simplicity
3. **OOP** - Object-oriented design quality
4. **Error Handling** - Exception handling, validation
5. **Testing** - Unit tests, coverage, quality
6. **Documentation** - README, comments, docs
7. **Complexity** - Cyclomatic complexity, nesting

### Grading Flow

```
Metrics (0-5 each) → Weighted Average → Percentage → Letter Grade (A-F)
                                ↓
                         Floor Rules Applied
```

### AI Backends

**OpenAI**:
- Uses GPT-4 API
- Samples up to 50 files, 200 lines each
- Fast and reliable
- Costs money

**Kilo CLI**:
- Uses custom analyzer agent (`.kilo/agent/analyzer.md`)
- Access to 500+ models via kilo Gateway
- Can use local/free models
- More flexible and customizable

## 🔐 Security

- **Input validation**: Only GitHub/GitLab URLs allowed
- **Resource limits**: Timeouts, file size limits, shallow clones
- **Cleanup**: Always removes cloned repos
- **Read-only**: Kilo agent has no write/execute permissions
- **Stateless**: No sensitive data stored

## 🐳 Docker

Build and run:

```bash
docker build -t code-analyzer .
docker run -p 5000:5000 \
  -e AGENT_BACKEND=openai \
  -e OPENAI_API_KEY=sk-... \
  code-analyzer
```

## 🤝 Contributing

1. Read [docs/ONBOARDING.md](docs/ONBOARDING.md)
2. Run tests: `.venv/bin/pytest tests/ -v`
3. Format code: `black .`
4. Lint: `ruff check .`
5. Make changes
6. Add tests
7. Submit PR

## 🛠️ Development

### Code Style

```bash
# Format code
black .

# Lint code
ruff check .
```

### Running Tests

```bash
# All tests
.venv/bin/pytest tests/ -v

# With coverage
.venv/bin/pytest --cov=core --cov-report=html

# Specific test
.venv/bin/pytest tests/test_classifier.py::TestClassify::test_a_grade -v
```

## 🆘 Support

- **Issues**: Create a Gitlab issue
- **Docs**: See [docs/ONBOARDING.md](docs/ONBOARDING.md) for detailed guide
- **Tests**: Run `.venv/bin/pytest tests/ -v` to verify setup

---

**Status**: ✅ Pipeline endpoint wired | ✅ AI report enhancement with fallback | ✅ Tests passing

**Made for the Committed platform**
