// ============================================================
// Code Analysis Report — Typst template
// Data bindings prepended by report_generator.py:
//   #let data = json("{id}_data.json")
//   #let radar_path = "{id}_radar.svg"
// ============================================================

// ── Page & text defaults ─────────────────────────────────────
#set document(title: "Code Analysis Report")
#set page(
  margin: (top: 1.6cm, bottom: 2.2cm, left: 2cm, right: 2cm),
  numbering: "1",
  footer: context [
    #line(length: 100%, stroke: 0.3pt + rgb("#e2e8f0"))
    #v(3pt)
    #set text(size: 7pt, fill: rgb("#94a3b8"))
    #grid(
      columns: (1fr, auto),
      align: horizon,
      [Code Analysis Report · #data.repo_url],
      [Page #counter(page).display("1 of 1", both: true)],
    )
  ],
)
#set text(size: 10pt, font: "Linux Libertine")
#set par(leading: 0.65em)
#set heading(numbering: none)

// ── Colour helpers ─────────────────────────────────────────
#let accent    = rgb("#1e3a5f")
#let muted     = rgb("#64748b")
#let border_cl = rgb("#e2e8f0")
#let bg_alt    = rgb("#f8fafc")

#let grade_color(g) = {
  if g == "A" { rgb("#15803d") } else if g == "B" { rgb("#2563eb") }
  else if g == "C" { rgb("#d97706") } else if g == "D" { rgb("#ea580c") }
  else { rgb("#dc2626") }
}

#let score_color(s, mx) = {
  let p = s / mx
  if p >= 0.7 { rgb("#15803d") } else if p >= 0.4 { rgb("#b45309") } else { rgb("#b91c1c") }
}

#let severity_color(s) = {
  if s == "high" { rgb("#dc2626") } else if s == "medium" { rgb("#d97706") } else { rgb("#15803d") }
}

#let priority_color(p) = {
  if p == "high" { rgb("#ef4444") } else if p == "medium" { rgb("#f59e0b") } else { rgb("#22c55e") }
}

#let dep_status_color(st) = {
  if st == "vulnerable" { rgb("#dc2626") } else if st == "outdated" { rgb("#d97706") }
  else if st == "unused" { rgb("#6b7280") } else { rgb("#15803d") }
}

// ── Badges ─────────────────────────────────────────────────
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
  box(fill: bg, inset: (x: 5pt, y: 2pt), radius: 3pt)[
    #text(size: 7pt, fill: white, weight: "bold")[#lbl]
  ]
}

#let status_badge(st) = {
  let sc = dep_status_color(st)
  box(fill: sc.lighten(82%), inset: (x: 4pt, y: 2pt), radius: 3pt)[
    #text(size: 7.5pt, fill: sc, weight: "bold")[#upper(st)]
  ]
}

// ── Score bar (10 segments) ─────────────────────────────────
#let score_bar(s, mx) = {
  let filled = int(calc.round(s / mx * 10))
  let clr = score_color(s, mx)
  let bars = ()
  for i in range(10) {
    if i < filled { bars += (text(fill: clr, size: 7.5pt)[█],) }
    else          { bars += (text(fill: rgb("#dde3ea"), size: 7.5pt)[█],) }
  }
  bars.join()
}

// ── Percentage progress bar (full-width) ───────────────────
#let pct_bar(pct, color) = {
  let frac = calc.min(pct / 100, 1.0)
  grid(
    columns: (1fr,),
    block(
      width: 100%,
      height: 7pt,
      radius: 4pt,
      fill: rgb("#e2e8f0"),
    )[
      #block(
        width: frac * 100%,
        height: 7pt,
        radius: 4pt,
        fill: color,
      )[]
    ],
  )
}

// ── Section heading ─────────────────────────────────────────
#let section_header(title) = {
  v(4pt)
  line(length: 100%, stroke: 0.4pt + border_cl)
  v(8pt)
  block(
    stroke: (left: 3pt + accent),
    inset: (left: 8pt, top: 3pt, bottom: 3pt, right: 0pt),
  )[
    #text(weight: "bold", size: 11pt, fill: rgb("#0f172a"))[#title]
  ]
  v(6pt)
}

// ── Simple divider (for in-section use) ─────────────────────
#let divider = {
  v(5pt)
  line(length: 100%, stroke: 0.4pt + border_cl)
  v(5pt)
}

