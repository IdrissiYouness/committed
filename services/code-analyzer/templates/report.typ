#set document(title: "Code Analysis Report")
#set page(margin: 2cm)
#set text(size: 11pt)

#grid(
  columns: (1fr, 1fr),
  align(horizon)[= Code Analysis Report],
  align(right + horizon)[== #analyzed_at],
)

#line(length: 100%)

#grid(
  columns: (auto, 1fr),
  row-gutter: 6pt,
  column-gutter: 16pt,
  [*Repository*], [#repo_url],
  [*Submission ID*], [#submission_id],
  [*Grade*], [*#grade*],
  [*Overall Score*], [#percentage%],
)

#if floor_rules.len() > 0 [
  #line(length: 100%)

  == Grade Adjustment — Floor Rule Applied

  #for rule in floor_rules [
    #block(
      fill: rgb("#fff3cd"),
      stroke: rgb("#ffc107"),
      inset: 10pt,
      radius: 4pt,
      width: 100%,
    )[#rule]
  ]
]

#line(length: 100%)

== Metrics Breakdown

#table(
  columns: (2fr, 1fr, 1fr, 3fr),
  [*Metric*], [*Score*], [*Max*], [*Notes*],
  ..metrics_rows,
)

#line(length: 100%)

== Overall Feedback

#feedback

#line(length: 100%)

== Recommendations

#for rec in recommendations [
  - #rec
]

#if encouragement != "" [
  #line(length: 100%)

  == Keep Going!

  #encouragement
]
