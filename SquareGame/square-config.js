var row  = 10 , column = 6;
var maxLevel = 6
var lastx = -100 ,lasty = -100;
var gametimer = 1000 ;
var ansx1 = -100 ,ansy1 = -100 , ansx2 = -100 , ansy2 = -100;
var viewportwidth = 300 , viewportheight = 520;
var squareside = 40 , squaremargin = 4;
var squaretop = 18, squareleft = 20;
var helpheight = 48;
// Hint/power-up configuration
var hintUses = 3; // default number of hints available per run
// Leaderboard configuration
var leaderboardSize = 5; // keep top N scores in localStorage

// Text configuration (easy to change / localize)
var I18N = {
    timeLabel: 'Time',
    scoreLabel: 'Score',
    gameOverTitle: 'Game Over',
    youGot: 'You got',
    confirmText: 'Confirm',
    skipText: 'Skip',
    // 在 JS 中使用 Unicode 转义符
    upText: '\uFE3F',   // ︿
    downText: '\uFE40', // ﹀
    tutorialStart: 'start',
    tutorialResume: 'resume',
    tutorialHelp: 'HELP!',
    tutorialLook: 'LOOK',
    // small control labels
    startControl: 'Start',
    stopControl: 'Stop',
    // tutorial overlay title and points label
    tutorialTitle: 'Tutorial',
    pointsLabel: 'Pts:'
};

// Phase / gameplay configuration
var phaseDurationSec = 20; // seconds before moving to next phase
var phase1HintIntervalSec = 5; // phase1 hint periodic interval
var phase3RefreshIntervalSec = 2; // phase3 board refresh interval

// Step texts shown on pause (configurable)
var step1Text = 'Step 1: You will receive extra time bonuses based on your recent performance.';
var step1PtsLabel = '+{pts} pts';
var step1SecLabel = '+{sec} sec';
var step2Text = 'Step 2: No extra time bonuses will be awarded now.';
var step3Text = 'Final Step: Everything will change soon — hurry up and good luck!';
// First-run tutorial text to display alongside t1.png
var tutorialFirstText = "find a rectangle in this picture which has the same four squares, click 1,4 or 2,3 to get score";
