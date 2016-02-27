
function getSquareType() {
	return Math.floor(Math.random() * 6); 
} 

function initMap() {
	map = Array();
	for(var i = 0 ; i < row ; i ++)
	{
		map[i] = Array();
		for(var j = 0 ; j < column ; j ++)
		{
			map[i][j] = getSquareType();
		}
	}
	for(var i = 0 ; i < level ; i ++)
	{
		var y = Math.floor(Math.random() * (row - 1));
		var x = Math.floor(Math.random() * (column - 1));
		var h = Math.floor(Math.random() * (row - 1 - y));
		var w = Math.floor(Math.random() * (column - 1- x));
		var type = getSquareType();
		map[y][x] = map[y+h][x] = map[y][x+w] = map[y+h][x+w] = type;
	}
}

function refreshScreen() {
	for(var i = 0 ; i < row ; i ++)
		for(var j = 0 ; j < column ; j ++)
		{
			var square = G.O['square'+(i * column + j)];
			if (square == undefined)
				console.log(i + " " + j)
			square.swapClass(square.tag.className , 'square' + map[i][j]).draw();
			
		}

}

function enable(){
	var x1, y1 , x2 ,y2;
	var count = 0
	for(y1 = 0 ; y1 < row ; y1++)
	{
		for(x1 = 0 ; x1 < column ; x1++)
		{
			for(y2 = y1 + 1; y2 < row ; y2 ++)
			{
				for(x2 = x1 + 1; x2 < column ; x2++)
				{
					if(map[y1][x1] == map[y1][x2] &&
							map[y1][x2] == map[y2][x1] &&
							map[y2][x1] == map[y2][x2])
					{
						ansx1 = x1 , ansy1 = y1 , ansx2 = x2 , ansy2 = y2;
						count += 1;
					}
				}
			}
		}
	}
	return count;
}
	function isPicked() {
		if (lastx != -100 && lasty != -100) 
			return true;
		return false;
	}

	function isAcceptable(y1 , x1 , y2 , x2) {
		if(x1 == x2 || y1 == y2)
			return false;
		if(map[y1][x1] == map[y1][x2] 
				&& map[y1][x2] == map[y2][x2]
				&& map[y2][x2] == map[y2][x1])
			return true;
		return false
	}

function clearSquares(y1, x1 , y2, x2) {
	var sx = x1 ,sy = y1 ,bx = x2 , by = y2;
	if(x2 < x1) 
		sx = x2 , bx = x1;
	if(y2 < y1)
		sy = y2 , by = y1;

	for(var i = sy ; i <= by ; i ++)
		for(var j = sx ; j <= bx ; j ++)
		{
			var square = G.O['square'+(i * column + j)];
			if (square != null)
				square.turnOff();
		}
}

function createSquares(y1 , x1 , y2 , x2) {
	var sx = x1 ,sy = y1 ,bx = x2 , by = y2;
	if(x2 < x1) 
		sx = x2 , bx = x1;
	if(y2 < y1)
		sy = y2 , by = y1;
	for(var i = sy ; i <= by ; i ++)
		for(var j = sx ; j <= bx ; j ++)
		{
			var square = G.O['square'+(i * column + j)];
			var oldType = 'square'+map[i][j];
			map[i][j] = getSquareType();
			square.swapClass(oldType , 'square'+map[i][j]);
			square.turnOn();
		}
	lastx = -100 , lasty = -100;
}

function squareHandler(square) {
	var id = square.id.substring(square.id.indexOf('e') + 1);
	var columnIndex = id % column , rowIndex = Math.floor(id / column);
	if (isPicked()) 
	{
		var lastSquare = G.O['square'+(lasty * column + lastx)];
		lastSquare.removeClass('picked').draw();
		if(isAcceptable(lasty , lastx , rowIndex , columnIndex)) {
			var x1 = square.x , y1 = square.y , x2 = lastSquare.x , y2 = lastSquare.y;
			var sx = x1 ,sy = y1 , bx = x2 ,by = y2;
			if(x2 < x1)
				sx = x2 , bx = x1;
			if(y2 < y1)
				sy = y2 , by= y1;
			var	columnumber = Math.abs(lastx - columnIndex) + 1;
			var rownumber = Math.abs(lasty - rowIndex) + 1;
			score += rownumber * columnumber;
			timer += 125;   //bonus time : 5s
			G.O.explosion.setVar({x:sx, y:sy , w:bx-sx+25 , h:by-sy+25}).AI('reset').turnOn();
			clearSquares(lasty , lastx , rowIndex , columnIndex);
			createSquares(lasty , lastx , rowIndex , columnIndex);
			if(level > 1 & score > (maxLevel - level + 1) * 100)
				level -= 1;
		    while(enable() < level - 1)
			{
				initMap();
			}
			refreshScreen();
		}
	}
	lasty = rowIndex , lastx = columnIndex;
	square.addClass("picked").draw();
}

