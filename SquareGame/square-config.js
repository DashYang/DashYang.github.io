var row = 8,
  column = 6;
var maxLevel = 6;
var lastx = -100,
  lasty = -100;
var gametimer = 1000;
var viewportwidth = 300,
  viewportheight = 432;
var squareside = 40,
  squaremargin = 4;
var squaretop = 18,
  squareleft = 20;
var helpheight = 48;
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
    stageTitle: "How to Play",
    pointsLabel: "Pts:",
    leaderboardTitle: "Leaderboard",
    leaderboardEmpty: "(no scores yet)",
    leaderboardAnon: "---",
    rankLabel: "Rank",
    rankNotInTop: "Out of Top",
    rankSavedPrefix: "Saved as",
    tutorialImageAlt: "Tutorial",
    stage1Intro: "Find a rectangle with four matching corners.",
    stage1Hint: "Tap any corner to clear the largest rectangle containing it.",
    tutorialDemoCaption: "Tap one valid corner to clear its largest rectangle",
    tileLabels: [
      "Mark - Student Years",
      "Panny",
      "Liu Xiaoyu",
      "Zhang Jingyi - Student Years",
      "Zhou Zheng",
      "Zack",
    ],
    pauseCastTitle: "Cast Notes",
    pauseCastEntries: [
      { type: 0, name: "Mark", blurb: "Student years, dreaming of a big studio" },
      { type: 1, name: "Panny", blurb: "Fiery teacher, that awful noise" },
      { type: 3, name: "Jingyi", blurb: "Student years, nearly missed graduation" },
      { type: 4, name: "Zhou Zheng", blurb: "New hire who doesn't sleep well at night" },
      { type: 5, name: "Zack", blurb: "Studio veteran who blogs every day" },
      { type: 2, name: "Liu Xiaoyu", blurb: "Support girl, a product-loving fujoshi" },
    ],
    stage2Intro: "Stage 1: You can earn time bonuses based on recent performance.",
    stage2Hint: "Tip: Tap one valid corner. A distorted tile is always ready to clear.",
    stage3Intro: "Stage 2: Time bonus is disabled. Gravity refills always leave a move.",
    stage3Hint: "Tip: Watch falling tiles and supernatural mutations to keep your combo alive.",
    resumeControl: "Resume",
    comboLabel: "COMBO x{n}",
    firepowerLabel: "FIREPOWER x2 · {sec}s",
    firepowerFuseLabel: "COMBO INTERVAL {sec}s",
    firepowerToast: "FIREPOWER! SCORE x2",
    ptsBonusLabel: "+{pts} pts",
    secBonusLabel: "+{sec} sec",
    shareTitle: "I got {score} in Square Game, can you beat me?",
    shareButton: "Share score",
    sharePreparing: "Building your score card...",
    shareOpened: "Publisher opened. Attach this mini tool before posting.",
    shareUnavailable: "Open this game in Xiaohongshu to share.",
    shareFailed: "Sharing was cancelled or unavailable. Your score is safe.",
    shareHint: "In the publisher, attach this mini tool so friends can play.",
    shareNoteTitle: "Square Game: {score} pts",
    shareNoteContent: "I scored {score} in Square Game. Can you beat me?",
    sharePosterTitle: "SQUARE GAME",
    sharePosterChallenge: "CAN YOU BEAT MY SCORE?",
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
    stageTitle: "游戏玩法",
    pointsLabel: "分数:",
    leaderboardTitle: "排行榜",
    leaderboardEmpty: "(暂无记录)",
    leaderboardAnon: "---",
    rankLabel: "排名",
    rankNotInTop: "未上榜",
    rankSavedPrefix: "已保存为",
    tutorialImageAlt: "教程",
    stage1Intro: "找到四角相同的矩形。",
    stage1Hint: "点击任意一角，自动消除包含它的最大矩形。",
    tutorialDemoCaption: "点击一个有效角，消除包含它的最大矩形",
    tileLabels: [
      "Mark-学生时代",
      "Panny",
      "刘小雨",
      "张静祎-学生时代",
      "周正",
      "Zack",
    ],
    pauseCastTitle: "角色小传",
    pauseCastEntries: [
      { type: 0, name: "Mark", blurb: "学生时代，怀揣大厂梦" },
      { type: 1, name: "Panny", blurb: "麻辣教师，可恶的噪音" },
      { type: 3, name: "静祎", blurb: "学生时代，差点被延毕" },
      { type: 4, name: "周正", blurb: "新人入职，晚上睡不好" },
      { type: 5, name: "Zack", blurb: "大厂老炮，日常写博客" },
      { type: 2, name: "刘小雨", blurb: "客服小妹，腐女爱产品" },
    ],
    stage2Intro: "阶段1：根据你的操作速度，可以获得时间加成。",
    stage2Hint: "提示：点一个有效角即可；发生灵异畸变的棋子必然可以消除。",
    stage3Intro: "阶段2：不再提供时间加成；重力补块后始终至少有一组可消除。",
    stage3Hint: "提示：观察落点与灵异畸变，保持连击节奏。",
    resumeControl: "继续",
    comboLabel: "连击 x{n}",
    firepowerLabel: "火力全开 x2 · {sec}秒",
    firepowerFuseLabel: "连击间隔 {sec}秒",
    firepowerToast: "火力全开！得分翻倍",
    ptsBonusLabel: "+{pts} 分",
    secBonusLabel: "+{sec} 秒",
    shareTitle: "我在 Square Game 获得了 {score} 分，你能超过吗？",
    shareButton: "晒成绩",
    sharePreparing: "正在生成成绩海报…",
    shareOpened: "已打开发布页，请确认挂载本小工具。",
    shareUnavailable: "请在小红书小工具中打开后分享。",
    shareFailed: "已取消或暂时无法分享，成绩仍会保留。",
    shareHint: "发布时请确认挂载本小工具，好友即可直接挑战。",
    shareNoteTitle: "极速方块 {score} 分",
    shareNoteContent: "我在极速方块拿到了 {score} 分，你能超过我吗？",
    sharePosterTitle: "极速方块",
    sharePosterChallenge: "你能超过我的分数吗？",
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
var debugForceMutation = false; // visual QA only: force the survivor-mutation fallback

