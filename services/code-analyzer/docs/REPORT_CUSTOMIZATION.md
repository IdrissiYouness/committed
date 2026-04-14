# Report Customization Guide

How to modify the generated PDF reports: template layout, data payload, and per-section behavior.

---

## Overview

The report pipeline is:

```
MetricsSchema  →  report_generator.py  →  data.json + SVGs  →  Typst compile  →  PDF
```

There is no secondary AI pass — the Kilo agent produces everything in a single run.
The Typst template consumes the JSON data blob directly.

---

## Template File

**Location**: `templates/report.typ`

The template is a Typst source file that reads two bindings prepended by `report_generator.py`:

```typst
#let data = json("{id}_data.json")   // all metrics + narrative + diagrams
#let radar_path = "{id}_radar.svg"   // spider chart (always present)
```

SVG filenames for the architecture/class diagrams are embedded inside `data` itself
(`data.arch_svg`, `data.class_svg`), and sections that use them are skipped when the
string is empty.

---

## Data Payload

`report_generator.generate()` writes a JSON file containing:

| Key | Type | Description |
|---|---|---|
| `repo_url` | string | Original repository URL |
| `repo_username` | string | GitHub/GitLab username extracted from URL |
| `project_name` | string | Repository name extracted from URL |
| `submission_id` | string | Submission identifier |
| `analyzed_at` | string | Formatted date (e.g. `"13 Apr 2026"`) |
| `analyzed_in` | string | Human-readable duration (e.g. `"2m 52s"`) |
| `grade` | string | Letter grade `A`–`F` |
| `percentage` | float | Weighted score `0–100` |
| `student_level` | string | `"beginner"` / `"intermediate"` / `"advanced"` |
| `feedback` | string | AI narrative (3-5 sentences) |
| `encouragement` | string | Motivating closing sentence |
| `floor_rules` | list[string] | Human-readable floor rule violation messages |
| `metrics` | dict | Per-metric `{score, max, notes, confidence}` for all 7 metrics |
| `project_overview` | dict | Structured formal project report (see below) |
| `file_tree` | string | ASCII directory tree |
| `per_file` | list | Per-file analysis `{filename, lines, cyclomatic_complexity, duplication_pct, issues}` |
| `dependencies` | dict | `{total, outdated, vulnerable, unused, details[]}` |
| `commit_hygiene` | dict | `{score, total_commits, single_purpose_pct, message_quality_score, notes}` |
| `duplication_score` | float | Overall duplication % |
| `accessibility_score` | float | 0–5 ARIA/semantic HTML score |
| `performance_hints` | list[string] | Performance improvement hints |
| `quick_wins` | list | `{title, description, effort}` |
| `positives` | list[string] | Genuine code strengths |
| `recommendations` | list | `{title, description, priority, effort, evidence[]}` |
| `arch_svg` | string | Filename of architecture SVG, or `""` |
| `class_svg` | string | Filename of class diagram SVG, or `""` |

### `project_overview` fields

| Sub-key | Type | Description |
|---|---|---|
| `summary` | string | One-paragraph formal summary (who, what, using what, purpose) |
| `contributors` | list[string] | Identified author/contributor names |
| `technologies` | list[string] | Languages, frameworks, libraries, tools |
| `implementation` | string | How the project was built |
| `design_decisions` | string | Key architectural choices |
| `key_features` | list[string] | Main application capabilities |
| `setup_instructions` | string | Plain-text compile and run instructions |
| `limitations` | string | Known limitations and future work |

---

## Report Sections

| Section | Condition | Source |
|---|---|---|
| Header (project name, grade, bar) | Always | `data.project_name`, `data.grade`, `data.percentage` |
| Metadata box | Always | `data.repo_url`, `data.submission_id`, `data.analyzed_in`, … |
| Floor rule warnings | `floor_rules.len() > 0` | `data.floor_rules` |
| Radar chart + metrics table | Always | `radar_path`, `data.metrics` |
| Metric notes | Notes exist for ≥1 metric | `data.metrics[key].notes` |
| Project Overview | `project_overview.summary != ""` | `data.project_overview` |
| What Went Well | `positives.len() > 0` | `data.positives` |
| Quick Wins | `quick_wins.len() > 0` | `data.quick_wins` |
| Project Structure | `file_tree != ""` | `data.file_tree` |
| Per-File Analysis | `per_file.len() > 0` | `data.per_file` |
| Dependency Health | `dependencies.details.len() > 0` | `data.dependencies` |
| Architecture Overview | `arch_svg != ""` | SVG file |
| Class Diagram | `class_svg != ""` | SVG file |
| Recommendations | `recommendations.len() > 0` | `data.recommendations` |
| Commit Hygiene | `commit_hygiene.total_commits > 0` | `data.commit_hygiene` |
| Performance Hints | `performance_hints.len() > 0` | `data.performance_hints` |

---

## Student Level Inference

**Location**: `core/classifier.py` → `infer_student_level()`

| Level | Condition |
|---|---|
| `advanced` | Grade A or B **and** avg score ≥ 3.5 **and** percentage ≥ 72 |
| `beginner` | Grade D/F **or** avg score < 2.0 **or** testing score < 1.0 |
| `intermediate` | Everything else |

The level drives the encouragement label in the header callout:

```typst
#let encouragement_label(lvl) = {
  if lvl == "advanced"     { "Keep Pushing!" }
  else if lvl == "beginner" { "You're Getting There!" }
  else                      { "Good Progress!" }
}
```

---

## Adding a New Template Section

1. Add the data to the JSON payload in `report_generator.generate()`.
2. Add the field to `MetricsSchema` in `models/metrics_schema.py` (if it comes from the agent).
3. Add parsing in `core/metrics_parser.py`.
4. Add the section to `templates/report.typ` with a guard:

```typst
#let my_field = data.at("my_field", default: "")
#if my_field != "" [
  #section_header("My Section")
  #text(size: 9pt)[#my_field]
]
```

---

## Customising Colors and Typography

All colors are defined as `#let` bindings at the top of `report.typ`:

```typst
#let accent    = rgb("#1e3a5f")   // primary blue — used for headings, borders, tags
#let muted     = rgb("#64748b")   // grey — used for labels
#let border_cl = rgb("#e2e8f0")   // light border
#let bg_alt    = rgb("#f8fafc")   // subtle background fill
```

Change any of these to restyle the entire document consistently.

---

## Troubleshooting

**Typst compilation fails**

Inspect the generated `.typ` source file in `REPORTS_DIR` before it is deleted.
Temporarily comment out the cleanup block in `report_generator.py`:

```python
# for tmp in tmp_files:
#     os.remove(tmp)
```

Then re-run and open `{id}_data.typ` to see what Typst received.

**Section missing from PDF**

Check that the corresponding field is non-empty in `{id}_data.json`.
The guard condition in the template (e.g. `data.at("file_tree", default: "") != ""`) will suppress any section whose data is absent or empty.

**Wrong font**

The template uses `"Linux Libertine"` for body text and `"DejaVu Sans Mono"` for code.
Install both on the host running Typst, or change the `#set text(font: ...)` directive.
