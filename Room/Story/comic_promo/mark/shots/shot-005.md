# Shot 005｜窗外大雾

## 基本信息

- 分镜编号：`shot-005`
- 最终图片：`shot-005.png`
- 出场人物：Mark
- 地点：Mark 的个人游戏工作室
- 时间：上午约 9:00
- 剧情作用：确认光线异常来自完全遮蔽窗外世界的大雾，并用门铃把危险转向房门。

## 单一画面

- 从 Mark 右肩附近越肩看向关闭的普通玻璃窗。
- Mark 只露出后脑、凌乱近肩黑发、部分耳朵轮廓和黑色皮衣肩部。
- 窗外建筑、天空和太阳已经完全消失，只剩浓厚、无方向感的灰白大雾。
- 玻璃保持干净、关闭且完整，不出现凝结文字、手印、鬼脸或人物轮廓。
- 室内由冷灰雾光照亮，Mark 的肩部和头发形成深色前景剪影。
- 门铃只通过后期拟声词出现，不在底图中显示门、门铃设备或发声来源。

## 镜头与光线

- 景别：越肩中景。
- 机位：紧贴 Mark 右肩后方，视线直指窗户。
- 构图：Mark 头肩占左下或右下前景约四分之一，窗户占中央主要区域。
- 焦点：窗外完全不可见的雾，不是 Mark 的脸。
- 光线：均匀、冰冷、低对比度的灰白散射光。
- 情绪：失去空间参照后的压迫、寂静和悬念。

## 输入图片

- Image 1：`../../../art_prompt_library/avatar_prompts/generated/mark-indie-v1.png`，只锁定 Mark 的头发轮廓和身份，不是编辑目标。
- Image 2：`shot-004.png`，生成时如已确认，用于服装、窗户和雾变化连续性。

## 英文后期排版层

1. `DING-DONG`
   - 位置：画面左下方或左侧中下部，靠近房门所在的画外方向，不遮挡 Mark 头肩。
   - 样式：小型手绘漫画拟声词，暖白色粗体、深蓝描边，轻微向房间内部倾斜。
   - 不使用气泡或注释框。
2. `Mist?`
   - 位置：右上角小型内心独白框，与左上方门铃拟声词分开，不遮挡窗框。
   - 样式：深海军蓝矩形框、浅黄色细边、暖白色斜体漫画字。
   - 不使用对白气泡，不添加尾部。
3. 最终画面不得出现其他文字。

## 完整无字底图提示词

