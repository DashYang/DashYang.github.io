import { parseSimpleYaml } from "./yaml.js";

const HEADER_PREFIX_RE = /^@([\w-]+)(?:\s+#([\w-]+))?(.*)$/;
const ABS_TIME_RE = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}(:\d{2})?$/;
const REL_TIME_RE = /^\+\d+[smhd]$/;

/**
 * Parse one message header line.
 *
 * Supported forms:
 * - @u #m1 [2026-01-01 10:00:00] [quote:m0]
 * - @u [2026-01-01 10:00:00]
 * - @u #m2 [quote:m1]
 * - @u
 *
 * @param {string} line - Trimmed line text.
 * @returns {{ senderId: string, idRaw?: string, timeRaw?: string, tags: string[] } | null}
 */
function parseHeaderLine(line) {
  const m = line.match(HEADER_PREFIX_RE);
  if (!m) return null;

  const [, senderId, idRaw, restRaw] = m;
  const rest = restRaw || "";

  const tags = [];
  const re = /\[([^\]]+)\]/g;
  let hit;
  while ((hit = re.exec(rest))) tags.push(hit[1].trim());

  // Header suffix only allows bracket blocks and spaces.
  const residue = rest.replace(/\[[^\]]+\]/g, "").trim();
  if (residue) return null;

  const first = tags[0];
  const hasTime = first && (ABS_TIME_RE.test(first) || REL_TIME_RE.test(first));
  const timeRaw = hasTime ? first : undefined;
  const pureTags = hasTime ? tags.slice(1) : tags;

  return { senderId, idRaw, timeRaw, tags: pureTags };
}

function nextAutoMessageId(usedIds, autoIdRef) {
  while (usedIds.has(`m${autoIdRef.value}`)) autoIdRef.value += 1;
  const id = `m${autoIdRef.value}`;
  autoIdRef.value += 1;
  return id;
}

function finalizeDraftMessage(drafts, usedIds, autoIdRef, senderId, timeRaw, tags, bodyText, idRaw) {
  if (!bodyText.trim()) return;

  let id = idRaw;
  if (!id) {
    id = nextAutoMessageId(usedIds, autoIdRef);
  }
  if (usedIds.has(id)) {
    throw new Error(`Duplicate message id in markdown parse stage: ${id}`);
  }
  usedIds.add(id);

  let msg = { id, senderId, timeRaw, kind: "text", text: bodyText.trim() };
  if (tags.includes("image")) {
    const imgLines = bodyText.split("\n").map((x) => x.trim()).filter(Boolean);
    const imageUrl = imgLines[0] || "";
    const imageText = imgLines.slice(1).join("\n").trim();
    msg = { ...msg, kind: "image", imageUrl, text: imageText || undefined };
  }
  if (tags.includes("link-card")) {
    msg = { ...msg, kind: "link-card", linkCard: toLinkCard(bodyText), text: undefined };
  }
  if (tags.includes("voice")) {
    const voice = toVoice(bodyText);
    msg = { ...msg, kind: "voice", audioUrl: voice.audioUrl, durationSec: voice.durationSec, text: voice.text };
  }
  if (tags.includes("article")) {
    msg = { ...msg, kind: "article-card", articleCard: toArticleCard(bodyText), text: undefined };
  }
  if (tags.includes("contact-card")) {
    msg = { ...msg, kind: "contact-card", contactCard: toContactCard(bodyText), text: undefined };
  }
  const quoteTag = tags.find((t) => t.startsWith("quote:"));
  if (quoteTag) {
    msg.quote = { messageId: quoteTag.slice("quote:".length) };
  }
  const recallTag = tags.find((t) => t === "recall" || t.startsWith("recall:"));
  if (recallTag) {
    msg.recall = { delayMs: parseRecallDelayMs(recallTag) };
  }
  const heartbeatTag = tags.find((t) => t.startsWith("heartbeat:"));
  if (heartbeatTag) {
    const val = heartbeatTag.slice("heartbeat:".length);
    msg.heartbeat = val === "end" ? 0 : Number(val) || 0;
  }

  drafts.push(enrichAutoLinkCard(msg));
}

function parseCompactTextBlocks(lines, startIndex) {
  const blocks = [];
  let i = startIndex;
  let current = [];

  while (i < lines.length) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();
    if (trimmed && parseHeaderLine(trimmed)) break;

    if (!trimmed) {
      if (current.length) {
        blocks.push(current.join("\n").trim());
        current = [];
      }
      i += 1;
      continue;
    }

    current.push(rawLine);
    i += 1;
  }

  if (current.length) {
    blocks.push(current.join("\n").trim());
  }

  return { blocks: blocks.filter(Boolean), nextIndex: i };
}

