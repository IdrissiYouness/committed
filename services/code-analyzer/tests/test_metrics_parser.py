"""Tests for metrics_parser module."""

import pytest
from core import metrics_parser


def _base_raw(**overrides) -> dict:
    """Minimal valid raw dict with all 7 core metrics populated."""
    raw = {
        "solid": {"score": 3.0, "notes": "OK"},
        "clean_code": {"score": 3.0, "notes": "OK"},
        "oop": {"score": 3.0, "notes": "OK"},
        "error_handling": {"score": 3.0, "notes": "OK"},
        "testing": {"score": 3.0, "notes": "OK"},
        "documentation": {"score": 3.0, "notes": "OK"},
        "complexity": {"score": 3.0, "notes": "OK"},
    }
    raw.update(overrides)
    return raw


class TestParse:
    """Core metric parsing tests."""

    def test_full_valid_input(self):
        raw = _base_raw(
            feedback="Good overall",
            recommendations=["Add more tests", "Improve docs"],
        )
        result = metrics_parser.parse(raw)
        assert result.solid.score == 3.0
        assert len(result.recommendations) == 2

    def test_missing_keys_use_defaults(self):
        result = metrics_parser.parse({"solid": {"score": 3.0, "notes": "OK"}})
        assert result.testing.score == 0.0
        assert result.testing.notes == "Could not evaluate."

    def test_bare_numeric_scores(self):
        raw = _base_raw(solid=4.0, clean_code=3)
        result = metrics_parser.parse(raw)
        assert result.solid.score == 4.0
        assert result.clean_code.score == 3.0

    def test_confidence_passthrough(self):
        raw = _base_raw(solid={"score": 4.0, "notes": "x", "confidence": 0.9})
        result = metrics_parser.parse(raw)
        assert result.solid.confidence == 0.9

    def test_missing_confidence_defaults(self):
        raw = _base_raw(solid={"score": 4.0, "notes": "x"})
        result = metrics_parser.parse(raw)
        assert result.solid.confidence == 0.8


class TestParseNewFields:
    """Tests for expanded schema fields added in v2."""

    def test_encouragement_passthrough(self):
        raw = _base_raw(encouragement="You're doing great!")
        result = metrics_parser.parse(raw)
        assert result.encouragement == "You're doing great!"

    def test_encouragement_defaults_to_empty(self):
        result = metrics_parser.parse(_base_raw())
        assert result.encouragement == ""

    def test_file_tree_passthrough(self):
        tree = "repo/\n├── src/\n│   └── Main.java\n└── README.md"
        raw = _base_raw(file_tree=tree)
        result = metrics_parser.parse(raw)
        assert result.file_tree == tree

    def test_architecture_components_passthrough(self):
        raw = _base_raw(
            architecture_components=[
                {"id": "Server", "label": "Chat Server", "type": "server"},
                {"id": "Client", "label": "Chat Client", "type": "client"},
            ]
        )
        result = metrics_parser.parse(raw)
        assert len(result.architecture_components) == 2
        assert result.architecture_components[0].id == "Server"

    def test_architecture_connections_passthrough(self):
        raw = _base_raw(
            architecture_components=[
                {"id": "A", "label": "A", "type": "server"},
                {"id": "B", "label": "B", "type": "client"},
            ],
            architecture_connections=[
                {"source": "B", "target": "A", "label": "calls"}
            ],
        )
        result = metrics_parser.parse(raw)
        assert len(result.architecture_connections) == 1
        assert result.architecture_connections[0].source == "B"

    def test_architecture_connections_from_to_alias(self):
        """Schema validator should accept 'from'/'to' as aliases for 'source'/'target'."""
        raw = _base_raw(
            architecture_components=[
                {"id": "X", "label": "X", "type": "server"},
                {"id": "Y", "label": "Y", "type": "client"},
            ],
            architecture_connections=[{"from": "Y", "to": "X"}],
        )
        result = metrics_parser.parse(raw)
        assert result.architecture_connections[0].source == "Y"
        assert result.architecture_connections[0].target == "X"

    def test_class_diagram_passthrough(self):
        raw = _base_raw(
            class_diagram=[
                {
                    "name": "MyClass",
                    "type": "class",
                    "fields": ["String name"],
                    "methods": ["getName()"],
                    "relationships": [{"to": "OtherClass", "type": "uses"}],
                }
            ]
        )
        result = metrics_parser.parse(raw)
        assert len(result.class_diagram) == 1
        assert result.class_diagram[0].name == "MyClass"
        assert result.class_diagram[0].relationships[0].to == "OtherClass"

    def test_positives_passthrough(self):
        raw = _base_raw(positives=["Clean naming", "Good structure"])
        result = metrics_parser.parse(raw)
        assert result.positives == ["Clean naming", "Good structure"]

    def test_commit_hygiene_injected(self):
        raw = _base_raw(
            commit_hygiene={
                "score": 3.5,
                "total_commits": 20,
                "single_purpose_pct": 80.0,
                "message_quality_score": 4.0,
                "notes": "Good commit messages.",
            }
        )
        result = metrics_parser.parse(raw)
        assert result.commit_hygiene.total_commits == 20
        assert result.commit_hygiene.score == 3.5


class TestParseHelpers:
    """Unit tests for the private helper functions."""

    def test_per_file_empty_when_missing(self):
        result = metrics_parser.parse(_base_raw())
        assert result.per_file == []

    def test_per_file_parsed(self):
        raw = _base_raw(
            per_file=[
                {
                    "filename": "Main.java",
                    "lines": 120,
                    "cyclomatic_complexity": 3.5,
                    "duplication_pct": 10.0,
                    "issues": [
                        {"line": 42, "severity": "high", "message": "Magic number"}
                    ],
                }
            ]
        )
        result = metrics_parser.parse(raw)
        assert len(result.per_file) == 1
        assert result.per_file[0].filename == "Main.java"
        assert result.per_file[0].issues[0].severity == "high"

    def test_dependencies_skips_blank_names(self):
        raw = _base_raw(
            dependencies={
                "details": [
                    {"name": "flask", "current": "3.0.0", "status": "ok"},
                    {"name": "", "current": "?", "status": "ok"},
                ]
            }
        )
        result = metrics_parser.parse(raw)
        assert result.dependencies.total == 1
        assert result.dependencies.details[0].name == "flask"

    def test_dependencies_counts_recalculated(self):
        raw = _base_raw(
            dependencies={
                "total": 99,  # Should be ignored; recomputed from details
                "details": [
                    {"name": "flask", "current": "2.0", "status": "outdated"},
                    {"name": "requests", "current": "2.28", "status": "vulnerable"},
                    {"name": "unused-lib", "current": "1.0", "status": "unused"},
                ],
            }
        )
        result = metrics_parser.parse(raw)
        assert result.dependencies.total == 3
        assert result.dependencies.outdated == 1
        assert result.dependencies.vulnerable == 1
        assert result.dependencies.unused == 1
