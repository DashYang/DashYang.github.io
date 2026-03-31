function squareManage() {
	for (var i = 0 ; i < row ; i ++)
	{
		for(var j = 0; j < column; j ++)
		{
            var square = G.O['square'+(i * column + j)];
            if (square && typeof square.tagContainsMouseClick === 'function' && square.tagContainsMouseClick() && isTouched == false) {
                try { squareHandler(square); } catch(e) { console.log('squareHandler error', e); }
            }
		}
	}	
}

G.F.explosionAI = function (cmd) {
    // Improved explosion animation: expand + fade
    var t = this, F;
    if (cmd == 'reset') {
        t.setState({frame:0}).setVar({ tx:0, ty:0, tw:0, th:0 }).setStyle({backgroundColor:'rgba(255,80,60,0.9)', border:'0px'}).draw();
    }
    else {
        if (!t.on) {
            return t;
        }
        F = t.S.frame;
        // animate for 8 frames total
        if (F < 8) {
            // ease-out like growth
            var growth = Math.floor((F*F + 2) * 1.5);
            var alpha = Math.max(0, 0.9 - (F * 0.12));
            t.setVar({ x: t.x - growth/2, y: t.y - growth/2, w: t.w + growth, h: t.h + growth }).setStyle({opacity: alpha, backgroundColor: 'rgba(255,120,60,'+alpha+')'}).draw();
        } else {
            t.turnOff();
        }
        t.S.frame++;
    }
    return t;
};
