"""Tests for classifier module."""

import pytest
from core import classifier
from models.metrics_schema import MetricsSchema, MetricDetail


def _metrics(**overrides) -> MetricsSchema:
    """Build a MetricsSchema with all scores set to *base* unless overridden."""
    base = overrides.pop("_base", 3.0)
    fields = {
        k: MetricDetail(score=base, notes="")
        for k in ["solid", "clean_code", "oop", "error_handling", "testing", "documentation", "complexity"]
    }
    for key, val in overrides.items():
        fields[key] = MetricDetail(score=val, notes="")
    return MetricsSchema(**fields)


class TestClassify:
    """Grade classification tests."""

    def test_a_grade(self):
        """High scores should produce an A grade."""
        result = classifier.classify(_metrics(_base=4.5))
        assert result["grade"] == "A"
        assert result["percentage"] >= 85

    def test_b_grade(self):
        """Scores around 3.5–4.0 should produce a B grade."""
        result = classifier.classify(_metrics(_base=3.7))
        assert result["grade"] == "B"

    def test_f_grade(self):
        """Very low scores should produce an F grade."""
        result = classifier.classify(_metrics(_base=0.5))
        assert result["grade"] == "F"

    def test_testing_floor_rule_caps_to_d(self):
        """testing < 1.0 caps the grade at D even if other metrics are perfect."""
        result = classifier.classify(_metrics(_base=5.0, testing=0.5))
        assert result["grade"] == "D"
        assert any(r["metric"] == "testing" for r in result["floor_rules_triggered"])

    def test_error_handling_floor_rule_caps_to_d(self):
        """error_handling < 1.0 caps the grade at D even if other metrics are perfect."""
        result = classifier.classify(_metrics(_base=5.0, error_handling=0.5))
        assert result["grade"] == "D"
        assert any(r["metric"] == "error_handling" for r in result["floor_rules_triggered"])

    def test_floor_rule_not_applied_when_already_below_cap(self):
        """Floor rule must NOT upgrade a grade worse than the cap (D→D is fine, F stays F)."""
        # All scores low → natural grade is F; testing also low but cap is D,
        # which is better than F. The grade must stay at F.
        result = classifier.classify(_metrics(_base=0.5, testing=0.0))
        assert result["grade"] == "F"

    def test_breakdown_included(self):
        """Result should include a per-metric breakdown."""
        result = classifier.classify(_metrics(_base=3.0))
        assert "breakdown" in result
        assert "solid" in result["breakdown"]
        assert "weighted_contribution" in result["breakdown"]["solid"]

    def test_floor_rules_triggered_empty_when_no_violation(self):
        """floor_rules_triggered should be empty when no floor rule fires."""
        result = classifier.classify(_metrics(_base=3.0))
        assert result["floor_rules_triggered"] == []

    def test_percentage_range(self):
        """Percentage must always be within 0–100."""
        for base in [0.0, 1.0, 2.5, 4.0, 5.0]:
            result = classifier.classify(_metrics(_base=base))
            assert 0.0 <= result["percentage"] <= 100.0


class TestInferStudentLevel:
    """Student level inference tests."""

    def test_advanced_with_high_scores(self):
        """Grade A/B with avg >= 3.5 and pct >= 72 → advanced."""
        result = classifier.classify(_metrics(_base=4.5))
        assert result["student_level"] == "advanced"

    def test_beginner_with_low_grade(self):
        """Grade D/F → beginner."""
        result = classifier.classify(_metrics(_base=1.0))
        assert result["student_level"] == "beginner"

    def test_beginner_due_to_no_tests(self):
        """testing < 1.0 → beginner regardless of other scores."""
        result = classifier.classify(_metrics(_base=3.5, testing=0.8))
        assert result["student_level"] == "beginner"

    def test_intermediate_medium_scores(self):
        """Medium scores should produce intermediate level."""
        result = classifier.classify(_metrics(_base=3.0))
        assert result["student_level"] == "intermediate"

    def test_boundary_smoothing_grade_b_barely(self):
        """Grade B at exactly 70% with avg < 3.5 should be intermediate, not advanced."""
        # Tune to land close to 70% threshold
        result = classifier.classify(_metrics(_base=2.9))
        assert result["student_level"] in ("intermediate", "beginner")

    def test_student_level_key_always_present(self):
        """classify() must always include student_level."""
        result = classifier.classify(_metrics(_base=3.0))
        assert "student_level" in result
        assert result["student_level"] in ("advanced", "intermediate", "beginner")