// ── Stat card ───────────────────────────────────────────────
#let stat_card(label, value_content) = block(
  fill: bg_alt,
  stroke: 0.5pt + border_cl,
  inset: (x: 12pt, y: 10pt),
  radius: 5pt,
  width: 100%,
)[
  #text(size: 7.5pt, fill: muted, weight: "semibold")[#upper(label)]
  #v(3pt)
  #text(weight: "bold", size: 13pt)[#value_content]
]

// ── Callout block ───────────────────────────────────────────
#let callout(body, color: rgb("#2563eb"), bg: rgb("#eff6ff"), icon: "") = block(
  fill: bg,
  stroke: (left: 3.5pt + color, rest: 0.5pt + color.lighten(60%)),
  inset: (left: 12pt, top: 9pt, bottom: 9pt, right: 10pt),
  radius: (top-right: 4pt, bottom-right: 4pt),
  width: 100%,
  below: 5pt,
)[#body]

// ── Encouragement label (level-aware) ───────────────────────
#let encouragement_label(lvl) = {
  if lvl == "advanced"     { "Keep Pushing!" }
  else if lvl == "beginner" { "You're Getting There!" }
  else                      { "Good Progress!" }
}

// ============================================================
// HEADER
// ============================================================
#let gc = grade_color(data.grade)
#block(
  fill: gradient.linear(rgb("#1e3a5f"), rgb("#1e4d8c"), angle: 135deg),
  inset: (x: 18pt, y: 14pt),
  radius: 7pt,
  width: 100%,
)[
  #grid(
    columns: (1fr, auto),
    align: horizon,
    stack(
      spacing: 4pt,
      text(size: 16pt, weight: "bold", fill: white)[#data.project_name],
      text(size: 8.5pt, fill: rgb("#93c5fd"))[#data.repo_username],
    ),
    stack(
      dir: ltr,
      spacing: 10pt,
      align(right + horizon)[
        #box(
          fill: gc,
          inset: (x: 12pt, y: 6pt),
          radius: 5pt,
        )[
          #text(weight: "bold", fill: white, size: 18pt)[#data.grade]
        ]
      ],
      align(horizon)[
        #stack(
          spacing: 2pt,
          text(size: 15pt, weight: "bold", fill: white)[#data.percentage%],
          text(size: 7.5pt, fill: rgb("#93c5fd"))[overall score],
        )
      ],
    ),
  )
  // Full-width percentage bar below the title row
  #v(10pt)
  #pct_bar(data.percentage, gc.lighten(20%))
]

#v(8pt)

// ============================================================
// METADATA BOX
// ============================================================
#block(
  fill: bg_alt,
  stroke: 0.5pt + border_cl,
  inset: (x: 14pt, y: 11pt),
  radius: 6pt,
  width: 100%,
)[
  #let has_duration = "analyzed_in" in data and data.analyzed_in != ""
  #let cells = (
    text(weight: "bold", size: 7.5pt, fill: muted)[REPOSITORY],
    pad(left: 10pt)[#text(size: 8.5pt)[#data.repo_url]],
    [],
    text(weight: "bold", size: 7.5pt, fill: muted)[SUBMISSION],
    pad(left: 10pt)[#text(size: 8.5pt)[#data.submission_id]],
    text(weight: "bold", size: 7.5pt, fill: muted)[LEVEL],
    pad(left: 10pt)[
      #box(fill: accent.lighten(90%), inset: (x: 6pt, y: 2pt), radius: 3pt)[
        #text(size: 8pt, fill: accent, weight: "semibold")[#data.student_level]
      ]
    ],
    [],
    text(weight: "bold", size: 7.5pt, fill: muted)[ANALYZED],
    pad(left: 10pt)[#text(size: 8.5pt)[#data.analyzed_at]],
  )
  #let extra = if has_duration {(
    [],
    [],
    [],
    text(weight: "bold", size: 7.5pt, fill: muted)[DURATION],
    pad(left: 10pt)[#text(size: 8.5pt)[#data.analyzed_in]],
  )} else { () }
  #grid(
    columns: (auto, 1fr, 28pt, auto, 1fr),
    column-gutter: 0pt,
    row-gutter: 7pt,
    align: horizon,
    ..cells,
    ..extra,
  )
]

#v(6pt)

