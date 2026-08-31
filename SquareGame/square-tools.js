function getActiveTileTypeCount() {
  return Math.max(1, Math.min(6,
    stageIndex >= 3
      ? (typeof finalPhaseTileTypeCount !== "undefined" ? finalPhaseTileTypeCount : 6)
      : (typeof phaseOneTileTypeCount !== "undefined" ? phaseOneTileTypeCount : 5)
  ));
}

function getSquareType() {
  return Math.floor(Math.random() * getActiveTileTypeCount());
}

function getAlternativeSquareType(type) {
  return (Number(type) + 1) % getActiveTileTypeCount();
}

// Stage control variables
// stageIndex: 1 = Tutorial, 2 = time bonus, 3 = no time bonus.
var stageIndex = 1;
var stageTimerId = null;
var stageHintTimerId = null;
var stageTimerDueAt = 0;
var stageTimerRemainingMs = 0;
// prevent re-entrant advanceStage calls
var advanceLocked = false;
// track last clear in game ticks (not physical time)
var lastClearTick = 0;
// Idle hints are based on successful clears, not pointer activity. Keeping this in
// game ticks means pauses and board transitions do not consume the six-second gap.
var lastHintTick = 0;
// whether the actual gameplay timers/cycles have been started
var gameStarted = false;
// Board transitions freeze gameplay time and input until every tile has settled.
var boardTransitionActive = false;
var boardTransitionFallbackId = null;
var firepowerUntilTick = 0;
var firepowerFuseUntilTick = 0;
var firepowerFuseDurationTicks = 0;
// suppress stale tutorial clicks for a short window (ms timestamp)
var tutorialClickSuppressUntil = 0;
var responsiveLayoutBound = false;
var tutorialTouchTs = 0;
var squareTouchTs = 0;
var viewportTouchTs = 0;
var comboStreak = 0;
var completedGravityClears = 0;
var clearAudioCtx = null;
var invalidTapLockedUntil = 0;
var tileTooltipSuppressionId = null;

function getGravityFallDurationMs(clearCount) {
  var startMs =
    typeof gravityFallStartDurationMs !== "undefined"
      ? gravityFallStartDurationMs
      : 1000;
  var minMs =
    typeof gravityFallMinDurationMs !== "undefined"
      ? gravityFallMinDurationMs
      : 360;
  var decay =
    typeof gravityFallDecayPerClear !== "undefined"
      ? gravityFallDecayPerClear
      : 0.12;
  var count = Math.max(0, Number(clearCount) || 0);
  return Math.max(minMs, Math.round(startMs / (1 + decay * count)));
}

function triggerTutorialControl() {
  try {
    if (
      typeof tutorialClickSuppressUntil !== "undefined" &&
      Date.now() < tutorialClickSuppressUntil
    )
      return;
  } catch (e) { console.error("[square-tools] caught error", e); }
  isTouched = true;
  if (gamestate == "on") popTutorial();
  else if (gamestate == "pause") resumeGame();
}

function stopEventBubble(e) {
  try {
    if (!e) return;
    if (e.stopPropagation) e.stopPropagation();
  } catch (err) { console.error("[square-tools] caught error", err); }
}

function suppressTileTooltipsAfterTap() {
  var viewport = document.getElementById("viewport");
  if (!viewport) return;
  viewport.classList.add("tile-tooltips-suppressed");
  if (tileTooltipSuppressionId) clearTimeout(tileTooltipSuppressionId);
  tileTooltipSuppressionId = setTimeout(function () {
    var currentViewport = document.getElementById("viewport");
    if (currentViewport) currentViewport.classList.remove("tile-tooltips-suppressed");
    tileTooltipSuppressionId = null;
  }, 1800);
}

function handleSquareInputById(id, e) {
  try {
    if (e && e.stopPropagation) e.stopPropagation();
  } catch (err) { console.error("[square-tools] caught error", err); }
  try {
    // Clear previews, clear animation, gravity and supernatural mutation all
    // freeze gameplay and reject input until the board is fully settled.
    if (boardTransitionActive || gamestate === "animating") return;
    if (Date.now() < invalidTapLockedUntil) return;
    // Keep gameplay interaction consistent across mouse/touch and disallow
    // board interaction when paused/off.
    if (gamestate !== "on") return;
    isTouched = true;
    var square = G.O[id];
    if (!square) return;
    squareHandler(square);
  } catch (e) { console.error("[square-tools] caught error", e); }
}

function isFirepowerActive() {
  return (
    firepowerUntilTick > 0 &&
    typeof gameTick !== "undefined" &&
    gameTick < firepowerUntilTick
  );
}

function getFirepowerFuseDurationSeconds(clearCount) {
  var startSec =
    typeof firepowerFuseStartSec !== "undefined" ? firepowerFuseStartSec : 3;
  var minSec =
    typeof firepowerFuseMinSec !== "undefined" ? firepowerFuseMinSec : 1;
  var decay =
    typeof firepowerFuseDecayPerClear !== "undefined"
      ? firepowerFuseDecayPerClear
      : 0.12;
  var count = Math.max(0, Number(clearCount) || 0);
  return Math.max(minSec, startSec / (1 + decay * count));
}

function isFirepowerFuseActive() {
  return (
    firepowerFuseUntilTick > 0 &&
    typeof gameTick !== "undefined" &&
    gameTick < firepowerFuseUntilTick
  );
}

function getFirepowerFuseRemainingSeconds() {
  if (!isFirepowerFuseActive()) return 0;
  return Math.max(0, (firepowerFuseUntilTick - gameTick) / 25);
}

function getFirepowerFuseProgress() {
  if (!isFirepowerFuseActive() || firepowerFuseDurationTicks <= 0) return 0;
  return Math.max(
    0,
    Math.min(
      1,
      (firepowerFuseUntilTick - gameTick) / firepowerFuseDurationTicks
    )
  );
}

function getFirepowerRemainingSeconds() {
  if (!isFirepowerActive()) return 0;
  return Math.max(0, (firepowerUntilTick - gameTick) / 25);
}

function renderFirepowerMode() {
  var viewport = document.getElementById("viewport");
  if (!viewport) return;
  var active = isFirepowerActive();
  viewport.classList.toggle("firepower-mode", active);
  var overlay = document.getElementById("firepowerOverlay");
  if (active && !overlay) {
    overlay = document.createElement("div");
    overlay.id = "firepowerOverlay";
    overlay.className = "firepower-overlay";
    overlay.setAttribute("aria-hidden", "true");
    overlay.style.left = squareleft + "px";
    overlay.style.top = squaretop + "px";
    overlay.style.width = column * (squareside + squaremargin) - squaremargin + "px";
    overlay.style.height = row * (squareside + squaremargin) - squaremargin + "px";
    viewport.appendChild(overlay);
  } else if (!active && overlay && overlay.parentNode) {
    overlay.parentNode.removeChild(overlay);
  }
}

function renderFirepowerFuse() {
  var viewport = document.getElementById("viewport");
  if (!viewport) return;
  var armed = isFirepowerFuseActive();
  var overlay = document.getElementById("firepowerFuseOverlay");
  if (!armed) {
    if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
    return;
  }
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = "firepowerFuseOverlay";
    overlay.className = "firepower-fuse-board";
    overlay.setAttribute("aria-hidden", "true");
    overlay.innerHTML =
      "<i class='firepower-fuse-side firepower-fuse-top'></i>" +
      "<i class='firepower-fuse-side firepower-fuse-right'></i>" +
      "<i class='firepower-fuse-side firepower-fuse-bottom'></i>" +
      "<i class='firepower-fuse-side firepower-fuse-left'></i>" +
      "<i class='firepower-fuse-spark'></i>";
    viewport.appendChild(overlay);
  }

  var boardWidth = column * (squareside + squaremargin) - squaremargin;
  var boardHeight = row * (squareside + squaremargin) - squaremargin;
  overlay.style.left = squareleft + "px";
  overlay.style.top = squaretop + "px";
  overlay.style.width = boardWidth + "px";
  overlay.style.height = boardHeight + "px";
  overlay.classList.toggle("firepower-fuse-board-active", isFirepowerActive());

  var progress = getFirepowerFuseProgress();
  var sideLengths = [boardWidth, boardHeight, boardWidth, boardHeight];
  var distance = progress * (boardWidth * 2 + boardHeight * 2);
  var fills = [];
  for (var i = 0; i < sideLengths.length; i++) {
    var fill = Math.max(0, Math.min(1, distance / sideLengths[i]));
    fills.push(fill);
    distance = Math.max(0, distance - sideLengths[i]);
  }
  var sides = [
    overlay.querySelector(".firepower-fuse-top"),
    overlay.querySelector(".firepower-fuse-right"),
    overlay.querySelector(".firepower-fuse-bottom"),
    overlay.querySelector(".firepower-fuse-left"),
  ];
  for (var s = 0; s < sides.length; s++) {
    if (sides[s]) sides[s].style.setProperty("--side-fill", fills[s]);
  }

  var pathDistance = progress * (boardWidth * 2 + boardHeight * 2);
  var sparkX = 0;
  var sparkY = 0;
  if (pathDistance <= boardWidth) {
    sparkX = pathDistance;
  } else if (pathDistance <= boardWidth + boardHeight) {
    sparkX = boardWidth;
    sparkY = pathDistance - boardWidth;
  } else if (pathDistance <= boardWidth * 2 + boardHeight) {
    sparkX = boardWidth - (pathDistance - boardWidth - boardHeight);
    sparkY = boardHeight;
  } else {
    sparkY = boardHeight - (pathDistance - boardWidth * 2 - boardHeight);
  }
  var spark = overlay.querySelector(".firepower-fuse-spark");
  if (spark) {
    spark.style.left = sparkX + "px";
    spark.style.top = sparkY + "px";
  }
}

function activateFirepowerMode(durationSeconds) {
  var durationTicks = Math.max(1, Math.round((durationSeconds || 3) * 25));
  firepowerUntilTick =
    (typeof gameTick !== "undefined" ? gameTick : 0) + durationTicks;
  renderFirepowerMode();
}

function restartFirepowerFuse(durationSeconds) {
  var durationTicks = Math.max(1, Math.round((durationSeconds || 3) * 25));
  var nowTick = typeof gameTick !== "undefined" ? gameTick : 0;
  firepowerFuseDurationTicks = durationTicks;
  firepowerFuseUntilTick = nowTick + durationTicks;
  renderFirepowerFuse();
}

function registerClearForFirepower() {
  var qualified = isFirepowerFuseActive();
  var durationSeconds = getFirepowerFuseDurationSeconds(
    completedGravityClears
  );
  if (qualified) activateFirepowerMode(durationSeconds);
  restartFirepowerFuse(durationSeconds);
  return qualified;
}

function supportsPointerUp() {
  try {
    return typeof window !== "undefined" && !!window.PointerEvent;
  } catch (e) {
    console.error("[square-tools] caught error", e);
    return false;
  }
}

function bindTap(selector, handlers) {
  try {
    if (!selector || !handlers || typeof handlers.onTap !== "function") return;
    if (supportsPointerUp()) {
      $(selector).on("pointerup", function (e) {
        handlers.onTap.call(this, e, "pointer");
      });
      return;
    }
    $(selector).on("touchend", function (e) {
      if (typeof handlers.onTouch === "function") {
        handlers.onTouch.call(this, e);
      }
      handlers.onTap.call(this, e, "touch");
    });
    $(selector).on("click", function (e) {
      if (typeof handlers.onClick === "function") {
        handlers.onClick.call(this, e);
      }
      handlers.onTap.call(this, e, "click");
    });
  } catch (e) { console.error("[square-tools] caught error", e); }
}

