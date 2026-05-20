import { themes } from "./themes.js";

const WECHAT_EMOJI_MAP = {
  微笑: "🙂",
  撇嘴: "😒",
  色: "😍",
  发呆: "😳",
  得意: "😎",
  流泪: "😢",
  害羞: "☺️",
  闭嘴: "🤐",
  睡: "😴",
  大哭: "😭",
  尴尬: "😅",
  发怒: "😠",
  调皮: "😜",
  呲牙: "😁",
  惊讶: "😮",
  难过: "😞",
  酷: "😎",
  冷汗: "😓",
  抓狂: "😫",
  吐: "🤮",
  偷笑: "🤭",
  愉快: "😄",
  白眼: "🙄",
  傲慢: "😤",
  困: "🥱",
  惊恐: "😱",
  憨笑: "😄",
  悠闲: "😌",
  咒骂: "🤬",
  疑问: "❓",
  嘘: "🤫",
  晕: "😵",
  衰: "🥴",
  骷髅: "💀",
  敲打: "👊",
  再见: "👋",
  擦汗: "😓",
  抠鼻: "👃",
  鼓掌: "👏",
  坏笑: "😏",
  左哼哼: "😤",
  右哼哼: "😤",
  哈欠: "🥱",
  鄙视: "😒",
  委屈: "🥺",
  快哭了: "🥹",
  阴险: "😈",
  亲亲: "😘",
  吓: "😨",
  可怜: "🥺",
  菜刀: "🔪",
  西瓜: "🍉",
  啤酒: "🍺",
  咖啡: "☕",
  蛋糕: "🍰",
  玫瑰: "🌹",
  凋谢: "🥀",
  爱心: "❤️",
  心碎: "💔",
  强: "👍",
  弱: "👎",
  握手: "🤝",
  胜利: "✌️",
  抱拳: "🙏",
  勾引: "👉",
  拳头: "👊",
  OK: "👌",
  跳跳: "💃",
  发抖: "🫨",
  怄火: "😤",
  转圈: "🌀",
  捂脸: "🤦",
  奸笑: "😏",
  机智: "🧠",
  皱眉: "😣",
  耶: "✌️",
  旺柴: "🐶",
  社会社会: "😎",
  吃瓜: "🍉",
  加油: "💪",
  汗: "😓",
  天啊: "😱",
  Emm: "😶",
  让我看看: "👀",
  叹气: "😮‍💨",
  苦涩: "😖",
  裂开: "🫠"
};

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

