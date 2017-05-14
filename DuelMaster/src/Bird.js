
(function(ns){

var Bird = ns.Bird = Hilo.Class.create({
    Extends: Hilo.Sprite,
    constructor: function(properties){
        Bird.superclass.constructor.call(this, properties);

        this.addFrame(properties.atlas.getSprite('bird'));
        this.interval = 6;
        this.pivotX = 43;
        this.pivotY = 30;

        this.gravity = 10 / 1000 * 0.3;
        this.flyHeight = 80;
        this.initVelocity = Math.sqrt(2 * this.flyHeight * this.gravity);
    },

    startX: 0, //小鸟的起始x坐标
    startY: 0, //小鸟的起始y坐标
	horizontalVelocity: 0, //水平速度
    groundY: 0, //地面的坐标
    gravity: 0, //重力加速度
    flyHeight: 0, //小鸟每次往上飞的高度
    initVelocity: 0, //小鸟往上飞的初速度

    isDead: true, //小鸟是否已死亡
    isUp: false, //小鸟是在往上飞阶段，还是下落阶段
	ceilFlag: false, //天花板
	floorFlag: false, //地板
    flyStartY: 0, //小鸟往上飞的起始y轴坐标
    flyStartTime: 0, //小鸟飞行起始时间

    getReady: function(){
        //设置起始坐标
        this.x = this.startX;
        this.y = this.startY;

        this.rotation = 0;
        this.interval = 6;
        this.play();
        this.tween = Hilo.Tween.to(this, {y:this.y + 10, rotation:-8}, {duration:400, reverse:true, loop:true});
    },

    startFly: function(){
        this.isDead = false;
        this.interval = 3;
        this.flyStartY = this.y;
        this.flyStartTime = +new Date();
        if(this.tween) this.tween.stop();
    },
	
	moveLeft: function(){
		this.horizontalVelocity = -10;
	},

	moveRight: function(){
		this.horizontalVelocity = 10;
	},

	stopLeft: function(){
		if(this.horizontalVelocity === -10) {
			this.horizontalVelocity = 0;
		}
	},

	stopRight: function(){
		if(this.horizontalVelocity === 10) {
			this.horizontalVelocity = 0;
		}
	},
	
	stopHigh: function(){
		this.ceilFlag = true;
	},
	
	stopDown: function(){
		this.floorFlag = true;
	},

    onUpdate: function(){
        if(this.isDead) return;

        //飞行时间
        var time = (+new Date()) - this.flyStartTime;
        //飞行距离
        var distance = - 0.5 * this.gravity * time * time;
		if(this.ceilFlag === false)
			distance += this.initVelocity * time;
        //y轴坐标
        var y = this.flyStartY - distance;

        if(y <= this.groundY && this.floorFlag === false){
            //小鸟未落地
            this.y = y;
            if(distance > 0 && !this.isUp){
                //往上飞时，角度上仰20度
                this.tween = Hilo.Tween.to(this, {rotation:-20}, {duration:200});
                this.isUp = true;
            }else if(distance < 0 && this.isUp){
                //往下跌落时，角度往下90度
                this.isUp = false;
            }
        }
		this.x += this.horizontalVelocity;
		this.floorFlag = this.ceilFlag = false;
    }
});

})(window.game);
