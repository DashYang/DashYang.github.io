/**
 * Check whether a time string is absolute.
 *
 * @param {string} raw - Time string from message header.
 * @returns {boolean} True when format is YYYY-MM-DD HH:mm[:ss].
 *
 * @example
 * isAbs('2026-04-09 10:00:00') // => true
 */
function isAbs(raw) {
  return /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}(:\d{2})?$/.test(raw);
}

/**
 * Parse absolute time text into Date.
 *
 * @param {string} raw - Absolute time text.
 * @returns {Date} Parsed Date object.
 *
 * @example
 * parseAbs('2026-04-09 10:00')
 */
function parseAbs(raw) {
  const full = raw.length === 16 ? `${raw}:00` : raw;
  return new Date(full.replace(" ", "T"));
}

/**
 * Parse relative time like +2m +30s +1h +1d.
 *
 * @param {string} raw - Relative time text.
 * @returns {number | null} Milliseconds offset or null if invalid.
 *
 * @example
 * parseRel('+2m') // => 120000
 */
function parseRel(raw) {
  const m = raw.match(/^\+(\d+)([smhd])$/);
  if (!m) return null;
  const n = Number(m[1]);
  const unit = m[2];
  const mul = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 };
  return n * mul[unit];
}

/**
 * Format Date to readable local text.
 *
 * @param {Date} d - Date object.
 * @returns {string} Formatted time text.
 *
 * @example
 * fmt(new Date('2026-04-09T10:00:00')) // => '2026-04-09 10:00'
 */
function fmt(d) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/**
 * Resolve all message times to absolute timestamps.
 * The first message must be absolute time.
 *
 * @param {Array<Record<string, unknown>>} messages - Parsed message drafts.
 * @returns {Array<Record<string, unknown>>} Messages with index/timestamp/timeText.
 * @throws {Error} If time format is invalid.
 *
 * @example
 * resolveTimes([{ id:'m1', timeRaw:'2026-01-01 10:00', kind:'text' }])
 */
export function resolveTimes(messages) {
  if (messages.length === 0) return [];
  if (!isAbs(messages[0].timeRaw)) {
    throw new Error("First message time must be absolute, e.g. [2026-04-09 10:00:00]");
  }

  let prev = null;
  return messages.map((m, idx) => {
    let d;
    if (isAbs(m.timeRaw)) {
      d = parseAbs(m.timeRaw);
    } else {
      const ms = parseRel(m.timeRaw);
      if (ms === null) throw new Error(`Invalid relative time for message #${m.id}: ${m.timeRaw}`);
      if (!prev) throw new Error("Relative time cannot be used before first absolute message");
      d = new Date(prev.getTime() + ms);
    }
    prev = d;
    return { ...m, index: idx, timestamp: d.toISOString(), timeText: fmt(d) };
  });
}

/**
 * Resolve quote metadata for each quoted message.
 *
 * @param {Array<Record<string, unknown>>} messages - Time-resolved messages.
 * @returns {Array<Record<string, unknown>>} Messages with quote snippet/sender/time.
 * @throws {Error} If quote target is missing or not previous.
 *
 * @example
 * resolveQuotes([{ id:'m1', ... }, { id:'m2', quote:{ messageId:'m1' } }])
 */
export function resolveQuotes(messages) {
  const byId = new Map(messages.map((m) => [m.id, m]));
  return messages.map((m) => {
    if (!m.quote) return m;
    const target = byId.get(m.quote.messageId);
    if (!target) throw new Error(`Quoted message not found: ${m.quote.messageId}`);
    if (target.index >= m.index) throw new Error(`Quote must reference previous message: ${m.id} -> ${target.id}`);

    let snippet = "";
    if (target.kind === "text") snippet = (target.text || "").slice(0, 80);
    if (target.kind === "image") snippet = "[图片]";
    if (target.kind === "link-card") snippet = `[链接] ${target.linkCard?.title || target.linkCard?.url || ""}`;

    return {
      ...m,
      quote: {
        ...m.quote,
        senderId: target.senderId,
        timeText: target.timeText,
        snippet
      }
    };
  });
}