function flashViewportClear(combo) {
  try {
    var vp = document.getElementById("viewport");
    if (!vp) return;
    var comboValue = Math.max(1, Number(combo) || 1);
    var glowAlpha = Math.min(0.42, 0.18 + (comboValue - 1) * 0.05);
    var glowColor = comboValue >= 3 ? "141, 255, 145" : "0, 245, 255";
    vp.style.setProperty("--clear-flash-rgb", glowColor);
    vp.style.setProperty("--clear-flash-alpha", glowAlpha);
    vp.classList.remove("viewport-clear-flash");
    void vp.offsetWidth;
    vp.classList.add("viewport-clear-flash");
  } catch (e) { console.error("[square-tools] caught error", e); }
}

function playClearSfx(combo) {
  try {
    var Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    if (!clearAudioCtx) clearAudioCtx = new Ctx();
    if (clearAudioCtx.state === "suspended") {
      clearAudioCtx.resume();
    }
    var now = clearAudioCtx.currentTime || 0;
    var osc = clearAudioCtx.createOscillator();
    var gain = clearAudioCtx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(combo >= 3 ? 880 : 720, now);
    osc.frequency.exponentialRampToValueAtTime(combo >= 3 ? 1080 : 880, now + 0.08);
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.05, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
    osc.connect(gain);
    gain.connect(clearAudioCtx.destination);
    osc.start(now);
    osc.stop(now + 0.1);
  } catch (e) { console.error("[square-tools] caught error", e); }
}

function triggerClearFeedback(combo) {
  try {
    var comboValue = Math.max(1, Number(combo) || 1);
    flashViewportClear(comboValue);
    playClearSfx(comboValue);
    if (
      typeof navigator !== "undefined" &&
      typeof navigator.vibrate === "function"
    ) {
      if (comboValue >= 3) navigator.vibrate([18, 22, 24]);
      else navigator.vibrate(14);
    }
  } catch (e) { console.error("[square-tools] caught error", e); }
}

function eventHitsTutorial(e) {
  try {
    var el = document.getElementById("tutorial");
    if (!el) return false;
    var r = el.getBoundingClientRect();
    var x = null;
    var y = null;
    if (e.changedTouches && e.changedTouches.length > 0) {
      x = e.changedTouches[0].clientX;
      y = e.changedTouches[0].clientY;
    } else if (e.touches && e.touches.length > 0) {
      x = e.touches[0].clientX;
      y = e.touches[0].clientY;
    } else if (typeof e.clientX === "number") {
      x = e.clientX;
      y = e.clientY;
    }
    if (x === null || y === null) return false;
    return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
  } catch (err) {
    return false;
  }
}

function applyResponsiveLayout() {
  try {
    var board = document.getElementById("gameboard");
    var vp = document.getElementById("viewport");
    if (!board || !vp) return;
    var visualViewport = window.visualViewport;
    var ww =
      (visualViewport && visualViewport.width) ||
      window.innerWidth ||
      document.documentElement.clientWidth ||
      viewportwidth;
    var wh =
      (visualViewport && visualViewport.height) ||
      window.innerHeight ||
      document.documentElement.clientHeight ||
      viewportheight;
    var mobileFullscreen = ww <= 768 && wh / ww >= 1.35;
    var padding = mobileFullscreen ? 0 : 8;
    var sx = (ww - padding * 2) / viewportwidth;
    var sy = (wh - padding * 2) / viewportheight;
    var scale = Math.max(0.5, Math.min(sx, sy));
    var scaledW = viewportwidth * scale;
    var scaledH = viewportheight * scale;
    var left = Math.max(0, Math.floor((ww - scaledW) / 2));
    var top = Math.max(0, Math.floor((wh - scaledH) / 2));

    board.style.position = "relative";
    board.style.width = ww + "px";
    board.style.height = wh + "px";
    board.style.margin = "0";
    board.style.overflow = "hidden";
    board.classList.toggle("mobile-fullscreen-stage", mobileFullscreen);

    vp.style.position = "absolute";
    vp.style.transformOrigin = "top left";
    vp.style.transform = "scale(" + scale + ")";
    vp.style.left = left + "px";
    vp.style.top = top + "px";
  } catch (e) { console.error("[square-tools] caught error", e); }
}

function bindResponsiveLayout() {
  if (responsiveLayoutBound) return;
  responsiveLayoutBound = true;
  var rerender = function () {
    setTimeout(function () {
      try {
        applyResponsiveLayout();
      } catch (e) { console.error("[square-tools] caught error", e); }
    }, 0);
  };
  try {
    window.addEventListener("resize", rerender, false);
    window.addEventListener("orientationchange", rerender, false);
    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", rerender, false);
    }
  } catch (e) { console.error("[square-tools] caught error", e); }
}

function scheduleStageAdvance(delayMs) {
  if (stageTimerId) clearTimeout(stageTimerId);
  stageTimerRemainingMs = Math.max(0, delayMs || 0);
  stageTimerDueAt = Date.now() + stageTimerRemainingMs;
  stageTimerId = setTimeout(function () {
    stageTimerId = null;
    stageTimerDueAt = 0;
    stageTimerRemainingMs = 0;
    advanceStage();
  }, stageTimerRemainingMs);
}

function pauseStageAdvanceForBoardTransition() {
  if (!stageTimerId) return;
  stageTimerRemainingMs = Math.max(0, stageTimerDueAt - Date.now());
  clearTimeout(stageTimerId);
  stageTimerId = null;
}

function resumeStageAdvanceAfterBoardTransition() {
  if (stageIndex === 2 && !stageTimerId && stageTimerRemainingMs > 0) {
    scheduleStageAdvance(stageTimerRemainingMs);
  }
}

function initMap() {
  map = Array();
  for (var i = 0; i < row; i++) {
    map[i] = Array();
    for (var j = 0; j < column; j++) {
      map[i][j] = getSquareType();
    }
  }
  for (var i = 0; i < level; i++) {
    var y = Math.floor(Math.random() * (row - 1));
    var x = Math.floor(Math.random() * (column - 1));
    var h = Math.floor(Math.random() * (row - 1 - y));
    var w = Math.floor(Math.random() * (column - 1 - x));
    var type = getSquareType();
    map[y][x] = map[y + h][x] = map[y][x + w] = map[y + h][x + w] = type;
  }
}

// -----------------------------
// Leaderboard (localStorage)
// -----------------------------
// new: save score with 3-char name
function saveScoreWithName(scoreValue, name) {
  try {
    var key = "squaregame_leaderboard";
    var list = JSON.parse(localStorage.getItem(key) || "[]");
    var n = (name || "").toString().toUpperCase().substring(0, 3) || "---";
    var now = new Date().toISOString();
    list.push({ score: scoreValue, t: now, name: n });
    list.sort(function (a, b) {
      return b.score - a.score;
    });
    list = list.slice(0, leaderboardSize);
    localStorage.setItem(key, JSON.stringify(list));
    var rank = -1;
    for (var i = 0; i < list.length; i++) {
      if (list[i].score === scoreValue && list[i].name === n && list[i].t === now) {
        rank = i + 1;
        break;
      }
    }
    return { rank: rank, name: n, score: scoreValue };
  } catch (e) {
    console.log("saveScore error", e);
    return {
      rank: -1,
      name: (name || "").toString().toUpperCase().substring(0, 3) || "---",
      score: scoreValue,
    };
  }
}

function getLeaderboard() {
  try {
    var key = "squaregame_leaderboard";
    var list = JSON.parse(localStorage.getItem(key) || "[]");
    return list;
  } catch (e) {
    return [];
  }
}

function renderLeaderboardHTML() {
  var list = getLeaderboard();
  var titleText =
    I18N && I18N.leaderboardTitle ? I18N.leaderboardTitle : "Leaderboard";
  var emptyText =
    I18N && I18N.leaderboardEmpty ? I18N.leaderboardEmpty : "(no scores yet)";
  var anonText = I18N && I18N.leaderboardAnon ? I18N.leaderboardAnon : "---";
  var html = '<div class="leaderboard"><h4>' + titleText + "</h4>";
  if (list.length == 0)
    html += '<div class="leaderboard-item">' + emptyText + "</div>";
  for (var i = 0; i < list.length; i++) {
    var it = list[i];
    var name = it.name && it.name.length > 0 ? it.name : anonText;
    html +=
      '<div class="leaderboard-item">' +
      (i + 1) +
      '. <span style="color:#fff; font-weight:bold;">' +
      name +
      '</span> &nbsp; <span style="color:#FFD700; font-weight:bold;">' +
      it.score +
      '</span> &nbsp; <span style="color:#ccc; font-size:10px">' +
      it.t.split("T")[0] +
      "</span></div>";
  }
  html += "</div>";
  return html;
}

function getStageIntroText(stage) {
  if (stage === 1) return I18N && I18N.stage1Intro ? I18N.stage1Intro : "";
  if (stage === 2) return I18N && I18N.stage2Intro ? I18N.stage2Intro : "";
  if (stage === 3) return I18N && I18N.stage3Intro ? I18N.stage3Intro : "";
  return "";
}

function getStageHintText(stage) {
  if (stage === 1) return I18N && I18N.stage1Hint ? I18N.stage1Hint : "";
  if (stage === 2) return I18N && I18N.stage2Hint ? I18N.stage2Hint : "";
  if (stage === 3) return I18N && I18N.stage3Hint ? I18N.stage3Hint : "";
  return "";
}

function getResumeLabel() {
  return I18N && I18N.resumeControl
    ? I18N.resumeControl
    : I18N && I18N.tutorialResume
    ? I18N.tutorialResume
    : "Resume";
}

function showRankFlashAndRestart(rankInfo) {
  var rankLabel = I18N && I18N.rankLabel ? I18N.rankLabel : "Rank";
  var notTopText =
    I18N && I18N.rankNotInTop ? I18N.rankNotInTop : "Out of Top";
  var savedPrefix =
    I18N && I18N.rankSavedPrefix ? I18N.rankSavedPrefix : "Saved as";
  var rankText =
    rankInfo && rankInfo.rank > 0 ? "#" + rankInfo.rank : notTopText;
  var html =
    '<div class="rank-flash-wrap">' +
    '<div class="rank-flash rank-flash-anim">' +
    "<h3>" +
    savedPrefix +
    " " +
    (rankInfo && rankInfo.name ? rankInfo.name : "---") +
    "</h3>" +
    "<p>" +
    rankLabel +
    ": " +
    rankText +
    "</p>" +
    "</div>" +
    "</div>";
  try {
    G.O.viewport.setSrc(html).draw();
  } catch (e) { console.error("[square-tools] caught error", e); }
  setTimeout(function () {
    try {
      resetGame();
    } catch (e) {
      try {
        G.O.viewport.setSrc(renderLeaderboardHTML()).draw();
      } catch (err) { console.error("[square-tools] caught error", err); }
    }
  }, 2000);
}

function updateStageControl() {
  try {
    if (!G.O || !G.O.tutorial) return;
    var label = "";
    var controlState = "pause";
    if (!gameStarted && stageIndex === 1) {
      label = I18N && I18N.startControl ? I18N.startControl : "Start";
      controlState = "start";
    } else if (gamestate === "pause") {
      label = "<span class='control-text'>" + getResumeLabel() + "</span>";
      controlState = "resume";
    } else {
      label = "<span class='control-text'>" + (I18N && I18N.stopControl ? I18N.stopControl : "Stop") + "</span>";
    }
    var control = document.getElementById("tutorial");
    if (!control) return;
    if (control.getAttribute("data-control-state") === controlState) return;
    G.O.tutorial.setSrc("<p class='tutorial'>" + label + "</p>").draw();
    control.setAttribute("data-control-state", controlState);
    control.classList.remove("control-start", "control-resume", "control-pause");
    control.classList.add("control-" + controlState);
  } catch (e) { console.error("[square-tools] caught error", e); }
}

