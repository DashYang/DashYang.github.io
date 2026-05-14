---
name: chat-record-converter
description: 将原始聊天记录（文本转写、导出记录、人工整理内容）转换为 chat-framework 所需的 chat.md、profiles.yml、chat.yml、ui.yml，并自动补齐时间、引用与会话配置。
---

# Chat Record Converter

用于把“类似聊天记录”的内容标准化为本项目可渲染的输入文件。

## 适用场景

当用户提出以下请求时触发本 skill：
- “把这段聊天整理成可渲染的 md/yaml”
- “把微信群聊天导出转成项目格式”
- “把这份对话日志生成 chat.md + 配置”

输入可以是：
- 文本聊天记录
- OCR 后文字
- 半结构化清单（谁说了什么 + 大致时间）

## 输出目标

最少输出 3 个文件：
- `chat.md`
- `profiles.yml`
- `chat.yml`

若用户要求多会话首页微信风格，则额外输出：
- `ui.yml`

## 执行流程

1. 识别会话边界
- 判断是单会话还是多会话
- 多会话时按主题/群组拆分成多个 `*.md`

2. 提取参与者与画像
- 汇总所有发言人 `senderId`
- 为每个 sender 生成稳定 id（建议小写英文或拼音）
- 填充 `name/avatar/bio`；缺失时用占位并在结果说明中标记

3. 时间归一化
- 第一条消息必须转为绝对时间
- 后续优先使用相对时间（`+30s/+2m`）
- 原始时间缺失时：按消息顺序以默认步长（30s 或 1m）递增

4. 消息类型识别
- 纯文本 -> 默认文本
- 图片链接/本地路径 -> `[image]`
- 明确卡片信息 -> `[link-card]`
- 引用关系明显 -> `[quote:<messageId>]`

5. 会话配置生成
- 单聊：`chat.type = single`，补 `self/peer`
- 群聊：`chat.type = group`，补 `groupInfo`

6. 生成并校验
- 生成 `chat.md/profiles.yml/chat.yml(/ui.yml)`
- 检查：sender 是否存在、messageId 唯一、引用是否有效、首条时间是否绝对时间

## 字段映射规则

原始信息 -> 目标字段：
- 发言人昵称 -> `profiles.yml > users.<id>.name`
- 发言人头像（若有）-> `profiles.yml > users.<id>.avatar`
- 个人描述（若有）-> `profiles.yml > users.<id>.bio`
- 会话名称 -> `chat.yml > chat.title`
- 群名/群头像 -> `chat.yml > chat.groupInfo`
- 每条发言 -> `chat.md` 消息块
- 回复/引用关系 -> `chat.md` 的 `[quote:msgId]`

## 输出模板

### chat.md

```md
---
title: "<会话标题>"
profiles: "./profiles.yml"
chat: "./chat.yml"
theme: "wechat"
specVersion: "1.0"
---

@<senderId> #m1 [2026-04-10 09:00:00]
<文本内容>

@<senderId> #m2 [+1m] [quote:m1]
<文本内容>
```

### profiles.yml

```yml
users:
  <senderId>:
    name: "<显示名>"
    avatar: "<头像URL或占位URL>"
    bio: "<介绍>"
```

### chat.yml

```yml
chat:
  type: "group"
  title: "<会话标题>"
  self: "<当前用户senderId>"
  groupInfo:
    name: "<群名>"
    avatar: "<群头像>"
    members: ["<id1>", "<id2>"]
```

### ui.yml（可选）

```yml
ui:
  statusBar:
    carrier: "中国移动"
    time: "12:21"
    battery: "31%"
  topTitle: "微信"
  searchPlaceholder: "搜索"
  persistKey: "chat_seen_v1"
```

## 质量门槛

转换完成后必须满足：
- 第一条消息时间为绝对时间
- 所有 `@senderId` 在 `profiles.yml` 中可解析
- `#messageId` 不重复
- 引用只引用前文消息
- `chat.yml` 与会话类型一致（single/group）

## 失败与降级策略

- 时间缺失严重：按顺序补默认相对时间，并在结果说明中标注“时间为推断值”
- 引用不明确：不强行生成 `[quote:...]`，保留普通文本
- 头像缺失：使用占位头像 URL
