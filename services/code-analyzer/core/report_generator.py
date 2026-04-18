"""Typst PDF report generation"""

import html
import json
import logging
import math
import os
import subprocess
import textwrap
from datetime import datetime
from urllib.parse import urlparse

from config import Config
from models.metrics_schema import ArchComponent, ArchConnection, ClassEntry, MetricsSchema, ProjectOverview, Recommendation

logger = logging.getLogger(__name__)

# Ordered metric keys used consistently throughout
METRIC_KEYS = ["solid", "clean_code", "oop", "error_handling", "testing", "documentation", "complexity"]


def _svg_escape(text: str) -> str:
    """Escape special XML characters so they are safe inside SVG text elements."""
    return html.escape(str(text), quote=False)


# ── Colour palettes ───────────────────────────────────────────────────────────

# Architecture component type → fill colour
_ARCH_TYPE_COLOR = {
    "ui": "#3b82f6", "frontend": "#3b82f6", "view": "#3b82f6",
    "client": "#8b5cf6", "service": "#8b5cf6", "controller": "#8b5cf6",
    "handler": "#8b5cf6", "middleware": "#8b5cf6", "module": "#6366f1",
    "server": "#ef4444", "api": "#ef4444", "backend": "#ef4444",
    "db": "#6b7280", "database": "#6b7280", "repository": "#0ea5e9",
    "model": "#10b981", "dto": "#10b981",
    "util": "#f59e0b", "helper": "#f59e0b", "config": "#94a3b8",
}
_ARCH_DEFAULT_COLOR = "#64748b"

# Architecture component type → layer depth (0 = top)
_ARCH_TYPE_LAYER = {
    "ui": 0, "frontend": 0, "view": 0,
    "client": 1, "service": 1, "controller": 1, "handler": 1, "middleware": 1, "module": 1,
    "server": 2, "api": 2, "backend": 2,
    "db": 3, "database": 3, "repository": 3, "model": 3, "dto": 3,
    "util": 3, "helper": 3, "config": 3,
}

# Class entry type → header colour
_CLASS_TYPE_COLOR = {
    "class": "#3b82f6",
    "interface": "#8b5cf6",
    "abstract": "#f59e0b",
    "enum": "#10b981",
}
_CLASS_DEFAULT_COLOR = "#64748b"


# ── Radar chart ───────────────────────────────────────────────────────────────


