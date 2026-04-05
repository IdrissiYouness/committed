# Kilo Analyzer Integration

This document explains how the kilo CLI is integrated with the code-analyzer service to perform automated code quality analysis.

## Overview

The code analyzer service can now use the **kilo CLI** with a custom **analyzer agent** to evaluate code quality. This provides an alternative to using OpenAI's API directly.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                Code Analyzer Service                     │
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │          core/pipeline.py                          │ │
│  │          (orchestrates analysis)                   │ │
│  └─────────────────┬──────────────────────────────────┘ │
│                    │                                     │
│                    ▼                                     │
│  ┌────────────────────────────────────────────────────┐ │
│  │      core/agent_runner.py                          │ │
│  │      get_runner() → KiloCodeRunner                 │ │
│  └─────────────────┬──────────────────────────────────┘ │
│                    │                                     │
│                    ▼                                     │
│  ┌────────────────────────────────────────────────────┐ │
│  │   kilo-analyze-wrapper.py                          │ │
│  │   (Python script)                                  │ │
│  └─────────────────┬──────────────────────────────────┘ │
└────────────────────┼──────────────────────────────────────┘
                     │
                     ▼
           ┌─────────────────┐
           │   kilo run      │
           │   --agent       │
           │   analyzer      │
           └────────┬────────┘
                    │
                    ▼
      ┌──────────────────────────────┐
      │ .kilo/agent/analyzer.md      │
      │ (Custom agent definition)    │
      │                              │
      │ - Reads codebase             │
      │ - Evaluates 7 metrics        │
      │ - Outputs JSON               │
      └──────────────────────────────┘
```

## Components

### 1. Custom Analyzer Agent (`.kilo/agent/analyzer.md`)

A custom kilo agent specifically designed for code quality analysis:

- **Purpose**: Analyzes code and outputs structured JSON metrics
- **Permissions**: Read-only (can read, glob, grep but cannot edit or execute bash)
- **Output**: JSON with 7 quality metrics (SOLID, clean code, OOP, error handling, testing, documentation, complexity)

**Key Features**:
- Scores each metric from 0.0 to 5.0
- Provides detailed notes for each metric
- Includes overall feedback (3-5 sentences)
- Lists 3-5 actionable recommendations

### 2. Wrapper Script (`scripts/kilo-analyze-wrapper.py`)

Python wrapper that:
- Invokes `${AGENT_CLI} run --agent analyzer` on the target repository
- Extracts JSON from kilo's output (handles various output formats)
- Returns clean JSON to the KiloCodeRunner

### 3. KiloCodeRunner (`core/agent_runner.py`)

The runner implementation that:
- Calls the wrapper script
- Parses JSON response
- Integrates with the analysis pipeline

## Configuration

### Environment Variables

Set these in `.env`:

```bash
# Use kilo instead of OpenAI
AGENT_BACKEND=kilocode

# CLI command (single source of truth used by wrappers)
AGENT_CLI=kilo

# Timeout for analysis (seconds)
AGENT_TIMEOUT=300
```

### Kilo Configuration

The analyzer agent is defined in `.kilo/agent/analyzer.md` with:

```yaml
---
description: Analyzes code quality and outputs structured JSON metrics
mode: primary
temperature: 0.3
permission:
  read: allow
  glob: allow
  grep: allow
  bash: deny
  edit: deny
  write: deny
