/**
 *
 * GogoMakePlay Game Engine v1.7.4
 * Copyright (c) 2006-2010 Trevor Cowley
 * http://gogomakeplay.com/
 *
 * Dual licensed under MIT and GPLv2 licenses:
 * http://gogomakeplay.com/licenses
 *
 * For the full documentation of this code, go to:
 * http://gogomakeplay.com/gmp/api
 *
 */


/********* G *********/

var G = {
    // this is set of Gob properties ported to G, which allows G to be the root gob. 
    // don't delete or change their values.
    id:null,x:0,y:0,z:0,on:1,CO:{},tag:document.getElementsByTagName('body').item(0),
    
    loopReference:  null,
    iteration:  0,
    interval:  40,  
    paused: 0,
    hooks:  { stop: {}, preAI: {}, postAI: {}, system: {}},
    S:  {},                    // global game state
    
    B:  {},                    // global set of blocks
    cBid:  null,               // current block ID
    lBid:  null,               // last block ID
    
    O:  {},                    // global set of gobs
    
    F:  {},                    // global name space for game functions 
    cookieId: 'G',             // change this to the name of your game
    cookies:  {}, 
    tmp:  {},
    mediaURL: ''               // if the HTML page loading the game doesn't have the same URL path as 
                               // files loaded by game code (usually sprite images), then set G.mediaURL to
                               // the URL path to the images.
}; 

G.masterLoop = function () {  
    var fn;
    G.loopReference = setTimeout(G.masterLoop, G.interval);
    if (!G.paused) {
        G.iteration++;
        for (fn in G.hooks.preAI) { G.hooks.preAI[fn](); }
        G.B[G.cBid].AI();
        for (fn in G.hooks.postAI) { G.hooks.postAI[fn](); }
    } 
    for (fn in G.hooks.system) { G.hooks.system[fn](); }
    return G;
};

G.addHook = function (name, fn, type) { 
    G.hooks[type][name]=fn;
    return G;
};

G.deleteHook = function (name, type) { 
    delete G.hooks[type][name];
    return G;
};

G.pause = function () { 
    G.paused = 1;
    return G;
};

G.unpause = function () { 
    G.paused = 0;
    return G;
};

G.makeBlock = function (id, load) {  
    G.B[id] = new G.Block(id); 
    if (load) G.B[id].load = load;
    return G;
};

G.loadBlock = function (id) {  
    if (G.cBid) G.B[G.cBid].unload();
    G.lBid = G.cBid;
    G.cBid = id;
    G.B[id].load();
    return G;
};

G.setState = function (O) {  
    for (var i in O) G.S[i] = O[i]; 
    return G;
};

G.makeGob = function (id, parentGob, tagName, parentTag) {  
    if (G.O[id]) G.deleteGob(id); // no duplicates. replace existing Gob.
    return new G.Gob(id, parentGob, tagName, parentTag);
};

// deleteGob does a basic delete; doesn't recurse or remove manually assigned events. 
G.deleteGob = function (id) { 
    var i;
    
    if (!G.O[id]) {
        return G;
    }

    // remove the Gob's tag from the DOM
    try { G.O[id].tag.parentNode.removeChild(G.O[id].tag); } catch(e){} 
    
    // delete standard references to Gobs so that id can be recycled.
    for (i in G.B)  delete G.B[i].O[id];
    for (i in G.O)  delete G.O[i].CO[id];
    delete G.O[id];
    delete G.CO[id]; 

    return G;
};

G.loadCookies = function () {  
    
    if (typeof G.cookieId != 'string' || !document.cookie) return;
    var i=0, cookie, arr = document.cookie.split(';'), re = new RegExp(unescape(G.cookieId) + '=');
    for (i=0; i<arr.length; i++) { 
      if (re.test(arr[i])) {
        cookie = unescape(arr[i].split('=')[1]);
        cookie = cookie.split(';');
        for (var i=0; i<cookie.length; i++) {
            G.cookies[cookie[i].split('=')[0]] = cookie[i].split('=')[1];
        }
        break;      
      }
    }
    return G;
};