def generate_radar_svg(scores: list[float], labels: list[str], max_val: float = 5.0) -> str:
    """
    Generate a spider/radar chart as a self-contained SVG string.

    Args:
        scores: List of numeric values (same length as labels)
        labels: List of axis label strings; use \\n for line breaks
        max_val: Maximum value on each axis

    Returns:
        SVG markup as a string
    """
    N = len(scores)
    if N == 0:
        return '<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"></svg>'

    W, H = 500, 460
    cx, cy = 250, 228
    radius = 152
    label_r = 194

    def to_xy(r: float, angle: float):
        return cx + r * math.cos(angle), cy + r * math.sin(angle)

    # Angles start at top (-π/2) and go clockwise
    angles = [-math.pi / 2 + 2 * math.pi * i / N for i in range(N)]

    parts = [
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" '
        f'width="{W}" height="{H}">',
        f'<rect width="{W}" height="{H}" fill="white"/>',
    ]

    # Grid rings (1–5)
    for level in range(1, 6):
        r = radius * level / max_val
        pts = " ".join(f"{to_xy(r, a)[0]:.1f},{to_xy(r, a)[1]:.1f}" for a in angles)
        fill = "rgba(219,234,254,0.25)" if level % 2 == 0 else "none"
        parts.append(
            f'<polygon points="{pts}" fill="{fill}" stroke="#cbd5e1" stroke-width="0.8"/>'
        )

    # Ring level numbers along the first (top) axis
    for level in range(1, 6):
        r = radius * level / max_val
        x, y = to_xy(r, angles[0])
        parts.append(
            f'<text x="{x + 5:.1f}" y="{y:.1f}" font-size="9" fill="#94a3b8" '
            f'font-family="Arial,sans-serif" dominant-baseline="middle">{level}</text>'
        )

    # Axis spokes
    for a in angles:
        x, y = to_xy(radius, a)
        parts.append(
            f'<line x1="{cx}" y1="{cy}" x2="{x:.1f}" y2="{y:.1f}" '
            f'stroke="#cbd5e1" stroke-width="0.9"/>'
        )

    # Data polygon
    data_pts = [to_xy(radius * max(0.0, min(s, max_val)) / max_val, a) for s, a in zip(scores, angles)]
    pts_str = " ".join(f"{x:.1f},{y:.1f}" for x, y in data_pts)
    parts.append(
        f'<polygon points="{pts_str}" fill="rgba(37,99,235,0.18)" '
        f'stroke="#2563eb" stroke-width="2.5" stroke-linejoin="round"/>'
    )

    # Data dots
    for x, y in data_pts:
        parts.append(
            f'<circle cx="{x:.1f}" cy="{y:.1f}" r="4.5" fill="#2563eb" '
            f'stroke="white" stroke-width="2"/>'
        )

    # Axis labels
    for i, label in enumerate(labels):
        a = angles[i]
        x, y = to_xy(label_r, a)

        anchor = "middle"
        if x < cx - 20:
            anchor = "end"
        elif x > cx + 20:
            anchor = "start"

        lines = label.split("\n")
        line_h = 14
        start_y = y - (len(lines) - 1) * line_h / 2

        parts.append(
            f'<text text-anchor="{anchor}" font-size="11.5" font-weight="600" '
            f'fill="#334155" font-family="Arial,sans-serif">'
        )
        for j, line in enumerate(lines):
            ty = start_y + j * line_h
            parts.append(f'<tspan x="{x:.1f}" y="{ty:.1f}">{line}</tspan>')
        parts.append("</text>")

    parts.append("</svg>")
    return "\n".join(parts)


# ── Architecture diagram ──────────────────────────────────────────────────────


