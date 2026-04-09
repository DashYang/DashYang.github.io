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
function toSnippet(message) {
  if (!message) return "";
  if (message.kind === "image") return "[图片]";
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
      preview: toSnippet(startMessage),
      listTime: toListTime(listTimeSource),
      startIndex,
      profiles: conv.profiles,
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
    ui
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
    .avatar { width: 42px; height: 42px; border-radius: 8px; object-fit: cover; background: #ddd; }
    .msg-main { max-width: 80%; }
    .msg.self .msg-main { margin-left: auto; }
    .meta { font-size: 12px; color: var(--muted); margin: 0 0 4px; }
    .msg.self .meta { text-align: right; }
    .bubble { border-radius: 10px; padding: 10px 12px; background: var(--incoming); word-break: break-word; line-height: 1.45; }
    .msg.self .bubble { background: var(--outgoing); }
    .quote { margin-bottom: 8px; background: rgba(0,0,0,0.06); border-left: 3px solid rgba(0,0,0,0.18); border-radius: 6px; padding: 6px 8px; font-size: 12px; color: #333; }
    .img { max-width: min(320px, 100%); border-radius: 8px; display: block; }
    .card { display: block; border-radius: 8px; background: #f8f8f8; padding: 9px; text-decoration: none; color: inherit; }
    .card-title { font-size: 14px; font-weight: 600; margin-bottom: 4px; }
    .card-desc { font-size: 12px; color: var(--muted); margin-bottom: 8px; }
    .card-footer { display: flex; justify-content: space-between; font-size: 11px; color: var(--muted); }
    .inline-link { color: #576b95; }
    .end-tip { font-size: 12px; color: var(--muted); text-align: center; margin: 16px 0 4px; }
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
      <footer class="tabbar">
        <div class="active">微信</div>
        <div>通讯录</div>
        <div>发现</div>
        <div>我</div>
      </footer>
    </section>

    <section id="detail-view" class="detail-view">
      <header class="chat-top">
        <button id="back-btn" class="back-btn">返回</button>
        <div class="chat-title" id="chat-title"></div>
      </header>
      <div class="timeline" id="timeline"></div>
    </section>
  </main>

  <script id="chat-data" type="application/json">${payload}</script>
  <script>
    const payload = JSON.parse(document.getElementById('chat-data').textContent);
    const listView = document.getElementById('list-view');
    const detailView = document.getElementById('detail-view');
    const listScroll = document.getElementById('list-scroll');
    const backBtn = document.getElementById('back-btn');
    const timeline = document.getElementById('timeline');
    const chatTitle = document.getElementById('chat-title');

    const persistKey = payload.ui?.persistKey || 'chat_framework_seen_v1';
    let timer = null;
    let seenMap = {};

    function loadSeen() {
      try {
        const raw = localStorage.getItem(persistKey);
        seenMap = raw ? JSON.parse(raw) : {};
      } catch (_) {
        seenMap = {};
      }
    }

    function saveSeen() {
      try {
        localStorage.setItem(persistKey, JSON.stringify(seenMap));
      } catch (_) {
        // Ignore storage failures.
      }
    }

    function esc(s) {
      return String(s || '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
    }

    function linkify(text) {
      const escaped = esc(text || '');
      return escaped.replace(/(https?:\\/\\/[^\\s<]+)/g, '<a class="inline-link" href="$1" target="_blank" rel="noreferrer">$1</a>');
    }

    function renderQuote(quote, profiles) {
      if (!quote) return '';
      const sender = profiles.users?.[quote.senderId]?.name || quote.senderId || '';
      return '<div class="quote"><div>' + esc(sender) + ' · ' + esc(quote.timeText || '') + '</div><div>' + esc(quote.snippet || '') + '</div></div>';
    }

    function renderContent(msg) {
      if (msg.kind === 'image') {
        return '<img class="img" src="' + esc(msg.imageUrl || '') + '" alt="image"/>';
      }
      if (msg.kind === 'link-card') {
        const c = msg.linkCard || {};
        return '<a class="card" href="' + esc(c.url || '#') + '" target="_blank" rel="noreferrer">'
          + '<div class="card-title">' + esc(c.title || c.url || '链接') + '</div>'
          + '<div class="card-desc">' + esc(c.desc || '') + '</div>'
          + '<div class="card-footer"><span>' + esc(c.site || '') + '</span><span>链接卡片</span></div>'
          + '</a>';
      }
      return '<div>' + linkify(msg.text || '') + '</div>';
    }

    function renderMessage(msg, conv) {
      const user = conv.profiles.users?.[msg.senderId] || { name: msg.senderId, avatar: '' };
      const self = conv.self;
      const selfCls = msg.senderId === self ? 'msg self' : 'msg';
      const avatar = '<img class="avatar" src="' + esc(user.avatar || '') + '" alt="' + esc(user.name || msg.senderId) + '"/>';
      const main = '<div class="msg-main">'
        + '<p class="meta">' + esc(user.name || msg.senderId) + ' · ' + esc(msg.timeText || '') + '</p>'
        + '<div class="bubble">' + renderQuote(msg.quote, conv.profiles) + renderContent(msg) + '</div>'
        + '</div>';
      const html = msg.senderId === self ? main + avatar : avatar + main;
      return '<article class="' + selfCls + '">' + html + '</article>';
    }

    function clearTimer() {
      if (timer) {
        window.clearInterval(timer);
        timer = null;
      }
    }

    function markSeen(conversationId) {
      seenMap[conversationId] = true;
      saveSeen();
    }

    function finishConversation(conversationId) {
      timeline.insertAdjacentHTML('beforeend', '<div class="end-tip">当前聊天已结束</div>');
      timeline.scrollTop = timeline.scrollHeight;
      markSeen(conversationId);
    }

    function renderList() {
      listScroll.innerHTML = payload.conversations.map((c) => {
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

      listView.style.display = 'none';
      detailView.style.display = 'flex';
      chatTitle.textContent = conv.title || '';
      timeline.innerHTML = '';

      if (!conv.messages.length) {
        finishConversation(conversationId);
        return;
      }

      if (seenMap[conversationId]) {
        const full = conv.messages.map((msg) => renderMessage(msg, conv)).join('');
        timeline.innerHTML = full + '<div class="end-tip">当前聊天已结束</div>';
        timeline.scrollTop = timeline.scrollHeight;
        return;
      }

      let current = Math.max(0, Number(conv.startIndex || 0));
      timeline.insertAdjacentHTML('beforeend', renderMessage(conv.messages[current], conv));
      timeline.scrollTop = timeline.scrollHeight;
      current += 1;

      const step = Math.max(100, Number(conv.replayIntervalMs || 1000));
      timer = window.setInterval(() => {
        if (current >= conv.messages.length) {
          clearTimer();
          finishConversation(conversationId);
          return;
        }
        timeline.insertAdjacentHTML('beforeend', renderMessage(conv.messages[current], conv));
        timeline.scrollTop = timeline.scrollHeight;
        current += 1;
      }, step);
    }

    backBtn.addEventListener('click', () => {
      clearTimer();
      detailView.style.display = 'none';
      listView.style.display = 'flex';
    });

    loadSeen();
    renderList();
  </script>
</body>
</html>`;
}