// ============================================================
// FLOOR RULE WARNINGS
// ============================================================
#if data.floor_rules.len() > 0 [
  #for rule in data.floor_rules [
    #callout(
      color: rgb("#d97706"),
      bg: rgb("#fffbeb"),
      [
        #text(weight: "bold", fill: rgb("#92400e"), size: 9pt)[⚠ Grade Floor Rule Applied]
        #h(5pt)
        #text(size: 8.5pt, fill: rgb("#78350f"))[#rule]
      ],
    )
  ]
  #v(4pt)
]

// ============================================================
// RADAR CHART + METRICS TABLE
// ============================================================
#let metric_keys   = ("solid", "clean_code", "oop", "error_handling", "testing", "documentation", "complexity")
#let metric_labels = ("SOLID", "Clean Code", "OOP", "Error Handling", "Testing", "Documentation", "Complexity")

#block(breakable: false)[
  #grid(
    columns: (0.42fr, 0.58fr),
    column-gutter: 16pt,
    align(center + horizon)[
      #image(radar_path, width: 100%)
    ],
    [
      #text(weight: "bold", size: 10.5pt, fill: rgb("#0f172a"))[Metrics Breakdown]
      #v(6pt)
      #{
        let cells = (
          [#text(weight: "bold", size: 7.5pt, fill: muted)[Metric]],
          [#text(weight: "bold", size: 7.5pt, fill: muted)[Score]],
          [#text(weight: "bold", size: 7.5pt, fill: muted)[Visual]],
          [#text(weight: "bold", size: 7.5pt, fill: muted)[Conf.]],
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
          columns: (2.2fr, 0.85fr, 1.4fr, 0.65fr),
          stroke: none,
          fill: (_, row) => if row == 0 { rgb("#f1f5f9") } else if calc.odd(row) { white } else { bg_alt },
          inset: (x: 6pt, y: 5.5pt),
          ..cells
        )
      }
    ],
  )
]

// ── Metric notes (only rows with non-empty notes) ────────────
#{
  let note_rows = ()
  for i in range(metric_keys.len()) {
    let key   = metric_keys.at(i)
    let label = metric_labels.at(i)
    let m     = data.metrics.at(key)
    let n     = m.at("notes", default: "")
    if n != "" {
      note_rows = note_rows + (
        [#text(size: 8.5pt, weight: "bold")[#label]],
        [#text(size: 8.5pt, fill: rgb("#374151"))[#n]],
      )
    }
  }
  if note_rows.len() > 0 [
    #v(10pt)
    #text(weight: "semibold", size: 9pt, fill: muted)[Metric Notes]
    #v(4pt)
    #table(
      columns: (1.5fr, 5fr),
      stroke: none,
      fill: (_, row) => if row == 0 { rgb("#f1f5f9") } else if calc.odd(row) { white } else { bg_alt },
      inset: (x: 6pt, y: 5.5pt),
      [#text(weight: "bold", size: 7.5pt, fill: muted)[Metric]],
      [#text(weight: "bold", size: 7.5pt, fill: muted)[Notes]],
      ..note_rows
    )
  ]
}

// ============================================================
// PROJECT OVERVIEW  (structured report for academic review)
// ============================================================
#pagebreak(weak: true)
#section_header("Project Overview")

#{
  let ov = data.at("project_overview", default: (:))
  let has_ov = ov.keys().len() > 0 and ov.at("summary", default: "") != ""

  if has_ov [
    // ── Summary ──────────────────────────────────────────────
    #block(
      fill: bg_alt,
      stroke: (left: 3.5pt + accent, rest: 0.5pt + border_cl),
      inset: (left: 14pt, top: 12pt, bottom: 12pt, right: 12pt),
      radius: (top-right: 5pt, bottom-right: 5pt),
      width: 100%,
    )[
      #set par(leading: 0.8em)
      #text(size: 9.5pt, fill: rgb("#1e293b"))[#ov.summary]
    ]

    // ── Technologies ─────────────────────────────────────────
    #let techs = ov.at("technologies", default: ())
    #if techs.len() > 0 [
      #v(10pt)
      #grid(
        columns: (54pt, 1fr),
        column-gutter: 6pt,
        align: top,
        text(size: 7.5pt, weight: "semibold", fill: muted)[TECHNOLOGIES],
        [#for t in techs [
          #box(fill: accent.lighten(88%), inset: (x: 7pt, y: 3pt), radius: 3pt)[
            #text(size: 7.5pt, fill: accent, weight: "semibold")[#t]
          ]
          #h(4pt)
        ]],
      )
    ]

    // ── Contributors ─────────────────────────────────────────
    #let contribs = ov.at("contributors", default: ())
    #if contribs.len() > 0 [
      #v(5pt)
      #grid(
        columns: (54pt, 1fr),
        column-gutter: 6pt,
        align: top,
        text(size: 7.5pt, weight: "semibold", fill: muted)[CONTRIBUTORS],
        [#for c in contribs [
          #box(
            fill: rgb("#f0fdf4"),
            stroke: 0.5pt + rgb("#86efac"),
            inset: (x: 7pt, y: 3pt),
            radius: 3pt,
          )[
            #text(size: 7.5pt, fill: rgb("#15803d"), weight: "semibold")[#c]
          ]
          #h(4pt)
        ]],
      )
    ]

    // ── Key Features ─────────────────────────────────────────
    #let features = ov.at("key_features", default: ())
    #if features.len() > 0 [
      #v(10pt)
      #text(weight: "semibold", size: 9pt, fill: rgb("#0f172a"))[Key Features]
      #v(5pt)
      #block(
        fill: bg_alt,
        stroke: 0.5pt + border_cl,
        inset: (x: 12pt, y: 10pt),
        radius: 5pt,
        width: 100%,
      )[
        #for feat in features [
          #grid(
            columns: (10pt, 1fr),
            column-gutter: 5pt,
            align: top,
            text(fill: accent, size: 9pt)[▸],
            text(size: 9pt, fill: rgb("#1e293b"))[#feat],
          )
          #v(3pt)
        ]
      ]
    ]

    // ── Implementation ────────────────────────────────────────
    #let impl_text = ov.at("implementation", default: "")
    #if impl_text != "" [
      #v(10pt)
      #text(weight: "semibold", size: 9pt, fill: rgb("#0f172a"))[Implementation]
      #v(5pt)
      #block(
        fill: bg_alt,
        stroke: (left: 2pt + accent.lighten(40%), rest: 0.5pt + border_cl),
        inset: (left: 12pt, top: 9pt, bottom: 9pt, right: 12pt),
        radius: (top-right: 4pt, bottom-right: 4pt),
        width: 100%,
      )[
        #set par(leading: 0.75em)
        #text(size: 9pt, fill: rgb("#1e293b"))[#impl_text]
      ]
    ]

    // ── Design Decisions ─────────────────────────────────────
    #let design_text = ov.at("design_decisions", default: "")
    #if design_text != "" [
      #v(10pt)
      #text(weight: "semibold", size: 9pt, fill: rgb("#0f172a"))[Design Decisions]
      #v(5pt)
      #block(
        fill: bg_alt,
        stroke: (left: 2pt + accent.lighten(40%), rest: 0.5pt + border_cl),
        inset: (left: 12pt, top: 9pt, bottom: 9pt, right: 12pt),
        radius: (top-right: 4pt, bottom-right: 4pt),
        width: 100%,
      )[
        #set par(leading: 0.75em)
        #text(size: 9pt, fill: rgb("#1e293b"))[#design_text]
      ]
    ]

    // ── Setup & Execution ────────────────────────────────────
    #let setup_text = ov.at("setup_instructions", default: "")
    #if setup_text != "" [
      #v(10pt)
      #text(weight: "semibold", size: 9pt, fill: rgb("#0f172a"))[Setup & Execution]
      #v(5pt)
      #block(
        fill: rgb("#0f172a"),
        inset: (x: 14pt, y: 12pt),
        radius: 6pt,
        width: 100%,
      )[
        #set text(size: 8pt, fill: rgb("#e2e8f0"), font: "DejaVu Sans Mono")
        #set par(leading: 0.9em)
        #setup_text
      ]
    ]

    // ── Limitations & Future Work ─────────────────────────────
    #let lim_text = ov.at("limitations", default: "")
    #if lim_text != "" [
      #v(10pt)
      #text(weight: "semibold", size: 9pt, fill: rgb("#0f172a"))[Limitations & Future Work]
      #v(5pt)
      #block(
        fill: rgb("#fff7ed"),
        stroke: (left: 2pt + rgb("#f59e0b"), rest: 0.5pt + rgb("#fde68a")),
        inset: (left: 12pt, top: 9pt, bottom: 9pt, right: 12pt),
        radius: (top-right: 4pt, bottom-right: 4pt),
        width: 100%,
      )[
        #set par(leading: 0.75em)
        #text(size: 9pt, fill: rgb("#78350f"))[#lim_text]
      ]
    ]

    // ── Assessment (AI narrative feedback) ────────────────────
    #if data.feedback != "" [
      #v(10pt)
      #text(weight: "semibold", size: 9pt, fill: rgb("#0f172a"))[Assessment]
      #v(5pt)
      #block(
        fill: bg_alt,
        stroke: (left: 3.5pt + accent, rest: 0.5pt + border_cl),
        inset: (left: 14pt, top: 11pt, bottom: 11pt, right: 12pt),
        radius: (top-right: 5pt, bottom-right: 5pt),
        width: 100%,
      )[
        #set par(leading: 0.75em)
        #text(size: 9.5pt, fill: rgb("#1e293b"))[#data.feedback]
      ]
    ]
  ] else [
    // Fallback: plain AI feedback when no structured overview is available
    #block(
      fill: bg_alt,
      stroke: (left: 3.5pt + accent, rest: 0.5pt + border_cl),
      inset: (left: 14pt, top: 12pt, bottom: 12pt, right: 12pt),
      radius: (top-right: 5pt, bottom-right: 5pt),
      width: 100%,
    )[
      #set par(leading: 0.75em)
      #text(size: 9.5pt, fill: rgb("#1e293b"))[#data.feedback]
    ]
  ]
}

