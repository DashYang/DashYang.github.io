
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

// -----------------------------
// Leaderboard (localStorage)
// -----------------------------
function saveScore(scoreValue) {
    try {
        var key = 'squaregame_leaderboard';
        var list = JSON.parse(localStorage.getItem(key) || '[]');
        list.push({score: scoreValue, t: (new Date()).toISOString()});
        // sort desc and keep top leaderboardSize
        list.sort(function(a,b){ return b.score - a.score; });
        list = list.slice(0, leaderboardSize);
        localStorage.setItem(key, JSON.stringify(list));
    } catch(e) {
        console.log('saveScore error', e);
    }
}

// new: save score with 3-char name
function saveScoreWithName(scoreValue, name) {
    try {
        var key = 'squaregame_leaderboard';
        var list = JSON.parse(localStorage.getItem(key) || '[]');
        var n = (name || '').toString().toUpperCase().substring(0,3) || '---';
        list.push({score: scoreValue, t: (new Date()).toISOString(), name: n});
        list.sort(function(a,b){ return b.score - a.score; });
        list = list.slice(0, leaderboardSize);
        localStorage.setItem(key, JSON.stringify(list));
    } catch(e) {
        console.log('saveScore error', e);
    }
}

function getLeaderboard() {
    try {
        var key = 'squaregame_leaderboard';
        var list = JSON.parse(localStorage.getItem(key) || '[]');
        return list;
    } catch(e) {
        return [];
    }
}

function renderLeaderboardHTML() {
    var list = getLeaderboard();
    var html = '<div class="leaderboard"><h4>Leaderboard</h4>';
    if (list.length == 0) html += '<div class="leaderboard-item">(no scores yet)</div>';
    for (var i = 0; i < list.length; i++) {
        var it = list[i];
        var name = (it.name && it.name.length > 0) ? it.name : '---';
        html += '<div class="leaderboard-item">' + (i+1) + '. <span style="color:#fff; font-weight:bold;">' + name + '</span> &nbsp; <span style="color:#FFD700; font-weight:bold;">' + it.score + '</span> &nbsp; <span style="color:#ccc; font-size:10px">' + it.t.split('T')[0] + '</span></div>';
    }
    html += '</div>';
    return html;
}

// show a name picker UI (3 sliders A-Z) and save score when confirmed
function showNamePicker(scoreValue) {
    try {
        gamestate = 'off';
        // prevent viewport click from instantly restarting; only Confirm/Skip will call resetGame()
        isTouched = true;
        var html = '<div style="text-align:center; color:#fff;">'
            + '<h1 style="color:#FFD700; text-shadow:0 0 8px #fff">Game Over</h1>'
            + '<h2 style="color:#FF8C00">You got</h2>'
            + '<h1 style="font-size:48px; color:#00FF99">' + scoreValue + '</h1>'
            + '<div class="name-picker">'
        + '<div><span id="letter0" class="letter"><span class="strip">' + generateAlphaStripHTML() + '</span></span>'
        + '<span id="letter1" class="letter"><span class="strip">' + generateAlphaStripHTML() + '</span></span>'
        + '<span id="letter2" class="letter"><span class="strip">' + generateAlphaStripHTML() + '</span></span></div>'
            + '<div>'
            + '<input id="slider0" class="slider" type="range" min="0" max="25" value="0">'
            + '<input id="slider1" class="slider" type="range" min="0" max="25" value="0">'
            + '<input id="slider2" class="slider" type="range" min="0" max="25" value="0">'
            + '</div>'
            + '<div style="margin-top:8px;"><button id="confirmName">Confirm</button> <button id="skipName">Skip</button></div>'
            + '</div>'
            + renderLeaderboardHTML()
            + '</div>';
        G.O.viewport.setSrc(html).draw();
        // attach listeners
        function valToChar(v){ return String.fromCharCode(65 + (v|0)); }
        function generateAlphaStripHTML() { var s=''; for (var z=0;z<26;z++) s += '<span>' + String.fromCharCode(65+z) + '</span>'; return s; }
        for (var i=0;i<3;i++) {
            (function(idx){
                var s = document.getElementById('slider'+idx);
                var l = document.getElementById('letter'+idx);
                if (!s || !l) return;
                s.addEventListener('input', function(e){
                    var v = parseInt(e.target.value,10)||0;
                    // animate strip translate
                    var strip = l.querySelector('.strip');
                    if (strip) {
                        strip.style.transform = 'translateY(' + (-v * 48) + 'px)';
                    }
                });
            })(i);
        }
        document.getElementById('confirmName').addEventListener('click', function(){
            try {
                var a = document.getElementById('slider0').value;
                var b = document.getElementById('slider1').value;
                var c = document.getElementById('slider2').value;
                var name = valToChar(a) + valToChar(b) + valToChar(c);
                saveScoreWithName(scoreValue, name);
            } catch(e) { saveScoreWithName(scoreValue, ''); }
            // restart a new game after confirming name
            try { resetGame(); } catch(e) { G.O.viewport.setSrc(renderLeaderboardHTML()).draw(); }
        });
        document.getElementById('skipName').addEventListener('click', function(){
            saveScoreWithName(scoreValue, '');
            try { resetGame(); } catch(e) { G.O.viewport.setSrc(renderLeaderboardHTML()).draw(); }
        });
    } catch(e) { console.log('showNamePicker error', e); }
}

