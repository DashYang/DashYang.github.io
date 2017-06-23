(function (ns) {

    var Body = ns.Body = Hilo.Class.create({
        Extends: Hilo.Sprite,
        constructor: function (properties) {
            Body.superclass.constructor.call(this, properties);

            this.addFrame(properties.atlas.getSprite('bird'));
            this.startX = properties.startX;
            this.startY = properties.startY;
            this.maxHp = this.currentHp = properties.maxHp;
            this.verticalVelocity = 0;
            this.interval = 6;
            this.gravity = 10 / 1000 * 0.3;
            this.flyHeight = 80;
            // this.initVelocity = Math.sqrt(2 * this.flyHeight * this.gravity);
            this.initVelocity = 1;
            this.background = '#00ff00';
        },

        maxHp:0, currentHp:0, //血量

        startX: 0, //起始x坐标
        startY: 0, //起始y坐标
        horizontalVelocity: 0, //水平速度
        defaultHorizontalVelocity: 5,  //
        verticalVelocity: 0, //垂直速度
        groundY: 0, //地面的坐标
        gravity: 0, //重力加速度
        flyHeight: 0, //小鸟每次往上飞的高度
        initVelocity: 0, //小鸟往上飞的初速度
        dashingStartime: 0,
        isDead: true, //小鸟是否已死亡
        isLeft: false, //是否朝向左边
        isTurningAround: false, //是否转身
        isUp: false, //小鸟是在往上飞阶段，还是下落阶段
        ceilFlag: false, //天花板
        floorFlag: false, //地板
        flyStartY: 0, //小鸟往上飞的起始y轴坐标
        flyStartTime: 0, //小鸟飞行起始时间
        hitCeilingCount: 0, hitFloorCount: 0, //撞板
        isFallen: false, isFallenStartime: 0, isFallenCoolDown: 250,
        getReady: function () {
        },


        getHoldPivotX: function () {
            if (this.scaleX > 0)
                return this.x + this.width;
            else
                return this.x - this.width;
        },

        getHoldPivotY: function () {
            if (this.scaleY > 0)
                return this.y + this.height / 2;
            else
                return this.y - this.height / 2;
        },

        hitFloor: function () {
            this.hitFloorCount += 1;
        },

        hitCeiling: function () {
            this.hitCeilingCount += 1;
        },

        dash: function () {
            if ((+new Date()) - this.dashingStartime > 1000) {
                this.tween = Hilo.Tween.to(this, {x: this.x + this.scaleX * this.defaultHorizontalVelocity * 20},
                    {duration: 10});
                this.dashingStartime = (+new Date());
            }
        },

        fall: function () {
            if(this.isFallen == false) {
                this.isFallen = true;
                this.isFallenStartime = (+new Date());
            }
        },

        //infoBoard is a Hilo.Text
        showPropertyOnBoard: function (infoBoard) {
            infoBoard.text = "location:( " + this.x + " " + this.y + ")";
            infoBoard.text = "撞到板:" + this.hitFloorCount + "\n" + "撞到头:" + this.hitCeilingCount +
                "\n垂直速度:" + this.verticalVelocity + "\n上升: " + this.isUp;
        },

        //运动模拟
        emulateMovement: function () {
            if (this.isDead) return;

            //重置为不可穿透
            if(this.isFallen == true) {
                if((+new Date()) - this.isFallenStartime > this.isFallenCoolDown)
                    this.isFallen = false;
            }

            //转身变换
            if (this.isTurningAround === true) {
                if (this.isLeft !== true) {
                    this.scaleX = -1;
                    this.x += this.width;
                    this.isLeft = true;
                } else {
                    this.scaleX = 1;
                    this.x -= this.width;
                    this.isLeft = false;
                }
                this.isTurningAround = false;
            }
            //飞行距离
            var time = (+new Date()) - this.flyStartTime;
            var distance = this.verticalVelocity * time - 0.5 * this.gravity * time * time;
            if (distance > 1280 || distance < -1280) {
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
            if ((this.ceilFlag === true && stepDistance > 0) || //撞到天花板
                (this.floorFlag === true && stepDistance <= 0)) {//撞到地板

                this.flyStartTime = +new Date();
                this.flyStartY = this.y;
                this.verticalVelocity = 0;
                this.floorFlag = this.ceilFlag = false;
                //撞击修正
                this.tween = Hilo.Tween.to(this, {rotation: 0}, {duration: 0});

            } else {
                if (y <= this.groundY - this.height + 10) {
                    //小鸟未落地
                    this.y = y;
                    if (distance > 0 && !this.isUp) {
                        //往上飞时，角度上仰20度
                        var rotation = -20;
                        if (this.isLeft === true)
                            rotation = 20;
                        this.tween = Hilo.Tween.to(this, {rotation: rotation}, {duration: 200});
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

        onUpdate: function () {
            //飞行时间
        }
    });

})(window.game);
