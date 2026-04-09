# Skill 使用说明：mr-workflow

Skill 路径：
- `skills/mr-workflow/SKILL.md`

## 1. 目标

规范 MR 提交流程，保证：
- 代码变更有对应文档更新
- 每个 commit 有增量需求文档
- commit message 带需求摘要

## 2. 快速执行步骤

1. 安装 hooks（首次）：
```bash
bash scripts/install-hooks.sh
```

2. 生成本次增量需求文档：
```bash
bash scripts/generate-requirement-doc.sh "本次需求摘要"
```

3. 更新 `docs/system-design.md` 与相关文档

4. 提交前检查：
```bash
bash scripts/check-doc-sync.sh
```

5. 提交时 commit message 需包含：
```text
Req: 本次需求摘要
```

## 3. 常见失败原因

- 未 stage `docs/system-design.md`
- 未 stage `docs/requirements/*.md`
- commit message 没有 `Req: ...` 行

## 4. 与 Agent 的协作约束

Agent 在执行提交时必须先做文档检查；若失败，应先补文档而不是强行提交。