function buildCompactTextMessages(drafts, usedIds, autoIdRef, senderId, timeRaw, blocks) {
  blocks.forEach((block, index) => {
    finalizeDraftMessage(
      drafts,
      usedIds,
      autoIdRef,
      senderId,
      index === 0 ? timeRaw : undefined,
      [],
      block
    );
  });
}

/**
 * Parse YAML frontmatter from markdown text.
 *
 * @param {string} raw - Full markdown content.
 * @returns {{ frontmatter: Record<string, unknown>, body: string }}
 * Parsed frontmatter and markdown body.
 *
 * @example
 * parseFrontmatter('---\ntitle: "A"\n---\n@u #m1 [2026-01-01 10:00]\nhi')
 */
function parseFrontmatter(raw) {
  if (!raw.startsWith("---\n")) return { frontmatter: {}, body: raw };
  const end = raw.indexOf("\n---\n", 4);
  if (end === -1) throw new Error("Frontmatter not closed with ---");
  const fm = raw.slice(4, end);
  const body = raw.slice(end + 5);
  return { frontmatter: parseSimpleYaml(fm), body };
}

/**
 * Parse key/value lines into a link-card object.
 *
 * @param {string} body - Message body lines.
 * @returns {{url: string, title?: string, desc?: string, image?: string, site?: string}}
 * Link card object.
 * @throws {Error} If url is missing.
 *
 * @example
 * toLinkCard('url: https://a.com\ntitle: A')
 */
function toLinkCard(body) {
  const card = {};
  for (const line of body.split("\n")) {
    const idx = line.indexOf(":");
    if (idx === -1) continue;
    const k = line.slice(0, idx).trim();
    const v = line.slice(idx + 1).trim();
    if (k) card[k] = v;
  }
  if (!card.url) throw new Error("[link-card] message requires url");
  return card;
}

function toKvMap(body) {
  const out = {};
  for (const line of body.split("\n")) {
    const idx = line.indexOf(":");
    if (idx === -1) continue;
    const k = line.slice(0, idx).trim();
    const v = line.slice(idx + 1).trim();
    if (!k) continue;
    if (v.startsWith("[") && v.endsWith("]")) {
      const inner = v.slice(1, -1).trim();
      out[k] = inner ? inner.split(",").map((x) => x.trim()).filter(Boolean) : [];
    } else {
      out[k] = v;
    }
  }
  return out;
}

function toArticleCard(body) {
  const article = toKvMap(body);
  const refId = article.id || article.ref || article.articleId || "";
  if (!refId && !article.title) throw new Error("[article] message requires id or title");
  return {
    refId,
    title: article.title,
    author: article.author || "",
    cover: article.cover || "",
    summary: article.summary || article.desc || "",
    text: article.text || article.content || "",
    images: Array.isArray(article.images) ? article.images : (article.images ? [article.images] : [])
  };
}

function toContactCard(body) {
  const card = toKvMap(body);
  const refId = card.id || card.ref || card.profileId || card.userId || "";
  if (!refId && !card.name) throw new Error("[contact-card] message requires id/ref or name");
  return {
    refId,
    name: card.name,
    nickName: card.nickName || card.name || "",
    avatar: card.avatar || "",
    bio: card.bio || ""
  };
}

/**
 * Parse duration text to seconds.
 *
 * @param {string} raw - Duration text like "12", "12s", "+12s".
 * @returns {number | null} Seconds or null when invalid.
 */
function parseSeconds(raw) {
  const m = String(raw || "").trim().match(/^\+?(\d+)(s)?$/i);
  if (!m) return null;
  return Number(m[1]);
}

/**
 * Parse voice message body.
 *
 * Supported forms:
 * - first line is URL/path, optional later `duration: 8`
 * - yaml-like:
 *   url: ./a.mp3
 *   duration: 8
 *   text: 语音转写
 *
 * @param {string} bodyText - Message body.
 * @returns {{ audioUrl: string, durationSec?: number, text?: string }}
 */
