# Code Analyzer Service — Developer Onboarding

Welcome! This guide walks through everything you need to be productive on the code-analyzer service in about 15 minutes.

---

## What Problem Does This Service Solve?

**Problem**: Students submit code to the Committed platform. Teachers need automated, consistent, professional feedback on code quality.

**Solution**: This service takes a GitHub/GitLab URL, analyzes the code using the Kilo Code AI CLI, generates quality metrics, assigns an A–F grade, and produces a professional PDF report — all in a single synchronous pipeline.

**Key Constraint**: This is a **stateless microservice with no database**. The Gateway sends everything we need via HTTP, and we return results immediately.

---

## Architecture Overview

```
Gateway Service (owns the DB)
    │
    │ POST /analyze  {"submissionId": 123, "repoUrl": "..."}
    ▼
┌─────────────────────────────────────────┐
│         Code Analyzer (our service)     │
│                                         │
│  1. Validate URL + clone repo           │
│  2. Run Kilo Code analyzer agent        │
│  3. Inject commit hygiene + file tree   │
│  4. Parse + validate metrics (Pydantic) │
│  5. Calculate A–F grade + floor rules   │
│  6. Generate SVGs + compile PDF (Typst) │
│  7. Return results + cleanup repo       │
└─────────────────────────────────────────┘
    │
    │ {"status": "completed", "grade": "B", ...}
    ▼
Gateway persists to DB
```

### Why This Design?

- **Separation of concerns**: Analysis logic isolated from data persistence
- **Scalability**: Stateless → multiple instances, no coordination needed
- **Flexibility**: AI backend is a swappable strategy (`AGENT_RUNNER` env var)
- **Security**: Never stores student code; cleans up immediately after analysis

---

## Project Structure

```
services/code-analyzer/
├── app.py                 # Flask HTTP layer — thin, validation only
├── config.py              # All config in one place (reads from env / .env)
├── requirements.txt       # Production deps
├── requirements-dev.txt   # Dev tools (pytest, black, ruff)
├── Dockerfile             # Production container with Typst compiler
├── .env.example           # Template for local development
│
├── core/                  # Business logic
│   ├── git_handler.py     # Step 1: Clone repos safely
│   ├── agent_runner.py    # Step 2: Run AI (KiloCodeRunner or MockRunner)
│   ├── metrics_parser.py  # Step 3: Normalize agent output
│   ├── classifier.py      # Step 4: Calculate grades + floor rules
│   ├── report_generator.py # Step 5: SVG charts + Typst PDF
│   └── pipeline.py        # Orchestrate steps 1–7
│
├── models/
│   └── metrics_schema.py  # Pydantic models — validated data shapes
│
├── templates/
│   └── report.typ         # Typst PDF template
│
├── .kilo/agent/
│   └── analyzer.md        # Kilo Code agent prompt (read-only permissions)
│
└── tests/                 # Unit + integration tests (mock external deps)
    ├── test_app_routes.py
    ├── test_classifier.py
    ├── test_git_handler.py
    ├── test_metrics_parser.py
    ├── test_kilo_utils.py
    ├── test_report_generator.py
    └── ...
```

---

## Data Flow — Follow a Request

### 1. Request arrives (`app.py`)

```python
POST /analyze
{"submissionId": 123, "repoUrl": "https://github.com/student/repo", "studentId": 456}
```

`app.py` is intentionally thin — it validates input types and delegates to the pipeline:

```python
@app.route("/analyze", methods=["POST"])
def analyze():
    data = request.get_json(force=True, silent=True)
    submission_id = int(data["submissionId"])   # validated as positive int
    repo_url = data["repoUrl"]
    result = run_analysis(submission_id, repo_url)
    return jsonify(result), 200 if result["status"] == "completed" else 500
```

Business logic lives in `core/`, not in `app.py`.

---

### 2. Pipeline orchestrates (`core/pipeline.py`)

