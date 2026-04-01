function getSquareType() {
  return Math.floor(Math.random() * 6);
}

// Stage control variables
// stageIndex: 1 = Tutorial, 2 = Stage2 (hints & time bonus), 3 = Stage3 (no hints/time bonus),
// 4 = Stage4 (auto-refresh single-solution), 5 = Stage5 (end/score input)
var stageIndex = 1;
var stageTimerId = null;
var stageHintTimerId = null;
var stage4RefreshTimerId = null;
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
var selectionTimeoutMs = 5000; // ms before auto-clearing selection state
// whether the actual gameplay timers/cycles have been started
var gameStarted = false;

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
        } catch (e) {}
        continue;
      }
      try {
        square.swapClass(square.tag.className, "square" + map[i][j]).draw();
      } catch (e) {}
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
    list.push({ score: scoreValue, t: new Date().toISOString(), name: n });
    list.sort(function (a, b) {
      return b.score - a.score;
    });
    list = list.slice(0, leaderboardSize);
    localStorage.setItem(key, JSON.stringify(list));
  } catch (e) {
    console.log("saveScore error", e);
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
      '<div style="text-align:center; color:#fff;">' +
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
    var btn = document.getElementById("skipOnly");
    if (btn)
      btn.addEventListener("click", function () {
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
      '<div style="text-align:center; color:#fff;">' +
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
          var idx = parseInt(btn.getAttribute("data-idx"), 10) || 0;
          vals[idx] = (vals[idx] + 1) % 26;
          updateStrip(idx);
        });
      })(downs[k]);
    }

    document
      .getElementById("confirmName")
      .addEventListener("click", function () {
        try {
          var name =
            valToChar(vals[0]) + valToChar(vals[1]) + valToChar(vals[2]);
          saveScoreWithName(scoreValue, name);
        } catch (e) {
          saveScoreWithName(scoreValue, "");
        }
        // restart a new game after confirming name
        try {
          resetGame();
        } catch (e) {
          G.O.viewport.setSrc(renderLeaderboardHTML()).draw();
        }
      });

    document.getElementById("skipName").addEventListener("click", function () {
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
  } catch (e) {}
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
        } catch (e) {}
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
        } catch (e) {}
        window._autoHintActive = true;
        if (showHint()) {
          // consume one hint
          window._hintRemaining = Math.max(0, (window._hintRemaining || 0) - 1);
          try {
            updateDashboard();
          } catch (e) {}
          try {
            pulseHintIcons();
          } catch (e) {}
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
          } catch (e) {}
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
    var dash = G.O["dashboard"];
    if (!dash) return;
    var timeText =
      "<p class='time'>" +
      (I18N && I18N.timeLabel ? I18N.timeLabel : "Time") +
      ":" +
      Math.max(0, Math.ceil((timer + 1) / 25)) +
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
      "</span>" +
      renderLeaderboardHTML();
    dash.setSrc(html).draw();
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
        } catch (e) {}
        try {
          square.turnOn();
        } catch (e) {}
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
    // show both pts and sec bonus if available
    var ptsText = typeof pts === "number" && pts > 0 ? "+" + pts + " pts" : "";
    var secText =
      typeof secBonus === "number" && secBonus > 0
        ? "+" + secBonus + " sec"
        : "";
    pop.innerText =
      ptsText + (ptsText && secText ? "  " : "") + secText ||
      "+" + (Math.abs(lastx - sx) + 1) * (Math.abs(lasty - sy) + 1);
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
  } catch (e) {}
  (lastx = -100), (lasty = -100);
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
      } catch (e) {}
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
      } catch (e) {}
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
      } catch (e) {}
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
  } catch (e) {}
  // mark that there is a pending selection; start/reset a timeout to clear it
  try {
    if (selectionTimeoutId) {
      clearTimeout(selectionTimeoutId);
      selectionTimeoutId = null;
    }
  } catch (e) {}
  selectionPending = true;
  try {
    selectionTimeoutId = setTimeout(function () {
      try {
        // remove visual picked marker and clear selection
        var s = G.O["square" + (lasty * column + lastx)];
        if (s) s.removeClass("picked").draw();
      } catch (e) {}
      lastx = -100;
      lasty = -100;
      selectionPending = false;
      selectionTimeoutId = null;
    }, selectionTimeoutMs);
  } catch (e) {}
  try {
    resetInactivityTimer();
  } catch (e) {}
}

