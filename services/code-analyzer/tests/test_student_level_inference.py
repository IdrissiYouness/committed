"""Tests for student level inference logic"""

import pytest
from core.classifier import infer_student_level, classify
from models.metrics_schema import MetricsSchema, MetricDetail


class TestStudentLevelInference:
    """Tests for student level inference from analysis results"""

    def test_advanced_level_inference(self):
        """Test that high grades infer advanced level"""
        metrics = MetricsSchema(
            solid=MetricDetail(score=4.5, notes="Excellent SOLID principles"),
            clean_code=MetricDetail(score=4.0, notes="Very clean code"),
            oop=MetricDetail(score=4.5, notes="Great OOP design"),
            error_handling=MetricDetail(
                score=4.0, notes="Comprehensive error handling"
            ),
            testing=MetricDetail(score=4.0, notes="Well tested"),
            documentation=MetricDetail(score=4.0, notes="Clear documentation"),
            complexity=MetricDetail(score=4.5, notes="Simple and maintainable"),
        )

        classification = classify(metrics)
        assert classification["student_level"] == "advanced"
        assert classification["grade"] in ["A", "B"]

    def test_beginner_level_inference_low_grade(self):
        """Test that low grades infer beginner level"""
        metrics = MetricsSchema(
            solid=MetricDetail(score=1.5, notes="Needs improvement"),
            clean_code=MetricDetail(score=1.0, notes="Poor naming conventions"),
            oop=MetricDetail(score=2.0, notes="Basic OOP"),
            error_handling=MetricDetail(score=1.0, notes="Minimal error handling"),
            testing=MetricDetail(score=0.5, notes="No tests"),
            documentation=MetricDetail(score=1.0, notes="Sparse documentation"),
            complexity=MetricDetail(score=2.0, notes="Too complex"),
        )

        classification = classify(metrics)
        assert classification["student_level"] == "beginner"
        assert classification["grade"] in ["D", "F"]

    def test_beginner_level_inference_no_testing(self):
        """Test that testing score < 1.0 enforces beginner level"""
        metrics = MetricsSchema(
            solid=MetricDetail(score=3.5, notes="Good"),
            clean_code=MetricDetail(score=3.5, notes="Good"),
            oop=MetricDetail(score=3.5, notes="Good"),
            error_handling=MetricDetail(score=3.5, notes="Good"),
            testing=MetricDetail(
                score=0.8, notes="Minimal testing"
            ),  # Critical weakness
            documentation=MetricDetail(score=3.5, notes="Good"),
            complexity=MetricDetail(score=3.5, notes="Good"),
        )

        classification = classify(metrics)
        # Should be beginner due to testing score < 1.0
        assert classification["student_level"] == "beginner"

    def test_intermediate_level_inference(self):
        """Test that medium grades infer intermediate level"""
        metrics = MetricsSchema(
            solid=MetricDetail(score=3.0, notes="Decent SOLID principles"),
            clean_code=MetricDetail(score=3.0, notes="OK code quality"),
            oop=MetricDetail(score=3.0, notes="Standard OOP"),
            error_handling=MetricDetail(score=2.5, notes="Basic error handling"),
            testing=MetricDetail(score=2.5, notes="Some tests"),
            documentation=MetricDetail(score=2.5, notes="Adequate documentation"),
            complexity=MetricDetail(score=3.0, notes="Moderate complexity"),
        )

        classification = classify(metrics)
        assert classification["student_level"] == "intermediate"
        assert classification["grade"] in ["B", "C"]

    def test_intermediate_boundary_high(self):
        """Test intermediate/advanced boundary - good but not excellent"""
        metrics = MetricsSchema(
            solid=MetricDetail(score=3.8, notes="Very good"),
            clean_code=MetricDetail(score=3.5, notes="Good"),
            oop=MetricDetail(score=3.3, notes="Good"),
            error_handling=MetricDetail(score=3.2, notes="Good"),
            testing=MetricDetail(score=3.0, notes="Good tests"),
            documentation=MetricDetail(score=3.0, notes="Good docs"),
            complexity=MetricDetail(score=3.5, notes="Simple"),
        )

        classification = classify(metrics)
        # Average is ~3.33, below 3.5 threshold for advanced
        assert classification["student_level"] == "intermediate"

    def test_intermediate_boundary_low(self):
        """Test intermediate/beginner boundary - weak performance gets beginner"""
        metrics = MetricsSchema(
            solid=MetricDetail(score=2.2, notes="Needs work"),
            clean_code=MetricDetail(score=2.0, notes="Could improve"),
            oop=MetricDetail(score=2.3, notes="Basic"),
            error_handling=MetricDetail(score=2.0, notes="Minimal"),
            testing=MetricDetail(score=2.1, notes="Limited tests"),  # Above 1.0
            documentation=MetricDetail(score=2.0, notes="Basic docs"),
            complexity=MetricDetail(score=2.2, notes="Moderate"),
        )

        classification = classify(metrics)
        # This results in grade D (42.2%), which correctly classifies as beginner
        assert classification["student_level"] == "beginner"
        assert classification["grade"] == "D"

    def test_classification_includes_student_level(self):
        """Test that classify() includes student_level in result"""
        metrics = MetricsSchema(
            solid=MetricDetail(score=3.0, notes="OK"),
            clean_code=MetricDetail(score=3.0, notes="OK"),
            oop=MetricDetail(score=3.0, notes="OK"),
            error_handling=MetricDetail(score=3.0, notes="OK"),
            testing=MetricDetail(score=3.0, notes="OK"),
            documentation=MetricDetail(score=3.0, notes="OK"),
            complexity=MetricDetail(score=3.0, notes="OK"),
        )

        result = classify(metrics)
        assert "student_level" in result
        assert result["student_level"] in ["advanced", "intermediate", "beginner"]
