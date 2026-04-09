# MR 提交流程系统设计文档（v1.0）

## 1. 设计目标

定义一套可执行、可检查、可追溯的 MR 提交流程，确保：
- 代码改动与 `docs/` 文档同步
- 每次 commit 都产生增量需求描述文档
- commit message 含需求摘要
- agent 提交时能自动拦截未满足规范的提交

## 2. 功能描述

### 2.1 文档同步检查

当本次提交包含非文档代码改动时，强制要求 stage：
- `docs/system-design.md`
- 至少一个 `docs/requirements/*.md`

实现脚本：
- `scripts/check-doc-sync.sh`

### 2.2 增量需求文档生成

每个 commit 生成一个独立需求文档，记录：
- 需求摘要
- 变更范围（文件差异）
- 文档同步清单
- 可直接复制到 commit message 的摘要行（`Req: ...`）

实现脚本：
- `scripts/generate-requirement-doc.sh`

### 2.3 Commit 摘要规范

commit message 必须包含：

```text
Req: <本次需求摘要>
```

实现方式：
- `commit-msg` hook 校验

### 2.4 Agent 提交流程约束

agent 提交前必须执行：
- `bash scripts/check-doc-sync.sh`

若未通过，不允许继续提交。

## 3. 调用链路（调用电路）

```text
Agent/Developer commit flow
  -> (optional) bash scripts/generate-requirement-doc.sh "<summary>"
  -> git add ...
  -> git commit
       -> .githooks/pre-commit
            -> scripts/check-doc-sync.sh
       -> .githooks/commit-msg
            -> check "Req: ..." line
  -> git push origin <branch>
  -> create MR
```

## 4. 技术栈与实现方式

- Shell: `bash`
- Git hooks: `pre-commit`, `commit-msg`
- Git 差异检测：`git diff --cached --name-only`
- 文档产物：Markdown（`docs/requirements/*.md`）

## 5. 文件清单

- `skills/mr-workflow/SKILL.md`
- `skills/mr-workflow/agents/openai.yaml`
- `scripts/generate-requirement-doc.sh`
- `scripts/check-doc-sync.sh`
- `scripts/install-hooks.sh`
- `.githooks/pre-commit`
- `.githooks/commit-msg`
- `docs/requirements/README.md`

## 6. 使用方式

首次启用：

```bash
bash scripts/install-hooks.sh
```

生成需求文档：

```bash
bash scripts/generate-requirement-doc.sh "完善 MR 提交流程并增加文档校验"
```

提交前检查：

```bash
bash scripts/check-doc-sync.sh
```

## 7. 风险与约束

- 未安装 hooks 时，本地提交不会自动拦截（可用 `req:check` 手动执行）
- 文档是否“语义完整”仍依赖人工判断；脚本只做结构性约束
- `docs/system-design.md` 强制更新可能在纯小修场景偏严格，可按团队策略微调
