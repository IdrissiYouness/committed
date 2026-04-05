# Code Analyzer Service - Project Structure

## 📁 Directory Overview

```
services/code-analyzer/
├── .kilo/                      # Kilo CLI configuration
├── core/                       # Business logic modules
├── docs/                       # Documentation
├── models/                     # Data schemas
├── scripts/                    # Utility scripts
├── templates/                  # Report templates
├── tests/                      # Tests & examples
├── app.py                      # Flask application
├── config.py                   # Configuration
├── Dockerfile                  # Container definition
├── README.md                   # Main documentation
└── requirements*.txt           # Dependencies
```

## 📂 Detailed Structure

### `.kilo/` - Kilo CLI Configuration
```
.kilo/
└── agent/
    └── analyzer.md         # Custom analyzer agent for code quality analysis
```

**Purpose**: Defines custom kilo agents for AI-powered code analysis

### `core/` - Business Logic
```
core/
├── __init__.py
├── agent_runner.py         # AI analysis orchestration (OpenAI/Kilo)
├── classifier.py           # Grade calculation (A-F)
├── git_handler.py          # Git operations (clone/cleanup)
├── metrics_parser.py       # Normalize AI responses
├── pipeline.py             # Main orchestration pipeline
└── report_generator.py     # PDF generation via Typst
```

**Purpose**: Core business logic for the analysis pipeline

**Key Files**:
- `pipeline.py` - Entry point that orchestrates all steps
- `agent_runner.py` - Handles AI backends (switchable)
- `classifier.py` - Grading algorithm (configurable weights)

### `docs/` - Documentation
```
docs/
├── KILO_INTEGRATION.md     # Kilo CLI integration guide
├── KILO_SETUP.md           # Implementation summary
├── ONBOARDING.md           # Developer onboarding (15 min read)
├── PROJECT_STRUCTURE.md    # Structure and dependencies
└── REPORT_CUSTOMIZATION.md # AI report customization
```

**Purpose**: Comprehensive documentation for developers

**Start Here**:
1. Read `ONBOARDING.md` first (complete guide)
2. Then `KILO_INTEGRATION.md` (if using kilo)
3. Refer to `KILO_SETUP.md` (quick reference)

### `models/` - Data Schemas
```
models/
├── __init__.py
└── metrics_schema.py       # Pydantic models for validation
```

**Purpose**: Define data structures with type validation

**Key Classes**:
- `MetricDetail` - Individual metric (score + notes)
- `MetricsSchema` - Complete analysis result

### `scripts/` - Utility Scripts
```
scripts/
├── kilo-analyze-wrapper.py  # Python wrapper for kilo CLI
├── kilo-analyze.sh          # Bash wrapper (alternative)
└── manual_test_kilo.sh      # Quick manual test
```

**Purpose**: Helper scripts for kilo integration and testing

**Usage**:
- `kilo-analyze-wrapper.py` - Called by `KiloCodeRunner`
- `manual_test_kilo.sh` - Quick CLI test

### `templates/` - Report Templates
```
templates/
└── report.typ              # Typst PDF template
```

**Purpose**: PDF report generation templates

**Format**: Typst markup language (modern LaTeX alternative)

### `tests/` - Tests & Examples
```
tests/
├── __init__.py
├── test_app_routes.py      # POST /analyze route tests
├── quick_test.py           # Quick verification (30 sec)
├── test_analysis.py        # Full pipeline test
├── test_classifier.py      # Grading logic tests (unit)
├── test_enhanced_pipeline.py # Pipeline integration checks
├── test_git_handler.py     # Git operations tests (unit)
├── test_kilo_analyzer.py   # Kilo integration test
├── test_manual_flow.py     # Manual simulation (no AI)
├── test_metrics_parser.py  # Parser tests (unit)
├── test_report_content.py  # AI report-content tests
├── test_report_generator.py # PDF generation tests (unit)
└── test_student_level_inference.py # student_level inference tests
```

**Purpose**: Unit tests and integration examples

**Test Categories**:
- **Unit tests**: parser/classifier/report tests (fast, mocked)
- **Integration tests**: `test_analysis.py`, `test_kilo_analyzer.py`, `test_app_routes.py`
- **Examples**: `test_manual_flow.py`, `quick_test.py`

**Run Tests**:
```bash
.venv/bin/pytest tests/ -v                     # All tests
.venv/bin/pytest tests/test_classifier.py -v   # Specific test
.venv/bin/pytest --cov=core --cov=models       # With coverage
```

### Root Files

**Configuration**:
- `.env` - Local environment variables (git-ignored)
- `.env.example` - Environment template
- `config.py` - Configuration loader
- `pyrightconfig.json` - Python type checking config

**Application**:
- `app.py` - Flask HTTP server
- `Dockerfile` - Production container

**Dependencies**:
- `requirements.txt` - Production dependencies
- `requirements-dev.txt` - Development tools

**Documentation**:
- `README.md` - Main project documentation

## 🧪 Test Organization

### Unit Tests (Fast, Mocked)
- `test_classifier.py` - Grading algorithm
- `test_git_handler.py` - Git operations
- `test_metrics_parser.py` - Data parsing
- `test_report_generator.py` - PDF generation
- `test_report_content.py` - AI enhancement parsing/fallback
- `test_student_level_inference.py` - Student level inference rules

### Integration Tests (Slower, Real)
- `test_kilo_analyzer.py` - Kilo CLI integration (skipped by default, requires auth)
- `test_app_routes.py` - Flask route behaviour with mocks
- `test_enhanced_pipeline.py` - Pipeline integration checks

### Manual Scripts (not pytest)
- `scripts/run_analysis.py` - Full pipeline against a real repo
- `scripts/quick_check.py` - Quick kilo sanity check

## 📚 Related Documentation

- [README.md](../README.md) - Quick start guide
- [docs/ONBOARDING.md](../docs/ONBOARDING.md) - Developer onboarding
- [docs/KILO_INTEGRATION.md](../docs/KILO_INTEGRATION.md) - Kilo setup

---

**Last Updated**: 2026-04-05
**Status**: ✅ Clean structure, all tests passing