```python
def run_analysis(submission_id: int, repo_url: str) -> dict:
    repo_path = None
    try:
        repo_path = git_handler.clone(repo_url, submission_id)    # Step 1
        raw = agent_runner.get_runner().run(repo_path)             # Step 2
        raw["commit_hygiene"] = _calculate_commit_hygiene(repo_path)
        raw["file_tree"] = _generate_file_tree(repo_path)          # Step 3
        metrics = metrics_parser.parse(raw)                        # Step 4
        classification = classifier.classify(metrics)              # Step 5
        pdf_path = report_generator.generate(...)                  # Step 6
        return {"status": "completed", "grade": "B", ...}
    except Exception as e:
        return {"status": "failed", "error": str(e)}
    finally:
        git_handler.cleanup(repo_path)                             # Step 7 — always
```

The `finally` block guarantees cleanup even if the analysis fails.

---

### 3. Git handler clones (`core/git_handler.py`)

URL validation uses `Config.ALLOWED_HOSTS` (env-configurable, defaults to GitHub + GitLab). Shallow clones (`--depth Config.CLONE_DEPTH`) keep things fast.

```python
def clone(repo_url: str, submission_id: int) -> str:
    validate_url(repo_url)   # raises ValueError if host not allowed
    result = subprocess.run(
        ["git", "clone", "--depth", str(Config.CLONE_DEPTH), repo_url, target],
        timeout=Config.CLONE_TIMEOUT,
        ...
    )
```

To add a new host (e.g. self-hosted Gitea):
```bash
ALLOWED_HOSTS=https://github.com/,https://gitea.mycompany.com/
```

No code change needed.

---

### 4. AI agent runs (`core/agent_runner.py`)

Two implementations behind a common interface:

```python
class BaseRunner(ABC):
    @abstractmethod
    def run(self, repo_path: str) -> dict: ...

class KiloCodeRunner(BaseRunner):
    """Invokes the Kilo Code CLI via kilo-analyze-wrapper.py."""

class MockRunner(BaseRunner):
    """Returns deterministic stub data — no Kilo CLI needed.
    Activate with AGENT_RUNNER=mock."""

def get_runner() -> BaseRunner:
    return MockRunner() if Config.AGENT_RUNNER == "mock" else KiloCodeRunner()
```

The `MockRunner` is the correct way to test the pipeline without a live AI backend. Set `AGENT_RUNNER=mock` in `.env` or in the test environment.

---

### 5. Metrics parser normalizes (`core/metrics_parser.py`)

AI output is unpredictable. The parser handles all edge cases before Pydantic validation:

```python
# Agent returns bare number → wrapped
{"solid": 4}  →  {"score": 4.0, "notes": "", "confidence": 0.5}

# Agent omits metric → sensible default
{}  →  {"score": 0.0, "notes": "Could not evaluate.", "confidence": 0.5}

# Agent wraps in markdown fence → fence stripped by kilo_utils first
```

The parsed dict is then validated by `MetricsSchema(**normalized)` — Pydantic rejects out-of-range scores.

---

### 6. Classifier grades (`core/classifier.py`)

```python
WEIGHTS = {"solid": 0.20, "clean_code": 0.20, "oop": 0.15, ...}

GRADE_THRESHOLDS = [(85, "A"), (70, "B"), (55, "C"), (40, "D"), (0, "F")]

FLOOR_RULES = [
    ("testing", 1.0, "D"),        # No tests → cap at D
    ("error_handling", 1.0, "D"), # No error handling → cap at D
]
```

Grade flow:

1. Weighted percentage (`0–100`)
2. Map to letter grade via thresholds
3. Apply floor rules — if an earned grade is *better* than the cap and the metric is below the minimum, downgrade to the cap
4. Infer student level (`advanced` / `intermediate` / `beginner`)

Floor rules use `ord(grade) < ord(cap_grade)` to compare severity — `ord('A')=65 < ord('D')=68`, so a better grade has a lower `ord()` value.

---

### 7. Report generator creates PDF (`core/report_generator.py`)

Three SVG assets are generated in Python and compiled alongside a JSON data blob using Typst:

| SVG | Description |
|---|---|
| Radar chart | Spider chart of the 7 metric scores |
| Architecture diagram | Layered component + arrow diagram |
| Class diagram | UML-style class boxes with fields/methods |

