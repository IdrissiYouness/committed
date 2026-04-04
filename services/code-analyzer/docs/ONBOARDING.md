# AI Analysis Service - Senior Developer Onboarding 🎓

Welcome to the Code Analyzer service! Let me walk you through everything you need to know to be productive on this codebase. Grab a coffee ☕ - this will take about 15 minutes.

## 🎯 What Problem Does This Service Solve?

**The Problem**: Students submit code to the Committed platform. Teachers need automated, consistent, professional feedback on code quality.

**Our Solution**: This service takes a GitHub/GitLab URL, analyzes the code using AI, generates quality metrics, assigns an A-F grade, and produces a professional PDF report.

**Key Constraint**: This is a **stateless microservice**. We have NO database. The Gateway service sends us everything we need via HTTP, and we return results.

---

## 🏗️ Architecture Overview

### The Big Picture

```
Gateway Service (has the DB)
    ↓ HTTP POST
┌─────────────────────────────────┐
│   Code Analyzer (our service)   │
│                                 │
│  1. Clone repo from URL         │
│  2. Run AI analysis             │
│  3. Parse metrics               │
│  4. Calculate grade             │
│  5. Generate PDF report         │
│  6. Return results              │
│  7. Cleanup                     │
└─────────────────────────────────┘
    ↓ HTTP Response
Gateway saves results to DB
```

### Why This Design?

- **Separation of Concerns**: Analysis logic is isolated from data persistence
- **Scalability**: Can run multiple analyzer instances, no shared state
- **Flexibility**: Can swap out AI backends (OpenAI, Kilo Code, etc.) without touching Gateway
- **Security**: Never stores sensitive data, cleans up immediately

---

## 📁 Project Structure Deep Dive

Let me show you the actual structure and explain WHY each piece exists:

```
services/code-analyzer/
├── app.py                 # Flask app - THIN layer, just HTTP handling
├── config.py              # All environment variables - SINGLE source of config
├── requirements.txt       # Production deps
├── requirements-dev.txt   # Dev tools (pytest, black, ruff)
├── Dockerfile            # Production container with Typst compiler
├── .env.example          # Template for local development
│
├── core/                 # The BRAIN - all business logic lives here
│   ├── git_handler.py    # Step 1: Clone repos safely
│   ├── agent_runner.py   # Step 2: Run AI analysis
│   ├── metrics_parser.py # Step 3: Normalize AI output
│   ├── classifier.py     # Step 4: Calculate grades
│   ├── report_generator.py # Step 5: Create PDFs
│   └── pipeline.py       # Step 6: Orchestrate everything
│
├── models/               # Data contracts - what shape is our data?
│   └── metrics_schema.py # Pydantic models for validation
│
├── templates/            # PDF report template
│   └── report.typ        # Typst markup (like LaTeX but modern)
│
└── tests/               # Unit tests - your safety net
    ├── test_git_handler.py
    ├── test_metrics_parser.py
    ├── test_classifier.py
    └── test_report_generator.py
```

---

## 🔄 Data Flow - Follow a Request

Let me trace what happens when a student submits code:

### 1. **Request Arrives** (`app.py`)

```python
POST /analyze
{
  "submissionId": 123,
  "repoUrl": "https://github.com/student/assignment-1"
}
```

The Flask app is **dumb** - it just validates input and calls the pipeline:

```python
@app.route('/analyze', methods=['POST'])
def analyze():
    data = request.get_json()
    submission_id = data.get('submissionId')
    repo_url = data.get('repoUrl')
    
    # Call the pipeline (all logic is there)
    result = run_analysis(int(submission_id), repo_url)
    return jsonify(result)
```

**Why this matters**: Keep app.py thin. Business logic goes in `core/`.

---

### 2. **Pipeline Orchestrates** (`core/pipeline.py`)

This is the **conductor** of our orchestra. It coordinates all the steps:

```python
def run_analysis(submission_id: int, repo_url: str) -> dict:
    repo_path = None
    try:
        # Step 1: Clone
        repo_path = git_handler.clone(repo_url, submission_id)
        
        # Step 2: Analyze with AI
        runner = agent_runner.get_runner()  # Factory pattern
        raw = runner.run(repo_path)
        
        # Step 3: Parse results
        metrics = metrics_parser.parse(raw)
        
        # Step 4: Grade it
        classification = classifier.classify(metrics)
        
        # Step 5: Make PDF
        pdf_path = report_generator.generate(...)
        
        # Step 6: Return
        return {"status": "completed", "grade": "B", ...}
    
    except Exception as e:
        return {"status": "failed", "error": str(e)}
    
    finally:
        # Step 7: ALWAYS cleanup
        if repo_path:
            git_handler.cleanup(repo_path)
```

**Key Pattern**: Try/Except/Finally ensures we ALWAYS cleanup, even on errors.

---

### 3. **Git Handler Clones** (`core/git_handler.py`)

Security is critical here - we're executing `git clone` on user input!

```python
def clone(repo_url: str, submission_id: int) -> str:
    # SECURITY: Validate URL
    validate_url(repo_url)  # Only GitHub/GitLab allowed
    
    # Create isolated directory
    target = f"/tmp/code-analysis/sub_{submission_id}"
    
    # Shallow clone (--depth 1) - fast, uses less disk
    result = subprocess.run(
        ["git", "clone", "--depth", "1", repo_url, target],
        timeout=120,  # Hard timeout prevents hanging
        capture_output=True
    )
    
    if result.returncode != 0:
        raise RuntimeError(f"Clone failed: {result.stderr}")
    
    return target
```

**Why shallow clone?** 
- We only need current code, not git history
- Saves 90% of time and disk space
- Student repos can be huge

**Why validation?**
- Prevent command injection
- Restrict to trusted hosts
- Regex validates format

---

### 4. **AI Agent Runs** (`core/agent_runner.py`)

This is where the magic happens. We have two backends:

#### Strategy Pattern

```python
class BaseRunner(ABC):
    @abstractmethod
    def run(self, repo_path: str) -> dict:
        raise NotImplementedError

class OpenAIRunner(BaseRunner):
    # Uses OpenAI API directly
    
class KiloCodeRunner(BaseRunner):
    # Uses Kilo Code CLI

def get_runner() -> BaseRunner:
    if Config.AGENT_BACKEND == "openai":
        return OpenAIRunner()
    elif Config.AGENT_BACKEND == "kilocode":
        return KiloCodeRunner()
```

**Why this pattern?**
- Easy to swap backends
- Easy to add new backends (Claude, Gemini, etc.)
- Each runner is independently testable

#### OpenAI Runner Deep Dive

```python
class OpenAIRunner(BaseRunner):
    SKIP_DIRS = {".git", "node_modules", "__pycache__"}
    CODE_EXTS = {".py", ".js", ".ts", ".java"}
    MAX_FILES = 50
    MAX_LINES = 200  # Per file
    
    def sample_files(self, repo_path: str) -> str:
        # Walk directory tree
        # Skip build/vendor directories
        # Take up to 50 files
        # Cap each file at 200 lines
        # Return as concatenated string
```

**Why sample instead of sending everything?**
- Token limits (OpenAI has max input size)
- Cost control (tokens = money)
- Speed (less to process)
- Focus on actual code, not dependencies

**What gets sent to OpenAI:**

```
You are a senior software engineer performing a code review.
Analyze the following codebase and return ONLY valid JSON:

{
  "solid": { "score": 0-5, "notes": "..." },
  "clean_code": { "score": 0-5, "notes": "..." },
  ...
}

Codebase:
### src/main.py
<200 lines of code>

### src/utils.py
<200 lines of code>
...
```

---

### 5. **Metrics Parser Normalizes** (`core/metrics_parser.py`)

AI output is unpredictable. The parser handles all edge cases:

