# Code Analyzer Service — Project Structure

## Directory Overview

```
services/code-analyzer/
├── .kilo/                      # Kilo CLI configuration
├── core/                       # Business logic
├── docs/                       # Documentation
├── models/                     # Pydantic data schemas
├── report_samples/             # Generated PDF samples (git-ignored)
├── scripts/                    # Utility and wrapper scripts
├── templates/                  # Typst report template
├── tests/                      # Unit and integration tests
├── app.py                      # Flask HTTP layer
├── config.py                   # All configuration (single source of truth)
├── Dockerfile                  # Production container
├── README.md                   # Quick-start and API reference
├── requirements.txt            # Production dependencies
└── requirements-dev.txt        # Dev tools (pytest, black, ruff)
```

---

## `.kilo/` — Kilo CLI Agent

```
.kilo/
└── agent/
    └── analyzer.md     # Custom agent: reads repos, outputs structured JSON
```

The agent prompt defines scoring guidelines, per-file analysis rules, architecture/class
diagram extraction, and the `project_overview` academic report format.
It is read-only — no bash, write, or edit permissions.

---

## `core/` — Business Logic

```
core/
├── __init__.py
├── pipeline.py          # Step 1–7 orchestration (clone → AI → parse → grade → PDF)
├── git_handler.py       # Clone + URL validation + cleanup
├── agent_runner.py      # KiloCodeRunner + MockRunner; get_runner() selector
├── metrics_parser.py    # Normalize raw agent JSON → MetricsSchema
├── classifier.py        # Weighted grade calculation + floor rules + student level
└── report_generator.py  # SVG generation + Typst compilation → PDF
```

**Entry points:**

| File | What it does |
|---|---|
| `pipeline.py` | `run_analysis(submission_id, repo_url)` — the full pipeline |
| `agent_runner.py` | `get_runner()` — returns `KiloCodeRunner` or `MockRunner` |
| `classifier.py` | `classify(metrics)` — weighted grade, floor rules, student level |
| `report_generator.py` | `generate(...)` — SVG charts + Typst PDF |

---

## `models/` — Data Schemas

```
models/
├── __init__.py
└── metrics_schema.py    # All Pydantic models
```

**Key models:**

| Model | Purpose |
|---|---|
| `MetricDetail` | One metric: `score`, `max`, `notes`, `confidence` |
| `FileAnalysis` | Per-file: lines, complexity, duplication, issues list |
| `DependencyHealth` | Dependency counts + `DependencyDetail` list |
| `CommitHygiene` | Score, commit count, message quality |
| `Recommendation` | Title, description, priority, effort, evidence |
| `QuickWin` | Title, description, effort |
| `ArchComponent` / `ArchConnection` | Architecture diagram nodes and edges |
| `ClassEntry` / `ClassRelationship` | UML class boxes and relationships |
| `ProjectOverview` | Formal academic report: summary, technologies, contributors, … |
| `MetricsSchema` | Root model containing all of the above |

---

## `scripts/` — Utilities

```
scripts/
├── kilo-analyze-wrapper.py  # Subprocess wrapper: invokes Kilo CLI, returns raw output
├── kilo_utils.py            # extract_json() + markdown fence stripper
├── quick_check.py           # Sanity-check script for Kilo CLI availability
└── run_analysis.py          # Local end-to-end test (runs against a real GitHub URL)
```

Run a full local test without the Flask server:

```bash
cd services/code-analyzer
source .venv/bin/activate
python scripts/run_analysis.py
```

---

## `templates/` — PDF Template

```
templates/
└── report.typ    # Typst source: layout, colors, all section rendering
```

Sections are conditionally rendered based on whether the corresponding data field is
non-empty.  See [REPORT_CUSTOMIZATION.md](REPORT_CUSTOMIZATION.md) for the full section
reference and customization guide.

---

## `tests/` — Test Suite

```
tests/
├── __init__.py
├── test_app_routes.py              # Flask routes (POST /analyze, GET /reports/<f>)
├── test_classifier.py              # Grade calc, floor rules, boundary smoothing
├── test_enhanced_pipeline.py       # Full pipeline with all external calls mocked
├── test_git_handler.py             # URL validation, clone success/failure
├── test_kilo_analyzer.py           # Live Kilo CLI integration (skipped in CI)
├── test_kilo_utils.py              # extract_json + fence stripping
├── test_metrics_parser.py          # All parser normalization paths
├── test_report_generator.py        # Typst compilation (mocked subprocess)
└── test_student_level_inference.py # Student level boundary conditions
```

**Test categories:**

| Category | Files | Speed |
|---|---|---|
| Unit (fully mocked) | classifier, git_handler, metrics_parser, kilo_utils, report_generator, student_level | Fast (< 1 s) |
| Integration (mocked external) | app_routes, enhanced_pipeline | Fast (< 1 s) |
| Live (real Kilo CLI) | test_kilo_analyzer | Slow (~3 min), skipped by default |

```bash
pytest tests/ -v                           # All tests
pytest tests/test_classifier.py -v        # Single module
pytest --cov=core --cov=models            # With coverage
```

---

## `docs/` — Documentation

```
docs/
├── ONBOARDING.md           # 15-minute developer onboarding guide (start here)
├── KILO_INTEGRATION.md     # Kilo CLI integration details and troubleshooting
├── PROJECT_STRUCTURE.md    # This file
└── REPORT_CUSTOMIZATION.md # Template, data payload, and section reference
```

**Reading order for new contributors:**

1. `ONBOARDING.md` — architecture, data flow, common pitfalls
2. `KILO_INTEGRATION.md` — AI backend setup and configuration
3. `REPORT_CUSTOMIZATION.md` — if you need to modify the PDF output

---

**Last updated**: 2026-04-13
