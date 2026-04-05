#!/usr/bin/env python3
"""
Run the full analysis pipeline against a real GitHub repo locally.
Bypasses the Flask server and calls the pipeline directly.

Usage:
    cd services/code-analyzer
    python scripts/run_analysis.py
"""

import sys
from pathlib import Path

# Add the service root to Python path
sys.path.insert(0, str(Path(__file__).parent.parent))

from core.pipeline import run_analysis
import json


def test_repo_analysis():
    """Test analysis on a real GitHub repo"""

    # Your test repo
    repo_url = "https://github.com/IdrissiYouness/JChat"
    submission_id = 999  # Test submission ID

    print(f"🔍 Analyzing: {repo_url}")
    print(f"📋 Submission ID: {submission_id}")
    print("-" * 60)

    try:
        # Run the full pipeline
        result = run_analysis(submission_id, repo_url)

        # Pretty print the result
        print("\n✅ ANALYSIS COMPLETE!\n")
        print("=" * 60)

        if result["status"] == "completed":
            print(f"Grade: {result['grade']}")
            print(f"Percentage: {result['percentage']}%")
            print("\n📊 Breakdown by Metric:")
            print("-" * 60)

            for metric, data in result["breakdown"].items():
                print(
                    f"{metric:20} | Score: {data['score']:.1f}/{data['max']} | "
                    f"Contribution: {data['weighted_contribution']:.2f}%"
                )

            print("\n📄 Full result:")
            print(json.dumps(result, indent=2))

        else:
            print(f"❌ Analysis failed: {result.get('error', 'Unknown error')}")

    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        import traceback

        traceback.print_exc()


if __name__ == "__main__":
    test_repo_analysis()
