function squareManage() {
	for (var i = 0 ; i < row ; i ++)
	{
		for(var j = 0; j < column; j ++)
		{
			var square = G.O['square'+(i * column + j)];	
			if ( square.tagContainsMouseClick() && isTouched == false)
			{
				squareHandler(square);
			}
		}
	}	
}

G.F.explosionAI = function (cmd) {
	var t = this, F;
    if (cmd == 'reset') {
        t.setState({frame:0}).setVar({ tx:0, ty:0, tw:0, th:0 }).draw();
    }
    else {
        if (!t.on) {
            return t;
        }
        F=t.S.frame;
        if (F < 4) {
            t.setVar({ x:t.x - (F*F+1), y:t.y - (F*F+1), w:t.w + (F*F*2+2), h:t.h+(F*F*2+2) }).draw();
        }
        else {
            t.turnOff();
        }
        t.S.frame++;
    }
    return t;
};
