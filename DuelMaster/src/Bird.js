
(function(ns){

var Bird = ns.Bird = Hilo.Class.create({
    Extends: Hilo.Sprite,
    constructor: function(properties){
        Bird.superclass.constructor.call(this, properties);

        this.addFrame(properties.atlas.getSprite('bird'));
        this.interval = 6;
        this.verticalVelocity = 0;

        this.gravity = 10 / 1000 * 0.3;
        this.flyHeight = 80;
        // this.initVelocity = Math.sqrt(2 * this.flyHeight * this.gravity);
        this.initVelocity = 1;
        this.background = '#00ff00';
    },

    startX: 0, //小鸟的起始x坐标
    startY: 0, //小鸟的起始y坐标
	horizontalVelocity: 0, //水平速度
    verticalVelocity: 0, //垂直速度
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
    hitCeilingCount: 0, hitFloorCount: 0, //撞板
    getReady: function(){
        //设置起始坐标
        this.x = this.startX;
        this.y = this.startY;

        this.interval = 6;
        this.play();
        this.tween = Hilo.Tween.to(this, {y:this.y + 10, rotation:-8}, {duration:400, reverse:true, loop:true});
    },

    startFly: function(){
        this.isDead = false;
        this.flyStartY = this.y;
        this.flyStartTime = +new Date();
        this.verticalVelocity = this.initVelocity;
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
        this.hitCeiling();
	},
	
	stopDown: function(){
		this.floorFlag = true;
        this.hitFloor()
	},

    hitFloor: function() {
        this.hitFloorCount += 1;
    },

    hitCeiling: function () {
        this.hitCeilingCount += 1;
    },

    //infoBoard is a Hilo.Text
    showPropertyOnBoard: function(infoBoard) {
        infoBoard.text = "location:( " + this.x + " "  + this.y + ")";
        infoBoard.text = "撞到板:" + this.hitFloorCount + "\n" + "撞到头:" + this.hitCeilingCount +
            "\n垂直速度:" + this.verticalVelocity + "\n状态: " + this.isUp;
    },

    //运动模拟
    emulateMovement: function() {
        if(this.isDead) return;
	    var time = (+new Date()) - this.flyStartTime;

        //飞行距离
        var distance = this.verticalVelocity * time - 0.5 * this.gravity * time * time;
        if(distance > 1280 || distance < -1280) {
            console.log("运动数值异常，重置所有参数");
            this.flyStartTime = +new Date();
            this.floorFlag = this.ceilFlag = false;
            this.flyStartY = this.y;
            return;
        }
        //y轴坐标
        this.x += this.horizontalVelocity;

        var y = this.flyStartY - distance;  //理论位置
        var stepDistance = this.y - y;   //步长
        if( (this.ceilFlag === true && stepDistance > 0)   || //撞到天花板
            (this.floorFlag === true && stepDistance <= 0)) {//撞到地板

            this.flyStartTime = +new Date();
            this.flyStartY = this.y;
            this.verticalVelocity = 0;
            this.floorFlag = this.ceilFlag = false;

        } else {
            if (y <= this.groundY - this.height + 10) {
                //小鸟未落地
                this.y = y;
                if (distance > 0 && !this.isUp) {
                    //往上飞时，角度上仰20度
                    this.tween = Hilo.Tween.to(this, {rotation: -20}, {duration: 200});
                    this.isUp = true;
                } else if (distance < 0 && this.isUp) {
                    //往下跌落时，角度往下90度
                    this.isUp = false;
                }
            } else {
                //落地修正
                this.tween = Hilo.Tween.to(this, {rotation: 0}, {duration: 0});
                this.flyStartTime = +new Date();
                this.flyStartY = this.y;
                this.verticalVelocity = 0;

            }
        }
    },

    onUpdate: function(){
        //飞行时间
    }
});

})(window.game);