function safeJson(data) {
  return JSON.stringify(data)
    .replaceAll("<", "\\u003c")
    .replaceAll(">", "\\u003e")
    .replaceAll("&", "\\u0026");
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
 * Highlight @mentions in text.
 *
 * @param {string} htmlText - Text (possibly after linkify).
 * @returns {string} HTML with mention spans.
 */
function mentionify(htmlText) {
  return htmlText.replace(/(^|[\s>])@([A-Za-z0-9_\-\u4e00-\u9fa5]+)/g, '$1<span class="mention">@$2</span>');
}

/**
 * Convert WeChat emoji aliases like [微笑] into Unicode emoji.
 *
 * @param {string} text - Plain text content.
 * @returns {string} Text with converted emoji.
 */
function emojify(text) {
  return String(text || "").replace(/\[([^\[\]]+)\]/g, (m, key) => WECHAT_EMOJI_MAP[key] || m);
}

/**
 * Format plain message text to final HTML.
 *
 * @param {string} text - Plain text.
 * @returns {string} HTML fragment.
 */
function formatText(text) {
  return mentionify(linkify(emojify(text || "")));
}

/**
 * Format duration seconds for voice bubble label.
 *
 * @param {number | undefined} sec - Seconds.
 * @returns {string} Label text.
 */
function formatVoiceDuration(sec) {
  const n = Number(sec || 0);
  return n > 0 ? `${n}"` : "语音";
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
function resolveEffectiveProfileName(user) {
  if (user.name) return user.name;
  const timeline = Array.isArray(user.identityTimeline) ? user.identityTimeline : [];
  if (timeline.length > 0) {
    const last = timeline[timeline.length - 1];
    if (last && last.name !== undefined) return last.name;
  }
  return "";
}

function resolveDisplayName(senderId, ctx, isSelf = false) {
  const user = ctx.profiles.users[senderId] || {};
  const selfId = ctx.chat?.self;
  const selfProfile = ctx.profiles.users[selfId] || {};
  
  if (ctx.chat?.type === "group" && isSelf) {
    return selfProfile.aliases?.selfInGroups?.[ctx.chat.title] || resolveEffectiveProfileName(selfProfile) || senderId;
  }
  return selfProfile.aliases?.contacts?.[senderId] || resolveEffectiveProfileName(user) || senderId;
}

function renderQuote(q, ctx) {
  const sender = resolveDisplayName(q.senderId, ctx, q.senderId === ctx.chat?.self);
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
function resolveArticleCard(m, ctx) {
  const a = m.articleCard || {};
  const refId = a.refId || "";
  if (!refId) return a;
  const fromRepo = ctx.articles?.[refId] || {};
  return {
    refId,
    title: fromRepo.title || a.title || "",
    author: fromRepo.author || a.author || "",
    cover: fromRepo.cover || a.cover || "",
    summary: fromRepo.summary || a.summary || "",
    text: fromRepo.text || a.text || "",
    images: Array.isArray(fromRepo.images) ? fromRepo.images : (a.images || []),
    publishAt: fromRepo.publishAt || ""
  };
}

function resolveContactCard(m, ctx) {
  const raw = m.contactCard || {};
  const fromProfile = raw.refId ? (ctx.profiles?.users?.[raw.refId] || {}) : {};
  return {
    refId: raw.refId || "",
    name: fromProfile.name || raw.name || raw.refId || "",
    nickName: fromProfile.nickName || raw.nickName || fromProfile.name || raw.name || raw.refId || "",
    avatar: fromProfile.avatar || raw.avatar || "",
    bio: fromProfile.bio || raw.bio || ""
  };
}

function renderContent(m, ctx) {
  if (m.kind === "image") {
    const caption = m.text ? `<div class="img-caption">${formatText(m.text)}</div>` : "";
    return `<img class="img" src="${escapeHtml(m.imageUrl || "")}" alt="image"/>${caption}`;
  }
  if (m.kind === "voice") {
    const caption = m.text ? `<div class="img-caption">${formatText(m.text)}</div>` : "";
    return `<button class="voice-btn" type="button" data-audio-url="${escapeHtml(m.audioUrl || "")}">
      <span class="voice-icon">▶</span>
      <span class="voice-duration">${escapeHtml(formatVoiceDuration(m.durationSec))}</span>
    </button>${caption}`;
  }
  if (m.kind === "link-card") {
    const c = m.linkCard || {};
    return `<a class="card" href="${escapeHtml(c.url || "#")}" target="_blank" rel="noreferrer">
      <div class="card-title">${escapeHtml(c.title || c.url || "链接")}</div>
      <div class="card-desc">${escapeHtml(c.desc || "")}</div>
      <div class="card-footer"><span>${escapeHtml(c.site || "")}</span><span>链接卡片</span></div>
    </a>`;
  }
  if (m.kind === "article-card") {
    const a = resolveArticleCard(m, ctx);
    const cover = a.cover ? `<img class="article-cover" src="${escapeHtml(a.cover)}" alt="cover"/>` : "";
    const summary = a.summary ? `<div class="article-summary">${formatText(a.summary)}</div>` : "";
    return `<button class="article-card" type="button"
      data-title="${escapeHtml(a.title || "")}"
      data-author="${escapeHtml(a.author || "")}"
      data-cover="${escapeHtml(a.cover || "")}"
      data-text="${escapeHtml(a.text || "")}"
      data-images="${escapeHtml((a.images || []).join(","))}">
      <div class="article-title">${escapeHtml(a.title || "文章")}</div>
      <div class="article-meta">${escapeHtml(a.author || "")}</div>
      ${cover}
      ${summary}
    </button>`;
  }
  if (m.kind === "contact-card") {
    const c = resolveContactCard(m, ctx);
    return `<div class="contact-card">
      <img class="contact-avatar" src="${escapeHtml(c.avatar || "")}" alt="contact"/>
      <div>
        <div class="contact-name">${escapeHtml(c.name || "")}</div>
        <div class="contact-nick">${escapeHtml(c.nickName ? `昵称：${c.nickName}` : "")}</div>
        <div class="contact-bio">${escapeHtml(c.bio || "")}</div>
      </div>
    </div>`;
  }
  return `<div>${formatText(m.text || "")}</div>`;
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
  const displayName = resolveDisplayName(m.senderId, ctx, m.senderId === selfId);
  const cls = m.senderId === selfId ? "msg self" : "msg";
  const avatar = `<button class="avatar-btn" type="button"
      data-user-id="${escapeHtml(m.senderId)}"
      data-display-name="${escapeHtml(displayName || u.nickName || u.name || m.senderId)}"
      data-avatar="${escapeHtml(u.avatar || "")}">
      <img class="avatar" src="${escapeHtml(u.avatar || "")}" alt="${escapeHtml(u.name || m.senderId)}"/>
    </button>`;
  const quote = m.quote ? renderQuote(m.quote, ctx) : "";
  const bubbleClass = (m.kind === "image" || m.kind === "voice") ? "bubble media" : "bubble";
  const recallText = m.senderId === selfId ? "你撤回了一条消息" : `${displayName || m.senderId} 撤回了一条消息`;
  const body = m.recall
    ? `<div class="recall-tip">${escapeHtml(recallText)}</div>`
    : `<div class="${bubbleClass}">${quote}${renderContent(m, ctx)}</div>`;
  const main = `<div class="msg-main"><p class="meta">${escapeHtml(displayName || m.senderId)} · ${escapeHtml(m.timeText)}</p>${body}</div>`;
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
  const profileUsers = safeJson(ctx.profiles?.users || {});

  const chatTitle = ctx.chat.title || ctx.frontmatter.title || "聊天记录";
  const subtitle = ctx.chat.type === "group"
    ? `群聊 · ${ctx.chat.title || "未命名群"}`
    : `单聊 · ${resolveDisplayName(ctx.chat.peer, ctx) || ctx.chat.peer || ""}`;

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
  <aside id="profile-modal" class="profile-modal" aria-hidden="true">
    <div class="profile-card">
      <div class="profile-head">
        <img id="profile-avatar" class="profile-avatar" src="" alt="avatar" />
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
      <h1 id="article-title" class="article-page-title"></h1>
      <div id="article-sub" class="article-page-sub"></div>
      <img id="article-cover" class="article-page-cover" src="" alt="cover"/>
      <div id="article-text" class="article-page-text"></div>
      <div id="article-images" class="article-page-images"></div>
    </div>
  </aside>
  <script>
    (() => {
      const profileUsers = ${profileUsers};
      const modal = document.getElementById('profile-modal');
      const avatar = document.getElementById('profile-avatar');
      const nameEl = document.getElementById('profile-name');
      const wechatEl = document.getElementById('profile-wechat');
      const bioEl = document.getElementById('profile-bio');
      const closeBtn = document.getElementById('profile-close');
      const articleModal = document.getElementById('article-modal');
      const articleBack = document.getElementById('article-back');
      const articleTitle = document.getElementById('article-title');
      const articleSub = document.getElementById('article-sub');
      const articleCover = document.getElementById('article-cover');
      const articleText = document.getElementById('article-text');
      const articleImages = document.getElementById('article-images');
      const avatarBtns = Array.from(document.querySelectorAll('.avatar-btn'));
      const voiceBtns = Array.from(document.querySelectorAll('.voice-btn'));
      const articleBtns = Array.from(document.querySelectorAll('.article-card'));

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
      function resolveActiveProfile(user, referenceTime) {
        const refMs = parseIdentityReference(referenceTime) ?? Date.now();
        let resolvedName = user?.name || user?.id || '';
        let resolvedBio = user?.bio || '';
        const timeline = Array.isArray(user?.identityTimeline) ? user.identityTimeline : [];
        timeline.forEach((entry) => {
          if (!entry || typeof entry.effectiveAtMs !== 'number' || entry.effectiveAtMs > refMs) return;
          if (entry.name !== undefined) resolvedName = entry.name;
          if (entry.bio !== undefined) resolvedBio = entry.bio;
        });
        return { name: resolvedName, bio: resolvedBio };
      }

      function openProfile(btn) {
        const userId = btn.dataset.userId || '';
        const displayName = btn.dataset.displayName || btn.dataset.nickName || '';
        const user = profileUsers[userId] || {};
        const resolved = resolveActiveProfile(user, new Date().toISOString());
        avatar.src = btn.dataset.avatar || user.avatar || '';
        nameEl.textContent = resolved.name || displayName || userId;
        wechatEl.textContent = '昵称：' + (displayName || resolved.name || '未设置');
        bioEl.textContent = '简介：' + (resolved.bio || '无');
        modal.classList.add('show');
        modal.setAttribute('aria-hidden', 'false');
      }
      function closeProfile() {
        modal.classList.remove('show');
        modal.setAttribute('aria-hidden', 'true');
      }
      function openArticle(btn) {
        const title = btn.dataset.title || '';
        const author = btn.dataset.author || '';
        const cover = btn.dataset.cover || '';
        const text = btn.dataset.text || '';
        const images = (btn.dataset.images || '').split(',').filter(Boolean);
        articleTitle.textContent = title;
        articleSub.textContent = author;
        articleCover.style.display = cover ? 'block' : 'none';
        articleCover.src = cover || '';
        articleText.textContent = text;
        articleImages.innerHTML = images.map((url) => '<img src="' + url + '" alt="image"/>').join('');
        articleModal.classList.add('show');
        articleModal.setAttribute('aria-hidden', 'false');
      }
      function closeArticle() {
        articleModal.classList.remove('show');
        articleModal.setAttribute('aria-hidden', 'true');
      }

      avatarBtns.forEach((btn) => {
        btn.addEventListener('click', () => openProfile(btn));
      });
      closeBtn.addEventListener('click', closeProfile);
      modal.addEventListener('click', (e) => {
        if (e.target === modal) closeProfile();
      });
      articleBtns.forEach((btn) => {
        btn.addEventListener('click', () => openArticle(btn));
      });
      articleBack.addEventListener('click', closeArticle);

      let activeAudio = null;
      let activeBtn = null;

      function setVoiceBtnState(btn, playing) {
        if (!btn) return;
        const icon = btn.querySelector('.voice-icon');
        btn.classList.toggle('playing', !!playing);
        if (icon) icon.textContent = playing ? '▮▮' : '▶';
      }
      function clearAudioState() {
        if (activeAudio) {
          activeAudio.pause();
          activeAudio = null;
        }
        setVoiceBtnState(activeBtn, false);
        activeBtn = null;
      }

      voiceBtns.forEach((btn) => {
        btn.addEventListener('click', () => {
          const src = btn.dataset.audioUrl || '';
          if (!src) return;

          if (activeBtn === btn && activeAudio && !activeAudio.paused) {
            clearAudioState();
            return;
          }

          clearAudioState();
          const audio = new Audio(src);
          activeAudio = audio;
          activeBtn = btn;
          setVoiceBtnState(btn, true);

          audio.addEventListener('ended', clearAudioState);
          audio.play().catch(() => {
            clearAudioState();
          });
        });
      });
    })();
  </script>
</body>
</html>`;
}