```python
def parse(raw: dict) -> MetricsSchema:
    normalized = {}
    
    for key in ["solid", "clean_code", "oop", ...]:
        entry = raw.get(key)
        
        if entry is None:
            # Missing - set default
            normalized[key] = {"score": 0.0, "notes": "Could not evaluate."}
        
        elif isinstance(entry, (int, float)):
            # AI returned bare number - wrap it
            normalized[key] = {"score": float(entry), "notes": ""}
        
        elif isinstance(entry, dict):
            # Expected format - use it
            normalized[key] = {
                "score": float(entry.get("score", 0)),
                "notes": entry.get("notes", "")
            }
        
        else:
            # Unexpected type - default
            normalized[key] = {"score": 0.0, "notes": "Could not evaluate."}
    
    # Validate with Pydantic (raises if invalid)
    return MetricsSchema(**normalized)
```

**Why Pydantic?**
- Type validation (score must be 0-5)
- Data normalization
- Auto-generated docs
- Easy serialization to JSON

**Example edge cases this handles:**
```python
# AI returns bare numbers
{"solid": 4, "clean_code": 3}  ✅ Wrapped to dicts

# AI omits some metrics
{"solid": 4}  ✅ Others get defaults

# AI returns wrong type
{"solid": "pretty good"}  ✅ Defaults to 0

# AI returns out of range
{"solid": {"score": 10}}  ❌ Pydantic validation error
```

---

### 6. **Classifier Grades** (`core/classifier.py`)

This converts metrics into a letter grade. It's configurable!

```python
WEIGHTS = {
    "solid": 0.20,        # 20% of grade
    "clean_code": 0.20,   # 20% of grade
    "oop": 0.15,          # 15% of grade
    "error_handling": 0.15,
    "testing": 0.15,
    "documentation": 0.10,
    "complexity": 0.05
}

GRADE_THRESHOLDS = [
    (85, "A"),
    (70, "B"),
    (55, "C"),
    (40, "D"),
    (0, "F"),
]

FLOOR_RULES = [
    ("testing", 1.0, "D"),  # If testing < 1.0, cap at D
]
```

**How it works:**

1. Calculate weighted percentage:
```python
percentage = sum(
    (metric.score / metric.max) * weight
    for metric, weight in zip(metrics, WEIGHTS)
) / sum(WEIGHTS) * 100
```

2. Find grade from thresholds:
```python
# 73.4% → "B" (between 70-85)
```

3. Apply floor rules:
```python
# Even if percentage is 90%, if testing < 1.0, cap at "D"
# Philosophy: Can't get an A without tests!
```

**How to customize:**

Want to make testing more important? Edit `WEIGHTS`:
```python
WEIGHTS = {
    "testing": 0.30,  # Now 30% instead of 15%
    ...
}
```

Want stricter grading? Edit `GRADE_THRESHOLDS`:
```python
GRADE_THRESHOLDS = [
    (90, "A"),  # Was 85
    (75, "B"),  # Was 70
    ...
]
```

---

### 7. **Report Generator Creates PDF** (`core/report_generator.py`)

We use **Typst** (modern alternative to LaTeX):

```python
def generate(submission_id, repo_url, metrics, classification, analyzed_at):
    # 1. Escape special characters
    escaped_feedback = metrics.feedback.replace('"', r'\"')
    
    # 2. Build Typst data file
    typst_source = f"""
        #let repo_url = "{repo_url}"
        #let grade = "{classification['grade']}"
        #let percentage = "{classification['percentage']}"
        #let feedback = "{escaped_feedback}"
        #let metrics_rows = (...)
        #include "report.typ"
    """
    
    # 3. Write to temp file
    with open(f"/tmp/reports/{submission_id}_data.typ", "w") as f:
        f.write(typst_source)
    
    # 4. Compile to PDF
    subprocess.run([
        "typst", "compile",
        f"{submission_id}_data.typ",
        f"{submission_id}.pdf"
    ])
    
    # 5. Return PDF path
    return f"/tmp/reports/{submission_id}.pdf"
```

**Why Typst over LaTeX?**
- Single 20MB binary (vs 5GB TeX Live)
- Compiles in milliseconds (vs seconds)
- Simple syntax
- Easy to version control templates

**Template structure** (`templates/report.typ`):
```typst
= Code Analysis Report

#grid(
  [*Grade*], [*#grade*],
  [*Score*], [#percentage%]
)

== Metrics Breakdown
#table(
  ..metrics_rows
)

== Feedback
#feedback
```