#if data.encouragement != "" [
  #v(8pt)
  #block(breakable: false)[
    #block(
      fill: rgb("#f0fdf4"),
      stroke: (left: 3.5pt + rgb("#16a34a"), rest: 0.5pt + rgb("#bbf7d0")),
      inset: (left: 14pt, top: 10pt, bottom: 10pt, right: 12pt),
      radius: (top-right: 5pt, bottom-right: 5pt),
      width: 100%,
    )[
      #text(weight: "bold", fill: rgb("#15803d"), size: 9.5pt)[
        #encouragement_label(data.student_level)
      ]
      #h(5pt)
      #text(size: 9pt, fill: rgb("#166534"))[#data.encouragement]
    ]
  ]
]

// ============================================================
// WHAT WENT WELL
// ============================================================
#if data.positives.len() > 0 [
  #section_header("What Went Well")
  #block(breakable: false)[
    #block(
      fill: rgb("#f0fdf4"),
      stroke: (left: 3.5pt + rgb("#16a34a"), rest: 0.5pt + rgb("#bbf7d0")),
      inset: (left: 14pt, top: 10pt, bottom: 10pt, right: 12pt),
      radius: (top-right: 5pt, bottom-right: 5pt),
      width: 100%,
    )[
      #for p in data.positives [
        #grid(
          columns: (12pt, 1fr),
          column-gutter: 4pt,
          align: top,
          text(fill: rgb("#16a34a"), size: 10pt)[✓],
          text(size: 9pt, fill: rgb("#166534"))[#p],
        )
        #v(3pt)
      ]
    ]
  ]
]

