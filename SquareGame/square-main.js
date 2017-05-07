var gamestate = "on";
var map;
var timer = gametimer;
var score = 0;
var isTouched = false;
var startFlag = true;
var level = maxLevel;

G.F.loadMain = function () {
	this.AI = G.F.mainAI;
	resetGame();
	popTutorial();
}; 

G.F.mainAI = function () {
	if(gamestate == "on")
		timer -= 1;
	G.O.explosion.AI();
	if(timer <= 0 && gamestate == "on") {
		clearSquares(0 , 0 , row , column);
		G.O.viewport.
		setSrc('<br><br><h1>Game Over</h1><h3>you got</h3><h1>'+ score + "</h1><h2>Click</h2><h3>to</h3><h1>restart</h1>").draw();
	//	G.O.help.setStyle({backgroundColor:'#000000'}).draw();
		gamestate = "off";
		document.title = "I got " + score + " in Square Game,Can you beat me?";
	}else if(timer > 0) {
		squareManage();	
		var tutorial = G.O['tutorial'];
		var dashboard = G.O['dashboard'];
		dashboard.setSrc("<p class='time'>Time:" + (Math.floor(timer/25) + 1) + "</p><p class='score'>Score:" + score + "</p>" ).draw();	
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
