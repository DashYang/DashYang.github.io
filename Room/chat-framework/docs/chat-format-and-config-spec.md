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
@senderId #messageId [optional-timeRaw] [optional-tags...]
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
- `messageId`：会话内唯一。可选；省略时系统会自动生成（`m1/m2/...`）
- 第一条消息时间必须是绝对时间
- 后续消息可用绝对时间、相对时间，或省略时间
- 省略时间时，系统会按“该条消息非空白字符数 N => +Ns”自动推导（最少 `+1s`）

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
- `[voice]`：语音消息（支持时长与转写）
- `[recall]` / `[recall:+10s]`：消息撤回（可设置撤回延时）
- `[article]`：微信文章转发卡片
- `[contact-card]`：联系人名片

#### 文本消息（默认）

```md
@bob #m3 [+1m]
这是普通文本，URL 会自动转可点击链接。
```

#### 图片消息

```md
@alice #m4 [+30s] [image]
https://picsum.photos/seed/demo/460/320
这是一条图片说明文字（可选）
```

说明：`[image]` 下第一行视为图片地址，后续行视为图片说明文本。

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

#### 语音消息

```md
@bob #m7 [+20s] [voice]
./audio/demo.mp3
duration: 8
这是语音的转写内容（可选）
```

说明：
- 第一行为音频 URL/相对路径，或使用 `url: ...`
- 可选 `duration: 秒数`，用于语音气泡显示
- 其余行作为转写文本（可选）

#### 撤回消息

```md
@alice #m8 [+10s] [recall]
这条消息会立即撤回

@bob #m9 [+10s] [recall:+12s]
这条消息会在 12 秒后撤回
```

#### 微信文章转发卡片

```md
@alice #m10 [+10s] [article]
id: a1
```

#### 联系人名片

```md
@bob #m11 [+10s] [contact-card]
name: 周警官
nickName: zhou_police
avatar: https://example.com/a.jpg
bio: 社区民警
```

### 2.5 文本增强效果

- `@用户名` 会在渲染时高亮显示（`@mention` 效果）
- 文本中的 URL 会自动转为可点击链接
- 点击头像可查看 `profiles.yml` 中的 `name/wechatId/bio`

## 3. profiles.yml 规范

支持两种方式：
- 单文件：`profiles.yml`（`users` 字典）
- 目录模式：`profiles/`，每个用户一个文件（如 `alice.yml`、`bob.yml`）

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
- `users.<senderId>.nickName`：昵称（用于头像资料卡）
- 其他字段（`bio`、`wechatId` 等）会保留，可用于后续扩展

### 3.1 目录模式示例（推荐）

`chat.md` frontmatter:
```md
---
profiles: "./profiles"
---
```

`profiles/alice.yml`:
```yml
profile:
  name: "Alice"
  nickName: "alice_pm"
  avatar: "https://example.com/a.jpg"
  bio: "产品经理"
  moments:
    m1:
      publishAt: "2026-04-30 09:00:00"
      text: "今天开了个好会"
      images: ["https://example.com/1.jpg", "https://example.com/2.jpg"]
```

说明：
- 朋友圈只支持文字和图片
- `publishAt` 晚于浏览器当前时间的内容不会显示

### 3.2 微信文章配置

文章实体统一放在 `articles/` 目录下，profile 中只保存文章引用：

```yml
profile:
  officialArticles: ["a1", "a2"]
```

`articles/a1.yml`:

```yml
article:
  publishAt: "2026-04-27 08:30:00"
  title: "文章标题"
  author: "公众号名称"
  cover: "https://example.com/cover.jpg"
  summary: "文章摘要（可选）"
  text: "文章正文（支持换行）"
  images: ["https://example.com/1.jpg", "https://example.com/2.jpg"]
```

说明：
- 入口在多会话页底部“通讯录”
- 仅展示 `publishAt <= 当前时间` 的文章
- 支持文字+图片

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

## 5.2 story.yml 规范（多账号登录/切换）

`build-folder` 会尝试读取输入目录下的 `story.yml`。该文件用于定义多账号解锁顺序，并在页面底部“我”中提供账号切换入口。

```yml
story:
  accountOrder: ["protagonist", "sister", "admin"]
```

字段说明：
- `accountOrder`：账号 id 列表（账号 id 即各会话 `chat.yml` 的 `self`），用于定义解锁顺序与展示顺序。

运行时行为：
- 初始仅解锁第一个账号。
- 当当前账号时间轴推进到最后一天，且该账号在当前日期下“微信/通讯录/发现”的未读全部清零，会解锁下一个账号，并在“我”Tab 显示红点提示。
- 已解锁账号可在“我”中随时切换；时间轴进度与已读状态按账号隔离。

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
