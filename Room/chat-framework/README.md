# chat-framework (MVP)

根据 `chat.md` 生成类似微信聊天记录网页（单会话页），或将多个 `md` 聚合为功能完备的会话总览页（Conversation Hub）。

## 核心能力

- **单会话页 (Single Conversation Page)**: 支持引用、图片、链接卡片、语音、撤回等全量微信特性，可作为独立页面分享。
- **会话总览页 (Conversation Hub)**: 聚合多会话、朋友圈、文章列表。支持 **账号推进 (Account Progression)** 与 **系统时间 (System Time)** 驱动的沉浸式互动体验。
- **系统时间 (System Time)**: 位于总览页顶部的状态栏中心时间。它不是现实时钟，而是页面内部的逻辑时间；在运行过程中会随当前账号的阶段推进而更新。

## 运行

```bash
cd /Users/dash/workspace/DashYang.github.io/Room/chat-framework
npm run build           # 生成单会话页 (dist/index.html)
npm run build:paper     # 生成单会话页 (paper 主题)
npm run build:folder    # 生成会话总览页 (dist/wechat-hub.html)
npm run build:showcase  # 生成全功能预览基线
npm run hooks:install
```

输出文件：
- `dist/index.html`（单会话页，wechat）
- `dist/paper.html`（单会话页，paper）
- `dist/wechat-hub.html`（会话总览页）
- `dist/showcase-wechat-hub.html`（全功能预览基线）

## Markdown 格式