// ============================================================
// QUICK WINS
// ============================================================
#if data.quick_wins.len() > 0 [
  #v(8pt)
  #block(breakable: false)[
    #block(
      fill: rgb("#fefce8"),
      stroke: (left: 3.5pt + rgb("#ca8a04"), rest: 0.5pt + rgb("#fde047")),
      inset: (left: 14pt, top: 11pt, bottom: 11pt, right: 12pt),
      radius: (top-right: 5pt, bottom-right: 5pt),
      width: 100%,
    )[
      #text(weight: "bold", fill: rgb("#713f12"), size: 10pt)[⚡ Quick Wins]
      #v(7pt)
      #for qw in data.quick_wins [
        #grid(
          columns: (1fr, auto),
          align: top,
          text(weight: "bold", size: 9pt, fill: rgb("#854d0e"))[#qw.title],
          if qw.effort != "" [
            #box(fill: rgb("#fef08a"), inset: (x: 5pt, y: 2pt), radius: 3pt)[
              #text(size: 7.5pt, fill: rgb("#713f12"), weight: "semibold")[#qw.effort]
            ]
          ],
        )
        #v(2pt)
        #text(size: 8.5pt, fill: rgb("#78350f"))[#qw.description]
        #v(6pt)
      ]
    ]
  ]
]