function pulseHintIcons() {
    setTimeout(function(){
        var nodes = document.querySelectorAll('#hintArea .hint-icon');
        if (!nodes) return;
        for (var i = 0; i < nodes.length; i++) {
            (function(n){
                n.classList.remove('pulse');
                void n.offsetWidth; // reflow
                n.classList.add('pulse');
            })(nodes[i]);
        }
    }, 10);
}

// Inactivity hint timer: after N ms of no user action, automatically show a dim hint
function clearInactivityTimer() {
    try {
        if (window._inactivityTimer) {
            clearTimeout(window._inactivityTimer);
            window._inactivityTimer = null;
        }
    } catch (e) {}
}

function startInactivityTimer() {
    clearInactivityTimer();
    try {
        // 5000ms = 5s
        window._inactivityTimer = setTimeout(function(){
            // only trigger when game is running and hints available
            if (gamestate !== 'on') return;
            if ((window._hintRemaining || 0) <= 0) return;
            // ensure we have an available rectangle and ansx/ansy set
            if (enable() == 0) return;
            // use the same visual effect as manual showHint(): flash the four corner squares
            try {
                // set LOOK indicator and mark auto-hint active so UI shows LOOK during flash
                try { if (G.O && G.O.tutorial) G.O.tutorial.setSrc("<p class='tutorial'>LOOK</p>").draw(); } catch(e){}
                window._autoHintActive = true;
                if (showHint()) {
                    // consume one hint
                    window._hintRemaining = Math.max(0, (window._hintRemaining || 0) - 1);
                    try { updateDashboard(); } catch(e){}
                    try { pulseHintIcons(); } catch(e){}
                }
                // after the flash duration, revert tutorial text and auto-hint flag
                setTimeout(function(){
                    try { if (G.O && G.O.tutorial) G.O.tutorial.setSrc("<p class='tutorial'>HELP!</p>").draw(); } catch(e){}
                    window._autoHintActive = false;
                }, 1200);
            } catch(e) {
                console.log('auto-hint showHint error', e);
            }
            // restart timer for future inactivity
            startInactivityTimer();
        }, 5000);
    } catch (e) {
        console.log('startInactivityTimer error', e);
    }
}

function resetInactivityTimer() {
    clearInactivityTimer();
    startInactivityTimer();
}

// centralized dashboard updater
function updateDashboard() {
    try {
        var dash = G.O['dashboard'];
        if (!dash) return;
        var timeText = "<p class='time'>Time:" + (Math.max(0, Math.floor(timer/25) + 1)) + "</p>";
        var scoreText = "<p class='score'>Score:" + score + "</p>";
        var html = timeText + "<span class='score'>" + score + "</span>" + renderLeaderboardHTML();
        dash.setSrc(html).draw();
        // no manual hint button - auto-hint only
    } catch (e) {
        console.log('updateDashboard error', e);
    }
}

