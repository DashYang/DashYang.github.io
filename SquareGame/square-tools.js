function getSquareType() {
  return Math.floor(Math.random() * 6);
}

// Stage control variables
// stageIndex: 1 = Tutorial, 2 = Stage2 (hints & time bonus), 3 = Stage3 (no hints/time bonus),
// 4 = Stage4 (auto-refresh single-solution until main timer ends)
var stageIndex = 1;
var stageTimerId = null;
var stageHintTimerId = null;
var stage4RefreshTimerId = null;
var stage4RefreshTimeoutId = null;
// prevent re-entrant advanceStage calls
var advanceLocked = false;
// track last clear in game ticks (not physical time)
var lastClearTick = 0;
// track last user selection in game ticks (used for stage2 auto-hint gating)
var lastSelectionTick = 0;
// whether current stage gameplay is actively running (not paused / intro)
var stageRunning = false;
// prevent map-regeneration / auto-refresh from interfering while user has a selection
var selectionPending = false;
var selectionTimeoutId = null;
var selectionTimeoutMs = 2000; // ms before auto-clearing selection state
// whether the actual gameplay timers/cycles have been started
var gameStarted = false;
// stage 4 refresh countdown (ms timestamp)
var stage4NextRefreshAt = 0;
var stage4RemainingMs = 0;
var stage4Paused = false;
// suppress stale tutorial clicks for a short window (ms timestamp)
var tutorialClickSuppressUntil = 0;
var responsiveLayoutBound = false;
var tutorialTouchTs = 0;
var squareTouchTs = 0;
var viewportTouchTs = 0;

function triggerTutorialControl() {
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

function handleSquareInputById(id, e) {
  try {
    if (e && e.stopPropagation) e.stopPropagation();
  } catch (err) { console.error("[square-tools] caught error", err); }
  try {
    // Keep gameplay interaction consistent across mouse/touch and
    // disallow board interaction when paused/off.
    if (gamestate !== "on") return;
    isTouched = true;
    var square = G.O[id];
    if (!square) return;
    squareHandler(square);
  } catch (e) { console.error("[square-tools] caught error", e); }
}

function supportsPointerUp() {
  try {
    return typeof window !== "undefined" && !!window.PointerEvent;
  } catch (e) {
    console.error("[square-tools] caught error", e);
    return false;
  }
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
    var ww = window.innerWidth || document.documentElement.clientWidth || viewportwidth;
    var wh = window.innerHeight || document.documentElement.clientHeight || viewportheight;
    var padding = 8;
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
  } catch (e) { console.error("[square-tools] caught error", e); }
}

function clearStage4RefreshTimer() {
  try {
    if (stage4RefreshTimeoutId) {
      clearTimeout(stage4RefreshTimeoutId);
      stage4RefreshTimeoutId = null;
    }
  } catch (e) { console.error("[square-tools] caught error", e); }
  try {
    if (stage4RefreshTimerId) {
      clearInterval(stage4RefreshTimerId);
      stage4RefreshTimerId = null;
    }
  } catch (e) { console.error("[square-tools] caught error", e); }
}

function scheduleStage4Refresh(delayMs) {
  clearStage4RefreshTimer();
  stage4Paused = false;
  stage4RemainingMs = Math.max(0, delayMs || 0);
  stage4NextRefreshAt = Date.now() + stage4RemainingMs;
  stage4RefreshTimeoutId = setTimeout(function () {
    try {
      if (gamestate !== "on") return;
      if (selectionPending) {
        pauseStage4Refresh();
        return;
      }
      var attempts = 0;
      do {
        initMap();
        attempts++;
      } while (enable() !== 1 && attempts < 30);
      refreshScreen();
    } catch (e) { console.error("[square-tools] caught error", e); }
    // schedule next full interval
    scheduleStage4Refresh((phase3RefreshIntervalSec || 3) * 1000);
  }, stage4RemainingMs);
}

function pauseStage4Refresh() {
  if (stage4Paused) return;
  if (!stage4NextRefreshAt) return;
  stage4RemainingMs = Math.max(0, stage4NextRefreshAt - Date.now());
  stage4Paused = true;
  clearStage4RefreshTimer();
}

