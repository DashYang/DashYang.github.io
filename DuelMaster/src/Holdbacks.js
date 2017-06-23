
(function(ns){

var Holdbacks = ns.Holdbacks = Hilo.Class.create({
    Extends: Hilo.Container,
    constructor: function(properties){
        Holdbacks.superclass.constructor.call(this, properties);

        //管子之间的水平间隔
        this.hoseSpacingX = 100;
        //上下管子之间的垂直间隔，即小鸟要穿越的空间大小
        this.hoseSpacingY = 300;
        //管子的总数左右一对管子算一个）
        this.numHoses = 3;
        //移出屏幕左侧的管子数量，一般设置为管子总数的一半
        this.numOffscreenHoses = this.numHoses * 0.5;
        //管子的宽度（包括管子之间的间隔）
        // this.hoseWidth = 148 + this.hoseSpacingX;
        this.hoseWidth = 2080;
        this.hoseHeight = 50;

        //初始化障碍的宽和长度
        // this.width = this.hoseWidth * this.numHoses;
        // this.height = properties.height;

        this.isRunning = false;
        this.createHoses(properties.image);
    },

    startX: 0, //障碍开始的起始x轴坐标
    groundY: 0, //地面的y轴坐标

    hoseSpacingX: 0, //管子之间的水平间隔
    hoseSpacingY: 0, //上下管子之间的垂直间隔
    numHoses: 0, //管子的总数（上下一对管子算一个）
    hoseWidth: 0, //管子的宽度（包括管子之间的间隔）
    hoseLength: 0,//管子的长度（包括管子之间的间隔）

    passThrough: 0, //穿过的管子的数量，也即移出屏幕左侧的管子的数量
    isRunning: false,

    createHoses: function(image){
        for(var i = 0; i < this.numHoses; i++){
            var hose = new Hilo.Bitmap({
                id: 'right' + i,
                image: image,
                rect: [0, 0, 820, 140],
            }).addTo(this);

            this.placeHose(hose, i);
        }
    },

    placeHose: function(hose, index){
        hose.width = this.hoseWidth;
        hose.height = this.hoseHeight;
        hose.y = index * (this.hoseSpacingY) + 200;
        hose.x = 0;

    },

});

})(window.game);
