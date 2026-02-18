#!/bin/bash

# Configuration
TEST_DIR="automation"
PROJECT_NAME="pharmaceutical-stockist"

# Help message
show_help() {
    echo "Usage: ./scripts/run_ui_tests.sh [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  (no args)  Run all tests in headless mode"
    echo "  chromium   Run chromium tests only"
    echo "  ui         Open Playwright UI"
    echo "  report     Show the latest HTML report"
    echo "  master     Run ONLY the End-to-End Master Flow (Combined Video)"
}

# Ensure we are in the root directory
if [ ! -d "$TEST_DIR" ]; then
    cd ..
fi

case "$1" in
    "ui")
        cd "$TEST_DIR" && npx playwright test --ui
        ;;
    "chromium")
        cd "$TEST_DIR" && npx playwright test --project=chromium
        ;;
    "report")
        cd "$TEST_DIR" && npx playwright show-report
        ;;
    "master")
        cd "$TEST_DIR" && npx playwright test tests/master-flow.spec.ts --project=chromium
        ;;
    "help"|"--help"|"-h")
        show_help
        ;;
    *)
        cd "$TEST_DIR" && npx playwright test
        ;;
esac
