#set document(title: "Code Analysis Report")
#set page(margin: 2cm)
#set text(size: 11pt)

= Code Analysis Report

#grid(
  columns: (1fr, 1fr),
  [*Repository*], [#repo_url],
  [*Submission ID*], [#submission_id],
  [*Analyzed At*], [#analyzed_at],
  [*Grade*], [*#grade*],
  [*Overall Score*], [#percentage%],
)

---

== Metrics Breakdown

#table(
  columns: (2fr, 1fr, 1fr, 3fr),
  [*Metric*], [*Score*], [*Max*], [*Notes*],
  ..metrics_rows,
)

---

== Overall Feedback

#feedback

---

== Recommendations

#for rec in recommendations [
  - #rec
]

#if encouragement != "" [
  ---
  
  == Keep Going!
  
  #encouragement
]