def generate_architecture_svg(components: list[dict], connections: list[dict]) -> str:
    """
    Generate a layered architecture diagram as an SVG string.

    Components are arranged in horizontal rows by their type (ui at top,
    server in middle, models/db at bottom).  Directed arrows are drawn
    between connected components with optional labels.

    Args:
        components: List of dicts with keys id, label, type
        connections: List of dicts with keys source, target, label

    Returns:
        SVG markup as a string
    """
    if not components:
        return '<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"></svg>'

    BOX_W, BOX_H = 140, 46
    H_GAP, V_GAP = 22, 52
    PAD_X, PAD_Y = 28, 24

    # Group by layer
    layers: dict[int, list] = {}
    for comp in components:
        layer = _ARCH_TYPE_LAYER.get(comp.get("type", "module").lower(), 1)
        layers.setdefault(layer, []).append(comp)

    # Compact: renumber layers 0..n-1
    sorted_layer_keys = sorted(layers.keys())
    compacted = {new: layers[old] for new, old in enumerate(sorted_layer_keys)}
    n_layers = len(compacted)

    # Canvas size
    max_per_row = max(len(v) for v in compacted.values())
    W = max(380, PAD_X * 2 + max_per_row * BOX_W + (max_per_row - 1) * H_GAP)
    H = PAD_Y * 2 + n_layers * BOX_H + (n_layers - 1) * V_GAP

    # Node centre positions
    positions: dict[str, tuple[float, float]] = {}
    for layer_idx, nodes in compacted.items():
        n = len(nodes)
        row_w = n * BOX_W + (n - 1) * H_GAP
        start_cx = (W - row_w) / 2 + BOX_W / 2
        cy = PAD_Y + layer_idx * (BOX_H + V_GAP) + BOX_H / 2
        for i, comp in enumerate(nodes):
            cx = start_cx + i * (BOX_W + H_GAP)
            positions[comp["id"]] = (cx, cy)

    parts = [
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}">',
        '<rect width="100%" height="100%" fill="white"/>',
        "<defs>",
        '<marker id="arr" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">',
        '  <polygon points="0 0, 8 3, 0 6" fill="#94a3b8"/>',
        "</marker>",
        "</defs>",
    ]

    # Draw connections (behind nodes)
    for conn in connections:
        src = conn.get("source", "")
        tgt = conn.get("target", "")
        if src not in positions or tgt not in positions:
            continue
        x1, y1 = positions[src]
        x2, y2 = positions[tgt]
        dx, dy = x2 - x1, y2 - y1

        # Attach to nearest box edge
        if abs(dy) >= abs(dx):
            sign = 1 if dy >= 0 else -1
            ay1 = y1 + sign * BOX_H / 2
            ay2 = y2 - sign * BOX_H / 2
            lx, ly = (x1 + x2) / 2, (ay1 + ay2) / 2
            parts.append(
                f'<line x1="{x1:.1f}" y1="{ay1:.1f}" x2="{x2:.1f}" y2="{ay2:.1f}" '
                f'stroke="#cbd5e1" stroke-width="1.5" marker-end="url(#arr)"/>'
            )
        else:
            sign = 1 if dx >= 0 else -1
            ax1 = x1 + sign * BOX_W / 2
            ax2 = x2 - sign * BOX_W / 2
            lx, ly = (ax1 + ax2) / 2, y1
            parts.append(
                f'<line x1="{ax1:.1f}" y1="{y1:.1f}" x2="{ax2:.1f}" y2="{y2:.1f}" '
                f'stroke="#cbd5e1" stroke-width="1.5" marker-end="url(#arr)"/>'
            )

        label = conn.get("label", "")
        if label:
            lw = max(len(label) * 5.5, 20)
            parts.append(
                f'<rect x="{lx - lw / 2:.1f}" y="{ly - 9:.1f}" width="{lw:.0f}" '
                f'height="11" rx="2" fill="white" opacity="0.9"/>'
            )
            parts.append(
                f'<text x="{lx:.1f}" y="{ly:.1f}" font-size="7.5" fill="#64748b" '
                f'text-anchor="middle" font-family="Arial,sans-serif">{_svg_escape(label)}</text>'
            )

    # Draw nodes (on top of connections)
    for comp in components:
        cid = comp["id"]
        if cid not in positions:
            continue
        cx, cy = positions[cid]
        bx, by = cx - BOX_W / 2, cy - BOX_H / 2
        color = _ARCH_TYPE_COLOR.get(comp.get("type", "").lower(), _ARCH_DEFAULT_COLOR)
        label = comp.get("label", cid)
        comp_type = comp.get("type", "")

        # Drop shadow
        parts.append(
            f'<rect x="{bx + 2:.1f}" y="{by + 2:.1f}" width="{BOX_W}" height="{BOX_H}" '
            f'rx="5" fill="rgba(0,0,0,0.07)"/>'
        )
        # Box body
        parts.append(
            f'<rect x="{bx:.1f}" y="{by:.1f}" width="{BOX_W}" height="{BOX_H}" '
            f'rx="5" fill="white" stroke="{color}" stroke-width="1.5"/>'
        )
        # Top colour bar
        parts.append(
            f'<rect x="{bx:.1f}" y="{by:.1f}" width="{BOX_W}" height="5" rx="5" fill="{color}"/>'
        )
        parts.append(
            f'<rect x="{bx:.1f}" y="{by + 3:.1f}" width="{BOX_W}" height="2" fill="{color}"/>'
        )
        # Label
        parts.append(
            f'<text x="{cx:.1f}" y="{cy + 1:.1f}" text-anchor="middle" font-size="10" '
            f'font-weight="600" fill="#1e293b" font-family="Arial,sans-serif">{_svg_escape(label)}</text>'
        )
        # Type badge
        if comp_type:
            parts.append(
                f'<text x="{cx:.1f}" y="{cy + 14:.1f}" text-anchor="middle" font-size="7.5" '
                f'fill="{color}" font-family="Arial,sans-serif">«{_svg_escape(comp_type)}»</text>'
            )

    parts.append("</svg>")
    return "\n".join(parts)


# ── Class diagram ─────────────────────────────────────────────────────────────


