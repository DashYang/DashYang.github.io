import fs from "fs";
import path from "path";
import { loadConversationFromMarkdown, loadProfiles } from "./load-conversation.js";
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
  const profilesPath = findProfilesPath(inputDir);
  const profiles = profilesPath ? loadProfiles(profilesPath) : null;
  const profileEntries = profiles ? collectConversationEntriesFromProfiles(inputDir, profiles) : [];
  const fallbackMdFiles = listMarkdownFiles(inputDir);
  if (!profileEntries.length && fallbackMdFiles.length === 0) {
    throw new Error(`No chat sources found in folder: ${inputDir}`);
  }

  const sources = profileEntries.length
    ? profileEntries
    : fallbackMdFiles.map((mdPath) => ({ mdPath, selfId: "", chatPath: "", profilePath: profilesPath || "", profiles }));

  const conversations = sources.map((src) => loadConversationFromMarkdown(src.mdPath, {
    selfId: src.selfId || undefined,
    chatPath: src.chatPath || undefined,
    profilePath: src.profilePath || undefined,
    profiles
  }));
  const models = buildConversationModels(conversations);
  const title = path.basename(inputDir);
  const ui = loadUiConfig(inputDir);
  const story = loadStoryConfig(inputDir);
  const html = renderWechatHubHtml({ title, conversations: models, ui, story });

  fs.mkdirSync(path.dirname(outputHtml), { recursive: true });
  fs.writeFileSync(outputHtml, html, "utf-8");
  console.log(`Built: ${outputHtml}`);
  console.log(`Loaded conversations: ${conversations.length}`);
}

function findProfilesPath(inputDir) {
  const dirPath = path.join(inputDir, "profiles");
  if (fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory()) return dirPath;
  const filePath = path.join(inputDir, "profiles.yml");
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) return filePath;
  return "";
}

function collectConversationEntriesFromProfiles(inputDir, profiles) {
  const rows = [];
  for (const [profileId, profile] of Object.entries(profiles.users || {})) {
    const chatFiles = Array.isArray(profile.chatFiles) ? profile.chatFiles : [];
    const groupChats = (profile.groupChats && typeof profile.groupChats === "object") ? profile.groupChats : {};
    for (const raw of chatFiles) {
      const rel = String(raw || "").trim();
      if (!rel) continue;
      const mdPath = path.resolve(inputDir, rel);
      if (!fs.existsSync(mdPath)) {
        throw new Error(`[profile:${profileId}] chat file not found: ${rel}`);
      }
      const mapped = groupChats[rel] || groupChats[path.basename(rel)] || "";
      const chatPath = mapped ? path.resolve(inputDir, String(mapped)) : "";
      if (chatPath && !fs.existsSync(chatPath)) {
        throw new Error(`[profile:${profileId}] group chat yml not found: ${mapped}`);
      }
      rows.push({ mdPath, selfId: profileId, chatPath });
    }
  }
  return rows;
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

function loadStoryConfig(inputDir) {
  const storyPath = path.join(inputDir, "story.yml");
  if (!fs.existsSync(storyPath)) return {};
  const text = fs.readFileSync(storyPath, "utf-8");
  const parsed = parseSimpleYaml(text);
  return parsed.story || {};
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
      console.error("Folder-build root semantics: profiles/, profiles.yml, ui.yml, story.yml, chatFiles, and groupChats resolve from the provided inputDir.");
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