function toVoice(bodyText) {
  const lines = bodyText.split("\n").map((x) => x.trim()).filter(Boolean);
  if (!lines.length) throw new Error("[voice] message requires audio url/path");

  let audioUrl = "";
  let durationSec;
  const textLines = [];

  if (/^url\s*:/i.test(lines[0])) {
    audioUrl = lines[0].slice(lines[0].indexOf(":") + 1).trim();
  } else {
    audioUrl = lines[0];
  }
  if (!audioUrl) throw new Error("[voice] message requires audio url/path");

  for (let i = 1; i < lines.length; i += 1) {
    const line = lines[i];
    const durationMatch = line.match(/^duration\s*:\s*(.+)$/i);
    if (durationMatch) {
      const sec = parseSeconds(durationMatch[1]);
      if (sec === null) throw new Error(`[voice] invalid duration: ${durationMatch[1]}`);
      durationSec = sec;
      continue;
    }
    const textMatch = line.match(/^text\s*:\s*(.+)$/i);
    if (textMatch) {
      textLines.push(textMatch[1].trim());
      continue;
    }
    textLines.push(line);
  }

  return {
    audioUrl,
    durationSec,
    text: textLines.length ? textLines.join("\n").trim() : undefined
  };
}

/**
 * Parse recall delay from tag text.
 *
 * @param {string} tag - Tag like "recall" or "recall:+10s".
 * @returns {number} Delay milliseconds.
 */
function parseRecallDelayMs(tag) {
  if (tag === "recall") return 0;
  const raw = tag.slice("recall:".length).trim();
  if (!raw) return 0;
  const m = raw.match(/^\+?(\d+)(ms|s|m|h)?$/i);
  if (!m) throw new Error(`[recall] invalid delay: ${raw}`);
  const n = Number(m[1]);
  const unit = (m[2] || "s").toLowerCase();
  const mul = { ms: 1, s: 1000, m: 60_000, h: 3_600_000 };
  return n * mul[unit];
}

/**
 * Convert a pure URL text message into a link-card message.
 *
 * @param {Record<string, unknown>} msg - Draft message object.
 * @returns {Record<string, unknown>} Enriched message.
 *
 * @example
 * enrichAutoLinkCard({ kind: 'text', text: 'https://example.com' })
 */
function enrichAutoLinkCard(msg) {
  if (msg.kind !== "text") return msg;
  const t = (msg.text || "").trim();
  const match = t.match(/^(https?:\/\/\S+)$/);
  if (!match) return msg;
  const url = match[1];
  const host = new URL(url).host;
  return {
    ...msg,
    kind: "link-card",
    linkCard: { url, title: host, desc: url, site: host },
    text: undefined
  };
}

/**
 * Parse chat markdown into frontmatter + message drafts.
 *
 * Message header format:
 * `@sender #messageId [optional-time] [optional-tags...]`
 *
 * @param {string} raw - Full markdown content.
 * @returns {{ frontmatter: Record<string, unknown>, messages: Array<Record<string, unknown>> }}
 * Parsed result.
 * @throws {Error} If message syntax is invalid.
 *
 * @example
 * parseChatMarkdown('@alice #m1 [2026-04-09 10:00:00]\nhello')
 */
export function parseChatMarkdown(raw) {
  const { frontmatter, body } = parseFrontmatter(raw);
  const lines = body.replace(/\r\n/g, "\n").split("\n");
  const drafts = [];
  const usedIds = new Set();
  const autoIdRef = { value: 1 };

  let i = 0;
  while (i < lines.length) {
    const line = lines[i].trim();
    if (!line) {
      i += 1;
      continue;
    }

    const header = parseHeaderLine(line);
    if (!header) throw new Error(`Invalid message header at line ${i + 1}: ${line}`);

    const { senderId, idRaw, timeRaw, tags } = header;
    i += 1;

    const isCompactPlainTextHeader = !idRaw && tags.length === 0;
    if (isCompactPlainTextHeader) {
      const { blocks, nextIndex } = parseCompactTextBlocks(lines, i);
      if (!blocks.length) {
        throw new Error(`Empty compact message block for sender ${senderId} at line ${i}`);
      }
      buildCompactTextMessages(drafts, usedIds, autoIdRef, senderId, timeRaw, blocks);
      i = nextIndex;
      continue;
    }

    const bodyLines = [];
    while (i < lines.length) {
      const nextTrimmed = lines[i].trim();
      if (nextTrimmed && parseHeaderLine(nextTrimmed)) break;
      bodyLines.push(lines[i]);
      i += 1;
    }

    const bodyText = bodyLines.join("\n").trim();
    finalizeDraftMessage(drafts, usedIds, autoIdRef, senderId, timeRaw, tags, bodyText, idRaw);
  }

  return { frontmatter, messages: drafts };
}
