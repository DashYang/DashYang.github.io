var row = 10,
  column = 6;
var maxLevel = 6;
var lastx = -100,
  lasty = -100;
var gametimer = 1000;
var ansx1 = -100,
  ansy1 = -100,
  ansx2 = -100,
  ansy2 = -100;
var viewportwidth = 300,
  viewportheight = 520;
var squareside = 40,
  squaremargin = 4;
var squaretop = 18,
  squareleft = 20;
var helpheight = 48;
// Hint/power-up configuration
var hintUses = 3; // default number of hints available per run
// Leaderboard configuration
var leaderboardSize = 5; // keep top N scores in localStorage

// Text configuration (easy to change / localize)
var I18N = {
  timeLabel: "Time",
  scoreLabel: "Score",
  gameOverTitle: "Game Over",
  youGot: "You got",
  confirmText: "Confirm",
  skipText: "Skip",
  // 在 JS 中使用 Unicode 转义符
  upText: "\uFE3F", // ︿
  downText: "\uFE40", // ﹀
  tutorialStart: "start",
  tutorialResume: "resume",
  tutorialLook: "LOOK",
  // small control labels
  startControl: "Start",
  stopControl: "Stop",
  // tutorial overlay title and points label
  stageTitle: "Stage Info",
  pointsLabel: "Pts:",
  // leaderboard
  leaderboardTitle: "Leaderboard",
  leaderboardEmpty: "(no scores yet)",
  leaderboardAnon: "---",
  rankLabel: "Rank",
  rankNotInTop: "Out of Top",
  rankSavedPrefix: "Saved as",
  // tutorial image alt text
  tutorialImageAlt: "tutorial",
  // stage intro + hint texts
  stage1Intro: "Find a rectangle with the same four squares.",
  stage1Hint: "Tip: Tap Start to begin.",
  stage2Intro: "Stage 1: You will receive extra time bonuses based on your recent performance.",
  stage2Hint: "Tip: Clear faster to gain more time.",
  stage3Intro: "Stage 2: No extra time bonuses will be awarded now.",
  stage3Hint: "Tip: Focus on accuracy and speed.",
  stage4Intro: "Final Stage: Everything will change soon, hurry up and good luck!",
  stage4Hint: "Tip: The board refreshes periodically.",
  // control labels
  resumeControl: "Resume",
  refreshLabel: "Refresh",
  // bonus labels (use {pts}/{sec} placeholders)
  ptsBonusLabel: "+{pts} pts",
  secBonusLabel: "+{sec} sec",
  // share title template
  shareTitle: "I got {score} in Square Game,Can you beat me?",
};

// Debug flag: when true, enables verbose TESTLOG console output
var debugMode = true;

// Timer safeguards: when true, start/stop stage timers will clear existing timers
// before creating new ones to avoid duplicates. Can be turned off for testing.
var timerSafeguards = true;

// Phase / gameplay configuration
var phaseDurationSec = 20; // seconds before moving to next phase
var phase1HintIntervalSec = 5; // phase1 hint periodic interval
var phase3RefreshIntervalSec = 3; // phase3 (stage4) board refresh interval (default 3s)

// Step texts shown on pause (configurable)
var step1Text =
  "Step 1: You will receive extra time bonuses based on your recent performance.";
var step1PtsLabel = "+{pts} pts";
var step1SecLabel = "+{sec} sec";
var step2Text = "Step 2: No extra time bonuses will be awarded now.";
var step3Text =
  "Final Step: Everything will change soon, hurry up and good luck!";
// First-run tutorial text to display alongside t1.png
var tutorialFirstText =
  "find a rectangle in this picture which has the same four squares, click 1,4 or 2,3 to get score";
