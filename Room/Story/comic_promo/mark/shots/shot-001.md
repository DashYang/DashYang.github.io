# Shot 001｜无人游玩的游戏

## 基本信息

- 分镜编号：`shot-001`
- 最终图片：`shot-001.png`
- 主要人物：Mark 不直接出镜
- 地点：Mark 的个人游戏工作室
- 时间：上午约 9:00
- 剧情作用：用三个零建立 Mark 独立游戏无人问津的现实压力。

## 单一画面

- 外接显示器的紧凑特写，屏幕占画面主要面积。
- 屏幕显示一个原创、无品牌的深色独立游戏平台创作者后台。
- 页面中有一个《Speed Blocks》的项目卡片，卡片内能辨认出 4 × 4 方块棋盘和红、黄、青、米白几何图案。
- 统计区域为视觉焦点，给后期叠加三项零数据预留三个清晰、等宽的空白统计槽。
- 画面边缘可出现少量桌面、键盘上沿和带咖啡渍的马克杯，以确认工作室环境。
- 不出现 Mark、手、倒影、品牌 Logo、网站名称或任何底图文字。

## 镜头与光线

- 景别：屏幕特写。
- 机位：坐姿视线高度，略微偏左，避免成为完全正交的 UI 截图。
- 构图：外接显示器位于中央安全区，项目预览在上半部，统计槽在中下部。
- 主光：窗外上午暖光落在显示器边框和桌面上。
- 辅光：显示器冷蓝光。
- 色彩：冷灰、深蓝、少量珊瑚红、黄色和青色。

## 输入图片

- Image 1：`../references/creator-dashboard.png`，只作创作者后台结构参考，不是编辑目标。
- Image 2：`../references/speed-blocks.png`，只作方块棋盘与几何配色参考，不是编辑目标。

## 英文后期排版层

图片模型生成无字底图，以下文字后期叠加，画面中不得出现其他文字：

1. `SPEED BLOCKS`
   - 位置：项目卡片左上方。
   - 样式：紧凑粗体无衬线，全大写，暖白色。
2. `Views 0`
   - 位置：统计区左栏。
   - 样式：数字 `0` 放大，标签较小；中性无衬线，暖白色。
3. `Downloads 0`
   - 位置：统计区中栏。
   - 样式：与左栏完全一致。
4. `Followers 0`
   - 位置：统计区右栏。
   - 样式：与左栏完全一致。
5. `Zero?`
   - 位置：画面底部右侧的内心独白框，不遮挡统计数字。
   - 样式：深海军蓝矩形框、浅黄色细边、暖白色斜体漫画字。
   - 阅读顺序：统计数字之后。

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

Input images: Image 1 is a dashboard structure reference only, not an edit target; preserve only its simplified dark creator-dashboard hierarchy and do not copy its brand, logo, words, project, graph, colors, or exact layout. Image 2 is a game-board visual reference only, not an edit target; preserve only the 4-by-4 block-grid idea and the red, yellow, cyan, cream geometric motifs, and omit every original word, button, score, timer, border, and Chinese character.
Primary request: a tight close-up of the large external monitor in Mark's small personal game studio, showing a fictional unbranded indie-game creator dashboard for a block puzzle game; the emotional focal point is three clean empty statistics slots that will later receive zero values
Scene/backdrop: a small portion of the height-adjustable desk, the keyboard edge, and one coffee-stained mug may frame the monitor; no person is visible
Subject: a simplified dark creator dashboard with one project card; the project thumbnail contains a readable 4-by-4 block-puzzle board using restrained red, yellow, cyan, cream, and near-black geometric motifs; reserve one clean blank title zone and three equal clean blank statistic zones
Style/medium: apply the GLOBAL STYLE LOCK exactly; render the interface as part of a hand-drawn graphic-novel scene rather than a flat screenshot
Composition/framing: one standalone 9:16 portrait panel, seated eye-level monitor close-up with a subtle off-axis angle; project preview in the upper half, three blank statistic slots in the middle-lower area, all essential areas inside the central crop-safe region
Lighting/mood: normal 9 a.m. warm sunlight across the monitor bezel and desk, mixed with cool blue monitor glow; quiet disappointment and disbelief
Color palette: cool gray, deep navy, warm morning light, with restrained coral red, yellow, and cyan inside the game thumbnail
Materials/textures: matte monitor bezel, lightly worn keyboard, ceramic mug with a visible coffee stain, subtle comic halftone
Text (verbatim): none
Constraints: exactly one monitor close-up and one story moment; all interface title and statistic zones must remain completely blank for later typesetting; no human, hand, face, or reflection; no brand identity
Avoid: every letter, number, Chinese character, fake word, gibberish, logo, website name, navigation label, chart label, watermark, branded color scheme, additional monitor, split screen, multi-panel layout
```

## 生成后检查

- [ ] 底图完全无字，统计区保留三个清晰空槽。
- [ ] 游戏缩略图能看出 4 × 4 方块玩法，但没有复制参考图文字。
- [ ] 后期只加入本文件列出的五组英文文字，独白精确为 `Zero?`。
- [ ] 没有品牌、中文、Mark 倒影或额外人物。
