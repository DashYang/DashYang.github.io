import { themes } from "./themes.js";

/**
 * Escape HTML special chars to prevent markup injection.
 *
 * @param {string} [s=""] - Input text.
 * @returns {string} Escaped HTML string.
 *
 * @example
 * escapeHtml('<b>x</b>') // => '&lt;b&gt;x&lt;/b&gt;'
 */
function escapeHtml(s = "") {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

/**
 * Convert plain URLs in text to clickable anchors.
 *
 * @param {string} text - Plain text content.
 * @returns {string} HTML with URL anchors.
 *
 * @example
 * linkify('visit https://example.com')
 */
function linkify(text) {
  const escaped = escapeHtml(text);
  return escaped.replace(/(https?:\/\/[^\s<]+)/g, '<a class="inline-link" href="$1" target="_blank" rel="noreferrer">$1</a>');
}

/**
 * Render quote block HTML.
 *
 * @param {{ senderId?: string, timeText?: string, snippet?: string }} q - Quote metadata.
 * @param {{ users: Record<string, { name?: string }> }} profiles - Profile dictionary.
 * @returns {string} Quote HTML.
 *
 * @example
 * renderQuote({ senderId:'alice', snippet:'hello' }, profiles)
 */
function renderQuote(q, profiles) {
  const sender = profiles.users[q.senderId]?.name || q.senderId;
  return `<div class="quote"><div>${escapeHtml(sender)} · ${escapeHtml(q.timeText || "")}</div><div>${escapeHtml(q.snippet || "")}</div></div>`;
}

/**
 * Render message payload content by kind.
 *
 * @param {Record<string, unknown>} m - Message object.
 * @returns {string} Message content HTML.
 *
 * @example
 * renderContent({ kind:'image', imageUrl:'https://...' })
 */
function renderContent(m) {
  if (m.kind === "image") {
    return `<img class="img" src="${escapeHtml(m.imageUrl || "")}" alt="image"/>`;
  }
  if (m.kind === "link-card") {
    const c = m.linkCard || {};
    return `<a class="card" href="${escapeHtml(c.url || "#")}" target="_blank" rel="noreferrer">
      <div class="card-title">${escapeHtml(c.title || c.url || "链接")}</div>
      <div class="card-desc">${escapeHtml(c.desc || "")}</div>
      <div class="card-footer"><span>${escapeHtml(c.site || "")}</span><span>链接卡片</span></div>
    </a>`;
  }
  return `<div>${linkify(m.text || "")}</div>`;
}

/**
 * Render one message row.
 *
 * @param {Record<string, unknown>} m - Message object.
 * @param {{ profiles: { users: Record<string, any> }, chat: { self?: string } }} ctx - Render context.
 * @returns {string} Message row HTML.
 *
 * @example
 * renderMessage(message, { profiles, chat })
 */
function renderMessage(m, ctx) {
  const u = ctx.profiles.users[m.senderId] || { name: m.senderId, avatar: "" };
  const selfId = ctx.chat.self;
  const cls = m.senderId === selfId ? "msg self" : "msg";
  const avatar = `<img class="avatar" src="${escapeHtml(u.avatar || "")}" alt="${escapeHtml(u.name || m.senderId)}"/>`;
  const quote = m.quote ? renderQuote(m.quote, ctx.profiles) : "";
  const bubble = `<div class="bubble">${quote}${renderContent(m)}</div>`;
  const main = `<div class="msg-main"><p class="meta">${escapeHtml(u.name || m.senderId)} · ${escapeHtml(m.timeText)}</p>${bubble}</div>`;
  return `<article class="${cls}">${m.senderId === selfId ? `${main}${avatar}` : `${avatar}${main}`}</article>`;
}

/**
 * Render a single conversation page HTML.
 *
 * @param {{
 *  frontmatter: Record<string, unknown>,
 *  profiles: { users: Record<string, any> },
 *  chat: Record<string, any>,
 *  messages: Array<Record<string, unknown>>
 * }} ctx - Full render context.
 * @returns {string} Full HTML document.
 *
 * @example
 * const html = renderHtml({ frontmatter, profiles, chat, messages })
 */
export function renderHtml(ctx) {
  const themeId = ctx.frontmatter.theme || "wechat";
  const theme = themes[themeId] || themes.wechat;

  const chatTitle = ctx.chat.title || ctx.frontmatter.title || "聊天记录";
  const subtitle = ctx.chat.type === "group"
    ? `群聊 · ${ctx.chat.groupInfo?.name || "未命名群"}`
    : `单聊 · ${ctx.chat.peer || ""}`;

  const messages = ctx.messages.map((m) => renderMessage(m, ctx)).join("\n");

  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(chatTitle)}</title>
  <style>${theme.css}</style>
</head>
<body>
  <main class="chat">
    <header class="header">
      <h1>${escapeHtml(chatTitle)}</h1>
      <p>${escapeHtml(subtitle)}</p>
    </header>
    <section class="timeline">
      ${messages}
    </section>
  </main>
</body>
</html>`;
}
