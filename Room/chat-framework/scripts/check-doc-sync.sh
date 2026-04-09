#!/usr/bin/env bash
set -euo pipefail

# Enforce doc update rules before commit.
# Rules:
# 1) If non-doc files are staged, docs/system-design.md must be staged.
# 2) If non-doc files are staged, at least one docs/requirements/*.md must be staged.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_DIR"

GIT_ROOT="$(git rev-parse --show-toplevel)"
PROJECT_REL="${PROJECT_DIR#${GIT_ROOT}/}"

ALL_STAGED="$(git diff --cached --name-only)"
STAGED=""
while IFS= read -r file; do
  [[ -z "$file" ]] && continue
  if [[ "$file" == "$PROJECT_REL/"* ]]; then
    STAGED+="${file#${PROJECT_REL}/}"$'\n'
  fi
done <<< "$ALL_STAGED"

if [[ -z "$STAGED" ]]; then
  echo "[doc-check] No staged files in current project. Skip."
  exit 0
fi

HAS_NON_DOC=0
HAS_SYS_DOC=0
HAS_REQ_DOC=0

while IFS= read -r file; do
  [[ -z "$file" ]] && continue

  if [[ "$file" == "docs/system-design.md" ]]; then
    HAS_SYS_DOC=1
  fi
  if [[ "$file" == docs/requirements/*.md ]]; then
    HAS_REQ_DOC=1
  fi

  if [[ "$file" != docs/* && "$file" != dist/* ]]; then
    HAS_NON_DOC=1
  fi
done <<< "$STAGED"

if [[ "$HAS_NON_DOC" -eq 0 ]]; then
  echo "[doc-check] Doc-only/dist-only commit. Pass."
  exit 0
fi

FAILED=0
if [[ "$HAS_SYS_DOC" -ne 1 ]]; then
  echo "[doc-check] Missing staged file: docs/system-design.md"
  FAILED=1
fi
if [[ "$HAS_REQ_DOC" -ne 1 ]]; then
  echo "[doc-check] Missing staged incremental requirement doc: docs/requirements/*.md"
  FAILED=1
fi

if [[ "$FAILED" -ne 0 ]]; then
  echo
  echo "[doc-check] Fix guide:"
  echo "1) Update docs/system-design.md as needed"
  echo "2) Generate requirement doc:"
  echo "   bash scripts/generate-requirement-doc.sh \"<summary>\""
  echo "3) git add docs/system-design.md docs/requirements/*.md"
  exit 1
fi

echo "[doc-check] Pass."
