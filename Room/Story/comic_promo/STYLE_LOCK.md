# 全局漫画风格锁

本文件定义所有宣传漫画图片必须共享的视觉语言。后续生成每一张分镜时，都必须完整复制下方英文锁定段落，不得用近义词缩写或省略负面限制。

## 中文规范

### 风格

- 原创现代美式图像小说插画，不模仿具体漫画家。
- 使用粗细变化明显的黑色墨线、硬朗清晰的轮廓、强烈明暗分区和克制的网点纹理。
- 画面具有电影化灯光、空间纵深和戏剧性，但仍然明确是一幅手绘漫画插画。
- 人物采用成熟、写实化的正常人体比例；五官清晰，表情自然。
- 主色为冷灰和深蓝；每个场景最多使用少量高饱和强调色。
- 材质通过墨线、色块和局部纹理表现，避免照片级皮肤与真实摄影质感。

### 连续性

- 角色的脸型、五官比例、发型轮廓、年龄感和体型必须服从对应的 `CHARACTER_LOCK.md`。
- 服装和场景可以按时期变化，但不得借此重新设计人物。
- 多人同框时，每个人仍须保持独立且可辨认，不能互相融合或交换特征。
- 参考头像只用于锁定人物身份；不得继承头像的日漫画风、方形构图、纯色背景或头像裁切方式。

### 禁止项

- 禁止日漫、动画赛璐璐头像、Q版、儿童绘本和夸张大眼比例。
- 禁止照片写实、真人电影剧照、3D 渲染、游戏建模、油画和水彩画风。
- 禁止多格漫画、漫画整页、拼贴、分屏、接触表、角色设定表和连续动作合集。
- 禁止复制 Marvel、DC 或其他既有作品的角色、服装、标志和专有视觉设计。
- 禁止随机文字、乱码、对白框、标题、Logo、签名、水印和画框。
- 禁止无关人物、重复人物、额外肢体、错误手指、融合面孔和明显解剖错误。

## GLOBAL STYLE LOCK

复制以下整段作为每次图片生成提示词的固定开头：

```text
Use case: illustration-story
Asset type: one standalone vertical comic story panel for smartphone reading
GLOBAL STYLE LOCK — Create an original contemporary American graphic-novel illustration. Use bold black ink contours with expressive variation in line weight, hard-edged readable silhouettes, strong chiaroscuro, controlled cel-painted color masses, and restrained halftone texture. Use cinematic lighting, clear spatial depth, mature realistic human proportions, natural anatomy, legible facial features, and grounded expressions. Keep the shared palette based on cool gray and deep navy with only a small amount of scene-specific saturated accent color. The result must remain visibly hand-drawn comic art, not a photograph or 3D render.
IDENTITY CONTINUITY — Preserve every depicted character according to the supplied CHARACTER LOCK: face shape, facial proportions, hair silhouette, apparent age, build, and distinguishing features must remain recognizable across all panels. Clothing and environment may change only when the shot description or an allowed period variant explicitly requires it. Character reference images define identity only; do not copy their anime rendering, square avatar composition, plain background, or head-and-shoulders crop.
SINGLE-PANEL MOBILE LOCK — Create exactly one image containing exactly one story moment, one principal action, and one visual focal point. Use a full-bleed 9:16 portrait composition intended for a final 1080 × 1920 PNG. Keep all essential faces, hands, and story information inside the central crop-safe area, with generous edge clearance for later proportional scaling and centered cropping. This is one standalone panel, not a page.
CONSTRAINTS — No multi-panel layout, comic page, collage, split screen, contact sheet, character lineup, character design sheet, storyboard grid, inset image, before-and-after view, or repeated-action sequence. No Japanese anime or manga styling, chibi, children's-book styling, photorealism, live-action movie still, 3D render, game model, oil painting, or watercolor. Do not imitate a named living or historical artist. Do not reproduce Marvel, DC, or any other protected character, costume, emblem, or proprietary visual design. No title, caption, dialogue, speech bubble, sound-effect lettering, random text, gibberish, logo, signature, watermark, decorative border, unrelated character, duplicate character, extra limb, fused face, or obvious anatomy error.
```

## 输出规范

- 目标画幅：`9:16` 竖屏。
- 最终格式：`1080 × 1920 PNG`。
- 图片生成工具无法直接保证目标像素时，应先生成竖版原图，再等比缩放并居中裁切。
- 不得直接拉伸或压缩画面改变人物比例。
- 裁切前必须确认所有关键面孔、手部、道具和动作都位于安全区内。

