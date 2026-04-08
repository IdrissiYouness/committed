// ============================================================
// Code Analysis Report — Typst template
// Data bindings prepended by report_generator.py:
//   #let data = json("{id}_data.json")
//   #let radar_path = "{id}_radar.svg"
// ============================================================

// ── Page & text defaults ─────────────────────────────────────
#set document(title: "Code Analysis Report")
#set page(margin: (top: 1.6cm, bottom: 1.8cm, left: 2cm, right: 2cm), numbering: "1")
#set text(size: 10pt)
#set heading(numbering: none)
#show heading.where(level: 2): it => block(below: 5pt, above: 11pt)[
  #text(weight: "bold", size: 10.5pt)[#it.body]
]

// ── Colour helpers (all defined at top level, safe to call anywhere) ─────────
#let grade_color(g) = {
  if g == "A" { rgb("#15803d") } else if g == "B" { rgb("#2563eb") } else if g == "C" { rgb("#d97706") } else if g == "D" { rgb("#ea580c") } else { rgb("#dc2626") }
}

#let score_color(s, mx) = {
  let p = s / mx
  if p >= 0.7 { rgb("#15803d") } else if p >= 0.4 { rgb("#b45309") } else { rgb("#b91c1c") }
}

// Used inside content blocks — MUST be a single-line call, not an inline if-chain
#let severity_color(s) = {
  if s == "high" { rgb("#dc2626") } else if s == "medium" { rgb("#d97706") } else { rgb("#15803d") }
}

#let priority_color(p) = {
  if p == "high" { rgb("#ef4444") } else if p == "medium" { rgb("#f59e0b") } else { rgb("#22c55e") }
}

#let dep_status_color(st) = {
  if st == "vulnerable" { rgb("#dc2626") } else if st == "outdated" { rgb("#d97706") } else if st == "unused" { rgb("#6b7280") } else { rgb("#15803d") }
}

// ── Badge helpers ─────────────────────────────────────────────────────────────
#let conf_badge(c) = {
  let bg  = if c >= 0.8 { rgb("#dcfce7") } else if c >= 0.5 { rgb("#fef9c3") } else { rgb("#fee2e2") }
  let fg  = if c >= 0.8 { rgb("#15803d") } else if c >= 0.5 { rgb("#854d0e") } else { rgb("#991b1b") }
  let lbl = if c >= 0.8 { "HIGH" }         else if c >= 0.5 { "MED" }          else { "LOW" }
  box(fill: bg, inset: (x: 4pt, y: 2pt), radius: 3pt)[
    #text(size: 7pt, fill: fg, weight: "bold")[#lbl]
  ]
}

#let priority_badge(p) = {
  let bg  = if p == "high" { rgb("#ef4444") } else if p == "medium" { rgb("#f59e0b") } else { rgb("#22c55e") }
  let lbl = if p == "high" { "HIGH" }         else if p == "medium" { "MED" }          else { "LOW" }
  box(fill: bg, inset: (x: 4pt, y: 2pt), radius: 3pt)[
    #text(size: 7pt, fill: white, weight: "bold")[#lbl]
  ]
}

// ── Score bar (Unicode block progress) ────────────────────────────────────────
#let score_bar(s, mx) = {
  let filled = int(calc.round(s / mx * 8))
  let clr = score_color(s, mx)
  let bars = ()
  for i in range(8) {
    if i < filled { bars += (text(fill: clr, size: 8pt)[█],) }
    else          { bars += (text(fill: rgb("#e2e8f0"), size: 8pt)[█],) }
  }
  bars.join()
}

// ── Divider ───────────────────────────────────────────────────────────────────
#let divider = {
  v(6pt)
  line(length: 100%, stroke: 0.5pt + rgb("#e2e8f0"))
  v(6pt)
}

