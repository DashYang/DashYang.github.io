# Shot 003｜装修噪音爆发

## 基本信息

- 分镜编号：`shot-003`
- 最终图片：`shot-003.png`
- 出场人物：Mark
- 地点：Mark 的个人游戏工作室
- 时间：上午约 9:00
- 剧情作用：外部噪音击穿 Mark 勉强维持的冷静。

## 单一画面

- 从 Mark 背后看向天花板，他刚从人体工学椅上站起并仰头怒吼。
- Mark 的后脑、凌乱近肩黑发、黑色皮衣背部和绷紧的肩膀清晰可见。
- 天花板与一盏普通吸顶灯是主要视觉方向。
- 灯具轻颤、天花板震动线和少量落灰表现楼上电钻冲击。
- 椅子刚被推离桌面，但保持直立，不翻倒。
- 窗外仍有正常上午阳光；不出现楼上房间、钻头、施工人员或破损天花板。

## 镜头与光线

- 景别：背面中广景。
- 机位：Mark 身后腰部高度，明显低角度仰拍。
- 构图：Mark 位于下半部中央，天花板占上半部，为三组英文文字预留空间。
- 主光：右侧窗户上午暖光。
- 辅光：显示器冷光从下方勾勒 Mark 皮衣边缘。
- 动势：所有震动线指向天花板，不形成多格或重复动作。

## 输入图片

- Image 1：`../../../art_prompt_library/avatar_prompts/generated/mark-indie-v1.png`，Mark 身份参考，不是编辑目标。
- Image 2：`shot-002.png`，生成时如已确认，用于服装、发型和房间连续性。

## 英文后期排版层

1. `LOUD DRILLING FROM UPSTAIRS`
   - 位置：左上角窄幅注释框。
   - 样式：深海军蓝矩形、暖白色全大写窄体字。
2. `BRRRRRRRR—`
   - 位置：沿天花板震动方向横跨上半部，但不遮挡吸顶灯。
   - 样式：粗重、倾斜、锯齿边缘的手绘漫画拟声词；白色主体配黄色薄描边。
3. `STOP!`
   - 位置：Mark 头部右上方对白气泡。
   - 样式：白色爆发形气泡、黑色粗边、黑色粗体全大写。
   - 气泡尾部：明确指向 Mark 的嘴部方向，即使脸部从背面不可见。
4. 阅读顺序：注释框 → 电钻拟声词 → `STOP!`

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

Input images: Image 1 is Mark's identity reference only, not an edit target; preserve his messy near-shoulder-length hair silhouette, lean build, and black clothing while using the requested rear view. Image 2, if supplied, is the approved previous panel and serves only as clothing and studio-continuity reference.
Primary request: from directly behind Mark, capture the single instant when relentless upstairs drilling finally makes him spring upright from the ergonomic chair and shout toward the ceiling
Scene/backdrop: the same small bedroom-sized studio with the desk ahead of him, black ergonomic chair pushed slightly back but still upright, right-side window showing normal morning buildings and blue sky, display cabinets remaining behind the camera direction; an ordinary ceiling and simple flush ceiling light dominate the upper half
Subject: the same lean thirty-year-old Mark seen from behind, wearing the same black leather jacket and black shirt; messy near-shoulder-length black hair, shoulders lifted and tense, head thrown upward toward the ceiling, arms held naturally at his sides or slightly away from his body in anger
Style/medium: apply the GLOBAL STYLE LOCK exactly
Composition/framing: one standalone 9:16 portrait panel, rear medium-wide shot from waist height with a dramatic low-angle upward view; Mark occupies the lower central third and the vibrating ceiling occupies the upper half; reserve clean open areas for later English caption, drilling sound effect, and speech balloon
Lighting/mood: normal warm 9 a.m. sunlight from the right window plus faint cool monitor rim light from below; abrupt loss of composure, oppressive noise, pent-up frustration
Color palette: cool gray, deep navy, black leather, warm sunlight, restrained yellow accent
Materials/textures: leather jacket creases, matte painted ceiling, subtle drifting dust, cabinet glass only if a sliver is compositionally visible
Text (verbatim): none
Constraints: one Mark, one standing-and-shouting instant, one room, one ceiling; communicate drilling only through a lightly trembling ceiling fixture, restrained vibration lines, and a small amount of falling dust; chair remains upright; ceiling remains intact
Avoid: every letter, number, Chinese character, caption, speech bubble, sound-effect lettering, construction worker, visible drill, upstairs room, broken ceiling, falling debris, supernatural fog, duplicate Mark, repeated-action pose, raised weapon, overturned chair, extra person, logo, watermark
```

## 生成后检查

- [ ] 后背视角和低机位明确，Mark 只出现一次。
- [ ] 天花板只有轻微震动，没有施工人员或破洞。
- [ ] 为三组英文文字留出互不冲突的安全区。
- [ ] 底图无字，后期不加入任何中文。