function resetGame() {
	$("#viewport").remove();
	gamestate = "on";
	timer = gametimer;
	score = 0;
	board = document.getElementById("gameboard");
	G.makeGob('viewport', G , 'div' , board)
		.setVar({w:viewportwidth, h:viewportheight , nextStyle:{position:'relative'}})
		.turnOn();
	$("#viewport").on('touchend',function(e){
			isTouched = true;
			if(gamestate == "off") {
				resetGame();
			}})
	var i , j;
	initMap();
	while(enable() < level - 1)
	{
		initMap();
	}
	var bigside = squareside + squaremargin;
	var tutorialboardWidth = (column*bigside) - squaremargin;
	var tutorialboardHeight =(row * bigside) - squaremargin; 
	G.makeGob('tutorialboard' , G.O.viewport)
		.setVar({x:squareleft,y:squaretop,w:tutorialboardWidth,h:tutorialboardHeight})
		.addClass("tutorialboardOff")	
		.turnOn();
		
	resumeGame();
	var helpwidth = (column*bigside - squaremargin)/2;
	G.makeGob('tutorial', G.O.viewport)
		.setVar({x:squareleft , y:(squaretop + row * bigside),w:(helpwidth - 2) , h:helpheight })
		.setSrc("<div class='tutorial'>HELP!</div>")
		.addClass('help')
		.turnOn();
	$("#tutorial").on('touchend',function(e){
			isTouched = true;
			if(gamestate == "on") 
				popTutorial();
			else if (gamestate == "pause")
				resumeGame();
			})

	G.makeGob('dashboard', G.O.viewport)
		.setVar({x:squareleft +  helpwidth + 2, y:(squaretop + row * bigside),w:helpwidth -2 , h:helpheight })
		.addClass('help')
		.turnOn();

	G.makeGob('explosion',G.O.viewport)
		.setState({frame:0})
		.setVar({x:-100, y:-100, w:4, h:12, AI:G.F.explosionAI})
		.setStyle({border:'3px solid red'})
		.turnOn();		
}

function popTutorial() {
	gamestate = "pause";
	clearSquares(0 , 0 , row , column);
	var bigside = squareside + squaremargin
	G.O.tutorialboard.setSrc("<center><h3>tutorial</h3><center>find a rectangle in this picture which has the same four squares<img src='t1.png' alt='pic1' class='img-rounded'><br>click 1,4 or 2,3 to get scores and bonus time!").swapClass("tutorialboardOff" , "tutorialboardOn").draw();
	var tipInfo = "";
	if (startFlag == true) {
		tipInfo = "<p class='tutorial'>start</p>";
		startFlag = false;
	}
	else 
		tipInfo = "<p class='tutorial'>resume</p>";
	G.O.tutorial.setSrc(tipInfo).draw();
}

function resumeGame() {
	if(gamestate == "pause") {
		gamestate = "on";
		G.O.tutorialboard.setSrc("").swapClass("tutorialboardOn" , "tutorialboardOff").draw();
		G.O.tutorial.setSrc("<p class='tutorial'>HELP!</p>").draw();
	}
	var bigside = squareside + squaremargin;
	for (i = 0 ; i < row ; i ++) 
	{
		for(j = 0; j < column ; j ++)
		{
			G.makeGob('square'+(i*column+j) , G.O.viewport )
				.setVar({x:(squareleft + j * bigside), y:(squaretop + i * bigside), h:squareside, w:squareside })
				.addClass('square'+map[i][j])
				.turnOn();
			$("#square"+(i*column+j)).on('touchend',function(e){
					isTouched = true;
					var id = $(this).attr("id");
					var square = G.O[id];
					squareHandler(square);
					})
		}
	}
}
