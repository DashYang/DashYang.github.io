/**
 * Escape HTML special chars.
 *
 * @param {string} [s=""] - Input text.
 * @returns {string} Escaped text.
 *
 * @example
 * escapeHtml('<x>') // => '&lt;x&gt;'
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
 * Build a short message preview text for list cards.
 *
 * @param {Record<string, unknown>} message - Message object.
 * @returns {string} Preview text.
 *
 * @example
 * toSnippet({ kind: 'image' }) // => '[图片]'
 */
function toSnippet(message, articles, profiles) {
  if (!message) return "";
  if (message.recall) return "[消息已撤回]";
  if (message.kind === "image") return "[图片]";
  if (message.kind === "voice") return `[语音] ${message.durationSec ? `${message.durationSec}"` : ""}`.trim();
  if (message.kind === "article-card") {
    const raw = message.articleCard || {};
    const title = raw.title || (raw.refId ? (articles?.[raw.refId]?.title || "") : "");
    return `[文章] ${title}`.trim();
  }
  if (message.kind === "contact-card") {
    const raw = message.contactCard || {};
    const name = raw.name || (raw.refId ? (profiles?.users?.[raw.refId]?.name || raw.refId) : "");
    return `[名片] ${name}`.trim();
  }
  if (message.kind === "link-card") {
    const title = message.linkCard?.title || message.linkCard?.url || "链接";
    return `[链接] ${title}`;
  }
  const txt = (message.text || "").replace(/\s+/g, " ").trim();
  return txt.length > 60 ? `${txt.slice(0, 60)}...` : txt;
}

/**
 * Extract a list-friendly time text from full timestamp text.
 *
 * @param {string} [timeText] - Full text like "2026-04-09 10:03".
 * @returns {string} Short text for list, usually "10:03".
 *
 * @example
 * toListTime('2026-04-09 10:03') // => '10:03'
 */
function toListTime(timeText) {
  if (!timeText) return "";
  const parts = String(timeText).split(" ");
  return parts[1] || parts[0] || "";
}

/**
 * Find the first message sent by others (non-self), fallback to first message.
 *
 * @param {Array<Record<string, unknown>>} messages - Conversation messages.
 * @param {string | undefined} selfId - Current self sender id.
 * @returns {{ index: number, message: Record<string, unknown> | null }}
 * Start index and message.
 *
 * @example
 * findStartMessage(messages, 'alice')
 */
function findStartMessage(messages, selfId) {
  if (!messages.length) return { index: 0, message: null };
  if (!selfId) return { index: 0, message: messages[0] };
  const idx = messages.findIndex((m) => m.senderId !== selfId);
  if (idx === -1) return { index: 0, message: messages[0] };
  return { index: idx, message: messages[idx] };
}

/**
 * Convert loaded conversations into UI-ready view models.
 *
 * @param {Array<Record<string, unknown>>} conversations - Loaded conversation payloads.
 * @returns {Array<Record<string, unknown>>} View models for browser runtime.
 *
 * @example
 * const models = buildConversationModels([conv1, conv2])
 */
export function buildConversationModels(conversations) {
  return conversations.map((conv, index) => {
    const selfId = conv.chat?.self;
    const { index: startIndex, message: startMessage } = findStartMessage(conv.messages, selfId);
    const startSender = startMessage ? conv.profiles.users?.[startMessage.senderId] : null;
    const avatar = conv.chat?.type === "group"
      ? (conv.chat?.groupInfo?.avatar || conv.chat?.avatar || startSender?.avatar || "")
      : (startSender?.avatar || conv.chat?.avatar || "");

    const subtitle = conv.chat?.type === "group"
      ? (conv.chat?.title || "未命名群")
      : (conv.profiles.users?.[conv.chat?.peer]?.name || conv.chat?.peer || "单聊");

    const listTimeSource = conv.messages.length
      ? conv.messages[conv.messages.length - 1].timeText
      : "";

    return {
      id: `conv-${index + 1}`,
      title: conv.chat?.title || conv.frontmatter?.title || `会话 ${index + 1}`,
      subtitle,
      avatar,
      self: selfId || "",
      preview: toSnippet(startMessage, conv.articles, conv.profiles),
      listTime: toListTime(listTimeSource),
      startIndex,
      chat: conv.chat || {},
      profiles: conv.profiles,
      articles: conv.articles || {},
      messages: conv.messages
    };
  });
}

/**
 * Serialize data safely into an HTML script tag.
 *
 * @param {unknown} data - Serializable payload.
 * @returns {string} JSON text safe for embedding in HTML.
 *
 * @example
 * const text = safeJson({ a: 1 })
 */
function safeJson(data) {
  return JSON.stringify(data)
    .replaceAll("<", "\\u003c")
    .replaceAll(">", "\\u003e")
    .replaceAll("&", "\\u0026");
}

/**
 * Shared HeartbeatEngine runtime JS — used by both hub and story pages.
 * bpmMap defines the BPM for each level: 0=normal, 1/2/3=increasing pace.
 */
const HEARTBEAT_ENGINE_JS = `const heartbeatEngine = (function() {
      let audioCtx = null;
      let intervalId = null;
      let currentLevel = 0;
      const bpmMap = { 0: 10, 1: 65, 2: 75, 3: 90 };

      function ensureContext() {
        if (!audioCtx) {
          audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        return audioCtx;
      }

      function playBeat() {
        const ctx = ensureContext();
        if (ctx.state === 'suspended') {
          ctx.resume().catch(() => {});
        }
        const now = ctx.currentTime;

        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(50, now);
        osc1.frequency.exponentialRampToValueAtTime(60, now + 0.05);
        osc1.frequency.exponentialRampToValueAtTime(30, now + 0.12);
        gain1.gain.setValueAtTime(0, now);
        gain1.gain.linearRampToValueAtTime(0.25, now + 0.02);
        gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        osc1.connect(gain1);
        gain1.connect(ctx.destination);
        osc1.start(now);
        osc1.stop(now + 0.16);

        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(55, now + 0.18);
        osc2.frequency.exponentialRampToValueAtTime(65, now + 0.23);
        osc2.frequency.exponentialRampToValueAtTime(35, now + 0.30);
        gain2.gain.setValueAtTime(0, now + 0.18);
        gain2.gain.linearRampToValueAtTime(0.20, now + 0.20);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.33);
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.start(now + 0.18);
        osc2.stop(now + 0.34);
      }

      function restartInterval(bpm) {
        if (intervalId) { clearInterval(intervalId); intervalId = null; }
        playBeat();
        intervalId = setInterval(playBeat, 60000 / bpm);
      }

      function start() {
        if (intervalId) return;
        ensureContext();
        currentLevel = 0;
        restartInterval(bpmMap[0]);
      }

      function stop() {
        if (intervalId) { clearInterval(intervalId); intervalId = null; }
      }

      function setLevel(n) {
        if (!intervalId) return;
        const num = Number(n);
        if (isNaN(num)) return;
        currentLevel = num;
        restartInterval(bpmMap[num] || bpmMap[0]);
      }

      function reset() {
        if (intervalId) { setLevel(0); }
      }

      function isRunning() {
        return !!intervalId;
      }

      return { start, stop, setLevel, reset, isRunning };
    })();`;

/**
 * Merge UI defaults with user config.
 *
 * @param {Record<string, unknown> | undefined} ui - Optional ui config from YAML.
 * @returns {Record<string, unknown>} Normalized UI config.
 */
function normalizeUi(ui) {
  const source = ui || {};
  return {
    statusBar: {
      carrier: source.statusBar?.carrier || "中国移动",
      time: source.statusBar?.time || "12:21",
      battery: source.statusBar?.battery || "31%"
    },
    topTitle: source.topTitle || "微信",
    theme: source.theme || "wechat",
    persistKey: source.persistKey || "chat_framework_seen_v1"
  };
}

/**
 * Render one HTML document that contains a WeChat-like multi-chat interface.
 *
 * @param {{
 *   title?: string,
 *   conversations: Array<Record<string, unknown>>,
 *   ui?: Record<string, unknown>
 * }} input - Render input.
 * @returns {string} Full HTML document.
 *
 * @example
 * const html = renderWechatHubHtml({ title: '聊天', conversations: models, ui })
 */