```text
Use case: illustration-story
Asset type: one standalone vertical comic story panel for smartphone reading
GLOBAL STYLE LOCK — Create an original contemporary American graphic-novel illustration. Use bold black ink contours with expressive variation in line weight, hard-edged readable silhouettes, strong chiaroscuro, controlled cel-painted color masses, and restrained halftone texture. Use cinematic lighting, clear spatial depth, mature realistic human proportions, natural anatomy, legible facial features, and grounded expressions. Keep the shared palette based on cool gray and deep navy with only a small amount of scene-specific saturated accent color. The result must remain visibly hand-drawn comic art, not a photograph or 3D render.
IDENTITY CONTINUITY — Preserve every depicted character according to the supplied CHARACTER LOCK: face shape, facial proportions, hair silhouette, apparent age, build, and distinguishing features must remain recognizable across all panels. Clothing and environment may change only when the shot description or an allowed period variant explicitly requires it. Character reference images define identity only; do not copy their anime rendering, square avatar composition, plain background, or head-and-shoulders crop.
SINGLE-PANEL MOBILE LOCK — Create exactly one image containing exactly one story moment, one principal action, and one visual focal point. Use a full-bleed 9:16 portrait composition intended for a final 1080 × 1920 PNG. Keep all essential faces, hands, and story information inside the central crop-safe area, with generous edge clearance for later proportional scaling and centered cropping. This is one standalone panel, not a page.
CONSTRAINTS — No multi-panel layout, comic page, collage, split screen, contact sheet, character lineup, character design sheet, storyboard grid, inset image, before-and-after view, or repeated-action sequence. No Japanese anime or manga styling, chibi, children's-book styling, photorealism, live-action movie still, 3D render, game model, oil painting, or watercolor. Do not imitate a named living or historical artist. Do not reproduce Marvel, DC, or any other protected character, costume, emblem, or proprietary visual design. No title, caption, dialogue, speech bubble, sound-effect lettering, random text, gibberish, logo, signature, watermark, decorative border, unrelated character, duplicate character, extra limb, fused face, or obvious anatomy error.

CHARACTER LOCK — MARK: Depict the same original Chinese man across every panel. His invariant identity is a lean elongated angular face, defined cheekbones, a sharp jawline, warm skin tone, the same brow and nose bridge, and tired but alert eyes. His build is lean rather than broad or stocky. Default to his present-day independent-game-developer appearance: deliberately messy near-shoulder-length black hair, black sunglasses, light unshaven stubble, a restrained relaxed half-smile, and a minimalist black jacket over a black shirt. He looks stylish, slightly enigmatic, capable, and self-possessed. Sunglasses may be removed only when the shot explicitly requires it; preserve the same eyes and facial structure underneath.
ALLOWED PERIOD VARIANTS — Student: the same face, slightly younger, shorter messy black hair, pale student hoodie; use the green watermelon head costume only when explicitly requested, with his unchanged human face clearly visible through the opening. Tech manager: the same face with short tousled black hair, thin rectangular glasses, tired alert eyes, deep navy shirt, and dark charcoal blazer.
IDENTITY INVARIANTS — Do not broaden or round his face, change his warm skin tone, soften his jaw, alter his brow or nose bridge, or give him a heavy build. He must never resemble Zack: no broad round face, high receding hairline, stocky chubby build, or pale polo shirt. Keep him an original fictional character with no resemblance to a real public figure. The reference image defines identity only; do not copy its anime style, square avatar framing, plain background, or portrait crop.

SETTING LOCK — MARK'S PERSONAL GAME STUDIO: Preserve the same small bedroom-sized personal game studio across every panel. The room is simple and orderly but visibly lived in by someone working through repeated nights. A height-adjustable desk sits near the center-front of the room. An open MacBook is fixed to the left of one large external monitor; a keyboard is centered in front of the monitor, a mouse is on the right, and headphones plus one mug with a conspicuous coffee stain remain on the desktop with only a small amount of work clutter. A closed ordinary glass window is immediately to Mark's right when he sits at the desk. A black ergonomic chair stands between the desk and the rear wall. A continuous row of glass-door display cabinets spans the wall behind the chair, containing game-character figures, robot models, model kits, and collectibles. A closed room door is located behind and to Mark's left; the area beyond it is never visible.
STORY-STATE LOCK — Mark is about thirty and uses his independent-game-developer identity. In this sequence he wears a black leather jacket over a black shirt, deliberately messy near-shoulder-length black hair, dark sunglasses, and light stubble. Repeated sleepless nights make his complexion slightly pale, with pronounced dark circles, bloodshot eyes, and restrained physical fatigue. Preserve his lean angular face, sharp jaw, defined cheekbones, warm underlying skin tone, and lean build from the CHARACTER LOCK.
LIGHT CONTINUITY — The time is about 9:00 a.m. Shots 001–003 have visible buildings, blue sky, and normal morning sunlight outside the window, mixing warm natural light with cool monitor light. In shot 004 the drilling stops and the sunlight abruptly fades as pale gray fog begins to erase the buildings. In shots 005–006 dense fog completely hides the buildings and sky, leaving cold gray diffuse window light and weak monitor light inside.
SPATIAL INVARIANTS — Never change the relative positions of desk, window, chair, display cabinets, and door. Do not enlarge the room into a professional office, luxury streaming room, large game studio, or cyberpunk laboratory. Do not add a bed, coworkers, pets, neon signs, wall text, or extra monitors. Do not swap the MacBook and external monitor. Fog remains outside the closed window. The room door remains closed and the person outside remains unseen.

Input images: Image 1 is Mark's identity reference only, not an edit target; preserve the distinctive messy near-shoulder-length hair and lean silhouette visible from behind. Image 2, if supplied, is the approved previous panel and serves only as clothing, window, studio, and fog-continuity reference.
Primary request: from just behind Mark's shoulder, look through the same closed studio window at the single disturbing realization that dense fog has completely erased the city outside
Scene/backdrop: the ordinary closed glass window dominates the frame; beyond it there are no visible buildings, sky, sun, horizon, street, or depth cues, only thick pale-gray fog; a minimal sliver of the same desk or window frame may confirm the established room
Subject: the back of the same Mark's head and one black-leather shoulder form a dark foreground silhouette; preserve his messy near-shoulder-length black hair, lean build, and cautious stillness; his face is not visible
Style/medium: apply the GLOBAL STYLE LOCK exactly
Composition/framing: one standalone 9:16 portrait panel, close over-the-shoulder view from near Mark's right shoulder aimed directly at the window; Mark occupies no more than the lower quarter and the fog-filled glass is the single central focal point; reserve a small clean lower-left zone for later doorbell sound-effect typesetting
Lighting/mood: cold gray diffuse fog light, low contrast outside, stronger ink silhouette in the foreground; soundless spatial disorientation and quiet dread
Color palette: pale gray fog, deep navy and black foreground, faint cold blue interior reflections
Materials/textures: clean intact window glass, matte black leather, restrained fog grain and halftone with no shapes resembling figures
Text (verbatim): none
Constraints: exactly one over-the-shoulder view and one silent observation moment; fog stays entirely outside the closed intact window; every outdoor landmark is fully obscured; no door or doorbell device is visible
Avoid: every letter, number, Chinese character, caption, sound-effect lettering, speech bubble, ghost face, silhouette in fog, handprint, writing on glass, condensation message, person outside, open window, fog entering room, rain, snow, visible city, sun, horizon, duplicate Mark, visible front face, extra person, logo, watermark
```

## 生成后检查

- [ ] 窗外没有任何建筑、天空、太阳或人形。
- [ ] Mark 只以头肩前景出现，脸不可见。
- [ ] 雾没有进入室内，窗户保持关闭完整。
- [ ] 底图无字，后期只加入 `DING-DONG` 和 `Mist?`。