// ============================================================
// PROJECT STRUCTURE
// ============================================================
#let file_tree_str = data.at("file_tree", default: "")
#if file_tree_str != "" [
  #pagebreak(weak: true)
  #section_header("Project Structure")
  #block(
    fill: rgb("#0f172a"),
    inset: (x: 14pt, y: 12pt),
    radius: 6pt,
    width: 100%,
    clip: true,
  )[
    #set text(size: 7.5pt, fill: rgb("#e2e8f0"), font: "DejaVu Sans Mono")
    #set par(leading: 0.9em)
    #file_tree_str
  ]
]

// ============================================================
// PER-FILE ANALYSIS
// ============================================================
#if data.per_file.len() > 0 [
  #pagebreak(weak: true)
  #section_header("Per-File Analysis")

  #{
    let cells = (
      [#text(weight: "bold", size: 7.5pt, fill: muted)[File]],
      [#text(weight: "bold", size: 7.5pt, fill: muted)[Lines]],
      [#text(weight: "bold", size: 7.5pt, fill: muted)[Complexity]],
      [#text(weight: "bold", size: 7.5pt, fill: muted)[Duplication]],
      [#text(weight: "bold", size: 7.5pt, fill: muted)[Issues]],
    )
    for f in data.per_file {
      let ic  = f.issues.len()
      let cc  = f.cyclomatic_complexity
      let cc_color = if cc <= 3 { rgb("#15803d") } else if cc <= 6 { rgb("#b45309") } else { rgb("#b91c1c") }
      let cc_label = if cc <= 3 { "Low" }          else if cc <= 6 { "Med" }          else { "High" }
      let ic_color = if ic == 0 { rgb("#15803d") } else if ic <= 3 { rgb("#d97706") } else { rgb("#dc2626") }
      cells = cells + (
        [#text(size: 7.5pt, font: "DejaVu Sans Mono")[#f.filename]],
        [#text(size: 8pt)[#f.lines]],
        [
          #text(size: 8pt, fill: cc_color, weight: "bold")[#str(calc.round(cc, digits: 1))]
          #h(3pt)
          #box(fill: cc_color.lighten(82%), inset: (x: 3pt, y: 1pt), radius: 2pt)[
            #text(size: 6.5pt, fill: cc_color, weight: "semibold")[#cc_label]
          ]
        ],
        [
          #let dup = f.duplication_pct
          #let dup_color = if dup <= 5 { rgb("#15803d") } else if dup <= 15 { rgb("#b45309") } else { rgb("#b91c1c") }
          #text(size: 8pt, fill: dup_color)[#str(calc.round(dup, digits: 1))%]
        ],
        [
          #box(
            fill: if ic == 0 { rgb("#dcfce7") } else if ic <= 3 { rgb("#fef9c3") } else { rgb("#fee2e2") },
            inset: (x: 4pt, y: 1pt),
            radius: 10pt,
          )[
            #text(size: 8pt, fill: ic_color, weight: "bold")[#str(ic)]
          ]
        ],
      )
    }
    table(
      columns: (3fr, 0.8fr, 1.2fr, 1.2fr, 0.8fr),
      stroke: none,
      fill: (_, row) => if row == 0 { rgb("#f1f5f9") } else if calc.odd(row) { white } else { bg_alt },
      inset: (x: 6pt, y: 6pt),
      ..cells
    )
  }

  // Per-file issue detail cards
  #for f in data.per_file [
    #if f.issues.len() > 0 [
      #v(8pt)
      #block(breakable: false)[
        #block(
          fill: rgb("#f1f5f9"),
          inset: (x: 10pt, y: 6pt),
          radius: (top: 4pt, bottom: 0pt),
          width: 100%,
          below: 0pt,
        )[
          #text(size: 7.5pt, weight: "bold", fill: muted, font: "DejaVu Sans Mono")[#f.filename]
        ]
        #block(
          stroke: 0.5pt + border_cl,
          inset: 0pt,
          radius: (bottom: 4pt, top-right: 4pt),
          width: 100%,
          clip: true,
        )[
          #{
            let rows = f.issues
            for i in range(rows.len()) {
              let issue = rows.at(i)
              let sc = severity_color(issue.severity)
              let bg = if calc.even(i) { white } else { bg_alt }
              block(
                fill: bg,
                inset: (x: 10pt, y: 6pt),
                width: 100%,
                below: 0pt,
              )[
                #grid(
                  columns: (auto, 38pt, 1fr),
                  column-gutter: 6pt,
                  align: horizon,
                  box(fill: sc.lighten(82%), inset: (x: 3pt, y: 1pt), radius: 2pt)[
                    #text(size: 6.5pt, fill: sc, weight: "bold")[#upper(issue.severity)]
                  ],
                  text(size: 7.5pt, fill: muted, font: "DejaVu Sans Mono")[L#str(issue.line)],
                  text(size: 8pt, fill: rgb("#374151"))[#issue.message],
                )
              ]
            }
          }
        ]
      ]
    ]
  ]
]