G.saveCookies = function () {  
    var id, cookie = [], cookieStr; 
    for (id in G.cookies) cookie.push(id + '=' + G.cookies[id]);
    cookieStr=cookie.join(';'); 
    if (typeof G.cookieId != 'string' || typeof cookieStr != 'string' ) return;
    var expires = new Date();
    expires.setTime(expires.getTime() + 9999999999);
    document.cookie = escape(G.cookieId) + '=' + escape(cookieStr) + "; expires=" + expires.toGMTString() +"; path=/";
    return G;
};

// direction fns. 0º corresponds to 3 o'clock, and increases counter-clockwise 

G.dirY = function (degrees) { // returns y-component of a given direction's unit vector 
    // notice that y-axis is 'flipped' to match the orientation of the browser's cartesian plane
    // the result is fixed at 8 decimal places, so that a degree argument
    // equivalent to 180 returns 0 instead of a very small non-zero number.
    return -Math.sin(3.141592654*degrees/180).toFixed(8); 
};

G.dirX = function (degrees) { // returns x-component of a given direction's unit vector
    // the result is fixed at 8 decimal places, so that a degree argument
    // equivalent to 90 or 270 return 0 instead of a very small non-zero number.
    return Math.cos(3.141592654*degrees/180).toFixed(8); 
};

G.dirXY = function (x,y) { // returns the direction, in degrees, of any x,y vector. 
    return ((Math.atan2(-y,x)*57.2957795)+360)%360;
};

// Add game 'stop' hooks to window onunload function
if (typeof window.onunload == 'function') G.oldUnload = window.onunload; 
else  G.oldUnload = function () {};
window.onunload = function () { G.oldUnload(); for (var i in G.hooks.stop) G.hooks.stop[i](); };

/********* G.Block *********/

G.Block = function (id) {  
    this.id = id;
    this.S = {};         
    this.O = {};
    this.tmp = {};              
};

G.Block.prototype.setState = function (O) {  
    for (var i in O) this.S[i] = O[i]; 
    return this;
};

G.Block.prototype.AI = function () { return this; };
G.Block.prototype.load = function () { return this; };

G.Block.prototype.unload = function () { 
    for (var i in this.O) this.O[i].turnOff(); 
    return this; 
};

// Add a default block to prime the game engine object, then start the game loop.
G.makeBlock('defaultBlock').loadBlock('defaultBlock').masterLoop();


/********* G.Gob *********/

