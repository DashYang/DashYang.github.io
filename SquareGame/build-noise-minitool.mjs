import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const sourceHtmlPath = path.join(scriptDir, "Noise.html");
const sourceAssetsDir = path.join(scriptDir, "assets");
const embeddedAudioPath = path.join(scriptDir, "noise-audio.js");
const outputDir = process.env.NOISE_OUTPUT_DIR
  ? path.resolve(process.env.NOISE_OUTPUT_DIR)
  : path.join(scriptDir, "minitool-noise");
const outputAssetsDir = path.join(outputDir, "assets");
const avatarCacheDir = process.env.NOISE_AVATAR_CACHE || "/tmp/noise-avatar-cache";

const oversizedAvatarNames = new Set([
  "dushiwang-v1.png",
  "qinguangwang-v1.png",
  "taishanwang-v1.png",
  "yanluowang-v1.png",
  "wo-v1.png",
]);

function replaceOnce(source, search, replacement, label) {
  if (!source.includes(search)) {
    throw new Error(`Unable to locate ${label}`);
  }
  return source.replace(search, replacement);
}

function transformString(value) {
  return value
    .replace(
      /https:\/\/picsum\.photos\/seed\/([A-Za-z0-9-]+)\/100\/100/g,
      "./assets/avatar-$1.jpg",
    )
    .replace(
      /(?:profiles|mark|police|group|sister|zack|articles)\/assets\/([A-Za-z0-9._-]+)/g,
      "./assets/$1",
    )
    .replace(/\.\/assets\/mark-v1\.png/g, "./assets/mark-indie-v1.png")
    .replace(/https:\/\/www\.squaregamezz\.site\//g, "");
}

function transformData(value) {
  if (typeof value === "string") return transformString(value);
  if (Array.isArray(value)) return value.map(transformData);
  if (value && typeof value === "object") {
    const transformed = Object.fromEntries(
      Object.entries(value).map(([key, child]) => [key, transformData(child)]),
    );
    if (transformed.audioUrl === "./assets/noise.mp3") {
      delete transformed.audioUrl;
      transformed.audioId = "noise-recording";
      transformed.durationSec = 10;
    }
    return transformed;
  }
  return value;
}

function copyAssets() {
  const sourceNames = fs
    .readdirSync(sourceAssetsDir)
    .filter((name) => !name.startsWith(".") && name !== "noise.mp3");

  for (const name of sourceNames) {
    const sourcePath = path.join(sourceAssetsDir, name);
    const outputPath = path.join(outputAssetsDir, name);
    fs.copyFileSync(sourcePath, outputPath);

    if (oversizedAvatarNames.has(name)) {
      const result = spawnSync(
        "/usr/bin/sips",
        ["--resampleHeightWidth", "100", "100", outputPath],
        { encoding: "utf8" },
      );
      if (result.status !== 0) {
        throw new Error(`Failed to resize ${name}: ${result.stderr || result.stdout}`);
      }
    }
  }

  const remoteAvatarNames = fs
    .readdirSync(avatarCacheDir)
    .filter((name) => /^avatar-[A-Za-z0-9-]+\.jpg$/.test(name));
  if (remoteAvatarNames.length !== 32) {
    throw new Error(`Expected 32 cached remote avatars, found ${remoteAvatarNames.length}`);
  }
  for (const name of remoteAvatarNames) {
    fs.copyFileSync(path.join(avatarCacheDir, name), path.join(outputAssetsDir, name));
  }
}

if (fs.existsSync(outputDir)) {
  throw new Error(`Output already exists: ${outputDir}`);
}

const sourceHtml = fs.readFileSync(sourceHtmlPath, "utf8");
const scriptsMatch = sourceHtml.match(
  /<script id="chat-data" type="application\/json">([\s\S]*?)<\/script>\s*<script>([\s\S]*?)<\/script>/,
);
if (!scriptsMatch) throw new Error("Unable to extract inline data and application scripts");

const data = transformData(JSON.parse(scriptsMatch[1]));
let appJs = scriptsMatch[2];
appJs = replaceOnce(
  appJs,
  "const payload = JSON.parse(document.getElementById('chat-data').textContent);",
  "const payload = window.NOISE_CHAT_DATA;",
  "chat-data bootstrap",
);
appJs = replaceOnce(
  appJs,
  `return escaped.replace(/(https?:\\/\\/[^\\s<]+)/g, '<a class="inline-link" href="$1" target="_blank" rel="noreferrer">$1</a>');`,
  "return escaped;",
  "plain-text linkifier",
);
appJs = replaceOnce(
  appJs,
  `if (/^(https?:)?\\/\\//i.test(value) || value.startsWith('/') || value.startsWith('./') || value.startsWith('../')) return value;`,
  `if (value.startsWith('./') || value.startsWith('../')) return value;`,
  "Markdown URL policy",
);
appJs = replaceOnce(
  appJs,
  `'<a href="' + esc(safeMarkdownUrl(url)) + '" target="_blank" rel="noreferrer">' + text + '</a>'`,
  `'<span class="inline-link">' + text + '</span>'`,
  "Markdown link renderer",
);
appJs = replaceOnce(
  appJs,
  `return '<a class="card" href="' + esc(c.url || '#') + '" target="_blank" rel="noreferrer">'
          + '<div class="card-title">' + esc(c.title || c.url || '链接') + '</div>'
          + '<div class="card-desc">' + esc(c.desc || '') + '</div>'
          + '<div class="card-footer"><span>' + esc(c.site || '') + '</span><span>链接卡片</span></div>'
          + '</a>';`,
  `return '<div class="card offline-card" role="note">'
          + '<div class="card-title">' + esc(c.title || '链接') + '</div>'
          + '<div class="card-desc">' + esc(c.desc || '') + '</div>'
          + '<div class="card-footer"><span>' + esc(c.site || '') + '</span><span>离线内容</span></div>'
          + '</div>';`,
  "external link card renderer",
);
appJs = replaceOnce(
  appJs,
  `activeAudio.pause();`,
  `if (typeof activeAudio.stop === 'function') activeAudio.stop();
        else if (typeof activeAudio.pause === 'function') activeAudio.pause();`,
  "embedded audio stop handler",
);
appJs = replaceOnce(
  appJs,
  `data-audio-url="' + esc(msg.audioUrl || '') + '"`,
  `data-audio-id="' + esc(msg.audioId || '') + '"`,
  "embedded audio message renderer",
);
appJs = replaceOnce(
  appJs,
  `const src = voiceBtn.dataset.audioUrl || '';
        if (!src) return;`,
  `const audioId = voiceBtn.dataset.audioId || '';
        if (!audioId || !window.NOISE_EMBEDDED_AUDIO) return;`,
  "embedded audio click lookup",
);
appJs = replaceOnce(
  appJs,
  `activeAudio = new Audio(src);
        activeVoiceBtn = voiceBtn;
        setVoiceState(voiceBtn, true);
        activeAudio.addEventListener('ended', stopActiveAudio);
        activeAudio.play().catch(() => stopActiveAudio());`,
  `activeVoiceBtn = voiceBtn;
        setVoiceState(voiceBtn, true);
        try {
          activeAudio = window.NOISE_EMBEDDED_AUDIO.play(audioId, stopActiveAudio);
        } catch (_) {
          stopActiveAudio();
        }`,
  "embedded audio playback",
);

let indexHtml = sourceHtml.replace(scriptsMatch[0], [
  '<script src="./assets/data.js"></script>',
  '<script src="./assets/noise-audio.js"></script>',
  '<script src="./assets/app.js"></script>',
].join("\n  "));
indexHtml = indexHtml.replace(/^<!doctype html>/i, "<!DOCTYPE html>");
indexHtml = indexHtml.replace(
  '<meta name="viewport" content="width=device-width, initial-scale=1.0" />',
  '<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />',
);
const compatibilityCss = `
    :root {
      --xhs-native-toolbar-height: 46px;
      --xhs-shell-top: calc(
        var(--safe-area-inset-top, env(safe-area-inset-top, 0px))
        + var(--xhs-native-toolbar-height)
      );
    }
    html { touch-action: manipulation; }
    body { -webkit-touch-callout: none; -webkit-tap-highlight-color: transparent; }
    img { max-width: 100%; }
    .phone {
      height: 100dvh;
      padding-top: var(--xhs-shell-top);
    }
    .status-bar {
      display: flex;
      flex: 0 0 26px;
    }
    .article-modal {
      top: calc(var(--xhs-shell-top) + 26px);
    }
    .article-header {
      box-sizing: border-box;
      height: 46px;
      padding: 0 10px;
    }
    .tabbar {
      height: calc(56px + var(--safe-area-inset-bottom, env(safe-area-inset-bottom, 0px)));
      padding-bottom: var(--safe-area-inset-bottom, env(safe-area-inset-bottom, 0px));
    }
    .list-scroll, .moments-scroll, .contacts-scroll, .account-list-wrap, .timeline {
      -webkit-overflow-scrolling: touch;
      overscroll-behavior-y: contain;
    }
    .offline-card { cursor: default; }
`;
indexHtml = indexHtml.replace("  </style>", `${compatibilityCss}  </style>`);
if (!indexHtml.endsWith("\n")) indexHtml += "\n";

fs.mkdirSync(outputAssetsDir, { recursive: true });
copyAssets();
fs.copyFileSync(embeddedAudioPath, path.join(outputAssetsDir, "noise-audio.js"));
fs.writeFileSync(path.join(outputDir, "index.html"), indexHtml);
fs.writeFileSync(
  path.join(outputAssetsDir, "data.js"),
  `window.NOISE_CHAT_DATA = ${JSON.stringify(data)};\n`,
);
fs.writeFileSync(path.join(outputAssetsDir, "app.js"), `${appJs.trim()}\n`);

console.log(`Built ${outputDir}`);