// ============================================================
// DEPENDENCY HEALTH
// ============================================================
#if data.dependencies.details.len() > 0 [
  #pagebreak(weak: true)
  #section_header("Dependency Health")

  #block(breakable: false)[
    #grid(
      columns: (auto, auto, auto, auto, 1fr),
      column-gutter: 8pt,
      align: horizon,
      stat_card("Total", [#data.dependencies.total]),
      stat_card("Outdated", [
        #text(fill: if data.dependencies.outdated > 0 { rgb("#d97706") } else { rgb("#15803d") })[
          #data.dependencies.outdated
        ]
      ]),
      stat_card("Vulnerable", [
        #text(fill: if data.dependencies.vulnerable > 0 { rgb("#dc2626") } else { rgb("#15803d") })[
          #data.dependencies.vulnerable
        ]
      ]),
      stat_card("Unused", [
        #text(fill: if data.dependencies.unused > 0 { rgb("#6b7280") } else { rgb("#15803d") })[
          #data.dependencies.unused
        ]
      ]),
      [],
    )
  ]
  #v(8pt)

  #{
    let cells = (
      [#text(weight: "bold", size: 7.5pt, fill: muted)[Package]],
      [#text(weight: "bold", size: 7.5pt, fill: muted)[Version]],
      [#text(weight: "bold", size: 7.5pt, fill: muted)[Status]],
      [#text(weight: "bold", size: 7.5pt, fill: muted)[Purpose]],
    )
    for dep in data.dependencies.details {
      cells = cells + (
        [#text(size: 7.5pt, font: "DejaVu Sans Mono")[#dep.name]],
        [#text(size: 8pt)[#dep.current]],
        [#status_badge(dep.status)],
        [#text(size: 8pt, fill: muted)[#dep.note]],
      )
    }
    table(
      columns: (2.2fr, 1fr, 1fr, 3fr),
      stroke: none,
      fill: (_, row) => if row == 0 { rgb("#f1f5f9") } else if calc.odd(row) { white } else { bg_alt },
      inset: (x: 6pt, y: 5.5pt),
      ..cells
    )
  }
]

// ============================================================
// ARCHITECTURE OVERVIEW
// ============================================================
#let arch_svg = data.at("arch_svg", default: "")
#if arch_svg != "" [
  #pagebreak(weak: true)
  #section_header("Architecture Overview")
  #block(breakable: false)[
    #block(
      fill: bg_alt,
      stroke: 0.5pt + border_cl,
      inset: 12pt,
      radius: 6pt,
      width: 100%,
    )[
      #align(center)[
        #image(arch_svg, width: 88%)
      ]
    ]
  ]
]

// ============================================================
// CLASS DIAGRAM
// ============================================================
#let class_svg = data.at("class_svg", default: "")
#if class_svg != "" [
  #pagebreak(weak: true)
  #section_header("Class Diagram")
  #block(breakable: false)[
    #block(
      fill: bg_alt,
      stroke: 0.5pt + border_cl,
      inset: 12pt,
      radius: 6pt,
      width: 100%,
    )[
      #align(center)[
        #image(class_svg, width: 95%)
      ]
    ]
  ]
  // Legend
  #v(5pt)
  #block(
    fill: bg_alt,
    stroke: 0.5pt + border_cl,
    inset: (x: 12pt, y: 7pt),
    radius: 4pt,
    width: 100%,
  )[
    #set text(size: 7.5pt, fill: muted)
    #grid(
      columns: (auto, 8pt, auto, 32pt, auto, 8pt, auto, 1fr),
      column-gutter: 5pt,
      align: horizon,
      [Legend:],
      [],
      line(length: 22pt, stroke: 1.5pt + rgb("#64748b")),
      [],
      [inheritance / implements],
      [],
      line(length: 22pt, stroke: (paint: rgb("#94a3b8"), dash: "dashed", thickness: 1.5pt)),
      [#h(5pt) uses / composes],
    )
  ]
]

