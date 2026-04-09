#!/usr/bin/env bash
set -euo pipefail

# Generate an incremental requirement doc for the current changes.
# Usage:
#   bash scripts/generate-requirement-doc.sh "summary text"

if [[ $# -lt 1 ]]; then
  echo "Usage: $0 \"<requirement-summary>\""
  exit 1
fi

SUMMARY="$1"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_DIR"
GIT_ROOT="$(git rev-parse --show-toplevel)"
PROJECT_REL="${PROJECT_DIR#${GIT_ROOT}/}"

TS="$(date +%Y%m%d-%H%M%S)"
BRANCH="$(git rev-parse --abbrev-ref HEAD | tr '/ ' '--' | tr -cd '[:alnum:]-_')"
BASE_COMMIT="$(git rev-parse --short HEAD 2>/dev/null || echo "no-commit")"

REQ_DIR="docs/requirements"
mkdir -p "$REQ_DIR"

OUT_FILE="${REQ_DIR}/${TS}-${BRANCH}-${BASE_COMMIT}.md"

if git diff --cached --quiet; then
  RAW_CHANGED="$(git diff --name-status HEAD -- "$PROJECT_DIR")"
else
  RAW_CHANGED="$(git diff --cached --name-status)"
fi

CHANGED=""
while IFS= read -r line; do
  [[ -z "$line" ]] && continue
  path_part="${line#*$'\t'}"
  if [[ "$path_part" == "$PROJECT_REL/"* ]]; then
    CHANGED+="${line/${PROJECT_REL}\//}"$'\n'
  fi
done <<< "$RAW_CHANGED"

{
  echo "# 增量需求文档"
  echo
  echo "- 生成时间: ${TS}"
  echo "- 分支: ${BRANCH}"
  echo "- 基线提交: ${BASE_COMMIT}"
  echo
  echo "## 需求摘要"
  echo "${SUMMARY}"
  echo
  echo "## 变更范围"
  if [[ -n "${CHANGED}" ]]; then
    while IFS= read -r line; do
      [[ -z "$line" ]] && continue
      echo "- ${line}"
    done <<< "$CHANGED"
  else
    echo "- 无文件差异（仅记录流程性提交）"
  fi
  echo
  echo "## 文档同步清单"
  echo "- [ ] 已更新 docs/system-design.md（如涉及架构/流程变化）"
  echo "- [ ] 已更新相关规范文档（如格式、接口、使用方式变化）"
  echo "- [ ] 本增量文档与提交内容一致"
  echo
  echo "## Commit 摘要（用于 commit message）"
  echo "Req: ${SUMMARY}"
} > "$OUT_FILE"

echo "Generated: $OUT_FILE"
