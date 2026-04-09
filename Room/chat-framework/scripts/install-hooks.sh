#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_DIR"

chmod +x scripts/check-doc-sync.sh scripts/generate-requirement-doc.sh
chmod +x .githooks/pre-commit .githooks/commit-msg

git config core.hooksPath .githooks

echo "Installed git hooks at .githooks"
echo "Current hooksPath: $(git config core.hooksPath)"
