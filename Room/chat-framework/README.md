# chat-framework (MVP)

根据 `chat.md` 生成类似微信聊天记录网页（支持引用、图片、链接卡片、主题切换），并支持把多个 `md` 合成为一个微信会话列表页面。

## 运行

```bash
cd /Users/dash/workspace/DashYang.github.io/Room/chat-framework
npm run build
npm run build:paper
npm run build:folder
npm run hooks:install
```

输出文件：
- `dist/index.html`（单文件，wechat）
- `dist/paper.html`（单文件，paper）
- `dist/wechat-hub.html`（多会话微信界面）

## Markdown 格式

```md
---
title: "项目讨论记录"
profiles: "./profiles.yml"
chat: "./chat.yml"
theme: "wechat"         # 单文件可选，默认 wechat
replayIntervalMs: 1000   # 多会话回放间隔（ms）
specVersion: "1.0"
---

@alice #m1 [2026-04-09 10:00:00]
第一条消息必须绝对时间

@bob #m2 [+2m] [quote:m1]
后续可相对时间，并支持引用
```

- 头部语法：`@发送者 #消息ID [可选时间] [可选标签...]`
- 标签：`[image]`、`[link-card]`、`[quote:消息ID]`、`[voice]`、`[recall]`、`[recall:+10s]`
- 时间：第一条必须绝对时间；后续可 `+30s/+2m/+1h/+1d`，也可省略（按消息字数自动推导秒数）
- `#消息ID` 可省略（自动生成为 `m1/m2/...`）
- `@用户名` 在文本中会高亮显示
- `[image]` 支持“图 + 文字说明”（图片地址后续行作为说明）
- `[voice]` 支持语音消息（首行是音频 URL/路径，可选 `duration: 秒数` 和转写文本）
- `[recall]` / `[recall:+10s]` 支持撤回效果（多会话回放时会在设置延时后变为“撤回了一条消息”）
- 点击聊天头像可查看 `profiles.yml` 中的昵称、微信号（`wechatId`）和简介（`bio`）

## YAML

- `profiles.yml`：发言人信息（头像、昵称、bio 等）
- `chat.yml`：会话元信息（single/group）

## 多会话模式说明

当你用 `build-folder` 构建时：
- 文件夹内每个 `.md` 表示一个会话
- 首屏是会话列表，只显示“对方第一句”的预览
- 点击会话后按 `replayIntervalMs` 逐条播放消息（默认 1000ms）
- 播放完成后显示小字：`当前聊天已结束`
- 可点击“返回”继续看其他会话
- 聊天窗口支持滚动查看历史与最新消息
- 某个会话完整播放过一次后，再次进入会直接完整展示（基于 `localStorage` 记忆）

参考目录：`examples/multi/`

### 主界面文案配置（ui.yml）

在多会话目录下可选放置 `ui.yml`，用于配置状态栏和标题文案：

```yml
ui:
  statusBar:
    carrier: "中国移动"
    time: "12:21"
    battery: "31%"
  topTitle: "微信"
  searchPlaceholder: "搜索"
  persistKey: "room_wechat_seen_v1"
```

- `carrier/time/battery`：顶部状态栏文案
- `topTitle`：顶部标题（如“微信”）
- `searchPlaceholder`：搜索栏提示词
- `persistKey`：浏览器本地记忆键名（用于“已播放会话直接完整展示”）

## 文档导航

- 输入规范文档：`docs/chat-format-and-config-spec.md`
- Skill 说明：`docs/skill-chat-record-converter.md`
- 系统设计文档：`docs/system-design.md`
- Skill 文件：`skills/chat-record-converter/SKILL.md`
- MR 流程 Skill：`skills/mr-workflow/SKILL.md`
- MR Skill 说明：`docs/skill-mr-workflow.md`
- MR 流程设计文档：`docs/mr-workflow-system-design.md`

## MR 提交流程（新增）

1. 首次安装 hooks：
```bash
npm run hooks:install
```

2. 生成本次提交的增量需求文档：
```bash
bash scripts/generate-requirement-doc.sh "这里填写需求摘要"
```

3. 提交前校验文档同步：
```bash
npm run req:check
```

4. commit message 需要包含：
```text
Req: 这里填写需求摘要
```
