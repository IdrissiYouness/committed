#!/usr/bin/env python3
"""
Quick sanity check — creates a minimal repo and runs the kilo analyzer on it.
Requires kilo CLI to be configured.

Usage:
    cd services/code-analyzer
    python scripts/quick_check.py
"""

import tempfile
import os
import sys
import json

# Add service root to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from core.agent_runner import KiloCodeRunner


def main():
    # Create a temporary directory with a simple Python file
    with tempfile.TemporaryDirectory() as tmpdir:
        # Create a simple Python file
        test_file = os.path.join(tmpdir, "calculator.py")
        with open(test_file, "w") as f:
            f.write("""
class Calculator:
    def add(self, a, b):
        return a + b
    
    def divide(self, a, b):
        return a / b  # No error handling!
""")

        print(f"Created test repository at: {tmpdir}")
        print(f"\nRunning kilo analyzer...")
        print("=" * 60)

        try:
            runner = KiloCodeRunner()
            result = runner.run(tmpdir)

            print("\n✅ Analysis complete!")
            print("\n📊 Results:")
            print(json.dumps(result, indent=2))

            print("\n" + "=" * 60)
            print("SUCCESS! Kilo analyzer is working.")
            return 0

        except Exception as e:
            print(f"\n❌ Error: {e}")
            import traceback

            traceback.print_exc()
            return 1


if __name__ == "__main__":
    sys.exit(main())
