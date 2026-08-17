# Shot 006｜门外的人

## 基本信息

- 分镜编号：`shot-006`
- 最终图片：`shot-006.png`
- 出场人物：Mark；门外说话者不出镜
- 地点：Mark 的个人游戏工作室
- 时间：上午约 9:00
- 剧情作用：把悬念从窗外大雾转移到关闭的房门，以未知来客结束本段。

## 单一画面

- Mark 站在窗边，刚被门外声音吸引，头部和上身警惕地转向左后方关闭的房门。
- 房门完整、关闭，门缝后没有光影、人形、眼睛、手或其他可见线索。
- Mark 的墨镜仍低落在鼻梁下方，眼睛朝房门方向，疲惫与戒备同时存在。
- 升降桌必须直接靠着右侧窗边，长边与窗户相邻；外接显示器、左侧 MacBook、黑色人体工学椅和展示柜共同建立空间连续性。
- 右侧窗外仍是完全遮蔽世界的灰白大雾。
- 房间内保持冷灰昏暗；不出现门铃设备或第二个人。

## 镜头与光线

- 景别：室内中广景。
- 机位：房间斜前方，能同时看见 Mark、关闭房门，以及直接靠在右侧窗边的升降桌。
- 构图：Mark 位于中右部，房门位于左侧视觉终点；两者之间保持清晰视线通道。
- 动作：只表现 Mark 转头看门的一个瞬间，不表现走向门或开门。
- 光线：右侧窗户冷灰雾光勾勒 Mark，显示器提供微弱蓝光，房门区域较暗但可读。
- 情绪：警惕、困惑、未知来客带来的悬念。

## 输入图片

- Image 1：`../../../art_prompt_library/avatar_prompts/generated/mark-indie-v1.png`，Mark 身份参考，不是编辑目标。
- Image 2：`shot-005.png`，生成时如已确认，用于服装、雾光和工作室连续性。

## 英文后期排版层

1. `Hello?`
   - 位置：左上方或房门上方，白色对白气泡从画面左侧进入。
   - 样式：白色椭圆气泡、黑色墨线边缘、黑色清晰漫画字，保留精确大小写。
   - 气泡尾部：终止在关闭房门外侧方向，不指向 Mark，不暗示门内有人。
2. 最终画面不得出现其他文字。

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

Input images: Image 1 is Mark's identity reference only, not an edit target; preserve his face, hair silhouette, lean build, sunglasses, and stubble while changing to the required cautious turning pose. Image 2, if supplied, is the approved previous panel and serves only as clothing, fog-light, window, and studio-continuity reference.
Primary request: capture the single instant when a voice from outside the closed room door makes Mark turn his head and upper torso sharply away from the fog-filled window toward the door
Scene/backdrop: the same small personal game studio in cold fog-muted morning light; the closed room door is behind and to Mark's left and is clearly visible; the height-adjustable desk is directly beside and against the right-side closed window with no walkway or conspicuous gap between them; one external monitor, the open MacBook fixed on its left, black ergonomic chair, and glass display cabinets remain in their established positions; dense pale-gray fog still completely hides the city beyond the window
Subject: the same lean thirty-year-old Mark standing near the window in his black leather jacket and black shirt; messy near-shoulder-length black hair, light stubble, slightly pale exhausted face, pronounced dark circles, and restrained bloodshot eyes; sunglasses remain low on his nose; his head and upper torso turn toward the closed door with cautious, confused alertness
Style/medium: apply the GLOBAL STYLE LOCK exactly
Composition/framing: one standalone 9:16 portrait panel, interior medium-wide view that keeps Mark in the center-right and the closed door as the left-side visual endpoint; preserve a clear line of sight between Mark and door; reserve a clean upper-left zone above the door for a later off-panel speech balloon
Lighting/mood: cold gray diffuse fog light from the right window outlines Mark, weak cool monitor light remains near the desk, and the door area is darker but readable; suspended silence, caution, and an unresolved visitor
Color palette: cold gray, deep navy, black leather, faint monitor blue, restrained warm skin undertone
Materials/textures: black leather creases, matte painted closed door, cabinet glass, fog-muted window, subtle halftone
Text (verbatim): none
Constraints: exactly one visible person, one head-and-torso turn, and one closed door; the outside speaker remains completely unseen; Mark does not walk, touch the handle, or open the door; preserve the full studio spatial relationship and dense exterior fog; the desk must visibly touch or sit immediately beside the right window
Avoid: every letter, number, Chinese character, caption, speech bubble, sound-effect lettering, visible visitor, silhouette under or through door, face at window, eye at peephole, hand on handle, open door, glowing doorway, doorbell device, ghost, duplicated Mark, extra person, extra door, extra monitor, desk on the opposite wall, walkway between desk and window, logo, watermark
```

## 生成后检查

- [ ] Mark、关闭房门和工作室布局同时清晰可读。
- [ ] 升降桌直接靠在右侧窗边，没有被移到房间另一侧。
- [ ] 门外人物没有任何可见部分或影子。
- [ ] Mark 只是转头，没有走向房门或触碰门把手。
- [ ] 底图无字，后期只加入 `Hello?`。
