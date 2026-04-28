# Code Analyzer Service

AI-powered code quality analysis service for the Committed platform. Analyzes student code submissions and generates detailed PDF reports with quality metrics and grades.

## What Does This Service Do?

Takes a GitHub/GitLab URL → Analyzes code with AI → Assigns A–F grade → Generates PDF report

**Key Features**:
- 7 quality metrics: SOLID, clean code, OOP, error handling, testing, documentation, complexity
- Single AI analysis pass via Kilo Code CLI (one agent, one structured JSON output)
- Formal **Project Overview** section — structured academic report (summary, technologies, contributors, implementation, setup, limitations)
- ASCII file tree, architecture diagram, and UML class diagram in every report
- Automated grading with floor rules (no tests → capped at D)
- Student level inference (beginner / intermediate / advanced)
- Professional PDF reports via Typst
- Stateless microservice (no database)
- **~2–5 min per request** (Kilo AI analysis dominates; Typst PDF adds ~3 s)

## Project Structure

```
services/code-analyzer/
├── app.py                      # Flask HTTP server
├── config.py                   # Environment configuration (single source of truth)
├── requirements.txt            # Production dependencies
├── requirements-dev.txt        # Development dependencies (pytest, black, ruff)
├── Dockerfile                  # Production container
├── .env                        # Environment variables (local — not committed)
├── .env.example                # Environment template
│
├── .kilo/                      # Kilo CLI configuration
│   └── agent/
│       └── analyzer.md         # Code analyzer agent prompt
│
├── core/                       # Business logic
│   ├── git_handler.py          # Clone & cleanup repositories
│   ├── agent_runner.py         # AI analysis (KiloCodeRunner + MockRunner)
│   ├── metrics_parser.py       # Normalize raw agent output → MetricsSchema
│   ├── classifier.py           # Weighted grade calculation + floor rules
│   ├── report_generator.py     # SVG charts + Typst PDF compilation
│   └── pipeline.py             # Orchestrate all steps
│
├── models/
│   └── metrics_schema.py       # Pydantic schemas for all data shapes
│
├── templates/
│   └── report.typ              # Typst PDF template
│
├── scripts/
│   ├── kilo-analyze-wrapper.py # Kilo CLI subprocess wrapper
│   ├── kilo_utils.py           # JSON extraction from CLI output
│   └── run_analysis.py         # Local pipeline test script
│
├── tests/
│   ├── test_app_routes.py          # Flask route integration tests
│   ├── test_classifier.py          # Grading & floor rule tests
│   ├── test_git_handler.py         # Git clone/validation tests
│   ├── test_metrics_parser.py      # Parser normalization tests
│   ├── test_kilo_utils.py          # JSON extraction tests
│   ├── test_report_generator.py    # PDF generation tests
│   ├── test_student_level_inference.py
│   ├── test_enhanced_pipeline.py   # Pipeline integration tests
│   └── test_kilo_analyzer.py       # Live Kilo integration test (skipped in CI)
│
└── docs/
    ├── ONBOARDING.md           # Developer onboarding guide (start here)
    ├── KILO_INTEGRATION.md     # Kilo CLI integration, timing, troubleshooting
    ├── PROJECT_STRUCTURE.md    # Directory map and test categories
    └── REPORT_CUSTOMIZATION.md # Typst template, data payload, section reference
```

## Quick Start

### Prerequisites

