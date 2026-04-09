import fs from "fs";
import path from "path";
import { parseSimpleYaml } from "./yaml.js";
import { parseChatMarkdown } from "./parser.js";
import { resolveQuotes, resolveTimes } from "./time.js";

/**
 * Read UTF-8 text from disk.
 *
 * @param {string} filePath - Absolute or relative file path.
 * @returns {string} File content.
 *
 * @example
 * const text = readText('/tmp/a.md')
 */
export function readText(filePath) {
  return fs.readFileSync(filePath, "utf-8");
}

/**
 * Validate sender IDs and message IDs in one conversation.
 *
 * @param {Array<Record<string, unknown>>} messages - Parsed messages.
 * @param {{ users?: Record<string, unknown> }} profiles - Profiles config.
 * @returns {void}
 * @throws {Error} When duplicate ids or unknown sender exists.
 *
 * @example
 * validateMessages(messages, profiles)
 */
export function validateMessages(messages, profiles) {
  const ids = new Set();
  for (const m of messages) {
    if (ids.has(m.id)) throw new Error(`Duplicate message id: ${m.id}`);
    ids.add(m.id);
    if (!profiles.users?.[m.senderId]) {
      throw new Error(`Unknown sender: ${m.senderId}`);
    }
  }
}

/**
 * Load one markdown chat file with linked YAML config and normalized messages.
 *
 * @param {string} markdownPath - Path to chat markdown file.
 * @returns {{
 *   sourceFile: string,
 *   frontmatter: Record<string, unknown>,
 *   profiles: Record<string, unknown>,
 *   chat: Record<string, unknown>,
 *   messages: Array<Record<string, unknown>>
 * }} Full conversation payload.
 *
 * @example
 * const conv = loadConversationFromMarkdown('examples/chat.md')
 */
export function loadConversationFromMarkdown(markdownPath) {
  const rootDir = path.dirname(markdownPath);
  const md = readText(markdownPath);
  const parsed = parseChatMarkdown(md);

  const profilePath = path.resolve(rootDir, parsed.frontmatter.profiles || "profiles.yml");
  const chatPath = path.resolve(rootDir, parsed.frontmatter.chat || "chat.yml");

  const profiles = parseSimpleYaml(readText(profilePath));
  const chatWrap = parseSimpleYaml(readText(chatPath));
  const chat = chatWrap.chat || {};

  validateMessages(parsed.messages, profiles);
  const withTime = resolveTimes(parsed.messages);
  const messages = resolveQuotes(withTime);

  return {
    sourceFile: markdownPath,
    frontmatter: parsed.frontmatter,
    profiles,
    chat,
    messages
  };
}