// ============================================================
// RECOMMENDATIONS
// ============================================================
#if data.recommendations.len() > 0 [
  #pagebreak(weak: true)
  #section_header("Recommendations")

  #for rec in data.recommendations [
    #let p = rec.at("priority", default: "medium")
    #let border_color = priority_color(p)
    #block(breakable: false, below: 8pt)[
      #block(
        stroke: (left: 4pt + border_color, rest: 0.5pt + border_cl),
        inset: (left: 14pt, top: 11pt, bottom: 11pt, right: 12pt),
        radius: (top-right: 5pt, bottom-right: 5pt),
        width: 100%,
      )[
        #grid(
          columns: (1fr, auto),
          align: horizon,
          stack(
            dir: ltr,
            spacing: 7pt,
            priority_badge(p),
            text(weight: "bold", size: 10pt)[#rec.title],
          ),
          [
            #let eff = rec.at("effort", default: "")
            #if eff != "" [
              #box(fill: bg_alt, stroke: 0.5pt + border_cl, inset: (x: 6pt, y: 3pt), radius: 3pt)[
                #text(size: 7.5pt, fill: muted)[#eff]
              ]
            ]
          ],
        )
        #v(6pt)
        #text(size: 9pt, fill: rgb("#374151"))[#rec.description]

        #let evlist = rec.at("evidence", default: ())
        #if evlist.len() > 0 [
          #v(7pt)
          #for ev in evlist [
            #block(
              fill: rgb("#0f172a"),
              inset: (x: 10pt, y: 7pt),
              radius: 4pt,
              width: 100%,
              below: 4pt,
            )[
              #let eline = ev.at("line", default: 0)
              #text(size: 7pt, fill: rgb("#64748b"), font: "DejaVu Sans Mono")[
                #ev.at("file", default: "")#if eline > 0 [ · L#str(eline)]
              ]
              #let snip = ev.at("snippet", default: "")
              #if snip != "" [
                #v(2pt)
                #text(size: 8pt, fill: rgb("#e2e8f0"), font: "DejaVu Sans Mono")[#snip]
              ]
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
  #section_header("Commit Hygiene")
  #block(breakable: false)[
    #grid(
      columns: (1fr, 1fr, 1fr),
      column-gutter: 8pt,
      stat_card("Total Commits",   [#ch.total_commits]),
      stat_card("Single-purpose",  [#int(ch.single_purpose_pct)%]),
      stat_card("Msg. Quality",    [#ch.message_quality_score / 5]),
    )
    #v(8pt)
    #grid(
      columns: (auto, auto, 1fr),
      column-gutter: 8pt,
      align: horizon,
      text(size: 8.5pt, weight: "semibold", fill: muted)[Hygiene Score],
      stack(
        dir: ltr,
        spacing: 6pt,
        score_bar(ch.score, 5.0),
        text(size: 8.5pt, fill: muted)[#ch.score / 5.0],
      ),
      [],
    )
    #if ch.notes != "" [
      #v(6pt)
      #text(size: 8.5pt, fill: muted)[#ch.notes]
    ]
  ]
]

// ============================================================
// PERFORMANCE HINTS
// ============================================================
#if data.performance_hints.len() > 0 [
  #section_header("Performance Hints")
  #block(breakable: false)[
    #block(
      fill: rgb("#fff7ed"),
      stroke: (left: 3.5pt + rgb("#ea580c"), rest: 0.5pt + rgb("#fed7aa")),
      inset: (left: 14pt, top: 10pt, bottom: 10pt, right: 12pt),
      radius: (top-right: 5pt, bottom-right: 5pt),
      width: 100%,
    )[
      #for hint in data.performance_hints [
        #grid(
          columns: (14pt, 1fr),
          column-gutter: 2pt,
          align: top,
          text(fill: rgb("#ea580c"), size: 9pt)[⚙],
          text(size: 9pt, fill: rgb("#431407"))[#hint],
        )
        #v(4pt)
      ]
    ]
  ]
]
