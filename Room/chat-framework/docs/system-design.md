# chat-framework 设计文档（v1.0）

## 1. 项目目标

`chat-framework` 是一个“聊天记录到网页”的静态生成框架，支持：
- 由 Markdown + YAML 生成聊天页面
- **单会话页 (Single Conversation Page)** 渲染
- **会话总览页 (Conversation Hub)** 聚合
- **剧情页 (Story Page)** 多场景串联
- **账号推进 (Account Progression)** 与 **系统时间 (System Time)** 驱动的互动体验
- 多账号解锁与快速切换（story.yml）
- 图片、链接卡片、引用消息、语音、撤回
- 回放式展示（按消息内容自动估算节奏逐条出现）
- 回放完成状态本地持久化（再次进入直接全量显示）
- 多主题支持（wechat、paper、iterms 绿黑终端风格）
- 背景心跳音效（Web Audio API 合成），自动播放时随 `[heartbeat:N]` 注解切换节奏

## 2. 核心概念设计

### 2.1 系统时间 (System Time)

在会话总览页模式下，系统时间（顶栏中心）不再是静态配置，而是由当前账号的阶段驱动：
- **来源**: 消息列表中的日期分布。
- **推进**: 用户完成当前阶段的所有互动后，系统自动推移到下一日期。
- **隔离**: 系统时间进度按账号独立存储。
- **初始值**: 初次渲染时可先显示 `ui.yml` 中的 `statusBar.time`，进入运行态后再切换到当前阶段日期。
- **身份解析**: 
  - 用户的 `name` 和 `bio` 优先从 `identityTimeline` 根据当前账号的系统时间解析。
  - 在账号切换列表中，每个账号卡片独立使用其自身的系统时间来解析显示的身份名称。

### 2.2 账号推进 (Account Progression)

通过 `story.yml` 定义多账号的线性解锁：
- **顺序**: 按 `accountOrder` 定义。
- **解锁条件**: 前序账号完成所有剧情互动（阅读、朋友圈、文章）。
- **反馈**: 下一个账号在“我”Tab 出现红点提示。
- **定位**: `story.yml` 是会话总览页中的推进配置。剧情页 (`renderWechatStoryHtml`) 则是第三种主要渲染产物，支持多场景串联。

## 3. 功能详细描述

### 3.1 输入与输出

输入：
- `chat.md`：消息内容与顺序
- `profiles.yml`：发送者画像
- `chat.yml`：会话元信息
- `ui.yml`：总览页主界面文案与状态栏（可选）
- `story.yml`：账号推进顺序与切换入口（总览页可选）

输出：
- 单会话页：`dist/index.html` 或指定输出
- 会话总览页：`dist/wechat-hub.html`（一个页面聚合多个 md）
- 剧情页：一个 HTML 页面串联多个会话总览场景，支持右滑进入下一幕


### 3.2 消息能力

- 文本消息：自动识别 URL 并转链接
- 图片消息：`[image]`
- 链接卡片：`[link-card]`
- 引用消息：`[quote:messageId]`（引用前文）
- 时间：首条绝对时间，后续可相对时间

### 3.3 会话总览页交互能力

- 主界面展示会话列表
- 点击会话进入详情回放
- 首次进入：先显示对方第一条，再按消息内容自动估算的阅读节奏逐条播放
- 回放结束：显示“当前聊天已结束”
- 再次进入：若会话已完整播放过，直接全量展示
- 本地记忆：基于 `localStorage` 的 `persistKey`
- **系统时间驱动**: 详情页与总览页共用阶段时间。
- **账号隔离**: 每个账号拥有独立的已读状态与进度。

### 3.4 剧情页交互能力

- 按场景串联多个会话总览体验
- 当前场景所有聊天回放完成后，顶部提示"当前幕已全部看完"
- 可通过触屏右滑手势或点击按钮进入下一幕
- 场景播放进度通过 `localStorage` 持久化

### 3.5 背景心跳音效

- 页面加载后即开始播放正常节奏（~60 BPM）心跳背景音
- 使用 Web Audio API（OscillatorNode）程序合成，无需外部音频文件
- 自动播放时遇到 `[heartbeat:1/2/3]` 注解切换到对应节奏档位（1=75 BPM, 2=100 BPM, 3=130 BPM）
- 遇到 `[heartbeat:end]` 回归正常节奏
- 退出自动播放（返回、切换 Tab）或播放结束 → 回归正常节奏
- 已读会话直接全量展示时不会触发注解切换，保持正常节奏

### 3.6 多主题支持

- `wechat`：默认微信风格（浅色、绿气泡）
- `paper`：纸质书信风格（暖色调、衬线字体）— 仅单会话页
- `iterms`：终端风格（黑底绿字、等宽字体、glow 发光效果）— 单会话页和总览页均支持
- 单会话页通过 frontmatter `theme` 字段指定
- 总览页通过 `ui.yml` 的 `theme` 字段指定，`[data-theme]` CSS 选择器驱动

## 4. 模块设计

### 4.1 `src/yaml.js`

职责：
- 轻量 YAML 解析器
- 支持对象、数组、标量

关键接口：
- `parseSimpleYaml(input)`

### 4.2 `src/parser.js`

职责：
- 解析 `chat.md` frontmatter
- 解析消息头、标签、消息体
- 自动识别纯 URL 文本并转链接卡片
- 解析 `[heartbeat:N]` / `[heartbeat:end]` 注解

关键接口：
- `parseChatMarkdown(raw)`

### 4.3 `src/time.js`

职责：
- 时间字符串归一化
- 绝对/相对时间解析
- 引用消息补全（被引用消息摘要）

关键接口：
- `resolveTimes(messages)`
- `resolveQuotes(messages)`

