# chat-framework 设计文档（v1.0）

## 1. 项目目标

`chat-framework` 是一个“聊天记录到网页”的静态生成框架，支持：
- 由 Markdown + YAML 生成聊天页面
- 单会话渲染
- 多会话微信主界面聚合
- 多账号登录/解锁/切换（story.yml，可选）
- 图片、链接卡片、引用消息
- 回放式展示（按间隔逐条出现）
- 回放完成状态本地持久化（再次进入直接全量显示）

## 2. 功能详细描述

### 2.1 输入与输出

输入：
- `chat.md`：消息内容与顺序
- `profiles.yml`：发送者画像
- `chat.yml`：会话元信息
- `ui.yml`：多会话主界面文案与状态栏（可选）
- `story.yml`：多账号解锁顺序与切换入口（多会话可选）

输出：
- 单会话：`dist/index.html` 或指定输出
- 多会话：`dist/wechat-hub.html`（一个页面聚合多个 md）

### 2.2 消息能力

- 文本消息：自动识别 URL 并转链接
- 图片消息：`[image]`
- 链接卡片：`[link-card]`
- 引用消息：`[quote:messageId]`（引用前文）
- 时间：首条绝对时间，后续可相对时间

### 2.3 多会话交互能力

- 主界面展示会话列表（类似微信）
- 点击会话进入详情回放
- 首次进入：先显示对方第一条，再按 `replayIntervalMs` 逐条播放
- 回放结束：显示“当前聊天已结束”
- 再次进入：若会话已完整播放过，直接全量展示
- 本地记忆：基于 `localStorage` 的 `persistKey`

## 3. 模块设计

### 3.1 `src/yaml.js`

职责：
- 轻量 YAML 解析器
- 支持对象、数组、标量

关键接口：
- `parseSimpleYaml(input)`

### 3.2 `src/parser.js`

职责：
- 解析 `chat.md` frontmatter
- 解析消息头、标签、消息体
- 自动识别纯 URL 文本并转链接卡片

关键接口：
- `parseChatMarkdown(raw)`

### 3.3 `src/time.js`

职责：
- 时间字符串归一化
- 绝对/相对时间解析
- 引用消息补全（被引用消息摘要）

关键接口：
- `resolveTimes(messages)`
- `resolveQuotes(messages)`

### 3.4 `src/load-conversation.js`

职责：
- 读取 md 与关联 yaml
- 校验 sender 与 messageId
- 输出归一化会话对象

关键接口：
- `loadConversationFromMarkdown(markdownPath)`

### 3.5 `src/renderer.js`

职责：
- 渲染单会话 HTML 页面
- 复用主题 `themes.js`

关键接口：
- `renderHtml(ctx)`

### 3.6 `src/multi-renderer.js`

职责：
- 渲染微信风格多会话聚合页
- 会话列表、详情回放、结束提示、返回
- 本地持久化已播放状态

关键接口：
- `buildConversationModels(conversations)`
- `renderWechatHubHtml(input)`

### 3.7 `src/build.js` 与 `src/build-folder.js`

职责：
- `build.js`：单文件构建
- `build-folder.js`：目录内多 md 构建成一个聚合界面

## 4. 渲染过程

### 4.1 单会话渲染流程

1. `build.js` 读取 `chat.md`
2. `loadConversationFromMarkdown` 解析 `chat.md/profiles.yml/chat.yml`
3. `resolveTimes + resolveQuotes` 完成数据归一化
4. `renderHtml` 生成完整 HTML
5. 写入 `dist/*.html`

### 4.2 多会话渲染流程

1. `build-folder.js` 扫描目录下所有 `*.md`
2. 对每个 md 执行单会话加载与归一化
3. 读取同目录 `ui.yml`（可选）
4. 读取同目录 `story.yml`（可选，多账号）
4. `buildConversationModels` 生成列表视图模型
5. `renderWechatHubHtml` 生成聚合页面
6. 浏览器端 JS 执行回放逻辑与本地记忆

## 5. 调用链路（调用电路）

### 5.1 单会话

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

### 5.2 多会话

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

### 5.3 浏览器端运行时

```text
open wechat-hub.html
  -> parse embedded JSON payload
  -> render conversation list
  -> multi-account: show "我" tab account switch (if story.yml + multiple self ids)
  -> click list item
      -> openConversation
      -> if seenMap[id] then full render
      -> else interval replay + end tip
      -> mark seen in localStorage
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
