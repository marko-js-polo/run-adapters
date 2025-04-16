#!/bin/bash

# Exit immediately if a command exits with a non-zero status.
set -e
# Treat unset variables as an error when substituting.
set -u
# Pipelines return the exit status of the last command to exit with a non-zero status.
set -o pipefail

# --- Configuration ---
NUM_RUNS=6
BUILD_DIR_BASE="dist"
# -------------------

# --- Argument Parsing ---
if [ -z "${1:-}" ]; then
  echo "🔴 Error: Build task name must be provided as the first argument."
  echo "   Example: $0 build:static"
  exit 1
fi
BUILD_TASK="$1"
# Use the build task name to determine the output directory
# Assumes tasks like 'build:static' output to 'dist-static', 'build:single-file' to 'dist-single-file'
BUILD_DIR="${BUILD_DIR_BASE}-${BUILD_TASK#build:}"
ASSETS_DIR="$BUILD_DIR/public/assets"
BUILD_COMMAND="bun run $BUILD_TASK"
# ---------------------

echo "Running build consistency check for task '$BUILD_TASK' ($NUM_RUNS runs)..."
echo "Output directory: $BUILD_DIR"
echo "Assets directory: $ASSETS_DIR"

# Initial run to establish baseline
echo "--- Run 1 --- (Establishing baseline)"
$BUILD_COMMAND
if [ ! -d "$ASSETS_DIR" ]; then
  echo "🔴 Error: Assets directory '$ASSETS_DIR' not found after initial build."
  tree -L 4 "$BUILD_DIR" || echo "(tree command failed or directory empty)"
  exit 1
fi
LAST_ASSETS_LS=$(command ls "$ASSETS_DIR" | sort)
echo "Baseline assets listing:"
echo "$LAST_ASSETS_LS"
tree -L 4 "$BUILD_DIR"

# Loop for subsequent runs
for i in $(seq 2 $NUM_RUNS); do
  echo "\n--- Run $i ---"
  # Run the build
  $BUILD_COMMAND
  if [ ! -d "$ASSETS_DIR" ]; then
    echo "🔴 Error: Assets directory '$ASSETS_DIR' not found after build run $i."
    tree -L 4 "$BUILD_DIR" || echo "(tree command failed or directory empty)"
    exit 1
  fi
  CURRENT_ASSETS_LS=$(command ls "$ASSETS_DIR" | sort)
  echo "Current assets listing:"
  echo "$CURRENT_ASSETS_LS"
  tree -L 4 "$BUILD_DIR" || echo "[Warning] tree command failed for $BUILD_DIR"

  # Compare asset listing (using diff for better output)
  # Run diff and capture output AND exit code separately
  DIFF_OUTPUT=""
  DIFF_EXIT_CODE=0
  DIFF_OUTPUT=$(diff <(echo "$LAST_ASSETS_LS") <(echo "$CURRENT_ASSETS_LS") || DIFF_EXIT_CODE=$?)

  # Check diff exit code explicitly
  if [ $DIFF_EXIT_CODE -eq 1 ]; then # Exit code 1 means differences found
    echo "\n🔴 Inconsistency detected in '$ASSETS_DIR' between run $((i-1)) and run $i!"
    echo "Difference:"
    echo "$DIFF_OUTPUT"
    exit 1 # Exit with error code to signal failure
  elif [ $DIFF_EXIT_CODE -gt 1 ]; then # Exit code > 1 means an error occurred in diff
    echo "\n🔴 Error running diff command (exit code $DIFF_EXIT_CODE) when comparing run $((i-1)) and run $i!"
    # DIFF_OUTPUT might contain error messages from diff
    echo "Diff command output (if any):"
    echo "$DIFF_OUTPUT"
    exit 1 # Exit with error code to signal failure
  fi
  # If exit code is 0, files are the same

  # Update baseline for next comparison
  LAST_ASSETS_LS="$CURRENT_ASSETS_LS"
  echo "\n✅ Assets consistent with previous run."
done

echo "\n🟢 Build output for task '$BUILD_TASK' remained consistent across $NUM_RUNS runs."
exit 0 # Exit successfully 