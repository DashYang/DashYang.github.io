---
name: mr-workflow
description: 定义提交 MR 的标准流程：在提交前同步更新 docs 文档、生成增量需求文档、校验提交信息摘要、推送远程分支并准备 MR。适用于本项目所有 agent 提交流程。
---

# MR Workflow Skill

该 skill 用于规范“从开发完成到 MR 提交”的全过程，确保代码、文档、需求增量、提交摘要一致。

## 触发场景

当用户提出以下诉求时触发：
- “提交 MR / 提 PR”
- “整理提交流程并推送分支”
- “提交前检查文档是否同步”
- “要求每个 commit 记录需求增量”

## 流程总览

1. 同步并确认分支
2. 完成代码改动与自测
3. 同步更新 `docs/` 文档（至少 `docs/system-design.md`）
4. 生成增量需求文档 `docs/requirements/*.md`
5. 运行文档一致性检查
6. 提交（commit message 必含 `Req: ...` 摘要）
7. 推送远程分支
8. 生成 MR 描述并发起 MR

## 具体执行步骤

### Step 1. 分支准备

建议使用：

```bash
git checkout -b codex/<feature-name>
```

若分支已存在，则确认当前分支正确：

```bash
git branch --show-current
```

### Step 2. 完成改动并自检

执行项目相关构建或检查命令（示例）：

```bash
npm run build:folder
```

### Step 3. 同步文档

若有功能、架构、流程变化，必须更新：
- `docs/system-design.md`
- 相关规范文档（如格式规范、Skill 文档等）

### Step 4. 生成增量需求文档

使用脚本：

```bash
bash scripts/generate-requirement-doc.sh "这里填本次需求摘要"
```

该脚本会在 `docs/requirements/` 下生成新增量文档，并附带：
- 变更范围
- 文档同步清单
- commit 摘要模板（`Req: ...`）

### Step 5. 提交前校验（Agent 强制）

运行：

```bash
bash scripts/check-doc-sync.sh
```

校验规则：
- 若本次有非 `docs/` 代码改动，必须同时 stage：
  - `docs/system-design.md`
  - 至少一个 `docs/requirements/*.md`

### Step 6. 提交代码

先安装 hooks（首次）：

```bash
bash scripts/install-hooks.sh
```

提交时 commit message 需包含需求摘要行：

```text
feat: xxx

Req: 这里写本次增量需求摘要
```

`commit-msg` hook 会检查 `Req:` 行是否存在。

### Step 7. 推送远程分支

```bash
git push -u origin <current-branch>
```

### Step 8. MR 描述模板（建议）

MR 描述建议包含：
- 需求背景
- 变更内容
- 文档更新列表
- 增量需求文档路径
- 验证方式
- 风险与回滚策略

## Agent 执行约束

当 agent 执行提交动作时，必须：
- 在提交前执行 `bash scripts/check-doc-sync.sh`
- 检查是否存在新的 `docs/requirements/*.md`
- 确认 commit message 含 `Req: ...`
- 在 MR 描述中引用该需求文档

未满足上述条件时，不应执行最终提交。
