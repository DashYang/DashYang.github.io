/**
 * Created by dash on 2017/5/20.
 */

(function (ns) {
    var Avatar = ns.Avatar = Hilo.Class.create({
        Extends: Hilo.Container,
        constructor: function (properties) {
            Avatar.superclass.constructor.call(this, properties);

            this.body = properties.body;
            this.blade = properties.blade;
            this.bullet = properties.bullet;
            this.body.addTo(this);
            this.blade.addTo(this);
            this.bullet.addTo(this);

            this.infoTips = new Hilo.Text({
                font: "30px arial",
                text:"",
                color:"black",
                lineSpacing: 0,
                width: this.body.width + 100,
                height: 20,
                pivotY: 30,
                x: this.body.x,
                y: this.body.y,
            }).addTo(this);
        },

        body: null,
        blade: null,
        bullet: null,
        infoTips: null,

        getReady: function () {
            //主体
            this.body.x = this.body.startX;
            this.body.y = this.body.startY;

            this.body.tween = Hilo.Tween.to(this.body, {y: this.body.y + 10, rotation: -8}, {
                duration: 400,
                reverse: true,
                loop: true
            });

            //武器
           this.blade.suitUp(this.body.getHoldPivotX(), this.body.getHoldPivotY(),this.body.scaleX, this.body.scaleY);
        },

        startFly: function () {
            this.body.isDead = false;
            this.body.flyStartY = this.body.y;
            this.body.flyStartTime = +new Date();
            this.body.verticalVelocity = this.body.initVelocity;
            if (this.body.tween) this.body.tween.stop();
        },

        moveLeft: function () {
            this.body.horizontalVelocity = -1 * this.body.defaultHorizontalVelocity;
            if(this.body.isLeft !== true)
                this.body.isTurningAround = true;
        },

        moveRight: function () {
            this.body.horizontalVelocity = 1 * this.body.defaultHorizontalVelocity;
            if(this.body.isLeft === true)
                this.body.isTurningAround = true;
        },

        stopLeft: function () {
            if (this.body.horizontalVelocity === -1 * this.body.defaultHorizontalVelocity) {
                this.body.horizontalVelocity = 0;
            }
        },

        stopRight: function () {
            if (this.body.horizontalVelocity === 1 * this.body.defaultHorizontalVelocity) {
                this.body.horizontalVelocity = 0;
            }
        },

        stopHigh: function () {
            this.body.ceilFlag = true;
            this.body.hitCeiling();
        },

        fall: function () {
            this.body.fall();
        },

        stopDown: function () {
            this.body.floorFlag = true;
            this.body.hitFloor()
        },

        fire: function () {
            if(this.body.isLeft === true)
                this.bullet.fire(this.body.getHoldPivotX(), this.body.getHoldPivotY(), -1);
            else
                this.bullet.fire(this.body.getHoldPivotX(), this.body.getHoldPivotY(), 1);
        },

        attack: function () {
           this.blade.attack();
        },

        dash: function () {
            this.body.dash();
        },
		
		//获取等待时间
		getWaitingTimeofFiring: function() {
			return this.bullet.getWaitingTime();
		},
		
		getWaitingTimeofBlade: function() {
			return this.blade.getWaitingTime();
		},

		getWaitingTimeofDashing: function() {
			return this.body.getWaitingTime();
		},

        emulateMovement: function () {
            this.body.emulateMovement();
            this.blade.suitUp(this.body.getHoldPivotX(), this.body.getHoldPivotY(), this.body.scaleX);
            this.infoTips.x = this.body.x, this.infoTips.y = this.body.y;
            this.infoTips.text = "hp:" + this.body.currentHp + " atk:" + this.blade.attackDamage;
        }

    });

})(window.game);
