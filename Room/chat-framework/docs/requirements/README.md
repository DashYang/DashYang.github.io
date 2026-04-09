# 增量需求文档目录

本目录用于记录“每个 commit 的增量需求说明”。

规则：
- 每次涉及代码或流程改动的提交，都应新增一个 `docs/requirements/*.md`
- 文档中必须包含：
  - 需求摘要
  - 变更范围
  - Commit 摘要（`Req: ...`）
- commit message 必须包含 `Req: ...` 行

建议流程：
1. `bash scripts/generate-requirement-doc.sh "<摘要>"`
2. 根据实际变更补充该文档内容
3. `git add docs/requirements/*.md docs/system-design.md`
4. 提交时在 commit message 中带上 `Req: ...`
