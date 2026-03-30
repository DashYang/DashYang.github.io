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