G.Gob=function (id, parentGob, tagName, parentTag) {  
    var t=this;
    
    t.on=0;   
    t.id=id;
    t.P=parentGob||G;      // not an id
    G.O[id]=t.P.CO[id]=t;  // add this gob to the parent gob and global gob
    
    t.B=null;  // reference to the current block, set manually
    t.CO={};   // child gobs of this gob
    t.S={};    // for advanced state info. used by t.AI();
    
    t.x=0;     // float       x-coord of gob
    t.y=0;     // float       y-coord of gob
    t.z=0;     // int         z-index of gob
    t.w=0;     // float       width   of gob
    t.h=0;     // float       height  of gob

    t.lx=0;    // float       last x-coord of gob -- set automatically. used to fix intersections.
    t.ly=0;    // float       last y-coord of gob -- set automatically. used to fix intersections.
    t.nx=0;    // float       next x-coord of gob -- set manually & automatically. used to move in increments and fix intersections.
    t.ny=0;    // float       next y-coord of gob -- set manually & automatically. used to move in increments and fix intersections.
    
    // The UI part of the Gob is an HTML tag.
    
    tagName=tagName||'DIV';
    t.tag = document.createElement(tagName.toUpperCase()); 
    (parentTag)? parentTag.appendChild(t.tag):t.P.tag.appendChild(t.tag);
    t.tag.id = t.id;
    t.tag.className = '';
    t.tag.style.position="absolute";
    t.tag.style.overflow="hidden";
    t.tag.style.margin="0";
    t.tag.style.padding="0";
    t.tag.style.display="none";

    t.nextStyle = {};      // set of key-value pairs assigned to t.tag on next call to draw()
    t.nextSrc   = null;    // IMG tags only. next IMG src of t.tag.
    t.nextVal   = null;    // FORM field tags only. next value property of t.tag.
    t.classes   = [];      // internal use only. contains a sorted array of class names assigned to t.tag.class;
    
    t.tx=0;                // int   tag x-offset from t.x
    t.ty=0;                // int   tag y-offset from t.y
    t.tw=0;                // int   tag width. for a sprite tile IMG, this is the width of the full IMG.
    t.th=0;                // int   tag height. for a sprite tile IMG, this is the height of the full IMG.
   
    t.cw=0;                // int   use with sprite tile IMG only. width of the sprite tile.
    t.ch=0;                // int   use with sprite tile IMG only. height of the sprite tile.
    t.cx=0;                // int   use with sprite tile IMG only. x-position in sprite tile grid (starts at zero)
    t.cy=0;                // int   use with sprite tile IMG only. y-position in sprite tile grid (starts at zero)

    t.docx=0;              // int   tag absolute x-position in the document. (set with calcAbsoluteTagPosition)
    t.docy=0;              // int   tag absolute y-position in the document. (set with calcAbsoluteTagPosition)
    
    t.drawX=t.drawY=t.drawZ=t.drawW=t.drawH=t.drawClip=t.drawClass=1; // draw() flags
};

G.Gob.prototype.AI=function(cmd) {  
    return this;
};

G.Gob.prototype.turnOn=function() {  
    this.on=1;
    this.tag.style.display='';
    this.draw(1);
    return this;
};

G.Gob.prototype.turnOff=function() {  
    this.on=0;
    this.tag.style.display='none';
    return this;
};

G.Gob.prototype.draw=function(force) {  
    var i, t=this;
    if (force) t.drawX=t.drawY=t.drawZ=t.drawW=t.drawH=t.drawClip=t.drawClass=1; // draw flags
  
    if (t.drawClass) {
        t.tag.className = t.classes.join(' ');
    } 
    if (t.nextSrc !== null) {
        if (t.tag.tagName == 'IMG')  t.tag.src=t.nextSrc;
        else t.tag.innerHTML=t.nextSrc;
        t.nextSrc = null;
    } 
    if (t.nextVal !== null) {
        t.tag.value = t.nextVal;
        t.nextVal = null;
    }
    if (t.drawY || t.drawClip)  t.tag.style.top=Math.round((t.y + t.ty) - t.cy*t.ch) + 'px'; 
    if (t.drawX || t.drawClip)  t.tag.style.left=Math.round((t.x + t.tx) - t.cx*t.cw) + 'px';
    if (t.drawW)  t.tag.style.width=Math.round(t.tw) + 'px'; 
    if (t.drawH)  t.tag.style.height=Math.round(t.th) + 'px';
    if (t.drawZ)   t.tag.style.zIndex= t.z; 
    if (t.drawClip && t.tag.tagName == 'IMG') {
        t.tag.style.clip="rect(" + 
        Math.round(t.ch*t.cy) + "px," +   
        Math.round(t.cw*(t.cx+1)) + "px," +   
        Math.round(t.ch*(t.cy+1)) + "px," +  
        Math.round(t.cw*t.cx) + "px)";  
    }
    for (var i in t.nextStyle) t.tag.style[i] = t.nextStyle[i]; 
    t.nextStyle = {};
    t.drawX=t.drawY=t.drawZ=t.drawW=t.drawH=t.drawClip=t.drawClass=0; // draw flags
    return this;
};

