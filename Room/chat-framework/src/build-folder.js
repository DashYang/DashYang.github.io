import fs from "fs";
import path from "path";
import { loadConversationFromMarkdown } from "./load-conversation.js";
import { buildConversationModels, renderWechatHubHtml } from "./multi-renderer.js";
import { parseSimpleYaml } from "./yaml.js";

/**
 * List markdown files in a folder (non-recursive).
 *
 * @param {string} inputDir - Folder path.
 * @returns {string[]} Absolute markdown file paths.
 *
 * @example
 * listMarkdownFiles('examples/multi')
 */
function listMarkdownFiles(inputDir) {
  return fs
    .readdirSync(inputDir)
    .filter((name) => name.toLowerCase().endsWith(".md"))
    .sort((a, b) => a.localeCompare(b, "zh-CN"))
    .map((name) => path.join(inputDir, name));
}

/**
 * Build a single WeChat-like hub page from all markdown chats in a folder.
 *
 * @param {string} inputDir - Folder containing multiple chat markdown files.
 * @param {string} outputHtml - Output HTML path.
 * @returns {void}
 *
 * @example
 * buildFolder('examples/multi', 'dist/wechat-hub.html')
 */
export function buildFolder(inputDir, outputHtml) {
  const mdFiles = listMarkdownFiles(inputDir);
  if (mdFiles.length === 0) {
    throw new Error(`No markdown files found in folder: ${inputDir}`);
  }

  const conversations = mdFiles.map((mdPath) => loadConversationFromMarkdown(mdPath));
  const models = buildConversationModels(conversations);
  const title = path.basename(inputDir);
  const ui = loadUiConfig(inputDir);
  const html = renderWechatHubHtml({ title, conversations: models, ui });

  fs.mkdirSync(path.dirname(outputHtml), { recursive: true });
  fs.writeFileSync(outputHtml, html, "utf-8");
  console.log(`Built: ${outputHtml}`);
  console.log(`Loaded conversations: ${mdFiles.length}`);
}

/**
 * Load optional UI config YAML from folder.
 * If ui.yml is missing, use renderer defaults.
 *
 * @param {string} inputDir - Source folder.
 * @returns {Record<string, unknown>} UI config object.
 *
 * @example
 * const ui = loadUiConfig('examples/multi')
 */
function loadUiConfig(inputDir) {
  const uiPath = path.join(inputDir, "ui.yml");
  if (!fs.existsSync(uiPath)) return {};
  const text = fs.readFileSync(uiPath, "utf-8");
  const parsed = parseSimpleYaml(text);
  return parsed.ui || {};
}

/**
 * CLI entry for folder build.
 *
 * @returns {void}
 *
 * @example
 * node src/build-folder.js examples/multi dist/wechat-hub.html
 */
function main() {
  try {
    const [inputDir, outputHtml] = process.argv.slice(2);
    if (!inputDir || !outputHtml) {
      console.error("Usage: node src/build-folder.js <input-folder> <output.html>");
      process.exit(1);
    }
    buildFolder(inputDir, outputHtml);
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    console.error(`[build-folder-error] ${reason}`);
    process.exit(1);
  }
}

// Only run main when this file is executed directly (not when imported).
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(__filename)) {
  main();
}
