# 单格分镜描述模板

复制本文件创建 `shot-XXX.md`。一个 Markdown 只描述一张图片；一个分镜只允许一个明确瞬间、一个主要动作和一个视觉焦点。

---

# Shot XXX

## 基本信息

- 分镜编号：`shot-XXX`
- 图片文件：`shot-XXX.png`
- 出场人物：
- 主要人物：
- 时间/时期：
- 连续性来源：

## 场景

- 地点：
- 时间：
- 环境：
- 必要道具：
- 禁止出现：

## 单一动作瞬间

<!-- 只描述快门按下时正在发生的一个动作，不写前后连续动作。 -->

- 主要动作：
- 视觉焦点：
- 人物表情：
- 人物视线：

## 镜头

- 景别：
- 机位与视角：
- 主体位置：
- 前景/中景/背景：
- 9:16 安全区说明：

## 光线与情绪

- 主光：
- 强调色：
- 氛围：

## 文字

<!-- 默认不进入图片，只作为后续排版素材保存。 -->

- 对白：
- 旁白：
- 音效：

## 连续性要求

- 必须保持：
- 本镜允许变化：
- 与上一镜衔接：
- 与下一镜衔接：

## 输入图片

<!-- 按图片编号明确角色；参考图只锁定身份，不作为编辑目标。 -->

- Image 1：
- Image 2：

## 完整图片生成提示词

按以下顺序拼接，不得省略前两类锁定内容：

1. `../../STYLE_LOCK.md` 中完整的 `GLOBAL STYLE LOCK`。
2. 所有出场人物 `CHARACTER_LOCK.md` 中对应时期的完整英文 `CHARACTER LOCK`。
3. 当前分镜提示词。

```text
[PASTE GLOBAL STYLE LOCK VERBATIM]

[PASTE CHARACTER LOCK(S) VERBATIM]

Input images: Image 1: identity reference for <character>; do not edit or reproduce the source composition. Add additional images only when needed and label every role explicitly.
Primary request: <one concrete story moment>
Scene/backdrop: <environment>
Subject: <character, one principal action, expression, gaze, and required interaction>
Style/medium: Apply the GLOBAL STYLE LOCK exactly.
Composition/framing: one standalone 9:16 portrait panel; <shot size and camera angle>; keep all essential information in the central crop-safe area
Lighting/mood: <lighting and emotion>
Color palette: cool gray and deep navy with <one optional accent color>
Materials/textures: <only details required by this scene>
Text (verbatim): none
Constraints: apply every GLOBAL STYLE LOCK and CHARACTER LOCK invariant; exactly one image and one story moment; no in-image text
Avoid: <scene-specific negative constraints>
```

## 生成后检查

- [ ] 只有一张单格画面，没有分格、拼贴、插图或重复动作。
- [ ] 比例为竖屏，关键内容位于中央安全区。
- [ ] 所有人物符合对应的 `CHARACTER_LOCK.md`，没有互相串脸。
- [ ] 画风符合 `STYLE_LOCK.md`，没有退回日漫头像或照片写实。
- [ ] 图片内没有文字、乱码、Logo、签名或水印。
- [ ] 动作、手部、肢体和道具关系自然。
- [ ] 最终文件已等比处理为 `1080 × 1920 PNG`，没有人物变形。
- [ ] 图片文件名与本 Markdown 文件名完全一致。