### 4.4 `src/load-conversation.js`

职责：
- 读取 md 与关联 yaml
- 校验 sender 与 messageId
- 输出归一化会话对象

关键接口：
- `loadConversationFromMarkdown(markdownPath)`

### 4.5 `src/renderer.js`

职责：
- 渲染单会话 HTML 页面
- 复用主题 `themes.js`

关键接口：
- `renderHtml(ctx)`

### 4.6 `src/multi-renderer.js`

职责：
- 渲染会话总览页聚合页
- 包含会话列表、详情回放、朋友圈、文章列表
- 实现 **剧情页 (Story Page)** 多场景串联
- 实现 **账号推进** 与 **系统时间** 的前端逻辑
- 实现 **HeartbeatEngine**（Web Audio API 心跳合成器），支持自动播放时节奏切换
- 本地持久化已播放状态

### 4.7 `src/build.js` 与 `src/build-folder.js`

职责：
- `build.js`：单会话页构建
- `build-folder.js`：目录内多 md 构建成一个会话总览页

## 5. 渲染过程

### 5.1 单会话页渲染流程

1. `build.js` 读取 `chat.md`
2. `loadConversationFromMarkdown` 解析 `chat.md/profiles.yml/chat.yml`
3. `resolveTimes + resolveQuotes` 完成数据归一化
4. `renderHtml` 生成完整 HTML
5. 写入 `dist/*.html`

### 5.2 会话总览页渲染流程

1. `build-folder.js` 扫描目录下所有 `*.md`
2. 对每个 md 执行单会话加载与归一化
3. 读取同目录 `ui.yml`（可选）
4. 读取同目录 `story.yml`（可选）
5. `buildConversationModels` 生成列表视图模型
6. `renderWechatHubHtml` 生成聚合页面
7. 浏览器端 JS 执行回放、系统时间推移、账号切换逻辑

### 5.3 剧情页渲染流程

1. 调用 `renderWechatStoryHtml` 并传入多场景配置
2. 对每个场景独立调用 `normalizeUi` 和嵌入会话数据
3. 生成包含全部场景 payload 的 HTML
4. 浏览器端 JS 按场景索引展示当前场景，监听右滑事件切换

## 6. 调用链路（调用电路）

### 6.1 单会话页

```text
CLI: node src/build.js
  -> loadConversationFromMarkdown
      -> parseChatMarkdown
      -> parseSimpleYaml (profiles/chat)
      -> validateMessages
      -> resolveTimes
      -> resolveQuotes
  -> renderHtml
  -> fs.writeFileSync
```

### 6.2 会话总览页

```text
CLI: node src/build-folder.js
  -> listMarkdownFiles
  -> loadConversationFromMarkdown (for each md)
  -> loadUiConfig (ui.yml)
  -> loadStoryConfig (story.yml)
  -> buildConversationModels
  -> renderWechatHubHtml
  -> fs.writeFileSync
```

### 6.3 剧情页

```text
调用: renderWechatStoryHtml({ title, scenes, persistKey })
  -> 生成包含多个会话总览场景的串联 HTML 页面
  -> 浏览器端支持触屏右滑或按钮点击切换到下一场景
  -> 场景进度通过 localStorage 持久化
```

### 6.4 浏览器端运行时

```text
open wechat-hub.html
  -> parse embedded JSON payload
  -> init account & story progression
  -> render conversation list
  -> if account fully completed then unlock next account in "我" tab
  -> click list item
      -> openConversation (updates System Time display)
      -> if seenMap[id] then full render
      -> else content-paced replay + end tip
      -> mark seen in localStorage & check for progression
```

## 6. 技术栈

- 运行时：`Node.js`（ESM）
- 语言：`JavaScript`
- 解析：自研轻量 YAML + Markdown 消息语法解析
- 渲染：字符串模板生成静态 HTML/CSS/JS
- 持久化：浏览器 `localStorage`
- 输出形态：纯静态文件（可 `file://` 或 HTTP 服务）

## 7. 数据模型摘要

消息对象核心字段：
- `id`
- `senderId`
- `timeRaw`
- `timestamp`
- `timeText`
- `kind`（`text`/`image`/`link-card`）
- `quote`（可选）

会话对象核心字段：
- `frontmatter`
- `profiles`
- `chat`
- `messages`

## 8. 非功能性设计

- 可扩展性：通过 frontmatter 和 yaml 增量扩展
- 可移植性：无外部依赖，生成产物为纯静态页面
- 可维护性：按解析、归一化、渲染、构建分层
- 容错性：对缺失字段提供默认值与降级策略

## 9. 已知限制与后续建议

已知限制：
- YAML 解析器为轻量实现，不覆盖完整 YAML 规范
- 自动链接卡片仅支持纯 URL 文本场景
- 回放持久化为浏览器本地级别，不跨设备

建议迭代：
- 引入成熟 YAML 解析器
- 增加 schema 校验与更友好的错误提示
- 支持更多主题和字体系统
- 支持更精细的“消息出现时间轴”配置

## 10. MR 提交流程治理（新增）

为保障“代码改动与文档同步”，项目新增了 MR 工作流能力：
- Skill：`skills/mr-workflow/SKILL.md`
- 脚本：`scripts/generate-requirement-doc.sh`、`scripts/check-doc-sync.sh`
- Git hooks：`.githooks/pre-commit`、`.githooks/commit-msg`
- 设计文档：`docs/mr-workflow-system-design.md`

核心规则：
- 非文档代码提交必须同步更新 `docs/system-design.md`
- 每个 commit 必须新增一个 `docs/requirements/*.md` 增量需求文档
- commit message 必须包含 `Req: ...` 摘要行
