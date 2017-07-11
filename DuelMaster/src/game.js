(function(){

window.onload = function(){
    game.init();
}

var game = window.game = {
    width: 0,
    height: 0,

    asset: null,
    stage: null,
    ticker: null,
    state: null,
    score: 0,

    bg: null,
    ground: null,
    avatar:null,
    holdbacks: null,
    gameReadyScene: null,
    gameOverScene: null,
    bodyStatusText: null,
    borderMap: new Object(),
    minions: new Array(),

    init: function(){
        this.asset = new game.Asset();
        this.asset.on('complete', function(e){
            this.asset.off('complete');
            this.initStage();
        }.bind(this));
        this.asset.load();
    },

    initStage: function(){
        this.width = 2080;
        this.height = 1280;
        this.scale = 0.5;

        //舞台
        this.stage = new Hilo.Stage({
            renderType:'canvas',
            width: this.width,
            height: this.height,
            scaleX: this.scale,
            scaleY: this.scale
        });
        document.body.appendChild(this.stage.canvas);

        //启动计时器
        this.ticker = new Hilo.Ticker(60);
        this.ticker.addTick(Hilo.Tween);
        this.ticker.addTick(this.stage);
        this.ticker.start();

        //绑定交互事件
        this.stage.enableDOMEvent(Hilo.event.POINTER_START, true);
        this.stage.on(Hilo.event.POINTER_START, this.onUserInput.bind(this));

        document.addEventListener('keydown', function(e){
            this.avatar.body.isDead = false;
            if(e.keyCode === 87) this.onUserInput(e);
			if(e.keyCode === 65) this.onMoveLeft(e);
            if(e.keyCode === 83) this.onFalling(e);
            if(e.keyCode === 68) this.onMoveRight(e);
            if(e.keyCode === 74) this.onAttack(e);
            if(e.keyCode === 75) this.onFire(e);
            if(e.keyCode === 76) this.onDash(e);

        }.bind(this));
		document.addEventListener('keyup', function(e){
            if(e.keyCode === 65) this.onStopLeft(e);
            if(e.keyCode === 68) this.onStopRight(e);
		}.bind(this));

        //舞台更新
        this.stage.onUpdate = this.onUpdate.bind(this);

        //初始化
        this.initBackground();
        this.initScenes();
        this.initAvatar();
        this.initHoldbacks();
        this.initCurrentScore();
        this.initBirdStatusText();
        //准备游戏
        this.gameReady();
    },

    initBackground: function(){
        //背景
        var bgWidth = this.width * this.scale;
        var bgHeight = this.height * this.scale;
        document.body.insertBefore(Hilo.createElement('div', {
            id: 'bg',
            style: {
                background: 'url(images/bg.png) no-repeat',
                backgroundSize: bgWidth + 'px, ' + bgHeight + 'px',
                position: 'absolute',
                width: bgWidth + 'px',
                height: bgHeight + 'px'
            }
        }), this.stage.canvas);

        //地面
        this.ground = new Hilo.Bitmap({
            id: 'ground',
            image: this.asset.ground,
        }).addTo(this.stage);

        //设置地面的y轴坐标
        this.ground.y = this.height - this.ground.height;
		this.ground.width = bgWidth * 3;
        //移动地面
    },

    initCurrentScore: function(){
        //当前分数
        this.currentScore = new Hilo.BitmapText({
            id: 'score',
            glyphs: this.asset.numberGlyphs,
            text: 0
        }).addTo(this.stage);

        //设置当前分数的位置
        this.currentScore.x = this.width - this.currentScore.width >> 1;
        this.currentScore.y = 180;
    },

    initAvatar: function () {
        var bird = new game.Body({
            id: 'bird',
            atlas: this.asset.birdAtlas,
            startX: 470,
            startY: 811,
            maxHp: 3000,
            groundY: this.ground.y - 12
        });

        var blade = new game.Blade({
            id: 'blade',
            attackDamage: 100,
            image: this.asset.blade,
        });

        var bullet = new game.Bullet({
           id: 'bulltes',
           image: this.asset.bullet,
        });

        this.avatar = new game.Avatar({
            id: "player1",
            body: bird,
            blade: blade,
            bullet: bullet,
        }).addTo(this.stage, this.ground.depth - 1)
    },

    initHoldbacks: function(){
        this.holdbacks = new game.Holdbacks({
            id: 'holdbacks',
            image: this.asset.holdback,
            height: this.height,
            startX: this.width * 2,
            groundY: this.ground.y
        }).addTo(this.stage, this.ground.depth - 1);
    },
    
    initScenes: function(){
        //准备场景
        this.gameReadyScene = new game.ReadyScene({
            width: this.width,
            height: this.height,
            image: this.asset.ready
        }).addTo(this.stage);

    },

    initBirdStatusText: function() {
        var font = "30px arial";
        var content = "鸟的状态:";
        this.bodyStatusText = new Hilo.Text({
            font: font,
            text: content,
            color:"crimson",
            lineSpacing: 0,
            width: 500,
            height: 100,
            x: 40,
            y: 50
        }).addTo(this.stage);

    },
    
    createMinions: function () {
        var body = new game.Body({
            id: 'body',
            atlas: this.asset.birdAtlas,
            startX: 2000,
            startY: 120,
            maxHp: 200,
            groundY: 200 //第一个柱子
        });

        var blade = new game.Blade({
            id: 'blade',
            attackDamage: 50,
            image: this.asset.blade,
        });

        var bullet = new game.Bullet({
            id: 'bulltes',
            image: this.asset.bullet,
        });

        var minion = new game.Minion({
            id: "minion1",
            body: body,
            blade: blade,
            bullet: bullet,
        }).addTo(this.stage, this.ground.depth - 1)

        minion.getReady();
        minion.moveLeft();
        this.minions.push(minion);
    },

    onUserInput: function(e){
        if(this.state !== 'over'){
            //启动游戏场景
            if(this.state !== 'playing') this.gameStart();
            //控制小鸟往上飞
            this.avatar.startFly();
        }
    },
	
	onMoveRight: function(e){
        if(this.state !== 'over'){
            //启动游戏场景
            if(this.state !== 'playing') this.gameStart();
            //控制小鸟往上飞
            this.avatar.moveRight();
        }
    },

	onMoveLeft: function(e){
        if(this.state !== 'over'){
            //启动游戏场景
            if(this.state !== 'playing') this.gameStart();
            //控制小鸟往上飞
            this.avatar.moveLeft();
        }
    },

	onStopLeft: function(e){
        if(this.state !== 'over'){
            //启动游戏场景
            if(this.state !== 'playing') this.gameStart();
            //控制小鸟往上飞
            this.avatar.stopLeft();
        }
    },

	onStopRight: function(e){
        if(this.state !== 'over'){
            //启动游戏场景
            if(this.state !== 'playing') this.gameStart();
            //控制小鸟往上飞
            this.avatar.stopRight();
        }
    },

    onFalling: function (e) {
        if(this.state !== 'over'){
            //启动游戏场景
            if(this.state !== 'playing') this.gameStart();
            //控制小鸟往上飞
            this.avatar.fall();
        }
    },

    onAttack: function (e) {
        if(this.state !== 'over'){
            //启动游戏场景
            if(this.state !== 'playing') this.gameStart();
            //控制小鸟往上飞
            this.avatar.attack()
        }
    },

    onFire: function (e) {
        if(this.state !== 'over'){
            //启动游戏场景
            if(this.state !== 'playing') this.gameStart();
            //控制小鸟往上飞
            this.avatar.fire();
        }
    },

    onDash: function (e) {
        if(this.state !== 'over'){
            //启动游戏场景
            if(this.state !== 'playing') this.gameStart();
            //控制小鸟往上飞
            this.avatar.dash();
        }
    },

    onUpdate: function(delta){
        if(this.state === 'ready'){
            return;
        }

        if(this.avatar.body.isDead){
            this.gameOver();
        }else{
            //画鸟
            // this.assignBorder("body", this.body.x, this.body.y, this.body.width, this.body.height);

            // this.body.showPropertyOnBoard(this.avatar.bodyStatusText);  //鸟的状态
            var bodyBound = this.avatar.body.getBounds();
            var bodyPivotX = (bodyBound[0].x + bodyBound[2].x) >> 1;
            var bodyPivotY = (bodyBound[0].y + bodyBound[2].y) >> 1 + (this.avatar.body.height >> 1);

            for(var i = 0, len = this.holdbacks.children.length; i < len; i++){
                if(this.avatar.body.hitTestObject(this.holdbacks.children[i], true)) {
                   // console.log(bodyPivotX + " " + bodyPivotY);
                   var holdBackBound = this.holdbacks.children[i].getBounds();
                   if (holdBackBound.y >= bodyPivotY &&
                        holdBackBound.x < bodyPivotX && bodyPivotX < (holdBackBound.x + holdBackBound.width)) {
                       if(this.avatar.body.isFallen === false)
                           this.avatar.stopDown();
                   }
                }
            }

            for(var i = 0, len = this.minions.length; i < len; i++){
                if(this.minions[i].body.hitTestObject(this.avatar.body)) {
                    this.minions[i].stopLeft();
                } else {
                    this.minions[i].moveLeft();
                }
            }

            for(var i = 0, len = this.minions.length; i < len; i++){

                if(this.minions[i].blade.entity.hitTestObject(this.avatar.body) &&
                    this.minions[i].blade.isAttacking() === true) {
                        this.avatar.body.currentHp -= this.minions[i].blade.getAttackDamage();
                }
            }

			//提示信息
            this.bodyStatusText.text = "\n垂直速度:" + this.avatar.body.verticalVelocity + "\n可穿透: "
                + this.avatar.body.isFallen + "\n射击CD：" + this.avatar.getWaitingTimeofFiring() + " 攻击cd: " 
				+ this.avatar.getWaitingTimeofBlade() + " 冲击cd:" + this.avatar.getWaitingTimeofDashing();
            this.avatar.emulateMovement();
        }
    },

    gameReady: function(){
        this.state = 'ready';
        this.score = 0;
        this.currentScore.visible = true;
        this.currentScore.setText(this.score);
        this.gameReadyScene.visible = true;
        this.avatar.getReady();
        for(var i = 0, len = this.holdbacks.children.length; i < len; i++) {
            this.assignBorder("hb"+i, this.holdbacks.children[i].x, this.holdbacks.children[i].y,
                this.holdbacks.children[i].width, this.holdbacks.children[i].height);
        }
        this.createMinions();
    },

    gameStart: function(){
        this.state = 'playing';
        this.gameReadyScene.visible = false;
    },

    gameOver: function(){
        if(this.state !== 'over'){
            //设置当前状态为结束over
            this.state = 'over';
            //停止障碍的移动
            this.avatar.body.goto(0, true);
            //隐藏屏幕中间显示的分数
            this.currentScore.visible = false;
            //显示结束场景
            this.gameOverScene.show(this.calcScore(), this.saveBestScore());
        }
    },

    calcScore: function(){
        return this.score = 0;
    },

    saveBestScore: function(){
        var score = this.score, best = 0;
        if(Hilo.browser.supportStorage){
            best = parseInt(localStorage.getItem('hilo-flappy-best-score')) || 0;
        }
        if(score > best){
            best = score;
            localStorage.setItem('hilo-flappy-best-score', score);
        }
        return best;
    },

    assignBorder: function(id, x, y, width, height) {
        if(this.borderMap[id] != null) {
            this.borderMap[id].x = x;
            this.borderMap[id].y = y;
        } else {
            var domView = new Hilo.DOMElement({
                element: Hilo.createElement('div', {
                    style: {
                        position: 'absolute',
                        border: '1px solid #f00'
                    }
                }),
                width: width * this.scale,
                height: height * this.scale,
                x: x * this.scale,
                y: y * this.scale
            }).addTo(this.stage);
            this.borderMap[id] = domView;
        }
    }
};

})();
