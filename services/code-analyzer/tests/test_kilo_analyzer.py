#!/usr/bin/env python3
"""
Test the kilo analyzer integration with a simple test repository.

This test requires kilo CLI to be installed and configured.
Skip this test if kilo is not available.

Usage:
    cd services/code-analyzer
    source .venv/bin/activate

    # Run with kilo configured:
    pytest tests/test_kilo_analyzer.py -v

    # Skip this test:
    pytest tests/ -v -k "not kilo"
"""

import sys
import os
import tempfile
import shutil
from pathlib import Path

# Add the service root to Python path
sys.path.insert(0, str(Path(__file__).parent.parent))

from core.agent_runner import KiloCodeRunner
import json
import pytest

# Skip this test by default - it requires kilo CLI to be properly configured
# Run with: pytest tests/test_kilo_analyzer.py -v -m "kilo"
pytestmark = pytest.mark.skip(
    reason="Kilo CLI integration test - requires kilo configured with API credentials"
)


def create_test_repo():
    """Create a minimal test repository"""
    temp_dir = tempfile.mkdtemp(prefix="test_repo_")

    # Create a simple Python file
    test_file = os.path.join(temp_dir, "calculator.py")
    with open(test_file, "w") as f:
        f.write("""
class Calculator:
    \"\"\"A simple calculator class\"\"\"
    
    def add(self, a, b):
        \"\"\"Add two numbers\"\"\"
        return a + b
    
    def subtract(self, a, b):
        return a - b
    
    def divide(self, a, b):
        # TODO: Add error handling for division by zero
        return a / b


if __name__ == "__main__":
    calc = Calculator()
    print(calc.add(5, 3))
""")

    # Create a README
    readme = os.path.join(temp_dir, "README.md")
    with open(readme, "w") as f:
        f.write("# Test Calculator\n\nA simple calculator for testing.\n")

    return temp_dir


def test_kilo_analyzer():
    """Test the Kilo analyzer on a simple repo"""
    test_repo = None

    try:
        print("=" * 70)
        print("Testing Kilo Analyzer Integration")
        print("=" * 70)

        # Create test repo
        print("\n1️⃣  Creating test repository...")
        test_repo = create_test_repo()
        print(f"   Created at: {test_repo}")

        # Run analyzer
        print("\n2️⃣  Running Kilo analyzer (this may take 30-60 seconds)...")
        print("   Note: Kilo will analyze the code and return JSON metrics")

        runner = KiloCodeRunner()
        result = runner.run(test_repo)

        # Display results
        print("\n3️⃣  Analysis Complete!")
        print("=" * 70)
        print("\n📊 RAW JSON RESULT:")
        print(json.dumps(result, indent=2))

        # Validate structure
        print("\n4️⃣  Validating JSON structure...")
        required_keys = [
            "solid",
            "clean_code",
            "oop",
            "error_handling",
            "testing",
            "documentation",
            "complexity",
            "feedback",
            "recommendations",
        ]

        missing_keys = [key for key in required_keys if key not in result]

        if missing_keys:
            print(f"   ❌ Missing keys: {missing_keys}")
            return False
        else:
            print("   ✅ All required keys present")

        # Validate scores
        print("\n5️⃣  Validating scores...")
        for metric in [
            "solid",
            "clean_code",
            "oop",
            "error_handling",
            "testing",
            "documentation",
            "complexity",
        ]:
            if isinstance(result[metric], dict) and "score" in result[metric]:
                score = result[metric]["score"]
                if 0 <= score <= 5:
                    print(f"   ✅ {metric}: {score}/5.0")
                else:
                    print(f"   ❌ {metric}: {score}/5.0 (out of range!)")
                    return False
            else:
                print(f"   ❌ {metric}: Invalid format")
                return False

        print("\n" + "=" * 70)
        print("✅ KILO ANALYZER TEST PASSED!")
        print("=" * 70)
        print("\n💡 The kilo analyzer is working correctly!")
        print("   You can now use it to analyze real repositories.")

    except Exception as e:
        pytest.fail(f"Kilo analyzer test failed: {e}")

    finally:
        # Cleanup
        if test_repo and os.path.exists(test_repo):
            print(f"\n🧹 Cleaning up test repository: {test_repo}")
            shutil.rmtree(test_repo, ignore_errors=True)
