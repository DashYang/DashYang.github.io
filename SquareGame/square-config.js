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
var I18N_PACKS = {
  en: {
    timeLabel: "Time",
    scoreLabel: "Score",
    gameOverTitle: "Game Over",
    youGot: "You got",
    confirmText: "Confirm",
    skipText: "Skip",
    upText: "\uFE3F",
    downText: "\uFE40",
    tutorialStart: "Start",
    tutorialResume: "Resume",
    tutorialLook: "LOOK",
    startControl: "Start",
    stopControl: "Stop",
    stageTitle: "Stage Info",
    pointsLabel: "Pts:",
    leaderboardTitle: "Leaderboard",
    leaderboardEmpty: "(no scores yet)",
    leaderboardAnon: "---",
    rankLabel: "Rank",
    rankNotInTop: "Out of Top",
    rankSavedPrefix: "Saved as",
    tutorialImageAlt: "Tutorial",
    stage1Intro: "Find a rectangle whose four corners are the same tile.",
    stage1Hint: "Tip: Tap either diagonal pair to clear.",
    stage2Intro: "Stage 1: You can earn time bonuses based on recent performance.",
    stage2Hint: "Tip: Clear faster to gain more time.",
    stage3Intro: "Stage 2: Time bonus is disabled in this stage.",
    stage3Hint: "Tip: Final stage is next. Keep your rhythm.",
    stage4Intro: "Final Stage: The board refreshes periodically.",
    stage4Hint: "Tip: Stay focused and react quickly.",
    stage4ResumeHint: "Tap the bottom-left button to continue.",
    stage3TransitionToast: "Final stage starts soon.",
    resumeControl: "Resume",
    refreshLabel: "Refresh",
    comboLabel: "COMBO x{n}",
    ptsBonusLabel: "+{pts} pts",
    secBonusLabel: "+{sec} sec",
    shareTitle: "I got {score} in Square Game, can you beat me?",
  },
  zh: {
    timeLabel: "时间",
    scoreLabel: "得分",
    gameOverTitle: "游戏结束",
    youGot: "你获得了",
    confirmText: "确认",
    skipText: "跳过",
    upText: "\uFE3F",
    downText: "\uFE40",
    tutorialStart: "开始",
    tutorialResume: "继续",
    tutorialLook: "提示",
    startControl: "开始",
    stopControl: "暂停",
    stageTitle: "阶段说明",
    pointsLabel: "分数:",
    leaderboardTitle: "排行榜",
    leaderboardEmpty: "(暂无记录)",
    leaderboardAnon: "---",
    rankLabel: "排名",
    rankNotInTop: "未上榜",
    rankSavedPrefix: "已保存为",
    tutorialImageAlt: "教程",
    stage1Intro: "找出四角相同的矩形。",
    stage1Hint: "提示：点击任意一组对角即可消除。",
    stage2Intro: "阶段1：根据你的操作速度，可以获得时间加成。",
    stage2Hint: "提示：'Run, Forrest, Run!'",
    stage3Intro: "阶段2：此阶段不再提供时间加成。",
    stage3Hint: "提示：'起风了'。",
    stage4Intro: "终局：方块会定期刷新。",
    stage4Hint: "提示：‘不要温和的走进那个良夜’。",
    stage4ResumeHint: "请点击左下角按钮继续。",
    stage3TransitionToast: "终局阶段即将开始",
    resumeControl: "继续",
    refreshLabel: "刷新",
    comboLabel: "连击 x{n}",
    ptsBonusLabel: "+{pts} 分",
    secBonusLabel: "+{sec} 秒",
    shareTitle: "我在 Square Game 获得了 {score} 分，你能超过吗？",
  },
};

function detectLanguage() {
  try {
    var m = window.location.search.match(/[?&]lang=(zh|en)\b/i);
    if (m && m[1]) return m[1].toLowerCase();
  } catch (e) { console.error("[square-config] caught error", e); }
  // Default to Chinese when no explicit query param is provided.
  return "zh";
}

var LANG = detectLanguage();
var I18N = I18N_PACKS[LANG] || I18N_PACKS.en;

// Debug flag: when true, enables verbose TESTLOG console output
var debugMode = false;

// Timer safeguards: when true, start/stop stage timers will clear existing timers
// before creating new ones to avoid duplicates. Can be turned off for testing.
var timerSafeguards = true;

// Phase / gameplay configuration
var phaseDurationSec = 20; // seconds before moving to next phase
var phase1HintIntervalSec = 5; // phase1 hint periodic interval
var phase3RefreshIntervalSec = 3; // phase3 (stage4) board refresh interval (default 3s)
var stage4PreviewLeadSec = 5; // show stage4 preview this many seconds before stage4 starts
var stage4WarmupSec = 5; // first refresh delay after entering stage4 intro
var comboWindowSec = 4; // max seconds between clears to keep combo streak
