
(function(ns){

var Holdbacks = ns.Holdbacks = Hilo.Class.create({
    Extends: Hilo.Container,
    constructor: function(properties){
        Holdbacks.superclass.constructor.call(this, properties);

        //水平摆放
        this.hoseRotation = 90;
        //管子之间的水平间隔
        this.hoseSpacingX = 100;
        //上下管子之间的垂直间隔，即小鸟要穿越的空间大小
        this.hoseSpacingY = 240;
        //管子的总数左右一对管子算一个）
        this.numHoses = 4;
        //移出屏幕左侧的管子数量，一般设置为管子总数的一半
        this.numOffscreenHoses = this.numHoses * 0.5;
        //管子的宽度（包括管子之间的间隔）
        // this.hoseWidth = 148 + this.hoseSpacingX;
        this.hoseWidth = 148;
        this.hoseLength = 40;

        //初始化障碍的宽和长度
        this.width = this.hoseWidth * this.numHoses;
        this.height = properties.height;

        this.isRunning = false;
        this.reset();
        this.createHoses(properties.image);
        this.moveTween = new Hilo.Tween(this, null, {
            onComplete: this.resetHoses.bind(this)
        });
    },

    startX: 0, //障碍开始的起始x轴坐标
    groundY: 0, //地面的y轴坐标

    hoseSpacingX: 0, //管子之间的水平间隔
    hoseSpacingY: 0, //上下管子之间的垂直间隔
    numHoses: 0, //管子的总数（上下一对管子算一个）
    numOffscreenHoses: 0, //移出屏幕左侧的管子数量
    hoseWidth: 0, //管子的宽度（包括管子之间的间隔）
    hoseLength: 0,//管子的长度（包括管子之间的间隔）

    passThrough: 0, //穿过的管子的数量，也即移出屏幕左侧的管子的数量
    isRunning: false,

    createHoses: function(image){
        for(var i = 0; i < this.numHoses; i++){
            var rightHose = new Hilo.Bitmap({
                id: 'right' + i,
                image: image,
                rect: [0, 0, 148, 820],
                pivotX: 74,
                pivotY: 410,
                rotation:this.hoseRotation
            }).addTo(this);

            var leftHose = new Hilo.Bitmap({
                id: 'left' + i,
                image: image,
                rect: [148, 0, 148, 820],
                pivotX: 74,
                pivotY: 410,
                rotation:this.hoseRotation
            }).addTo(this);

            this.placeHose(leftHose, rightHose, i);
        }
    },

    placeHose: function(leftHose, rightHose, index){
        rightHose.y = 0 + index * (rightHose.width * 2 - 50) + 148 / 2;
        rightHose.x = 30;
        rightHose.height = this.hoseLength + 2;
        leftHose.y = rightHose.y - 1;
        leftHose.x = rightHose.x - this.hoseLength;
        leftHose.height = this.hoseLength + 2;

        console.log("right point :(" + rightHose.x + ", " + rightHose.y + ")");
        console.log("left point :(" + leftHose.x + ", " + leftHose.y + ")");
    },

    resetHoses: function(){
        var total = this.children.length;

        //把已移出屏幕外的管子放到队列最后面，并重置它们的可穿越位置
        for(var i = 0; i < this.numOffscreenHoses; i++){
            var rightHose = this.getChildAt(0);
            var leftHose = this.getChildAt(1);
            this.setChildIndex(rightHose, total - 1);
            this.setChildIndex(leftHose, total - 1);
            this.placeHose(leftHose, rightHose, (this.passThrough) % 4);
        }

        //重新确定队列中所有管子的x轴坐标
        for(var i = 0; i < total - this.numOffscreenHoses * 2; i++){
            var hose = this.getChildAt(i);
            hose.x = this.hoseWidth * (i * 0.5 >> 0);
        }

        //重新确定障碍的x轴坐标
        this.x = 0;

        //更新穿过的管子数量
        this.passThrough += this.numOffscreenHoses;

        //继续移动
        this.startMove();
    },

    startMove: function(){
        //设置缓动的x轴坐标
        var targetX = -this.hoseWidth * this.numOffscreenHoses;
        Hilo.Tween._tweens.push(this.moveTween);
        //设置缓动时间
        this.moveTween.duration = (this.x - targetX) * 4;
        //设置缓动的变换属性，即x从当前坐标变换到targetX
        this.moveTween.setProps({x:this.x}, {x:targetX});
        //启动缓动动画
        this.moveTween.start();
        this.isRunning = true;
    },

    stopMove: function(){
        if(this.moveTween) {
            this.moveTween.pause();
            this.isRunning = false;
        }
    },

    checkCollision: function(bird){
        for(var i = 0, len = this.children.length; i < len; i++){
            if(bird.hitTestObject(this.children[i], true)){
                return true;
            }
        }
        return false;
    },

    calcPassThrough: function(x){
        var count = 0;

        x = -this.x + x;
        if(x > 0){
            var num = x / this.hoseWidth + 0.5 >> 0;
            count += num;
        }
        count += this.passThrough;

        return count;
    },

    reset: function(){
        this.x = this.startX;
        this.passThrough = 0;
    }

});

})(window.game);