function resumeStage4Refresh() {
  if (!stage4Paused) return;
  scheduleStage4Refresh(stage4RemainingMs);
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

function refreshScreen() {
  for (var i = 0; i < row; i++)
    for (var j = 0; j < column; j++) {
      var square = G.O["square" + (i * column + j)];
      if (!square) {
        try {
          if (typeof debugMode !== "undefined" && debugMode)
            console.log("refreshScreen: missing square", i, j);
        } catch (e) { console.error("[square-tools] caught error", e); }
        continue;
      }
      try {
        square.swapClass(square.tag.className, "square" + map[i][j]).draw();
      } catch (e) { console.error("[square-tools] caught error", e); }
    }
}

// -----------------------------
// Leaderboard (localStorage)
// -----------------------------
function saveScore(scoreValue) {
  try {
    var key = "squaregame_leaderboard";
    var list = JSON.parse(localStorage.getItem(key) || "[]");
    list.push({ score: scoreValue, t: new Date().toISOString() });
    // sort desc and keep top leaderboardSize
    list.sort(function (a, b) {
      return b.score - a.score;
    });
    list = list.slice(0, leaderboardSize);
    localStorage.setItem(key, JSON.stringify(list));
  } catch (e) {
    console.log("saveScore error", e);
  }
}

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
  if (stage === 4) return I18N && I18N.stage4Intro ? I18N.stage4Intro : "";
  return "";
}

function getStageHintText(stage) {
  if (stage === 1) return I18N && I18N.stage1Hint ? I18N.stage1Hint : "";
  if (stage === 2) return I18N && I18N.stage2Hint ? I18N.stage2Hint : "";
  if (stage === 3) return I18N && I18N.stage3Hint ? I18N.stage3Hint : "";
  if (stage === 4) return I18N && I18N.stage4Hint ? I18N.stage4Hint : "";
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
  // Do not let inactivity timers run during the rank flash window.
  try {
    clearInactivityTimer();
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
    if (!gameStarted && stageIndex === 1) {
      label = I18N && I18N.startControl ? I18N.startControl : "Start";
    } else if (stageIndex === 4) {
      if (gamestate === "on") {
        var leftMs = stage4Paused
          ? Math.max(0, stage4RemainingMs || 0)
          : Math.max(0, (stage4NextRefreshAt || 0) - Date.now());
        var leftSec = Math.ceil(leftMs / 1000);
        var refreshLabel = I18N && I18N.refreshLabel ? I18N.refreshLabel : "Refresh";
        label = "<span class='control-text control-refresh'>" + refreshLabel + ":" + leftSec + "s</span>";
      } else {
        label = "<span class='control-text'>" + getResumeLabel() + "</span>";
      }
    } else if (gamestate === "pause") {
      label = "<span class='control-text'>" + getResumeLabel() + "</span>";
    } else {
      label = "<span class='control-text'>" + (I18N && I18N.stopControl ? I18N.stopControl : "Stop") + "</span>";
    }
    G.O.tutorial.setSrc("<p class='tutorial'>" + label + "</p>").draw();
  } catch (e) { console.error("[square-tools] caught error", e); }
}