function resetGame() {
  $("#viewport").remove();
  // If this is the first run (startFlag true), keep the game paused until the user presses Start
  timer = gametimer;
  score = 0;
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
  } catch (e) {}
  selectionPending = false;
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
  $("#viewport").on("touchend", function (e) {
    isTouched = true;
    if (gamestate == "off") {
      resetGame();
    }
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
      "<div class='tutorial'>" +
        (startFlag && I18N && I18N.startControl
          ? I18N.startControl
          : "Tutoria") +
        "</div>"
    )
    .addClass("help")
    .turnOn();
  $("#tutorial").on("touchend", function (e) {
    isTouched = true;
    if (gamestate == "on") popTutorial();
    else if (gamestate == "pause") resumeGame();
  });

  G.makeGob("dashboard", G.O.viewport)
    .setVar({
      x: squareleft + helpwidth + 2,
      y: squaretop + row * bigside,
      w: helpwidth - 2,
      h: helpheight,
    })
    .addClass("help")
    .turnOn();

  // Only actually draw the board and start timers if this is not the first-run tutorial.
  if (!startFlag) {
    resumeGame();
    try {
      startInactivityTimer();
    } catch (e) {}
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
    } catch (e) {}
    try {
      startStageCycle();
    } catch (e) {}
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
    }
  } catch (e) {}
  // schedule stage advancement
  try {
    // ensure no duplicate timer exists when configured
    try {
      if (typeof timerSafeguards === "undefined" || timerSafeguards) {
        if (stageTimerId) {
          clearTimeout(stageTimerId);
          stageTimerId = null;
        }
      }
    } catch (e) {}
    stageTimerId = setTimeout(function () {
      advanceStage();
    }, (phaseDurationSec || 20) * 1000);
  } catch (e) {}
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
            } catch (e) {}
          }
        } catch (e) {}
      }, 1000); // check every second whether to show the hint (gating logic handles interval)
    } catch (e) {}
  }
    if (stageIndex === 4) {
      // refresh board every configured seconds ensuring single solution
      try {
        if (typeof timerSafeguards === "undefined" || timerSafeguards) {
          if (stage4RefreshTimerId) {
            clearInterval(stage4RefreshTimerId);
            stage4RefreshTimerId = null;
          }
        }
        // Debug: log when the stage4 refresh timer is created
        try {
          if (typeof debugMode !== "undefined" && debugMode)
            console.log("[TESTLOG] startStageCycle: scheduling stage4 refresh every ", (phase3RefreshIntervalSec || 3), "s");
        } catch (e) {}
        stage4RefreshTimerId = setInterval(function () {
          try {
            if (typeof debugMode !== "undefined" && debugMode)
              console.log("[TESTLOG] stage4RefreshTick: gamestate=", gamestate, " selectionPending=", selectionPending);
          } catch (e) {}
          if (gamestate !== "on") {
            try {
              if (typeof debugMode !== "undefined" && debugMode)
                console.log("[TESTLOG] stage4RefreshTick: skipped because gamestate!=on");
            } catch (e) {}
            return;
          }
          // if player currently has a selection pending, skip auto-refresh to avoid invalidating the pick
          if (selectionPending) {
            try {
              if (typeof debugMode !== "undefined" && debugMode)
                console.log("[TESTLOG] stage4RefreshTick: skipped because selectionPending");
            } catch (e) {}
            return;
          }
          // regenerate until exactly one solution exists
          var attempts = 0;
          do {
            initMap();
            attempts++;
          } while (enable() !== 1 && attempts < 30);
          refreshScreen();
        }, (phase3RefreshIntervalSec || 3) * 1000);
      } catch (e) {}
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
    } catch (e) {}
    // move to next stage: 2->3->4->5 then wrap to 2
    stageIndex = Math.min(5, (stageIndex || 1) + 1);
    // restart stage cycle behaviors
    try {
      if (stageHintTimerId) {
        clearInterval(stageHintTimerId);
        stageHintTimerId = null;
      }
    } catch (e) {}
    try {
      if (stage4RefreshTimerId) {
        clearInterval(stage4RefreshTimerId);
        stage4RefreshTimerId = null;
      }
    } catch (e) {}
    // if entering stage4, start its refresh timer
    if (typeof debugMode !== "undefined" && debugMode)
      try {
        console.log("advanceStage -> new stageIndex=", stageIndex);
      } catch (e) {}
    if (stageIndex === 4) {
      try {
        showStage4Intro();
      } catch (e) {}
    } else if (stageIndex === 5) {
      // end stage: show score input / leaderboard flow
      stageRunning = false;
      try {
        showEndScreen(score);
      } catch (e) {
        console.log("showEndScreen error", e);
      }
    } else {
      // For stageIndex 2 or 3, start the stage cycle immediately (no intro overlay).
      try {
        stageRunning = false;
      } catch (e) {}
      try {
        // start stage behaviors for this stage (startStageCycle will schedule advancement)
        try {
          startStageCycle();
        } catch (e) {}
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
  } catch (e) {}
  try {
    if (stageHintTimerId) {
      clearInterval(stageHintTimerId);
      stageHintTimerId = null;
    }
  } catch (e) {}
  try {
    if (stage4RefreshTimerId) {
      clearInterval(stage4RefreshTimerId);
      stage4RefreshTimerId = null;
    }
  } catch (e) {}
}