```python
def generate(submission_id, repo_url, metrics, classification, analyzed_at) -> str:
    # 1. Generate SVG assets
    radar_svg = generate_radar_svg(scores, labels)
    arch_svg = generate_architecture_svg(components, connections)   # if present
    class_svg = generate_class_diagram_svg(classes)                 # if present

    # 2. Write JSON data blob
    data_json = json.dumps({...all metrics and metadata...})

    # 3. Compile with Typst
    subprocess.run(["typst", "compile", src_path, pdf_path], ...)

    # 4. Cleanup temp files, return pdf_path
```

**Why Typst over LaTeX?** Single ~20 MB binary, millisecond compilation, simple syntax, easy to version-control.

---

## Configuration Reference

All variables are read from the environment (or `.env` locally). `Config.validate()` logs a warning at startup for any binary that can't be found on PATH.

| Variable | Default | Description |
|---|---|---|
| `TEMP_DIR` | `/tmp/code-analysis` | Where repos are cloned |
| `REPORTS_DIR` | `/tmp/reports` | Where PDFs are saved |
| `TYPST_BIN` | `/usr/local/bin/typst` | Path to Typst binary |
| `AGENT_CLI` | `kilo` | Kilo CLI command (must be on PATH) |
| `AGENT_RUNNER` | `kilo` | `"kilo"` for live AI, `"mock"` for CI/tests |
| `CLONE_DEPTH` | `50` | Git shallow clone depth |
| `ALLOWED_HOSTS` | GitHub + GitLab | Comma-separated URL prefixes |
| `CLONE_TIMEOUT` | `120` | Git clone timeout (s) |
| `AGENT_TIMEOUT` | `300` | Kilo CLI timeout (s) |
| `PORT` | `5000` | Flask port |
| `FLASK_DEBUG` | `false` | Never `true` in production |
| `NOTIFICATION_SERVICE_URL` | `http://notifications:5001` | Placeholder — notifications service not yet wired |

---

## Testing Strategy

Tests use **mocking** to avoid external dependencies (no real git clones, no live AI).

### Running Tests

```bash
# All tests
pytest tests/ -v

# Single module
pytest tests/test_classifier.py -v

# Single test
pytest tests/test_classifier.py::TestClassify::test_floor_rule -v -s

# With coverage report
pytest --cov=core --cov=models --cov-report=html
# Open htmlcov/index.html
```

### Test Layout

```
test_app_routes.py              → Flask routes (missing fields, path traversal, invalid IDs)
test_classifier.py              → Grades, floor rules, boundary smoothing, student level
test_git_handler.py             → URL validation, clone success/failure
test_metrics_parser.py          → All fields including new schema additions
test_kilo_utils.py              → JSON extraction + markdown fence stripping
test_report_generator.py        → Typst compilation mocked, SVG paths
test_student_level_inference.py → Level boundary conditions
test_enhanced_pipeline.py       → Full pipeline with all steps mocked
test_kilo_analyzer.py           → Live Kilo integration (skipped unless Kilo installed)
```

### Writing a Mock Test

```python
@patch("core.git_handler.subprocess.run")
def test_successful_clone(mock_run):
    mock_run.return_value = MagicMock(returncode=0, stderr="")
    result = git_handler.clone("https://github.com/user/repo", 123)
    assert "sub_123" in result
    mock_run.assert_called_once()
```

---

## How to Make Changes

### Adding a New Metric

1. **Schema** (`models/metrics_schema.py`): `MetricsSchema` covers 7 standard metrics via `MetricDetail`. Add a new field there.
2. **Parser** (`core/metrics_parser.py`): Add the key to the core-metrics loop.
3. **Classifier** (`core/classifier.py`): Add to `WEIGHTS` (must still sum to 1.0).
4. **Agent prompt** (`.kilo/agent/analyzer.md`): Add description and JSON example.
5. **Tests**: Add assertions in `test_metrics_parser.py` and `test_classifier.py`.

### Adding a Narrative Field (non-metric)

For fields like `project_overview` that come from the agent but aren't graded:

1. **Schema** (`models/metrics_schema.py`): Add a new Pydantic model and a field on `MetricsSchema`.
2. **Parser** (`core/metrics_parser.py`): Add a `_parse_*()` helper and call it from `parse()`.
3. **Report generator** (`core/report_generator.py`): Include the field in the `data` dict passed to Typst.
4. **Template** (`templates/report.typ`): Add a guarded section using `data.at("field", default: ...)`.
5. **Agent prompt** (`.kilo/agent/analyzer.md`): Add the field spec and a complete JSON example.