// ── Stat card (used in Commit Hygiene) ───────────────────────────────────────
#let stat_card(label, value_content) = block(
  fill: rgb("#f8fafc"),
  stroke: 0.5pt + rgb("#e2e8f0"),
  inset: (x: 10pt, y: 8pt),
  radius: 4pt,
  width: 100%,
)[
  #text(size: 8pt, fill: rgb("#64748b"))[#label] \
  #text(weight: "bold", size: 11pt)[#value_content]
]

// ============================================================
// HEADER
// ============================================================
#block(
  fill: rgb("#1e3a5f"),
  inset: (x: 16pt, y: 13pt),
  radius: 6pt,
  width: 100%,
)[
  #grid(
    columns: (1fr, auto),
    align(horizon)[
      #text(size: 15pt, weight: "bold", fill: white)[Code Analysis Report]
    ],
    align(horizon + right)[
      #text(size: 9pt, fill: rgb("#93c5fd"))[#data.analyzed_at]
    ],
  )
]

#v(8pt)

// ============================================================
// METADATA BOX
// ============================================================
#block(
  fill: rgb("#f8fafc"),
  stroke: 0.5pt + rgb("#e2e8f0"),
  inset: 12pt,
  radius: 6pt,
  width: 100%,
)[
  #grid(
    columns: (auto, 1fr, auto, 1fr),
    column-gutter: 14pt,
    row-gutter: 6pt,
    align: horizon,
    [#text(weight: "bold", size: 8.5pt, fill: rgb("#64748b"))[REPOSITORY]],
    [#text(size: 8.5pt)[#data.repo_url]],
    [#text(weight: "bold", size: 8.5pt, fill: rgb("#64748b"))[SUBMISSION]],
    [#text[#data.submission_id]],

    [#text(weight: "bold", size: 8.5pt, fill: rgb("#64748b"))[GRADE]],
    [
      #grid(
        columns: (auto, auto),
        column-gutter: 6pt,
        align: horizon,
        box(fill: grade_color(data.grade), inset: (x: 9pt, y: 4pt), radius: 4pt)[
          #text(weight: "bold", fill: white, size: 13pt)[#data.grade]
        ],
        text(size: 11pt, weight: "bold")[#data.percentage%],
      )
    ],
    [#text(weight: "bold", size: 8.5pt, fill: rgb("#64748b"))[LEVEL]],
    [#text[#data.student_level]],
  )
]

#v(6pt)

// ============================================================
// FLOOR RULE WARNINGS
// ============================================================
#if data.floor_rules.len() > 0 [
  #for rule in data.floor_rules [
    #block(
      fill: rgb("#fffbeb"),
      stroke: (left: 3pt + rgb("#f59e0b"), rest: 0.5pt + rgb("#fde68a")),
      inset: 10pt,
      radius: 4pt,
      width: 100%,
      below: 5pt,
    )[
      #text(weight: "bold", fill: rgb("#92400e"), size: 9pt)[⚠ Grade Floor Rule Applied]
      #h(4pt)
      #text(size: 8.5pt, fill: rgb("#78350f"))[#rule]
    ]
  ]
  #v(4pt)
]

// ============================================================
// RADAR CHART + METRICS TABLE
// ============================================================
#let metric_keys   = ("solid", "clean_code", "oop", "error_handling", "testing", "documentation", "complexity")
#let metric_labels = ("SOLID", "Clean Code", "OOP", "Error Handling", "Testing", "Documentation", "Complexity")

#grid(
  columns: (0.42fr, 0.58fr),
  column-gutter: 14pt,
  align(center + horizon)[
    #image(radar_path, width: 100%)
  ],
  [
    #text(weight: "bold", size: 10pt)[Metrics Breakdown]
    #v(5pt)
    #{
      let cells = (
        [#text(weight: "bold", size: 8pt)[Metric]],
        [#text(weight: "bold", size: 8pt)[Score]],
        [#text(weight: "bold", size: 8pt)[Visual]],
        [#text(weight: "bold", size: 8pt)[Conf.]],
      )
      for i in range(metric_keys.len()) {
        let key   = metric_keys.at(i)
        let label = metric_labels.at(i)
        let m     = data.metrics.at(key)
        let s     = m.score
        let mx    = m.max
        let conf  = m.at("confidence", default: 0.8)
        cells = cells + (
          [#text(size: 8.5pt)[#label]],
          [#text(weight: "bold", size: 8.5pt, fill: score_color(s, mx))[#s / #int(mx)]],
          [#score_bar(s, mx)],
          [#conf_badge(conf)],
        )
      }
      table(
        columns: (2.2fr, 0.85fr, 1.2fr, 0.65fr),
        stroke: none,
        fill: (_, row) => if row == 0 { rgb("#f1f5f9") } else if calc.odd(row) { white } else { rgb("#f8fafc") },
        inset: (x: 6pt, y: 5pt),
        ..cells
      )
    }
  ],
)

// ── Metric notes table ─────────────────────────────────────────────────────────
#v(8pt)
#text(weight: "bold", size: 9pt, fill: rgb("#475569"))[Metric Notes]
#v(3pt)
#{
  let cells = (
    [#text(weight: "bold", size: 8pt)[Metric]],
    [#text(weight: "bold", size: 8pt)[Notes]],
  )
  for i in range(metric_keys.len()) {
    let key   = metric_keys.at(i)
    let label = metric_labels.at(i)
    let m     = data.metrics.at(key)
    cells = cells + (
      [#text(size: 8.5pt, weight: "bold")[#label]],
      [#text(size: 8.5pt, fill: rgb("#374151"))[#m.notes]],
    )
  }
  table(
    columns: (1.5fr, 5fr),
    stroke: none,
    fill: (_, row) => if row == 0 { rgb("#f1f5f9") } else if calc.odd(row) { white } else { rgb("#f8fafc") },
    inset: (x: 6pt, y: 5pt),
    ..cells
  )
}

// ============================================================
// PER-FILE ANALYSIS
// ============================================================
#if data.per_file.len() > 0 [
  #divider
  == Per-File Analysis

  #{
    let cells = (
      [#text(weight: "bold", size: 8pt)[File]],
      [#text(weight: "bold", size: 8pt)[Lines]],
      [#text(weight: "bold", size: 8pt)[Complexity (avg/fn)],],
      [#text(weight: "bold", size: 8pt)[Duplication %]],
      [#text(weight: "bold", size: 8pt)[Issues]],
    )
    for f in data.per_file {
      let ic  = f.issues.len()
      let cc  = f.cyclomatic_complexity
      // Cyclomatic complexity colour: ≤3 green, ≤6 amber, >6 red
      let cc_color = if cc <= 3 { rgb("#15803d") } else if cc <= 6 { rgb("#b45309") } else { rgb("#b91c1c") }
      let cc_label = if cc <= 3 { "Low" } else if cc <= 6 { "Med" } else { "High" }
      let ic_color = if ic == 0 { rgb("#15803d") } else if ic <= 3 { rgb("#d97706") } else { rgb("#dc2626") }
      cells = cells + (
        [#text(size: 8pt, font: "DejaVu Sans Mono")[#f.filename]],
        [#text(size: 8.5pt)[#f.lines]],
        [
          #text(size: 8.5pt, fill: cc_color, weight: "bold")[#str(calc.round(cc, digits: 1))]
          #h(3pt)
          #box(fill: cc_color.lighten(80%), inset: (x: 3pt, y: 1pt), radius: 2pt)[
            #text(size: 7pt, fill: cc_color)[#cc_label]
          ]
        ],
        [#text(size: 8.5pt)[#str(calc.round(f.duplication_pct, digits: 1))%]],
        [#text(size: 8.5pt, fill: ic_color, weight: "bold")[#str(ic)]],
      )
    }
    table(
      columns: (3fr, 1fr, 1.3fr, 1.4fr, 0.8fr),
      stroke: none,
      fill: (_, row) => if row == 0 { rgb("#f1f5f9") } else if calc.odd(row) { white } else { rgb("#f8fafc") },
      inset: (x: 6pt, y: 5pt),
      ..cells
    )
  }

  // Per-file issue detail lines
  // Uses severity_color() helper — single-line call, safe inside content block
  #for f in data.per_file [
    #if f.issues.len() > 0 [
      #v(5pt)
      #text(size: 8.5pt, weight: "bold", fill: rgb("#475569"))[#f.filename]
      #set text(size: 8.5pt)
      #for issue in f.issues [
        #let sc = severity_color(issue.severity)
        - #text(fill: sc, weight: "bold")[L#str(issue.line)] #h(2pt) #text(fill: rgb("#374151"))[#issue.message]
      ]
    ]
  ]
]

// ============================================================
// DEPENDENCY HEALTH
// ============================================================
#if data.dependencies.details.len() > 0 [
  #divider
  == Dependency Health
  #h(6pt)
  #text(size: 9pt, fill: rgb("#64748b"))[
    Total: #data.dependencies.total ·
    #text(fill: rgb("#d97706"))[Outdated: #data.dependencies.outdated] ·
    #text(fill: rgb("#dc2626"))[Vulnerable: #data.dependencies.vulnerable] ·
    #text(fill: rgb("#6b7280"))[Unused: #data.dependencies.unused]
  ]
  #v(5pt)

  #{
    let cells = (
      [#text(weight: "bold", size: 8pt)[Package]],
      [#text(weight: "bold", size: 8pt)[Version]],
      [#text(weight: "bold", size: 8pt)[Status]],
      [#text(weight: "bold", size: 8pt)[Note]],
    )
    for dep in data.dependencies.details {
      let sc = dep_status_color(dep.status)
      cells = cells + (
        [#text(size: 8pt, font: "DejaVu Sans Mono")[#dep.name]],
        [#text(size: 8.5pt)[#dep.current]],
        [#box(fill: sc.lighten(80%), inset: (x: 4pt, y: 2pt), radius: 3pt)[
          #text(size: 7.5pt, fill: sc, weight: "bold")[#upper(dep.status)]
        ]],
        [#text(size: 8pt, fill: rgb("#64748b"))[#dep.note]],
      )
    }
    table(
      columns: (2fr, 1.2fr, 1.2fr, 3fr),
      stroke: none,
      fill: (_, row) => if row == 0 { rgb("#f1f5f9") } else if calc.odd(row) { white } else { rgb("#f8fafc") },
      inset: (x: 6pt, y: 5pt),
      ..cells
    )
  }
]

// ============================================================
// WHAT WENT WELL
// ============================================================
#if data.positives.len() > 0 [
  #divider
  #block(
    stroke: (left: 4pt + rgb("#16a34a"), rest: none),
    inset: (left: 12pt, top: 8pt, bottom: 8pt, right: 6pt),
    width: 100%,
  )[
    #text(weight: "bold", fill: rgb("#15803d"), size: 10pt)[What Went Well]
    #v(4pt)
    #for p in data.positives [
      - #text(size: 9pt, fill: rgb("#166534"))[#p]
    ]
  ]
]

// ============================================================
// QUICK WINS
// ============================================================
#if data.quick_wins.len() > 0 [
  #v(8pt)
  #block(
    fill: rgb("#fefce8"),
    stroke: 1pt + rgb("#fde047"),
    inset: 12pt,
    radius: 6pt,
    width: 100%,
  )[
    #text(weight: "bold", fill: rgb("#713f12"), size: 10pt)[⚡ Quick Wins]
    #v(5pt)
    #for qw in data.quick_wins [
      - #text(weight: "bold", size: 9pt, fill: rgb("#854d0e"))[#qw.title]
        #if qw.effort != "" [#h(3pt)#text(size: 8pt, fill: rgb("#a16207"))[(#qw.effort)]]
        \ #text(size: 8.5pt, fill: rgb("#78350f"))[#qw.description]
    ]
  ]
]

// ============================================================
// RECOMMENDATIONS
// ============================================================
#if data.recommendations.len() > 0 [
  #divider
  == Recommendations

  // Uses priority_color() helper — single-line call, safe inside content block
  #for rec in data.recommendations [
    #let p = rec.at("priority", default: "medium")
    #let border_color = priority_color(p)

    #block(
      stroke: (left: 4pt + border_color, rest: 0.5pt + rgb("#e2e8f0")),
      inset: (left: 12pt, top: 10pt, bottom: 10pt, right: 10pt),
      radius: (top-right: 4pt, bottom-right: 4pt),
      width: 100%,
      below: 6pt,
    )[
      #grid(
        columns: (1fr, auto),
        align: horizon,
        [
          #priority_badge(p)
          #h(6pt)
          #text(weight: "bold", size: 10pt)[#rec.title]
        ],
        [
          #let eff = rec.at("effort", default: "")
          #if eff != "" [#text(size: 8pt, fill: rgb("#64748b"))[#eff]]
        ],
      )
      #v(5pt)
      #text(size: 9pt, fill: rgb("#374151"))[#rec.description]

      #let evlist = rec.at("evidence", default: ())
      #if evlist.len() > 0 [
        #v(5pt)
        #for ev in evlist [
          #block(
            fill: rgb("#1e293b"),
            inset: (x: 8pt, y: 6pt),
            radius: 4pt,
            width: 100%,
          )[
            #let eline = ev.at("line", default: 0)
            #text(size: 7.5pt, fill: rgb("#94a3b8"))[
              #ev.at("file", default: "")#if eline > 0 [:L#str(eline)]
            ]
            #let snip = ev.at("snippet", default: "")
            #if snip != "" [
              \ #text(size: 8pt, fill: rgb("#e2e8f0"), font: "DejaVu Sans Mono")[#snip]
            ]
          ]
        ]
      ]
    ]
  ]
]

// ============================================================
// COMMIT HYGIENE
// ============================================================
#let ch = data.commit_hygiene
#if ch.total_commits > 0 [
  #divider
  == Commit Hygiene
  #h(8pt)
  #score_bar(ch.score, 5.0)
  #h(4pt)
  #text(size: 9pt, fill: rgb("#64748b"))[#ch.score / 5.0]
  #v(7pt)

  // Explicit cells — avoids problematic ..for[content] spread in grid args
  #grid(
    columns: (1fr, 1fr, 1fr),
    column-gutter: 8pt,
    stat_card("Total Commits",  [#ch.total_commits]),
    stat_card("Single-purpose", [#int(ch.single_purpose_pct)%]),
    stat_card("Msg. Quality",   [#ch.message_quality_score / 5]),
  )

  #if ch.notes != "" [
    #v(5pt)
    #text(size: 8.5pt, fill: rgb("#64748b"))[#ch.notes]
  ]
]

// ============================================================
// PERFORMANCE HINTS
// ============================================================
#if data.performance_hints.len() > 0 [
  #divider
  == Performance Hints
  #v(3pt)
  #for hint in data.performance_hints [
    - #text(size: 9pt, fill: rgb("#374151"))[#hint]
  ]
]

// ============================================================
// OVERALL FEEDBACK
// ============================================================
#divider
== Overall Feedback

#text(size: 9.5pt, fill: rgb("#374151"))[#data.feedback]

#if data.encouragement != "" [
  #v(8pt)
  #block(
    fill: rgb("#f0fdf4"),
    stroke: (left: 4pt + rgb("#16a34a"), rest: none),
    inset: (left: 12pt, top: 8pt, bottom: 8pt, right: 8pt),
    width: 100%,
  )[
    #text(weight: "bold", fill: rgb("#15803d"))[Keep Going!] \
    #text(size: 9pt, fill: rgb("#166534"))[#data.encouragement]
  ]
]
