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
function toSnippet(message, articles) {
  if (!message) return "";
  if (message.recall) return "[消息已撤回]";
  if (message.kind === "image") return "[图片]";
  if (message.kind === "voice") return `[语音] ${message.durationSec ? `${message.durationSec}"` : ""}`.trim();
  if (message.kind === "article-card") {
    const raw = message.articleCard || {};
    const title = raw.title || (raw.refId ? (articles?.[raw.refId]?.title || "") : "");
    return `[文章] ${title}`.trim();
  }
  if (message.kind === "contact-card") return `[名片] ${message.contactCard?.name || ""}`.trim();
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
      ? (conv.chat?.groupInfo?.name || "未命名群")
      : (conv.chat?.peer || "单聊");

    const listTimeSource = conv.messages.length
      ? conv.messages[conv.messages.length - 1].timeText
      : "";

    return {
      id: `conv-${index + 1}`,
      title: conv.chat?.title || conv.frontmatter?.title || `会话 ${index + 1}`,
      subtitle,
      avatar,
      self: selfId || "",
      replayIntervalMs: Number(conv.frontmatter?.replayIntervalMs || 1000),
      preview: toSnippet(startMessage, conv.articles),
      listTime: toListTime(listTimeSource),
      startIndex,
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
    searchPlaceholder: source.searchPlaceholder || "搜索",
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
    }
    .phone {
      max-width: 390px;
      margin: 0 auto;
      min-height: 100vh;
      background: var(--bg);
      display: flex;
      flex-direction: column;
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
    .top-nav .plus {
      justify-self: end;
      font-size: 22px;
      color: #444;
    }
    .search-wrap {
      padding: 9px 12px 10px;
      border-bottom: 1px solid var(--line);
      background: var(--panel);
    }
    .search {
      height: 34px;
      border-radius: 6px;
      border: 1px solid #ededed;
      background: #fff;
      color: #a3a3a3;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 15px;
      gap: 6px;
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
      padding: 10px 10px 20px;
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
      padding: 10px 10px 20px;
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
    .article-text { margin-top:14px; font-size:16px; line-height:1.8; color:#222; white-space:pre-wrap; word-break:break-word; }
    .article-images { margin-top:12px; display:grid; gap:8px; }
    .article-images img { width:100%; border-radius:8px; background:#ddd; }
    .list-scroll {
      overflow-y: auto;
      flex: 1;
      min-height: 0;
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
    .list-avatar {
      width: 50px;
      height: 50px;
      border-radius: 6px;
      object-fit: cover;
      background: #ddd;
    }
    .list-main {
      min-width: 0;
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
    .list-time {
      font-size: 14px;
      color: #b0b0b0;
      margin-top: 4px;
      padding-left: 6px;
    }
    .tabbar {
      height: 54px;
      border-top: 1px solid var(--line);
      background: var(--panel);
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
    .tab-item { position: relative; display:inline-flex; align-items:center; justify-content:center; min-width:44px; }
    .tab-badge { position:absolute; top:-6px; right:-10px; min-width:16px; height:16px; padding:0 4px; border-radius:10px; background:#ff3b30; color:#fff; font-size:10px; line-height:16px; display:none; text-align:center; box-sizing:border-box; }
    .account-view { display:none; flex-direction:column; flex:1; min-height:0; background:#efefef; }
    .account-top { height:46px; border-bottom:1px solid var(--line); display:grid; grid-template-columns:auto 1fr auto; align-items:center; padding:0 10px; background:var(--panel); }
    .account-back { border:none; background:transparent; color:#222; font-size:22px; cursor:pointer; padding:4px 6px; }
    .account-manage { font-size:14px; color:#1f1f1f; }
    .account-center { padding:26px 16px 10px; text-align:center; color:#222; font-size:18px; }
    .account-list-wrap { padding:8px 12px 18px; overflow-y:auto; flex:1; min-height:0; }
    .account-card { width:100%; border:none; background:#fff; border-radius:10px; padding:14px 12px; margin-bottom:10px; display:flex; align-items:center; gap:10px; text-align:left; cursor:pointer; }
    .account-avatar { width:52px; height:52px; border-radius:6px; object-fit:cover; background:#ddd; }
    .account-name { font-size:16px; color:#222; line-height:1.2; }
    .account-id { margin-top:6px; font-size:13px; color:#9b9b9b; }
    .account-current { margin-left:auto; font-size:14px; color:#07c160; white-space:nowrap; }
    .account-add { width:100%; border:1px dashed #d0d0d0; background:#fff; border-radius:10px; padding:14px 12px; display:flex; align-items:center; gap:10px; color:#6f6f6f; }
    .account-add-plus { width:52px; height:52px; border:1px dashed #cfcfcf; border-radius:8px; display:flex; align-items:center; justify-content:center; font-size:34px; color:#9d9d9d; line-height:1; }
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
      grid-template-columns: auto 1fr;
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
    }
    .chat-title {
      font-size: 17px;
      font-weight: 600;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .timeline {
      flex: 1;
      min-height: 0;
      overflow-y: auto;
      padding: 12px;
    }
    .msg { display: grid; grid-template-columns: 42px 1fr; gap: 10px; margin-bottom: 14px; }
    .msg.self { grid-template-columns: 1fr 42px; }
    .avatar-btn { border:none; padding:0; background:transparent; cursor:pointer; width:42px; height:42px; border-radius:8px; }
    .avatar { width: 42px; height: 42px; border-radius: 8px; object-fit: cover; background: #ddd; }
    .msg-main { width: fit-content; max-width: 80%; }
    .msg.self .msg-main { margin-left: auto; }
    .meta { font-size: 12px; color: var(--muted); margin: 0 0 4px; }
    .msg.self .meta { text-align: right; }
    .bubble { display: inline-block; max-width: 100%; border-radius: 10px; padding: 10px 12px; background: var(--incoming); word-break: break-word; line-height: 1.45; white-space: pre-wrap; }
    .msg.self .bubble { background: var(--outgoing); }
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
    .contact-card { border-radius:8px; background:#f8f8f8; padding:10px; display:flex; gap:9px; align-items:center; }
    .contact-avatar { width:42px; height:42px; border-radius:8px; object-fit:cover; background:#ddd; }
    .contact-name { font-size:14px; font-weight:600; }
    .contact-nick { margin-top:2px; font-size:11px; color:var(--muted); }
    .contact-bio { margin-top:6px; font-size:12px; color:#4c4c4c; line-height:1.35; }
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
</head>
<body>
  <main class="phone">
    <div class="status-bar">
      <div id="status-carrier">${escapeHtml(ui.statusBar.carrier)}</div>
      <div id="status-time">${escapeHtml(ui.statusBar.time)}</div>
      <div id="status-battery">${escapeHtml(ui.statusBar.battery)}</div>
    </div>

    <section id="list-view" class="list-view">
      <header class="top-nav">
        <div></div>
        <div class="center-title">${escapeHtml(ui.topTitle)}</div>
        <div class="plus">＋</div>
      </header>
      <div class="search-wrap">
        <div class="search">🔍 ${escapeHtml(ui.searchPlaceholder)}</div>
      </div>
      <div id="list-scroll" class="list-scroll"></div>
    </section>

    <section id="moments-view" class="moments-view">
      <header class="top-nav">
        <div></div>
        <div class="center-title">朋友圈</div>
        <div></div>
      </header>
      <div id="moments-scroll" class="moments-scroll"></div>
    </section>
    <section id="contacts-view" class="contacts-view">
      <header class="top-nav">
        <div></div>
        <div class="center-title">通讯录</div>
        <div></div>
      </header>
      <div id="contacts-scroll" class="contacts-scroll"></div>
    </section>

    <footer id="home-tabbar" class="tabbar">
      <div id="tab-chat" class="active tab-item">微信<span id="badge-chat" class="tab-badge"></span></div>
      <div id="tab-contacts" class="tab-item">通讯录<span id="badge-contacts" class="tab-badge"></span></div>
      <div id="tab-moments" class="tab-item">发现<span id="badge-moments" class="tab-badge"></span></div>
      <div id="tab-me" class="tab-item">我<span id="badge-me" class="tab-badge"></span></div>
    </footer>

    <section id="detail-view" class="detail-view">
      <header class="chat-top">
        <button id="back-btn" class="back-btn">返回</button>
        <div class="chat-title" id="chat-title"></div>
      </header>
      <div class="timeline" id="timeline"></div>
    </section>

    <section id="account-view" class="account-view">
      <header class="account-top">
        <button id="account-back" class="account-back" type="button">‹</button>
        <div></div>
        <div class="account-manage">管理</div>
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
    const tabChat = document.getElementById('tab-chat');
    const tabContacts = document.getElementById('tab-contacts');
    const tabMoments = document.getElementById('tab-moments');
    const tabMe = document.getElementById('tab-me');
    const badgeChat = document.getElementById('badge-chat');
    const badgeContacts = document.getElementById('badge-contacts');
    const badgeMoments = document.getElementById('badge-moments');
    const badgeMe = document.getElementById('badge-me');
    const homeTabbar = document.getElementById('home-tabbar');
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
    let articleRows = [];

    function parseMomentTime(raw) {
      if (!raw) return null;
      const t = String(raw).trim().replace(" ", "T");
      const d = new Date(t);
      return Number.isNaN(d.getTime()) ? null : d;
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
              nickName: user.nickName || user.wechatId || "",
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
      homeTabbar.style.display = 'grid';
      tabChat.classList.add('active');
      tabContacts.classList.remove('active');
      tabMoments.classList.remove('active');
      updateUnreadBadges();
    }

    function showMoments() {
      clearTimer();
      listView.style.display = 'none';
      detailView.style.display = 'none';
      contactsView.style.display = 'none';
      accountView.style.display = 'none';
      momentsView.style.display = 'flex';
      homeTabbar.style.display = 'grid';
      tabChat.classList.remove('active');
      tabContacts.classList.remove('active');
      tabMoments.classList.add('active');
      renderMoments();
      const seen = getMomentSeen(currentStageMs());
      for (const m of collectMoments()) seen[m.id] = true;
      saveSeen();
      updateUnreadBadges();
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
            text: String(item.text || item.content || ""),
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
      articleText.textContent = a.text || "";
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
      articleText.textContent = a.text || "";
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
      homeTabbar.style.display = 'grid';
      tabChat.classList.remove('active');
      tabContacts.classList.add('active');
      tabMoments.classList.remove('active');
      renderContacts();
      const seen = getArticleSeen(currentStageMs());
      for (const a of articleRows) seen[a.id] = true;
      saveSeen();
      updateUnreadBadges();
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

    function collectStageDaysForAccount(accountId) {
      const days = [];
      for (const conv of (payload.conversations || [])) {
        const self = String(conv.self || "");
        const match = (!accountId || accountId === "default")
          ? true
          : self === String(accountId);
        if (!match) continue;
        const first = conv.messages?.[0];
        const day = toDayKey(first?.timestamp || first?.timeText || "");
        if (day) days.push(day);
      }
      days.sort((a, b) => a.localeCompare(b, "zh-CN"));
      const uniq = [];
      for (const day of days) {
        if (!uniq.length || uniq[uniq.length - 1] !== day) uniq.push(day);
      }
      return uniq;
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
      return (payload.conversations || []).filter((c) => isVisibleByStage(c) && !seen[c.id]).length;
    }
    function unreadMomentsCount(day) {
      const seen = getMomentSeen(day);
      return collectMoments().filter((m) => !seen[m.id]).length;
    }
    function unreadArticlesCount(day) {
      const seen = getArticleSeen(day);
      return collectArticles().filter((a) => !seen[a.id]).length;
    }
    function setBadge(node, n) {
      if (!node) return;
      if (n > 0) {
        node.style.display = "inline-block";
        node.textContent = n > 99 ? "99+" : String(n);
      } else {
        node.style.display = "none";
        node.textContent = "";
      }
    }
    function updateUnreadBadges() {
      const day = currentStageMs();
      setBadge(badgeChat, unreadChatCount(day));
      setBadge(badgeMoments, unreadMomentsCount(day));
      setBadge(badgeContacts, unreadArticlesCount(day));
      const meCount = Object.entries(accountNoticeMap).filter(([id, on]) => on && id !== activeAccountId && isAccountUnlocked(id)).length;
      setBadge(badgeMe, meCount);
    }

    function setStageStatusTime() {
      if (!statusTime) return;
      statusTime.textContent = currentStageMs();
    }

    function conversationUnlockMs(conv) {
      const first = conv.messages?.[0];
      return toDayKey(first?.timestamp || first?.timeText || "");
    }

    function isVisibleByAccount(conv) {
      if (!activeAccountId || activeAccountId === "default") return true;
      return String(conv.self || "") === String(activeAccountId);
    }

    function isVisibleByStage(conv) {
      if (!isVisibleByAccount(conv)) return false;
      const unlock = conversationUnlockMs(conv);
      return unlock ? unlock <= currentStageMs() : true;
    }

    function isCurrentStageConversation(conv) {
      if (!isVisibleByAccount(conv)) return false;
      const unlock = conversationUnlockMs(conv);
      return !!unlock && unlock === currentStageMs();
    }

    function maybeAdvanceStage() {
      const curMs = currentStageMs();
      if (stageIndex < timelineStages.length - 1) {
        const need = (payload.conversations || []).filter((c) => isCurrentStageConversation(c)).map((c) => c.id);
        if (need.length) {
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
      profileName.textContent = data.name || '';
      profileWechat.textContent = '昵称：' + (data.nickName || '未设置');
      profileBio.textContent = '简介：' + (data.bio || '无');
      profileModal.classList.add('show');
      profileModal.setAttribute('aria-hidden', 'false');
    }
    function closeProfile() {
      profileModal.classList.remove('show');
      profileModal.setAttribute('aria-hidden', 'true');
    }
    function recallText(msg, conv, user) {
      return msg.senderId === conv.self ? '你撤回了一条消息' : (user.name || msg.senderId) + ' 撤回了一条消息';
    }
    function renderQuote(quote, profiles) {
      if (!quote) return '';
      const sender = profiles.users?.[quote.senderId]?.name || quote.senderId || '';
      return '<div class="quote"><div>' + esc(sender) + ' · ' + esc(quote.timeText || '') + '</div><div>' + esc(quote.snippet || '') + '</div></div>';
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
        const c = msg.contactCard || {};
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
      const self = activeAccountId || conv.self;
      const selfCls = msg.senderId === self ? 'msg self' : 'msg';
      const avatar = '<button class="avatar-btn" type="button"'
        + ' data-name="' + esc(user.name || msg.senderId) + '"'
        + ' data-nick-name="' + esc(user.nickName || user.wechatId || '') + '"'
        + ' data-bio="' + esc(user.bio || '') + '"'
        + ' data-avatar="' + esc(user.avatar || '') + '">'
        + '<img class="avatar" src="' + esc(user.avatar || '') + '" alt="' + esc(user.name || msg.senderId) + '"/>'
        + '</button>';
      const bubbleCls = (msg.kind === 'image' || msg.kind === 'voice') ? 'bubble media' : 'bubble';
      const body = (opts.forceRecalled && msg.recall)
        ? '<div class="recall-tip">' + esc(recallText(msg, conv, user)) + '</div>'
        : '<div class="' + bubbleCls + '">' + renderQuote(msg.quote, conv.profiles) + renderContent(msg, conv) + '</div>';
      const main = '<div class="msg-main">'
        + '<p class="meta">' + esc(user.name || msg.senderId) + ' · ' + esc(msg.timeText || '') + '</p>'
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
        window.clearInterval(timer);
        timer = null;
      }
      recallTimers.forEach((t) => window.clearTimeout(t));
      recallTimers = [];
      stopActiveAudio();
    }
    function stopPlaybackTimer() {
      if (timer) {
        window.clearInterval(timer);
        timer = null;
      }
    }

    function markSeen(conversationId) {
      seenMap[keyWithAccount(conversationId)] = true;
      const seen = getStageSeen(currentStageMs());
      seen[conversationId] = true;
      saveSeen();
      updateUnreadBadges();
      maybeAdvanceStage();
    }

    function finishConversation(conversationId) {
      timeline.insertAdjacentHTML('beforeend', '<div class="end-tip">当前聊天已结束</div>');
      timeline.scrollTop = timeline.scrollHeight;
      markSeen(conversationId);
    }

    function renderList() {
      setStageStatusTime();
      updateUnreadBadges();
      listScroll.innerHTML = payload.conversations.filter((c) => isVisibleByStage(c)).map((c) => {
        return '<button class="list-item" data-id="' + esc(c.id) + '">'
          + '<img class="list-avatar" src="' + esc(c.avatar || '') + '" alt="avatar"/>'
          + '<div class="list-main">'
          + '<div class="list-title">' + esc(c.title || '') + '</div>'
          + '<div class="list-preview">' + esc(c.preview || '') + '</div>'
          + '</div>'
          + '<div class="list-time">' + esc(c.listTime || '') + '</div>'
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
      homeTabbar.style.display = 'none';
      tabChat.classList.add('active');
      tabMoments.classList.remove('active');
      chatTitle.textContent = conv.title || '';
      timeline.innerHTML = '';

      const stageMs = currentStageMs();
      const stageSeen = getStageSeen(stageMs);
      const prevStageMs = stageIndex > 0 ? timelineStages[stageIndex - 1] : "";
      const stageMessages = (conv.messages || []).filter((m) => toDayKey(m.timestamp || m.timeText || "") <= stageMs);
      const oldMessages = prevStageMs
        ? (conv.messages || []).filter((m) => toDayKey(m.timestamp || m.timeText || "") <= prevStageMs)
        : [];
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

      let current = oldMessages.length;
      if (current >= stageMessages.length) {
        finishConversation(conversationId);
        return;
      }

      timeline.insertAdjacentHTML('beforeend', renderMessage(stageMessages[current], conv, { conversationId }));
      queueRecall(conversationId, stageMessages[current], conv);
      timeline.scrollTop = timeline.scrollHeight;
      current += 1;

      const step = Math.max(100, Number(conv.replayIntervalMs || 1000));
      timer = window.setInterval(() => {
        if (current >= stageMessages.length) {
          stopPlaybackTimer();
          finishConversation(conversationId);
          return;
        }
        timeline.insertAdjacentHTML('beforeend', renderMessage(stageMessages[current], conv, { conversationId }));
        queueRecall(conversationId, stageMessages[current], conv);
        timeline.scrollTop = timeline.scrollHeight;
        current += 1;
      }, step);
    }

    function renderAccountList() {
      accountListWrap.innerHTML = accountIds.filter((id) => isAccountUnlocked(id)).map((id) => {
        const name = payload.conversations.find((c) => c.profiles?.users?.[id])?.profiles?.users?.[id]?.name || id;
        const avatar = payload.conversations.find((c) => c.profiles?.users?.[id])?.profiles?.users?.[id]?.avatar || "";
        const current = id === activeAccountId ? '<div class="account-current">● 当前使用</div>' : '';
        return '<button class="account-card" type="button" data-id="' + esc(id) + '">'
          + '<img class="account-avatar" src="' + esc(avatar) + '" alt="avatar"/>'
          + '<div><div class="account-name">' + esc(name) + '</div><div class="account-id">' + esc(id) + '</div></div>'
          + current
          + '</button>';
      }).join('') + '<div class="account-add"><div class="account-add-plus">+</div><div>添加账号</div></div>';
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
      homeTabbar.style.display = 'none';
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
    .search-wrap { padding: 9px 12px 10px; border-bottom: 1px solid var(--line); background: var(--panel); }
    .search { height: 34px; border-radius: 6px; border: 1px solid #ededed; background: #fff; color: #a3a3a3; display: flex; align-items: center; justify-content: center; font-size: 15px; gap: 6px; }
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
    .chat-top { height:46px; border-bottom:1px solid var(--line); display:grid; grid-template-columns:auto 1fr; align-items:center; background:var(--panel); padding:0 8px; gap:8px; }
    .back-btn { border:none; background:transparent; color:#4f4f4f; font-size:15px; cursor:pointer; padding:6px 8px; }
    .chat-title { font-size:17px; font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .timeline { flex:1; min-height:0; overflow-y:auto; padding:12px; }
    .msg { display:grid; grid-template-columns:42px 1fr; gap:10px; margin-bottom:14px; }
    .msg.self { grid-template-columns:1fr 42px; }
    .avatar-btn { border:none; padding:0; background:transparent; cursor:pointer; width:42px; height:42px; border-radius:8px; }
    .avatar { width:42px; height:42px; border-radius:8px; object-fit:cover; background:#ddd; }
    .msg-main { width:fit-content; max-width:80%; } .msg.self .msg-main { margin-left:auto; }
    .meta { font-size:12px; color:var(--muted); margin:0 0 4px; } .msg.self .meta { text-align:right; }
    .bubble { display:inline-block; max-width:100%; border-radius:10px; padding:10px 12px; background:var(--incoming); word-break:break-word; line-height:1.45; white-space:pre-wrap; }
    .msg.self .bubble { background:var(--outgoing); }
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
      <div class="search-wrap"><div class="search" id="search-text">🔍 搜索</div></div>
      <div id="scene-tip" class="scene-tip">
        当前幕已全部看完，可右滑进入下一幕
        <button id="next-scene-btn" class="scene-next-btn">进入下一幕</button>
      </div>
      <div id="list-scroll" class="list-scroll"></div>
      <footer class="tabbar"><div class="active">微信</div><div>通讯录</div><div>发现</div><div>我</div></footer>
    </section>

    <section id="detail-view" class="detail-view">
      <header class="chat-top">
        <button id="back-btn" class="back-btn">返回</button>
        <div class="chat-title" id="chat-title"></div>
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
    const searchText = document.getElementById('search-text');
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

    function esc(s) {
      return String(s || '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
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
      profileName.textContent = data.name || '';
      profileWechat.textContent = '昵称：' + (data.nickName || '未设置');
      profileBio.textContent = '简介：' + (data.bio || '无');
      profileModal.classList.add('show');
      profileModal.setAttribute('aria-hidden', 'false');
    }
    function closeProfile() {
      profileModal.classList.remove('show');
      profileModal.setAttribute('aria-hidden', 'true');
    }
    function recallText(msg, conv, user) {
      return msg.senderId === conv.self ? '你撤回了一条消息' : (user.name || msg.senderId) + ' 撤回了一条消息';
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
      if (timer) { window.clearInterval(timer); timer = null; }
      recallTimers.forEach((t) => window.clearTimeout(t));
      recallTimers = [];
      stopActiveAudio();
    }
    function stopPlaybackTimer() {
      if (timer) { window.clearInterval(timer); timer = null; }
    }
    function applySceneUi(scene) {
      const ui = scene.ui || {};
      statusCarrier.textContent = ui.statusBar?.carrier || '中国移动';
      statusTime.textContent = ui.statusBar?.time || '12:21';
      statusBattery.textContent = ui.statusBar?.battery || '31%';
      topTitle.textContent = ui.topTitle || '微信';
      searchText.textContent = '🔍 ' + (ui.searchPlaceholder || '搜索');
      sceneTitle.textContent = scene.title || '';
    }
    function renderQuote(quote, profiles) {
      if (!quote) return '';
      const sender = profiles.users?.[quote.senderId]?.name || quote.senderId || '';
      return '<div class="quote"><div>' + esc(sender) + ' · ' + esc(quote.timeText || '') + '</div><div>' + esc(quote.snippet || '') + '</div></div>';
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
        const c = msg.contactCard || {};
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
      const self = conv.self;
      const selfCls = msg.senderId === self ? 'msg self' : 'msg';
      const avatar = '<button class="avatar-btn" type="button"'
        + ' data-name="' + esc(user.name || msg.senderId) + '"'
        + ' data-nick-name="' + esc(user.nickName || user.wechatId || '') + '"'
        + ' data-bio="' + esc(user.bio || '') + '"'
        + ' data-avatar="' + esc(user.avatar || '') + '">'
        + '<img class="avatar" src="' + esc(user.avatar || '') + '" alt="' + esc(user.name || msg.senderId) + '"/>'
        + '</button>';
      const bubbleCls = (msg.kind === 'image' || msg.kind === 'voice') ? 'bubble media' : 'bubble';
      const body = (opts.forceRecalled && msg.recall)
        ? '<div class="recall-tip">' + esc(recallText(msg, conv, user)) + '</div>'
        : '<div class="' + bubbleCls + '">' + renderQuote(msg.quote, conv.profiles) + renderContent(msg, conv) + '</div>';
      const main = '<div class="msg-main"><p class="meta">' + esc(user.name || msg.senderId) + ' · ' + esc(msg.timeText || '') + '</p><div class="msg-body">' + body + '</div></div>';
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
      chatTitle.textContent = conv.title || '';
      timeline.innerHTML = '';

      const seen = sceneSeenMap(scene.id);
      if (!conv.messages.length) { finishConversation(scene, conversationId); return; }
      if (seen[conversationId]) {
        timeline.innerHTML = conv.messages.map((msg) => renderMessage(msg, conv, { conversationId, forceRecalled: true })).join('') + '<div class="end-tip">当前聊天已结束</div>';
        timeline.scrollTop = timeline.scrollHeight;
        return;
      }
      let current = Math.max(0, Number(conv.startIndex || 0));
      timeline.insertAdjacentHTML('beforeend', renderMessage(conv.messages[current], conv, { conversationId }));
      queueRecall(conversationId, conv.messages[current], conv);
      timeline.scrollTop = timeline.scrollHeight;
      current += 1;
      const step = Math.max(100, Number(conv.replayIntervalMs || 1000));
      timer = window.setInterval(() => {
        if (current >= conv.messages.length) {
          stopPlaybackTimer();
          finishConversation(scene, conversationId);
          return;
        }
        timeline.insertAdjacentHTML('beforeend', renderMessage(conv.messages[current], conv, { conversationId }));
        queueRecall(conversationId, conv.messages[current], conv);
        timeline.scrollTop = timeline.scrollHeight;
        current += 1;
      }, step);
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
  </script>
</body>
</html>`;
}