### Adding a New AI Backend

1. Create a class extending `BaseRunner` in `core/agent_runner.py`:

```python
class MyRunner(BaseRunner):
    def run(self, repo_path: str) -> dict:
        # ... call your AI API and return the raw metrics dict
```

2. Register it in `get_runner()`:

```python
def get_runner() -> BaseRunner:
    match Config.AGENT_RUNNER.lower():
        case "kilo": return KiloCodeRunner()
        case "mock": return MockRunner()
        case "mine": return MyRunner()
        case _:      return KiloCodeRunner()
```

3. Add any required env vars to `config.py` and `.env.example`.

### Changing the Grading Algorithm

Edit `core/classifier.py`. The `classify()` function is self-contained — change `WEIGHTS`, `GRADE_THRESHOLDS`, or `FLOOR_RULES` without touching anything else.

### Customizing the PDF Report

See [REPORT_CUSTOMIZATION.md](REPORT_CUSTOMIZATION.md). The template is `templates/report.typ`; the data it receives is the JSON blob built in `report_generator.generate()`.

---

## Common Pitfalls

### Forgetting to clean up cloned repos

```python
# Always wrap the pipeline in try/finally
repo_path = None
try:
    repo_path = git_handler.clone(...)
    # ...
finally:
    git_handler.cleanup(repo_path)  # runs even on exception
```

### Using model_copy() to inject data into MetricsSchema

`model_copy(update={...})` bypasses Pydantic validators, so nested dicts stay as plain dicts instead of becoming Pydantic models.

```python
# Wrong — architecture_components remain as plain dicts
metrics = metrics.model_copy(update={"architecture_components": [{"id": "X", ...}]})

# Correct — go through MetricsSchema(**...) so validators run
data = metrics.model_dump()
data["architecture_components"] = [{"id": "X", ...}]
metrics = MetricsSchema(**data)
```

### Hardcoding configuration

```python
# Wrong
timeout = 120

# Correct
timeout = Config.CLONE_TIMEOUT
```

### Not escaping user content in SVG

SVG is XML. Java generics (`Map<String, Foo>`) and special characters break the document if not escaped. Always use the `_svg_escape()` helper:

```python
label = _svg_escape(comp.get("label", ""))   # html.escape under the hood
```

---

## Development Workflow

```bash
# 1. Activate environment
source .venv/bin/activate

# 2. Make changes

# 3. Format + lint
black . && ruff check .

# 4. Test
pytest tests/ -v

# 5. Manual test with a real repo
python app.py   # in one terminal
curl -X POST http://localhost:5000/analyze \
  -H "Content-Type: application/json" \
  -d '{"submissionId": 999, "repoUrl": "https://github.com/octocat/Hello-World"}'
```

---

## Resources

- [Typst Docs](https://typst.app/docs) — PDF template syntax
- [Pydantic Docs](https://docs.pydantic.dev) — Data validation
- [Flask Docs](https://flask.palletsprojects.com) — Web framework
- [pytest Docs](https://docs.pytest.org) — Testing

---

## FAQ

**Q: Why no database?**
Microservice principle — single responsibility. The Gateway handles persistence; we handle analysis.

**Q: Why Typst over LaTeX?**
~20 MB binary vs 5 GB TeX Live. Millisecond compilation. Simple syntax.

**Q: How long does one analysis take?**
Typically 2–5 minutes end-to-end. The dominant cost is the Kilo AI analysis (~1.5–4 min depending on repo size and model load). Git clone adds 5–30 s; Typst PDF compilation adds 2–5 s. Everything else is under 1 s.

**Q: What if the AI returns garbage?**
`metrics_parser.py` handles all edge cases with sensible defaults. Worst case: all scores default to 0.

**Q: How do we prevent malicious repositories?**
URL allow-list (`ALLOWED_HOSTS`), shallow clone, timeouts, and the Kilo agent is read-only (no bash/write permissions).

**Q: How do I test without a real Kilo installation?**
Set `AGENT_RUNNER=mock`. `MockRunner` returns a valid stub payload so the full pipeline runs without any AI.
