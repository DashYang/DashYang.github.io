
function getSquareType() {
    return Math.floor(Math.random() * 6); 
} 

// Phase control variables
var phaseIndex = 1; // 1,2,3
var phaseTimerId = null;
var phaseHintTimerId = null;
var phase3RefreshTimerId = null;
// track last clear in game ticks (not physical time)
var lastClearTick = 0;
// prevent map-regeneration / auto-refresh from interfering while user has a selection
var selectionPending = false;
var selectionTimeoutId = null;
var selectionTimeoutMs = 5000; // ms before auto-clearing selection state
// whether the actual gameplay timers/cycles have been started
var gameStarted = false;

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
        function valToChar(v){ return String.fromCharCode(65 + (v|0)); }
        function generateAlphaStripHTML() { var s=''; for (var z=0;z<26;z++) s += '<span>' + String.fromCharCode(65+z) + '</span>'; return s; }

        // build HTML with visible up/down buttons for each letter column (better for touch)
        var html = '<div style="text-align:center; color:#fff;">'
            + '<h1 style="color:#FFD700; text-shadow:0 0 8px #fff">' + (I18N && I18N.gameOverTitle ? I18N.gameOverTitle : 'Game Over') + '</h1>'
            + '<h2 style="color:#FF8C00">' + (I18N && I18N.youGot ? I18N.youGot : 'You got') + '</h2>'
            + '<h1 style="font-size:48px; color:#00FF99">' + ((I18N && I18N.pointsLabel) ? I18N.pointsLabel + ' ' : '') + scoreValue + '</h1>'
            + '<div class="name-picker">'
            + '<div class="name-columns">'
            + '<div class="letter-col"><button class="letter-up" data-idx="0"><i class="arrow"></i></button><span id="letter0" class="letter"><span class="strip">' + generateAlphaStripHTML() + '</span></span><button class="letter-down" data-idx="0"><i class="arrow"></i></button></div>'
            + '<div class="letter-col"><button class="letter-up" data-idx="1"><i class="arrow"></i></button><span id="letter1" class="letter"><span class="strip">' + generateAlphaStripHTML() + '</span></span><button class="letter-down" data-idx="1"><i class="arrow"></i></button></div>'
            + '<div class="letter-col"><button class="letter-up" data-idx="2"><i class="arrow"></i></button><span id="letter2" class="letter"><span class="strip">' + generateAlphaStripHTML() + '</span></span><button class="letter-down" data-idx="2"><i class="arrow"></i></button></div>'
            + '</div>'
            + '<div style="margin-top:8px;"><button id="confirmName">' + (I18N && I18N.confirmText ? I18N.confirmText : 'Confirm') + '</button> <button id="skipName">' + (I18N && I18N.skipText ? I18N.skipText : 'Skip') + '</button></div>'
            + '</div>'
            + renderLeaderboardHTML()
            + '</div>';

        G.O.viewport.setSrc(html).draw();

        // internal state for letter indices
        var vals = [0,0,0];
        function updateStrip(idx){
            var l = document.getElementById('letter'+idx);
            if (!l) return;
            var strip = l.querySelector('.strip');
            if (strip) strip.style.transform = 'translateY(' + (-vals[idx] * 48) + 'px)';
        }
        for (var i=0;i<3;i++) updateStrip(i);

        // attach up/down handlers
        var ups = document.querySelectorAll('.letter-up');
        for (var k=0;k<ups.length;k++) {
            (function(btn){
                btn.addEventListener('click', function(e){
                    var idx = parseInt(btn.getAttribute('data-idx'),10)||0;
                    // pressing up moves to previous letter visually
                    vals[idx] = (vals[idx] + 25) % 26;
                    updateStrip(idx);
                });
            })(ups[k]);
        }
        var downs = document.querySelectorAll('.letter-down');
        for (var k=0;k<downs.length;k++) {
            (function(btn){
                btn.addEventListener('click', function(e){
                    var idx = parseInt(btn.getAttribute('data-idx'),10)||0;
                    vals[idx] = (vals[idx] + 1) % 26;
                    updateStrip(idx);
                });
            })(downs[k]);
        }

        document.getElementById('confirmName').addEventListener('click', function(){
            try {
                var name = valToChar(vals[0]) + valToChar(vals[1]) + valToChar(vals[2]);
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
            // only trigger when game is running and hints available and we're in phase 1
            if (gamestate !== 'on') return;
            if (phaseIndex !== 1) return;
            if ((window._hintRemaining || 0) <= 0) return;
            // ensure we have an available rectangle and ansx/ansy set
            if (enable() == 0) return;
            // use the same visual effect as manual showHint(): flash the four corner squares
            try {
                // set LOOK indicator and mark auto-hint active so UI shows LOOK during flash
                try { if (G.O && G.O.tutorial) G.O.tutorial.setSrc("<p class='tutorial'>" + (I18N && I18N.tutorialLook ? I18N.tutorialLook : 'LOOK') + "</p>").draw(); } catch(e){}
                window._autoHintActive = true;
                if (showHint()) {
                    // consume one hint
                    window._hintRemaining = Math.max(0, (window._hintRemaining || 0) - 1);
                    try { updateDashboard(); } catch(e){}
                    try { pulseHintIcons(); } catch(e){}
                }
                // after the flash duration, revert tutorial text and auto-hint flag
                 setTimeout(function(){
                     try { if (G.O && G.O.tutorial) G.O.tutorial.setSrc("<p class='tutorial'>" + (I18N && I18N.tutorialHelp ? I18N.tutorialHelp : 'HELP!') + "</p>").draw(); } catch(e){}
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
        var timeText = "<p class='time'>" + (I18N && I18N.timeLabel ? I18N.timeLabel : 'Time') + ":" + Math.max(0, Math.ceil((timer + 1) / 25)) + "</p>";
        var scoreText = "<p class='score'>" + (I18N && I18N.scoreLabel ? I18N.scoreLabel : 'Score') + ":" + score + "</p>";
        var pointsLabel = (I18N && I18N.pointsLabel) ? I18N.pointsLabel + ' ' : '';
        var html = timeText + "<span class='score'>" + pointsLabel + score + "</span>" + renderLeaderboardHTML();
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

function createSquares(y1 , x1 , y2 , x2, pts, secBonus) {
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
        // show both pts and sec bonus if available
        var ptsText = (typeof pts === 'number' && pts > 0) ? ('+' + pts + ' pts') : '';
        var secText = (typeof secBonus === 'number' && secBonus > 0) ? ('+' + secBonus + ' sec') : '';
        pop.innerText = (ptsText + (ptsText && secText ? '  ' : '') + secText) || ('+' + ( (Math.abs(lastx - sx) + 1) * (Math.abs(lasty - sy) + 1) ));
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
            // compute pts per new formula: (width-1)*(height-1)
            var width = columnumber, height = rownumber;
            var pts = Math.max(0, (width - 1) * (height - 1));
            score += pts;
            // compute time bonus only in phase 1
            var secBonus = 0;
            try {
                if (phaseIndex === 1) {
                    // compute elapsed in game seconds (gameTick counts ticks; 25 ticks per second)
                    var elapsedTicks = (typeof gameTick !== 'undefined' ? gameTick : 0) - (lastClearTick || 0);
                    var elapsedSec = Math.floor(elapsedTicks / 25);
                    secBonus = Math.max(0, Math.min(5, 5 - elapsedSec));
                    // convert seconds to timer ticks (25 ticks per second)
                    timer += secBonus * 25;
                }
            } catch(e) { secBonus = 0; }
            // record last clear in game ticks
            var prevLastClear = lastClearTick;
            lastClearTick = (typeof gameTick !== 'undefined' ? gameTick : 0);
            try { console.log('[TESTLOG] clear: pts=', pts, ' secBonus=', secBonus, ' prevLastClear=', prevLastClear, ' gameTick=', (typeof gameTick !== 'undefined' ? gameTick : 0), ' elapsedTicks=', ((typeof gameTick !== 'undefined' ? gameTick : 0) - (prevLastClear || 0)), ' elapsedSec=', Math.floor(((typeof gameTick !== 'undefined' ? gameTick : 0) - (prevLastClear || 0))/25), ' newLastClear=', lastClearTick); } catch(e) {}
			G.O.explosion.setVar({x:sx, y:sy , w:bx-sx+25 , h:by-sy+25}).AI('reset').turnOn();
            clearSquares(lasty , lastx , rowIndex , columnIndex);
            createSquares(lasty , lastx , rowIndex , columnIndex, pts, secBonus);
            // successful clear: cancel pending selection timeout and clear selectionPending
            try { if (selectionTimeoutId) { clearTimeout(selectionTimeoutId); selectionTimeoutId = null; } } catch(e) {}
            selectionPending = false;
            if(level > 1 && score > (maxLevel - level + 1) * 100)
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
    // mark that there is a pending selection; start/reset a timeout to clear it
    try { if (selectionTimeoutId) { clearTimeout(selectionTimeoutId); selectionTimeoutId = null; } } catch(e) {}
    selectionPending = true;
    try {
        selectionTimeoutId = setTimeout(function(){
            try {
                // remove visual picked marker and clear selection
                var s = G.O['square'+(lasty * column + lastx)];
                if (s) s.removeClass('picked').draw();
            } catch(e) {}
            lastx = -100; lasty = -100;
            selectionPending = false;
            selectionTimeoutId = null;
        }, selectionTimeoutMs);
    } catch(e) {}
    try { resetInactivityTimer(); } catch(e) {}
}

function resetGame() {
    $("#viewport").remove();
    // If this is the first run (startFlag true), keep the game paused until the user presses Start
    timer = gametimer;
    score = 0;
    // reset gameStarted flag; actual timers start only when gameplay officially begins
    gameStarted = false;
    if (startFlag) {
        gamestate = "pause";
    } else {
        gamestate = "on";
    }
    // allow viewport clicks to start a new game again
    isTouched = false;
    // initialize hint counter for this run
    window._hintRemaining = hintUses || 0;
    // auto-hint active flag
    window._autoHintActive = false;
    // clear any pending selection state
    try { if (selectionTimeoutId) { clearTimeout(selectionTimeoutId); selectionTimeoutId = null; } } catch(e) {}
    selectionPending = false;
    lastx = -100; lasty = -100;
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
        .setSrc("<div class='tutorial'>" + ((startFlag && I18N && I18N.startControl) ? I18N.startControl : 'Tutoria') + "</div>")
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

    // Only actually draw the board and start timers if this is not the first-run tutorial.
    if (!startFlag) {
        resumeGame();
        try { startInactivityTimer(); } catch(e) {}
        // initialize phase cycle
        phaseIndex = 1;
        // initialize lastClearTick to current gameTick (gameTick may be zero at start)
        lastClearTick = (typeof gameTick !== 'undefined' ? gameTick : 0);
        try { console.log('[TESTLOG] resetGame: init lastClearTick=', lastClearTick, ' gameTick=', (typeof gameTick !== 'undefined' ? gameTick : 0)); } catch(e) {}
        try { startPhaseCycle(); } catch(e) {}
        gameStarted = true;
    } else {
        // for first run we still initialize lastClearTick but do not start timers
        phaseIndex = 1;
        lastClearTick = (typeof gameTick !== 'undefined' ? gameTick : 0);
    }

    G.makeGob('explosion',G.O.viewport)
		.setState({frame:0})
		.setVar({x:-100, y:-100, w:4, h:12, AI:G.F.explosionAI})
		.setStyle({border:'3px solid red'})
		.turnOn();		
}

// Phase control: start/stop cycle and handlers
function startPhaseCycle() {
    // clear any existing timers
    try { if (phaseTimerId) clearTimeout(phaseTimerId); } catch(e) {}
    try { if (phaseHintTimerId) clearInterval(phaseHintTimerId); } catch(e) {}
    try { if (phase3RefreshTimerId) clearInterval(phase3RefreshTimerId); } catch(e) {}
    // schedule phase advancement
    try {
        phaseTimerId = setTimeout(function(){ advancePhase(); }, (phaseDurationSec || 20) * 1000);
    } catch(e) {}
    // start phase-specific behaviors
    if (phaseIndex === 1) {
        // periodic hints every configured seconds
        try {
            phaseHintTimerId = setInterval(function(){
                if (gamestate !== 'on') return;
                if ((window._hintRemaining || 0) <= 0) return;
                if (enable() == 0) return;
                if (showHint()) { window._hintRemaining = Math.max(0, (window._hintRemaining||0) - 1); try{ updateDashboard(); }catch(e){} }
            }, (phase1HintIntervalSec || 5) * 1000);
        } catch(e){}
    }
    if (phaseIndex === 3) {
        // refresh board every configured seconds ensuring single solution
        try {
            phase3RefreshTimerId = setInterval(function(){
                if (gamestate !== 'on') return;
                // if player currently has a selection pending, skip auto-refresh to avoid invalidating the pick
                if (selectionPending) return;
                // regenerate until exactly one solution exists
                var attempts = 0;
                do { initMap(); attempts++; } while(enable() !== 1 && attempts < 30);
                refreshScreen();
            }, (phase3RefreshIntervalSec || 2) * 1000);
        } catch(e){}
    }
}

function advancePhase() {
    try {
        // move to next phase up to 3
        phaseIndex = Math.min(3, (phaseIndex || 1) + 1);
        // restart phase cycle behaviors
        try { if (phaseHintTimerId) { clearInterval(phaseHintTimerId); phaseHintTimerId = null; } } catch(e) {}
        try { if (phase3RefreshTimerId) { clearInterval(phase3RefreshTimerId); phase3RefreshTimerId = null; } } catch(e) {}
        // if entering phase3, start its refresh timer
        if (phaseIndex === 3) {
            try { startPhaseCycle(); } catch(e) {}
        } else {
            // schedule next advancement
            try { phaseTimerId = setTimeout(function(){ advancePhase(); }, (phaseDurationSec || 20) * 1000); } catch(e) {}
            // start phase1 hint timer if back to phase1
            if (phaseIndex === 1) try { startPhaseCycle(); } catch(e) {}
        }
    } catch(e) { console.log('advancePhase error', e); }
}

function stopPhaseCycle() {
    try { if (phaseTimerId) clearTimeout(phaseTimerId); phaseTimerId = null; } catch(e) {}
    try { if (phaseHintTimerId) clearInterval(phaseHintTimerId); phaseHintTimerId = null; } catch(e) {}
    try { if (phase3RefreshTimerId) clearInterval(phase3RefreshTimerId); phase3RefreshTimerId = null; } catch(e) {}
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
    // If in phase 3, do not allow pause/tutorial overlay
    if (phaseIndex === 3) return;
    gamestate = "pause";
    // cancel any pending selection to avoid leaving stray pick visuals
    try { if (selectionTimeoutId) { clearTimeout(selectionTimeoutId); selectionTimeoutId = null; } } catch(e) {}
    selectionPending = false;
    lastx = -100; lasty = -100;
    clearSquares(0 , 0 , row , column);
    var bigside = squareside + squaremargin;
    G.O.tutorialboard.swapClass("tutorialboardOff" , "tutorialboardOn").draw();
    var tipInfo = "";
    var wasFirst = (startFlag == true);
    if (wasFirst) {
        // first-time tutorial: show the tutorial image + descriptive text
        var imgHtml = '';
        try { imgHtml = "<div class='tutorial-film'><img src='t1.png' alt='tutorial' class='tutorial-img' /></div>"; } catch(e) { imgHtml = ''; }
        tipInfo = imgHtml + "<p class='tutorial tutorial-first'>" + (typeof tutorialFirstText !== 'undefined' ? tutorialFirstText : (I18N && I18N.tutorialStart ? I18N.tutorialStart : 'start')) + "</p>";
        // mark that we've shown the first-run tutorial
        startFlag = false;
    } else {
        // show step text based on current phase
        if (phaseIndex === 1) tipInfo = "<p class='tutorial'>" + (typeof step1Text !== 'undefined' ? step1Text : 'Step 1: You will receive extra time bonuses based on your recent performance.') + "</p>";
        else if (phaseIndex === 2) tipInfo = "<p class='tutorial'>" + (typeof step2Text !== 'undefined' ? step2Text : 'Step 2: No extra time bonuses will be awarded now.') + "</p>";
        else tipInfo = "<p class='tutorial'>" + (typeof step3Text !== 'undefined' ? step3Text : 'Final Step: Everything will change soon — hurry up and good luck!') + "</p>";
    }
    // show tipInfo on the large tutorial board
    var titleText = (I18N && I18N.tutorialTitle) ? I18N.tutorialTitle : 'Tutorial';
    try { G.O.tutorialboard.setSrc("<center><h3>" + titleText + "</h3>" + tipInfo).draw(); } catch(e){}
    // after showing overlay, set the small tutorial control: Start for first-run, Stop otherwise
    try {
        if (G.O && G.O.tutorial) {
            var ctrl = wasFirst ? ((I18N && I18N.startControl) ? I18N.startControl : 'Start') : ((I18N && I18N.stopControl) ? I18N.stopControl : 'Stop');
            G.O.tutorial.setSrc("<p class='tutorial'>" + ctrl + "</p>").draw();
        }
    } catch(e){}
}

function resumeGame() {
	if(gamestate == "pause") {
		gamestate = "on";
		G.O.tutorialboard.setSrc("").swapClass("tutorialboardOn" , "tutorialboardOff").draw();
        // set the small control label: if this was the first run we had startFlag true before popTutorial; after first run show Stop
        try {
            var label = (I18N && I18N.stopControl) ? I18N.stopControl : 'Stop';
            G.O.tutorial.setSrc("<p class='tutorial'>" + label + "</p>").draw();
        } catch(e) {}
	}
    // if game was not started yet (first-run), start timers and phase cycle now
    if (!gameStarted) {
        try { startInactivityTimer(); } catch(e) {}
        try { phaseIndex = 1; } catch(e) {}
        try { lastClearTick = (typeof gameTick !== 'undefined' ? gameTick : 0); } catch(e) {}
        try { startPhaseCycle(); } catch(e) {}
        gameStarted = true;
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
