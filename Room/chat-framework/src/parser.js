import { parseSimpleYaml } from "./yaml.js";

const HEADER_RE = /^@([\w-]+)\s+#([\w-]+)\s+\[([^\]]+)\](.*)$/;

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
 * Parse trailing bracket tags from a message header.
 *
 * @param {string} rest - Header suffix like "[image] [quote:m1]".
 * @returns {string[]} Tag list.
 *
 * @example
 * parseTags(' [image] [quote:m1]') // => ['image', 'quote:m1']
 */
function parseTags(rest) {
  const tags = [];
  const re = /\[([^\]]+)\]/g;
  let m;
  while ((m = re.exec(rest))) tags.push(m[1].trim());
  return tags;
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
 * `@sender #messageId [time] [optional-tags...]`
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

  let i = 0;
  while (i < lines.length) {
    const line = lines[i].trim();
    if (!line) {
      i += 1;
      continue;
    }

    const h = line.match(HEADER_RE);
    if (!h) throw new Error(`Invalid message header at line ${i + 1}: ${line}`);

    const [, senderId, id, timeRaw, rest] = h;
    const tags = parseTags(rest);
    i += 1;

    const bodyLines = [];
    while (i < lines.length && !lines[i].trim().match(HEADER_RE)) {
      bodyLines.push(lines[i]);
      i += 1;
    }

    const bodyText = bodyLines.join("\n").trim();

    let msg = { id, senderId, timeRaw, kind: "text", text: bodyText };
    if (tags.includes("image")) {
      msg = { ...msg, kind: "image", imageUrl: bodyText, text: undefined };
    }
    if (tags.includes("link-card")) {
      msg = { ...msg, kind: "link-card", linkCard: toLinkCard(bodyText), text: undefined };
    }
    const quoteTag = tags.find((t) => t.startsWith("quote:"));
    if (quoteTag) {
      msg.quote = { messageId: quoteTag.slice("quote:".length) };
    }

    drafts.push(enrichAutoLinkCard(msg));
  }

  return { frontmatter, messages: drafts };
}