G.Gob.prototype.setVar=function(O) {  
    var i, j, k, x, t=this;
    for (i in O) { 
        switch (i) {
        case 'x': 
        case 'tx': 
            t[i] = O[i]; 
            t.drawX=1;
            break;
        case 'y': 
        case 'ty': 
            t[i] = O[i]; 
            t.drawY=1;
            break;
        case 'z': 
            t[i] = O[i]; 
            t.drawZ=1;
            break;
        case 'w':    // this resets tw & cw, unless they are also provided.
            t[i] = O[i]; 
            if (O.tw) { 
                t.tw = O.tw; 
                delete O.tw;
            } else {
                t.tw = O[i]; 
            }
            if (O.cw) { 
                t.cw = O.cw; 
                delete O.cw;
            } else {
                t.cw = O[i]; 
            }
            t.drawW=1;
            break;
        case 'h':    // this resets th & ch, unless they are also provided
            t[i] = O[i]; 
            if (O.th) { 
                t.th = O.th; 
                delete O.th;
            } else {
                t.th = O[i]; 
            }
            if (O.ch) { 
                t.ch = O.ch; 
                delete O.ch;
            } else {
                t.ch = O[i]; 
            }
            t.drawH=1;
            break;
        case 'tw': 
            t[i] = O[i]; 
            t.drawW=1;
            break;
        case 'th': 
            t[i] = O[i]; 
            t.drawH=1;
            break;
        case 'cx': 
        case 'cy': 
        case 'cw': 
        case 'ch': 
            t[i] = O[i]; 
            t.drawClip=1;
            break;
        case 'nextStyle':   
            for (j in O[i]) t[i][j] = O[i][j]; // add to object, don't overwrite.
            break;
        case 'addClass':   
            if (typeof O[i] == 'string') O[i] = [O[i]];
            for (j=0; j <O[i].length; j++) {
                x=1;
                for (k=0; k <t.classes.length; k++) {
                    if ((O[i][j] == t.classes[k])) {
                        x=0;
                        break;
                    }
                } 
                if (x) t.classes.push(O[i][j]);
            } 
            t.drawClass=1;
            break;
        case 'removeClass':   
            if (typeof O[i] == 'string') O[i] = [O[i]];
            for (j=0; j <O[i].length; j++) 
              for (k=0; k <t.classes.length; k++) 
                if ((O[i][j] == t.classes[k])) t.classes.splice(k,1);
            t.drawClass=1;
            break;
        default: 
            t[i] = O[i]; 
            break;
        }
    }
    return t;
};

G.Gob.prototype.setState=function(O) {  
    for (var i in O) this.S[i] = O[i]; 
    return this;
};

G.Gob.prototype.resetState=function(O) {  this.S={}; return this.setState(O); };

G.Gob.prototype.setStyle=function(O) {  return this.setVar({nextStyle:O}); };

G.Gob.prototype.addClass=function() {  return this.setVar({addClass:Array.prototype.slice.call(arguments)}); };

G.Gob.prototype.removeClass=function() {  return this.setVar({removeClass:Array.prototype.slice.call(arguments)}); };

G.Gob.prototype.swapClass=function(a,b) {  return this.setVar({removeClass:a, addClass:b}); };

G.Gob.prototype.setVal=function(str) {  return this.setVar({nextVal:str}); };

G.Gob.prototype.setSrc=function(str) {  return this.setVar({nextSrc:str}); };

G.Gob.prototype.calcAbsoluteTagPosition=function () { 
    var t=this, tag=t.tag;
    t.docx=t.docy=0;
    if (tag.offsetParent) {
        do {
            t.docx += tag.offsetLeft;
            t.docy += tag.offsetTop;
        } while (tag = tag.offsetParent) ;
    }
    return t;
};

G.Gob.prototype.tagContainsXY=function(x, y, skip) {  
    var t=this;
    if (!t.on) return 0;
    if (!skip) t.calcAbsoluteTagPosition();
    return  x <= (t.docx + t.tag.offsetWidth) && x >= t.docx  && y <= (t.docy + t.tag.offsetHeight) && y >= t.docy ;
};