- Python 3.11+
- Git
- [Typst](https://typst.app) — PDF compiler
- [Kilo Code CLI](https://kilocode.ai) — AI analysis backend

### Installation

```bash
cd services/code-analyzer

python3 -m venv .venv
source .venv/bin/activate

pip install -r requirements.txt
pip install -r requirements-dev.txt
```

### Configuration

```bash
cp .env.example .env
# Edit .env as needed (defaults work for local dev with Kilo installed)
```

Key variables (see [Configuration](#configuration) for full reference):

| Variable | Default | Purpose |
|---|---|---|
| `AGENT_RUNNER` | `kilo` | `kilo` for real analysis, `mock` for tests |
| `TYPST_BIN` | `/usr/local/bin/typst` | Path to Typst binary |
| `AGENT_CLI` | `kilo` | Kilo CLI command |
| `CLONE_DEPTH` | `50` | Shallow clone depth |
| `ALLOWED_HOSTS` | GitHub + GitLab | Accepted repository hosts |

### Run the Service

```bash
# Development
python app.py

# Production
gunicorn app:app --bind 0.0.0.0:5000
```

### Run Tests

```bash
# All tests
.venv/bin/pytest tests/ -v

# Specific module
.venv/bin/pytest tests/test_classifier.py -v

# With coverage
.venv/bin/pytest --cov=core --cov=models --cov-report=html
```

## Configuration

All settings are read from environment variables (via `.env` in development, injected by Docker/K8s in production). `Config.validate()` is called on startup and warns about missing binaries.

### Full Variable Reference

```bash
# ── Directories ───────────────────────────────────────────────────────────────
TEMP_DIR=/tmp/code-analysis        # Where repos are cloned
REPORTS_DIR=/tmp/reports           # Where PDFs are saved

# ── External tools ────────────────────────────────────────────────────────────
TYPST_BIN=/usr/local/bin/typst     # Typst binary path
AGENT_CLI=kilo                      # Kilo CLI command
AGENT_RUNNER=kilo                   # "kilo" or "mock" (for tests/CI)

# ── Git settings ──────────────────────────────────────────────────────────────
CLONE_DEPTH=50                      # Shallow clone depth
ALLOWED_HOSTS=https://github.com/,https://gitlab.com/  # Comma-separated prefixes

# ── Timeouts (seconds) ────────────────────────────────────────────────────────
CLONE_TIMEOUT=120
AGENT_TIMEOUT=300

# ── Flask ─────────────────────────────────────────────────────────────────────
PORT=5000
FLASK_DEBUG=false                   # Never true in production

# ── Services ──────────────────────────────────────────────────────────────────
NOTIFICATION_SERVICE_URL=http://notifications:5001
```

### Adding a Custom Repository Host

To accept Gitea or Bitbucket repositories, extend `ALLOWED_HOSTS`:

```bash
ALLOWED_HOSTS=https://github.com/,https://gitlab.com/,https://gitea.mycompany.com/
```

No code changes required.

### Using the Mock Runner (CI / Tests)

Set `AGENT_RUNNER=mock` to skip the live Kilo CLI and return deterministic stub metrics. Useful for CI pipelines and integration tests that don't have Kilo installed:

```bash
AGENT_RUNNER=mock python app.py
```

## Grading Configuration

Weights and floor rules are defined in [core/classifier.py](core/classifier.py):

```python
# Metric weights (must sum to 1.0)
WEIGHTS = {
    "solid": 0.20,
    "clean_code": 0.20,
    "oop": 0.15,
    "error_handling": 0.15,
    "testing": 0.15,
    "documentation": 0.10,
    "complexity": 0.05,
}

# Grade thresholds
GRADE_THRESHOLDS = [
    (85, "A"), (70, "B"), (55, "C"), (40, "D"), (0, "F"),
]

# Floor rules — cap the grade when a critical metric is missing.
# Even if all other metrics are perfect, no tests → max D.
FLOOR_RULES = [
    ("testing", 1.0, "D"),        # No meaningful tests
    ("error_handling", 1.0, "D"), # No error handling
]
```

### Student Level Inference

Inferred after grading and included in every analysis result:

| Level | Condition |
|---|---|
| `advanced` | Grade A or B, avg score ≥ 3.5, percentage ≥ 72 |
| `beginner` | Grade D/F, avg score < 2.0, or testing < 1.0 |
| `intermediate` | Everything else |

## API Endpoints

### POST /analyze

Accepts a submission and runs the full analysis pipeline synchronously.

```bash
curl -X POST http://localhost:5000/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "submissionId": 123,
    "repoUrl": "https://github.com/user/repo",
    "studentId": 456
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
  "breakdown": { "solid": { "score": 3.8, "max": 5.0, "weighted_contribution": 15.2 }, "..." },
  "metrics": { "..." },
  "reportUrl": "/reports/123.pdf",
  "analyzedAt": "2026-04-01T12:00:00+00:00"
}
```

Error response (pipeline failure):
```json
{
  "submissionId": 123,
  "status": "failed",
  "error": "Git clone failed: repository not found"
}
```

### GET /health

```bash
curl http://localhost:5000/health
# {"status": "UP", "service": "code-analyzer", "timestamp": "..."}
```

### GET /reports/\<filename\>

Serves a previously generated PDF. Only `.pdf` filenames are accepted; path traversal attempts return 400.

```bash
curl http://localhost:5000/reports/123.pdf -o report.pdf
```

## Architecture

```
┌─────────────┐
│   Gateway   │ (owns the database)
└──────┬──────┘
       │ POST /analyze
       ▼
┌─────────────────────────────────────────┐
│         Code Analyzer (this service)    │
│                                         │
│  1. Validate & clone repository         │
│  2. Run Kilo Code analyzer agent        │
│  3. Inject commit hygiene + file tree   │
│  4. Parse & validate metrics (Pydantic) │
│  5. Calculate A–F grade + floor rules   │
│  6. Generate SVGs + compile PDF (Typst) │
│  7. Return results + cleanup            │
└─────────────────────────────────────────┘
       │ HTTP Response
       ▼
┌─────────────┐
│   Gateway   │ Persists to DB
└─────────────┘
```

## Security

- **Input validation**: Only allow-listed host prefixes accepted; configurable via `ALLOWED_HOSTS`
- **Path traversal protection**: `/reports/<file>` rejects any filename with path components or non-`.pdf` extension
- **Resource limits**: `CLONE_TIMEOUT`, `AGENT_TIMEOUT`, shallow clone depth
- **Read-only agent**: Kilo agent has no `write`/`edit`/`bash` permissions (see `.kilo/agent/analyzer.md`)
- **Stateless**: No student data stored — cloned repos deleted immediately after analysis

## Docker

```bash
docker build -t code-analyzer .
docker run -p 5000:5000 \
  -e AGENT_CLI=kilo \
  -e TYPST_BIN=/usr/local/bin/typst \
  code-analyzer
```

## Contributing

1. Read [docs/ONBOARDING.md](docs/ONBOARDING.md)
2. Run tests: `.venv/bin/pytest tests/ -v`
3. Format: `black .`
4. Lint: `ruff check .`
5. Add tests for your change
6. Submit PR

---

**Documentation**: [ONBOARDING.md](docs/ONBOARDING.md) · [KILO_INTEGRATION.md](docs/KILO_INTEGRATION.md) · [REPORT_CUSTOMIZATION.md](docs/REPORT_CUSTOMIZATION.md) · [PROJECT_STRUCTURE.md](docs/PROJECT_STRUCTURE.md)
