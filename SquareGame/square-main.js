var gamestate = "on";
var map;
var timer = gametimer;
var score = 0;
var isTouched = false;
var startFlag = true;
var level = maxLevel;
// gameTick counts game ticks (same unit as timer). 25 ticks == 1 visible second.
var gameTick = 0;

G.F.loadMain = function () {
  this.AI = G.F.mainAI;
  // resetGame/popTutorial are defined in square-tools.js; it's possible this loader
  // runs before that script is evaluated in some load orders. Guard and wait a short
  // time for resetGame to become available to avoid a ReferenceError.
  if (typeof resetGame === "function") {
    resetGame();
    try {
      popTutorial();
    } catch (e) {}
  } else {
    var _attempts = 0;
    var _waiter = setInterval(function () {
      _attempts++;
      if (typeof resetGame === "function") {
        clearInterval(_waiter);
        try {
          resetGame();
        } catch (e) {
          console.log("resetGame error", e);
        }
        try {
          popTutorial();
        } catch (e) {}
      } else if (_attempts > 60) {
        // ~3s
        clearInterval(_waiter);
        console.log(
          "resetGame not available after waiting; skipping initial reset"
        );
      }
    }, 50);
  }
};

G.F.mainAI = function () {
  try {
    if (gamestate == "on") {
      // decrement timer and advance game tick (game time, not physical time)
      timer -= 1;
      gameTick += 1;
    }
    // run explosion animation AI (guarded; explosion gob may not exist immediately)
    try {
      if (G.O && G.O.explosion && typeof G.O.explosion.AI === "function")
        G.O.explosion.AI();
    } catch (e) {}
    if (timer <= 0 && gamestate == "on") {
      clearSquares(0, 0, row, column);
      // show end-of-game screen (may allow name entry if score qualifies)
      try {
        showEndScreen(score);
      } catch (e) {
        console.log("showEndScreen error", e);
      }
      gamestate = "off";
      var shareTitle =
        I18N && I18N.shareTitle
          ? I18N.shareTitle
          : "I got {score} in Square Game,Can you beat me?";
      document.title = shareTitle.replace("{score}", score);
    } else if (timer > 0) {
      // main per-frame logic
      try {
        squareManage();
      } catch (e) {
        console.log("squareManage error", e);
      }
      // update dashboard via centralized updater
      try {
        if (typeof updateDashboard === "function") updateDashboard();
      } catch (e) {
        console.log("updateDashboard error", e);
      }
    }

    try {
      if (
        G.O.viewport &&
        G.O.viewport.tagContainsMouseClick &&
        G.O.viewport.tagContainsMouseClick() &&
        gamestate == "off" &&
        isTouched == false
      ) {
        resetGame();
      }
    } catch (e) {}

    try {
      if (
        G.O.tutorial &&
        G.O.tutorial.tagContainsMouseClick &&
        G.O.tutorial.tagContainsMouseClick() &&
        isTouched == false
      ) {
        if (gamestate == "on") popTutorial();
        else if (gamestate == "pause") resumeGame();
      }
    } catch (e) {}
  } catch (err) {
    // Catch any unexpected error to avoid bubbling into the engine master loop
    console.log("G.F.mainAI uncaught error", err);
    try {
      gamestate = "off";
    } catch (e) {}
    try {
      showEndScreen(score);
    } catch (e) {}
  }
};

G.makeBlock("main", G.F.loadMain).loadBlock("main");
