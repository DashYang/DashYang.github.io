#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const outputDir = process.env.SQUAREGAME_OUTPUT_DIR || path.join(scriptDir, "minitool-square-game");
const assetsDir = path.join(outputDir, "assets");

if (fs.existsSync(outputDir)) {
  throw new Error(`Output directory already exists: ${outputDir}`);
}

function readSource(name) {
  return fs.readFileSync(path.join(scriptDir, name), "utf8");
}

function writeAsset(name, content) {
  fs.writeFileSync(path.join(assetsDir, name), content);
}

function releaseTools(source) {
  source = source.replace(
    /function bindTap\(selector, handlers\) \{[\s\S]*?\n\}\n\nfunction flashViewportClear/,
    `function bindTap(selector, handlers) {
  try {
    if (!selector || !handlers || typeof handlers.onTap !== "function") return;
    var elements = document.querySelectorAll(selector);
    var eventName = supportsPointerUp() ? "pointerup" : "touchend";
    elements.forEach(function (element) {
      element.addEventListener(eventName, function (e) {
        if (eventName === "touchend" && typeof handlers.onTouch === "function") {
          handlers.onTouch.call(this, e);
        }
        handlers.onTap.call(this, e, eventName === "pointerup" ? "pointer" : "touch");
      });
      if (eventName !== "pointerup") {
        element.addEventListener("click", function (e) {
          if (typeof handlers.onClick === "function") handlers.onClick.call(this, e);
          handlers.onTap.call(this, e, "click");
        });
      }
    });
  } catch (e) { console.error("[square-tools] caught error", e); }
}

function flashViewportClear`
  );
  source = source.replace(
    /function playClearSfx\(combo\) \{[\s\S]*?\n\}\n\nfunction triggerClearFeedback\(combo\) \{[\s\S]*?\n\}\n/,
    `function playClearSfx(combo) {
  try {
    if (!window.SQUAREGAME_EMBEDDED_AUDIO) return;
    window.SQUAREGAME_EMBEDDED_AUDIO.play(Math.max(1, Number(combo) || 1));
  } catch (e) { console.error("[square-tools] caught error", e); }
}

function triggerClearFeedback(combo) {
  var comboValue = Math.max(1, Number(combo) || 1);
  flashViewportClear(comboValue);
  playClearSfx(comboValue);
  if (
    typeof navigator !== "undefined" &&
    typeof navigator.vibrate === "function"
  ) {
    if (comboValue >= 3) navigator.vibrate([18, 22, 24]);
    else navigator.vibrate(14);
  }
}
`
  );
  source = source.replace(
    '  $("#viewport").remove();',
    '  var viewportElement = document.getElementById("viewport");\n  if (viewportElement) viewportElement.remove();'
  );
  source = source.replace(
    'handleSquareInputById($(this).attr("id"), e);',
    'handleSquareInputById(this.id, e);'
  );
  if (source.includes("$(") || source.includes("AudioContext")) {
    throw new Error("Release transform left an unsupported dependency in square-tools.js");
  }
  return source;
}

const tileAvatarNames = [
  "mark-student-watermelon-v1.png",
  "mark-indie-v1.png",
  "panny-game-v2.png",
  "liuxiaoyu-game-v3.png",
  "liuxiaoyu-v2.png",
  "zhang_jingyi-student-v4.png",
  "zhou_police-v1.png",
  "zack-v5.png",
];

fs.mkdirSync(path.join(assetsDir, "assets"), { recursive: true });

const index = `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
  <meta name="format-detection" content="telephone=no">
  <title>Square Game</title>
  <link rel="icon" type="image/png" href="./assets/game-icon.png">
  <link rel="apple-touch-icon" href="./assets/game-icon.png">
  <link rel="stylesheet" href="./assets/square.css?v=embedded-audio-1">
</head>
<body>
  <div class="container"><div class="row"><div id="gameboard"></div></div></div>
  <script src="./assets/gmp-engine.1.7.4.js"></script>
  <script src="./assets/squaregame-audio.js?v=embedded-audio-1"></script>
  <script src="./assets/square-tools.js?v=embedded-audio-1"></script>
  <script src="./assets/square-config.js"></script>
  <script src="./assets/square-ai.js"></script>
  <script src="./assets/square-main.js"></script>
</body>
</html>
`;

writeAsset("gmp-engine.1.7.4.js", readSource("gmp-engine.1.7.4.js"));
writeAsset("square-tools.js", releaseTools(readSource("square-tools.js")));
writeAsset("square-config.js", readSource("square-config.js"));
writeAsset("square-ai.js", readSource("square-ai.js"));
writeAsset("square-main.js", readSource("square-main.js"));
fs.copyFileSync(path.join(scriptDir, "square-game-logo-v3.png"), path.join(assetsDir, "game-icon.png"));
fs.copyFileSync(path.join(scriptDir, "squaregame-audio.js"), path.join(assetsDir, "squaregame-audio.js"));
writeAsset(
  "square.css",
  `${readSource("square.css")}\n\n/* Mini-tool mobile compatibility. */\nhtml { touch-action: manipulation; }\nbody { -webkit-touch-callout: none; -webkit-tap-highlight-color: transparent; }\n#gameboard {\n  box-sizing: border-box;\n}\n/* The engine gives the controls a fixed 48px canvas height. */\n.help .tutorial {\n  box-sizing: border-box;\n  height: 100%;\n  margin: 0 !important;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  line-height: 1;\n}\n.help .time,\n.help .score {\n  margin: 0 !important;\n  line-height: 1.35;\n}\n`
);

for (const tileAvatarName of tileAvatarNames) {
  fs.copyFileSync(
    path.join(scriptDir, "assets", tileAvatarName),
    path.join(assetsDir, "assets", tileAvatarName)
  );
}
fs.writeFileSync(path.join(outputDir, "index.html"), index);

console.log(`Built ${outputDir}`);
