# Report Customization Guide

This document explains how AI-enhanced report personalization works and how to customize it safely.

## Overview

The report pipeline uses a hybrid strategy:

1. Static Typst template defines structure and consistent layout.
2. AI enhancement (optional) generates personalized feedback content.
3. Fallback logic keeps report generation reliable if AI fails.

Flow:

`analysis -> metrics -> classification (+ student_level) -> optional AI enhancement -> typst compile -> pdf`

## Student Level Inference

Location: `core/classifier.py`

Function: `infer_student_level(classification, metrics)`

Rules:
- `advanced`: grade in `A/B` and average metric score >= `3.5`
- `beginner`: grade in `D/F`, or average score < `2.0`, or testing score < `1.0`
- `intermediate`: all other cases

Tune these thresholds in `core/classifier.py` to match your rubric.

## AI Content Agent

Location: `.kilo/agent/report-content.md`

The agent receives structured JSON including:
- inferred `student_level`
- grade and percentage
- metric scores and notes
- original feedback and recommendations

It must return JSON only:

```json
{
  "feedback": "...",
  "recommendations": ["..."],
  "encouragement": "..."
}
```

If output is invalid, the system falls back to original analyzer feedback.

## Wrapper Script

Location: `scripts/kilo-report-content.py`

Responsibilities:
- invoke Kilo with the `report-content` agent
- pass input payload as prompt
- extract and print JSON result

You can adjust:
- timeout value (currently 30 seconds)
- prompt instructions for stricter output control
- extraction regex (if your CLI output format changes)

## Report Generator Integration

Location: `core/report_generator.py`

Key behavior:
- `enhance_content_with_ai()` is guarded by `ENABLE_AI_REPORTS`
- enhancement calls are cached with `lru_cache(maxsize=100)`
- schema validation is enforced with `EnhancedContent`
- any failure returns `None` and reuses original report content

## Template Customization

Location: `templates/report.typ`

The template now supports an optional encouragement section:

```typst
#if encouragement != "" [
  ---
  == Keep Going!
  #encouragement
]
```

You can add more optional sections (e.g., next steps) using the same conditional pattern.

## Configuration

Location: `config.py` and `.env`

Flag:

```bash
ENABLE_AI_REPORTS=true
```

Set to `false` to disable AI enhancement and use static feedback only.

## Testing

Relevant tests:
- `tests/test_student_level_inference.py`
- `tests/test_report_content.py`
- `tests/test_report_generator.py`
- `tests/test_enhanced_pipeline.py`

Recommended command:

```bash
cd services/code-analyzer
source .venv/bin/activate
.venv/bin/pytest tests/ -v
```

## Troubleshooting

- AI enhancement always missing:
  - verify `ENABLE_AI_REPORTS=true`
  - verify Kilo CLI is installed and configured
  - run wrapper manually with sample payload
- Typst compile fails:
  - verify `TYPST_BIN` path
  - inspect generated Typst data for unescaped quotes
- Slow reports:
  - keep enhancement enabled only when needed
  - increase cache size if workloads repeat similar patterns