// -----------------------------
// Hint feature
// -----------------------------
function showHint() {
    // ensure there is an answer
    if (enable() == 0) return false;
    // highlight the four corner squares briefly
    var ids = [];
    ids.push(ansy1 * column + ansx1);
    ids.push(ansy1 * column + ansx2);
    ids.push(ansy2 * column + ansx1);
    ids.push(ansy2 * column + ansx2);
    for (var k = 0; k < ids.length; k++) {
        var gob = G.O['square' + ids[k]];
        if (gob) gob.addClass('hint').draw();
    }
    // remove hint after 1.2s
    setTimeout(function(){
        for (var k = 0; k < ids.length; k++) {
            var gob = G.O['square' + ids[k]];
            if (gob) gob.removeClass('hint').draw();
        }
    }, 1200);
    return true;
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

function createSquares(y1 , x1 , y2 , x2, delta) {
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
    // show pop +delta above the cleared rectangle (or below if would overflow)
    try {
        var firstEl = document.getElementById('square' + (sy * column + sx));
        var lastEl = document.getElementById('square' + (by * column + bx));
        var pop = document.getElementById('scorePop');
        if (!pop) {
            pop = document.createElement('div');
            pop.id = 'scorePop';
            pop.className = 'score-pop';
            document.body.appendChild(pop);
        }
        pop.innerText = (delta > 0 ? '+' + delta : '+' + ( (Math.abs(lastx - sx) + 1) * (Math.abs(lasty - sy) + 1) ));
        // compute placement
        if (firstEl && lastEl) {
            var r1 = firstEl.getBoundingClientRect();
            var r2 = lastEl.getBoundingClientRect();
            var left = Math.max(0, (r1.left + r2.right) / 2);
            var topAbove = r1.top - 10; // margin
            var popH = 60; // approx, CSS handles exact
            var placeAbove = (topAbove - popH) > 0;
            if (placeAbove) {
                pop.style.left = (left) + 'px';
                pop.style.top = (r1.top - 50) + 'px';
            } else {
                pop.style.left = (left) + 'px';
                pop.style.top = (r2.bottom + 8) + 'px';
            }
        } else {
            pop.style.left = '50%';
            pop.style.top = '12%';
        }
        pop.classList.remove('animate');
        void pop.offsetWidth;
        pop.classList.add('animate');
    } catch(e) {}
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
            var delta = rownumber * columnumber;
            score += delta;
			timer += 125;   //bonus time : 5s
			G.O.explosion.setVar({x:sx, y:sy , w:bx-sx+25 , h:by-sy+25}).AI('reset').turnOn();
            clearSquares(lasty , lastx , rowIndex , columnIndex);
            createSquares(lasty , lastx , rowIndex , columnIndex, delta);
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
    try { resetInactivityTimer(); } catch(e) {}
}

function resetGame() {
    $("#viewport").remove();
    gamestate = "on";
    timer = gametimer;
    score = 0;
    // initialize hint counter for this run
    window._hintRemaining = hintUses || 0;
    // auto-hint active flag
    window._autoHintActive = false;
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
		
    var helpwidth = (column*bigside - squaremargin)/2;
    // create tutorial and dashboard before resumeGame so resumeGame can access dashboard gob
    G.makeGob('tutorial', G.O.viewport)
        .setVar({x:squareleft , y:(squaretop + row * bigside),w:(helpwidth - 2) , h:helpheight })
        .setSrc("<div class='tutorial'>Tutoria</div>")
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

    resumeGame();
    try { startInactivityTimer(); } catch(e) {}

	G.makeGob('explosion',G.O.viewport)
		.setState({frame:0})
		.setVar({x:-100, y:-100, w:4, h:12, AI:G.F.explosionAI})
		.setStyle({border:'3px solid red'})
		.turnOn();		
}

// wire global user interactions to reset inactivity timer so auto-hint doesn't trigger while user is active
try {
    document.addEventListener('click', function(){ try{ resetInactivityTimer(); }catch(e){} }, false);
    document.addEventListener('touchstart', function(){ try{ resetInactivityTimer(); }catch(e){} }, false);
    document.addEventListener('mousemove', function(){ try{ resetInactivityTimer(); }catch(e){} }, false);
} catch(e) {}

// start inactivity timer on load (the timer itself checks gamestate and hint availability)
try { startInactivityTimer(); } catch(e) {}

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
        G.O.tutorial.setSrc("<p class='tutorial'>Tutoria</p>").draw();
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

    // update dashboard using centralized updater
    updateDashboard();
}
}