// wire global user interactions to reset inactivity timer so auto-hint doesn't trigger while user is active
try {
  document.addEventListener(
    "click",
    function () {
      try {
        resetInactivityTimer();
      } catch (e) {}
    },
    false
  );
  document.addEventListener(
    "touchstart",
    function () {
      try {
        resetInactivityTimer();
      } catch (e) {}
    },
    false
  );
  document.addEventListener(
    "mousemove",
    function () {
      try {
        resetInactivityTimer();
      } catch (e) {}
    },
    false
  );
} catch (e) {}

// start inactivity timer on load (the timer itself checks gamestate and hint availability)
try {
  startInactivityTimer();
} catch (e) {}

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
  } catch (e) {}
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
      imgHtml =
        "<div class='tutorial-film'><img src='t1.png' alt='" +
        (I18N && I18N.tutorialImageAlt ? I18N.tutorialImageAlt : "tutorial") +
        "' class='tutorial-img' /></div>";
    } catch (e) {
      imgHtml = "";
    }
    tipInfo =
      imgHtml +
      "<p class='tutorial tutorial-first'>" +
      (typeof tutorialFirstText !== "undefined"
        ? tutorialFirstText
        : I18N && I18N.tutorialStart
        ? I18N.tutorialStart
        : "start") +
      "</p>";
    // mark that we've shown the first-run tutorial
    startFlag = false;
  } else {
    // show step text based on current stage (map old step1/2/3 to stage2/3/4)
    if (stageIndex === 2)
      tipInfo =
        "<p class='tutorial'>" +
        (typeof step1Text !== "undefined"
          ? step1Text
          : "Step 1: You will receive extra time bonuses based on your recent performance.") +
        "</p>";
    else if (stageIndex === 3)
      tipInfo =
        "<p class='tutorial'>" +
        (typeof step2Text !== "undefined"
          ? step2Text
          : "Step 2: No extra time bonuses will be awarded now.") +
        "</p>";
  }
  // show tipInfo on the large tutorial board
  var titleText = I18N && I18N.stageTitle ? I18N.stageTitle : "Tutorial";
  if (I18N && I18N.tutorialTitle) titleText = I18N.tutorialTitle;
  try {
    G.O.tutorialboard
      .setSrc("<center><h3>" + titleText + "</h3>" + tipInfo)
      .draw();
  } catch (e) {}
  // after showing overlay, set the small tutorial control: Start for first-run, Stop otherwise
  try {
    if (G.O && G.O.tutorial) {
      var ctrl;
      // For entering stage 4, the overlay should show Resume instead of Stop
      if (!wasFirst && stageIndex === 4) {
        ctrl = I18N && I18N.tutorialResume ? I18N.tutorialResume : "Resume";
      } else {
        ctrl = wasFirst
          ? I18N && I18N.startControl
            ? I18N.startControl
            : "Start"
          : I18N && I18N.stopControl
          ? I18N.stopControl
          : "Stop";
      }
      G.O.tutorial.setSrc("<p class='tutorial'>" + ctrl + "</p>").draw();
    }
  } catch (e) {}
}

