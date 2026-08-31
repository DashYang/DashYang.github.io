# Square Game · 极速方块

一个浏览器矩形消除游戏：找到四角相同的矩形，点击其中一个角即可消除包含它的最大矩形。支持重力补块、连击和火力全开、自动提示、本地排行榜以及中英文界面。

## 本地运行

在本目录启动静态服务器：

```sh
python3 -m http.server 8000
```

打开 <http://localhost:8000/index.html>。默认中文，英文使用 `index.html?lang=en`。

## 代码结构

- `index.html`：网页入口。
- `square-config.js`：玩法参数与中英文文案。
- `square-tools.js`：消除、补块、计时、交互、排行榜和成绩分享。
- `square-main.js`、`square-ai.js`：游戏主循环与动画逻辑。
- `square.css`、`assets/`、`square-game-logo-v3.png`：界面和图片资源。
- `gmp-engine.1.7.4.js`、`zepto.min.js`：网页使用的引擎与 DOM 库。
- `generate-squaregame-sfx.mjs`、`squaregame-audio.js`：小工具内嵌音效的生成脚本和运行时代码。
- `build-squaregame-minitool.mjs`：小工具打包脚本，输出独立静态资源并移除 Zepto 依赖。

## 小工具打包

需要 Node.js，无需安装 npm 依赖：

```sh
node build-squaregame-minitool.mjs
```

默认输出到 `minitool-square-game/`。脚本不会覆盖已有目录；再次打包时指定一个不存在的输出目录：

```sh
SQUAREGAME_OUTPUT_DIR=releases/SquareGame-local node build-squaregame-minitool.mjs
```

修改音效生成参数后，运行 `node generate-squaregame-sfx.mjs` 更新 `squaregame-audio.js`，再打包。成绩分享需要小红书小工具宿主支持，普通浏览器会显示不可用提示。

构建目录和历史发布包不纳入版本控制。本目录还包含独立的 Noise 故事页面及其资源，不是 Square Game 的启动依赖。