G.Gob.prototype.tagContainsMouse=function() {  
    return this.tagContainsXY(G.M.x,G.M.y);
};

G.Gob.prototype.tagContainsMouseDown=function() {  
    return G.M.isPressed && this.tagContainsXY(G.M.down.x,G.M.down.y);
};

G.Gob.prototype.tagContainsMouseClick=function() {  
    return G.M.wasPressed && this.tagContainsXY(G.M.down.x,G.M.down.y) && this.tagContainsXY(G.M.up.x,G.M.up.y, true);
};

G.Gob.prototype.checkIntersection=function(gob) {   // requires same parent gob
    var t = this;
    return !(!gob.on || t.x + t.w < gob.x  ||  t.x > gob.x + gob.w  || t.y + t.h < gob.y  ||  t.y > gob.y + gob.h);
};

G.Gob.prototype.checkCollision=function(gob) {  // requires same parent gob. check if the two gobs are within 0.6px of each other.
    var t=this;
    return !(!gob.on || t.x + t.w < gob.x - 0.6 ||  t.x > gob.x + gob.w + 0.6 || t.y + t.h < gob.y - 0.6 ||  t.y > gob.y + gob.h + 0.6);
};

G.Gob.prototype.setXY=function(O) {  
    // similar to setVar, setXY automatically synchronizes (lx,ly), (x,y) and (nx,ny). 
    // use setXY to set x, y, nx & ny on a Gob if you are using incrementXY or fixIntersection on that Gob
    var i, t=this;
    for (i in O) {
        switch (i) {
        case 'x': // last, curr, next x,y are set together.
            t.lx=t.x;
            t.x=O[i];
            t.nx=O[i];
            if (O.y) {
                t.ly=t.y;
                t.y=O.y;
                t.ny=O.y;
                delete O.y; 
                t.drawY=1; 
            } else {
                t.ly=t.y;
                t.ny=t.y;
            }
            t.drawX=1; 
            break;
        case 'y': // last, curr, next x,y are set together.
            t.ly=t.y;
            t.y=O[i];
            t.ny=O[i];
            if (O.x) {
                t.lx=t.x;
                t.x=O.x;
                t.nx=O.x;
                delete O.x; 
                t.drawX=1; 
            } else {
                t.lx=t.x;
                t.nx=t.x;
            }
            t.drawY=1; 
            break;
        case 'nx': 
            t.lx=t.x;
            t.nx=O[i];
            break;
        case 'ny': 
            t.ly=t.y;
            t.ny=O[i];
            break;
        }
    }
    return t;
};

G.Gob.prototype.incrementXY=function() {  // moves (x,y) toward (nx,ny) maximum of w or h, whichever is smaller
    var t=this, i=(t.w < t.h)?t.w:t.h, x=t.nx-t.x, y=t.ny-t.y, n=Math.sqrt(x*x + y*y); 
    if (i<n) t.setVar({x:t.x+i*(x/n),y:t.y+i*(y/n)});
    else t.setVar({x:t.nx,y:t.ny});
    return t;
};

G.Gob.prototype.fixIntersection=function(gob) {  // requires same parent gob. back up just outside given gob
    var i=0, t=this, x, y, dx, dy, dir=G.dirXY(t.nx-t.lx,t.ny-t.ly);
    while (t.checkIntersection(gob) && i < 500) {
        dx=G.dirX(dir), dy=G.dirY(dir), x=t.x - 0.5*dx, y=t.y - 0.5*dy;
        t.setVar({x:x,y:y});
        i++;
    }
    t.setVar({nx:t.x, ny:t.y});
    return t;
};


/********* G.M *********/

