---
title: "需求讨论（示例）"
profiles: "./profiles.yml"
chat: "./chat.yml"
theme: "wechat"
specVersion: "1.0"
---

@alice #m1 [2026-04-10 09:00:00]
大家早上好，今天把设计文档补齐。

@bob #m2 [+2m]
收到，我先整理渲染流程。

@clara #m3 [+1m] [quote:m2]
我补 UI 和交互细节。

@bob #m4 [+45s] [link-card]
url: https://example.com/design
title: 聊天界面设计稿
site: example.com
desc: 包含列表页、详情页与回放交互。

@alice #m5 [+1m] [image]
https://picsum.photos/seed/spec-demo/460/320

@clara #m6 [+1m]
播放结束后记得显示“当前聊天已结束”。
