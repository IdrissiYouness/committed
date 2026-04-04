"""Tests for classifier module"""

import pytest
from core import classifier
from models.metrics_schema import MetricsSchema, MetricDetail


class TestClassify:
    """Tests for grade classification"""

    def test_a_grade(self):
        """Should assign A grade for high scores"""
        metrics = MetricsSchema(
            solid=MetricDetail(score=4.5, notes="Excellent"),
            clean_code=MetricDetail(score=4.5, notes="Excellent"),
            oop=MetricDetail(score=4.5, notes="Excellent"),
            error_handling=MetricDetail(score=4.0, notes="Good"),
            testing=MetricDetail(score=4.0, notes="Good"),
            documentation=MetricDetail(score=4.0, notes="Good"),
            complexity=MetricDetail(score=4.5, notes="Excellent"),
        )

        result = classifier.classify(metrics)

        assert result["grade"] == "A"
        assert result["percentage"] >= 85

    def test_floor_rule(self):
        """Should apply floor rules for insufficient testing"""
        metrics = MetricsSchema(
            solid=MetricDetail(score=5.0, notes="Perfect"),
            clean_code=MetricDetail(score=5.0, notes="Perfect"),
            oop=MetricDetail(score=5.0, notes="Perfect"),
            error_handling=MetricDetail(score=5.0, notes="Perfect"),
            testing=MetricDetail(score=0.5, notes="Minimal testing"),  # Below threshold
            documentation=MetricDetail(score=5.0, notes="Perfect"),
            complexity=MetricDetail(score=5.0, notes="Perfect"),
        )

        result = classifier.classify(metrics)

        # Should be capped at D despite high other scores
        assert result["grade"] == "D"

    def test_breakdown_included(self):
        """Should include detailed breakdown in result"""
        metrics = MetricsSchema(
            solid=MetricDetail(score=3.0, notes="OK"),
            clean_code=MetricDetail(score=3.0, notes="OK"),
            oop=MetricDetail(score=3.0, notes="OK"),
            error_handling=MetricDetail(score=3.0, notes="OK"),
            testing=MetricDetail(score=3.0, notes="OK"),
            documentation=MetricDetail(score=3.0, notes="OK"),
            complexity=MetricDetail(score=3.0, notes="OK"),
        )

        result = classifier.classify(metrics)

        assert "breakdown" in result
        assert "solid" in result["breakdown"]
        assert "weighted_contribution" in result["breakdown"]["solid"]