Variables like `#grade`, `#percentage` are defined in the parent file.

---

## 🧪 Testing Strategy

We use **unit tests with mocking** - test logic without external dependencies.

### Example: Testing Git Handler

```python
@patch('core.git_handler.subprocess.run')
def test_successful_clone(mock_run):
    # Mock subprocess to avoid real git clone
    mock_run.return_value = MagicMock(returncode=0, stderr="")
    
    # Call function
    result = git_handler.clone("https://github.com/user/repo", 123)
    
    # Assert correct path returned
    assert "sub_123" in result
    
    # Assert git was called correctly
    mock_run.assert_called_once()
    args = mock_run.call_args[0][0]
    assert args == ["git", "clone", "--depth", "1", ...]
```

**Why mock?**
- Tests run in <1 second (no waiting for actual git clone)
- No internet required
- No file system pollution
- Test failure scenarios easily

### Running Tests

```bash
# All tests
pytest

# One file
pytest tests/test_classifier.py

# One test
pytest tests/test_classifier.py::TestClassify::test_a_grade -v

# With coverage
pytest --cov=core --cov=models
```

**Coverage goal**: 80%+ on core modules

---

## 🔧 How to Make Changes

### Adding a New Metric

Let's say you want to add a "security" metric. Here's the checklist:

1. **Update the schema** (`models/metrics_schema.py`):
```python
class MetricsSchema(BaseModel):
    # ... existing metrics
    security: MetricDetail  # ADD THIS
```

2. **Update the AI prompt** (`core/agent_runner.py`):
```python
prompt = """
{
  "solid": { "score": <float 0-5>, "notes": "..." },
  ...
  "security": { "score": <float 0-5>, "notes": "..." }  # ADD THIS
}
"""
```

3. **Update the parser** (`core/metrics_parser.py`):
```python
for key in ["solid", "clean_code", ..., "security"]:  # ADD HERE
```

4. **Update the classifier** (`core/classifier.py`):
```python
WEIGHTS = {
    # ... existing
    "security": 0.10,  # ADD THIS (adjust others to sum to 1.0)
}
```

5. **Write tests** (`tests/test_classifier.py`):
```python
def test_security_metric():
    metrics = MetricsSchema(
        # ... all required metrics including:
        security=MetricDetail(score=4.0, notes="Good practices")
    )
    result = classifier.classify(metrics)
    assert "security" in result["breakdown"]
```

6. **Run tests**: `pytest`

7. **Test end-to-end** with a real repo

---

### Changing the Grading Algorithm

Want to use median instead of weighted average?

Edit `core/classifier.py`:

```python
def classify(metrics: MetricsSchema) -> dict:
    # OLD: weighted average
    # weighted_sum = sum(...)
    
    # NEW: median
    scores = [m.score for m in [
        metrics.solid,
        metrics.clean_code,
        # ...
    ]]
    median_score = statistics.median(scores)
    percentage = (median_score / 5.0) * 100
    
    # Rest stays the same...
```

---

### Adding a New AI Backend (e.g., Claude)

1. **Create new runner** (`core/agent_runner.py`):
```python
class ClaudeRunner(BaseRunner):
    def __init__(self):
        self.client = Anthropic(api_key=Config.ANTHROPIC_API_KEY)
    
    def run(self, repo_path: str) -> dict:
        # Sample files
        code_sample = self.sample_files(repo_path)
        
        # Call Claude API
        response = self.client.messages.create(
            model="claude-3-opus",
            messages=[{"role": "user", "content": prompt + code_sample}]
        )
        
        # Parse response
        return json.loads(response.content)
```

2. **Update factory** (`core/agent_runner.py`):
```python
def get_runner() -> BaseRunner:
    if Config.AGENT_BACKEND == "openai":
        return OpenAIRunner()
    elif Config.AGENT_BACKEND == "claude":  # ADD THIS
        return ClaudeRunner()
    elif Config.AGENT_BACKEND == "kilocode":
        return KiloCodeRunner()
```

