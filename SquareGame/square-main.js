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
	resetGame();
	popTutorial();
}; 

G.F.mainAI = function () {
    if(gamestate == "on") {
        // decrement timer and advance game tick (game time, not physical time)
        timer -= 1;
        gameTick += 1;
    }
	G.O.explosion.AI();
    if(timer <= 0 && gamestate == "on") {
        clearSquares(0 , 0 , row , column);
        // show name picker UI and save to leaderboard when confirmed
        showNamePicker(score);
        gamestate = "off";
        document.title = "I got " + score + " in Square Game,Can you beat me?";
    }else if(timer > 0) {
        squareManage();    
        // update dashboard via centralized updater
        if (typeof updateDashboard === 'function') updateDashboard();
    }

	if(G.O.viewport.tagContainsMouseClick() && gamestate == "off" && isTouched == false){
		resetGame();
	}

	if(G.O.tutorial.tagContainsMouseClick() && isTouched == false) {
		if( gamestate == "on")
			popTutorial();
		else if (gamestate == "pause")
			resumeGame();
	}
};

G.makeBlock('main', G.F.loadMain).loadBlock('main');