function resumeGame() {
  if (gamestate == "pause") {
    gamestate = "on";
    G.O.tutorialboard
      .setSrc("")
      .swapClass("tutorialboardOn", "tutorialboardOff")
      .draw();
    // set the small control label: if this was the first run we had startFlag true before popTutorial; after first run show Stop
    try {
      var label = I18N && I18N.stopControl ? I18N.stopControl : "Stop";
      G.O.tutorial.setSrc("<p class='tutorial'>" + label + "</p>").draw();
    } catch (e) {}
    // remove any stageInfo overlay if present (used for Stage4 intro)
    try {
      if (G.O && G.O.stageInfo) {
        G.O.stageInfo.setSrc("").turnOff();
      }
    } catch (e) {}
  }
  // if game was not started yet (first-run), start timers and phase cycle now
  if (!gameStarted) {
    try {
      startInactivityTimer();
    } catch (e) {}
    try {
      /* normalize to stage flow */ stageIndex = 2;
    } catch (e) {}
    try {
      lastClearTick = typeof gameTick !== "undefined" ? gameTick : 0;
    } catch (e) {}
    try {
      startStageCycle();
    } catch (e) {}
    gameStarted = true;
  }
  // If resuming from the Stage4 intro, start the Stage4 running behavior (auto-refresh)
    try {
      if (stageIndex === 4 && !stage4RefreshTimerId) {
        // don't allow pausing while stage 4 is running
        try {
        	startStageCycle();
        	try { if (typeof debugMode !== 'undefined' && debugMode) console.log('[TESTLOG] resumeGame: requested startStageCycle for stageIndex=4'); } catch (e) {}
        } catch (e) {}
        stageRunning = true;
        // ensure gamestate is on
        try {
          gamestate = "on";
        } catch (e) {}
      }
    // If resuming from stage 2 or 3 intro, start that stage's timers/cycle now
    if ((stageIndex === 2 || stageIndex === 3) && !stageTimerId) {
      try {
        startStageCycle();
      } catch (e) {}
      stageRunning = true;
    }
  } catch (e) {}
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
      $("#square" + (i * column + j)).on("touchend", function (e) {
        isTouched = true;
        var id = $(this).attr("id");
        var square = G.O[id];
        squareHandler(square);
      });
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
  } catch (e) {}

  // show the Stage 4 intro overlay (special Resume control). When user resumes,
  // startStageCycle will be invoked from resumeGame and Stage4's refresh will begin.
  function showStage4Intro() {
    try {
      // Render a dedicated stageInfo gob into the viewport so it's robust across load orders
      var titleText =
        I18N && I18N.stageTitle ? I18N.stageTitle : "Stage Info";
      var html =
        '<div style="text-align:center; color:#fff; padding:16px;">' +
        '<div class="stage-info"><h3>' +
        titleText +
        "</h3>" +
        '<p class="tutorial">' +
        (typeof step3Text !== "undefined"
          ? step3Text
          : "Final Step: Everything will change soon, hurry up and good luck!") +
        "</p>" +
        '<div style="margin-top:10px;"><button id="stage4Resume">' +
        (I18N && I18N.tutorialResume ? I18N.tutorialResume : "Resume") +
        "</button></div>" +
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
          // attach handler for resume button; small timeout to ensure DOM exists
          setTimeout(function () {
            try {
              var btn = document.getElementById("stage4Resume");
              if (btn)
                btn.addEventListener("click", function () {
                  try {
                    resumeGame();
                  } catch (e) {
                   console.log("showStage4Intro set stageInfo error", e);
                  }
                });
            } catch (e) {
               console.log("showStage4Intro set stageInfo error", e);
	   }
          }, 20);
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
      } catch (e) {}
      // clear any pending selection so Stage4 auto-refresh can run once resumed
      try {
        if (lastx != -100 && lasty != -100) {
          var lastSq = G.O["square" + (lasty * column + lastx)];
          if (lastSq) lastSq.removeClass("picked").draw();
        }
      } catch (e) {}
      selectionPending = false;
      lastx = -100;
      lasty = -100;
      gamestate = "pause";
      stageRunning = false;
    } catch (e) {
      console.log("showStage4Intro error", e);
    }
  }