3. **Add config** (`config.py`):
```python
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")
```

4. **Update docs** (`README.md`)

---

## 🎨 Design Patterns Used

### 1. **Strategy Pattern** (Agent Runner)
- Interchangeable AI backends
- Common interface, different implementations

### 2. **Factory Pattern** (`get_runner()`)
- Centralized creation logic
- Easy to extend

### 3. **Pipeline Pattern** (`pipeline.py`)
- Linear sequence of transformations
- Easy to understand flow
- Easy to add/remove steps

### 4. **Repository Pattern** (Sort of)
- Filesystem is our "repository"
- git_handler abstracts storage details

### 5. **Data Transfer Object** (Pydantic models)
- Validated data shapes
- Type safety
- Serialization

---

## 🚨 Common Pitfalls & How to Avoid Them

### 1. **Not cleaning up cloned repos**

❌ **Wrong:**
```python
def run_analysis(submission_id, repo_url):
    repo_path = git_handler.clone(repo_url, submission_id)
    # ... do stuff
    return result
    # LEAK: repo never deleted!
```

✅ **Right:**
```python
def run_analysis(submission_id, repo_url):
    repo_path = None
    try:
        repo_path = git_handler.clone(repo_url, submission_id)
        # ... do stuff
        return result
    finally:
        if repo_path:
            git_handler.cleanup(repo_path)
```

### 2. **Forgetting to escape user input in Typst**

❌ **Wrong:**
```python
typst_source = f'#let feedback = "{metrics.feedback}"'
# If feedback contains ", Typst compilation breaks!
```

✅ **Right:**
```python
escaped_feedback = metrics.feedback.replace('"', r'\"')
typst_source = f'#let feedback = "{escaped_feedback}"'
```

### 3. **Hardcoding configuration**

❌ **Wrong:**
```python
timeout = 120  # Hardcoded
```

✅ **Right:**
```python
timeout = Config.CLONE_TIMEOUT  # From environment
```

### 4. **Not validating external input**

❌ **Wrong:**
```python
subprocess.run(["git", "clone", repo_url])  # Injection risk!
```

✅ **Right:**
```python
validate_url(repo_url)  # Check format, allowed hosts
subprocess.run(["git", "clone", repo_url], timeout=120)
```

---

## 🛠️ Development Workflow

### Day-to-Day Development

```bash
# 1. Activate virtual environment
source .venv/bin/activate

# 2. Make changes to code

# 3. Format code (auto-fix style issues)
black .

# 4. Lint code (catch bugs)
ruff check .

# 5. Run tests
pytest -v

# 6. Run specific test during debugging
pytest tests/test_classifier.py::TestClassify::test_floor_rule -v -s

# 7. Check coverage
pytest --cov=core --cov-report=html
# Open htmlcov/index.html in browser

# 8. Manual testing
python app.py
# In another terminal:
curl -X POST http://localhost:5000/analyze \
  -H "Content-Type: application/json" \
  -d '{"submissionId": 999, "repoUrl": "https://github.com/octocat/Hello-World"}'
```

### Debugging

Add breakpoints with `import pdb; pdb.set_trace()`:

```python
def classify(metrics: MetricsSchema) -> dict:
    percentage = calculate_percentage(metrics)
    
    import pdb; pdb.set_trace()  # Debugger stops here
    
    grade = determine_grade(percentage)
    return {"grade": grade, ...}
```

Run with:
```bash
pytest tests/test_classifier.py::test_a_grade -s
# -s shows stdout/stderr including debugger
```

Commands in debugger:
- `n` - next line
- `s` - step into function
- `c` - continue
- `p variable` - print variable
- `l` - list code around current line

---

## 📊 Monitoring & Observability

### Logs

Add logging:

```python
import logging

logger = logging.getLogger(__name__)

def run_analysis(submission_id, repo_url):
    logger.info(f"Starting analysis for submission {submission_id}")
    
    try:
        repo_path = git_handler.clone(repo_url, submission_id)
        logger.debug(f"Cloned to {repo_path}")
        
        # ...
        
    except Exception as e:
        logger.error(f"Analysis failed for {submission_id}: {e}", exc_info=True)
        raise
```