---
```

## JSON Output Format

The analyzer outputs JSON in this exact format:

```json
{
  "solid": {
    "score": 3.5,
    "notes": "Good separation of concerns but some classes have multiple responsibilities."
  },
  "clean_code": {
    "score": 3.0,
    "notes": "Some magic numbers, variable names could be more descriptive."
  },
  "oop": {
    "score": 4.0,
    "notes": "Well-structured classes with proper encapsulation."
  },
  "error_handling": {
    "score": 2.5,
    "notes": "Basic try-catch blocks, missing edge case handling."
  },
  "testing": {
    "score": 1.5,
    "notes": "Minimal unit tests, low coverage."
  },
  "documentation": {
    "score": 2.0,
    "notes": "README exists but code comments are sparse."
  },
  "complexity": {
    "score": 3.5,
    "notes": "Moderate complexity, some functions could be broken down."
  },
  "feedback": "Overall assessment summarizing strengths and improvement areas.",
  "recommendations": [
    "Add comprehensive unit tests",
    "Implement proper error handling for network failures",
    "Add JSDoc comments to public methods"
  ]
}
```

## Usage

### Command Line Testing

Test the kilo analyzer directly:

```bash
# Create a test repository
mkdir /tmp/test-repo
cd /tmp/test-repo
echo 'def add(a, b): return a + b' > test.py

# Run the wrapper
cd services/code-analyzer
.venv/bin/python scripts/kilo-analyze-wrapper.py /tmp/test-repo
```

### Python Integration

```python
from core.agent_runner import KiloCodeRunner

runner = KiloCodeRunner()
result = runner.run("/path/to/repository")

print(f"SOLID score: {result['solid']['score']}")
print(f"Testing score: {result['testing']['score']}")
```

### Full Pipeline Test

```bash
cd services/code-analyzer
.venv/bin/python tests/test_kilo_analyzer.py
```

## Comparison: Kilo vs OpenAI

| Feature | Kilo Analyzer | OpenAI |
|---------|--------------|--------|
| **Cost** | Free (uses local kilo) | Paid (GPT-4 API calls) |
| **Speed** | Depends on model | Fast with GPT-4 |
| **Customization** | Fully customizable agent | Limited to prompt |
| **Privacy** | Can use local models | Data sent to OpenAI |
| **Setup** | Requires kilo CLI installed | Requires API key |

## Advantages of Kilo Integration

1. **Cost-effective**: No API charges when using local or free models
2. **Flexible**: Can use any model via kilo Gateway (500+ models)
3. **Customizable**: Agent behavior defined in version-controlled `.md` files
4. **Privacy**: Can use local models that don't send data externally
5. **Team collaboration**: Share analyzer agent config across team

## Troubleshooting

### Issue: "kilo: command not found"

Solution: Install kilo CLI:
```bash
npm install -g @kilocode/cli
```

### Issue: "analyzer agent not found"

Solution: Ensure `.kilo/agent/analyzer.md` exists in the service directory.

### Issue: "JSON parsing error"

Solution: The wrapper tries multiple strategies to extract JSON. Check that:
1. The analyzer agent is outputting valid JSON
2. No extra text is being added to the output
3. The JSON structure matches the expected format

### Issue: "Timeout"

Solution: Increase `AGENT_TIMEOUT` in `.env`:
```bash
AGENT_TIMEOUT=600  # 10 minutes
```

## Future Improvements

1. **Caching**: Cache analysis results by repository commit hash
2. **Streaming**: Stream analysis progress to user
3. **Multi-model**: Compare results from multiple models
4. **Fine-tuning**: Create fine-tuned models for code analysis
5. **Custom metrics**: Allow users to define custom quality metrics

## Files Created

- `.kilo/agent/analyzer.md` - Custom analyzer agent definition
- `scripts/kilo-analyze-wrapper.py` - Python wrapper for kilo CLI
- `scripts/kilo-analyze.sh` - Bash wrapper (alternative, simpler version)
- `tests/test_kilo_analyzer.py` - Integration test for kilo analyzer
- `scripts/manual_test_kilo.sh` - Quick manual test script

## Related Documentation

- [Kilo Custom Modes](https://kilo.ai/docs/customize/custom-modes)
- [Kilo CLI Documentation](https://kilo.ai/docs/code-with-ai/platforms/cli)
- [Code Analyzer ONBOARDING.md](./docs/ONBOARDING.md)