G.M = {  
    on: 0, // mouse listener is on
    deselectGob: null, // set to a Gob, and mouse movement over that Gob will trigger a deselect.
    isPressed: 0,
    setWasPressed: 0, 
    x: 0, 
    y: 0,
    wasPressed: 0, // was pressed during the last loop Iteration.
    down: { x: 0, y: 0, t: 0, altKey: 0, ctrlKey: 0, shiftKey: 0, fired:0},
    up: { x: 0, y: 0, t: 0, altKey: 0, ctrlKey: 0, shiftKey: 0},
    hooks: { down: {}, up: {} }

}; 
    
G.M.addHook = function (name, fn, type) { 
    this.hooks[type][name] = fn;  
    return G.M;
};

G.M.deleteHook = function (name, type) { 
    delete this.hooks[type][name];
    return G.M;
};

G.M.start = function () {  
    
    if (typeof document.onmousedown == 'function') G.M.oldonmousedown = document.onmousedown; 
    else  G.oldonmousedown = function (e) {};
    document.onmousedown = function (e) { 
        G.oldonmousedown(e); 
        G.M.mouseDownEventHandler(e); 
        return 1;
    };
    
    if (typeof document.onmouseup == 'function') G.M.oldonmouseup = document.onmouseup; 
    else  G.oldonmouseup = function (e) {};
    document.onmouseup = function (e) { 
        G.oldonmouseup(e); 
        G.M.mouseUpEventHandler(e); 
        return 1;
    };
    
    if (typeof document.onmousemove == 'function') G.M.oldonmousemove = document.onmousemove; 
    else  G.oldonmousemove = function (e) {};
    document.onmousemove = function (e) { 
        G.oldonmousemove(e); 
        G.M.mouseMoveEventHandler(e); 
        return 1;
    };
    
    G.M.on = 1;
};

G.M.stop = function () {  
    document.onmousedown = null;
    document.onmouseup = null;
    document.onmousemove = null;
    G.M.on = 0;
};

G.addHook('stopMouse', G.M.stop, 'stop');

G.M.eventPosition = function (e) { 
    return e.pageX ?  [e.pageX, e.pageY] : 
    [ e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft, 
      e.clientY + document.body.scrollTop + document.documentElement.scrollTop];
};

G.M.mouseDownEventHandler = function (e) { 
    if (G.M.down.fired) return 1;
    e = e||window.event;
    var xy = G.M.eventPosition(e);
    G.M.isPressed = 1;
    G.M.setWasPressed = 0; 
    G.M.down.x = xy[0];
    G.M.down.y = xy[1];
    G.M.down.t = new Date().getTime();
    if (e.altKey)  G.M.down.altKey = 1;  else  G.M.down.altKey = 0; 
    if (e.ctrlKey)  G.M.down.ctrlKey = 1;  else  G.M.down.ctrlKey = 0; 
    if (e.shiftKey)  G.M.down.shiftKey = 1;  else  G.M.down.shiftKey = 0; 
    for (var fn in G.M.hooks.down)  G.M.hooks.down[fn](); 
    G.M.down.fired = 1;
    if (G.M.deselectGob) G.M.deselect();
    return 1;
};

G.M.mouseUpEventHandler = function (e) {  
    e = e||window.event;
    var xy = G.M.eventPosition(e);
    G.M.isPressed = 0;
    G.M.setWasPressed = 1;
    G.M.up.x = xy[0];
    G.M.up.y = xy[1];
    G.M.up.t = new Date().getTime();
    if (e.altKey)  G.M.up.altKey = 1;  else  G.M.up.altKey = 0; 
    if (e.ctrlKey)  G.M.up.ctrlKey = 1;  else  G.M.up.ctrlKey = 0; 
    if (e.shiftKey)  G.M.up.shiftKey = 1;  else  G.M.up.shiftKey = 0; 
    for (var fn in G.M.hooks.up) G.M.hooks.up[fn](); 
    if (G.M.deselectGob) G.M.deselect();
    G.M.down.fired = 0;
    return 1;
};

