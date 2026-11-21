/**
 * square-platform.js — Star-letter (星匣) platform adapter.
 *
 * Loaded after the GameSDK IIFE and before the game scripts. Every capability
 * degrades to a no-op when the SDK is missing, so the game keeps working when
 * opened outside the platform (local file, static hosting).
 *
 * Capabilities in use:
 *   leaderboard — PLAYER_VALUE / MAX board, boardCode from square-config.js
 *   exchange    — rewarded-ad revive, matched by targetType "revive"
 *
 * API reference: game-sdk-docs v2.4.1 (leaderboard.md, exchange.md).
 */
(function () {
  "use strict";

  var REVIVE_TARGET_TYPE = "revive";

  // One finished round is one business result: the submissionId is minted once
  // and reused, with an identical payload, for every retry of that same result.
  // Persisted so a reload retries the existing result instead of minting a new
  // one — a different id would be recorded as a different score.
  var PENDING_KEY = "squaregame_lb_pending";

  // Order ids already delivered. deliver() must be idempotent, and the CDR
  // requires that to hold across a page refresh too — so this is persisted
  // rather than kept in memory. Bounded: only recent orders can still replay.
  var DELIVERED_KEY = "squaregame_delivered_orders";
  var DELIVERED_MAX = 50;

  function loadDeliveredOrders() {
    try {
      var raw = JSON.parse(localStorage.getItem(DELIVERED_KEY) || "[]");
      return Array.isArray(raw) ? raw : [];
    } catch (e) {
      return [];
    }
  }

  function wasDelivered(orderId) {
    return loadDeliveredOrders().indexOf(orderId) !== -1;
  }

  function rememberDelivered(orderId) {
    try {
      var ids = loadDeliveredOrders();
      ids.push(orderId);
      if (ids.length > DELIVERED_MAX) ids = ids.slice(ids.length - DELIVERED_MAX);
      localStorage.setItem(DELIVERED_KEY, JSON.stringify(ids));
    } catch (e) {
      console.log("[square-platform] persist delivered order failed", e);
    }
  }

  var sdk = null;
  var initPromise = null;
  var reviveItemId = null;
  var listItemsPromise = null;
  var topCache = null;

  function boardCodeValue() {
    return typeof boardCode === "string" && boardCode
      ? boardCode
      : "squaregame_weekly";
  }

  function viewCodeValue() {
    return typeof boardViewCode === "string" && boardViewCode
      ? boardViewCode
      : "weekly";
  }

  function isPlatformError(error) {
    try {
      return !!(
        window.GameSDK &&
        typeof window.GameSDK.isPlatformSDKError === "function" &&
        window.GameSDK.isPlatformSDKError(error)
      );
    } catch (e) {
      return false;
    }
  }

  function errorCode(error) {
    if (isPlatformError(error) && error && error.code) return error.code;
    return "UNKNOWN";
  }

  // sdk.log is a local, synchronous, never-throwing facade that rides along with
  // player feedback reports. Key business nodes and failures only — never the
  // game loop (CDR L1), and detail carries identifiers and codes, not player
  // input (CDR L3).
  function logAt(level, message, detail) {
    try {
      if (!sdk || !sdk.log || typeof sdk.log[level] !== "function") return;
      sdk.log[level](message, detail);
    } catch (e) {
      // Defensive only — sdk.log is documented not to throw.
    }
  }

  // ----------------------------------------------------------------- platform

  /**
   * Which host the game is running in:
   *   "xhs"        — Xiaohongshu mini-tool (its JSAPI is injected by the host)
   *   "starletter" — inside the Star-letter player iframe, SDK handshake done
   *   "web"        — plain browser / static hosting, no platform services
   *
   * Feature-gate on this rather than sniffing window.xhs at each call site.
   */
  function platform() {
    try {
      if (
        window.xhs &&
        window.xhs.miniTool &&
        typeof window.xhs.miniTool.postNote === "function"
      ) {
        return "xhs";
      }
    } catch (e) {
      console.log("[square-platform] platform probe failed", e);
    }
    return sdk ? "starletter" : "web";
  }

  // Posting a note needs the Xiaohongshu host. Everything else must hide the
  // control instead of rendering one that can only fail.
  function canShareToXhs() {
    return platform() === "xhs";
  }

  // ---------------------------------------------------------------- lifecycle

  function init() {
    if (initPromise) return initPromise;
    initPromise = new Promise(function (resolve) {
      // The IIFE script may still be parsing when this runs, so poll briefly
      // before concluding we are in stand-alone mode.
      var attempts = 0;
      function attempt() {
        try {
          if (window.GameSDK && typeof window.GameSDK.init === "function") {
            window.GameSDK.init()
              .then(function (instance) {
                sdk = instance;
                // Warm the caches off the critical path so the game loop never waits.
                refreshReviveItem();
                refreshTop();
                resolve(instance);
              })
              .catch(function (e) {
                console.log("[square-platform] init failed", e);
                resolve(null);
              });
            return;
          }
        } catch (e) {
          console.log("[square-platform] init error", e);
          resolve(null);
          return;
        }
        attempts++;
        if (attempts > 40) {
          // ~2s with no SDK: stand-alone mode, every capability no-ops.
          resolve(null);
          return;
        }
        setTimeout(attempt, 50);
      }
      attempt();
    });
    return initPromise;
  }

  async function ready() {
    return await init();
  }

  // ---------------------------------------------------------------- exchange

  // Cache the ad-revive item id. listItems() only returns approved, listed
  // items, so an empty cache correctly means "no revive to offer right now".
  function refreshReviveItem() {
    if (listItemsPromise) return listItemsPromise;
    listItemsPromise = (async function () {
      try {
        var instance = await ready();
        if (!instance || !instance.exchange || typeof instance.exchange.listItems !== "function") {
          reviveItemId = null;
          return;
        }
        var res = await instance.exchange.listItems();
        var items = (res && res.items) || [];
        reviveItemId = null;
        for (var i = 0; i < items.length; i++) {
          var item = items[i];
          if (item && item.targetType === REVIVE_TARGET_TYPE && item.adWatchCount) {
            reviveItemId = item.id;
            break;
          }
        }
        if (reviveItemId === null) {
          // Nothing to offer means the revive prompt is skipped silently, so
          // record why: either the item is not listed yet, or the capability is
          // unavailable in this session.
          logAt("warn", "exchange:revive-item-missing", { itemCount: items.length });
          console.log(
            "[square-platform] no ad-revive item in listItems — revive prompt disabled",
            { itemCount: items.length }
          );
        } else {
          logAt("info", "exchange:revive-item-ready", { exchangeItemId: reviveItemId });
        }
      } catch (e) {
        var listCode = errorCode(e);
        reviveItemId = null;
        logAt("warn", "exchange:listItems-failed", { code: listCode });
        console.log(
          "[square-platform] listItems failed — revive prompt disabled",
          listCode
        );
      } finally {
        listItemsPromise = null;
      }
    })();
    return listItemsPromise;
  }

  // Synchronous, cache-backed: the game loop must never await a network call to
  // decide whether to offer the revive prompt.
  function canRevive() {
    return reviveItemId !== null;
  }

  /**
   * Run the rewarded-ad flow. Resolves { ok: true } only after deliver() has
   * applied the revive; any other outcome is { ok: false, code }.
   *
   * onDeliver is supplied by the game layer and must be idempotent — the
   * platform may call deliver() more than once for the same order.
   */
  async function reviveByAd(onDeliver) {
    var instance = await ready();
    if (!instance || !instance.exchange) return { ok: false, code: "CAPABILITY_UNAVAILABLE" };
    if (reviveItemId === null) {
      await refreshReviveItem();
      if (reviveItemId === null) return { ok: false, code: "ITEM_NOT_FOUND" };
    }

    var itemId = reviveItemId;
    try {
      await instance.exchange.exchange({
        exchangeItemId: itemId,
        via: "ad",
        // deliver() must finish the real write and throw on failure. The revive
        // is in-memory game state, so applying it completes synchronously here.
        deliver: async function (order) {
          var orderId = order && (order.adOrderId || order.exchangeOrderId);
          // Record after the grant is applied: an unrecorded failure must stay
          // retryable, and a recorded order must never be granted twice.
          if (orderId && wasDelivered(orderId)) return;
          if (typeof onDeliver === "function") onDeliver(order);
          if (orderId) rememberDelivered(orderId);
        },
      });
      logAt("info", "exchange:revive-granted", { exchangeItemId: itemId });
      return { ok: true };
    } catch (error) {
      var code = errorCode(error);
      // A failed or cancelled ad must not leave a stale id behind.
      if (code === "ITEM_NOT_FOUND" || code === "EXCHANGE_PATH_NOT_AVAILABLE") {
        reviveItemId = null;
        refreshReviveItem();
      }
      // A player declining the ad is a normal action, not a fault.
      if (code === "AD_USER_CANCELLED" || code === "EXCHANGE_CANCELLED") {
        logAt("info", "exchange:revive-declined", { code: code });
      } else {
        logAt("warn", "exchange:revive-failed", { code: code });
      }
      return { ok: false, code: code };
    }
  }

  // -------------------------------------------------------------- leaderboard

  function loadPending() {
    try {
      return JSON.parse(localStorage.getItem(PENDING_KEY) || "null");
    } catch (e) {
      return null;
    }
  }

  function savePending(record) {
    try {
      localStorage.setItem(PENDING_KEY, JSON.stringify(record));
    } catch (e) {
      console.log("[square-platform] persist pending failed", e);
    }
  }

  function clearPending() {
    try {
      localStorage.removeItem(PENDING_KEY);
    } catch (e) {
      console.log("[square-platform] clear pending failed", e);
    }
  }

  function newSubmissionId() {
    return (
      "sqg-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 10)
    );
  }

  var roundSubmission = null;
  // At most one submission attempt per round. A round can reach its end screen
  // more than once (double-tapped Skip), and a second attempt would either
  // duplicate the result or, after a terminal rejection, retry it.
  var roundAttempted = false;

  /** Called from resetGame(); a new round is a new business result. */
  function resetRound() {
    roundSubmission = null;
    roundAttempted = false;
  }

  function submissionFor(scoreValue) {
    if (roundSubmission && roundSubmission.score === scoreValue) return roundSubmission;
    var pending = loadPending();
    if (pending && pending.score === scoreValue && !pending.confirmed) {
      // Same unresolved result across a reload: keep its id and payload.
      roundSubmission = pending;
      return roundSubmission;
    }
    roundSubmission = {
      submissionId: newSubmissionId(),
      score: scoreValue,
      confirmed: false,
    };
    savePending(roundSubmission);
    return roundSubmission;
  }

  /**
   * Submit one finished round. Resolves the receipt, or null when the board is
   * unavailable. Never throws: callers show UI, they do not handle transport.
   */
  async function submitScore(scoreValue) {
    var instance = await ready();
    if (!instance || !instance.leaderboard) return null;
    if (typeof scoreValue !== "number" || !isFinite(scoreValue)) return null;
    if (roundAttempted) return null;
    roundAttempted = true;

    var record = submissionFor(scoreValue);
    try {
      var receipt = await instance.leaderboard.submit({
        boardCode: boardCodeValue(),
        submissionId: record.submissionId,
        payload: { type: "numeric", value: scoreValue },
      });
      record.confirmed = true;
      record.replayUntil = receipt && receipt.replayUntil;
      record.reuseAfter = receipt && receipt.reuseAfter;
      clearPending();
      logAt("info", "leaderboard:submit-ok", {
        boardCode: boardCodeValue(),
        value: scoreValue,
      });
      refreshTop();
      return receipt;
    } catch (error) {
      var code = errorCode(error);
      if (!isPlatformError(error)) {
        // No answer came back, so the outcome is unknown. Keep the id and
        // payload: a later replay of the same id returns the same receipt,
        // which is the documented recovery for an unknown result. Do not
        // retry from here.
        console.log("[square-platform] submit outcome unknown; kept for replay");
        return null;
      }
      if (code === "CAPABILITY_UNAVAILABLE") {
        // The board may come back while the player is still on this screen.
        // Keep the id and payload so a retry replays the same result.
        roundAttempted = false;
      } else {
        // Every other code is terminal (see leaderboard.md): replaying the same
        // id can only reproduce the same answer, so do not retry this round.
        clearPending();
        roundSubmission = null;
      }
      logAt("warn", "leaderboard:submit-failed", {
        boardCode: boardCodeValue(),
        code: code,
      });
      console.log("[square-platform] submit failed", code);
      return null;
    }
  }

  // Invoked whenever topCache changes, so the game can redraw rows in place.
  var topListener = null;

  function notifyTopChanged() {
    if (typeof topListener !== "function") return;
    try {
      topListener();
    } catch (e) {
      console.log("[square-platform] top listener failed", e);
    }
  }

  function refreshTop(retryDepth) {
    return (async function () {
      try {
        var instance = await ready();
        if (!instance || !instance.leaderboard) return null;
        var page = await instance.leaderboard.getTop({
          boardCode: boardCodeValue(),
          boardKind: "PLAYER_VALUE",
          viewCode: viewCodeValue(),
          window: "CURRENT",
          limit: typeof leaderboardSize === "number" ? leaderboardSize : 5,
        });
        topCache = page || null;
        notifyTopChanged();

        // A DELAYED projection means the score landed but the ranking has not
        // caught up yet. Refresh once per retryAfter instead of resubmitting.
        var projection = page && page.projection;
        var depth = retryDepth || 0;
        if (
          projection &&
          projection.status === "DELAYED" &&
          depth < 2 &&
          typeof projection.retryAfter === "number" &&
          projection.retryAfter > 0 &&
          projection.retryAfter <= 10000
        ) {
          setTimeout(function () {
            refreshTop(depth + 1);
          }, projection.retryAfter);
        }
        return topCache;
      } catch (e) {
        logAt("warn", "leaderboard:getTop-failed", {
          boardCode: boardCodeValue(),
          code: errorCode(e),
        });
        console.log("[square-platform] getTop failed", errorCode(e));
        return null;
      }
    })();
  }

  /** Cached platform top page, or null when unavailable. Synchronous by design. */
  function getCachedTop() {
    return topCache;
  }

  async function getMyValue() {
    var instance = await ready();
    if (!instance || !instance.leaderboard) return null;
    try {
      return await instance.leaderboard.getMyValue({
        boardCode: boardCodeValue(),
        viewCode: viewCodeValue(),
        window: "CURRENT",
      });
    } catch (e) {
      console.log("[square-platform] getMyValue failed", errorCode(e));
      return null;
    }
  }

  window.SL = {
    init: init,
    platform: platform,
    canShareToXhs: canShareToXhs,
    canRevive: canRevive,
    reviveByAd: reviveByAd,
    submitScore: submitScore,
    getCachedTop: getCachedTop,
    refreshTop: refreshTop,
    setTopListener: function (fn) {
      topListener = fn;
    },
    getMyValue: getMyValue,
    resetRound: resetRound,
  };

  // Warm the SDK handshake at load: canRevive() is cache-backed and must have
  // an answer before the first round ends. Safe no-op off-platform.
  init();
})();
