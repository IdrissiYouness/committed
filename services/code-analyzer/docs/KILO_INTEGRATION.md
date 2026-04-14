# Kilo Code Integration

How the Kilo Code CLI is used as the AI analysis backend for the code-analyzer service.

---

## Architecture

```
┌──────────────────────────────────────────────────┐
│                Code Analyzer Service             │
│                                                  │
│  core/pipeline.py                                │
│    │                                             │
│    ▼                                             │
│  core/agent_runner.py  →  get_runner()           │
│    │                       ├── KiloCodeRunner    │
│    │                       └── MockRunner        │
│    ▼ (KiloCodeRunner)                            │
│  scripts/kilo-analyze-wrapper.py                 │
└──────────────────────────────────────────────────┘
         │
         ▼
   kilo run --agent analyzer   (Kilo CLI)
         │
         ▼
  .kilo/agent/analyzer.md      (Custom agent prompt)
         │  reads repo, outputs JSON
         ▼
   scripts/kilo_utils.py       (extract_json + fence stripping)
```

---

## Components

### Custom Analyzer Agent — `.kilo/agent/analyzer.md`

A version-controlled Kilo agent prompt that instructs the AI to:

- Explore the repository structure (glob, grep, read)
- Score 7 code quality metrics (0.0–5.0 each) with confidence values
- Generate per-file analysis with issues, cyclomatic complexity, and duplication estimates
- Map architectural components and class relationships
- Produce a structured `project_overview` for academic/professor review
- Output **only** a single JSON object — no markdown, no commentary

Permissions set in the frontmatter:

```yaml
permission:
  read: allow
  glob: allow
  grep: allow
  bash: deny
  edit: deny
  write: deny
```

The agent is entirely read-only and cannot modify the repository.

### Wrapper Script — `scripts/kilo-analyze-wrapper.py`

Invokes `${AGENT_CLI} run --agent analyzer --path <repo_path>` and captures stdout.
Uses `kilo_utils.extract_json()` to locate and parse the JSON block inside the CLI output,
handling markdown code fences and any leading prose the model may emit.

### JSON Utilities — `scripts/kilo_utils.py`

- `_strip_markdown_fences(text)` — removes ` ```json ` / ` ``` ` wrappers
- `extract_json(text, anchor_key)` — scans for the outermost `{...}` that contains `anchor_key`, raises `ValueError` if not found or invalid JSON

### Runner Selection — `core/agent_runner.py`

```python
def get_runner() -> BaseRunner:
    return MockRunner() if Config.AGENT_RUNNER == "mock" else KiloCodeRunner()
```

`MockRunner` returns deterministic stub data so the full pipeline (parsing, grading, PDF) can
run in CI without a live Kilo installation. Activate it with `AGENT_RUNNER=mock`.

---

## Configuration

Set in `.env` (or injected by Docker/K8s):

```bash
AGENT_RUNNER=kilo          # "kilo" for real analysis, "mock" for CI/tests
AGENT_CLI=kilo             # CLI command name (must be on PATH)
AGENT_TIMEOUT=300          # Seconds before the Kilo subprocess is killed
```

### Installing the Kilo CLI

```bash
npm install -g kilocode
kilo --version
```

### Verifying the Agent

```bash
cd services/code-analyzer
kilo run --agent analyzer --path /tmp/some-repo
```

The output should be a single JSON object beginning with `{` and containing the `solid` key.

---

## JSON Output Format

The agent is expected to return a JSON object with these top-level keys
(see `.kilo/agent/analyzer.md` for the full example with all sub-fields):

| Key | Type | Description |
|---|---|---|
| `solid` … `complexity` | `{score, notes, confidence}` | 7 core metric objects |
| `feedback` | string | 3-5 sentence narrative |
| `encouragement` | string | 1-2 sentence motivational close |
| `project_overview` | dict | Formal structured project report |
| `per_file` | list | Per-file metrics and issues |
| `dependencies` | dict | Dependency health summary |
| `duplication_score` | float | Overall duplication % |
| `accessibility_score` | float | 0-5 ARIA / semantic HTML score |
| `performance_hints` | list[string] | Concrete performance suggestions |
| `quick_wins` | list | Small improvements with effort estimates |
| `positives` | list[string] | Genuine code strengths |
| `recommendations` | list | Structured actionable items |
| `architecture_components` | list | Nodes for the architecture diagram |
| `architecture_connections` | list | Edges for the architecture diagram |
| `class_diagram` | list | UML class boxes |

`commit_hygiene` and `file_tree` are **not** produced by the agent — they are
injected by `pipeline.py` after the agent finishes (from `git log` and filesystem walk).

---

## Testing Without Kilo

```bash
# Activate mock runner — no Kilo CLI required
AGENT_RUNNER=mock python scripts/run_analysis.py

# Run full test suite (all tests mock the Kilo subprocess)
pytest tests/ -v

# Live integration test (skipped unless Kilo is installed)
pytest tests/test_kilo_analyzer.py -v -s
```

---

## Troubleshooting

**`kilo: command not found`**

```bash
npm install -g kilocode
# or check the path:
which kilo
# then set AGENT_CLI=/full/path/to/kilo in .env
```

**`analyzer agent not found`**

Ensure `.kilo/agent/analyzer.md` exists in the `services/code-analyzer/` directory and
the current working directory when invoking `kilo` is set to the service root.

**`ValueError: no JSON object found`**

The model produced output that `extract_json` could not parse.
Run the wrapper directly to inspect the raw output:

```bash
.venv/bin/python scripts/kilo-analyze-wrapper.py /path/to/repo 2>&1 | head -100
```

Increase `AGENT_TIMEOUT` if the model is being cut off mid-response.

**Analysis takes too long**

`AGENT_TIMEOUT` defaults to 300 s (5 minutes).
For very large repositories, increase it:

```bash
AGENT_TIMEOUT=600
```

---

## Performance Characteristics

| Step | Typical duration |
|---|---|
| Git shallow clone (`depth=50`) | 5 – 30 s |
| Kilo AI analysis | 1.5 – 4 min |
| Commit hygiene + file tree | < 1 s |
| Typst PDF compilation | 2 – 5 s |
| **Total per request** | **2 – 5 min** |

The AI analysis is the dominant cost.
Response time scales with repository size and model load.

---

## Related

- [ONBOARDING.md](ONBOARDING.md) — full developer guide
- [REPORT_CUSTOMIZATION.md](REPORT_CUSTOMIZATION.md) — template and data payload reference
- `.kilo/agent/analyzer.md` — agent prompt (the single source of truth for AI behavior)