def generate_class_diagram_svg(classes: list[dict]) -> str:
    """
    Generate a UML-style class diagram as an SVG string.

    Classes are arranged in a grid (max 3 columns).  Each box shows the
    class name in a coloured header, fields in the middle section, and
    methods in the lower section.  Relationship arrows are drawn last so
    they appear on top of the boxes.

    Args:
        classes: List of dicts with keys name, type, fields, methods, relationships

    Returns:
        SVG markup as a string
    """
    if not classes:
        return '<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"></svg>'

    # Cap at 10 to keep the diagram legible
    classes = classes[:10]

    BOX_W = 175
    HEADER_H = 30
    ROW_H = 14
    SECTION_PAD = 5
    H_GAP = 22
    V_GAP = 48
    COLS = 3
    PAD_X, PAD_Y = 22, 22

    def _box_height(cls: dict) -> int:
        fields = cls.get("fields", [])
        methods = cls.get("methods", [])
        h = HEADER_H + SECTION_PAD
        if fields:
            h += len(fields) * ROW_H + SECTION_PAD
        if methods:
            h += len(methods) * ROW_H + SECTION_PAD
        return max(50, h)

    box_heights = [_box_height(c) for c in classes]
    n = len(classes)
    n_cols = min(COLS, n)
    n_rows = math.ceil(n / n_cols)

    # Row heights = tallest box in that row
    row_heights = []
    for row in range(n_rows):
        rh = max(box_heights[row * n_cols + c] for c in range(n_cols) if row * n_cols + c < n)
        row_heights.append(rh)

    row_y = [PAD_Y]
    for i in range(1, n_rows):
        row_y.append(row_y[-1] + row_heights[i - 1] + V_GAP)

    positions: list[tuple[float, float, int, int]] = []  # (bx, by, bw, bh)
    for i in range(n):
        row, col = divmod(i, n_cols)
        bx = PAD_X + col * (BOX_W + H_GAP)
        positions.append((bx, row_y[row], BOX_W, box_heights[i]))

    W = PAD_X * 2 + n_cols * BOX_W + (n_cols - 1) * H_GAP
    H = PAD_Y * 2 + sum(row_heights) + (n_rows - 1) * V_GAP

    parts = [
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}">',
        '<rect width="100%" height="100%" fill="white"/>',
        "<defs>",
        '<marker id="inherit" markerWidth="10" markerHeight="8" refX="9" refY="4" orient="auto">',
        '  <polygon points="0 0, 10 4, 0 8" fill="white" stroke="#64748b" stroke-width="1"/>',
        "</marker>",
        '<marker id="uses_arr" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">',
        '  <polygon points="0 0, 8 3, 0 6" fill="#94a3b8"/>',
        "</marker>",
        "</defs>",
    ]

    name_to_idx = {cls.get("name", ""): i for i, cls in enumerate(classes)}

    # Draw relationship arrows first (behind boxes)
    for i, cls in enumerate(classes):
        bx, by, bw, bh = positions[i]
        cx_src = bx + bw / 2
        cy_src = by + bh / 2

        for rel in cls.get("relationships", []):
            to_name = rel.get("to", "")
            if to_name not in name_to_idx:
                continue
            j = name_to_idx[to_name]
            tbx, tby, tbw, tbh = positions[j]
            cx_tgt = tbx + tbw / 2
            cy_tgt = tby + tbh / 2

            rel_type = rel.get("type", "uses")
            is_inheritance = rel_type in ("inherits", "implements")
            marker = "url(#inherit)" if is_inheritance else "url(#uses_arr)"
            stroke = "#64748b" if is_inheritance else "#94a3b8"
            dash = "" if is_inheritance else 'stroke-dasharray="4,3"'

            dx, dy = cx_tgt - cx_src, cy_tgt - cy_src
            if abs(dy) >= abs(dx):
                sign = 1 if dy >= 0 else -1
                y1e = by + (bh if sign > 0 else 0)
                y2e = tby + (0 if sign > 0 else tbh)
                parts.append(
                    f'<line x1="{cx_src:.1f}" y1="{y1e:.1f}" x2="{cx_tgt:.1f}" y2="{y2e:.1f}" '
                    f'stroke="{stroke}" stroke-width="1.5" {dash} marker-end="{marker}"/>'
                )
            else:
                sign = 1 if dx >= 0 else -1
                x1e = bx + (bw if sign > 0 else 0)
                x2e = tbx + (0 if sign > 0 else tbw)
                parts.append(
                    f'<line x1="{x1e:.1f}" y1="{cy_src:.1f}" x2="{x2e:.1f}" y2="{cy_tgt:.1f}" '
                    f'stroke="{stroke}" stroke-width="1.5" {dash} marker-end="{marker}"/>'
                )

    # Draw class boxes on top
    for i, cls in enumerate(classes):
        bx, by, bw, bh = positions[i]
        name = cls.get("name", "Unknown")
        cls_type = cls.get("type", "class")
        color = _CLASS_TYPE_COLOR.get(cls_type, _CLASS_DEFAULT_COLOR)
        fields = cls.get("fields", [])
        methods = cls.get("methods", [])

        # Drop shadow
        parts.append(
            f'<rect x="{bx + 2:.1f}" y="{by + 2:.1f}" width="{bw}" height="{bh}" '
            f'rx="4" fill="rgba(0,0,0,0.06)"/>'
        )
        # Box body
        parts.append(
            f'<rect x="{bx:.1f}" y="{by:.1f}" width="{bw}" height="{bh}" '
            f'rx="4" fill="white" stroke="{color}" stroke-width="1.5"/>'
        )
        # Header background
        parts.append(
            f'<rect x="{bx:.1f}" y="{by:.1f}" width="{bw}" height="{HEADER_H}" '
            f'rx="4" fill="{color}"/>'
        )
        # Flush bottom corners of header
        parts.append(
            f'<rect x="{bx:.1f}" y="{by + HEADER_H - 4:.1f}" width="{bw}" height="4" fill="{color}"/>'
        )

        # Type stereotype + class name inside header
        if cls_type != "class":
            parts.append(
                f'<text x="{bx + bw / 2:.1f}" y="{by + 9:.1f}" text-anchor="middle" '
                f'font-size="7" fill="rgba(255,255,255,0.8)" font-style="italic" '
                f'font-family="Arial,sans-serif">«{_svg_escape(cls_type)}»</text>'
            )
            parts.append(
                f'<text x="{bx + bw / 2:.1f}" y="{by + 22:.1f}" text-anchor="middle" '
                f'font-size="9.5" font-weight="bold" fill="white" '
                f'font-family="Arial,sans-serif">{_svg_escape(name)}</text>'
            )
        else:
            parts.append(
                f'<text x="{bx + bw / 2:.1f}" y="{by + 19:.1f}" text-anchor="middle" '
                f'font-size="10" font-weight="bold" fill="white" '
                f'font-family="Arial,sans-serif">{_svg_escape(name)}</text>'
            )

        # Fields
        fy = by + HEADER_H + SECTION_PAD + ROW_H - 3
        for field in fields[:5]:
            display = field if len(field) <= 26 else field[:24] + "…"
            parts.append(
                f'<text x="{bx + 7:.1f}" y="{fy:.1f}" font-size="7.5" fill="#475569" '
                f'font-family="DejaVu Sans Mono,Courier New,monospace">+ {_svg_escape(display)}</text>'
            )
            fy += ROW_H

        if fields and methods:
            # Divider between fields and methods
            dy = fy - ROW_H + ROW_H // 2 + 2
            parts.append(
                f'<line x1="{bx:.1f}" y1="{dy:.1f}" x2="{bx + bw:.1f}" y2="{dy:.1f}" '
                f'stroke="{color}" stroke-width="0.5" opacity="0.4"/>'
            )
            fy += SECTION_PAD - 2

        # Methods
        for method in methods[:5]:
            display = method if len(method) <= 26 else method[:24] + "…"
            parts.append(
                f'<text x="{bx + 7:.1f}" y="{fy:.1f}" font-size="7.5" fill="#374151" '
                f'font-style="italic" '
                f'font-family="DejaVu Sans Mono,Courier New,monospace">{_svg_escape(display)}</text>'
            )
            fy += ROW_H

    parts.append("</svg>")
    return "\n".join(parts)


