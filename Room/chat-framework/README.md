# chat-framework (MVP)

根据 `chat.md` 生成类似微信聊天记录网页（支持引用、图片、链接卡片、主题切换），并支持把多个 `md` 合成为一个微信会话列表页面。

## 运行

```bash
cd /Users/dash/workspace/DashYang.github.io/Room/chat-framework
npm run build
npm run build:paper
npm run build:folder
npm run build:showcase
npm run hooks:install
```

输出文件：
- `dist/index.html`（单文件，wechat）
- `dist/paper.html`（单文件，paper）
- `dist/wechat-hub.html`（多会话微信界面）
- `dist/showcase-wechat-hub.html`（全功能预览基线）

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
- 标签：`[image]`、`[link-card]`、`[quote:消息ID]`、`[voice]`、`[recall]`、`[recall:+10s]`、`[article]`、`[contact-card]`
- 时间：第一条必须绝对时间；后续可 `+30s/+2m/+1h/+1d`，也可省略（按消息字数自动推导秒数）
- `#消息ID` 可省略（自动生成为 `m1/m2/...`）
- `@用户名` 在文本中会高亮显示
- `[image]` 支持“图 + 文字说明”（图片地址后续行作为说明）
- `[voice]` 支持语音消息（首行是音频 URL/路径，可选 `duration: 秒数` 和转写文本）
- `[recall]` / `[recall:+10s]` 支持撤回效果（多会话回放时会在设置延时后变为“撤回了一条消息”）
- `[article]` 支持在聊天中转发微信文章卡片，推荐用 `id` 引用 `articles/` 目录中的文章
- `[contact-card]` 支持在聊天中发送联系人名片（头像/姓名/昵称/bio）
- 点击聊天头像可查看 `profiles` 中的名字（`name`）和简介（`bio`）
- 多会话页支持“发现 -> 朋友圈”，仅展示文字/图片，并按当前阶段日期过滤未来动态
- 多会话页支持“文章 -> 微信文章”，文章正文统一来自 `articles/` 目录；profile 仅保存文章 id 引用
- 会话列表支持“自动播放未完成红点”：当天可播放内容未看完时，会话项显示红点；当天内容播放完毕后红点立即消失
- 会话列表预览规则：
  - 有未读红点时，预览显示“当天第一条可播放消息”
  - 当天已读完时，预览显示“当前会话在当前日期下的最后一条消息”

## YAML

- `profiles.yml` 或 `profiles/`：发言人信息（支持目录模式：每个用户一个 yml 文件）
- `articles/`：微信文章内容（每篇一个 yml，文件名即 article id）
- `chat.yml`：会话元信息（仅群聊推荐保留；单聊可不配置）

### Profile 别名规则

```yml
profile:
  name: "奋斗的西瓜"
  aliases:
    selfInGroups:
      "Room 功能预览群": "瓜总"
    contacts:
      sister: "老姐"
```

- 群聊中自己发言：优先显示 `aliases.selfInGroups[群标题]`
- 单聊/群聊中别人发言：优先显示当前账号 `aliases.contacts[对方id]`
- 未配置时回退到对方 `name`

## 多会话模式说明

当你用 `build-folder` 构建时：
- 文件夹内每个 `.md` 表示一个会话
- 首屏是会话列表，预览按“未读当天首条 / 已读当天最后一条”动态更新
- 点击会话后按 `replayIntervalMs` 逐条播放消息（默认 1000ms）
- 播放完成后显示小字：`当前聊天已结束`
- 可点击“返回”继续看其他会话
- 聊天窗口支持滚动查看历史与最新消息
- 某个会话完整播放过一次后，再次进入会直接完整展示（基于 `localStorage` 记忆）

参考目录：`examples/multi/`

### 基于 profile 的会话索引（推荐）

在 `profiles/*.yml` 中可直接声明该账号可见的会话文件，`build-folder` 会优先按这个索引加载：

```yml
profile:
  chatFiles: ["01-group.md", "02-single.md"]
  groupChats:
    "01-group.md": "group.yml"
```

- `chatFiles`：该账号视角下要加载的聊天 markdown 文件（相对 `build-folder` 输入目录）
- `groupChats`：仅群聊需要，指定某个 markdown 对应的群聊元信息 yml（只需 `title/groupInfo`）
- `self` 不再写在群聊 yml 中，由当前 profile 的 id 隐含
- 单聊无需 `chat.yml`，系统会从消息参与者自动推断会话对象与标题（优先联系人别名）

### 多账号登录/切换（story.yml）

在多会话目录下可选放置 `story.yml`，用于开启“多账号解锁 + 切换”的微信式体验。

```yml
story:
  accountOrder: ["protagonist", "sister", "admin"]
```

- `accountOrder`：账号（即 `profiles/*.yml` 的文件名 id）的解锁顺序。
- 解锁规则：当当前账号的时间轴已到最后一天，且“微信/文章/发现”的红点全部清零后，会给下一个账号在“我”上打红点提示；进入“我”可看到已解锁账号列表并随时切换。
- 时间轴与已读状态按账号隔离（同一个 `persistKey` 下记录多个账号的进度）。

示例：`examples/showcase/story.yml`

### 全功能预览基线（约定）

- 目录：`examples/showcase/`
- 产物：`dist/showcase-wechat-hub.html`
- 目标：集中覆盖当前所有核心功能（聊天、引用、图文、语音、撤回、头像资料卡、朋友圈）
- 约定：后续每新增一个功能，必须同步补充 `examples/showcase` 示例数据，保证可直接预览与回归

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
