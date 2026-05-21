---
title: "Room 功能预览群"
profiles: "./profiles"
chat: "./group.yml"
specVersion: "1.0"
---

@admin #g1 [2026-04-28 20:00:00]
今晚这条用于展示全部能力，大家随便发 [微笑]

@neighbour2 #g2 [+20s]
我先来一条普通文本，顺便@protagonist 看看 mention 效果

@protagonist #g3 [+12s] [quote:g2]
收到，引用和 emoji 都 OK [强]

@sister #g4 [+14s] [image] [heartbeat:1]
https://picsum.photos/seed/showcase-image/460/320
图 + 文的消息说明在这里，支持换行。
第二行说明。

@protagonist #g5 [+18s] [voice]
https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3
duration: 9
这是语音转写示例，点一下可以播放。

@neighbour2 #g6 [+12s] [recall:+8s] [heartbeat:2]
这条消息会在 8 秒后撤回，请观察回放过程。

@protagonist #g7 [+14s] [article]
id: a1

@sister #g8 [+12s] [contact-card] [heartbeat:end]
name: 周警官
nickName: zhou_police
avatar: https://picsum.photos/seed/policeman/100/100
bio: 社区民警，负责周边治安巡查。

@admin #g9 [2026-04-29 09:05:00]
进入 4 月 29 日后，这条才会在同一个群聊里出现。

@protagonist #g10 [+12s]
收到，这就是“同会话按日期增量展示”的例子。
