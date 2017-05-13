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
    bird: null,
    holdbacks: null,
    gameReadyScene: null,
    gameOverScene: null,

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

        //Space键控制
        document.addEventListener('keydown', function(e){
            if(e.keyCode === 32) this.onUserInput(e);
        }.bind(this));

        //P键控制
        document.addEventListener('keydown', function(e){
            if(e.keyCode === 80) this.onPauseGame(e);
        }.bind(this));

        //舞台更新
        this.stage.onUpdate = this.onUpdate.bind(this);

        //初始化
        this.initBackground();
        this.initScenes();
        this.initHoldbacks();
        this.initBird();
        this.initCurrentScore();

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
                background: 'url(images/bg.png) repeat',
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
		console.log(this.ground.width);	
		this.ground.width = bgWidth * 3;
		console.log(this.ground.width);
        //移动地面
//        Hilo.Tween.to(this.ground, {x:-60}, {duration:300, loop:true});
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

    initBird: function(){
        this.bird = new game.Bird({
            id: 'bird',
            atlas: this.asset.birdAtlas,
            startX: 100,
            startY: this.height >> 1,
            groundY: this.ground.y - 12
        }).addTo(this.stage, this.ground.depth - 1);
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

        //结束场景
        this.gameOverScene = new game.OverScene({
            width: this.width,
            height: this.height,
            image: this.asset.over,
            numberGlyphs: this.asset.numberGlyphs,
            visible: false
        }).addTo(this.stage);

        //绑定开始按钮事件
        this.gameOverScene.getChildById('start').on(Hilo.event.POINTER_START, function(e){
            e._stopped = true;
            this.gameOverScene.visible = false;
            this.gameReady();
        }.bind(this));
    },

    onUserInput: function(e){
        if(this.state !== 'over'){
            //启动游戏场景
            if(this.state !== 'playing') this.gameStart();
            //控制小鸟往上飞
            this.bird.startFly();
        }
    },

    onPauseGame: function (e) {
        if(this.state !== 'over'){
            if(this.holdbacks.isRunning === true)
                this.holdbacks.stopMove();
            else
                this.holdbacks.startMove();
        }
    },

    onUpdate: function(delta){
        if(this.state === 'ready'){
            return;
        }

        if(this.bird.isDead){
            this.gameOver();
        }else{
            this.currentScore.setText(this.calcScore());
            //碰撞检测
            if(this.holdbacks.checkCollision(this.bird)){
                this.gameOver();
            }
        }
    },

    gameReady: function(){
        this.state = 'ready';
        this.score = 0;
        this.currentScore.visible = true;
        this.currentScore.setText(this.score);
        this.gameReadyScene.visible = true;
        this.bird.getReady();
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
            this.holdbacks.stopMove();
            //小鸟跳转到第一帧并暂停
            this.bird.goto(0, true);
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
    }
};

})();