G.M.mouseMoveEventHandler = function (e) {  
    e = e||window.event;
    var xy = G.M.eventPosition(e);
    G.M.x = xy[0];
    G.M.y = xy[1];
    if (G.M.deselectGob) G.M.deselect();
    return 1;
};

G.M.deselect = function () {  // deselect mouse selections inside the game div, as they are ugly!
    if(G.M.deselectGob){
        if(G.M.deselectGob.tag){
            if(G.M.deselectGob == G || G.M.deselectGob.tagContainsMouse()){
                if(window.getSelection&&window.getSelection() && window.getSelection().removeAllRanges) window.getSelection().removeAllRanges();
                else if(document.selection&&document.selection.empty) try{ document.selection.empty()}catch(e){}
            }
        } 
        else{
            if(window.getSelection&&window.getSelection()&&window.getSelection().removeAllRanges)window.getSelection().removeAllRanges();
            else if(document.selection&&document.selection.empty)try{document.selection.empty()}catch(e){ }
        }
    }
};

G.M.syncWasPressed = function () { // sets wasPressed = 1 for one full loop iteration after mouseup. runs automatically.
    G.M.wasPressed = 0;
    if (G.M.setWasPressed) {
        G.M.wasPressed = 1;
        G.M.setWasPressed = 0;
    }
};

G.addHook('syncMouseWasPressed', G.M.syncWasPressed, 'system');

G.M.start();


/********* G.KB *********/

G.KB = {  
    on: 0,
    lastKey: {  
        ctrlKey: 0,
        altKey: 0,
        shiftKey: 0,
        keyStr: null,    
        code: 0
    }, 
    keys: {}, 
    codes: []
}; 

G.KB.start = function () {  
    document.onkeydown = this.keyDownEventHandler;
    document.onkeyup = this.keyUpEventHandler;
    G.KB.on = 1;
    return this;
};

G.KB.stop = function () {  
    document.onkeydown = null;
    document.onkeyup = null;
    G.KB.on = 0;
    return this;
};

G.addHook('stopKB', G.KB.stop, 'stop');

G.KB.getCharCode = function (keystr) {  
    if (!keystr)  return 0;  // null
    else if (keystr == 'LEFT')   return 37; 
    else if (keystr == 'UP')     return 38; 
    else if (keystr == 'RIGHT')  return 39; 
    else if (keystr == 'DOWN')   return 40; 
    else if (keystr == 'ESC')    return 27; 
    else if (keystr == 'SPACE')  return 32; 
    else if (keystr == 'ENTER')  return 13; 
    else return keystr.toUpperCase().charCodeAt(0); 
};
 
G.KB.addKeys = function () {  
    var i, keystr, arr = Array.prototype.slice.call(arguments);
    for (i = 0; i<arr.length; i++) {    
        keystr = arr[i].toUpperCase();  // e.keyCode is always the uppercase value.
        this.keys[keystr] = {
            on: 1,
            isPressed: 0,
            setWasPressed: 0,
            wasPressed: 0,
            altKey: 0,
            ctrlKey: 0,
            shiftKey: 0,
            keyStr: keystr,    // this is for retrieving the keystr from the code:   this.KB.codes[code].keyStr
            code: this.getCharCode(keystr),
            keyDownEvent: null,  
            keyUpEvent: null,  
            enable: function () {
                this.on = 1;
                return G.KB;
            },
            disable: function () {
                this.on = 0;
                return G.KB;
            },
            setKeyDownEvent: function (fn) {
                this.keyDownEvent = fn;
                return G.KB;
            },
            setKeyUpEvent: function (fn) {
                this.keyUpEvent = fn;
                return G.KB;
            }
        };
        this[keystr] = this.codes[this.keys[keystr].code] = this.keys[keystr];
    } 
    return this;
};