// Timer safeguards: when true, start/stop stage timers will clear existing timers
// before creating new ones to avoid duplicates. Can be turned off for testing.
var timerSafeguards = true;

// Phase / gameplay configuration
var phaseDurationSec = 20; // seconds before moving from the bonus phase to the final ruleset
var autoHintIdleSec = 3; // show one valid corner after this many clear-free gameplay seconds
var comboWindowSec = 4.5; // max gameplay seconds between clears; animation time is excluded
var firepowerFuseStartSec = 4.5; // early-game time to find the next clear
var firepowerFuseMinSec = 2; // late-game floor for the clear-to-clear fuse
var firepowerFuseDecayPerClear = 0.12; // inverse-curve acceleration per completed clear
var gravityFallStartDurationMs = 1000; // first clear: slow enough to read the falling board
var gravityFallMinDurationMs = 360; // late-game floor: keep the current fall speed
var gravityFallDecayPerClear = 0.12; // inverse-curve acceleration per completed clear
var matchPreviewDurationMs = 210; // freezes gameplay time before the rectangle clears
var mutationDurationMs = 620; // supernatural survivor transformation; also freezes gameplay time
var invalidTapCooldownMs = 220;
var invalidTapFusePenaltySec = 0.3;
var phaseOneTileTypeCount = 5;
var finalPhaseTileTypeCount = 6;
var refillPlanAttempts = 40;
var refillMinMatches = 3;
var refillMinUniqueAnchors = 8;
var refillCompactMaxSpan = 3;
