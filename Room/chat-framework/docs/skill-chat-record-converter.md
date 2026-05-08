# Skill 使用说明：chat-record-converter

Skill 路径：
- `skills/chat-record-converter/SKILL.md`

## 1. Skill 能做什么

`chat-record-converter` 用来把原始聊天记录转换为本项目输入文件：
- `chat.md`
- `profiles.yml`
- `chat.yml`
- `ui.yml`（多会话模式可选）

## 2. 推荐输入格式

给 agent 的输入建议包含：
- 原始聊天文本（按时间顺序）
- 参与者昵称（可选头像）
- 会话类型（单聊/群聊）
- 当前用户是谁（用于 `self`）
- 是否需要微信多会话首页

## 3. 推荐提示词模板

```text
请使用 chat-record-converter skill，把以下聊天整理为 chat-framework 的输入文件。
要求：
1) 生成 chat.md、profiles.yml、chat.yml
2) 第一条消息使用绝对时间，后续优先相对时间
3) 识别引用关系并使用 [quote:messageId]
4) 若识别到图片和链接卡片，分别使用 [image] / [link-card]
5) 最后做一致性校验并说明推断字段

原始聊天内容：
<粘贴聊天>
```

## 4. 输出检查清单

执行后检查：
- `@senderId` 是否都在 `profiles.yml` 中
- `#messageId` 是否唯一
- 首条时间是否绝对时间
- 引用是否只引用前文
- `chat.yml` 的 `type/self/title/groupInfo.avatar` 是否完整（单聊无需 `peer`，群聊无需 `members/groupInfo.name`）

## 5. 与构建命令衔接

单会话：
```bash
node src/build.js <chat.md路径> <输出html>
```

多会话：
```bash
node src/build-folder.js <目录路径> <输出html>
```