### Metrics to Track

- Analysis success rate
- Average analysis time
- Grade distribution
- Common failure reasons
- API token usage (for cost control)

---

## 🔐 Security Considerations

### Input Validation

```python
# NEVER trust user input
def validate_url(url: str) -> None:
    # Whitelist approach
    allowed_hosts = ("https://github.com/", "https://gitlab.com/")
    if not any(url.startswith(h) for h in allowed_hosts):
        raise ValueError("Invalid host")
    
    # Regex validation
    if not re.match(r"^https://(?:github|gitlab)\.com/[^/]+/[^/]+", url):
        raise ValueError("Invalid format")
```

### Resource Limits

```python
# Timeouts prevent hanging
subprocess.run(..., timeout=120)

# File size limits prevent DoS
if file_size > MAX_FILE_SIZE:
    skip_file()

# Disk space limits
if total_size > MAX_TOTAL_SIZE:
    raise Exception("Repo too large")
```

### Cleanup

```python
# ALWAYS cleanup sensitive data
finally:
    if repo_path and os.path.exists(repo_path):
        shutil.rmtree(repo_path, ignore_errors=True)
```

---

## 📈 Performance Optimization

### Current Bottlenecks

1. **Git clone** - Mitigated with `--depth 1`
2. **AI API calls** - Batching, caching possible
3. **PDF generation** - Fast (Typst is quick)

### Future Optimizations

1. **Caching**: Cache analysis results by repo commit hash
```python
cache_key = f"{repo_url}:{commit_hash}"
if cache.has(cache_key):
    return cache.get(cache_key)
```

2. **Async processing**: Return immediately, poll for results
```python
POST /analyze → 202 Accepted, {"statusUrl": "/status/123"}
GET /status/123 → {"status": "processing"} | {"status": "completed", ...}
```

3. **Parallel file sampling**: Process multiple files concurrently

---

## 🎓 Next Steps for You

### Week 1: Get Familiar
- [ ] Clone the repo
- [ ] Run all tests
- [ ] Start the dev server
- [ ] Make a small change (e.g., adjust a weight)
- [ ] Add a test

### Week 2: Add a Feature
- [ ] Pick from roadmap (Phases 2-8)
- [ ] Design the change
- [ ] Write tests first (TDD)
- [ ] Implement
- [ ] Get code review

### Week 3: Own a Module
- [ ] Become the expert on one module
- [ ] Review others' PRs for that module
- [ ] Identify improvements
- [ ] Mentor others

---

## 📚 Resources

- [Typst Docs](https://typst.app/docs) - PDF template syntax
- [Pydantic Docs](https://docs.pydantic.dev) - Data validation
- [Flask Docs](https://flask.palletsprojects.com) - Web framework
- [OpenAI API Docs](https://platform.openai.com/docs) - AI integration
- [pytest Docs](https://docs.pytest.org) - Testing

---

## 💬 Questions?

Common questions from new team members:

**Q: Why no database?**
A: Microservices principle - single responsibility. Gateway handles persistence, we handle analysis.

**Q: Why Typst instead of LaTeX?**
A: Smaller Docker image (20MB vs 5GB), faster compilation, simpler syntax.

**Q: Why both OpenAI and Kilo Code?**
A: Flexibility. OpenAI is reliable but costs money. Kilo Code might be free/local.

**Q: What if AI returns garbage?**
A: `metrics_parser.py` handles all edge cases. Worst case: defaults to 0 scores.

**Q: How do we prevent malicious repos?**
A: URL validation, shallow clone, timeouts, file size limits, cleanup.

---

That's the complete picture! You now understand:
- ✅ What the service does
- ✅ How data flows through the system
- ✅ Each module's responsibility
- ✅ Design patterns used
- ✅ How to make changes
- ✅ How to test
- ✅ How to debug
- ✅ Best practices

**Your homework**: Run the service, read through one module (`git_handler.py` is a good start), and make a small test pass. Welcome to the team! 🎉