export function renderWechatHubHtml(input) {
  const ui = normalizeUi(input.ui);
  const appTitle = input.title || "微信";
  const payload = safeJson({
    title: appTitle,
    conversations: input.conversations || [],
    ui,
    story: input.story || {}
  });

  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(appTitle)}</title>
  <style>
    :root {
      --bg: #efefef;
      --panel: #f7f7f7;
      --text: #1f1f1f;
      --muted: #8c8c8c;
      --line: #e3e3e3;
      --incoming: #ffffff;
      --outgoing: #95ec69;
      --green: #07c160;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      background: #d9d9d9;
      font-family: "PingFang SC", "Helvetica Neue", sans-serif;
      color: var(--text);
      overflow: hidden;
    }
    .phone {
      max-width: 390px;
      margin: 0 auto;
      height: 100vh;
      background: var(--bg);
      position: relative;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      border-left: 1px solid #cfcfcf;
      border-right: 1px solid #cfcfcf;
    }
    .status-bar {
      height: 26px;
      padding: 3px 12px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 12px;
      background: var(--panel);
    }
    .top-nav {
      height: 46px;
      border-bottom: 1px solid var(--line);
      display: grid;
      align-items: center;
      grid-template-columns: 1fr auto 1fr;
      padding: 0 12px;
      background: var(--panel);
      font-weight: 600;
    }
    .top-nav .center-title {
      justify-self: center;
      font-size: 20px;
      letter-spacing: 0.5px;
    }
    .list-view {
      display: flex;
      flex-direction: column;
      flex: 1;
      min-height: 0;
    }
    .moments-view {
      display: none;
      flex-direction: column;
      flex: 1;
      min-height: 0;
      background: #f4f4f4;
    }
    .moments-scroll {
      overflow-y: auto;
      flex: 1;
      min-height: 0;
      padding: 10px 10px 84px;
    }
    .moments-empty {
      font-size: 13px;
      color: #8b8b8b;
      text-align: center;
      padding: 30px 0;
    }
    .moment-card {
      background: #fff;
      border-radius: 10px;
      padding: 12px;
      margin-bottom: 10px;
      box-shadow: 0 1px 2px rgba(0,0,0,.05);
    }
    .moment-head { display:flex; align-items:center; gap:10px; }
    .moment-avatar { width:38px; height:38px; border-radius:8px; object-fit:cover; background:#ddd; }
    .moment-name { font-size:14px; font-weight:600; }
    .moment-time { font-size:11px; color:#8f8f8f; margin-top:2px; }
    .moment-text { margin:10px 0 0; font-size:14px; line-height:1.5; white-space:pre-wrap; word-break:break-word; }
    .moment-images { margin-top:8px; display:grid; gap:6px; grid-template-columns:repeat(3, 1fr); }
    .moment-images img { width:100%; aspect-ratio:1/1; object-fit:cover; border-radius:6px; background:#ddd; }
    .contacts-view {
      display: none;
      flex-direction: column;
      flex: 1;
      min-height: 0;
      background: #f4f4f4;
    }
    .contacts-scroll {
      overflow-y: auto;
      flex: 1;
      min-height: 0;
      padding: 10px 10px 84px;
    }
    .contacts-empty { font-size:13px; color:#8b8b8b; text-align:center; padding:30px 0; }
    .oa-card { background:#fff; border-radius:10px; padding:12px; margin-bottom:10px; box-shadow:0 1px 2px rgba(0,0,0,.05); }
    .oa-title { font-size:16px; font-weight:600; line-height:1.35; }
    .oa-meta { margin-top:6px; font-size:12px; color:#8f8f8f; }
    .oa-cover { width:100%; margin-top:10px; border-radius:8px; object-fit:cover; max-height:180px; background:#ddd; }
    .oa-desc { margin-top:8px; color:#555; font-size:13px; line-height:1.45; }
    .oa-open { margin-top:10px; border:none; background:#f2f2f2; border-radius:8px; padding:8px 10px; cursor:pointer; font-size:13px; }
    .article-modal { position: fixed; inset: 0; background:#fff; z-index:30; display:none; overflow-y:auto; }
    .article-modal.show { display:block; }
    .article-header { position: sticky; top: 0; background:#fff; border-bottom:1px solid #ececec; height:46px; display:flex; align-items:center; padding:0 10px; }
    .article-back { border:none; background:transparent; font-size:14px; color:#444; cursor:pointer; padding:6px 8px; }
    .article-body { padding:14px 14px 30px; }
    .article-title { font-size:24px; font-weight:700; line-height:1.35; margin:0; }
    .article-sub { margin-top:8px; font-size:12px; color:#8f8f8f; }
    .article-cover { width:100%; border-radius:8px; margin-top:12px; }
    .article-text { margin-top:14px; font-size:16px; line-height:1.8; color:#222; word-break:break-word; }
    .article-text h1, .article-text h2, .article-text h3 { margin:18px 0 8px; line-height:1.35; }
    .article-text h1 { font-size:22px; }
    .article-text h2 { font-size:20px; }
    .article-text h3 { font-size:18px; }
    .article-text p { margin:0 0 12px; }
    .article-text blockquote { margin:12px 0; padding:8px 12px; border-left:3px solid #d0d0d0; background:#f7f7f7; color:#555; }
    .article-text ul { margin:0 0 12px 20px; padding:0; }
    .article-text li { margin:4px 0; }
    .article-text img { width:100%; border-radius:8px; margin:10px 0; background:#ddd; }
    .article-text a { color:#576b95; text-decoration:none; }
    .article-images { margin-top:12px; display:grid; gap:8px; }
    .article-images img { width:100%; border-radius:8px; background:#ddd; }
    .list-scroll {
      overflow-y: auto;
      flex: 1;
      min-height: 0;
      padding-bottom: 84px;
      background: #fff;
    }
    .list-item {
      width: 100%;
      border: none;
      border-bottom: 1px solid #efefef;
      background: #fff;
      padding: 10px 12px;
      display: grid;
      grid-template-columns: 50px 1fr auto;
      column-gap: 10px;
      text-align: left;
      cursor: pointer;
    }
    .list-avatar-wrap { position: relative; width: 50px; height: 50px; }
    .list-avatar {
      width: 50px;
      height: 50px;
      border-radius: 6px;
      object-fit: cover;
      background: #ddd;
    }
    .list-main {
      min-width: 0;
      position: relative;
    }
    .list-title {
      font-size: 18px;
      line-height: 1.25;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      margin-top: 2px;
    }
    .list-preview {
      margin-top: 4px;
      font-size: 16px;
      color: #a0a0a0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .list-dot { position:absolute; left:-4px; top:-4px; width:10px; height:10px; border-radius:50%; background:#ff3b30; box-shadow:0 0 0 2px #fff; }
    .list-time {
      font-size: 14px;
      color: #b0b0b0;
      margin-top: 4px;
      padding-left: 6px;
    }
    .tabbar {
      height: 56px;
      border-top: 1px solid var(--line);
      background: var(--panel);
      position: absolute;
      left: 0;
      right: 0;
      bottom: 0;
      z-index: 40;
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      align-items: center;
      text-align: center;
      font-size: 12px;
      color: #8f8f8f;
    }
    .tabbar .active {
      color: var(--green);
      font-weight: 600;
    }
    .tab-item { position: relative; display:flex; flex-direction:column; align-items:center; justify-content:center; min-width:44px; gap:2px; }
    .tab-icon { width:22px; height:22px; color:#8f8f8f; display:block; }
    .tab-icon svg { width:100%; height:100%; stroke:currentColor; fill:none; stroke-width:1.9; stroke-linecap:round; stroke-linejoin:round; }
    .tab-label { font-size:12px; line-height:1; }
    .tabbar .active .tab-icon, .tabbar .active .tab-label { color: var(--green); }
    .tab-badge { position:absolute; top:2px; right:20px; min-width:16px; height:16px; padding:0 4px; border-radius:10px; background:#ff3b30; color:#fff; font-size:10px; line-height:16px; display:none; text-align:center; box-sizing:border-box; }
    .tab-badge.dot { min-width:8px; width:8px; height:8px; padding:0; border-radius:50%; color:transparent; line-height:8px; top:6px; right:23px; }
    .account-view { display:none; flex-direction:column; flex:1; min-height:0; background:#efefef; }
    .account-top { height:46px; border-bottom:1px solid var(--line); display:grid; grid-template-columns:auto 1fr; align-items:center; padding:0 10px; background:var(--panel); }
    .account-back { border:none; background:transparent; color:#222; font-size:22px; cursor:pointer; padding:4px 6px; }
    .account-center { padding:26px 16px 10px; text-align:center; color:#222; font-size:18px; }
    .account-list-wrap { padding:8px 12px 84px; overflow-y:auto; flex:1; min-height:0; }
    .account-card { width:100%; border:none; background:#fff; border-radius:10px; padding:14px 12px; margin-bottom:10px; display:flex; align-items:center; gap:10px; text-align:left; cursor:pointer; }
    .account-avatar { width:52px; height:52px; border-radius:6px; object-fit:cover; background:#ddd; }
    .account-name { font-size:16px; color:#222; line-height:1.2; }
    .account-current { margin-left:auto; font-size:14px; color:#07c160; white-space:nowrap; }
    .account-reset { width:100%; border:none; background:#fff; border-radius:10px; padding:14px 12px; margin-top:10px; text-align:center; cursor:pointer; color:#d93025; font-size:16px; }
    .detail-view {
      display: none;
      flex-direction: column;
      flex: 1;
      min-height: 0;
    }
    .chat-top {
      height: 46px;
      border-bottom: 1px solid var(--line);
      display: grid;
      grid-template-columns: 1fr minmax(0, auto) 1fr;
      align-items: center;
      background: var(--panel);
      padding: 0 8px;
      gap: 8px;
    }
    .back-btn {
      border: none;
      background: transparent;
      color: #4f4f4f;
      font-size: 15px;
      cursor: pointer;
      padding: 6px 8px;
      justify-self: start;
    }
    .chat-title {
      font-size: 17px;
      font-weight: 600;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      justify-self: center;
      text-align: center;
      min-width: 0;
      max-width: 100%;
    }
    .chat-top-spacer { justify-self: end; width: 44px; height: 1px; }
    .timeline {
      flex: 1;
      min-height: 0;
      overflow-y: auto;
      padding: 12px 12px 84px;
    }
    .msg { display: grid; grid-template-columns: 42px 1fr; gap: 10px; margin-bottom: 14px; }
    .msg.self { grid-template-columns: 1fr 42px; }
    .avatar-btn { border:none; padding:0; background:transparent; cursor:pointer; width:42px; height:42px; border-radius:8px; }
    .avatar { width: 42px; height: 42px; border-radius: 8px; object-fit: cover; background: #ddd; }
    .msg-main { width: fit-content; max-width: 80%; }
    .msg.self .msg-main { margin-left: auto; }
    .msg.self .msg-body { display: flex; justify-content: flex-end; }
    .meta { font-size: 12px; color: var(--muted); margin: 0 0 4px; }
    .msg.self .meta { text-align: right; }
    .bubble { display: inline-block; max-width: 100%; border-radius: 10px; padding: 10px 12px; background: var(--incoming); word-break: break-word; line-height: 1.45; white-space: pre-wrap; }
    .msg.self .bubble { background: var(--outgoing); text-align: left; }
    .bubble.media { padding: 4px; background: transparent; }
    .recall-tip { font-size:12px; color:var(--muted); text-align:center; padding:4px 0; }
    .quote { margin-bottom: 8px; background: rgba(0,0,0,0.06); border-left: 3px solid rgba(0,0,0,0.18); border-radius: 6px; padding: 6px 8px; font-size: 12px; color: #333; }
    .img { max-width: min(320px, 100%); border-radius: 8px; display: block; }
    .img-caption { margin-top: 6px; font-size: 13px; line-height: 1.4; }
    .voice-btn { border:none; background:transparent; padding:0; font:inherit; color:inherit; cursor:pointer; display:flex; align-items:center; gap:8px; }
    .voice-icon { font-size:12px; color:#3b3b3b; }
    .voice-duration { font-size:13px; color:#3b3b3b; min-width:26px; text-align:left; }
    .voice-btn.playing .voice-icon { color:#07c160; }
    .card { display: block; border-radius: 8px; background: #f8f8f8; padding: 9px; text-decoration: none; color: inherit; }
    .card-title { font-size: 14px; font-weight: 600; margin-bottom: 4px; }
    .card-desc { font-size: 12px; color: var(--muted); margin-bottom: 8px; }
    .card-footer { display: flex; justify-content: space-between; font-size: 11px; color: var(--muted); }
    .article-card { border:none; display:block; width:100%; text-align:left; cursor:pointer; border-radius:8px; background:#f8f8f8; padding:9px; }
    .article-title { font-size:14px; font-weight:600; line-height:1.4; }
    .article-meta { margin-top:4px; font-size:11px; color:var(--muted); }
    .article-cover { width:100%; margin-top:8px; border-radius:6px; max-height:150px; object-fit:cover; background:#ddd; }
    .article-summary { margin-top:7px; font-size:12px; color:#4c4c4c; line-height:1.45; }
    .contact-card { width:min(240px, 100%); border-radius:8px; background:#f8f8f8; padding:10px; display:flex; gap:9px; align-items:center; }
    .contact-avatar { width:42px; height:42px; border-radius:8px; object-fit:cover; background:#ddd; }
    .contact-name { font-size:14px; font-weight:600; }
    .contact-nick { margin-top:2px; font-size:11px; color:var(--muted); }
    .contact-bio { margin-top:6px; font-size:12px; color:#4c4c4c; line-height:1.35; white-space:normal; word-break:break-word; }
    .inline-link { color: #576b95; }
    .mention { color: #576b95; font-weight: 600; }
    .end-tip { font-size: 12px; color: var(--muted); text-align: center; margin: 16px 0 4px; }
    .profile-modal { position: fixed; inset: 0; display: none; align-items: center; justify-content: center; padding: 16px; background: rgba(0,0,0,.35); z-index: 20; }
    .profile-modal.show { display: flex; }
    .profile-card { width: min(320px, 100%); background: #fff; border-radius: 12px; padding: 14px; box-shadow: 0 12px 30px rgba(0,0,0,.2); }
    .profile-head { display:flex; gap:10px; align-items:center; margin-bottom:10px; }
    .profile-avatar { width:50px; height:50px; border-radius:8px; object-fit:cover; background:#ddd; }
    .profile-name { font-size:16px; font-weight:600; }
    .profile-item { font-size:13px; color:#444; line-height:1.45; margin-top:4px; word-break:break-word; }
    .profile-close { margin-top:12px; width:100%; border:none; border-radius:8px; background:#f2f2f2; padding:8px 0; cursor:pointer; }
  </style>
  ${ui.theme === "iterms" ? `<style>
    [data-theme="iterms"] { --bg:#0a0d14; --panel:#0d1117; --text:#33ff66; --muted:#6aaa70; --line:#173020; --incoming:#141b22; --outgoing:#0e2a15; --green:#00ff41; --accent:#00ff41; --glow:0 0 6px rgba(0,255,65,0.45); }
    [data-theme="iterms"] body { font-family:"SF Mono","Menlo","Courier New",monospace; background:#05080d; }
    [data-theme="iterms"] .phone { background:var(--bg); border-color:#173020; }
    [data-theme="iterms"] .status-bar,[data-theme="iterms"] .top-nav { background:var(--panel); color:var(--text); border-color:var(--line); }
    [data-theme="iterms"] .list-scroll { background:#0a0d14; }
    [data-theme="iterms"] .list-item { background:#0a0d14; border-color:#142018; color:var(--text); }
    [data-theme="iterms"] .list-item:hover { background:#0d1a12; }
    [data-theme="iterms"] .list-title { color:var(--text); }
    [data-theme="iterms"] .list-preview { color:#7aba80; }
    [data-theme="iterms"] .list-time { color:#6aaa70; }
    [data-theme="iterms"] .list-avatar { border-radius:2px; }
    [data-theme="iterms"] .list-dot { box-shadow:0 0 0 2px #0a0d14; }
    [data-theme="iterms"] .tabbar { background:var(--panel); border-color:var(--line); }
    [data-theme="iterms"] .tabbar .active { color:var(--accent); text-shadow:var(--glow); }
    [data-theme="iterms"] .tab-icon { color:var(--muted); }
    [data-theme="iterms"] .tabbar .active .tab-icon,[data-theme="iterms"] .tabbar .active .tab-label { color:var(--accent); }
    [data-theme="iterms"] .chat-top { background:var(--panel); border-color:var(--line); }
    [data-theme="iterms"] .chat-title { color:var(--text); text-shadow:0 0 4px rgba(0,255,65,0.3); }
    [data-theme="iterms"] .back-btn { color:var(--accent); }
    [data-theme="iterms"] .timeline { background:var(--bg); }
    [data-theme="iterms"] .msg .meta { color:var(--muted); }
    [data-theme="iterms"] .bubble { color:var(--text); background:var(--incoming); border:1px solid var(--line); border-radius:2px; text-shadow:0 0 3px rgba(0,255,65,0.2); }
    [data-theme="iterms"] .msg.self .bubble { background:var(--outgoing); border-color:#1a4020; color:#d0ffd0; }
    [data-theme="iterms"] .bubble.media { background:transparent; border:none; text-shadow:none; }
    [data-theme="iterms"] .quote { border-left-color:var(--accent); background:#0d1a12; color:#a0e0a0; text-shadow:0 0 3px rgba(0,255,65,0.15); }
    [data-theme="iterms"] .img { border:1px solid #1a4020; }
    [data-theme="iterms"] .avatar { border-radius:2px; }
    [data-theme="iterms"] .card { background:#0d1a12; border-color:var(--line); color:var(--text); }
    [data-theme="iterms"] .article-card { background:#0d1a12; border-color:var(--line); border-radius:2px; color:var(--text); }
    [data-theme="iterms"] .contact-card { background:#0d1a12; border-color:var(--line); border-radius:2px; color:var(--text); }
    [data-theme="iterms"] .contact-name { color:var(--text); }
    [data-theme="iterms"] .contact-nick { color:var(--muted); }
    [data-theme="iterms"] .contact-name { color:var(--text); }
    [data-theme="iterms"] .contact-nick { color:var(--muted); }
    [data-theme="iterms"] .contact-avatar { border-radius:2px; }
    [data-theme="iterms"] .inline-link { color:var(--accent); }
    [data-theme="iterms"] .mention { color:var(--accent); text-shadow:0 0 4px rgba(0,255,65,0.4); }
    [data-theme="iterms"] .profile-modal { background:rgba(0,8,5,.75); }
    [data-theme="iterms"] .profile-card { background:#0a1016; border:1px solid var(--line); box-shadow:0 0 20px rgba(0,255,65,.15); border-radius:4px; }
    [data-theme="iterms"] .profile-name { color:var(--accent); text-shadow:var(--glow); }
    [data-theme="iterms"] .profile-item { color:var(--text); }
    [data-theme="iterms"] .profile-close { background:#0d1a12; border:1px solid var(--line); color:var(--text); }
    [data-theme="iterms"] .profile-avatar { border-radius:2px; }
    [data-theme="iterms"] .article-modal { background:#05080d; }
    [data-theme="iterms"] .article-header { background:#05080d; border-color:var(--line); }
    [data-theme="iterms"] .article-back { color:var(--accent); }
    [data-theme="iterms"] .article-body { color:var(--text); }
    [data-theme="iterms"] .article-title { color:var(--text); text-shadow:var(--glow); }
    [data-theme="iterms"] .article-sub { color:var(--muted); }
    [data-theme="iterms"] .article-text { color:var(--text); text-shadow:0 0 3px rgba(0,255,65,0.3); }
    [data-theme="iterms"] .article-text h1,[data-theme="iterms"] .article-text h2,[data-theme="iterms"] .article-text h3 { color:var(--accent); text-shadow:var(--glow); }
    [data-theme="iterms"] .article-text blockquote { background:#0d1a12; border-left-color:var(--accent); color:var(--muted); }
    [data-theme="iterms"] .article-text a { color:var(--accent); }
    [data-theme="iterms"] .article-images img { border-color:var(--line); }
    [data-theme="iterms"] .end-tip { color:var(--muted); }
    [data-theme="iterms"] .recall-tip { color:var(--muted); }
    [data-theme="iterms"] .voice-icon { color:var(--accent); }
    [data-theme="iterms"] .voice-btn.playing .voice-icon { color:#fff; }
    [data-theme="iterms"] .moments-view { background:#0a0d14; }
    [data-theme="iterms"] .moment-card { background:#0d1117; border:1px solid var(--line); }
    [data-theme="iterms"] .moment-name { color:var(--text); }
    [data-theme="iterms"] .moment-time { color:var(--muted); }
    [data-theme="iterms"] .moment-text { color:var(--text); text-shadow:0 0 3px rgba(0,255,65,0.2); }
    [data-theme="iterms"] .moment-images img { border:1px solid var(--line); }
    [data-theme="iterms"] .contacts-view { background:#0a0d14; }
    [data-theme="iterms"] .oa-card { background:#0d1117; border:1px solid var(--line); }
    [data-theme="iterms"] .oa-title { color:var(--text); text-shadow:0 0 4px rgba(0,255,65,0.3); }
    [data-theme="iterms"] .oa-meta { color:var(--muted); }
    [data-theme="iterms"] .oa-desc { color:var(--text); }
    [data-theme="iterms"] .oa-open { background:#0d1a12; border:1px solid var(--line); color:var(--accent); }
    [data-theme="iterms"] .account-view { background:#0a0d14; }
    [data-theme="iterms"] .account-top { background:var(--panel); border-color:var(--line); }
    [data-theme="iterms"] .account-back { color:var(--accent); }
    [data-theme="iterms"] .account-center { color:var(--text); }
    [data-theme="iterms"] .account-card { background:#0d1117; border:1px solid #142018; color:var(--text); }
    [data-theme="iterms"] .account-card:hover { background:#0d1a12; }
    [data-theme="iterms"] .account-name { color:var(--text); }
    [data-theme="iterms"] .account-current { color:var(--accent); }
    [data-theme="iterms"] .account-reset { background:#0d1117; border:1px solid #142018; color:#ff3b30; }
    [data-theme="iterms"] .account-avatar { border-radius:2px; }
    [data-theme="iterms"] .contacts-empty { color:var(--muted); }
    [data-theme="iterms"] .moments-empty { color:var(--muted); }
    [data-theme="iterms"] .article-text blockquote { color:#a0e0a0; }
  </style>` : ""}
</head>
<body>
  <main class="phone" data-theme="${escapeHtml(ui.theme)}">
    <div class="status-bar">
      <div id="status-carrier">${escapeHtml(ui.statusBar.carrier)}</div>
      <div id="status-time">${escapeHtml(ui.statusBar.time)}</div>
      <div id="status-battery">${escapeHtml(ui.statusBar.battery)}</div>
    </div>

    <section id="list-view" class="list-view">
      <header class="top-nav">
        <div></div>
        <div class="center-title">${escapeHtml(ui.topTitle)}</div>
      </header>
      <div id="list-scroll" class="list-scroll"></div>
    </section>

    <section id="moments-view" class="moments-view">
      <header class="top-nav">
        <div></div>
        <div class="center-title">社交圈</div>
        <div></div>
      </header>
      <div id="moments-scroll" class="moments-scroll"></div>
    </section>
    <section id="contacts-view" class="contacts-view">
      <header class="top-nav">
        <div></div>
        <div class="center-title">文档</div>
        <div></div>
      </header>
      <div id="contacts-scroll" class="contacts-scroll"></div>
    </section>

    <footer id="home-tabbar" class="tabbar">
      <div id="tab-chat" class="active tab-item"><span class="tab-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5h14v10H9l-4 4z"/></svg></span><span class="tab-label">对话</span><span id="badge-chat" class="tab-badge"></span></div>
      <div id="tab-contacts" class="tab-item"><span class="tab-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="4" width="14" height="16" rx="2"/><path d="M9 9h6M9 13h6M9 17h4"/></svg></span><span class="tab-label">文档</span><span id="badge-contacts" class="tab-badge"></span></div>
      <div id="tab-moments" class="tab-item"><span class="tab-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8"/><path d="M12 8v4l3 3"/></svg></span><span class="tab-label">社交</span><span id="badge-moments" class="tab-badge"></span></div>
      <div id="tab-me" class="tab-item"><span class="tab-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="3.5"/><path d="M5 19c1.8-3 4-4.5 7-4.5s5.2 1.5 7 4.5"/></svg></span><span class="tab-label">账号</span><span id="badge-me" class="tab-badge"></span></div>
    </footer>

    <section id="detail-view" class="detail-view">
      <header class="chat-top">
        <button id="back-btn" class="back-btn">返回</button>
        <div class="chat-title" id="chat-title"></div>
        <div class="chat-top-spacer" aria-hidden="true"></div>
      </header>
      <div class="timeline" id="timeline"></div>
    </section>

    <section id="account-view" class="account-view">
      <header class="account-top">
        <button id="account-back" class="account-back" type="button">‹</button>
        <div></div>
      </header>
      <div class="account-center">轻触头像以切换账号</div>
      <div id="account-list-wrap" class="account-list-wrap"></div>
    </section>
  </main>
  <aside id="profile-modal" class="profile-modal" aria-hidden="true">
    <div class="profile-card">
      <div class="profile-head">
        <img id="profile-avatar" class="profile-avatar" src="" alt="avatar"/>
        <div id="profile-name" class="profile-name"></div>
      </div>
      <div id="profile-wechat" class="profile-item"></div>
      <div id="profile-bio" class="profile-item"></div>
      <button id="profile-close" class="profile-close" type="button">关闭</button>
    </div>
  </aside>
  <aside id="article-modal" class="article-modal" aria-hidden="true">
    <header class="article-header">
      <button id="article-back" class="article-back" type="button">返回</button>
    </header>
    <div class="article-body">
      <h1 id="article-title" class="article-title"></h1>
      <div id="article-sub" class="article-sub"></div>
      <img id="article-cover" class="article-cover" src="" alt="cover"/>
      <div id="article-text" class="article-text"></div>
      <div id="article-images" class="article-images"></div>
    </div>
  </aside>

  <script id="chat-data" type="application/json">${payload}</script>
  <script>
    const payload = JSON.parse(document.getElementById('chat-data').textContent);
    const listView = document.getElementById('list-view');
    const momentsView = document.getElementById('moments-view');
    const contactsView = document.getElementById('contacts-view');
    const detailView = document.getElementById('detail-view');
    const accountView = document.getElementById('account-view');
    const listScroll = document.getElementById('list-scroll');
    const momentsScroll = document.getElementById('moments-scroll');
    const contactsScroll = document.getElementById('contacts-scroll');
    const backBtn = document.getElementById('back-btn');
    const timeline = document.getElementById('timeline');
    const chatTitle = document.getElementById('chat-title');
    const statusTime = document.getElementById('status-time');
    const statusBattery = document.getElementById('status-battery');
    const tabChat = document.getElementById('tab-chat');
    const tabContacts = document.getElementById('tab-contacts');
    const tabMoments = document.getElementById('tab-moments');
    const tabMe = document.getElementById('tab-me');
    const badgeChat = document.getElementById('badge-chat');
    const badgeContacts = document.getElementById('badge-contacts');
    const badgeMoments = document.getElementById('badge-moments');
    const badgeMe = document.getElementById('badge-me');
    const profileModal = document.getElementById('profile-modal');
    const profileAvatar = document.getElementById('profile-avatar');
    const profileName = document.getElementById('profile-name');
    const profileWechat = document.getElementById('profile-wechat');
    const profileBio = document.getElementById('profile-bio');
    const profileClose = document.getElementById('profile-close');
    const articleModal = document.getElementById('article-modal');
    const articleBack = document.getElementById('article-back');
    const articleTitle = document.getElementById('article-title');
    const articleSub = document.getElementById('article-sub');
    const articleCover = document.getElementById('article-cover');
    const articleText = document.getElementById('article-text');
    const articleImages = document.getElementById('article-images');
    const accountBack = document.getElementById('account-back');
    const accountListWrap = document.getElementById('account-list-wrap');

    const persistKey = payload.ui?.persistKey || 'chat_framework_seen_v1';
    let timer = null;
    let recallTimers = [];
    let seenMap = {};
    let stageSeenMap = {};
    let momentSeenMap = {};
    let articleSeenMap = {};
    let stageIndexMap = {};
    let unlockedAccounts = {};
    let accountNoticeMap = {};
    let stageIndex = 0;
    let timelineStages = [];
    let activeAccountId = "";
    let accountIds = [];
    let activeAudio = null;
    let activeVoiceBtn = null;
    let activePlayback = null;
    let articleRows = [];
    const debugState = { enabled: true };

    ${HEARTBEAT_ENGINE_JS}

    function parseMomentTime(raw) {
      if (!raw) return null;
      const t = String(raw).trim().replace(" ", "T");
      const d = new Date(t);
      return Number.isNaN(d.getTime()) ? null : d;
    }

    function parseIdentityReference(raw) {
      if (!raw) return null;
      const text = String(raw).trim();
      if (!text) return null;
      const normalized = /^\d{4}-\d{2}-\d{2}$/.test(text)
        ? text + 'T00:00:00'
        : text.replace(' ', 'T');
      const time = new Date(normalized).getTime();
      return Number.isNaN(time) ? null : time;
    }

    function resolveEffectiveProfile(user, referenceTime) {
      const refMs = parseIdentityReference(referenceTime) ?? Date.now();
      let name = user?.name || user?.id || '';
      let bio = user?.bio || '';
      const timeline = Array.isArray(user?.identityTimeline) ? user.identityTimeline : [];
      timeline.forEach((entry) => {
        if (!entry || typeof entry.effectiveAtMs !== 'number' || entry.effectiveAtMs > refMs) return;
        if (entry.name !== undefined) name = entry.name;
        if (entry.bio !== undefined) bio = entry.bio;
      });
      return { name, bio };
    }

    function resolveAccountCardName(user, accountId) {
      const stageDays = collectStageDaysForAccount(accountId);
      const rawStageIndex = Number(stageIndexMap[accountId] || 0);
      const stageIndex = stageDays.length
        ? Math.max(0, Math.min(Number.isFinite(rawStageIndex) ? rawStageIndex : 0, stageDays.length - 1))
        : 0;
      const stageDay = stageDays[stageIndex] || currentStageMs();
      const resolvedProfile = resolveEffectiveProfile(user, stageDay);
      const timeline = Array.isArray(user?.identityTimeline) ? user.identityTimeline : [];
      const earliestTimelineEntry = timeline.reduce((earliest, entry) => {
        if (!entry || typeof entry.effectiveAtMs !== 'number') return earliest;
        if (!earliest || entry.effectiveAtMs < earliest.effectiveAtMs) return entry;
        return earliest;
      }, null);
      const stageMs = parseIdentityReference(stageDay) ?? Date.now();
      const hasActiveTimelineEntry = timeline.some((entry) => (
        entry
        && typeof entry.effectiveAtMs === 'number'
        && entry.effectiveAtMs <= stageMs
      ));
      if (!hasActiveTimelineEntry && earliestTimelineEntry?.name) return earliestTimelineEntry.name;
      return resolvedProfile.name || earliestTimelineEntry?.name || user?.id || accountId || '';
    }

    function currentRuntimeTime() {
      return new Date().toISOString();
    }

    function normalizeMomentImages(m) {
      if (!m) return [];
      if (Array.isArray(m.images)) return m.images.filter(Boolean);
      if (typeof m.images === "string" && m.images) return [m.images];
      if (m.imageUrl) return [m.imageUrl];
      return [];
    }

    function collectMoments() {
      const stageDay = currentStageMs();
      const rows = [];
      const seen = new Set();
      for (const conv of (payload.conversations || [])) {
        if (!isVisibleByAccount(conv)) continue;
        const users = conv.profiles?.users || {};
        for (const [id, user] of Object.entries(users)) {
          if (!user || seen.has(id)) continue;
          seen.add(id);
          const moments = user.moments || {};
          for (const moment of Object.values(moments)) {
            if (!moment) continue;
            const publishRaw = moment.publishAt || moment.time || "";
            const day = toDayKey(publishRaw);
            if (!day || day > stageDay) continue;
            rows.push({
              id: id + "-" + (moment.id || publishRaw || rows.length),
              name: user.name || id,
              nickName: user.nickName || user.name || id,
              avatar: user.avatar || "",
              text: String(moment.text || ""),
              images: normalizeMomentImages(moment),
              publishRaw: publishRaw,
              dayKey: day
            });
          }
        }
      }
      rows.sort((a, b) => String(b.publishRaw).localeCompare(String(a.publishRaw), "zh-CN"));
      return rows;
    }

    function renderMoments() {
      const rows = collectMoments();
      if (!rows.length) {
        momentsScroll.innerHTML = '<div class="moments-empty">当前时间下暂无可展示的朋友圈</div>';
        return;
      }
      momentsScroll.innerHTML = rows.map((m) => {
        const imgs = m.images.slice(0, 9).map((url) => '<img src="' + esc(url) + '" alt="moment"/>').join('');
        const text = m.text ? '<div class="moment-text">' + formatText(m.text) + '</div>' : '';
        const imgWrap = imgs ? '<div class="moment-images">' + imgs + '</div>' : '';
        return '<article class="moment-card">'
          + '<div class="moment-head">'
          + '<img class="moment-avatar" src="' + esc(m.avatar) + '" alt="' + esc(m.name) + '"/>'
          + '<div><div class="moment-name">' + esc(m.name) + '</div><div class="moment-time">' + esc(m.publishRaw) + '</div></div>'
          + '</div>'
          + text + imgWrap
          + '</article>';
      }).join('');
    }

    function showChatList() {
      listView.style.display = 'flex';
      momentsView.style.display = 'none';
      contactsView.style.display = 'none';
      detailView.style.display = 'none';
      accountView.style.display = 'none';
      tabChat.classList.add('active');
      tabContacts.classList.remove('active');
      tabMoments.classList.remove('active');
      renderList();
      updateUnreadBadges();
    }

    function showMoments() {
      clearTimer();
      listView.style.display = 'none';
      detailView.style.display = 'none';
      contactsView.style.display = 'none';
      accountView.style.display = 'none';
      momentsView.style.display = 'flex';
      tabChat.classList.remove('active');
      tabContacts.classList.remove('active');
      tabMoments.classList.add('active');
      renderMoments();
      const seen = getMomentSeen(currentStageMs());
      for (const m of collectMoments()) seen[m.id] = true;
      saveSeen();
      updateUnreadBadges();
      updateStatusProgress();
      maybeAdvanceStage();
    }

    function collectArticles() {
      const stageDay = currentStageMs();
      const rows = [];
      for (const conv of (payload.conversations || [])) {
        if (!isVisibleByAccount(conv)) continue;
        const users = conv.profiles?.users || {};
        const repo = conv.articles || {};
        const user = users[activeAccountId];
        if (!user) continue;
        const refs = Array.isArray(user.officialArticles || user.articles)
          ? (user.officialArticles || user.articles)
          : Object.keys(user.officialArticles || user.articles || {});
        for (const refId of refs) {
          const item = repo[String(refId)];
          if (!item) continue;
          const publishRaw = item.publishAt || item.time || "";
          const day = toDayKey(publishRaw);
          if (!day || day > stageDay) continue;
          const imgs = normalizeMomentImages(item);
          rows.push({
            id: String(refId),
            title: String(item.title || "未命名文章"),
            author: String(item.author || user.name || ""),
            publishRaw: publishRaw,
            cover: String(item.cover || imgs[0] || ""),
            desc: String(item.desc || item.summary || ""),
            text: String(item.markdown || item.body || item.text || item.content || ""),
            images: imgs,
            dayKey: day
          });
        }
      }
      rows.sort((a, b) => String(b.publishRaw).localeCompare(String(a.publishRaw), "zh-CN"));
      return rows;
    }

    function renderContacts() {
      articleRows = collectArticles();
      if (!articleRows.length) {
        contactsScroll.innerHTML = '<div class="contacts-empty">已读完</div>';
        return;
      }
      contactsScroll.innerHTML = articleRows.map((a, idx) => {
        const cover = a.cover ? '<img class="oa-cover" src="' + esc(a.cover) + '" alt="cover"/>' : '';
        const desc = a.desc ? '<div class="oa-desc">' + esc(a.desc) + '</div>' : '';
        return '<article class="oa-card">'
          + '<div class="oa-title">' + esc(a.title) + '</div>'
          + '<div class="oa-meta">' + esc(a.author) + ' · ' + esc(a.publishRaw) + '</div>'
          + cover + desc
          + '<button class="oa-open" type="button" data-idx="' + idx + '">阅读全文</button>'
          + '</article>';
      }).join('');
    }

    function openArticle(index) {
      const a = articleRows[index];
      if (!a) return;
      articleTitle.textContent = a.title;
      articleSub.textContent = a.author + " · " + a.publishRaw;
      articleCover.style.display = a.cover ? "block" : "none";
      articleCover.src = a.cover || "";
      articleText.innerHTML = renderMarkdown(a.text || "");
      articleImages.innerHTML = (a.images || []).map((url) => '<img src="' + esc(url) + '" alt="image"/>').join('');
      articleModal.classList.add('show');
      articleModal.setAttribute('aria-hidden', 'false');
    }

    function openInlineArticle(data) {
      const a = {
        title: data.title || "未命名文章",
        author: data.author || "",
        publishRaw: data.publishRaw || "",
        cover: data.cover || "",
        text: data.text || "",
        images: data.images || []
      };
      articleTitle.textContent = a.title;
      articleSub.textContent = [a.author, a.publishRaw].filter(Boolean).join(" · ");
      articleCover.style.display = a.cover ? "block" : "none";
      articleCover.src = a.cover || "";
      articleText.innerHTML = renderMarkdown(a.text || "");
      articleImages.innerHTML = (a.images || []).map((url) => '<img src="' + esc(url) + '" alt="image"/>').join('');
      articleModal.classList.add('show');
      articleModal.setAttribute('aria-hidden', 'false');
    }

    function closeArticle() {
      articleModal.classList.remove('show');
      articleModal.setAttribute('aria-hidden', 'true');
    }

    function showContacts() {
      clearTimer();
      listView.style.display = 'none';
      momentsView.style.display = 'none';
      detailView.style.display = 'none';
      accountView.style.display = 'none';
      contactsView.style.display = 'flex';
      tabChat.classList.remove('active');
      tabContacts.classList.add('active');
      tabMoments.classList.remove('active');
      renderContacts();
      const seen = getArticleSeen(currentStageMs());
      for (const a of articleRows) seen[a.id] = true;
      saveSeen();
      updateUnreadBadges();
      updateStatusProgress();
      maybeAdvanceStage();
    }

    function loadSeen() {
      try {
        const raw = localStorage.getItem(persistKey);
        const parsed = raw ? JSON.parse(raw) : {};
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed) && (parsed.conversationSeen || parsed.stageSeen || typeof parsed.stageIndex === 'number')) {
          seenMap = parsed.conversationSeen || {};
          stageSeenMap = parsed.stageSeen || {};
          momentSeenMap = parsed.momentSeen || {};
          articleSeenMap = parsed.articleSeen || {};
          stageIndexMap = parsed.stageIndexMap || {};
          if (typeof parsed.stageIndex === "number" && !Object.keys(stageIndexMap).length) {
            stageIndexMap.default = Number(parsed.stageIndex);
          }
          unlockedAccounts = parsed.unlockedAccounts || {};
          accountNoticeMap = parsed.accountNoticeMap || {};
          stageIndex = Number(parsed.stageIndex || 0);
          activeAccountId = parsed.activeAccountId || "";
        } else {
          seenMap = parsed && typeof parsed === 'object' ? parsed : {};
          stageSeenMap = {};
          momentSeenMap = {};
          articleSeenMap = {};
          stageIndexMap = {};
          unlockedAccounts = {};
          accountNoticeMap = {};
          stageIndex = 0;
        }
      } catch (_) {
        seenMap = {};
        stageSeenMap = {};
        momentSeenMap = {};
        articleSeenMap = {};
        stageIndexMap = {};
        unlockedAccounts = {};
        accountNoticeMap = {};
        stageIndex = 0;
      }
    }

    function saveSeen() {
      try {
        localStorage.setItem(persistKey, JSON.stringify({
          conversationSeen: seenMap,
          stageSeen: stageSeenMap,
          momentSeen: momentSeenMap,
          articleSeen: articleSeenMap,
          stageIndexMap,
          unlockedAccounts,
          accountNoticeMap,
          stageIndex,
          activeAccountId
        }));
      } catch (_) {
        // Ignore storage failures.
      }
    }

    function toDayKey(raw) {
      if (!raw) return "";
      const s = String(raw);
      const m = s.match(/^(\d{4}-\d{2}-\d{2})/);
      if (m) return m[1];
      const d = parseMomentTime(raw);
      if (!d) return "";
      const pad = (n) => String(n).padStart(2, "0");
      return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
    }

    function accountKey() {
      return activeAccountId || "default";
    }

    function keyWithAccount(key) {
      return accountKey() + "|" + key;
    }

    function initAccounts() {
      const set = new Set();
      for (const conv of (payload.conversations || [])) {
        if (conv.self) set.add(String(conv.self));
      }
      const all = Array.from(set);
      const ordered = Array.isArray(payload.story?.accountOrder) ? payload.story.accountOrder.map((x) => String(x)) : [];
      const first = ordered.filter((id) => set.has(id));
      const rest = all.filter((id) => !first.includes(id));
      accountIds = [...first, ...rest];
      if (!accountIds.length) accountIds = ["default"];
      if (!Object.keys(unlockedAccounts).length) {
        unlockedAccounts[accountIds[0]] = true;
      }
      if (!activeAccountId || !accountIds.includes(activeAccountId)) {
        activeAccountId = accountIds.find((id) => unlockedAccounts[id]) || accountIds[0];
      }
      syncStageIndexFromAccount();
    }

    function syncStageIndexFromAccount() {
      stageIndex = Number(stageIndexMap[accountKey()] || 0);
    }

    function persistStageIndexForAccount() {
      stageIndexMap[accountKey()] = stageIndex;
    }

    function isAccountUnlocked(id) {
      return !!unlockedAccounts[id];
    }

    function nextLockedAccount() {
      const idx = accountIds.indexOf(activeAccountId);
      if (idx === -1) return "";
      for (let i = idx + 1; i < accountIds.length; i += 1) {
        if (!isAccountUnlocked(accountIds[i])) return accountIds[i];
      }
      return "";
    }

    function conversationMatchesAccount(conv, accountId) {
      if (!accountId || accountId === "default") return true;
      return String(conv.self || "") === String(accountId);
    }

    function articleRefsForUser(user) {
      return Array.isArray(user?.officialArticles || user?.articles)
        ? (user.officialArticles || user.articles)
        : Object.keys(user?.officialArticles || user?.articles || {});
    }

    function collectContentUnitsForAccount(accountId) {
      const units = new Map();
      for (const conv of (payload.conversations || [])) {
        if (!conversationMatchesAccount(conv, accountId)) continue;

        const messageDays = new Set();
        for (const msg of (conv.messages || [])) {
          const day = toDayKey(msg.timestamp || msg.timeText || "");
          if (day) messageDays.add(day);
        }
        for (const day of messageDays) {
          units.set("chat|" + conv.id + "|" + day, { type: "chat", day });
        }

        const users = conv.profiles?.users || {};
        const repo = conv.articles || {};
        const selfId = (!accountId || accountId === "default") ? conv.self : accountId;
        const selfUser = users[selfId];
        for (const refId of articleRefsForUser(selfUser)) {
          const item = repo[String(refId)];
          const day = toDayKey(item?.publishAt || item?.time || "");
          if (day) units.set("article|" + String(refId), { type: "article", day });
        }

        for (const [id, user] of Object.entries(users)) {
          const moments = user?.moments || {};
          for (const moment of Object.values(moments)) {
            const publishRaw = moment?.publishAt || moment?.time || "";
            const day = toDayKey(publishRaw);
            if (!day) continue;
            units.set("moment|" + id + "|" + (moment.id || publishRaw), { type: "moment", day });
          }
        }
      }
      return Array.from(units.values());
    }

    function collectStageDaysForAccount(accountId) {
      const days = collectContentUnitsForAccount(accountId).map((unit) => unit.day).filter(Boolean);
      days.sort((a, b) => a.localeCompare(b, "zh-CN"));
      const uniq = [];
      for (const day of days) {
        if (!uniq.length || uniq[uniq.length - 1] !== day) uniq.push(day);
      }
      return uniq;
    }

    function contentProgressPercent(accountId, day) {
      const units = collectContentUnitsForAccount(accountId);
      if (!units.length) return 100;
      const current = units.filter((unit) => unit.day <= day).length;
      return Math.max(0, Math.min(100, Math.floor((current / units.length) * 100)));
    }

    function accountUnlockProgressPercent() {
      if (!accountIds.length) return 100;
      const current = accountIds.filter((id) => isAccountUnlocked(id)).length;
      return Math.max(0, Math.min(100, Math.floor((current / accountIds.length) * 100)));
    }

    function updateStatusProgress(scope) {
      if (!statusBattery) return;
      const value = scope === "accounts"
        ? accountUnlockProgressPercent()
        : contentProgressPercent(activeAccountId, currentStageMs());
      statusBattery.textContent = String(value) + "%";
    }

    function initTimelineStages() {
      syncStageIndexFromAccount();
      timelineStages = collectStageDaysForAccount(activeAccountId);
      if (!timelineStages.length) {
        const now = toDayKey(new Date().toISOString());
        timelineStages = [now];
      }
      stageIndex = Math.max(0, Math.min(stageIndex, timelineStages.length - 1));
      persistStageIndexForAccount();
    }

    function currentStageMs() {
      return timelineStages[Math.max(0, Math.min(stageIndex, timelineStages.length - 1))];
    }

    function stageKey(day) {
      return String(day);
    }

    function getStageSeen(day) {
      const key = keyWithAccount(stageKey(day));
      if (!stageSeenMap[key]) stageSeenMap[key] = {};
      return stageSeenMap[key];
    }
    function getMomentSeen(day) {
      const key = keyWithAccount(stageKey(day));
      if (!momentSeenMap[key]) momentSeenMap[key] = {};
      return momentSeenMap[key];
    }
    function getArticleSeen(day) {
      const key = keyWithAccount(stageKey(day));
      if (!articleSeenMap[key]) articleSeenMap[key] = {};
      return articleSeenMap[key];
    }
    function unreadChatCount(day) {
      const seen = getStageSeen(day);
      return (payload.conversations || []).filter((c) => isVisibleByStage(c) && hasNewMessagesOnDay(c, day) && !seen[c.id]).length;
    }
    function unreadMomentsCount(day) {
      const seen = getMomentSeen(day);
      return collectMoments().filter((m) => !seen[m.id]).length;
    }
    function unreadArticlesCount(day) {
      const seen = getArticleSeen(day);
      return collectArticles().filter((a) => !seen[a.id]).length;
    }
    function setBadgeCount(node, n) {
      if (!node) return;
      if (n > 0) {
        node.classList.remove("dot");
        node.style.display = "inline-block";
        node.textContent = n > 99 ? "99+" : String(n);
      } else {
        node.style.display = "none";
        node.textContent = "";
      }
    }
    function setBadgeDot(node, on) {
      if (!node) return;
      if (on) {
        node.classList.add("dot");
        node.style.display = "inline-block";
        node.textContent = "";
      } else {
        node.style.display = "none";
        node.textContent = "";
      }
    }
    function updateUnreadBadges() {
      const day = currentStageMs();
      setBadgeCount(badgeChat, unreadChatCount(day));
      setBadgeDot(badgeMoments, unreadMomentsCount(day) > 0);
      setBadgeDot(badgeContacts, unreadArticlesCount(day) > 0);
      const meCount = Object.entries(accountNoticeMap).filter(([id, on]) => on && id !== activeAccountId && isAccountUnlocked(id)).length;
      setBadgeDot(badgeMe, meCount > 0);
      updateStatusProgress(accountView.style.display === 'flex' ? "accounts" : undefined);
    }
    function hasStageMessages(conv, day) {
      return (conv.messages || []).some((m) => toDayKey(m.timestamp || m.timeText || "") <= day);
    }
    function hasNewMessagesOnDay(conv, day) {
      return (conv.messages || []).some((m) => toDayKey(m.timestamp || m.timeText || "") === day);
    }
    function hasAutoplayUnread(conv, day) {
      const seen = getStageSeen(day);
      return !seen[conv.id] && hasNewMessagesOnDay(conv, day);
    }
    function toListTimeRuntime(timeText) {
      if (!timeText) return "";
      const parts = String(timeText).split(" ");
      return parts[1] || parts[0] || "";
    }
    function toSnippetRuntime(message, conv) {
      if (!message) return "";
      if (message.recall) return "[消息已撤回]";
      if (message.kind === "image") return "[图片]";
      if (message.kind === "voice") {
        return ('[语音] ' + (message.durationSec ? (String(message.durationSec) + '"') : '')).trim();
      }
      if (message.kind === "article-card") {
        const raw = message.articleCard || {};
        const title = raw.title || (raw.refId ? (conv.articles?.[raw.refId]?.title || "") : "");
        return ('[文章] ' + title).trim();
      }
      if (message.kind === "contact-card") {
        const raw = message.contactCard || {};
        const refName = raw.refId ? (conv.profiles?.users?.[raw.refId]?.name || raw.refId) : "";
        return ('[名片] ' + (raw.name || refName || "")).trim();
      }
      if (message.kind === "link-card") {
        const title = message.linkCard?.title || message.linkCard?.url || "链接";
        return "[链接] " + title;
      }
      const txt = String(message.text || "").replace(/\s+/g, " ").trim();
      return txt.length > 60 ? (txt.slice(0, 60) + "...") : txt;
    }
    function listDisplayMessage(conv, day) {
      const messages = conv.messages || [];
      const visible = messages.filter((m) => toDayKey(m.timestamp || m.timeText || "") <= day);
      if (!visible.length) return null;
      if (hasAutoplayUnread(conv, day)) {
        const firstToday = messages.find((m) => toDayKey(m.timestamp || m.timeText || "") === day);
        if (firstToday) return firstToday;
      }
      return visible[visible.length - 1];
    }
    function debugLog(label, data) {
      if (!debugState.enabled) return;
      try {
        console.log("[chat-debug]", label, data);
      } catch (_) {
        // Ignore console errors.
      }
    }
    function getPeerId(conv) {
      const self = activeAccountId || conv.self;
      const participants = Array.from(new Set((conv.messages || []).map((m) => String(m.senderId))));
      return participants.find((id) => id !== self) || conv.chat?.peer || "";
    }
    function conversationTitle(conv) {
      if (conv.chat?.type === "single") {
        const peerId = getPeerId(conv);
        const selfProfile = conv.profiles?.users?.[activeAccountId || conv.self] || {};
        return selfProfile.aliases?.contacts?.[peerId]
          || conv.profiles?.users?.[peerId]?.name
          || conv.title
          || peerId
          || "单聊";
      }
      return conv.title || "群聊";
    }

    function setStageStatusTime() {
      if (!statusTime) return;
      statusTime.textContent = currentStageMs();
      updateStatusProgress();
    }

    function conversationUnlockMs(conv) {
      const first = conv.messages?.[0];
      return toDayKey(first?.timestamp || first?.timeText || "");
    }

    function isVisibleByAccount(conv) {
      return conversationMatchesAccount(conv, activeAccountId);
    }

    function isVisibleByStage(conv) {
      if (!isVisibleByAccount(conv)) return false;
      const unlock = conversationUnlockMs(conv);
      return unlock ? unlock <= currentStageMs() : true;
    }

    function isCurrentStageConversation(conv) {
      if (!isVisibleByAccount(conv)) return false;
      return hasNewMessagesOnDay(conv, currentStageMs());
    }

    function maybeAdvanceStage() {
      const curMs = currentStageMs();
      if (stageIndex < timelineStages.length - 1) {
        const need = (payload.conversations || []).filter((c) => isCurrentStageConversation(c)).map((c) => c.id);
        const hasStageContent = collectContentUnitsForAccount(activeAccountId).some((unit) => unit.day === curMs);
        if (hasStageContent) {
          const seen = getStageSeen(curMs);
          const allChatDone = need.every((id) => !!seen[id]);
          const momentsDone = unreadMomentsCount(curMs) === 0;
          const articlesDone = unreadArticlesCount(curMs) === 0;
          if (allChatDone && momentsDone && articlesDone) {
            stageIndex += 1;
            persistStageIndexForAccount();
            saveSeen();
            setStageStatusTime();
            renderList();
          }
        }
      }
      if (isAccountFullyCompleted()) {
        const next = nextLockedAccount();
        if (next) {
          unlockedAccounts[next] = true;
          accountNoticeMap[next] = true;
          saveSeen();
          updateUnreadBadges();
        }
      }
    }

    function isAccountFullyCompleted() {
      return stageIndex >= timelineStages.length - 1
        && unreadChatCount(currentStageMs()) === 0
        && unreadMomentsCount(currentStageMs()) === 0
        && unreadArticlesCount(currentStageMs()) === 0;
    }

    function esc(s) {
      return String(s || '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
    }

    function inferReplayDelayMs(message) {
      function readingChars(value) {
        return String(value || '').replace(/\s/g, '').length;
      }
      function collectReplayText(msg) {
        if (!msg || typeof msg !== 'object') return '';
        const parts = [];
        if (msg.text) parts.push(String(msg.text));
        if (msg.kind === 'link-card') {
          parts.push(msg.linkCard?.title || '');
          parts.push(msg.linkCard?.desc || '');
          parts.push(msg.linkCard?.site || '');
        }
        if (msg.kind === 'article-card') {
          parts.push(msg.articleCard?.title || '');
          parts.push(msg.articleCard?.summary || msg.articleCard?.desc || '');
        }
        if (msg.kind === 'contact-card') {
          parts.push(msg.contactCard?.name || '');
          parts.push(msg.contactCard?.nickName || '');
          parts.push(msg.contactCard?.bio || '');
        }
        return parts.filter(Boolean).join(' ');
      }
      const textChars = readingChars(collectReplayText(message));
      const readingMs = 800 + textChars * 120;
      if (message?.kind === 'voice') {
        const voiceMs = Math.max(1500, Number(message.durationSec || 0) * 1000);
        return Math.max(voiceMs, Math.min(12000, readingMs));
      }
      if (message?.kind === 'image') {
        return Math.max(1800, Math.min(9000, readingMs));
      }
      if (message?.kind === 'article-card' || message?.kind === 'contact-card' || message?.kind === 'link-card') {
        return Math.max(2000, Math.min(10000, readingMs));
      }
      return Math.max(900, Math.min(12000, readingMs));
    }

    const emojiMap = {
      "微笑":"🙂","撇嘴":"😒","色":"😍","发呆":"😳","得意":"😎","流泪":"😢","害羞":"☺️","闭嘴":"🤐","睡":"😴","大哭":"😭",
      "尴尬":"😅","发怒":"😠","调皮":"😜","呲牙":"😁","惊讶":"😮","难过":"😞","酷":"😎","冷汗":"😓","抓狂":"😫","吐":"🤮",
      "偷笑":"🤭","愉快":"😄","白眼":"🙄","傲慢":"😤","困":"🥱","惊恐":"😱","憨笑":"😄","悠闲":"😌","咒骂":"🤬","疑问":"❓",
      "嘘":"🤫","晕":"😵","衰":"🥴","骷髅":"💀","敲打":"👊","再见":"👋","擦汗":"😓","抠鼻":"👃","鼓掌":"👏","坏笑":"😏",
      "左哼哼":"😤","右哼哼":"😤","哈欠":"🥱","鄙视":"😒","委屈":"🥺","快哭了":"🥹","阴险":"😈","亲亲":"😘","吓":"😨","可怜":"🥺",
      "菜刀":"🔪","西瓜":"🍉","啤酒":"🍺","咖啡":"☕","蛋糕":"🍰","玫瑰":"🌹","凋谢":"🥀","爱心":"❤️","心碎":"💔","强":"👍",
      "弱":"👎","握手":"🤝","胜利":"✌️","抱拳":"🙏","勾引":"👉","拳头":"👊","OK":"👌","跳跳":"💃","发抖":"🫨","怄火":"😤",
      "转圈":"🌀","捂脸":"🤦","奸笑":"😏","机智":"🧠","皱眉":"😣","耶":"✌️","旺柴":"🐶","社会社会":"😎","吃瓜":"🍉","加油":"💪",
      "汗":"😓","天啊":"😱","Emm":"😶","让我看看":"👀","叹气":"😮‍💨","苦涩":"😖","裂开":"🫠"
    };

    function linkify(text) {
      const escaped = esc(text || '');
      return escaped.replace(/(https?:\\/\\/[^\\s<]+)/g, '<a class="inline-link" href="$1" target="_blank" rel="noreferrer">$1</a>');
    }
    function emojify(text) {
      return String(text || '').replace(/\\[([^\\[\\]]+)\\]/g, (m, key) => emojiMap[key] || m);
    }
    function mentionify(htmlText) {
      return htmlText.replace(/(^|[\\s>])@([A-Za-z0-9_\\-\\u4e00-\\u9fa5]+)/g, '$1<span class="mention">@$2</span>');
    }
    function formatText(text) {
      return mentionify(linkify(emojify(text || '')));
    }
    function safeMarkdownUrl(raw) {
      const value = String(raw || "").trim();
      if (/^(https?:)?\\/\\//i.test(value) || value.startsWith("/") || value.startsWith("./") || value.startsWith("../")) return value;
      return "#";
    }
    function renderMarkdownInline(raw) {
      let html = esc(raw || "");
      html = html.replace(/!\\[([^\\]]*)\\]\\(([^)]+)\\)/g, (_m, alt, url) => (
        '<img src="' + esc(safeMarkdownUrl(url)) + '" alt="' + esc(alt) + '"/>'
      ));
      html = html.replace(/\\[([^\\]]+)\\]\\(([^)]+)\\)/g, (_m, text, url) => (
        '<a href="' + esc(safeMarkdownUrl(url)) + '" target="_blank" rel="noreferrer">' + text + '</a>'
      ));
      html = html.replace(/\\*\\*([^*]+)\\*\\*/g, '<strong>$1</strong>');
      html = html.replace(/\\*([^*]+)\\*/g, '<em>$1</em>');
      return html;
    }
    function renderMarkdown(markdown) {
      const lines = String(markdown || "").replace(/\\r\\n/g, "\\n").split("\\n");
      const html = [];
      let paragraph = [];
      let list = [];
      let quote = [];
      function flushParagraph() {
        if (!paragraph.length) return;
        html.push('<p>' + renderMarkdownInline(paragraph.join(" ")) + '</p>');
        paragraph = [];
      }
      function flushList() {
        if (!list.length) return;
        html.push('<ul>' + list.map((item) => '<li>' + renderMarkdownInline(item) + '</li>').join('') + '</ul>');
        list = [];
      }
      function flushQuote() {
        if (!quote.length) return;
        html.push('<blockquote>' + quote.map((line) => '<p>' + renderMarkdownInline(line) + '</p>').join('') + '</blockquote>');
        quote = [];
      }
      function flushAll() {
        flushParagraph();
        flushList();
        flushQuote();
      }
      for (const rawLine of lines) {
        const line = rawLine.trim();
        if (!line) {
          flushAll();
          continue;
        }
        const heading = line.match(/^(#{1,3})\\s+(.+)$/);
        if (heading) {
          flushAll();
          const level = heading[1].length;
          html.push('<h' + level + '>' + renderMarkdownInline(heading[2]) + '</h' + level + '>');
          continue;
        }
        if (/^>\\s?/.test(line)) {
          flushParagraph();
          flushList();
          quote.push(line.replace(/^>\\s?/, ""));
          continue;
        }
        if (/^[-*]\\s+/.test(line)) {
          flushParagraph();
          flushQuote();
          list.push(line.replace(/^[-*]\\s+/, ""));
          continue;
        }
        if (/^!\\[[^\\]]*\\]\\([^)]+\\)$/.test(line)) {
          flushAll();
          html.push(renderMarkdownInline(line));
          continue;
        }
        flushList();
        flushQuote();
        paragraph.push(line);
      }
      flushAll();
      return html.join('');
    }
    function formatVoiceDuration(sec) {
      const n = Number(sec || 0);
      return n > 0 ? n + '"' : '语音';
    }
    function setVoiceState(btn, playing) {
      if (!btn) return;
      const icon = btn.querySelector('.voice-icon');
      btn.classList.toggle('playing', !!playing);
      if (icon) icon.textContent = playing ? '▮▮' : '▶';
    }
    function stopActiveAudio() {
      if (activeAudio) {
        activeAudio.pause();
        activeAudio = null;
      }
      setVoiceState(activeVoiceBtn, false);
      activeVoiceBtn = null;
    }
    function parseIdentityReference(raw) {
      if (!raw) return null;
      const text = String(raw).trim();
      if (!text) return null;
      const normalized = /^\d{4}-\d{2}-\d{2}$/.test(text)
        ? text + 'T00:00:00'
        : text.replace(' ', 'T');
      const time = new Date(normalized).getTime();
      return Number.isNaN(time) ? null : time;
    }
    function resolveEffectiveProfile(user, referenceTime) {
      const refMs = parseIdentityReference(referenceTime) ?? Date.now();
      let name = user?.name || user?.id || '';
      let bio = user?.bio || '';
      const timeline = Array.isArray(user?.identityTimeline) ? user.identityTimeline : [];
      timeline.forEach((entry) => {
        if (!entry || typeof entry.effectiveAtMs !== 'number' || entry.effectiveAtMs > refMs) return;
        if (entry.name !== undefined) name = entry.name;
        if (entry.bio !== undefined) bio = entry.bio;
      });
      return { name, bio };
    }
    function openProfileByDataset(data) {
      profileAvatar.src = data.avatar || '';
      profileName.textContent = data.name || data.displayName || data.nickName || '';
      profileWechat.textContent = '昵称：' + (data.displayName || data.nickName || data.name || '未设置');
      profileBio.textContent = '简介：' + (data.bio || '无');
      profileModal.classList.add('show');
      profileModal.setAttribute('aria-hidden', 'false');
    }
    function closeProfile() {
      profileModal.classList.remove('show');
      profileModal.setAttribute('aria-hidden', 'true');
    }
    function resolveDisplayName(conv, senderId) {
      const self = activeAccountId || conv.self;
      const users = conv.profiles?.users || {};
      const sender = users[senderId] || { name: senderId };
      const selfProfile = users[self] || {};
      
      const resolveSenderName = () => resolveEffectiveProfile(sender, currentStageMs()).name || sender.name || senderId;
      const resolveSelfName = () => resolveEffectiveProfile(selfProfile, currentStageMs()).name || selfProfile.name || senderId;

      if (conv.chat?.type === "group" && senderId === self) {
        return selfProfile.aliases?.selfInGroups?.[conv.title] || resolveSelfName();
      }
      return selfProfile.aliases?.contacts?.[senderId] || resolveSenderName();
    }
    function recallText(msg, conv, user) {
      return msg.senderId === conv.self ? '你撤回了一条消息' : (resolveDisplayName(conv, msg.senderId) || user.name || msg.senderId) + ' 撤回了一条消息';
    }
    function renderQuote(quote, conv) {
      if (!quote) return '';
      const sender = resolveDisplayName(conv, quote.senderId) || quote.senderId || '';
      return '<div class="quote"><div>' + esc(sender) + ' · ' + esc(quote.timeText || '') + '</div><div>' + esc(quote.snippet || '') + '</div></div>';
    }
    function resolveContactCard(msg, conv) {
      const raw = msg.contactCard || {};
      const fromProfile = raw.refId ? (conv.profiles?.users?.[raw.refId] || {}) : {};
      const resolvedProfile = resolveEffectiveProfile(fromProfile, currentStageMs());
      return {
        refId: raw.refId || "",
        name: resolvedProfile.name || raw.name || raw.refId || "",
        nickName: fromProfile.nickName || raw.nickName || resolvedProfile.name || raw.name || raw.refId || "",
        avatar: fromProfile.avatar || raw.avatar || "",
        bio: resolvedProfile.bio || raw.bio || ""
      };
    }

    function renderContent(msg, conv) {
      if (msg.kind === 'image') {
        const caption = msg.text ? '<div class="img-caption">' + formatText(msg.text) + '</div>' : '';
        return '<img class="img" src="' + esc(msg.imageUrl || '') + '" alt="image"/>' + caption;
      }
      if (msg.kind === 'voice') {
        const caption = msg.text ? '<div class="img-caption">' + formatText(msg.text) + '</div>' : '';
        return '<button class="voice-btn" type="button" data-audio-url="' + esc(msg.audioUrl || '') + '">'
          + '<span class="voice-icon">▶</span>'
          + '<span class="voice-duration">' + esc(formatVoiceDuration(msg.durationSec)) + '</span>'
          + '</button>' + caption;
      }
      if (msg.kind === 'link-card') {
        const c = msg.linkCard || {};
        return '<a class="card" href="' + esc(c.url || '#') + '" target="_blank" rel="noreferrer">'
          + '<div class="card-title">' + esc(c.title || c.url || '链接') + '</div>'
          + '<div class="card-desc">' + esc(c.desc || '') + '</div>'
          + '<div class="card-footer"><span>' + esc(c.site || '') + '</span><span>链接卡片</span></div>'
          + '</a>';
      }
      if (msg.kind === 'article-card') {
        const raw = msg.articleCard || {};
        const repo = conv.articles || {};
        const fromRepo = raw.refId ? (repo[raw.refId] || {}) : {};
        const a = {
          title: fromRepo.title || raw.title || "",
          author: fromRepo.author || raw.author || "",
          publishRaw: fromRepo.publishAt || raw.publishAt || "",
          cover: fromRepo.cover || raw.cover || "",
          summary: fromRepo.summary || raw.summary || "",
          text: fromRepo.markdown || fromRepo.body || fromRepo.text || raw.markdown || raw.body || raw.text || "",
          images: Array.isArray(fromRepo.images) ? fromRepo.images : (raw.images || [])
        };
        const cover = a.cover ? '<img class="article-cover" src="' + esc(a.cover) + '" alt="cover"/>' : '';
        const summary = a.summary ? '<div class="article-summary">' + formatText(a.summary) + '</div>' : '';
        return '<button class="article-card" type="button"'
          + ' data-title="' + esc(a.title || '') + '"'
          + ' data-author="' + esc(a.author || '') + '"'
          + ' data-publish-raw="' + esc(a.publishRaw || '') + '"'
          + ' data-cover="' + esc(a.cover || '') + '"'
          + ' data-text="' + esc(a.text || '') + '"'
          + ' data-images="' + esc((a.images || []).join(",")) + '"'
          + '>'
          + '<div class="article-title">' + esc(a.title || '文章') + '</div>'
          + '<div class="article-meta">' + esc(a.author || '') + '</div>'
          + cover + summary
          + '</button>';
      }
      if (msg.kind === 'contact-card') {
        const c = resolveContactCard(msg, conv);
        return '<div class="contact-card">'
          + '<img class="contact-avatar" src="' + esc(c.avatar || '') + '" alt="contact"/>'
          + '<div><div class="contact-name">' + esc(c.name || '') + '</div>'
          + '<div class="contact-nick">' + esc(c.nickName ? ('昵称：' + c.nickName) : '') + '</div>'
          + '<div class="contact-bio">' + esc(c.bio || '') + '</div></div>'
          + '</div>';
      }
      return '<div>' + formatText(msg.text || '') + '</div>';
    }

    function renderMessage(msg, conv, options) {
      const opts = options || {};
      const user = conv.profiles.users?.[msg.senderId] || { name: msg.senderId, avatar: '' };
      const resolvedProfile = resolveEffectiveProfile(user, currentStageMs());
      const self = activeAccountId || conv.self;
      const displayName = resolveDisplayName(conv, msg.senderId);
      const selfCls = msg.senderId === self ? 'msg self' : 'msg';
        const avatar = '<button class="avatar-btn" type="button"'
         + ' data-name="' + esc(resolvedProfile.name || msg.senderId) + '"'
         + ' data-display-name="' + esc(displayName || user.nickName || resolvedProfile.name || msg.senderId || '') + '"'
         + ' data-bio="' + esc(resolvedProfile.bio || '') + '"'
         + ' data-avatar="' + esc(user.avatar || '') + '">'
         + '<img class="avatar" src="' + esc(user.avatar || '') + '" alt="' + esc(displayName || resolvedProfile.name || msg.senderId) + '"/>'
         + '</button>';
      const bubbleCls = (msg.kind === 'image' || msg.kind === 'voice') ? 'bubble media' : 'bubble';
      const body = (opts.forceRecalled && msg.recall)
        ? '<div class="recall-tip">' + esc(recallText(msg, conv, user)) + '</div>'
        : '<div class="' + bubbleCls + '">' + renderQuote(msg.quote, conv) + renderContent(msg, conv) + '</div>';
      const main = '<div class="msg-main">'
        + '<p class="meta">' + esc(displayName || msg.senderId) + ' · ' + esc(msg.timeText || '') + '</p>'
        + '<div class="msg-body">' + body + '</div>'
        + '</div>';
      const html = msg.senderId === self ? main + avatar : avatar + main;
      return '<article class="' + selfCls + '" data-cid="' + esc(opts.conversationId || '') + '" data-mid="' + esc(msg.id || '') + '">' + html + '</article>';
    }

    function applyRecall(conversationId, msg, conv) {
      const node = timeline.querySelector('article[data-cid="' + conversationId + '"][data-mid="' + msg.id + '"] .msg-body');
      if (!node) return;
      const user = conv.profiles.users?.[msg.senderId] || { name: msg.senderId };
      node.innerHTML = '<div class="recall-tip">' + esc(recallText(msg, conv, user)) + '</div>';
    }

    function queueRecall(conversationId, msg, conv) {
      if (!msg.recall) return;
      const delay = Math.max(0, Number(msg.recallDelayMs ?? msg.recall?.delayMs ?? 0));
      const t = window.setTimeout(() => applyRecall(conversationId, msg, conv), delay);
      recallTimers.push(t);
    }

    function clearTimer() {
      if (timer) {
        window.clearTimeout(timer);
        timer = null;
      }
      activePlayback = null;
      recallTimers.forEach((t) => window.clearTimeout(t));
      recallTimers = [];
      stopActiveAudio();
      heartbeatEngine.reset();
    }
    function stopPlaybackTimer() {
      if (timer) {
        window.clearTimeout(timer);
        timer = null;
      }
    }

    function schedulePlayback(nextStep, delay) {
      stopPlaybackTimer();
      timer = window.setTimeout(nextStep, Math.max(0, Number(delay || 0)));
    }

    function markSeen(conversationId) {
      seenMap[keyWithAccount(conversationId)] = true;
      const day = currentStageMs();
      const seen = getStageSeen(day);
      seen[conversationId] = true;
      debugLog("markSeen", { account: activeAccountId, day, conversationId, stageSeen: { ...seen } });
      saveSeen();
      updateUnreadBadges();
      maybeAdvanceStage();
    }

    function finishConversation(conversationId) {
      if (activePlayback?.conversationId === conversationId) {
        activePlayback.finished = true;
        activePlayback = null;
      }
      if (timer) {
        window.clearTimeout(timer);
        timer = null;
      }
      if (!timeline.querySelector('.end-tip')) {
        timeline.insertAdjacentHTML('beforeend', '<div class="end-tip">当前聊天已结束</div>');
      }
      timeline.scrollTop = timeline.scrollHeight;
      debugLog("finishConversation", { account: activeAccountId, day: currentStageMs(), conversationId });
      heartbeatEngine.reset();
      markSeen(conversationId);
    }

    function renderList() {
      setStageStatusTime();
      updateUnreadBadges();
      const day = currentStageMs();
      listScroll.innerHTML = payload.conversations.filter((c) => isVisibleByStage(c)).map((c) => {
        const hasUnread = hasAutoplayUnread(c, day);
        const dot = hasUnread ? '<span class="list-dot"></span>' : '';
        const displayMsg = listDisplayMessage(c, day);
        const preview = displayMsg ? toSnippetRuntime(displayMsg, c) : (c.preview || "");
        const listTime = displayMsg ? toListTimeRuntime(displayMsg.timeText || displayMsg.timestamp || "") : (c.listTime || "");
        debugLog("renderList:item", {
          account: activeAccountId,
          day,
          conversationId: c.id,
          hasUnread,
          displayMid: displayMsg?.id || "",
          displayDay: displayMsg ? toDayKey(displayMsg.timestamp || displayMsg.timeText || "") : "",
          preview,
          listTime
        });
        return '<button class="list-item" data-id="' + esc(c.id) + '">'
          + '<div class="list-avatar-wrap"><img class="list-avatar" src="' + esc(c.avatar || '') + '" alt="avatar"/>' + dot + '</div>'
          + '<div class="list-main">'
          + '<div class="list-title">' + esc(conversationTitle(c)) + '</div>'
          + '<div class="list-preview">' + esc(preview) + '</div>'
          + '</div>'
          + '<div class="list-time">' + esc(listTime) + '</div>'
          + '</button>';
      }).join('');

      listScroll.querySelectorAll('.list-item').forEach((item) => {
        item.addEventListener('click', () => openConversation(item.dataset.id));
      });
    }

    function openConversation(conversationId) {
      clearTimer();
      const conv = payload.conversations.find((x) => x.id === conversationId);
      if (!conv) return;
      if (!isVisibleByStage(conv)) return;

      listView.style.display = 'none';
      momentsView.style.display = 'none';
      contactsView.style.display = 'none';
      detailView.style.display = 'flex';
      accountView.style.display = 'none';
      tabChat.classList.add('active');
      tabMoments.classList.remove('active');
      chatTitle.textContent = conversationTitle(conv) || '';
      setStageStatusTime();
      timeline.innerHTML = '';

      const stageMs = currentStageMs();
      const stageSeen = getStageSeen(stageMs);
      const prevStageMs = stageIndex > 0 ? timelineStages[stageIndex - 1] : "";
      const stageMessages = (conv.messages || []).filter((m) => toDayKey(m.timestamp || m.timeText || "") <= stageMs);
      const oldMessages = prevStageMs
        ? (conv.messages || []).filter((m) => toDayKey(m.timestamp || m.timeText || "") <= prevStageMs)
        : [];
      debugLog("openConversation", {
        account: activeAccountId,
        day: stageMs,
        conversationId,
        stageSeen: !!stageSeen[conversationId],
        stageMessages: stageMessages.length,
        oldMessages: oldMessages.length
      });
      if (!stageMessages.length) {
        finishConversation(conversationId);
        return;
      }

      if (stageSeen[conversationId]) {
        const full = stageMessages.map((msg) => renderMessage(msg, conv, { conversationId, forceRecalled: true })).join('');
        timeline.innerHTML = full + '<div class="end-tip">当前聊天已结束</div>';
        timeline.scrollTop = timeline.scrollHeight;
        return;
      }

      if (oldMessages.length) {
        timeline.innerHTML = oldMessages.map((msg) => renderMessage(msg, conv, { conversationId, forceRecalled: true })).join('');
      } else {
        timeline.innerHTML = '';
      }

      const playback = {
        conversationId,
        stageMessages,
        current: oldMessages.length,
        finished: false,
        playNext: null
      };
      activePlayback = playback;

      if (playback.current >= stageMessages.length) {
        finishConversation(conversationId);
        return;
      }

      function revealNextMessage() {
        if (activePlayback !== playback || playback.finished) return;
        if (playback.current >= stageMessages.length) {
          stopPlaybackTimer();
          finishConversation(conversationId);
          return;
        }
        const msg = stageMessages[playback.current];
        if (msg.heartbeat !== undefined) heartbeatEngine.setLevel(msg.heartbeat);
        timeline.insertAdjacentHTML('beforeend', renderMessage(msg, conv, { conversationId }));
        queueRecall(conversationId, msg, conv);
        timeline.scrollTop = timeline.scrollHeight;
        playback.current += 1;
        if (playback.current >= stageMessages.length) {
          schedulePlayback(() => {
            if (activePlayback === playback && !playback.finished) finishConversation(conversationId);
          }, inferReplayDelayMs(msg));
          return;
        }
        schedulePlayback(revealNextMessage, inferReplayDelayMs(msg));
      }

      playback.playNext = revealNextMessage;
      revealNextMessage();
    }

    function acceleratePlayback() {
      if (!activePlayback || activePlayback.finished || typeof activePlayback.playNext !== "function") return;
      stopPlaybackTimer();
      activePlayback.playNext();
    }

    function renderAccountList() {
      accountListWrap.innerHTML = accountIds.filter((id) => isAccountUnlocked(id)).map((id) => {
        const user = payload.conversations.find((c) => c.profiles?.users?.[id])?.profiles?.users?.[id] || {};
        const name = resolveAccountCardName(user, id);
        const avatar = payload.conversations.find((c) => c.profiles?.users?.[id])?.profiles?.users?.[id]?.avatar || "";
        const current = id === activeAccountId ? '<div class="account-current">● 当前使用</div>' : '';
        return '<button class="account-card" type="button" data-id="' + esc(id) + '">'
          + '<img class="account-avatar" src="' + esc(avatar) + '" alt="avatar"/>'
          + '<div><div class="account-name">' + esc(name) + '</div></div>'
          + current
          + '</button>';
      }).join('') + '<button class="account-reset" type="button">重置数据</button>';
      accountListWrap.querySelectorAll('.account-card').forEach((btn) => {
        btn.addEventListener('click', () => {
          activeAccountId = btn.dataset.id || activeAccountId;
          accountNoticeMap[activeAccountId] = false;
          initTimelineStages();
          saveSeen();
          showChatList();
          clearTimer();
          renderList();
        });
      });
      const resetBtn = accountListWrap.querySelector('.account-reset');
      if (resetBtn) {
        resetBtn.addEventListener('click', () => {
          localStorage.clear();
          window.location.reload();
        });
      }
    }

    function showAccountView() {
      renderAccountList();
      accountNoticeMap[activeAccountId] = false;
      for (const id of Object.keys(accountNoticeMap)) {
        if (isAccountUnlocked(id)) accountNoticeMap[id] = false;
      }
      saveSeen();
      updateUnreadBadges();
      listView.style.display = 'none';
      momentsView.style.display = 'none';
      contactsView.style.display = 'none';
      detailView.style.display = 'none';
      accountView.style.display = 'flex';
      updateStatusProgress("accounts");
    }

    backBtn.addEventListener('click', () => {
      clearTimer();
      showChatList();
    });
    tabChat.addEventListener('click', () => {
      clearTimer();
      showChatList();
    });
    tabContacts.addEventListener('click', showContacts);
    tabMoments.addEventListener('click', showMoments);
    tabMe.addEventListener('click', showAccountView);
    accountBack.addEventListener('click', showChatList);

    profileClose.addEventListener('click', closeProfile);
    profileModal.addEventListener('click', (e) => {
      if (e.target === profileModal) closeProfile();
    });
    timeline.addEventListener('click', (e) => {
      const avatarBtn = e.target.closest('.avatar-btn');
      if (avatarBtn) {
        openProfileByDataset(avatarBtn.dataset);
        return;
      }
      const articleBtn = e.target.closest('.article-card');
      if (articleBtn) {
        const data = {
          title: articleBtn.dataset.title || "",
          author: articleBtn.dataset.author || "",
          publishRaw: articleBtn.dataset.publishRaw || "",
          cover: articleBtn.dataset.cover || "",
          text: articleBtn.dataset.text || "",
          images: (articleBtn.dataset.images || "").split(",").filter(Boolean)
        };
        openInlineArticle(data);
        return;
      }
      const voiceBtn = e.target.closest('.voice-btn');
      if (voiceBtn) {
        const src = voiceBtn.dataset.audioUrl || '';
        if (!src) return;

        if (activeVoiceBtn === voiceBtn && activeAudio && !activeAudio.paused) {
          stopActiveAudio();
          return;
        }

        stopActiveAudio();
        activeAudio = new Audio(src);
        activeVoiceBtn = voiceBtn;
        setVoiceState(voiceBtn, true);
        activeAudio.addEventListener('ended', stopActiveAudio);
        activeAudio.play().catch(() => stopActiveAudio());
        return;
      }

      if (e.target.closest('a, button')) return;
      acceleratePlayback();
    });
    contactsScroll.addEventListener('click', (e) => {
      const btn = e.target.closest('.oa-open');
      if (!btn) return;
      const idx = Number(btn.dataset.idx || -1);
      const item = articleRows[idx];
      if (item) {
        const seen = getArticleSeen(currentStageMs());
        seen[item.id] = true;
        saveSeen();
        updateUnreadBadges();
        maybeAdvanceStage();
      }
      openArticle(idx);
    });
    articleBack.addEventListener('click', closeArticle);

    loadSeen();
    initAccounts();
    initTimelineStages();
    showChatList();
    renderList();
    heartbeatEngine.start();
    document.addEventListener('click', function resumeHeartbeat() {
      document.removeEventListener('click', resumeHeartbeat);
      if (!heartbeatEngine.isRunning()) heartbeatEngine.start();
    }, { once: true });
  </script>
</body>
</html>`;
}

/**
 * Render a story page that chains multiple multi-chat scenes.
 * Users can move to next scene by right swipe when current scene is fully watched.
 *
 * @param {{
 *   title?: string,
 *   persistKey?: string,
 *   scenes: Array<{
 *     id: string,
 *     title: string,
 *     ui?: Record<string, unknown>,
 *     conversations: Array<Record<string, unknown>>
 *   }>
 * }} input - Story render input.
 * @returns {string} Full HTML document.
 */
export function renderWechatStoryHtml(input) {
  const storyTitle = input.title || "剧情聊天";
  const scenes = (input.scenes || []).map((scene, idx) => ({
    id: scene.id || `scene-${idx + 1}`,
    title: scene.title || `第${idx + 1}幕`,
    ui: normalizeUi(scene.ui || {}),
    conversations: scene.conversations || []
  }));

  const payload = safeJson({
    title: storyTitle,
    persistKey: input.persistKey || "chat_story_seen_v1",
    scenes
  });

  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(storyTitle)}</title>
  <style>
    :root { --bg:#efefef; --panel:#f7f7f7; --text:#1f1f1f; --muted:#8c8c8c; --line:#e3e3e3; --incoming:#fff; --outgoing:#95ec69; --green:#07c160; }
    * { box-sizing: border-box; }
    body { margin: 0; background: #d9d9d9; font-family: "PingFang SC", "Helvetica Neue", sans-serif; color: var(--text); }
    .phone { max-width: 390px; margin: 0 auto; min-height: 100vh; background: var(--bg); display: flex; flex-direction: column; border-left: 1px solid #cfcfcf; border-right: 1px solid #cfcfcf; }
    .status-bar { height: 26px; padding: 3px 12px; display: flex; align-items: center; justify-content: space-between; font-size: 12px; background: var(--panel); }
    .top-nav { height: 46px; border-bottom: 1px solid var(--line); display: grid; align-items: center; grid-template-columns: 1fr auto 1fr; padding: 0 12px; background: var(--panel); font-weight: 600; }
    .center-title { justify-self: center; font-size: 20px; letter-spacing: .5px; }
    .top-right { justify-self: end; font-size: 13px; color: #666; }
    .scene-tip { display:none; margin: 8px 12px 0; padding: 8px 10px; border-radius: 8px; background: #e8fff2; color: #0f7f4a; font-size: 12px; }
    .scene-tip.show { display: block; }
    .scene-next-btn { border: none; background: transparent; color: #0f7f4a; margin-left: 6px; cursor: pointer; font-size: 12px; text-decoration: underline; }
    .list-view { display:flex; flex-direction:column; flex:1; min-height:0; }
    .list-scroll { overflow-y:auto; flex:1; min-height:0; background:#fff; }
    .list-item { width:100%; border:none; border-bottom:1px solid #efefef; background:#fff; padding:10px 12px; display:grid; grid-template-columns:50px 1fr auto; column-gap:10px; text-align:left; cursor:pointer; }
    .list-avatar { width:50px; height:50px; border-radius:6px; object-fit:cover; background:#ddd; }
    .list-title { font-size:18px; line-height:1.25; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; margin-top:2px; }
    .list-preview { margin-top:4px; font-size:16px; color:#a0a0a0; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .list-time { font-size:14px; color:#b0b0b0; margin-top:4px; padding-left:6px; }
    .tabbar { height:54px; border-top:1px solid var(--line); background:var(--panel); display:grid; grid-template-columns:repeat(4,1fr); align-items:center; text-align:center; font-size:12px; color:#8f8f8f; }
    .tabbar .active { color: var(--green); font-weight: 600; }
    .detail-view { display:none; flex-direction:column; flex:1; min-height:0; }
    .chat-top { height:46px; border-bottom:1px solid var(--line); display:grid; grid-template-columns:1fr minmax(0, auto) 1fr; align-items:center; background:var(--panel); padding:0 8px; gap:8px; }
    .back-btn { border:none; background:transparent; color:#4f4f4f; font-size:15px; cursor:pointer; padding:6px 8px; justify-self:start; }
    .chat-title { font-size:17px; font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; justify-self:center; text-align:center; min-width:0; max-width:100%; }
    .chat-top-spacer { justify-self:end; width:44px; height:1px; }
    .timeline { flex:1; min-height:0; overflow-y:auto; padding:12px; }
    .msg { display:grid; grid-template-columns:42px 1fr; gap:10px; margin-bottom:14px; }
    .msg.self { grid-template-columns:1fr 42px; }
    .avatar-btn { border:none; padding:0; background:transparent; cursor:pointer; width:42px; height:42px; border-radius:8px; }
    .avatar { width:42px; height:42px; border-radius:8px; object-fit:cover; background:#ddd; }
    .msg-main { width:fit-content; max-width:80%; } .msg.self .msg-main { margin-left:auto; } .msg.self .msg-body { display:flex; justify-content:flex-end; }
    .meta { font-size:12px; color:var(--muted); margin:0 0 4px; } .msg.self .meta { text-align:right; }
    .bubble { display:inline-block; max-width:100%; border-radius:10px; padding:10px 12px; background:var(--incoming); word-break:break-word; line-height:1.45; white-space:pre-wrap; }
    .msg.self .bubble { background:var(--outgoing); text-align:left; }
    .bubble.media { padding:4px; background:transparent; }
    .recall-tip { font-size:12px; color:var(--muted); text-align:center; padding:4px 0; }
    .quote { margin-bottom:8px; background:rgba(0,0,0,.06); border-left:3px solid rgba(0,0,0,.18); border-radius:6px; padding:6px 8px; font-size:12px; color:#333; }
    .img { max-width:min(320px,100%); border-radius:8px; display:block; }
    .img-caption { margin-top:6px; font-size:13px; line-height:1.4; }
    .voice-btn { border:none; background:transparent; padding:0; font:inherit; color:inherit; cursor:pointer; display:flex; align-items:center; gap:8px; }
    .voice-icon { font-size:12px; color:#3b3b3b; }
    .voice-duration { font-size:13px; color:#3b3b3b; min-width:26px; text-align:left; }
    .voice-btn.playing .voice-icon { color:#07c160; }
    .card { display:block; border-radius:8px; background:#f8f8f8; padding:9px; text-decoration:none; color:inherit; }
    .card-title { font-size:14px; font-weight:600; margin-bottom:4px; }
    .card-desc { font-size:12px; color:var(--muted); margin-bottom:8px; }
    .card-footer { display:flex; justify-content:space-between; font-size:11px; color:var(--muted); }
    .article-card { border:none; display:block; width:100%; text-align:left; cursor:pointer; border-radius:8px; background:#f8f8f8; padding:9px; }
    .article-title { font-size:14px; font-weight:600; line-height:1.4; }
    .article-meta { margin-top:4px; font-size:11px; color:var(--muted); }
    .article-cover { width:100%; margin-top:8px; border-radius:6px; max-height:150px; object-fit:cover; background:#ddd; }
    .article-summary { margin-top:7px; font-size:12px; color:#4c4c4c; line-height:1.45; }
    .contact-card { border-radius:8px; background:#f8f8f8; padding:10px; display:flex; gap:9px; align-items:center; }
    .contact-avatar { width:42px; height:42px; border-radius:8px; object-fit:cover; background:#ddd; }
    .contact-name { font-size:14px; font-weight:600; }
    .contact-nick { margin-top:2px; font-size:11px; color:var(--muted); }
    .contact-bio { margin-top:6px; font-size:12px; color:#4c4c4c; line-height:1.35; }
    .inline-link { color:#576b95; }
    .mention { color:#576b95; font-weight:600; }
    .end-tip { font-size:12px; color:var(--muted); text-align:center; margin:16px 0 4px; }
    .profile-modal { position: fixed; inset: 0; display: none; align-items: center; justify-content: center; padding: 16px; background: rgba(0,0,0,.35); z-index: 20; }
    .profile-modal.show { display: flex; }
    .profile-card { width: min(320px, 100%); background: #fff; border-radius: 12px; padding: 14px; box-shadow: 0 12px 30px rgba(0,0,0,.2); }
    .profile-head { display:flex; gap:10px; align-items:center; margin-bottom:10px; }
    .profile-avatar { width:50px; height:50px; border-radius:8px; object-fit:cover; background:#ddd; }
    .profile-name { font-size:16px; font-weight:600; }
    .profile-item { font-size:13px; color:#444; line-height:1.45; margin-top:4px; word-break:break-word; }
    .profile-close { margin-top:12px; width:100%; border:none; border-radius:8px; background:#f2f2f2; padding:8px 0; cursor:pointer; }
    [data-theme="iterms"] { --bg:#0a0d14; --panel:#0d1117; --text:#33ff66; --muted:#6aaa70; --line:#173020; --incoming:#141b22; --outgoing:#0e2a15; --green:#00ff41; --accent:#00ff41; --glow:0 0 6px rgba(0,255,65,0.45); }
    [data-theme="iterms"] body { font-family:"SF Mono","Menlo","Courier New",monospace; background:#05080d; }
    [data-theme="iterms"] .phone { background:var(--bg); border-color:#173020; }
    [data-theme="iterms"] .status-bar,[data-theme="iterms"] .top-nav { background:var(--panel); color:var(--text); border-color:var(--line); }
    [data-theme="iterms"] .list-scroll { background:#0a0d14; }
    [data-theme="iterms"] .list-item { background:#0a0d14; border-color:#142018; color:var(--text); }
    [data-theme="iterms"] .list-item:hover { background:#0d1a12; }
    [data-theme="iterms"] .list-title { color:var(--text); }
    [data-theme="iterms"] .list-preview { color:#7aba80; }
    [data-theme="iterms"] .list-time { color:#6aaa70; }
    [data-theme="iterms"] .list-avatar { border-radius:2px; }
    [data-theme="iterms"] .tabbar { background:var(--panel); border-color:var(--line); }
    [data-theme="iterms"] .tabbar .active { color:var(--accent); text-shadow:var(--glow); }
    [data-theme="iterms"] .chat-top { background:var(--panel); border-color:var(--line); }
    [data-theme="iterms"] .chat-title { color:var(--text); text-shadow:0 0 4px rgba(0,255,65,0.3); }
    [data-theme="iterms"] .back-btn { color:var(--accent); }
    [data-theme="iterms"] .timeline { background:var(--bg); }
    [data-theme="iterms"] .msg .meta { color:var(--muted); }
    [data-theme="iterms"] .bubble { color:var(--text); background:var(--incoming); border:1px solid var(--line); border-radius:2px; text-shadow:0 0 3px rgba(0,255,65,0.2); }
    [data-theme="iterms"] .msg.self .bubble { background:var(--outgoing); border-color:#1a4020; color:#d0ffd0; }
    [data-theme="iterms"] .bubble.media { background:transparent; border:none; text-shadow:none; }
    [data-theme="iterms"] .quote { border-left-color:var(--accent); background:#0d1a12; color:#a0e0a0; text-shadow:0 0 3px rgba(0,255,65,0.15); }
    [data-theme="iterms"] .img { border:1px solid #1a4020; }
    [data-theme="iterms"] .avatar { border-radius:2px; }
    [data-theme="iterms"] .card { background:#0d1a12; border-color:var(--line); color:var(--text); }
    [data-theme="iterms"] .article-card { background:#0d1a12; border-color:var(--line); border-radius:2px; color:var(--text); }
    [data-theme="iterms"] .contact-card { background:#0d1a12; border-color:var(--line); border-radius:2px; color:var(--text); }
    [data-theme="iterms"] .contact-name { color:var(--text); }
    [data-theme="iterms"] .contact-nick { color:var(--muted); }
    [data-theme="iterms"] .contact-avatar { border-radius:2px; }
    [data-theme="iterms"] .inline-link { color:var(--accent); }
    [data-theme="iterms"] .mention { color:var(--accent); text-shadow:0 0 4px rgba(0,255,65,0.4); }
    [data-theme="iterms"] .profile-modal { background:rgba(0,8,5,.75); }
    [data-theme="iterms"] .profile-card { background:#0a1016; border:1px solid var(--line); box-shadow:0 0 20px rgba(0,255,65,.15); border-radius:4px; }
    [data-theme="iterms"] .profile-name { color:var(--accent); text-shadow:var(--glow); }
    [data-theme="iterms"] .profile-item { color:var(--text); }
    [data-theme="iterms"] .profile-close { background:#0d1a12; border:1px solid var(--line); color:var(--text); }
    [data-theme="iterms"] .profile-avatar { border-radius:2px; }
    [data-theme="iterms"] .end-tip { color:var(--muted); }
    [data-theme="iterms"] .recall-tip { color:var(--muted); }
    [data-theme="iterms"] .voice-icon { color:var(--accent); }
    [data-theme="iterms"] .voice-btn.playing .voice-icon { color:#fff; }
    [data-theme="iterms"] .scene-tip { background:#0a1a10; color:var(--accent); }
    [data-theme="iterms"] .scene-next-btn { color:var(--accent); }
  </style>
</head>
<body>
  <main id="phone" class="phone">
    <div class="status-bar">
      <div id="status-carrier">中国移动</div>
      <div id="status-time">12:21</div>
      <div id="status-battery">31%</div>
    </div>

    <section id="list-view" class="list-view">
      <header class="top-nav">
        <div></div>
        <div class="center-title" id="top-title">微信</div>
        <div class="top-right" id="scene-title"></div>
      </header>
      <div id="scene-tip" class="scene-tip">
        当前幕已全部看完，触屏右滑或点击按钮进入下一幕
        <button id="next-scene-btn" class="scene-next-btn">进入下一幕</button>
      </div>
      <div id="list-scroll" class="list-scroll"></div>
      <footer class="tabbar"><div class="active">对话</div><div>文档</div><div>社交</div><div>账号</div></footer>
    </section>

    <section id="detail-view" class="detail-view">
      <header class="chat-top">
        <button id="back-btn" class="back-btn">返回</button>
        <div class="chat-title" id="chat-title"></div>
        <div class="chat-top-spacer" aria-hidden="true"></div>
      </header>
      <div class="timeline" id="timeline"></div>
    </section>
  </main>
  <aside id="profile-modal" class="profile-modal" aria-hidden="true">
    <div class="profile-card">
      <div class="profile-head">
        <img id="profile-avatar" class="profile-avatar" src="" alt="avatar"/>
        <div id="profile-name" class="profile-name"></div>
      </div>
      <div id="profile-wechat" class="profile-item"></div>
      <div id="profile-bio" class="profile-item"></div>
      <button id="profile-close" class="profile-close" type="button">关闭</button>
    </div>
  </aside>

  <script id="story-data" type="application/json">${payload}</script>
  <script>
    const payload = JSON.parse(document.getElementById('story-data').textContent);
    const phone = document.getElementById('phone');
    const listView = document.getElementById('list-view');
    const detailView = document.getElementById('detail-view');
    const listScroll = document.getElementById('list-scroll');
    const backBtn = document.getElementById('back-btn');
    const timeline = document.getElementById('timeline');
    const chatTitle = document.getElementById('chat-title');
    const statusCarrier = document.getElementById('status-carrier');
    const statusTime = document.getElementById('status-time');
    const statusBattery = document.getElementById('status-battery');
    const topTitle = document.getElementById('top-title');
    const sceneTitle = document.getElementById('scene-title');
    const sceneTip = document.getElementById('scene-tip');
    const nextSceneBtn = document.getElementById('next-scene-btn');
    const profileModal = document.getElementById('profile-modal');
    const profileAvatar = document.getElementById('profile-avatar');
    const profileName = document.getElementById('profile-name');
    const profileWechat = document.getElementById('profile-wechat');
    const profileBio = document.getElementById('profile-bio');
    const profileClose = document.getElementById('profile-close');

    const persistKey = payload.persistKey || 'chat_story_seen_v1';
    let timer = null;
    let recallTimers = [];
    let activeAudio = null;
    let activeVoiceBtn = null;
    let storyState = { currentScene: 0, seen: {} };
    let touchStartX = 0;
    let touchStartY = 0;

    ${HEARTBEAT_ENGINE_JS}

    function esc(s) {
      return String(s || '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
    }
    function inferReplayDelayMs(message) {
      function readingChars(value) {
        return String(value || '').replace(/\s/g, '').length;
      }
      function collectReplayText(msg) {
        if (!msg || typeof msg !== 'object') return '';
        const parts = [];
        if (msg.text) parts.push(String(msg.text));
        if (msg.kind === 'link-card') {
          parts.push(msg.linkCard?.title || '');
          parts.push(msg.linkCard?.desc || '');
          parts.push(msg.linkCard?.site || '');
        }
        if (msg.kind === 'article-card') {
          parts.push(msg.articleCard?.title || '');
          parts.push(msg.articleCard?.summary || msg.articleCard?.desc || '');
        }
        if (msg.kind === 'contact-card') {
          parts.push(msg.contactCard?.name || '');
          parts.push(msg.contactCard?.nickName || '');
          parts.push(msg.contactCard?.bio || '');
        }
        return parts.filter(Boolean).join(' ');
      }
      const textChars = readingChars(collectReplayText(message));
      const readingMs = 800 + textChars * 120;
      if (message?.kind === 'voice') {
        const voiceMs = Math.max(1500, Number(message.durationSec || 0) * 1000);
        return Math.max(voiceMs, Math.min(12000, readingMs));
      }
      if (message?.kind === 'image') {
        return Math.max(1800, Math.min(9000, readingMs));
      }
      if (message?.kind === 'article-card' || message?.kind === 'contact-card' || message?.kind === 'link-card') {
        return Math.max(2000, Math.min(10000, readingMs));
      }
      return Math.max(900, Math.min(12000, readingMs));
    }
    const emojiMap = {
      "微笑":"🙂","撇嘴":"😒","色":"😍","发呆":"😳","得意":"😎","流泪":"😢","害羞":"☺️","闭嘴":"🤐","睡":"😴","大哭":"😭",
      "尴尬":"😅","发怒":"😠","调皮":"😜","呲牙":"😁","惊讶":"😮","难过":"😞","酷":"😎","冷汗":"😓","抓狂":"😫","吐":"🤮",
      "偷笑":"🤭","愉快":"😄","白眼":"🙄","傲慢":"😤","困":"🥱","惊恐":"😱","憨笑":"😄","悠闲":"😌","咒骂":"🤬","疑问":"❓",
      "嘘":"🤫","晕":"😵","衰":"🥴","骷髅":"💀","敲打":"👊","再见":"👋","擦汗":"😓","抠鼻":"👃","鼓掌":"👏","坏笑":"😏",
      "左哼哼":"😤","右哼哼":"😤","哈欠":"🥱","鄙视":"😒","委屈":"🥺","快哭了":"🥹","阴险":"😈","亲亲":"😘","吓":"😨","可怜":"🥺",
      "菜刀":"🔪","西瓜":"🍉","啤酒":"🍺","咖啡":"☕","蛋糕":"🍰","玫瑰":"🌹","凋谢":"🥀","爱心":"❤️","心碎":"💔","强":"👍",
      "弱":"👎","握手":"🤝","胜利":"✌️","抱拳":"🙏","勾引":"👉","拳头":"👊","OK":"👌","跳跳":"💃","发抖":"🫨","怄火":"😤",
      "转圈":"🌀","捂脸":"🤦","奸笑":"😏","机智":"🧠","皱眉":"😣","耶":"✌️","旺柴":"🐶","社会社会":"😎","吃瓜":"🍉","加油":"💪",
      "汗":"😓","天啊":"😱","Emm":"😶","让我看看":"👀","叹气":"😮‍💨","苦涩":"😖","裂开":"🫠"
    };
    function linkify(text) {
      const escaped = esc(text || '');
      return escaped.replace(/(https?:\\/\\/[^\\s<]+)/g, '<a class="inline-link" href="$1" target="_blank" rel="noreferrer">$1</a>');
    }
    function emojify(text) {
      return String(text || '').replace(/\\[([^\\[\\]]+)\\]/g, (m, key) => emojiMap[key] || m);
    }
    function mentionify(htmlText) {
      return htmlText.replace(/(^|[\\s>])@([A-Za-z0-9_\\-\\u4e00-\\u9fa5]+)/g, '$1<span class="mention">@$2</span>');
    }
    function formatText(text) {
      return mentionify(linkify(emojify(text || '')));
    }
    function formatVoiceDuration(sec) {
      const n = Number(sec || 0);
      return n > 0 ? n + '"' : '语音';
    }
    function setVoiceState(btn, playing) {
      if (!btn) return;
      const icon = btn.querySelector('.voice-icon');
      btn.classList.toggle('playing', !!playing);
      if (icon) icon.textContent = playing ? '▮▮' : '▶';
    }
    function stopActiveAudio() {
      if (activeAudio) {
        activeAudio.pause();
        activeAudio = null;
      }
      setVoiceState(activeVoiceBtn, false);
      activeVoiceBtn = null;
    }
    function openProfileByDataset(data) {
      profileAvatar.src = data.avatar || '';
      profileName.textContent = data.name || data.displayName || data.nickName || '';
      profileWechat.textContent = '昵称：' + (data.displayName || data.nickName || data.name || '未设置');
      profileBio.textContent = '简介：' + (data.bio || '无');
      profileModal.classList.add('show');
      profileModal.setAttribute('aria-hidden', 'false');
    }
    function closeProfile() {
      profileModal.classList.remove('show');
      profileModal.setAttribute('aria-hidden', 'true');
    }
    function resolveStoryDisplayName(conv, senderId) {
      const self = activeAccountId || conv.self;
      const users = conv.profiles?.users || {};
      const sender = users[senderId] || { name: senderId };
      const selfProfile = users[self] || {};
      
      const resolveSenderName = () => resolveEffectiveProfile(sender, currentStageMs()).name || sender.name || senderId;
      const resolveSelfName = () => resolveEffectiveProfile(selfProfile, currentStageMs()).name || selfProfile.name || senderId;

      if (conv.chat?.type === "group" && senderId === self) {
        return selfProfile.aliases?.selfInGroups?.[conv.title] || resolveSelfName();
      }
      return selfProfile.aliases?.contacts?.[senderId] || resolveSenderName();
    }
    function getStoryPeerId(conv) {
      const self = conv.self;
      const participants = Array.from(new Set((conv.messages || []).map((m) => String(m.senderId))));
      return participants.find((id) => id !== self) || conv.chat?.peer || '';
    }
    function conversationTitle(conv) {
      if (conv.chat?.type === 'single') {
        const peerId = getStoryPeerId(conv);
        const selfProfile = conv.profiles?.users?.[conv.self] || {};
        return selfProfile.aliases?.contacts?.[peerId]
          || conv.profiles?.users?.[peerId]?.name
          || conv.title
          || peerId
          || '单聊';
      }
      return conv.title || '群聊';
    }
    function recallText(msg, conv, user) {
      return msg.senderId === conv.self ? '你撤回了一条消息' : (resolveStoryDisplayName(conv, msg.senderId) || user.name || msg.senderId) + ' 撤回了一条消息';
    }
    function loadState() {
      try {
        const raw = localStorage.getItem(persistKey);
        storyState = raw ? JSON.parse(raw) : { currentScene: 0, seen: {} };
      } catch (_) {
        storyState = { currentScene: 0, seen: {} };
      }
      if (typeof storyState.currentScene !== 'number') storyState.currentScene = 0;
      if (!storyState.seen || typeof storyState.seen !== 'object') storyState.seen = {};
    }
    function saveState() {
      try { localStorage.setItem(persistKey, JSON.stringify(storyState)); } catch (_) {}
    }
    function currentScene() {
      const idx = Math.max(0, Math.min(payload.scenes.length - 1, Number(storyState.currentScene || 0)));
      return payload.scenes[idx];
    }
    function sceneSeenMap(sceneId) {
      if (!storyState.seen[sceneId]) storyState.seen[sceneId] = {};
      return storyState.seen[sceneId];
    }
    function isSceneCompleted(scene) {
      const seen = sceneSeenMap(scene.id);
      if (!scene.conversations.length) return true;
      return scene.conversations.every((c) => !!seen[c.id]);
    }
    function hasNextScene() {
      return Number(storyState.currentScene || 0) < payload.scenes.length - 1;
    }
    function clearTimer() {
      if (timer) { window.clearTimeout(timer); timer = null; }
      recallTimers.forEach((t) => window.clearTimeout(t));
      recallTimers = [];
      stopActiveAudio();
      heartbeatEngine.reset();
    }
    function stopPlaybackTimer() {
      if (timer) { window.clearTimeout(timer); timer = null; }
    }
    function schedulePlayback(nextStep, delay) {
      stopPlaybackTimer();
      timer = window.setTimeout(nextStep, Math.max(0, Number(delay || 0)));
    }
    function applySceneUi(scene) {
      const ui = scene.ui || {};
      statusCarrier.textContent = ui.statusBar?.carrier || '中国移动';
      statusTime.textContent = ui.statusBar?.time || '12:21';
      statusBattery.textContent = ui.statusBar?.battery || '31%';
      topTitle.textContent = ui.topTitle || '微信';
      sceneTitle.textContent = scene.title || '';
      phone.setAttribute('data-theme', ui.theme || 'wechat');
    }
    function renderQuote(quote, conv) {
      if (!quote) return '';
      const sender = resolveStoryDisplayName(conv, quote.senderId) || quote.senderId || '';
      return '<div class="quote"><div>' + esc(sender) + ' · ' + esc(quote.timeText || '') + '</div><div>' + esc(quote.snippet || '') + '</div></div>';
    }
    function resolveStoryContactCard(msg, conv) {
      const raw = msg.contactCard || {};
      const fromProfile = raw.refId ? (conv.profiles?.users?.[raw.refId] || {}) : {};
      const resolvedProfile = resolveEffectiveProfile(fromProfile, msg.timestamp || msg.timeText || '');
      return {
        refId: raw.refId || "",
        name: resolvedProfile.name || raw.name || raw.refId || "",
        nickName: fromProfile.nickName || raw.nickName || resolvedProfile.name || raw.name || raw.refId || "",
        avatar: fromProfile.avatar || raw.avatar || "",
        bio: resolvedProfile.bio || raw.bio || ""
      };
    }
    function renderContent(msg, conv) {
      if (msg.kind === 'image') {
        const caption = msg.text ? '<div class="img-caption">' + formatText(msg.text) + '</div>' : '';
        return '<img class="img" src="' + esc(msg.imageUrl || '') + '" alt="image"/>' + caption;
      }
      if (msg.kind === 'voice') {
        const caption = msg.text ? '<div class="img-caption">' + formatText(msg.text) + '</div>' : '';
        return '<button class="voice-btn" type="button" data-audio-url="' + esc(msg.audioUrl || '') + '">'
          + '<span class="voice-icon">▶</span>'
          + '<span class="voice-duration">' + esc(formatVoiceDuration(msg.durationSec)) + '</span>'
          + '</button>' + caption;
      }
      if (msg.kind === 'link-card') {
        const c = msg.linkCard || {};
        return '<a class="card" href="' + esc(c.url || '#') + '" target="_blank" rel="noreferrer">'
          + '<div class="card-title">' + esc(c.title || c.url || '链接') + '</div>'
          + '<div class="card-desc">' + esc(c.desc || '') + '</div>'
          + '<div class="card-footer"><span>' + esc(c.site || '') + '</span><span>链接卡片</span></div></a>';
      }
      if (msg.kind === 'article-card') {
        const raw = msg.articleCard || {};
        const repo = conv.articles || {};
        const fromRepo = raw.refId ? (repo[raw.refId] || {}) : {};
        const a = {
          title: fromRepo.title || raw.title || "",
          author: fromRepo.author || raw.author || "",
          cover: fromRepo.cover || raw.cover || "",
          summary: fromRepo.summary || raw.summary || "",
          text: fromRepo.text || raw.text || "",
          images: Array.isArray(fromRepo.images) ? fromRepo.images : (raw.images || [])
        };
        const cover = a.cover ? '<img class="article-cover" src="' + esc(a.cover) + '" alt="cover"/>' : '';
        const summary = a.summary ? '<div class="article-summary">' + formatText(a.summary) + '</div>' : '';
        return '<button class="article-card" type="button"'
          + ' data-title="' + esc(a.title || '') + '"'
          + ' data-author="' + esc(a.author || '') + '"'
          + ' data-cover="' + esc(a.cover || '') + '"'
          + ' data-text="' + esc(a.text || '') + '"'
          + ' data-images="' + esc((a.images || []).join(",")) + '"'
          + '>'
          + '<div class="article-title">' + esc(a.title || '文章') + '</div>'
          + '<div class="article-meta">' + esc(a.author || '') + '</div>'
          + cover + summary
          + '</button>';
      }
      if (msg.kind === 'contact-card') {
        const c = resolveStoryContactCard(msg, conv);
        return '<div class="contact-card">'
          + '<img class="contact-avatar" src="' + esc(c.avatar || '') + '" alt="contact"/>'
          + '<div><div class="contact-name">' + esc(c.name || '') + '</div>'
          + '<div class="contact-nick">' + esc(c.nickName ? ('昵称：' + c.nickName) : '') + '</div>'
          + '<div class="contact-bio">' + esc(c.bio || '') + '</div></div>'
          + '</div>';
      }
      return '<div>' + formatText(msg.text || '') + '</div>';
    }
    function renderMessage(msg, conv, options) {
      const opts = options || {};
      const user = conv.profiles.users?.[msg.senderId] || { name: msg.senderId, avatar: '' };
      const resolvedProfile = resolveEffectiveProfile(user, msg.timestamp || msg.timeText || '');
      const self = conv.self;
      const displayName = resolveStoryDisplayName(conv, msg.senderId);
      const selfCls = msg.senderId === self ? 'msg self' : 'msg';
        const avatar = '<button class="avatar-btn" type="button"'
         + ' data-name="' + esc(resolvedProfile.name || msg.senderId) + '"'
         + ' data-display-name="' + esc(displayName || user.nickName || resolvedProfile.name || msg.senderId || '') + '"'
         + ' data-bio="' + esc(resolvedProfile.bio || '') + '"'
         + ' data-avatar="' + esc(user.avatar || '') + '">'
         + '<img class="avatar" src="' + esc(user.avatar || '') + '" alt="' + esc(displayName || resolvedProfile.name || msg.senderId) + '"/>'
         + '</button>';
      const bubbleCls = (msg.kind === 'image' || msg.kind === 'voice') ? 'bubble media' : 'bubble';
      const body = (opts.forceRecalled && msg.recall)
        ? '<div class="recall-tip">' + esc(recallText(msg, conv, user)) + '</div>'
        : '<div class="' + bubbleCls + '">' + renderQuote(msg.quote, conv) + renderContent(msg, conv) + '</div>';
      const main = '<div class="msg-main"><p class="meta">' + esc(displayName || msg.senderId) + ' · ' + esc(msg.timeText || '') + '</p><div class="msg-body">' + body + '</div></div>';
      const html = msg.senderId === self ? main + avatar : avatar + main;
      return '<article class="' + selfCls + '" data-cid="' + esc(opts.conversationId || '') + '" data-mid="' + esc(msg.id || '') + '">' + html + '</article>';
    }
    function applyRecall(conversationId, msg, conv) {
      const node = timeline.querySelector('article[data-cid="' + conversationId + '"][data-mid="' + msg.id + '"] .msg-body');
      if (!node) return;
      const user = conv.profiles.users?.[msg.senderId] || { name: msg.senderId };
      node.innerHTML = '<div class="recall-tip">' + esc(recallText(msg, conv, user)) + '</div>';
    }
    function queueRecall(conversationId, msg, conv) {
      if (!msg.recall) return;
      const delay = Math.max(0, Number(msg.recallDelayMs ?? msg.recall?.delayMs ?? 0));
      const t = window.setTimeout(() => applyRecall(conversationId, msg, conv), delay);
      recallTimers.push(t);
    }
    function renderSceneTip(scene) {
      const show = isSceneCompleted(scene) && hasNextScene();
      sceneTip.classList.toggle('show', show);
    }
    function markSeen(sceneId, conversationId) {
      const seen = sceneSeenMap(sceneId);
      seen[conversationId] = true;
      saveState();
      renderSceneTip(currentScene());
    }
    function finishConversation(scene, conversationId) {
      timeline.insertAdjacentHTML('beforeend', '<div class="end-tip">当前聊天已结束</div>');
      timeline.scrollTop = timeline.scrollHeight;
      heartbeatEngine.reset();
      markSeen(scene.id, conversationId);
    }
    function renderList() {
      const scene = currentScene();
      applySceneUi(scene);
      renderSceneTip(scene);
      listScroll.innerHTML = scene.conversations.map((c) => {
        return '<button class="list-item" data-id="' + esc(c.id) + '"><img class="list-avatar" src="' + esc(c.avatar || '') + '" alt="avatar"/>'
          + '<div class="list-main"><div class="list-title">' + esc(c.title || '') + '</div><div class="list-preview">' + esc(c.preview || '') + '</div></div>'
          + '<div class="list-time">' + esc(c.listTime || '') + '</div></button>';
      }).join('');
      listScroll.querySelectorAll('.list-item').forEach((item) => {
        item.addEventListener('click', () => openConversation(item.dataset.id));
      });
    }
    function openConversation(conversationId) {
      clearTimer();
      const scene = currentScene();
      const conv = scene.conversations.find((x) => x.id === conversationId);
      if (!conv) return;

      listView.style.display = 'none';
      detailView.style.display = 'flex';
       chatTitle.textContent = conversationTitle(conv) || '';
      timeline.innerHTML = '';

      const seen = sceneSeenMap(scene.id);
      if (!conv.messages.length) { finishConversation(scene, conversationId); return; }
      if (seen[conversationId]) {
        timeline.innerHTML = conv.messages.map((msg) => renderMessage(msg, conv, { conversationId, forceRecalled: true })).join('') + '<div class="end-tip">当前聊天已结束</div>';
        timeline.scrollTop = timeline.scrollHeight;
        return;
      }
      let current = Math.max(0, Number(conv.startIndex || 0));
      if (conv.messages[current] && conv.messages[current].heartbeat !== undefined) heartbeatEngine.setLevel(conv.messages[current].heartbeat);
      timeline.insertAdjacentHTML('beforeend', renderMessage(conv.messages[current], conv, { conversationId }));
      queueRecall(conversationId, conv.messages[current], conv);
      timeline.scrollTop = timeline.scrollHeight;
      current += 1;
      schedulePlayback(function playNext() {
        if (current >= conv.messages.length) {
          stopPlaybackTimer();
          finishConversation(scene, conversationId);
          return;
        }
        if (conv.messages[current] && conv.messages[current].heartbeat !== undefined) heartbeatEngine.setLevel(conv.messages[current].heartbeat);
        timeline.insertAdjacentHTML('beforeend', renderMessage(conv.messages[current], conv, { conversationId }));
        queueRecall(conversationId, conv.messages[current], conv);
        timeline.scrollTop = timeline.scrollHeight;
        const delay = inferReplayDelayMs(conv.messages[current]);
        current += 1;
        schedulePlayback(playNext, delay);
      }, inferReplayDelayMs(conv.messages[current - 1]));
    }
    function goNextScene() {
      if (!hasNextScene()) return;
      const scene = currentScene();
      if (!isSceneCompleted(scene)) return;
      storyState.currentScene = Number(storyState.currentScene || 0) + 1;
      saveState();
      detailView.style.display = 'none';
      listView.style.display = 'flex';
      renderList();
    }
    function handleSwipeStart(e) {
      if (!e.touches || !e.touches.length) return;
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    }
    function handleSwipeEnd(e) {
      if (!e.changedTouches || !e.changedTouches.length) return;
      if (detailView.style.display === 'flex') return;
      const dx = e.changedTouches[0].clientX - touchStartX;
      const dy = e.changedTouches[0].clientY - touchStartY;
      const scene = currentScene();
      if (Math.abs(dx) > 80 && Math.abs(dy) < 40 && dx > 0 && isSceneCompleted(scene) && hasNextScene()) {
        goNextScene();
      }
    }

    backBtn.addEventListener('click', () => {
      clearTimer();
      detailView.style.display = 'none';
      listView.style.display = 'flex';
      renderSceneTip(currentScene());
    });
    profileClose.addEventListener('click', closeProfile);
    profileModal.addEventListener('click', (e) => {
      if (e.target === profileModal) closeProfile();
    });
    timeline.addEventListener('click', (e) => {
      const avatarBtn = e.target.closest('.avatar-btn');
      if (avatarBtn) {
        openProfileByDataset(avatarBtn.dataset);
        return;
      }
      const articleBtn = e.target.closest('.article-card');
      if (articleBtn) {
        const data = {
          title: articleBtn.dataset.title || "",
          author: articleBtn.dataset.author || "",
          cover: articleBtn.dataset.cover || "",
          text: articleBtn.dataset.text || "",
          images: (articleBtn.dataset.images || "").split(",").filter(Boolean)
        };
        openInlineArticle(data);
        return;
      }
      const voiceBtn = e.target.closest('.voice-btn');
      if (!voiceBtn) return;
      const src = voiceBtn.dataset.audioUrl || '';
      if (!src) return;

      if (activeVoiceBtn === voiceBtn && activeAudio && !activeAudio.paused) {
        stopActiveAudio();
        return;
      }

      stopActiveAudio();
      activeAudio = new Audio(src);
      activeVoiceBtn = voiceBtn;
      setVoiceState(voiceBtn, true);
      activeAudio.addEventListener('ended', stopActiveAudio);
      activeAudio.play().catch(() => stopActiveAudio());
    });
    nextSceneBtn.addEventListener('click', goNextScene);
    phone.addEventListener('touchstart', handleSwipeStart, { passive: true });
    phone.addEventListener('touchend', handleSwipeEnd, { passive: true });

    loadState();
    renderList();
    heartbeatEngine.start();
    document.addEventListener('click', function resumeHeartbeat() {
      document.removeEventListener('click', resumeHeartbeat);
      if (!heartbeatEngine.isRunning()) heartbeatEngine.start();
    }, { once: true });
  </script>
</body>
</html>`;
}
