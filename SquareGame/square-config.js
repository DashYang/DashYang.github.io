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
    stage1Intro: "Find a rectangle with the same four corner tiles. Tap one diagonal pair to clear it.",
    stage1Hint: "Tip: Tap Start to begin.",
    stage2Intro: "Stage 1: You can earn time bonuses based on recent performance.",
    stage2Hint: "Tip: Clear faster to gain more time.",
    stage3Intro: "Stage 2: Time bonus is disabled in this stage.",
    stage3Hint: "Tip: Focus on accuracy and speed.",
    stage4Intro: "Final Stage: The board refreshes periodically.",
    stage4Hint: "Tip: Stay focused and react quickly.",
    resumeControl: "Resume",
    refreshLabel: "Refresh",
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
    stage1Intro: "找到一个四个顶点相同的矩形，点击对角两点即可消除。",
    stage1Hint: "提示：点击“开始”进入游戏。",
    stage2Intro: "第一阶段：根据你的操作速度，可以获得时间加成。",
    stage2Hint: "提示：'Run, Barry, Run!'",
    stage3Intro: "第二阶段：此阶段不再提供时间加成。",
    stage3Hint: "提示：'想要得到一样东西，就必须付出与之相等的代价'。",
    stage4Intro: "终局阶段：方块会定期刷新。",
    stage4Hint: "提示：‘不要温和的走进那个良夜’。",
    resumeControl: "继续",
    refreshLabel: "刷新",
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