```md
---
title: "项目讨论记录"
profiles: "./profiles.yml"
chat: "./chat.yml"
theme: "wechat"
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
- `[recall]` / `[recall:+10s]` 支持撤回效果（详情页回放时会在设置延时后变为“撤回了一条消息”）
- `[article]` 支持在聊天中转发文章卡片，推荐用 `id` 引用 `articles/` 目录中的文章
- `[contact-card]` 支持在聊天中发送联系人名片（头像/姓名/昵称/bio）
- 点击聊天头像可查看 `profiles` 中的名字（`name` 为正式名称）和简介（`bio`）；当配置了 `identityTimeline` 时，系统以其按参考时间解析出的生效名称为准，不再使用顶层的 `profile.name`。`aliases.contacts` 中定义的备注名则用于聊天气泡上方、总览页预览及标题栏。
- 总览页支持“发现 -> 朋友圈”，仅展示文字/图片，并按当前系统时间过滤未来动态
- 总览页支持“文章 -> 文章列表”，文章正文统一来自 `articles/` 目录；profile 仅保存文章 id 引用。文章正文可用 `markdown`/`body`/`text`/`content` 字段，支持标题、段落、引用、列表、粗体/斜体、链接和图片
- 总览页支持“自动播放未完成红点”：当天可播放内容未看完时，会话项显示红点；当天内容播放完毕后红点立即消失。底部“微信”tab 的数字按待播放会话数统计，不按消息条数统计；历史已有消息不计入当天数字
- 会话列表预览规则：
  - 有未读红点时，预览显示“当天第一条可播放消息”
  - 当天已读完时，预览显示“当前会话在当前日期下的最后一条消息”

## YAML

- `profiles.yml` 或 `profiles/`：发言人信息（支持目录模式：每个用户一个 yml 文件）
- `articles/`：微信文章内容（每篇一个 yml，文件名即 article id）
- `chat.yml`：会话元信息（仅群聊推荐保留；单聊可不配置）

文章示例：

```yml
article:
  publishAt: "2026-04-29 09:15:00"
  title: "一篇支持 Markdown 的文章"
  author: "Room"
  summary: "列表页摘要仍然用独立字段。"
  markdown: |
    # 正文标题

    第一段正文，支持 **粗体**、*斜体* 和 [链接](https://example.com)。

    > 这里是一段引用。

    - 第一条
    - 第二条

    ![正文图片](https://picsum.photos/seed/article-md/800/420)
```

### Profile 别名与名称显示规则

```yml
profile:
  # name: "奋斗的西瓜" # 与 identityTimeline 互斥，不建议混合使用
  aliases:
    selfInGroups:
      "Room 功能预览群": "瓜总"
    contacts:
      sister: "老姐"

  identityTimeline:
    2026-04-01:
      name: "奋斗的西瓜"
      bio: "独立游戏开发者"
    2026-04-29:
      name: "西瓜（Room 维护中）"
      bio: "独立游戏开发者 / Room 项目维护者"
```

- **Naming Source Exclusivity**: 账号身份名称必须从 `profile.name` 或 `profile.identityTimeline` 中**择一使用**。若配置了非空的 `identityTimeline`，则必须删除顶层的 `profile.name`。
- **Canonical Nickname**: 账号的正式名称。系统会根据当前参考时间从 `name` 或 `identityTimeline` 中解析。它显示在点击头像弹出的资料卡标题中。
- **Remark (`aliases.contacts`)**: 对好友的备注名。在当前账号视角下，单聊/群聊中别人的发言、会话列表预览、聊天窗口标题都会优先显示备注名。
- **Group Alias (`aliases.selfInGroups`)**: 在特定群聊中自己的显示名称（群名片）。
- **Date-effective identity (`profile.identityTimeline`)**: 可按日期配置生效中的 `name/bio`。系统会选取“生效日期 <= 当前参考时间”的最新一条。
- **System-time Naming**: 在会话总览页中，账号资料卡的参考时间为当前账号的**系统时间**。特别地，在“我”界面的账号切换列表中，每个账号卡片的名称都根据**该账号自身的系统时间**（即该账号当前持久化的阶段日期）解析，从而确保每个账号都以其当前的剧情身份呈现。
- 未配置别名时，回退到解析出的正式名称，最后回退到 `id`。

## 会话总览页模式说明

当你用 `build-folder` 构建时：
- 文件夹内每个 `.md` 表示一个会话。
- **路径解析规则**：
  - **单文件构建 (`npm run build`)**：Markdown 头部 frontmatter 中的 `profiles/chat/articles` 等相对路径，均相对于该 **Markdown 文件所在的目录** 解析。
  - **文件夹构建 (`npm run build:folder`)**：`profiles/` 目录、`profiles.yml`、`ui.yml`、`story.yml` 以及 `chatFiles` 和 `groupChats` 中指定的路径，均相对于传入的 **`inputDir` 目录** 解析。
- 首屏是会话列表，预览按“未读当天首条 / 已读当天最后一条”动态更新。
- 点击会话后会按消息内容自动估算阅读节奏逐条播放；文本越长，停留越久。播放中点击聊天记录区域可立即刷出下一条消息
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

### 账号推进与切换 (story.yml)

在总览页目录下可选放置 `story.yml`，用于开启“账号解锁 + 切换”的沉浸式体验。

```yml
story:
  accountOrder: ["protagonist", "sister", "admin"]
```

- `accountOrder`：账号（即 `profiles/*.yml` 的文件名 id）的解锁顺序。
- 解锁规则：当当前账号的时间轴已到最后一天，且“微信/文章/发现”的红点全部清零后，会解锁下一个账号并在“我”上打红点提示；进入“我”可看到已解锁账号列表并随时切换。
- **系统时间** 与已读状态按账号隔离（同一个 `persistKey` 下记录多个账号的进度）。

补充说明：
- `story.yml` 不是第三种独立渲染模式，而是**会话总览页**里的账号推进配置。
- 顶部状态栏正中的时间建议统一称为 **系统时间**。它不是物理世界时间，而是页面内部随着推进变化的时间。

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
  persistKey: "room_wechat_seen_v1"
```

- `carrier/time/battery`：顶部状态栏文案
- `topTitle`：顶部标题（如“微信”）
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