G.KB.removeKeys = function () {  
    var i, keystr, arr = Array.prototype.slice.call(arguments);
    for (i = 0; i<arr.length; i++) {    
        keystr = arr[i].toUpperCase();  // e.keyCode is always the uppercase value.
        delete this.codes[this.keys[keystr].code];
        delete this.keys[keystr];
        delete this[keystr];
    }
    return this;
};

G.KB.removeAllKeys = function () {  
    for (var keystr in this.keys) delete this[keystr];
    this.keys = {};
    this.codes = [];
    return this;
};

G.KB.keyDownEventHandler = function (e) { 
    var code;
    e = e||window.event;
    code = e.keyCode||e.which;
    if (code in G.KB.codes && G.KB.codes[code].on && !G.KB.codes[code].isPressed){
        G.KB.codes[code].isPressed = 1;
        G.KB.codes[code].setWasPressed = 0;
        G.KB.codes[code].wasPressed = 0;
        if (e.altKey) G.KB.codes[code].altKey = 1; else G.KB.codes[code].altKey = 0; 
        if (e.ctrlKey)  G.KB.codes[code].ctrlKey = 1; else G.KB.codes[code].ctrlKey = 0; 
        if (e.shiftKey)  G.KB.codes[code].shiftKey = 1; else G.KB.codes[code].shiftKey = 0; 
        if (G.KB.codes[code].keyDownEvent) G.KB.codes[code].keyDownEvent(); 
    }
    return 1;
};

G.KB.keyUpEventHandler = function (e) {  
    var code;
    e = e||window.event;
    code = e.keyCode||e.which;
    if(code in G.KB.codes && G.KB.codes[code].on){
        if (e.altKey) G.KB.codes[code].altKey = 1; else G.KB.codes[code].altKey = 0; 
        if (e.ctrlKey)  G.KB.codes[code].ctrlKey = 1; else G.KB.codes[code].ctrlKey = 0; 
        if (e.shiftKey)  G.KB.codes[code].shiftKey = 1; else G.KB.codes[code].shiftKey = 0; 
        G.KB.lastKey.altKey = G.KB.codes[code].altKey;
        G.KB.lastKey.ctrlKey = G.KB.codes[code].ctrlKey;
        G.KB.lastKey.shiftKey = G.KB.codes[code].shiftKey;
        G.KB.lastKey.code = G.KB.codes[code].code;
        G.KB.lastKey.keyStr = G.KB.codes[code].keyStr;
        G.KB.codes[code].isPressed = 0;
        G.KB.codes[code].setWasPressed = 1;
        if(G.KB.codes[code].keyUpEvent)  G.KB.codes[code].keyUpEvent(); 
    }

};

G.KB.syncWasPressed = function () { // sets wasPressed = 1 for one full loop iteration after keyup event. runs automatically.
    for  (var key in G.KB.keys) {
        G.KB.keys[key].wasPressed = 0;
        if (G.KB.keys[key].setWasPressed) {
            G.KB.keys[key].wasPressed = 1;
            G.KB.keys[key].setWasPressed = 0;
        } else if (!G.KB.keys[key].isPressed) {
            G.KB.keys[key].altKey = 0;
            G.KB.keys[key].ctrlKey = 0;
            G.KB.keys[key].shiftKey = 0;
        }
    }
};

G.addHook('syncKeyWasPressed', G.KB.syncWasPressed, 'system');

G.KB.start();

if (typeof window.onfocus == 'function') G.oldonfocus = window.onfocus; 
else  G.oldonfocus = function () {};
window.onfocus = function () { 
    G.oldonfocus();
    for  (var key in G.KB.keys) {
        G.KB.keys[key].wasPressed = 0;
        G.KB.keys[key].isPressed = 0;
        G.KB.keys[key].wasPressed = 0;
        G.KB.keys[key].setWasPressed = 0;
        G.KB.keys[key].altKey = 0;
        G.KB.keys[key].ctrlKey = 0;
        G.KB.keys[key].shiftKey = 0;
    }
};