function shareControlsHTML(scoreValue) {
  var shareLabel = I18N && I18N.shareButton ? I18N.shareButton : "Share score";
  var shareHint = I18N && I18N.shareHint ? I18N.shareHint : "";
  return (
    '<div class="share-actions">' +
    '<button id="shareScore" class="share-score-button" data-score="' +
    Math.max(0, Number(scoreValue) || 0) +
    '">' +
    shareLabel +
    "</button>" +
    '<p id="shareStatus" class="share-status" aria-live="polite"></p>' +
    (shareHint ? '<p class="share-hint">' + shareHint + "</p>" : "") +
    "</div>"
  );
}

function setShareStatus(text, state) {
  var status = document.getElementById("shareStatus");
  if (!status) return;
  status.className = "share-status" + (state ? " " + state : "");
  status.textContent = text || "";
}

function drawPosterRoundRect(ctx, x, y, w, h, radius) {
  var r = Math.min(radius, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function loadShareIcon() {
  return new Promise(function (resolve) {
    try {
      var iconLink = document.querySelector('link[rel~="icon"]');
      if (!iconLink || !iconLink.href) return resolve(null);
      var img = new Image();
      img.onload = function () { resolve(img); };
      img.onerror = function () { resolve(null); };
      img.src = iconLink.href;
    } catch (e) {
      resolve(null);
    }
  });
}

async function createScorePoster(scoreValue, language) {
  var canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1440;
  var ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas unavailable");

  var bg = ctx.createLinearGradient(0, 0, 1080, 1440);
  bg.addColorStop(0, "#26113f");
  bg.addColorStop(0.48, "#0d101a");
  bg.addColorStop(1, "#05060a");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 1080, 1440);

  ctx.globalAlpha = 0.2;
  for (var py = -80; py < 1440; py += 150) {
    for (var px = -60; px < 1080; px += 150) {
      ctx.strokeStyle = (px / 150 + py / 150) % 2 === 0 ? "#00f5ff" : "#ffcc00";
      ctx.lineWidth = 4;
      ctx.strokeRect(px, py, 96, 96);
    }
  }
  ctx.globalAlpha = 1;

  drawPosterRoundRect(ctx, 90, 120, 900, 1200, 52);
  ctx.fillStyle = "rgba(13, 16, 26, 0.94)";
  ctx.fill();
  ctx.strokeStyle = "rgba(0, 245, 255, 0.7)";
  ctx.lineWidth = 6;
  ctx.stroke();

  var icon = await loadShareIcon();
  if (icon) {
    drawPosterRoundRect(ctx, 440, 190, 200, 200, 38);
    ctx.save();
    ctx.clip();
    ctx.drawImage(icon, 440, 190, 200, 200);
    ctx.restore();
  } else {
    ctx.fillStyle = "#00f5ff";
    ctx.fillRect(452, 202, 72, 72);
    ctx.fillStyle = "#ffcc00";
    ctx.fillRect(556, 202, 72, 72);
    ctx.fillStyle = "#ff2442";
    ctx.fillRect(452, 306, 72, 72);
    ctx.fillStyle = "#6dff7a";
    ctx.fillRect(556, 306, 72, 72);
  }

  var posterTitle = I18N && I18N.sharePosterTitle ? I18N.sharePosterTitle : "SQUARE GAME";
  var posterChallenge = I18N && I18N.sharePosterChallenge
    ? I18N.sharePosterChallenge
    : "CAN YOU BEAT MY SCORE?";
  ctx.textAlign = "center";
  ctx.fillStyle = "#f2f5ff";
  ctx.font = '700 66px "Courier New", monospace';
  ctx.fillText(posterTitle, 540, 495);

  ctx.fillStyle = "#b9c1d6";
  ctx.font = '700 34px "Courier New", monospace';
  ctx.fillText(language === "zh" ? "我的得分" : "MY SCORE", 540, 620);

  ctx.shadowColor = "rgba(255, 204, 0, 0.75)";
  ctx.shadowBlur = 30;
  ctx.fillStyle = "#ffdf3d";
  ctx.font = '800 210px "Courier New", monospace';
  ctx.fillText(String(Math.max(0, Number(scoreValue) || 0)), 540, 850);
  ctx.shadowBlur = 0;

  ctx.fillStyle = "#6dff7a";
  ctx.font = '700 38px "Courier New", monospace';
  ctx.fillText(posterChallenge, 540, 1010);

  ctx.fillStyle = "#b9c1d6";
  ctx.font = '28px "Courier New", monospace';
  ctx.fillText(language === "zh" ? "四角相同即可消除 · 来挑战我" : "MATCH FOUR CORNERS · TAKE THE CHALLENGE", 540, 1120);

  ctx.strokeStyle = "rgba(255,255,255,0.14)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(210, 1190);
  ctx.lineTo(870, 1190);
  ctx.stroke();
  ctx.fillStyle = "#8b93aa";
  ctx.font = '24px "Courier New", monospace';
  ctx.fillText("SQUARE GAME", 540, 1250);

  return canvas.toDataURL("image/png");
}

async function shareScoreOnXhs(scoreValue, button) {
  if (button && button.disabled) return;
  var miniTool = window.xhs && window.xhs.miniTool;
  if (!miniTool || typeof miniTool.postNote !== "function") {
    setShareStatus(
      I18N && I18N.shareUnavailable
        ? I18N.shareUnavailable
        : "Open this game in Xiaohongshu to share.",
      "error"
    );
    return;
  }
  if (button) button.disabled = true;
  setShareStatus(
    I18N && I18N.sharePreparing ? I18N.sharePreparing : "Building your score card...",
    "loading"
  );
  try {
    var poster = await createScorePoster(scoreValue, typeof LANG !== "undefined" ? LANG : "zh");
    var titleTemplate = I18N && I18N.shareNoteTitle
      ? I18N.shareNoteTitle
      : "Square Game: {score} pts";
    var contentTemplate = I18N && I18N.shareNoteContent
      ? I18N.shareNoteContent
      : "I scored {score} in Square Game. Can you beat me?";
    await miniTool.postNote({
      title: titleTemplate.replace("{score}", scoreValue).substring(0, 20),
      content: contentTemplate.replace("{score}", scoreValue).substring(0, 1000),
      tags: typeof LANG !== "undefined" && LANG === "zh"
        ? "#极速方块 #益智游戏"
        : "#SquareGame #PuzzleGame",
      mediaInfo: { image_resources: [{ url: poster }] },
    });
    setShareStatus(
      I18N && I18N.shareOpened ? I18N.shareOpened : "Publisher opened.",
      "success"
    );
  } catch (e) {
    setShareStatus(
      I18N && I18N.shareFailed
        ? I18N.shareFailed
        : "Sharing was cancelled or unavailable. Your score is safe.",
      "error"
    );
  } finally {
    if (button) button.disabled = false;
  }
}

function bindScoreShare(scoreValue) {
  var button = document.getElementById("shareScore");
  if (!button) return;
  button.addEventListener("click", function (e) {
    stopEventBubble(e);
    shareScoreOnXhs(scoreValue, button);
  });
}

// show end-of-game screen: if score qualifies for leaderboard allow name entry,
// otherwise show read-only score with only a Skip button.
function showEndScreen(scoreValue) {
  try {
    stopStageCycle();
    var list = getLeaderboard() || [];
    var qualifies = false;
    if (!list || list.length < (leaderboardSize || 0)) {
      qualifies = true;
    } else {
      var lowest = (list[list.length - 1] && list[list.length - 1].score) || 0;
      // allow tie to qualify
      if (scoreValue >= lowest) qualifies = true;
    }
    if (qualifies) {
      // delegate to name picker for qualified scores
      return showNamePicker(scoreValue);
    }
    // non-qualifying: show read-only score + Skip
    gamestate = "off";
    isTouched = true;
    var html =
      '<div class="game-over-panel" style="text-align:center; color:#fff;">' +
      '<h1 class="game-over-title">' +
      (I18N && I18N.gameOverTitle ? I18N.gameOverTitle : "Game Over") +
      "</h1>" +
      '<h2 class="you-got-text">' +
      (I18N && I18N.youGot ? I18N.youGot : "You got") +
      "</h2>" +
      '<h1 class="score-display">' +
      (I18N && I18N.pointsLabel ? I18N.pointsLabel + " " : "") +
      scoreValue +
      "</h1>" +
      shareControlsHTML(scoreValue) +
      '<div style="margin-top:8px;"><button id="skipOnly">' +
      (I18N && I18N.skipText ? I18N.skipText : "Skip") +
      "</button></div>" +
      renderLeaderboardHTML() +
      "</div>";
    G.O.viewport.setSrc(html).draw();
    try {
      var panel = document.querySelector(".game-over-panel");
      if (panel) {
        panel.addEventListener("touchend", stopEventBubble, false);
        panel.addEventListener("click", stopEventBubble, false);
      }
    } catch (e) { console.error("[square-tools] caught error", e); }
    bindScoreShare(scoreValue);
    var btn = document.getElementById("skipOnly");
    if (btn)
      btn.addEventListener("click", function (e) {
        stopEventBubble(e);
        try {
          resetGame();
        } catch (e) {
          G.O.viewport.setSrc(renderLeaderboardHTML()).draw();
        }
      });
  } catch (e) {
    console.log("showEndScreen error", e);
  }
}

// show a name picker UI (3 sliders A-Z) and save score when confirmed
function showNamePicker(scoreValue) {
  try {
    gamestate = "off";
    // prevent viewport click from instantly restarting; only Confirm/Skip will call resetGame()
    isTouched = true;
    function valToChar(v) {
      return String.fromCharCode(65 + (v | 0));
    }
    function generateAlphaStripHTML() {
      var s = "";
      for (var z = 0; z < 26; z++)
        s += "<span>" + String.fromCharCode(65 + z) + "</span>";
      return s;
    }

    // build HTML with visible up/down buttons for each letter column (better for touch)
    var html =
      '<div class="game-over-panel" style="text-align:center; color:#fff;">' +
      '<h1 class="game-over-title">' +
      (I18N && I18N.gameOverTitle ? I18N.gameOverTitle : "Game Over") +
      "</h1>" +
      '<h2 class="you-got-text">' +
      (I18N && I18N.youGot ? I18N.youGot : "You got") +
      "</h2>" +
      '<h1 class="score-display">' +
      (I18N && I18N.pointsLabel ? I18N.pointsLabel + " " : "") +
      scoreValue +
      "</h1>" +
      shareControlsHTML(scoreValue) +
      '<div class="name-picker">' +
      '<div class="name-columns">' +
      '<div class="letter-col"><button class="letter-up" data-idx="0"><i class="arrow"></i></button><span id="letter0" class="letter"><span class="strip">' +
      generateAlphaStripHTML() +
      '</span></span><button class="letter-down" data-idx="0"><i class="arrow"></i></button></div>' +
      '<div class="letter-col"><button class="letter-up" data-idx="1"><i class="arrow"></i></button><span id="letter1" class="letter"><span class="strip">' +
      generateAlphaStripHTML() +
      '</span></span><button class="letter-down" data-idx="1"><i class="arrow"></i></button></div>' +
      '<div class="letter-col"><button class="letter-up" data-idx="2"><i class="arrow"></i></button><span id="letter2" class="letter"><span class="strip">' +
      generateAlphaStripHTML() +
      '</span></span><button class="letter-down" data-idx="2"><i class="arrow"></i></button></div>' +
      "</div>" +
      '<div style="margin-top:8px;"><button id="confirmName">' +
      (I18N && I18N.confirmText ? I18N.confirmText : "Confirm") +
      '</button> <button id="skipName">' +
      (I18N && I18N.skipText ? I18N.skipText : "Skip") +
      "</button></div>" +
      "</div>" +
      renderLeaderboardHTML() +
      "</div>";

    G.O.viewport.setSrc(html).draw();
    try {
      var panel = document.querySelector(".game-over-panel");
      if (panel) {
        panel.addEventListener("touchend", stopEventBubble, false);
        panel.addEventListener("click", stopEventBubble, false);
      }
    } catch (e) { console.error("[square-tools] caught error", e); }
    bindScoreShare(scoreValue);

    // internal state for letter indices
    var vals = [0, 0, 0];
    function getLetterStepPx(letterEl) {
      try {
        if (!letterEl) return 48;
        var strip = letterEl.querySelector(".strip");
        var row = strip ? strip.querySelector("span") : null;
        // Use real row height instead of container height to avoid border/padding drift.
        var h = row ? row.offsetHeight : 0;
        if (!h || h <= 0) h = row ? row.clientHeight : 0;
        if (!h || h <= 0) {
          var cs = row ? window.getComputedStyle(row) : null;
          h = parseFloat(cs && cs.height ? cs.height : "48");
        }
        h = Math.round(h || 48);
        return h > 0 ? h : 48;
      } catch (e) {
        console.error("[square-tools] caught error", e);
        return 48;
      }
    }
    function updateStrip(idx) {
      var l = document.getElementById("letter" + idx);
      if (!l) return;
      var strip = l.querySelector(".strip");
      if (strip) {
        var stepPx = getLetterStepPx(l);
        strip.style.transform = "translate3d(0," + -vals[idx] * stepPx + "px,0)";
      }
    }
    for (var i = 0; i < 3; i++) updateStrip(i);
    // Re-apply once after layout settles to avoid occasional first-frame misalignment.
    setTimeout(function () {
      try {
        for (var t = 0; t < 3; t++) updateStrip(t);
      } catch (e) { console.error("[square-tools] caught error", e); }
    }, 60);

    // attach up/down handlers
    var ups = document.querySelectorAll(".letter-up");
    for (var k = 0; k < ups.length; k++) {
      (function (btn) {
        btn.addEventListener("click", function (e) {
          stopEventBubble(e);
          var idx = parseInt(btn.getAttribute("data-idx"), 10) || 0;
          // pressing up moves to previous letter visually
          vals[idx] = (vals[idx] + 25) % 26;
          updateStrip(idx);
        });
      })(ups[k]);
    }
    var downs = document.querySelectorAll(".letter-down");
    for (var k = 0; k < downs.length; k++) {
      (function (btn) {
        btn.addEventListener("click", function (e) {
          stopEventBubble(e);
          var idx = parseInt(btn.getAttribute("data-idx"), 10) || 0;
          vals[idx] = (vals[idx] + 1) % 26;
          updateStrip(idx);
        });
      })(downs[k]);
    }

    document
      .getElementById("confirmName")
      .addEventListener("click", function (e) {
        stopEventBubble(e);
        var rankInfo = null;
        try {
          var name =
            valToChar(vals[0]) + valToChar(vals[1]) + valToChar(vals[2]);
          rankInfo = saveScoreWithName(scoreValue, name);
        } catch (e) {
          rankInfo = saveScoreWithName(scoreValue, "");
        }
        // show rank info briefly before starting a new run
        showRankFlashAndRestart(rankInfo);
      });

    document.getElementById("skipName").addEventListener("click", function (e) {
      stopEventBubble(e);
      saveScoreWithName(scoreValue, "");
      try {
        resetGame();
      } catch (e) {
        G.O.viewport.setSrc(renderLeaderboardHTML()).draw();
      }
    });
  } catch (e) {
    console.log("showNamePicker error", e);
  }
}

function maybeShowIdleHint() {
  if (gamestate !== "on" || boardTransitionActive || !gameStarted) return false;
  var nowTick = typeof gameTick !== "undefined" ? gameTick : 0;
  var thresholdTicks = Math.max(1, autoHintIdleSec || 6) * 25;
  var baselineTick = Math.max(lastClearTick || 0, lastHintTick || 0);
  if (nowTick - baselineTick < thresholdTicks) return false;
  if (!showHint()) return false;
  // If the player still does not clear anything, allow another hint after the
  // next full idle interval instead of consuming a finite hint allowance.
  lastHintTick = nowTick;
  return true;
}

// centralized dashboard updater
function updateDashboard() {
  try {
    // safety: if paused without overlay (unexpected), resume to avoid stuck state
    try {
      if (gamestate === "pause") {
        var tb = document.getElementById("tutorialboard");
        var cls = tb && tb.className ? tb.className : "";
        var overlayOn = cls.indexOf("tutorialboardOn") >= 0;
        if (!overlayOn) gamestate = "on";
      }
    } catch (e) { console.error("[square-tools] caught error", e); }
    var dash = G.O["dashboard"];
    if (!dash) return;
    var dashElement = document.getElementById("dashboard");
    if (!dashElement) return;
    var timeLabel = I18N && I18N.timeLabel ? I18N.timeLabel : "Time";
    var scoreLabel = I18N && I18N.scoreLabel ? I18N.scoreLabel : "Score";
    var timeValue = String(Math.max(0, Math.ceil(timer / 25)));
    var scoreValue = String(score);
    var statusText = "\u00a0";
    var statusClass = "hud-status hud-status-idle";
    if (isFirepowerActive()) {
      statusText =
        (I18N && I18N.firepowerLabel
          ? I18N.firepowerLabel
          : "FIREPOWER x2 · {sec}s"
        ).replace("{sec}", getFirepowerRemainingSeconds().toFixed(1));
      statusClass = "hud-status hud-firepower";
    } else if (isFirepowerFuseActive()) {
      statusText =
        (I18N && I18N.firepowerFuseLabel
          ? I18N.firepowerFuseLabel
          : "COMBO INTERVAL {sec}s"
        ).replace("{sec}", getFirepowerFuseRemainingSeconds().toFixed(1));
      statusClass = "hud-status hud-fuse";
    }

    var timeNode = dashElement.querySelector(".time .hud-value");
    var scoreNode = dashElement.querySelector(".score .hud-value");
    var statusNode = dashElement.querySelector(".hud-status");
    if (!timeNode || !scoreNode || !statusNode) {
      dash.setSrc(
        "<p class='time'><span class='hud-label'>" + timeLabel +
        "</span><strong class='hud-value'>" + timeValue + "</strong></p>" +
        "<p class='score'><span class='hud-label'>" + scoreLabel +
        "</span><strong class='hud-value'>" + scoreValue + "</strong></p>" +
        "<p class='" + statusClass + "'>" + statusText + "</p>"
      ).draw();
      timeNode = dashElement.querySelector(".time .hud-value");
      scoreNode = dashElement.querySelector(".score .hud-value");
      statusNode = dashElement.querySelector(".hud-status");
    }
    if (timeNode && timeNode.textContent !== timeValue) timeNode.textContent = timeValue;
    if (scoreNode && scoreNode.textContent !== scoreValue) scoreNode.textContent = scoreValue;
    if (statusNode) {
      if (statusNode.className !== statusClass) statusNode.className = statusClass;
      if (statusNode.textContent !== statusText) statusNode.textContent = statusText;
      if (statusClass.indexOf("hud-status-idle") >= 0) {
        statusNode.setAttribute("aria-hidden", "true");
      } else {
        statusNode.removeAttribute("aria-hidden");
      }
    }
    renderFirepowerMode();
    renderFirepowerFuse();
    updateStageControl();
    // no manual hint button - auto-hint only
  } catch (e) {
    console.log("updateDashboard error", e);
  }
}

function pulseDashboardReward(pts, secBonus) {
  try {
    var dash = document.getElementById("dashboard");
    if (!dash) return;
    var targets = [];
    if (typeof pts === "number" && pts > 0) {
      targets.push({ node: dash.querySelector(".score"), cls: "hud-score-reward" });
    }
    if (typeof secBonus === "number" && secBonus > 0) {
      targets.push({ node: dash.querySelector(".time"), cls: "hud-time-reward" });
    }
    for (var i = 0; i < targets.length; i++) {
      if (!targets[i].node) continue;
      targets[i].node.classList.remove(targets[i].cls);
      void targets[i].node.offsetWidth;
      targets[i].node.classList.add(targets[i].cls);
    }
  } catch (e) { console.error("[square-tools] caught error", e); }
}

// -----------------------------
// Hint feature
// -----------------------------
function showHint() {
  var matches = findAvailableMatches(map);
  if (!matches.length) return false;
  var match = selectHintMatch(matches);
  var id = match.y1 * column + match.x1;
  var hintGob = G.O["square" + id];
  if (!hintGob) return false;
  hintGob.addClass("hint").addClass("hint-tap-first").draw();
  setTimeout(function () {
    var gob = G.O["square" + id];
    if (gob) gob.removeClass("hint").removeClass("hint-tap-first").draw();
  }, 1200);
  return true;
}

function findAvailableMatches(boardMap) {
  var source = boardMap || map;
  var matches = [];
  if (!source || !source.length || !source[0]) return matches;
  for (var y1 = 0; y1 < source.length; y1++) {
    for (var x1 = 0; x1 < source[0].length; x1++) {
      for (var y2 = y1 + 1; y2 < source.length; y2++) {
        for (var x2 = x1 + 1; x2 < source[0].length; x2++) {
          if (
            source[y1][x1] == source[y1][x2] &&
            source[y1][x2] == source[y2][x1] &&
            source[y2][x1] == source[y2][x2]
          ) {
            matches.push({
              x1: x1,
              y1: y1,
              x2: x2,
              y2: y2,
              type: source[y1][x1],
            });
          }
        }
      }
    }
  }
  return matches;
}

function matchArea(match) {
  if (!match) return 0;
  return (match.x2 - match.x1 + 1) * (match.y2 - match.y1 + 1);
}

function matchShapeDifference(match) {
  if (!match) return Infinity;
  return Math.abs(
    (match.x2 - match.x1 + 1) - (match.y2 - match.y1 + 1)
  );
}

function compareMatchesForLargest(a, b) {
  var areaDiff = matchArea(b) - matchArea(a);
  if (areaDiff) return areaDiff;
  var shapeDiff = matchShapeDifference(a) - matchShapeDifference(b);
  if (shapeDiff) return shapeDiff;
  if (a.y1 !== b.y1) return a.y1 - b.y1;
  if (a.x1 !== b.x1) return a.x1 - b.x1;
  if (a.y2 !== b.y2) return a.y2 - b.y2;
  return a.x2 - b.x2;
}

function findMatchesFromCorner(rowIndex, columnIndex, boardMap) {
  var matches = findAvailableMatches(boardMap || map);
  var result = [];
  for (var i = 0; i < matches.length; i++) {
    var match = matches[i];
    var isCorner =
      (columnIndex === match.x1 || columnIndex === match.x2) &&
      (rowIndex === match.y1 || rowIndex === match.y2);
    if (isCorner) result.push(match);
  }
  result.sort(compareMatchesForLargest);
  return result;
}

function selectLargestMatch(matches) {
  if (!matches || !matches.length) return null;
  return matches.slice().sort(compareMatchesForLargest)[0];
}

function selectHintMatch(matches) {
  if (!matches || !matches.length) return null;
  return matches.slice().sort(function (a, b) {
    var areaDiff = matchArea(a) - matchArea(b);
    if (areaDiff) return areaDiff;
    return compareMatchesForLargest(a, b);
  })[0];
}

function getMatchStats(matches) {
  var unique = {};
  var compact = false;
  var compactSpan =
    typeof refillCompactMaxSpan !== "undefined" ? refillCompactMaxSpan : 3;
  for (var i = 0; i < matches.length; i++) {
    var match = matches[i];
    unique[match.y1 + ":" + match.x1] = true;
    unique[match.y1 + ":" + match.x2] = true;
    unique[match.y2 + ":" + match.x1] = true;
    unique[match.y2 + ":" + match.x2] = true;
    if (
      match.x2 - match.x1 <= compactSpan &&
      match.y2 - match.y1 <= compactSpan
    ) compact = true;
  }
  return {
    matchCount: matches.length,
    uniqueAnchorCount: Object.keys(unique).length,
    hasCompact: compact,
  };
}

function refillStatsScore(stats) {
  return (
    stats.matchCount * 20 +
    stats.uniqueAnchorCount * 5 +
    (stats.hasCompact ? 30 : 0)
  );
}

function refillStatsMeetTargets(stats) {
  return (
    stats.matchCount >=
      (typeof refillMinMatches !== "undefined" ? refillMinMatches : 3) &&
    stats.uniqueAnchorCount >=
      (typeof refillMinUniqueAnchors !== "undefined" ? refillMinUniqueAnchors : 8) &&
    stats.hasCompact
  );
}

function showInvalidTap(id) {
  invalidTapLockedUntil =
    Date.now() +
    (typeof invalidTapCooldownMs !== "undefined" ? invalidTapCooldownMs : 220);
  var element = document.getElementById(id);
  if (element) {
    element.classList.remove("invalid-tap");
    void element.offsetWidth;
    element.classList.add("invalid-tap");
    setTimeout(function () {
      var current = document.getElementById(id);
      if (current) current.classList.remove("invalid-tap");
    }, 260);
  }
  if (isFirepowerFuseActive()) {
    var penaltyTicks = Math.max(
      1,
      Math.round(
        (typeof invalidTapFusePenaltySec !== "undefined"
          ? invalidTapFusePenaltySec
          : 0.3) * 25
      )
    );
    firepowerFuseUntilTick = Math.max(gameTick, firepowerFuseUntilTick - penaltyTicks);
  }
}

function enable() {
  return findAvailableMatches(map).length;
}

function clearSquares(y1, x1, y2, x2) {
  var sx = x1,
    sy = y1,
    bx = x2,
    by = y2;
  if (x2 < x1) (sx = x2), (bx = x1);
  if (y2 < y1) (sy = y2), (by = y1);

  for (var i = sy; i <= by; i++)
    for (var j = sx; j <= bx; j++) {
      var square = G.O["square" + (i * column + j)];
      if (square != null) square.turnOff();
    }
}

function setSquareTileLabel(element, type) {
  if (!element) return;
  var labels = I18N && I18N.tileLabels ? I18N.tileLabels : [];
  var label = labels[type] || "";
  element.setAttribute("data-tile-label", label);
  if (label) element.setAttribute("aria-label", label);
  else element.removeAttribute("aria-label");
}

function setSquareTypeClass(element, type, gob) {
  if (gob) {
    for (var i = 0; i < 6; i++) gob.removeClass("square" + i);
    gob.addClass("square" + type).turnOn().draw();
    element = document.getElementById(gob.id) || element;
  }
  if (!element) return;
  for (var j = 0; j < 6; j++) element.classList.remove("square" + j);
  element.classList.add("square" + type);
  setSquareTileLabel(element, type);
}

function buildGravityRefillPlan(y1, x1, y2, x2) {
  var sx = x1,
    sy = y1,
    bx = x2,
    by = y2;
  if (x2 < x1) (sx = x2), (bx = x1);
  if (y2 < y1) (sy = y2), (by = y1);
  var gap = by - sy + 1;
  var moves = [];
  var spawned = [];
  var survivorTypesByColumn = {};

  for (var x = sx; x <= bx; x++) {
    var survivors = [];
    for (var sourceRow = 0; sourceRow < row; sourceRow++) {
      if (sourceRow < sy || sourceRow > by) {
        survivors.push({ type: map[sourceRow][x], sourceRow: sourceRow });
      }
    }
    survivorTypesByColumn[x] = survivors;
    var finalColumn = [];
    for (var newRow = 0; newRow < gap; newRow++) {
      var spawnedEntry = {
        type: getSquareType(),
        sourceRow: newRow - gap,
        targetRow: newRow,
        column: x,
        spawned: true,
      };
      finalColumn.push(spawnedEntry);
      spawned.push(spawnedEntry);
    }
    for (var s = 0; s < survivors.length; s++) {
      finalColumn.push({
        type: survivors[s].type,
        sourceRow: survivors[s].sourceRow,
        targetRow: gap + s,
        column: x,
        spawned: false,
      });
    }
    for (var targetRow = 0; targetRow < row; targetRow++) {
      var move = finalColumn[targetRow];
      map[targetRow][x] = move.type;
      moves.push(move);
    }
  }

  function isSameAsCleared(match) {
    return (
      match.x1 === sx &&
      match.y1 === sy &&
      match.x2 === bx &&
      match.y2 === by
    );
  }

  function hasSpawnedCorner(match) {
    var corners = [
      { x: match.x1, y: match.y1 },
      { x: match.x2, y: match.y1 },
      { x: match.x1, y: match.y2 },
      { x: match.x2, y: match.y2 },
    ];
    for (var cornerIndex = 0; cornerIndex < corners.length; cornerIndex++) {
      var corner = corners[cornerIndex];
      if (corner.y < gap && corner.x >= sx && corner.x <= bx) return true;
    }
    return false;
  }

  function isImmediateRepeat(match) {
    return isSameAsCleared(match) && hasSpawnedCorner(match);
  }

  function refillRandomSpawnedCells() {
    for (var refillX = sx; refillX <= bx; refillX++) {
      for (var refillY = 0; refillY < gap; refillY++) {
        map[refillY][refillX] = getSquareType();
      }
      var survivors = survivorTypesByColumn[refillX];
      for (var survivorIndex = 0; survivorIndex < survivors.length; survivorIndex++) {
        map[gap + survivorIndex][refillX] = survivors[survivorIndex].type;
      }
    }
  }

  function spawnedCornerCount(match) {
    var count = 0;
    if (match.y1 < gap && match.x1 >= sx && match.x1 <= bx) count++;
    if (match.y1 < gap && match.x2 >= sx && match.x2 <= bx) count++;
    if (match.y2 < gap && match.x1 >= sx && match.x1 <= bx) count++;
    if (match.y2 < gap && match.x2 >= sx && match.x2 <= bx) count++;
    return count;
  }

  function snapshotSpawnedTypes() {
    var snapshot = [];
    for (var snapshotX = sx; snapshotX <= bx; snapshotX++) {
      for (var snapshotY = 0; snapshotY < gap; snapshotY++) {
        snapshot.push({
          x: snapshotX,
          y: snapshotY,
          type: map[snapshotY][snapshotX],
        });
      }
    }
    return snapshot;
  }

  function restoreSpawnedTypes(snapshot) {
    for (var restoreIndex = 0; restoreIndex < snapshot.length; restoreIndex++) {
      var entry = snapshot[restoreIndex];
      map[entry.y][entry.x] = entry.type;
    }
  }

  var solution = null;
  var solutionStrategy = "natural";
  var naturalAttempts = 0;
  var bestNatural = null;
  var bestNaturalScore = -1;
  var forceMutationFallback =
    typeof debugMode !== "undefined" &&
    debugMode &&
    typeof debugForceMutation !== "undefined" &&
    debugForceMutation;
  var maxAttempts =
    forceMutationFallback
      ? 0
      : (typeof refillPlanAttempts !== "undefined" ? refillPlanAttempts : 40);
  for (var attempt = 0; attempt < maxAttempts; attempt++) {
    naturalAttempts = attempt + 1;
    refillRandomSpawnedCells();
    var naturalMatches = findAvailableMatches(map);
    var hasRepeat = false;
    for (var n = 0; n < naturalMatches.length; n++) {
      if (isImmediateRepeat(naturalMatches[n])) {
        hasRepeat = true;
        break;
      }
    }
    if (naturalMatches.length > 0 && !hasRepeat) {
      var stats = getMatchStats(naturalMatches);
      var statsScore = refillStatsScore(stats);
      if (statsScore > bestNaturalScore) {
        bestNaturalScore = statsScore;
        bestNatural = {
          spawnedTypes: snapshotSpawnedTypes(),
          match: selectHintMatch(naturalMatches),
          stats: stats,
        };
      }
      if (refillStatsMeetTargets(stats)) {
        solution = selectHintMatch(naturalMatches);
        break;
      }
    }
  }

  // Soft targets never justify mutating remembered survivor tiles. Use the
  // best spawn-only board found even when it has fewer than three rectangles.
  if (!solution && bestNatural) {
    restoreSpawnedTypes(bestNatural.spawnedTypes);
    solution = bestNatural.match;
    solutionStrategy = "best-natural";
  }

  if (!solution) {
    solutionStrategy = "mixed-fallback";
    // Break a repeated freshly spawned corner before constructing a fallback.
    var repeatedMatches = findAvailableMatches(map);
    for (var repeatedIndex = 0; repeatedIndex < repeatedMatches.length; repeatedIndex++) {
      var repeated = repeatedMatches[repeatedIndex];
      if (isImmediateRepeat(repeated)) {
        var breakY = repeated.y1 < gap ? repeated.y1 : repeated.y2;
        var breakX = repeated.x1 >= sx && repeated.x1 <= bx ? repeated.x1 : repeated.x2;
        map[breakY][breakX] = getAlternativeSquareType(map[breakY][breakX]);
      }
    }

    // Prefer an existing equal survivor pair: only the two new top corners
    // need to be adjusted, so falling survivor identities remain unchanged.
    for (
      var existingY = forceMutationFallback ? row : gap;
      existingY < row && !solution;
      existingY++
    ) {
      for (var fx1 = sx; fx1 < bx && !solution; fx1++) {
        for (var fx2 = fx1 + 1; fx2 <= bx && !solution; fx2++) {
          if (map[existingY][fx1] !== map[existingY][fx2]) continue;
          for (var newY = 0; newY < gap; newY++) {
            var candidate = {
              x1: fx1,
              y1: newY,
              x2: fx2,
              y2: existingY,
              type: map[existingY][fx1],
            };
            if (isSameAsCleared(candidate)) continue;
            if (fx2 - fx1 < 2 && existingY - newY < 2) continue;
            map[newY][fx1] = candidate.type;
            map[newY][fx2] = candidate.type;
            solution = candidate;
            break;
          }
        }
      }
    }

    if (!solution && gap < row) {
      // No equal survivor pair exists. Anchor on one survivor and change the
      // minimum three other affected destinations to create a wider/taller move.
      var fallbackX1 = sx;
      var fallbackX2 = bx;
      var fallbackY1 = 0;
      var fallbackY2 = Math.min(row - 1, Math.max(gap, 2));
      if (
        fallbackX1 === sx &&
        fallbackY1 === sy &&
        fallbackX2 === bx &&
        fallbackY2 === by
      ) {
        fallbackY2 = fallbackY2 < row - 1 ? fallbackY2 + 1 : gap;
      }
      var fallbackType = map[fallbackY2][fallbackX1];
      map[fallbackY1][fallbackX1] = fallbackType;
      map[fallbackY1][fallbackX2] = fallbackType;
      map[fallbackY2][fallbackX2] = fallbackType;
      solution = {
        x1: fallbackX1,
        y1: fallbackY1,
        x2: fallbackX2,
        y2: fallbackY2,
        type: fallbackType,
      };
    }

    if (!solution) {
      // Full-height clears have no survivors. Build a non-adjacent all-new
      // rectangle, which cannot become the old adjacent 2x2 loop.
      var fullX1 = sx;
      var fullX2 = bx;
      var fullY1 = 0;
      var fullY2 = row > 2 ? 2 : row - 1;
      var fullType = getSquareType();
      map[fullY1][fullX1] = fullType;
      map[fullY1][fullX2] = fullType;
      map[fullY2][fullX1] = fullType;
      map[fullY2][fullX2] = fullType;
      solution = {
        x1: fullX1,
        y1: fullY1,
        x2: fullX2,
        y2: fullY2,
        type: fullType,
      };
    }
  }

  // A fallback may share top-row corners with the old rectangle. Break any
  // revived old rectangle at a spawned corner that is not part of the chosen
  // solution, then keep the chosen solution intact.
  var finalMatches = findAvailableMatches(map);
  for (var finalIndex = 0; finalIndex < finalMatches.length; finalIndex++) {
    var finalMatch = finalMatches[finalIndex];
    if (!isImmediateRepeat(finalMatch)) continue;
    var repeatCorners = [
      { x: finalMatch.x1, y: finalMatch.y1 },
      { x: finalMatch.x2, y: finalMatch.y1 },
      { x: finalMatch.x1, y: finalMatch.y2 },
      { x: finalMatch.x2, y: finalMatch.y2 },
    ];
    for (var cornerIndex = 0; cornerIndex < repeatCorners.length; cornerIndex++) {
      var corner = repeatCorners[cornerIndex];
      var isSpawned = corner.y < gap && corner.x >= sx && corner.x <= bx;
      var isSolutionCorner =
        (corner.x === solution.x1 || corner.x === solution.x2) &&
        (corner.y === solution.y1 || corner.y === solution.y2);
      if (isSpawned && !isSolutionCorner) {
        map[corner.y][corner.x] = getAlternativeSquareType(map[corner.y][corner.x]);
        break;
      }
    }
  }

  var mutation = null;
  for (var mutationIndex = 0; mutationIndex < moves.length; mutationIndex++) {
    var originalMove = moves[mutationIndex];
    var finalType = map[originalMove.targetRow][originalMove.column];
    if (!originalMove.spawned && originalMove.type !== finalType && !mutation) {
      mutation = {
        targetRow: originalMove.targetRow,
        targetColumn: originalMove.column,
        fromType: originalMove.type,
        toType: finalType,
      };
    }
  }

  for (var m = 0; m < moves.length; m++) {
    moves[m].type = map[moves[m].targetRow][moves[m].column];
  }

  return {
    sx: sx,
    sy: sy,
    bx: bx,
    by: by,
    gap: gap,
    moves: moves,
    spawned: spawned,
    guaranteedMatch: solution,
    solution: {
      x1: solution.x1,
      y1: solution.y1,
      x2: solution.x2,
      y2: solution.y2,
      type: solution.type,
      strategy: solutionStrategy,
      spawnedCornerCount: spawnedCornerCount(solution),
    },
    strategy: solutionStrategy,
    naturalAttempts: naturalAttempts,
    mutation: mutation,
  };
}

function showScorePop(y1, x1, y2, x2, pts, secBonus, combo) {
  var sx = x1,
    sy = y1,
    bx = x2,
    by = y2;
  if (x2 < x1) (sx = x2), (bx = x1);
  if (y2 < y1) (sy = y2), (by = y1);
  // show pop +delta above the cleared rectangle (or below if would overflow)
  try {
    var firstEl = document.getElementById("square" + (sy * column + sx));
    var lastEl = document.getElementById("square" + (by * column + bx));
    var pop = document.getElementById("scorePop");
    if (!pop) {
      pop = document.createElement("div");
      pop.id = "scorePop";
      pop.className = "score-pop";
      document.body.appendChild(pop);
    }
    // show both pts and sec bonus if available (each on its own line)
    var ptsLabel =
      I18N && I18N.ptsBonusLabel
        ? I18N.ptsBonusLabel
        : typeof step1PtsLabel !== "undefined"
        ? step1PtsLabel
        : "+{pts} pts";
    var secLabel =
      I18N && I18N.secBonusLabel
        ? I18N.secBonusLabel
        : typeof step1SecLabel !== "undefined"
        ? step1SecLabel
        : "+{sec} sec";
    var ptsText =
      typeof pts === "number" && pts > 0
        ? ptsLabel.replace("{pts}", pts)
        : "";
    var secText =
      typeof secBonus === "number" && secBonus > 0
        ? secLabel.replace("{sec}", secBonus)
        : "";
    var comboText =
      typeof combo === "number" && combo >= 2
        ? (I18N && I18N.comboLabel ? I18N.comboLabel : "COMBO x{n}").replace(
            "{n}",
            combo
          )
        : "";
    if (ptsText || secText || comboText) {
      var html = "";
      if (ptsText)
        html += "<div class='score-pop-line score-pop-points'>" + ptsText + "</div>";
      if (secText)
        html += "<div class='score-pop-line score-pop-time'>" + secText + "</div>";
      if (comboText)
        html += "<div class='score-pop-line score-pop-combo'>" + comboText + "</div>";
      pop.innerHTML = html;
    } else {
      pop.innerText =
        "+" + (Math.abs(lastx - sx) + 1) * (Math.abs(lasty - sy) + 1);
    }
    // compute placement
    if (firstEl && lastEl) {
      var r1 = firstEl.getBoundingClientRect();
      var r2 = lastEl.getBoundingClientRect();
      var left = Math.max(0, (r1.left + r2.right) / 2);
      var topAbove = r1.top - 10; // margin
      var popH = 60; // approx, CSS handles exact
      var placeAbove = topAbove - popH > 0;
      if (placeAbove) {
        pop.style.left = left + "px";
        pop.style.top = r1.top - 50 + "px";
      } else {
        pop.style.left = left + "px";
        pop.style.top = r2.bottom + 8 + "px";
      }
    } else {
      pop.style.left = "50%";
      pop.style.top = "12%";
    }
    var scoreTarget = document.querySelector("#dashboard .score .hud-value");
    var timeTarget = document.querySelector("#dashboard .time .hud-value");
    if (scoreTarget) {
      var scoreRect = scoreTarget.getBoundingClientRect();
      pop.style.setProperty("--score-flight-x", scoreRect.left + scoreRect.width / 2 - parseFloat(pop.style.left || 0) + "px");
      pop.style.setProperty("--score-flight-y", scoreRect.top + scoreRect.height / 2 - parseFloat(pop.style.top || 0) + "px");
    }
    if (timeTarget) {
      var timeRect = timeTarget.getBoundingClientRect();
      pop.style.setProperty("--time-flight-x", timeRect.left + timeRect.width / 2 - parseFloat(pop.style.left || 0) + "px");
      pop.style.setProperty("--time-flight-y", timeRect.top + timeRect.height / 2 - parseFloat(pop.style.top || 0) + "px");
    }
    pop.classList.remove("animate");
    void pop.offsetWidth;
    pop.classList.add("animate");
    setTimeout(function () {
      try {
        updateDashboard();
        pulseDashboardReward(pts, secBonus);
      } catch (e) { console.error("[square-tools] caught error", e); }
    }, 540);
  } catch (e) { console.error("[square-tools] caught error", e); }
}

function showMatchPreview(y1, x1, y2, x2, clickedRow, clickedColumn) {
  var sx = Math.min(x1, x2);
  var bx = Math.max(x1, x2);
  var sy = Math.min(y1, y2);
  var by = Math.max(y1, y2);
  var step = squareside + squaremargin;
  var viewport = document.getElementById("viewport");
  if (!viewport) return null;
  var overlay = document.createElement("div");
  overlay.className = "match-preview-box";
  overlay.setAttribute("aria-hidden", "true");
  overlay.style.left = squareleft + sx * step + "px";
  overlay.style.top = squaretop + sy * step + "px";
  overlay.style.width = (bx - sx) * step + squareside + "px";
  overlay.style.height = (by - sy) * step + squareside + "px";
  var originX = clickedColumn === bx ? "100%" : "0%";
  var originY = clickedRow === by ? "100%" : "0%";
  overlay.style.transformOrigin = originX + " " + originY;
  viewport.appendChild(overlay);
  var cornerIds = [
    sy * column + sx,
    sy * column + bx,
    by * column + sx,
    by * column + bx,
  ];
  for (var i = 0; i < cornerIds.length; i++) {
    var element = document.getElementById("square" + cornerIds[i]);
    if (element) element.classList.add("match-preview-corner");
  }
  return { overlay: overlay, cornerIds: cornerIds };
}

function removeMatchPreview(preview) {
  if (!preview) return;
  if (preview.overlay && preview.overlay.parentNode) {
    preview.overlay.parentNode.removeChild(preview.overlay);
  }
  for (var i = 0; i < preview.cornerIds.length; i++) {
    var element = document.getElementById("square" + preview.cornerIds[i]);
    if (element) element.classList.remove("match-preview-corner");
  }
}

function playMutation(mutation, reducedMotion, done) {
  if (!mutation) {
    done();
    return;
  }
  var id = "square" + (mutation.targetRow * column + mutation.targetColumn);
  var element = document.getElementById(id);
  var gob = G.O[id];
  if (!element || !gob) {
    done();
    return;
  }
  var totalMs = reducedMotion
    ? 140
    : (typeof mutationDurationMs !== "undefined" ? mutationDurationMs : 620);
  var swapMs = reducedMotion ? 45 : Math.round(totalMs * 0.48);
  element.classList.remove("tile-mutating", "tile-mutated-ready");
  element.setAttribute("data-mutation-from", mutation.fromType);
  element.setAttribute("data-mutation-to", mutation.toType);
  void element.offsetWidth;
  element.classList.add("tile-mutating");
  setTimeout(function () {
    setSquareTypeClass(element, mutation.toType, gob);
    element = document.getElementById(id) || element;
    if (element) element.classList.add("tile-mutation-swapped");
  }, swapMs);
  setTimeout(function () {
    element = document.getElementById(id) || element;
    if (element) {
      element.classList.remove("tile-mutating", "tile-mutation-swapped");
      element.classList.add("tile-mutated-ready");
      element.removeAttribute("data-mutation-from");
      element.removeAttribute("data-mutation-to");
    }
    lastHintTick = typeof gameTick !== "undefined" ? gameTick : lastHintTick;
    done();
    setTimeout(function () {
      var current = document.getElementById(id);
      if (current) current.classList.remove("tile-mutated-ready");
    }, 1400);
  }, totalMs);
}

function animateGravityRefill(y1, x1, y2, x2, pts, secBonus, combo, clickedRow, clickedColumn) {
  if (boardTransitionActive) return;
  var sx = Math.min(x1, x2);
  var bx = Math.max(x1, x2);
  var sy = Math.min(y1, y2);
  var by = Math.max(y1, y2);
  var reducedMotion = false;
  try {
    reducedMotion = !!window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch (e) { console.error("[square-tools] caught error", e); }
  var clearMs = reducedMotion ? 45 : 100;
  var previewMs = reducedMotion
    ? 35
    : (typeof matchPreviewDurationMs !== "undefined"
        ? matchPreviewDurationMs
        : 150);
  var fallMs =
    reducedMotion
      ? 70
      : getGravityFallDurationMs(completedGravityClears);
  var settleMs = reducedMotion ? 10 : 24;
  var previousState = gamestate;
  boardTransitionActive = true;
  gamestate = "animating";
  pauseStageAdvanceForBoardTransition();
  lastx = -100;
  lasty = -100;
  var preview = showMatchPreview(y1, x1, y2, x2, clickedRow, clickedColumn);

  setTimeout(function () {
    removeMatchPreview(preview);
    for (var y = sy; y <= by; y++) {
      for (var x = sx; x <= bx; x++) {
        var clearEl = document.getElementById("square" + (y * column + x));
        if (clearEl) {
          clearEl.classList.remove("picked");
          clearEl.classList.add("tile-clearing");
        }
      }
    }
    if (combo >= 3) {
      var viewport = document.getElementById("viewport");
      if (viewport) {
        viewport.classList.remove("combo-impact");
        void viewport.offsetWidth;
        viewport.classList.add("combo-impact");
      }
    }

    setTimeout(function () {
    var plan = buildGravityRefillPlan(y1, x1, y2, x2);
    if (enable() === 0) {
      console.error("[square-tools] gravity refill produced no valid move");
    }
    var step = squareside + squaremargin;
    for (var i = 0; i < plan.moves.length; i++) {
      var move = plan.moves[i];
      var element = document.getElementById(
        "square" + (move.targetRow * column + move.column)
      );
      var gob = G.O["square" + (move.targetRow * column + move.column)];
      if (!element || !gob) continue;
      var displayType = move.type;
      if (
        plan.mutation &&
        plan.mutation.targetRow === move.targetRow &&
        plan.mutation.targetColumn === move.column
      ) displayType = plan.mutation.fromType;
      setSquareTypeClass(element, displayType, gob);
      element.classList.remove("tile-clearing", "tile-dropping");
      element.classList.add("tile-drop-ready");
      element.style.transitionDuration = fallMs + "ms";
      element.style.transform = reducedMotion
        ? "translate3d(0,0,0)"
        : "translate3d(0," + (move.sourceRow - move.targetRow) * step + "px,0)";
      element.style.opacity = move.spawned ? "0" : "0.72";
    }
    showScorePop(y1, x1, y2, x2, pts, secBonus, combo);

    // Apply the transition on the next frame after all starting offsets are laid out.
    var board = document.getElementById("viewport");
    if (board) void board.offsetWidth;
    setTimeout(function () {
      for (var i = 0; i < plan.moves.length; i++) {
        var move = plan.moves[i];
        var element = document.getElementById(
          "square" + (move.targetRow * column + move.column)
        );
        if (!element) continue;
        element.classList.remove("tile-drop-ready");
        element.classList.add("tile-dropping");
        element.style.transform = "translate3d(0,0,0)";
        element.style.opacity = "1";
      }
    }, 16);

    var fallFinished = false;
    function unlockTransition() {
      if (!boardTransitionActive) return;
      boardTransitionActive = false;
      gamestate = previousState === "on" ? "on" : previousState;
      resumeStageAdvanceAfterBoardTransition();
      try { updateDashboard(); } catch (e) { console.error("[square-tools] caught error", e); }
    }

    function finishTransition() {
      if (!boardTransitionActive || fallFinished) return;
      fallFinished = true;
      completedGravityClears += 1;
      if (boardTransitionFallbackId) {
        clearTimeout(boardTransitionFallbackId);
        boardTransitionFallbackId = null;
      }
      for (var i = 0; i < plan.moves.length; i++) {
        var move = plan.moves[i];
        var element = document.getElementById(
          "square" + (move.targetRow * column + move.column)
        );
        if (!element) continue;
        element.classList.remove("tile-drop-ready", "tile-dropping", "tile-clearing");
        element.style.transform = "";
        element.style.opacity = "";
        element.style.transitionDuration = "";
      }
      playMutation(plan.mutation, reducedMotion, unlockTransition);
    }

    boardTransitionFallbackId = setTimeout(
      finishTransition,
      16 + fallMs + settleMs + 80
    );
    setTimeout(finishTransition, 16 + fallMs + settleMs);
    }, clearMs);
  }, previewMs);
}

function squareHandler(square) {
  var id = square.id.substring(square.id.indexOf("e") + 1);
  var columnIndex = id % column,
    rowIndex = Math.floor(id / column);
  var match = selectLargestMatch(
    findMatchesFromCorner(rowIndex, columnIndex, map)
  );
  if (!match) {
    showInvalidTap(square.id);
    return;
  }

  suppressTileTooltipsAfterTap();
  square.removeClass("hint").removeClass("hint-tap-first").draw();
  lastx = -100;
  lasty = -100;
  registerClearForFirepower();
  var width = match.x2 - match.x1 + 1;
  var height = match.y2 - match.y1 + 1;
  var basePts = Math.max(0, (width - 1) * (height - 1));
  var pts = basePts * (isFirepowerActive() ? 2 : 1);
  score += pts;

  var nowTick = typeof gameTick !== "undefined" ? gameTick : 0;
  var elapsedTicks = nowTick - (lastClearTick || 0);
  var elapsedSec = Math.floor(elapsedTicks / 25);
  var secBonus = 0;
  if (stageIndex === 2) {
    secBonus = Math.max(0, Math.min(5, 5 - elapsedSec));
    timer += secBonus * 25;
  }

  var prevLastClear = lastClearTick;
  var sinceLastClearSec = elapsedTicks / 25;
  if (comboStreak > 0 && sinceLastClearSec <= (comboWindowSec || 4.5)) {
    comboStreak += 1;
  } else {
    comboStreak = 1;
  }
  lastClearTick = nowTick;
  lastHintTick = nowTick;

  try {
    if (typeof debugMode !== "undefined" && debugMode) {
      console.log("[TESTLOG] one-tap clear", {
        clicked: { row: rowIndex, column: columnIndex },
        match: match,
        pts: pts,
        secBonus: secBonus,
        prevLastClear: prevLastClear,
        gameTick: nowTick,
        comboStreak: comboStreak,
      });
    }
  } catch (e) { console.error("[square-tools] caught error", e); }

  triggerClearFeedback(comboStreak);
  var step = squareside + squaremargin;
  var px1 = squareleft + match.x1 * step;
  var py1 = squaretop + match.y1 * step;
  var px2 = squareleft + match.x2 * step;
  var py2 = squaretop + match.y2 * step;
  G.O.explosion
    .setVar({ x: px1, y: py1, w: px2 - px1 + 25, h: py2 - py1 + 25 })
    .AI("reset")
    .turnOn();
  if (level > 1 && score > (maxLevel - level + 1) * 100) level -= 1;
  animateGravityRefill(
    match.y1,
    match.x1,
    match.y2,
    match.x2,
    pts,
    secBonus,
    comboStreak,
    rowIndex,
    columnIndex
  );
}

function resetGame() {
  try {
    stopStageCycle();
  } catch (e) { console.error("[square-tools] caught error", e); }
  $("#viewport").remove();
  // If this is the first run (startFlag true), keep the game paused until the user presses Start
  timer = gametimer;
  score = 0;
  comboStreak = 0;
  completedGravityClears = 0;
  firepowerUntilTick = 0;
  firepowerFuseUntilTick = 0;
  firepowerFuseDurationTicks = 0;
  invalidTapLockedUntil = 0;
  // Reset game-time baselines so hints start after the configured gameplay gap.
  try {
    if (typeof gameTick !== "undefined") gameTick = 0;
  } catch (e) { console.error("[square-tools] caught error", e); }
  lastClearTick = 0;
  lastHintTick = 0;
  // reset gameStarted flag; actual timers start only when gameplay officially begins
  gameStarted = false;
  if (startFlag) {
    gamestate = "pause";
  } else {
    gamestate = "on";
  }
  // allow viewport clicks to start a new game again
  isTouched = false;
  boardTransitionActive = false;
  if (boardTransitionFallbackId) {
    clearTimeout(boardTransitionFallbackId);
    boardTransitionFallbackId = null;
  }
  lastx = -100;
  lasty = -100;
  board = document.getElementById("gameboard");
  G.makeGob("viewport", G, "div", board)
    .setVar({
      w: viewportwidth,
      h: viewportheight,
      nextStyle: { position: "relative" },
    })
    .turnOn();
  bindTap("#viewport", {
    onTouch: function () {
      viewportTouchTs = Date.now();
    },
    onTap: function (e, source) {
      if (source === "click" && Date.now() - viewportTouchTs < 350) return;
      if (Date.now() < tutorialClickSuppressUntil) return;
      if (Date.now() - tutorialTouchTs < 350) return;
      if (eventHitsTutorial(e)) {
        tutorialTouchTs = Date.now();
        triggerTutorialControl();
        return;
      }
      if (gamestate == "off") {
        if (!isTouched) resetGame();
        return;
      }
      isTouched = true;
    },
  });
  var i, j;
  initMap();
  while (enable() < level - 1) {
    initMap();
  }
  var bigside = squareside + squaremargin;
  var tutorialboardWidth = column * bigside - squaremargin;
  var tutorialboardHeight = row * bigside - squaremargin;
  G.makeGob("tutorialboard", G.O.viewport)
    .setVar({
      x: squareleft,
      y: squaretop,
      w: tutorialboardWidth,
      h: tutorialboardHeight,
    })
    .addClass("tutorialboardOff")
    .turnOn();

  var boardWidth = column * bigside - squaremargin;
  var controlWidth = Math.min(58, Math.max(54, Math.round(boardWidth * 0.21)));
  // create tutorial and dashboard before resumeGame so resumeGame can access dashboard gob
  G.makeGob("tutorial", G.O.viewport)
    .setVar({
      x: squareleft,
      y: squaretop + row * bigside,
      w: controlWidth,
      h: helpheight,
    })
    .setSrc(
      "<p class='tutorial'><span class='control-text'>" +
        (startFlag && I18N && I18N.startControl
          ? I18N.startControl
          : "Start") +
        "</span></p>"
    )
    .addClass("help")
    .turnOn();
  bindTap("#tutorial", {
    onTouch: function () {
      tutorialTouchTs = Date.now();
    },
    onTap: function (e, source) {
      stopEventBubble(e);
      if (Date.now() < tutorialClickSuppressUntil) return;
      if (source === "click" && Date.now() - tutorialTouchTs < 350) return;
      tutorialTouchTs = Date.now();
      triggerTutorialControl();
    },
  });

  G.makeGob("dashboard", G.O.viewport)
    .setVar({
      x: squareleft + controlWidth + 4,
      y: squaretop + row * bigside,
      w: boardWidth - controlWidth - 4,
      h: helpheight,
    })
    .addClass("help")
    .turnOn();

  try {
    bindResponsiveLayout();
    applyResponsiveLayout();
  } catch (e) { console.error("[square-tools] caught error", e); }

  // Only actually draw the board and start timers if this is not the first-run tutorial.
  if (!startFlag) {
    resumeGame();
    // initialize phase cycle
    stageIndex = 2; // when starting gameplay, enter stage 2
    // initialize lastClearTick to current gameTick (gameTick may be zero at start)
    lastClearTick = typeof gameTick !== "undefined" ? gameTick : 0;
    lastHintTick = lastClearTick;
    try {
      if (typeof debugMode !== "undefined" && debugMode)
        console.log(
          "[TESTLOG] resetGame: init lastClearTick=",
          lastClearTick,
          " gameTick=",
          typeof gameTick !== "undefined" ? gameTick : 0
        );
    } catch (e) { console.error("[square-tools] caught error", e); }
    try {
      startStageCycle();
    } catch (e) { console.error("[square-tools] caught error", e); }
    gameStarted = true;
  } else {
    // for first run we still initialize lastClearTick but do not start timers
    stageIndex = 1;
    lastClearTick = typeof gameTick !== "undefined" ? gameTick : 0;
    lastHintTick = lastClearTick;
  }

  G.makeGob("explosion", G.O.viewport)
    .setState({ frame: 0 })
    .setVar({ x: -100, y: -100, w: 4, h: 12, AI: G.F.explosionAI })
    .setStyle({ border: "3px solid red" })
    .turnOn();
}

// Phase control: start/stop cycle and handlers
function startStageCycle() {
  // clear any existing timers (only if timerSafeguards enabled)
  try {
    if (typeof timerSafeguards === "undefined" || timerSafeguards) {
      if (stageTimerId) {
        clearTimeout(stageTimerId);
        stageTimerId = null;
      }
      if (stageHintTimerId) {
        clearInterval(stageHintTimerId);
        stageHintTimerId = null;
      }
    }
  } catch (e) { console.error("[square-tools] caught error", e); }
  // Only the bonus phase advances. Stage 3 continues until the game timer ends.
  if (stageIndex === 2) {
    try {
      // ensure no duplicate timer exists when configured
      try {
        if (typeof timerSafeguards === "undefined" || timerSafeguards) {
          if (stageTimerId) {
            clearTimeout(stageTimerId);
            stageTimerId = null;
          }
        }
      } catch (e) { console.error("[square-tools] caught error", e); }
      scheduleStageAdvance((phaseDurationSec || 20) * 1000);
    } catch (e) { console.error("[square-tools] caught error", e); }
  }
  // Hints remain available in both gameplay phases and repeat every six
  // clear-free gameplay seconds. Pointer movement and invalid taps do not reset it.
  if (stageIndex === 2 || stageIndex === 3) {
    try {
      stageHintTimerId = setInterval(function () {
        try {
          maybeShowIdleHint();
        } catch (e) { console.error("[square-tools] caught error", e); }
      }, 250);
    } catch (e) { console.error("[square-tools] caught error", e); }
  }
}

function advanceStage() {
  if (advanceLocked) return;
  advanceLocked = true;
  try {
    // ensure any legacy stage timer is cleared so we don't get immediate duplicate advances
    try {
      if (stageTimerId) {
        clearTimeout(stageTimerId);
        stageTimerId = null;
      }
    } catch (e) { console.error("[square-tools] caught error", e); }
    // Move once from the bonus phase into the final ruleset.
    stageIndex = Math.min(3, (stageIndex || 1) + 1);
    // restart stage cycle behaviors
    try {
      if (stageHintTimerId) {
        clearInterval(stageHintTimerId);
        stageHintTimerId = null;
      }
    } catch (e) { console.error("[square-tools] caught error", e); }
    if (typeof debugMode !== "undefined" && debugMode)
      try {
        console.log("advanceStage -> new stageIndex=", stageIndex);
    } catch (e) { console.error("[square-tools] caught error", e); }
    try {
      startStageCycle();
    } catch (e) {
      console.log("advanceStage startStageCycle error", e);
    }
  } catch (e) {
    console.log("advanceStage error", e);
  } finally {
    advanceLocked = false;
  }
}

function stopStageCycle() {
  try {
    if (stageTimerId) {
      clearTimeout(stageTimerId);
      stageTimerId = null;
    }
  } catch (e) { console.error("[square-tools] caught error", e); }
  try {
    if (stageHintTimerId) {
      clearInterval(stageHintTimerId);
      stageHintTimerId = null;
    }
  } catch (e) { console.error("[square-tools] caught error", e); }
  stageTimerDueAt = 0;
  stageTimerRemainingMs = 0;
}

function buildPauseCastHTML() {
  var entries = I18N && I18N.pauseCastEntries ? I18N.pauseCastEntries : [];
  var html = '<div class="pause-cast-grid">';
  for (var i = 0; i < entries.length; i++) {
    var entry = entries[i];
    html +=
      '<div class="pause-cast-card">' +
      '<div class="pause-cast-avatar square' + entry.type + '" aria-hidden="true"></div>' +
      '<div class="pause-cast-copy">' +
      '<strong class="pause-cast-name">' + entry.name + '</strong>' +
      '<span class="pause-cast-blurb">' + entry.blurb + '</span>' +
      '</div></div>';
  }
  return html + "</div>";
}

function popTutorial() {
  if (boardTransitionActive) return;
  gamestate = "pause";
  // Cancel the persistent selection when leaving active gameplay.
  try {
    var pickedSquare = G.O["square" + (lasty * column + lastx)];
    if (pickedSquare) pickedSquare.removeClass("picked").draw();
  } catch (e) { console.error("[square-tools] caught error", e); }
  lastx = -100;
  lasty = -100;
  clearSquares(0, 0, row, column);
  var bigside = squareside + squaremargin;
  G.O.tutorialboard.swapClass("tutorialboardOff", "tutorialboardOn").draw();
  var tipInfo = "";
  var wasFirst = startFlag == true;
  if (wasFirst) {
    // first-time tutorial: show the tutorial image + descriptive text
    var imgHtml = "";
    try {
      imgHtml = "<div class='tutorial-film'>" + buildTutorialPreviewHTML() + "</div>";
    } catch (e) {
      imgHtml = "";
    }
    tipInfo =
      imgHtml +
      "<p class='tutorial tutorial-first'>" +
      (getStageIntroText(1) || (I18N && I18N.tutorialStart ? I18N.tutorialStart : "start")) +
      "</p>" +
      "<p class='tutorial-hint'>" +
      (getStageHintText(1) || "") +
      "</p>";
    // mark that we've shown the first-run tutorial
    startFlag = false;
  } else {
    tipInfo = buildPauseCastHTML();
  }
  // show tipInfo on the large tutorial board
  var titleText = wasFirst
    ? (I18N && I18N.stageTitle ? I18N.stageTitle : "Stage Info")
    : (I18N && I18N.pauseCastTitle ? I18N.pauseCastTitle : "Cast Notes");
  try {
    var stageCopyClass = wasFirst
      ? "stage-copy stage-copy-first"
      : "stage-copy stage-copy-cast";
    G.O.tutorialboard
      .setSrc("<div class='" + stageCopyClass + "'><h3>" + titleText + "</h3>" + tipInfo + "</div>")
      .draw();
  } catch (e) { console.error("[square-tools] caught error", e); }
  updateStageControl();
}

function resumeGame() {
  if (gamestate == "pause") {
    gamestate = "on";
    G.O.tutorialboard
      .setSrc("")
      .swapClass("tutorialboardOn", "tutorialboardOff")
      .draw();
    updateStageControl();
  }
  // if game was not started yet (first-run), start timers and phase cycle now
  if (!gameStarted) {
    try {
      /* normalize to stage flow */ stageIndex = 2;
    } catch (e) { console.error("[square-tools] caught error", e); }
    try {
      lastClearTick = typeof gameTick !== "undefined" ? gameTick : 0;
      lastHintTick = lastClearTick;
    } catch (e) { console.error("[square-tools] caught error", e); }
    try {
      startStageCycle();
    } catch (e) { console.error("[square-tools] caught error", e); }
    gameStarted = true;
  }
  try {
    if ((stageIndex === 2 || stageIndex === 3) && !stageTimerId) {
      try {
        startStageCycle();
      } catch (e) { console.error("[square-tools] caught error", e); }
    }
  } catch (e) { console.error("[square-tools] caught error", e); }
  var bigside = squareside + squaremargin;
  for (i = 0; i < row; i++) {
    for (j = 0; j < column; j++) {
      G.makeGob("square" + (i * column + j), G.O.viewport)
        .setVar({
          x: squareleft + j * bigside,
          y: squaretop + i * bigside,
          h: squareside,
          w: squareside,
        })
        .addClass("square" + map[i][j])
        .turnOn();
      var squareElement = document.getElementById("square" + (i * column + j));
      if (squareElement) {
        squareElement.setAttribute("data-row", i);
        squareElement.setAttribute("data-column", j);
        setSquareTileLabel(squareElement, map[i][j]);
      }
      bindTap("#square" + (i * column + j), {
        onTouch: function () {
          squareTouchTs = Date.now();
        },
        onTap: function (e, source) {
          if (source === "click" && Date.now() - squareTouchTs < 350) return;
          squareTouchTs = Date.now();
          handleSquareInputById($(this).attr("id"), e);
        },
      });
    }

    // update dashboard using centralized updater
    updateDashboard();
  }
}

function buildTutorialPreviewHTML() {
  // Three one-tap examples mirror the real sequence: preview the largest
  // matching-corner rectangle, clear its full area, then refill from above.
  var scenes = [
    {
      pattern: [
        2, 1, 2, 0, 4,
        2, 3, 2, 4, 1,
        0, 4, 1, 3, 0,
      ],
      x1: 0, y1: 0, x2: 2, y2: 1, tapX: 0, tapY: 0,
    },
    {
      pattern: [
        3, 0, 2, 4, 0,
        1, 3, 4, 2, 1,
        2, 0, 1, 3, 0,
      ],
      x1: 1, y1: 0, x2: 4, y2: 2, tapX: 4, tapY: 2,
    },
    {
      pattern: [
        0, 2, 4, 1, 0,
        3, 1, 2, 4, 3,
        3, 0, 4, 2, 3,
      ],
      x1: 0, y1: 1, x2: 4, y2: 2, tapX: 4, tapY: 1,
    },
  ];
  var caption =
    I18N && I18N.tutorialDemoCaption
      ? I18N.tutorialDemoCaption
      : "Tap one valid corner to clear its largest rectangle";
  var alt = I18N && I18N.tutorialImageAlt ? I18N.tutorialImageAlt : "Tutorial";
  var html =
    '<div class="tutorial-demo"><div class="tutorial-preview-stage" role="img" aria-label="' +
    alt +
    '">';
  for (var s = 0; s < scenes.length; s++) {
    var scene = scenes[s];
    html += '<div class="tutorial-preview tutorial-scene tutorial-scene-' + (s + 1) + '">';
    for (var i = 0; i < scene.pattern.length; i++) {
      var tileX = i % 5;
      var tileY = Math.floor(i / 5);
      var clears =
        tileX >= scene.x1 && tileX <= scene.x2 &&
        tileY >= scene.y1 && tileY <= scene.y2;
      html +=
        '<div class="tutorial-tile square' + scene.pattern[i] +
        (clears ? ' tutorial-cleared' : '') + '"></div>';
    }
    var boxLeft = 8 + scene.x1 * 40;
    var boxTop = 8 + scene.y1 * 40;
    var boxWidth = (scene.x2 - scene.x1) * 40 + 36;
    var boxHeight = (scene.y2 - scene.y1) * 40 + 36;
    var tapLeft = 8 + scene.tapX * 40 + 18;
    var tapTop = 8 + scene.tapY * 40 + 18;
    html +=
      '<div class="tutorial-match-box" style="left:' + boxLeft + 'px;top:' + boxTop +
      'px;width:' + boxWidth + 'px;height:' + boxHeight + 'px"></div>' +
      '<div class="tutorial-click" style="left:' + tapLeft + 'px;top:' + tapTop + 'px">' +
      '<span class="tutorial-click-ripple"></span><span class="tutorial-finger">☝</span></div>' +
      '<span class="tutorial-scene-count">' + (s + 1) + '/3</span></div>';
  }
  html +=
    '</div><p class="tutorial-demo-caption">' + caption + "</p></div>";
  return html;
}
