---
title: "项目讨论记录"
profiles: "./profiles.yml"
chat: "./chat.yml"
theme: "wechat"
specVersion: "1.0"
---

@alice #m1 [2026-04-09 10:00:00]
大家早上好，今天把 Markdown 转聊天记录页面的框架先跑起来。

@bob #m2 [+2m]
https://example.com/spec

@clara #m3 [+45s] [quote:m2]
我看了，链接里的信息可以做成卡片样式。

@alice #m4 [+1m] [link-card]
url: https://openai.com
title: OpenAI
site: openai.com
desc: AI research and deployment company.

@bob #m5 [+1m] [image]
https://picsum.photos/seed/wireframe/480/320

@bob
我把 parser 的边界逻辑先理一下。

同一个发送者连续两条纯文本，现在可以省掉重复的 @bob。

@bob [2026-04-09 10:05:00]
这是新时间下的第一段纯文本。

这是同一个发送者在同一 header 下自动拆开的第二段。

@alice #m11 [+30s] [quote:m3]
好，我先把引用样式和主题切换接口补上。
