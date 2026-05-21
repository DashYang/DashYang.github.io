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
export function validateMessages(messages, profiles, context = {}) {
  const ids = new Set();
  for (const m of messages) {
    if (ids.has(m.id)) throw new Error(`Duplicate message id: ${m.id}`);
    ids.add(m.id);
    if (!profiles.users?.[m.senderId]) {
      throw new Error(buildUnknownSenderMessage(m.senderId, profiles, context));
    }
  }
}

function formatPathForError(filePath) {
  if (!filePath) return "";
  const rel = path.relative(process.cwd(), filePath);
  if (!rel || rel.startsWith("..")) return filePath;
  return rel;
}

function buildUnknownSenderMessage(senderId, profiles, context = {}) {
  const knownSenderIds = Object.keys(profiles.users || {}).sort((a, b) => a.localeCompare(b, "zh-CN"));
  const shownSenderIds = knownSenderIds.slice(0, 8);
  const suffix = knownSenderIds.length > shownSenderIds.length ? ", ..." : "";
  const profilePath = context.profilePath ? formatPathForError(context.profilePath) : "the configured profiles source";
  const profileSource = context.profileIsDirectory
    ? `profile file names in ${profilePath}`
    : `profile ids in ${profilePath}`;
  const fixHint = context.profileIsDirectory
    ? `Fix: add a profile file named "${senderId}.yml" in ${profilePath}, or change the markdown sender id to an existing profile id.`
    : `Fix: add a profile entry keyed by "${senderId}" in ${profilePath}, or change the markdown sender id to an existing profile id.`;
  const knownHint = shownSenderIds.length
    ? ` Known sender ids: ${shownSenderIds.join(", ")}${suffix}`
    : "";
  return `Unknown sender "${senderId}". Sender ids must match ${profileSource}. ${fixHint}${knownHint}`;
}

function parseIdentityReference(raw) {
  if (!raw) return null;
  const text = String(raw).trim();
  if (!text) return null;
  const normalized = /^\d{4}-\d{2}-\d{2}$/.test(text)
    ? `${text}T00:00:00`
    : text.replace(" ", "T");
  const time = new Date(normalized).getTime();
  return Number.isNaN(time) ? null : time;
}

function normalizeIdentityTimeline(timeline) {
  const out = [];
  for (const [effectiveAt, identity] of Object.entries(timeline || {})) {
    if (!identity || typeof identity !== "object" || Array.isArray(identity)) continue;
    const effectiveAtMs = parseIdentityReference(effectiveAt);
    if (effectiveAtMs === null) continue;
    out.push({
      effectiveAt,
      effectiveAtMs,
      name: Object.prototype.hasOwnProperty.call(identity, "name") ? String(identity.name || "") : undefined,
      bio: Object.prototype.hasOwnProperty.call(identity, "bio") ? String(identity.bio || "") : undefined
    });
  }
  out.sort((a, b) => a.effectiveAtMs - b.effectiveAtMs);
  return out;
}

function hasNonEmptyIdentityTimeline(timeline) {
  if (!timeline) return false;
  if (Array.isArray(timeline)) return timeline.length > 0;
  if (typeof timeline !== "object") return false;
  return Object.keys(timeline).length > 0;
}

function validateRawProfile(id, profile) {
  if (!profile || typeof profile !== "object" || Array.isArray(profile)) return;
  if (Object.prototype.hasOwnProperty.call(profile, "name") && hasNonEmptyIdentityTimeline(profile.identityTimeline)) {
    throw new Error(`Profile "${id}" violates the exclusivity rule: profile.name and identityTimeline cannot coexist.`);
  }
}

export function resolveProfileIdentity(user, referenceTime) {
  const refMs = parseIdentityReference(referenceTime) ?? Date.now();
  let name = user?.name || user?.id || "";
  let bio = user?.bio || "";
  const timeline = Array.isArray(user?.identityTimeline) ? user.identityTimeline : [];
  for (const entry of timeline) {
    if (!entry || typeof entry !== "object") continue;
    if (typeof entry.effectiveAtMs !== "number" || entry.effectiveAtMs > refMs) continue;
    if (entry.name !== undefined) name = entry.name;
    if (entry.bio !== undefined) bio = entry.bio;
  }
  return { name, bio };
}

function normalizeUserProfile(id, parsed) {
  const profile = parsed.profile || parsed || {};
  validateRawProfile(id, profile);
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
    identityTimeline: normalizeIdentityTimeline(profile.identityTimeline),
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
    text: article.markdown || article.body || article.text || article.content || "",
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
    const profileStat = fs.statSync(profilePath);
    const articles = loadArticlesFromDirectory(articlesPath);
    const chatWrap = chatPath ? parseSimpleYaml(readText(chatPath)) : {};
    const chat = normalizeChat(chatWrap.chat || {}, parsed.messages, profiles, options.selfId);

    validateMessages(parsed.messages, profiles, {
      profilePath,
      profileIsDirectory: profileStat.isDirectory()
    });
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
    throw new Error(`[${formatPathForError(markdownPath)}] ${reason}`);
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