// show end-of-game screen: if score qualifies for leaderboard allow name entry,
// otherwise show read-only score with only a Skip button.
function showEndScreen(scoreValue) {
  try {
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

    // internal state for letter indices
    var vals = [0, 0, 0];
    function updateStrip(idx) {
      var l = document.getElementById("letter" + idx);
      if (!l) return;
      var strip = l.querySelector(".strip");
      if (strip)
        strip.style.transform = "translateY(" + -vals[idx] * 48 + "px)";
    }
    for (var i = 0; i < 3; i++) updateStrip(i);

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

function pulseHintIcons() {
  setTimeout(function () {
    var nodes = document.querySelectorAll("#hintArea .hint-icon");
    if (!nodes) return;
    for (var i = 0; i < nodes.length; i++) {
      (function (n) {
        n.classList.remove("pulse");
        void n.offsetWidth; // reflow
        n.classList.add("pulse");
      })(nodes[i]);
    }
  }, 10);
}

// Inactivity hint timer: after N ms of no user action, automatically show a dim hint
function clearInactivityTimer() {
  try {
    if (window._inactivityTimer) {
      clearTimeout(window._inactivityTimer);
      window._inactivityTimer = null;
    }
  } catch (e) { console.error("[square-tools] caught error", e); }
}

function startInactivityTimer() {
  clearInactivityTimer();
  try {
    // 5000ms = 5s
    window._inactivityTimer = setTimeout(function () {
      // only trigger when game is running and hints available and we're in stage 2
      if (gamestate !== "on") return;
      if (stageIndex !== 2) return;
      if ((window._hintRemaining || 0) <= 0) return;
      // ensure we have an available rectangle and ansx/ansy set
      if (enable() == 0) return;
      // use the same visual effect as manual showHint(): flash the four corner squares
      try {
        // Only show auto-hint if sufficient game-time has passed since last user selection
        try {
          var elapsedTicks =
            (typeof gameTick !== "undefined" ? gameTick : 0) -
            (lastSelectionTick || 0);
          var elapsedSec = Math.floor(elapsedTicks / 25);
          if (elapsedSec < (phase1HintIntervalSec || 5)) return;
        } catch (e) { console.error("[square-tools] caught error", e); }
        // set LOOK indicator and mark auto-hint active so UI shows LOOK during flash
        try {
          if (G.O && G.O.tutorial)
            G.O.tutorial
              .setSrc(
                "<p class='tutorial'>" +
                  (I18N && I18N.tutorialLook ? I18N.tutorialLook : "LOOK") +
                  "</p>"
              )
              .draw();
        } catch (e) { console.error("[square-tools] caught error", e); }
        window._autoHintActive = true;
        if (showHint()) {
          // consume one hint
          window._hintRemaining = Math.max(0, (window._hintRemaining || 0) - 1);
          try {
            updateDashboard();
          } catch (e) { console.error("[square-tools] caught error", e); }
          try {
            pulseHintIcons();
          } catch (e) { console.error("[square-tools] caught error", e); }
        }
        // after the flash duration, revert tutorial text and auto-hint flag
        setTimeout(function () {
          try {
            if (G.O && G.O.tutorial)
              G.O.tutorial
                .setSrc(
                  "<p class='tutorial'>" +
                    (I18N && I18N.tutorialHelp ? I18N.stopControl : "stop") +
                    "</p>"
                )
                .draw();
          } catch (e) { console.error("[square-tools] caught error", e); }
          window._autoHintActive = false;
        }, 1200);
      } catch (e) {
        console.log("auto-hint showHint error", e);
      }
      // restart timer for future inactivity
      startInactivityTimer();
    }, 5000);
  } catch (e) {
    console.log("startInactivityTimer error", e);
  }
}

function resetInactivityTimer() {
  clearInactivityTimer();
  startInactivityTimer();
}

// centralized dashboard updater
function updateDashboard() {
  try {
    // safety: if paused without overlay (unexpected), resume to avoid stuck state
    try {
      if (gamestate === "pause" && stageIndex !== 4) {
        var tb = document.getElementById("tutorialboard");
        var cls = tb && tb.className ? tb.className : "";
        var overlayOn = cls.indexOf("tutorialboardOn") >= 0;
        if (!overlayOn) gamestate = "on";
      }
    } catch (e) { console.error("[square-tools] caught error", e); }
    var dash = G.O["dashboard"];
    if (!dash) return;
    var timeText =
      "<p class='time'>" +
      (I18N && I18N.timeLabel ? I18N.timeLabel : "Time") +
      ":" +
      Math.max(0, Math.ceil(timer / 25)) +
      "</p>";
    var scoreText =
      "<p class='score'>" +
      (I18N && I18N.scoreLabel ? I18N.scoreLabel : "Score") +
      ":" +
      score +
      "</p>";
    var pointsLabel = I18N && I18N.pointsLabel ? I18N.pointsLabel + " " : "";
    var html =
      timeText +
      "<span class='score'>" +
      pointsLabel +
      score +
      "</span>";
    dash.setSrc(html).draw();
    updateStageControl();
    // no manual hint button - auto-hint only
  } catch (e) {
    console.log("updateDashboard error", e);
  }
}

// -----------------------------
// Hint feature
// -----------------------------
function showHint() {
  // ensure there is an answer
  if (enable() == 0) return false;
  // highlight the four corner squares briefly
  var ids = [];
  ids.push(ansy1 * column + ansx1);
  ids.push(ansy1 * column + ansx2);
  ids.push(ansy2 * column + ansx1);
  ids.push(ansy2 * column + ansx2);
  for (var k = 0; k < ids.length; k++) {
    var gob = G.O["square" + ids[k]];
    if (gob) gob.addClass("hint").draw();
  }
  // remove hint after 1.2s
  setTimeout(function () {
    for (var k = 0; k < ids.length; k++) {
      var gob = G.O["square" + ids[k]];
      if (gob) gob.removeClass("hint").draw();
    }
  }, 1200);
  return true;
}

function enable() {
  var x1, y1, x2, y2;
  var count = 0;
  for (y1 = 0; y1 < row; y1++) {
    for (x1 = 0; x1 < column; x1++) {
      for (y2 = y1 + 1; y2 < row; y2++) {
        for (x2 = x1 + 1; x2 < column; x2++) {
          if (
            map[y1][x1] == map[y1][x2] &&
            map[y1][x2] == map[y2][x1] &&
            map[y2][x1] == map[y2][x2]
          ) {
            (ansx1 = x1), (ansy1 = y1), (ansx2 = x2), (ansy2 = y2);
            count += 1;
          }
        }
      }
    }
  }
  return count;
}
function isPicked() {
  if (lastx != -100 && lasty != -100) return true;
  return false;
}

function isAcceptable(y1, x1, y2, x2) {
  if (x1 == x2 || y1 == y2) return false;
  if (
    map[y1][x1] == map[y1][x2] &&
    map[y1][x2] == map[y2][x2] &&
    map[y2][x2] == map[y2][x1]
  )
    return true;
  return false;
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

function createSquares(y1, x1, y2, x2, pts, secBonus) {
  var sx = x1,
    sy = y1,
    bx = x2,
    by = y2;
  if (x2 < x1) (sx = x2), (bx = x1);
  if (y2 < y1) (sy = y2), (by = y1);
  for (var i = sy; i <= by; i++)
    for (var j = sx; j <= bx; j++) {
      var square = G.O["square" + (i * column + j)];
      var oldType = "square" + map[i][j];
      map[i][j] = getSquareType();
      if (square) {
        try {
          square.swapClass(oldType, "square" + map[i][j]);
        } catch (e) { console.error("[square-tools] caught error", e); }
        try {
          square.turnOn();
        } catch (e) { console.error("[square-tools] caught error", e); }
      }
    }
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
    if (ptsText || secText) {
      var html = "";
      if (ptsText) html += "<div class='score-pop-line'>" + ptsText + "</div>";
      if (secText) html += "<div class='score-pop-line'>" + secText + "</div>";
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
    pop.classList.remove("animate");
    void pop.offsetWidth;
    pop.classList.add("animate");
  } catch (e) { console.error("[square-tools] caught error", e); }
  (lastx = -100), (lasty = -100);
  if (stageIndex === 4) {
    try { resumeStage4Refresh(); } catch (e) { console.error("[square-tools] caught error", e); }
  }
}

function squareHandler(square) {
  var id = square.id.substring(square.id.indexOf("e") + 1);
  var columnIndex = id % column,
    rowIndex = Math.floor(id / column);
  if (isPicked()) {
    var lastSquare = G.O["square" + (lasty * column + lastx)];
    if (lastSquare) {
      try {
        lastSquare.removeClass("picked").draw();
      } catch (e) { console.error("[square-tools] caught error", e); }
    }
    if (isAcceptable(lasty, lastx, rowIndex, columnIndex)) {
      var x1 = square.x,
        y1 = square.y,
        x2 = lastSquare.x,
        y2 = lastSquare.y;
      var sx = x1,
        sy = y1,
        bx = x2,
        by = y2;
      if (x2 < x1) (sx = x2), (bx = x1);
      if (y2 < y1) (sy = y2), (by = y1);
      var columnumber = Math.abs(lastx - columnIndex) + 1;
      var rownumber = Math.abs(lasty - rowIndex) + 1;
      // compute pts per new formula: (width-1)*(height-1)
      var width = columnumber,
        height = rownumber;
      var pts = Math.max(0, (width - 1) * (height - 1));
      score += pts;
      // compute time bonus only in phase 1
      var secBonus = 0;
      try {
        if (stageIndex === 2) {
          // compute elapsed in game seconds (gameTick counts ticks; 25 ticks per second)
          var elapsedTicks =
            (typeof gameTick !== "undefined" ? gameTick : 0) -
            (lastClearTick || 0);
          var elapsedSec = Math.floor(elapsedTicks / 25);
          secBonus = Math.max(0, Math.min(5, 5 - elapsedSec));
          // convert seconds to timer ticks (25 ticks per second)
          timer += secBonus * 25;
        }
      } catch (e) {
        secBonus = 0;
      }
      // record last clear in game ticks
      var prevLastClear = lastClearTick;
      lastClearTick = typeof gameTick !== "undefined" ? gameTick : 0;
      try {
        if (typeof debugMode !== "undefined" && debugMode)
          console.log(
            "[TESTLOG] clear: pts=",
            pts,
            " secBonus=",
            secBonus,
            " prevLastClear=",
            prevLastClear,
            " gameTick=",
            typeof gameTick !== "undefined" ? gameTick : 0,
            " elapsedTicks=",
            (typeof gameTick !== "undefined" ? gameTick : 0) -
              (prevLastClear || 0),
            " elapsedSec=",
            Math.floor(
              ((typeof gameTick !== "undefined" ? gameTick : 0) -
                (prevLastClear || 0)) /
                25
            ),
            " newLastClear=",
            lastClearTick
          );
      } catch (e) { console.error("[square-tools] caught error", e); }
      G.O.explosion
        .setVar({ x: sx, y: sy, w: bx - sx + 25, h: by - sy + 25 })
        .AI("reset")
        .turnOn();
      clearSquares(lasty, lastx, rowIndex, columnIndex);
      createSquares(lasty, lastx, rowIndex, columnIndex, pts, secBonus);
      // successful clear: cancel pending selection timeout and clear selectionPending
      try {
        if (selectionTimeoutId) {
          clearTimeout(selectionTimeoutId);
          selectionTimeoutId = null;
        }
      } catch (e) { console.error("[square-tools] caught error", e); }
      selectionPending = false;
      if (level > 1 && score > (maxLevel - level + 1) * 100) level -= 1;
      while (enable() < level - 1) {
        initMap();
      }
      refreshScreen();
    }
  }
  (lasty = rowIndex), (lastx = columnIndex);
  square.addClass("picked").draw();
  // record the tick of the user's selection (used to gate auto-hint)
  try {
    lastSelectionTick = typeof gameTick !== "undefined" ? gameTick : 0;
  } catch (e) { console.error("[square-tools] caught error", e); }
  // mark that there is a pending selection; start/reset a timeout to clear it
  try {
    if (selectionTimeoutId) {
      clearTimeout(selectionTimeoutId);
      selectionTimeoutId = null;
    }
  } catch (e) { console.error("[square-tools] caught error", e); }
  selectionPending = true;
  if (stageIndex === 4) {
    try { pauseStage4Refresh(); } catch (e) { console.error("[square-tools] caught error", e); }
  }
  try {
    selectionTimeoutId = setTimeout(function () {
      try {
        // remove visual picked marker and clear selection
        var s = G.O["square" + (lasty * column + lastx)];
        if (s) s.removeClass("picked").draw();
      } catch (e) { console.error("[square-tools] caught error", e); }
      lastx = -100;
      lasty = -100;
      selectionPending = false;
      selectionTimeoutId = null;
      if (stageIndex === 4) {
        try { resumeStage4Refresh(); } catch (e) { console.error("[square-tools] caught error", e); }
      }
    }, selectionTimeoutMs);
  } catch (e) { console.error("[square-tools] caught error", e); }
  try {
    resetInactivityTimer();
  } catch (e) { console.error("[square-tools] caught error", e); }
}

function resetGame() {
  $("#viewport").remove();
  // If this is the first run (startFlag true), keep the game paused until the user presses Start
  timer = gametimer;
  score = 0;
  // Reset game-time baseline so previous run/flash time does not leak into stage2 hint gating.
  try {
    if (typeof gameTick !== "undefined") gameTick = 0;
  } catch (e) { console.error("[square-tools] caught error", e); }
  lastSelectionTick = 0;
  lastClearTick = 0;
  // reset gameStarted flag; actual timers start only when gameplay officially begins
  gameStarted = false;
  if (startFlag) {
    gamestate = "pause";
  } else {
    gamestate = "on";
  }
  // allow viewport clicks to start a new game again
  isTouched = false;
  // initialize hint counter for this run
  window._hintRemaining = hintUses || 0;
  // auto-hint active flag
  window._autoHintActive = false;
  // clear any pending selection state
  try {
    if (selectionTimeoutId) {
      clearTimeout(selectionTimeoutId);
      selectionTimeoutId = null;
    }
  } catch (e) { console.error("[square-tools] caught error", e); }
  try {
    clearInactivityTimer();
  } catch (e) { console.error("[square-tools] caught error", e); }
  selectionPending = false;
  stage4NextRefreshAt = 0;
  stage4RemainingMs = 0;
  stage4Paused = false;
  clearStage4RefreshTimer();
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
  if (supportsPointerUp()) {
    $("#viewport").on("pointerup", function (e) {
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
    });
  } else {
    $("#viewport").on("touchend", function (e) {
      viewportTouchTs = Date.now();
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
    });
    $("#viewport").on("click", function (e) {
      if (Date.now() - viewportTouchTs < 350) return;
      if (Date.now() - tutorialTouchTs < 350) return;
      if (eventHitsTutorial(e)) {
        triggerTutorialControl();
        return;
      }
      if (gamestate == "off") {
        if (!isTouched) resetGame();
        return;
      }
    });
  }
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

  var helpwidth = (column * bigside - squaremargin) / 2;
  // create tutorial and dashboard before resumeGame so resumeGame can access dashboard gob
  G.makeGob("tutorial", G.O.viewport)
    .setVar({
      x: squareleft,
      y: squaretop + row * bigside,
      w: helpwidth - 2,
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
  if (supportsPointerUp()) {
    $("#tutorial").on("pointerup", function (e) {
      stopEventBubble(e);
      tutorialTouchTs = Date.now();
      triggerTutorialControl();
    });
  } else {
    $("#tutorial").on("touchend", function (e) {
      stopEventBubble(e);
      tutorialTouchTs = Date.now();
      triggerTutorialControl();
    });
    $("#tutorial").on("click", function (e) {
      stopEventBubble(e);
      if (Date.now() - tutorialTouchTs < 350) return;
      triggerTutorialControl();
    });
  }

  G.makeGob("dashboard", G.O.viewport)
    .setVar({
      x: squareleft + helpwidth + 2,
      y: squaretop + row * bigside,
      w: helpwidth - 2,
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
    try {
      startInactivityTimer();
    } catch (e) { console.error("[square-tools] caught error", e); }
    // initialize phase cycle
    stageIndex = 2; // when starting gameplay, enter stage 2
    // initialize lastClearTick to current gameTick (gameTick may be zero at start)
    lastClearTick = typeof gameTick !== "undefined" ? gameTick : 0;
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
      if (stage4RefreshTimerId) {
        clearInterval(stage4RefreshTimerId);
        stage4RefreshTimerId = null;
      }
      if (stage4RefreshTimeoutId) {
        clearTimeout(stage4RefreshTimeoutId);
        stage4RefreshTimeoutId = null;
      }
    }
  } catch (e) { console.error("[square-tools] caught error", e); }
  // schedule stage advancement only for stage 2/3.
  // Stage 4 should continue until the main countdown reaches zero.
  if (stageIndex === 2 || stageIndex === 3) {
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
      stageTimerId = setTimeout(function () {
        advanceStage();
      }, (phaseDurationSec || 20) * 1000);
    } catch (e) { console.error("[square-tools] caught error", e); }
  }
  // start stage-specific behaviors
  if (stageIndex === 2) {
    // periodic hints every configured seconds
    try {
      stageHintTimerId = setInterval(function () {
        try {
          if (gamestate !== "on") return;
          if ((window._hintRemaining || 0) <= 0) return;
          if (enable() == 0) return;
          // Only show auto-hint if at least phase1HintIntervalSec has passed since last user selection
          var elapsedTicks =
            (typeof gameTick !== "undefined" ? gameTick : 0) -
            (lastSelectionTick || 0);
          var elapsedSec = Math.floor(elapsedTicks / 25);
          if (elapsedSec < (phase1HintIntervalSec || 5)) return;
          if (showHint()) {
            window._hintRemaining = Math.max(
              0,
              (window._hintRemaining || 0) - 1
            );
            try {
              updateDashboard();
            } catch (e) { console.error("[square-tools] caught error", e); }
          }
        } catch (e) { console.error("[square-tools] caught error", e); }
      }, 1000); // check every second whether to show the hint (gating logic handles interval)
    } catch (e) { console.error("[square-tools] caught error", e); }
  }
    if (stageIndex === 4) {
      // refresh board every configured seconds ensuring single solution
      try {
        scheduleStage4Refresh((phase3RefreshIntervalSec || 3) * 1000);
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
    // move to next stage in gameplay loop: 2 -> 3 -> 4
    // once in stage 4, stay there until main timer reaches zero.
    stageIndex = Math.min(4, (stageIndex || 1) + 1);
    // restart stage cycle behaviors
    try {
      if (stageHintTimerId) {
        clearInterval(stageHintTimerId);
        stageHintTimerId = null;
      }
    } catch (e) { console.error("[square-tools] caught error", e); }
    try {
      if (stage4RefreshTimerId) {
        clearInterval(stage4RefreshTimerId);
        stage4RefreshTimerId = null;
      }
    } catch (e) { console.error("[square-tools] caught error", e); }
    try {
      if (stage4RefreshTimeoutId) {
        clearTimeout(stage4RefreshTimeoutId);
        stage4RefreshTimeoutId = null;
      }
    } catch (e) { console.error("[square-tools] caught error", e); }
    // if entering stage4, start its refresh timer
    if (typeof debugMode !== "undefined" && debugMode)
      try {
        console.log("advanceStage -> new stageIndex=", stageIndex);
      } catch (e) { console.error("[square-tools] caught error", e); }
    if (stageIndex === 4) {
      try {
        showStage4Intro();
      } catch (e) { console.error("[square-tools] caught error", e); }
    } else {
      // For stageIndex 2 or 3, start the stage cycle immediately (no intro overlay).
      try {
        stageRunning = false;
      } catch (e) { console.error("[square-tools] caught error", e); }
      try {
        // start stage behaviors for this stage (startStageCycle will schedule advancement)
        try {
          startStageCycle();
        } catch (e) { console.error("[square-tools] caught error", e); }
      } catch (e) {
        console.log("advanceStage startStageCycle error", e);
      }
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
  try {
    if (stage4RefreshTimerId) {
      clearInterval(stage4RefreshTimerId);
      stage4RefreshTimerId = null;
    }
  } catch (e) { console.error("[square-tools] caught error", e); }
  try {
    if (stage4RefreshTimeoutId) {
      clearTimeout(stage4RefreshTimeoutId);
      stage4RefreshTimeoutId = null;
    }
  } catch (e) { console.error("[square-tools] caught error", e); }
}

// wire global user interactions to reset inactivity timer so auto-hint doesn't trigger while user is active
try {
  document.addEventListener(
    "click",
    function () {
      try {
        resetInactivityTimer();
      } catch (e) { console.error("[square-tools] caught error", e); }
    },
    false
  );
  document.addEventListener(
    "touchstart",
    function () {
      try {
        resetInactivityTimer();
      } catch (e) { console.error("[square-tools] caught error", e); }
    },
    false
  );
  document.addEventListener(
    "mousemove",
    function () {
      try {
        resetInactivityTimer();
      } catch (e) { console.error("[square-tools] caught error", e); }
    },
    false
  );
} catch (e) { console.error("[square-tools] caught error", e); }

// start inactivity timer on load (the timer itself checks gamestate and hint availability)
try {
  startInactivityTimer();
} catch (e) { console.error("[square-tools] caught error", e); }

function popTutorial() {
  // If in stage 4, do not allow pause/tutorial overlay
  if (stageIndex === 4) return;
  gamestate = "pause";
  // cancel any pending selection to avoid leaving stray pick visuals
  try {
    if (selectionTimeoutId) {
      clearTimeout(selectionTimeoutId);
      selectionTimeoutId = null;
    }
  } catch (e) { console.error("[square-tools] caught error", e); }
  selectionPending = false;
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
    // show step text based on current stage (map old step1/2/3 to stage2/3/4)
    if (stageIndex === 2)
      tipInfo =
        "<p class='tutorial'>" +
        getStageIntroText(2) +
        "</p>" +
        "<p class='tutorial-hint'>" +
        getStageHintText(2) +
        "</p>";
    else if (stageIndex === 3)
      tipInfo =
        "<p class='tutorial'>" +
        getStageIntroText(3) +
        "</p>" +
        "<p class='tutorial-hint'>" +
        getStageHintText(3) +
        "</p>";
  }
  // show tipInfo on the large tutorial board
  var titleText = I18N && I18N.stageTitle ? I18N.stageTitle : "Stage Info";
  try {
    G.O.tutorialboard
      .setSrc("<div class='stage-copy'><h3>" + titleText + "</h3>" + tipInfo + "</div>")
      .draw();
  } catch (e) { console.error("[square-tools] caught error", e); }
  // after showing overlay, set the small tutorial control: Start for first-run, Stop otherwise
  try {
    if (G.O && G.O.tutorial) {
      var ctrl;
      if (wasFirst) {
        ctrl = "<span class='control-text'>" + (I18N && I18N.startControl ? I18N.startControl : "Start") + "</span>";
      } else {
        ctrl = "<span class='control-text'>" + getResumeLabel() + "</span>";
      }
      G.O.tutorial.setSrc("<p class='tutorial'>" + ctrl + "</p>").draw();
    }
  } catch (e) { console.error("[square-tools] caught error", e); }
}

function resumeGame() {
  if (gamestate == "pause") {
    gamestate = "on";
    G.O.tutorialboard
      .setSrc("")
      .swapClass("tutorialboardOn", "tutorialboardOff")
      .draw();
    updateStageControl();
    // remove any stageInfo overlay if present (used for Stage4 intro)
    try {
      if (G.O && G.O.stageInfo) {
        G.O.stageInfo.setSrc("").turnOff();
      }
    } catch (e) { console.error("[square-tools] caught error", e); }
  }
  // if game was not started yet (first-run), start timers and phase cycle now
  if (!gameStarted) {
    try {
      startInactivityTimer();
    } catch (e) { console.error("[square-tools] caught error", e); }
    try {
      /* normalize to stage flow */ stageIndex = 2;
    } catch (e) { console.error("[square-tools] caught error", e); }
    try {
      lastClearTick = typeof gameTick !== "undefined" ? gameTick : 0;
    } catch (e) { console.error("[square-tools] caught error", e); }
    try {
      startStageCycle();
    } catch (e) { console.error("[square-tools] caught error", e); }
    gameStarted = true;
  }
  // If resuming from the Stage4 intro, start the Stage4 running behavior (auto-refresh)
    try {
      if (stageIndex === 4 && !stage4RefreshTimerId) {
        // don't allow pausing while stage 4 is running
        try {
        	startStageCycle();
        	try { if (typeof debugMode !== 'undefined' && debugMode) console.log('[TESTLOG] resumeGame: requested startStageCycle for stageIndex=4'); } catch (e) { console.error("[square-tools] caught error", e); }
        } catch (e) { console.error("[square-tools] caught error", e); }
        stageRunning = true;
        // ensure gamestate is on
        try {
          gamestate = "on";
        } catch (e) { console.error("[square-tools] caught error", e); }
      }
    // If resuming from stage 2 or 3 intro, start that stage's timers/cycle now
    if ((stageIndex === 2 || stageIndex === 3) && !stageTimerId) {
      try {
        startStageCycle();
      } catch (e) { console.error("[square-tools] caught error", e); }
      stageRunning = true;
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
      if (supportsPointerUp()) {
        $("#square" + (i * column + j)).on("pointerup", function (e) {
          squareTouchTs = Date.now();
          handleSquareInputById($(this).attr("id"), e);
        });
      } else {
        $("#square" + (i * column + j)).on("touchend", function (e) {
          squareTouchTs = Date.now();
          handleSquareInputById($(this).attr("id"), e);
        });
        $("#square" + (i * column + j)).on("click", function (e) {
          // Ignore synthetic click generated right after touch on mobile.
          if (Date.now() - squareTouchTs < 350) return;
          handleSquareInputById($(this).attr("id"), e);
        });
      }
    }

    // update dashboard using centralized updater
    updateDashboard();
  }
}

  // override G.O.tutorial click handler to start Stage4 when Resume is clicked while on stage 4
  try {
    // When the tutorial small control is clicked and the current overlay label is Resume and we're on stageIndex===4,
    // resumeGame will be called via existing handlers. We need to ensure Stage4 actually starts running after resume.
    var originalTutorialOnClick = null; // placeholder (we don't override engine internals)
  } catch (e) { console.error("[square-tools] caught error", e); }

  // show the Stage 4 intro overlay (special Resume control). When user resumes,
  // startStageCycle will be invoked from resumeGame and Stage4's refresh will begin.
  function showStage4Intro() {
    try {
      // Prevent stale click in the transition frame from instantly resuming.
      tutorialClickSuppressUntil = Date.now() + 400;
      // Render a dedicated stageInfo gob into the viewport so it's robust across load orders
      var titleText =
        I18N && I18N.stageTitle ? I18N.stageTitle : "Stage Info";
      var html =
        '<div style="color:#fff; padding:16px;">' +
        '<div class="stage-info"><h3>' +
        titleText +
        "</h3>" +
        '<p class="tutorial">' +
        getStageIntroText(4) +
        "</p>" +
        '<p class="tutorial-hint">' +
        getStageHintText(4) +
        "</p>" +
        "</div></div>";
      try {
        if (G && G.O && G.O.viewport) {
          // create or reuse a dedicated stageInfo gob so other overlays (tutorialboard) are not required
          if (!G.O.stageInfo) {
            G.makeGob("stageInfo", G.O.viewport)
              .setVar({ x: 0, y: 0, w: viewportwidth, h: viewportheight })
              .addClass("stage-info-gob")
              .turnOn();
          }
          G.O.stageInfo.setSrc(html).draw();
        }
      } catch (e) {
        console.log("showStage4Intro set stageInfo error", e);
      }
      console.log("showStage4Intro")
      // pause gameplay until user presses Resume
      try {
        if (selectionTimeoutId) {
          clearTimeout(selectionTimeoutId);
          selectionTimeoutId = null;
        }
      } catch (e) { console.error("[square-tools] caught error", e); }
      // clear any pending selection so Stage4 auto-refresh can run once resumed
      try {
        if (lastx != -100 && lasty != -100) {
          var lastSq = G.O["square" + (lasty * column + lastx)];
          if (lastSq) lastSq.removeClass("picked").draw();
        }
      } catch (e) { console.error("[square-tools] caught error", e); }
      selectionPending = false;
      lastx = -100;
      lasty = -100;
      gamestate = "pause";
      stageRunning = false;
      stage4Paused = true;
      stage4RemainingMs = (phase3RefreshIntervalSec || 3) * 1000;
      stage4NextRefreshAt = 0;
      clearStage4RefreshTimer();
      updateStageControl();
    } catch (e) {
      console.log("showStage4Intro error", e);
    }
  }

function buildTutorialPreviewHTML() {
  // 4x4 fixed preview grid using current tile styles
  var pattern = [
    2, 4, 1, 2,
    3, 5, 0, 4,
    1, 0, 5, 3,
    2, 4, 1, 2,
  ];
  var cornerIdx = { 0: true, 3: true, 12: true, 15: true };
  var html = '<div class="tutorial-preview">';
  for (var i = 0; i < pattern.length; i++) {
    var cornerClass = cornerIdx[i] ? " tutorial-hint-corner" : "";
    html +=
      '<div class="tutorial-tile square' +
      pattern[i] +
      cornerClass +
      '"></div>';
  }
  html += "</div>";
  return html;
}
