# 聊天记录 Markdown 与配置规范（v1.0）

本文档定义 `chat-framework` 的输入格式，包含：
- 聊天内容文件：`chat.md`
- 发送者配置：`profiles.yml`
- 会话配置：`chat.yml`
- 微信主界面配置（多会话模式）：`ui.yml`

## 1. 文件组织

单会话模式（生成单页聊天）：

```text
conversation-a/
├── chat.md
├── profiles.yml
└── chat.yml
```

多会话模式（一个文件夹内多个会话）：

```text
multi/
├── ui.yml
├── profiles.yml
├── group.yml
├── single.yml
├── 01-group.md
└── 02-single.md
```

## 2. chat.md 规范

### 2.1 Frontmatter 字段

`chat.md` 顶部支持 YAML frontmatter：

```md
---
title: "会话标题"
profiles: "./profiles.yml"
chat: "./chat.yml"
theme: "wechat"
replayIntervalMs: 1000
specVersion: "1.0"
---
```

字段说明：
- `title`：会话标题（可选）
- `profiles`：发送者配置路径，默认 `./profiles.yml`
- `chat`：会话配置路径，默认 `./chat.yml`
- `theme`：单会话页面主题，默认 `wechat`
- `replayIntervalMs`：多会话详情页的逐条播放间隔，默认 `1000`
- `specVersion`：规范版本，建议固定 `1.0`

### 2.2 消息头语法

每条消息必须以消息头开始：

```text
@senderId #messageId [timeRaw] [optional-tags...]
```

示例：

```md
@alice #m1 [2026-04-10 09:00:00]
大家早上好

@bob #m2 [+2m] [quote:m1]
收到
```

约束：
- `senderId`：必须存在于 `profiles.yml` 的 `users` 中
- `messageId`：会话内唯一
- 第一条消息时间必须是绝对时间
- 后续消息可用绝对时间或相对时间

### 2.3 时间格式

支持两类：
- 绝对时间：`YYYY-MM-DD HH:mm` 或 `YYYY-MM-DD HH:mm:ss`
- 相对时间：`+Ns` / `+Nm` / `+Nh` / `+Nd`

示例：
- `2026-04-10 09:00:00`
- `+30s`
- `+2m`
- `+1h`

### 2.4 标签（Tag）

支持标签：
- `[image]`：消息体为图片 URL 或路径
- `[link-card]`：消息体为键值对卡片配置
- `[quote:<messageId>]`：引用前文消息

#### 文本消息（默认）

```md
@bob #m3 [+1m]
这是普通文本，URL 会自动转可点击链接。
```

#### 图片消息

```md
@alice #m4 [+30s] [image]
https://picsum.photos/seed/demo/460/320
```

#### 链接卡片消息

```md
@bob #m5 [+1m] [link-card]
url: https://example.com/post
title: 示例文章
site: example.com
desc: 这是一个链接卡片示例。
```

#### 引用消息

```md
@alice #m6 [+1m] [quote:m5]
这条是对 m5 的回复。
```

## 3. profiles.yml 规范

```yml
users:
  alice:
    name: "Alice"
    avatar: "https://example.com/a.jpg"
    bio: "产品经理"
    wechatId: "alice_pm"
  bob:
    name: "Bob"
    avatar: "https://example.com/b.jpg"
    bio: "前端工程师"
```

字段说明：
- `users.<senderId>.name`：显示名
- `users.<senderId>.avatar`：头像 URL
- 其他字段（`bio`、`wechatId` 等）会保留，可用于后续扩展

## 4. chat.yml 规范

### 4.1 群聊

```yml
chat:
  type: "group"
  title: "Room MVP 群"
  self: "alice"
  groupInfo:
    name: "Room MVP 群"
    avatar: "https://example.com/group.jpg"
    members: ["alice", "bob", "clara"]
```

### 4.2 单聊

```yml
chat:
  type: "single"
  title: "Bob"
  self: "alice"
  peer: "bob"
```

字段说明：
- `type`：`group` 或 `single`
- `self`：当前用户 senderId（决定消息左右布局）
- `title`：会话标题（列表和详情头部）

## 5. ui.yml 规范（多会话模式）

`build-folder` 会尝试读取输入目录下的 `ui.yml`。

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

字段说明：
- `statusBar.carrier`：状态栏运营商文案
- `statusBar.time`：状态栏时间文案
- `statusBar.battery`：状态栏电量文案
- `topTitle`：主界面标题（默认“微信”）
- `searchPlaceholder`：搜索框提示词
- `persistKey`：回放完成状态的本地存储键

## 6. 完整示例

请直接参考：
- `examples/spec-demo/chat.md`
- `examples/spec-demo/profiles.yml`
- `examples/spec-demo/chat.yml`
- `examples/spec-demo/ui.yml`

## 7. 常见错误与排查

- 首条消息使用了相对时间：改成绝对时间
- `Unknown sender`：`chat.md` 的 `@senderId` 不在 `profiles.yml`
- `Duplicate message id`：重复的 `#messageId`
- 引用不存在：`[quote:x]` 的 `x` 必须在前文出现
- 页面列表为空：检查浏览器控制台是否有语法错误并重新构建