# ── Helpers ───────────────────────────────────────────────────────────────────


def _to_rec_dict(r: Recommendation | dict) -> dict:
    """Normalise any recommendation form to a plain dict for JSON serialisation."""
    if isinstance(r, str):
        return {"title": r, "description": r, "priority": "medium", "effort": "", "evidence": []}
    if isinstance(r, Recommendation):
        return r.model_dump()
    if isinstance(r, dict):
        d = dict(r)
        if "title" not in d:
            d["title"] = d.get("description", "Recommendation")
        if "description" not in d:
            d["description"] = d.get("title", "")
        d.setdefault("priority", "medium")
        d.setdefault("effort", "")
        d.setdefault("evidence", [])
        return d
    return {"title": str(r), "description": str(r), "priority": "medium", "effort": "", "evidence": []}


# ── Main entry point ──────────────────────────────────────────────────────────


def generate(
    submission_id: int,
    repo_url: str,
    metrics: MetricsSchema,
    classification: dict,
    analyzed_at: str,
    *,
    analyzed_in: str = "",
) -> str:
    """
    Generate a PDF report from metrics and classification data.

    Workflow:
    1. Build a comprehensive JSON data file consumed by the Typst template
    2. Generate SVG assets: radar chart, architecture diagram, class diagram
    3. Compile the Typst source to PDF
    4. Clean up temporary files

    Args:
        submission_id: Unique submission identifier
        repo_url: Repository URL that was analysed
        metrics: Normalised MetricsSchema
        classification: Classification result (grade, percentage, breakdown, …)
        analyzed_at: ISO-format timestamp of analysis
        analyzed_in: Human-readable elapsed time string (e.g. ``"2m 34s"``)

    Returns:
        Path to the generated PDF file

    Raises:
        RuntimeError: If Typst compilation fails
    """
    os.makedirs(Config.REPORTS_DIR, exist_ok=True)

    # ── Floor rule explanations ────────────────────────────────────────────
    floor_rule_strings = []
    for rule in classification.get("floor_rules_triggered", []):
        metric_label = rule["metric"].replace("_", " ").title()
        floor_rule_strings.append(
            f"{metric_label} score is {rule['score']:.1f} — minimum required is "
            f"{rule['min_score']:.1f}. Your weighted score earned grade "
            f"{rule['earned_grade']} ({classification['percentage']}%), but this "
            f"floor rule caps the grade at {rule['cap_grade']}."
        )

    # ── Metrics dict ───────────────────────────────────────────────────────
    metrics_data = {
        key: {
            "score": getattr(metrics, key).score,
            "max": getattr(metrics, key).max,
            "notes": getattr(metrics, key).notes,
            "confidence": getattr(metrics, key).confidence,
        }
        for key in METRIC_KEYS
    }

    # ── Architecture and class diagram data (from analyzer) ────────────────
    arch_components = [c.model_dump() for c in metrics.architecture_components]
    arch_connections = [c.model_dump() for c in metrics.architecture_connections]
    class_diagram = [
        {
            "name": c.name,
            "type": c.type,
            "fields": c.fields,
            "methods": c.methods,
            "relationships": [r.model_dump() for r in c.relationships],
        }
        for c in metrics.class_diagram
    ]

    # ── Extract repo identity from URL ────────────────────────────────────
    _url_parts = urlparse(repo_url).path.strip("/").split("/")
    repo_username = _url_parts[0] if len(_url_parts) > 0 else ""
    project_name = _url_parts[1] if len(_url_parts) > 1 else repo_url

    # ── Generate SVG assets ────────────────────────────────────────────────
    formatted_date = datetime.fromisoformat(analyzed_at).strftime("%-d %b %Y")

    data_json_filename = f"{submission_id}_data.json"
    radar_svg_filename = f"{submission_id}_radar.svg"
    arch_svg_filename = f"{submission_id}_arch.svg"
    class_svg_filename = f"{submission_id}_class.svg"
    src_path = os.path.join(Config.REPORTS_DIR, f"{submission_id}_data.typ")
    pdf_path = os.path.join(Config.REPORTS_DIR, f"{submission_id}.pdf")

    data_json_path = os.path.join(Config.REPORTS_DIR, data_json_filename)
    radar_svg_path = os.path.join(Config.REPORTS_DIR, radar_svg_filename)
    arch_svg_path = os.path.join(Config.REPORTS_DIR, arch_svg_filename)
    class_svg_path = os.path.join(Config.REPORTS_DIR, class_svg_filename)

    # Radar chart
    scores = [metrics_data[k]["score"] for k in METRIC_KEYS]
    labels = ["SOLID", "Clean\nCode", "OOP", "Errors", "Testing", "Docs", "Complexity"]
    with open(radar_svg_path, "w", encoding="utf-8") as fh:
        fh.write(generate_radar_svg(scores, labels))

    # Architecture diagram — only write if there are components
    has_arch = bool(arch_components)
    if has_arch:
        with open(arch_svg_path, "w", encoding="utf-8") as fh:
            fh.write(generate_architecture_svg(arch_components, arch_connections))

    # Class diagram — only write if there are classes
    has_class = bool(class_diagram)
    if has_class:
        with open(class_svg_path, "w", encoding="utf-8") as fh:
            fh.write(generate_class_diagram_svg(class_diagram))

    # ── Comprehensive data payload ─────────────────────────────────────────
    data = {
        "repo_url": repo_url,
        "repo_username": repo_username,
        "project_name": project_name,
        "submission_id": str(submission_id),
        "analyzed_at": formatted_date,
        "analyzed_in": analyzed_in,
        "grade": classification["grade"],
        "percentage": classification["percentage"],
        "student_level": classification.get("student_level", "intermediate"),
        "feedback": metrics.feedback,
        "encouragement": metrics.encouragement,
        "floor_rules": floor_rule_strings,
        "metrics": metrics_data,
        "file_tree": metrics.file_tree,
        "per_file": [pf.model_dump() for pf in metrics.per_file],
        "dependencies": metrics.dependencies.model_dump(),
        "duplication_score": metrics.duplication_score,
        "commit_hygiene": metrics.commit_hygiene.model_dump(),
        "accessibility_score": metrics.accessibility_score,
        "performance_hints": metrics.performance_hints,
        "quick_wins": [qw.model_dump() for qw in metrics.quick_wins],
        "positives": metrics.positives,
        "recommendations": [_to_rec_dict(r) for r in metrics.recommendations],
        "project_overview": metrics.project_overview.model_dump(),
        # SVG asset filenames (empty string = section omitted in template)
        "arch_svg": arch_svg_filename if has_arch else "",
        "class_svg": class_svg_filename if has_class else "",
    }

    # ── Write JSON ─────────────────────────────────────────────────────────
    with open(data_json_path, "w", encoding="utf-8") as fh:
        json.dump(data, fh, ensure_ascii=False, indent=2)

    # ── Build Typst source ─────────────────────────────────────────────────
    template_path = os.path.join(
        os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
        "templates",
        "report.typ",
    )
    with open(template_path) as fh:
        template_body = fh.read()

    typst_source = textwrap.dedent(f"""\
        #let data = json("{data_json_filename}")
        #let radar_path = "{radar_svg_filename}"
    """) + "\n" + template_body

    with open(src_path, "w", encoding="utf-8") as fh:
        fh.write(typst_source)

    # ── Compile PDF ────────────────────────────────────────────────────────
    result = subprocess.run(
        [Config.TYPST_BIN, "compile", src_path, pdf_path],
        capture_output=True,
        text=True,
        timeout=60,
    )

    if result.returncode != 0:
        raise RuntimeError(f"Typst compilation failed: {result.stderr}")

    # ── Cleanup temp files ─────────────────────────────────────────────────
    tmp_files = [src_path, data_json_path, radar_svg_path]
    if has_arch:
        tmp_files.append(arch_svg_path)
    if has_class:
        tmp_files.append(class_svg_path)
    for tmp in tmp_files:
        try:
            os.remove(tmp)
        except OSError:
            pass

    # TODO: Upload the generated PDF to object storage (S3/MinIO) and return a
    #       signed URL instead of a local path. Reports currently live in /tmp
    #       and are lost on container restart or redeployment.
    return pdf_path
