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

function normalizeUserProfile(id, parsed) {
  const profile = parsed.profile || {};
  const officialArticles = profile.officialArticles || {};
  const articleRefs = Array.isArray(officialArticles)
    ? officialArticles.map((x) => String(x))
    : Object.keys(officialArticles).map((x) => String(x));
  return {
    name: profile.name || id,
    id,
    avatar: profile.avatar || "",
    bio: profile.bio || "",
    nickName: profile.nickName || profile.name || id,
    aliases: {
      selfInGroups: profile.aliases?.selfInGroups || {},
      contacts: profile.aliases?.contacts || {}
    },
    moments: profile.moments || {},
    officialArticles: articleRefs,
    chatFiles: Array.isArray(profile.chatFiles) ? profile.chatFiles.map((x) => String(x)) : [],
    groupChats: profile.groupChats || {}
  };
}

function normalizeArticle(id, parsed) {
  const article = parsed.article || {};
  const images = Array.isArray(article.images) ? article.images : (article.images ? [article.images] : []);
  return {
    id,
    title: article.title || id,
    author: article.author || "",
    publishAt: article.publishAt || article.time || "",
    cover: article.cover || "",
    summary: article.summary || article.desc || "",
    text: article.text || article.content || "",
    images
  };
}

function loadProfilesFromDirectory(dirPath) {
  const users = {};
  const files = fs
    .readdirSync(dirPath)
    .filter((name) => /\.(ya?ml)$/i.test(name))
    .sort((a, b) => a.localeCompare(b, "zh-CN"));

  for (const fileName of files) {
    const id = fileName.replace(/\.(ya?ml)$/i, "");
    const parsed = parseSimpleYaml(readText(path.join(dirPath, fileName)));
    users[id] = normalizeUserProfile(id, parsed);
  }

  return { users };
}

export function loadProfiles(profilePath) {
  const stat = fs.statSync(profilePath);
  if (stat.isDirectory()) {
    return loadProfilesFromDirectory(profilePath);
  }

  const parsed = parseSimpleYaml(readText(profilePath));
  const usersRaw = parsed.users || parsed;
  const users = {};
  for (const [id, profile] of Object.entries(usersRaw || {})) {
    users[id] = normalizeUserProfile(id, profile);
  }
  return { users };
}

function loadArticlesFromDirectory(dirPath) {
  if (!fs.existsSync(dirPath)) return {};
  const stat = fs.statSync(dirPath);
  if (!stat.isDirectory()) return {};
  const articles = {};
  const files = fs
    .readdirSync(dirPath)
    .filter((name) => /\.(ya?ml)$/i.test(name))
    .sort((a, b) => a.localeCompare(b, "zh-CN"));

  for (const fileName of files) {
    const id = fileName.replace(/\.(ya?ml)$/i, "");
    const parsed = parseSimpleYaml(readText(path.join(dirPath, fileName)));
    articles[id] = normalizeArticle(id, parsed);
  }
  return articles;
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
export function loadConversationFromMarkdown(markdownPath, options = {}) {
  try {
    const rootDir = path.dirname(markdownPath);
    const md = readText(markdownPath);
    const parsed = parseChatMarkdown(md);

    const profilePath = options.profilePath
      ? path.resolve(options.profilePath)
      : path.resolve(rootDir, parsed.frontmatter.profiles || "profiles.yml");
    const chatPath = options.chatPath
      ? path.resolve(options.chatPath)
      : (parsed.frontmatter.chat ? path.resolve(rootDir, parsed.frontmatter.chat) : "");

    const articlesPath = options.articlesPath
      ? path.resolve(options.articlesPath)
      : path.resolve(rootDir, parsed.frontmatter.articles || "articles");
    const profiles = options.profiles || loadProfiles(profilePath);
    const articles = loadArticlesFromDirectory(articlesPath);
    const chatWrap = chatPath ? parseSimpleYaml(readText(chatPath)) : {};
    const chat = normalizeChat(chatWrap.chat || {}, parsed.messages, profiles, options.selfId);

    validateMessages(parsed.messages, profiles);
    const withTime = resolveTimes(parsed.messages);
    const messages = resolveQuotes(withTime);

    return {
      sourceFile: markdownPath,
      frontmatter: parsed.frontmatter,
      profiles,
      articles,
      chat,
      messages
    };
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    throw new Error(`[${markdownPath}] ${reason}`);
  }
}

function normalizeChat(chat, messages, profiles, selfId) {
  const out = { ...chat };
  const participants = Array.from(new Set(messages.map((m) => String(m.senderId))));
  const inferredType = participants.length > 2 ? "group" : "single";
  const type = out.type || inferredType;
  out.type = type;
  out.self = out.self || selfId || "";
  if (!out.self) throw new Error("chat.self is required (or provide selfId from profile)");
  if (!profiles.users?.[out.self]) throw new Error(`chat.self not found in profiles: ${out.self}`);
  if (!participants.includes(out.self)) {
    throw new Error(`chat.self is not a sender in messages: ${out.self}`);
  }

  if (type === "single") {
    const peers = participants.filter((id) => id !== out.self);
    out.peer = peers[0] || out.self;
    if (peers.length > 1) {
      throw new Error(`single chat can only contain one peer, got: ${peers.join(", ")}`);
    }
    if (!out.title) {
      const selfProfile = profiles.users?.[out.self] || {};
      out.title = selfProfile.aliases?.contacts?.[out.peer] || profiles.users?.[out.peer]?.name || out.peer;
    }
  } else {
    if (!out.title) throw new Error("group chat requires chat.title");
    const groupAvatar = out.groupInfo?.avatar || out.avatar || "";
    out.groupInfo = { avatar: groupAvatar };
  }

  return out;
}
