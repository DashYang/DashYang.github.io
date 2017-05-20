/**
 * Created by dash on 2017/5/20.
 */

(function (ns) {
    var Avatar = ns.Avatar = Hilo.Class.create({
        Extends: Hilo.Container,
        constructor: function (properties) {
            Avatar.superclass.constructor.call(this, properties);

            this.bird = properties.bird;
            this.blade = properties.blade;
            this.bullet = properties.bullet;
            this.bird.addTo(this);
            this.blade.addTo(this);
            this.bullet.addTo(this);
        },

        bird: null,
        blade: null,
        bullet: null,

        getReady: function () {
            //主体
            this.bird.x = this.bird.startX;
            this.bird.y = this.bird.startY;

            this.bird.tween = Hilo.Tween.to(this.bird, {y: this.bird.y + 10, rotation: -8}, {
                duration: 400,
                reverse: true,
                loop: true
            });

            //武器
           this.blade.suitUp(this.bird.getHoldPivotX(), this.bird.getHoldPivotY(),this.bird.scaleX, this.bird.scaleY);
        },

        startFly: function () {
            this.bird.isDead = false;
            this.bird.flyStartY = this.bird.y;
            this.bird.flyStartTime = +new Date();
            this.bird.verticalVelocity = this.bird.initVelocity;
            if (this.bird.tween) this.bird.tween.stop();
        },

        moveLeft: function () {
            this.bird.horizontalVelocity = -1 * this.bird.defaultHorizontalVelocity;
            if(this.bird.isLeft !== true)
                this.bird.isTurningAround = true;
        },

        moveRight: function () {
            this.bird.horizontalVelocity = 1 * this.bird.defaultHorizontalVelocity;
            if(this.bird.isLeft === true)
                this.bird.isTurningAround = true;
        },

        stopLeft: function () {
            if (this.bird.horizontalVelocity === -1 * this.bird.defaultHorizontalVelocity) {
                this.bird.horizontalVelocity = 0;
            }
        },

        stopRight: function () {
            if (this.bird.horizontalVelocity === 1 * this.bird.defaultHorizontalVelocity) {
                this.bird.horizontalVelocity = 0;
            }
        },

        stopHigh: function () {
            this.bird.ceilFlag = true;
            this.bird.hitCeiling();
        },

        stopDown: function () {
            this.bird.floorFlag = true;
            this.bird.hitFloor()
        },

        fire: function () {
            if(this.bird.isLeft === true)
                this.bullet.fire(this.bird.getHoldPivotX(), this.bird.getHoldPivotY(), -1);
            else
                this.bullet.fire(this.bird.getHoldPivotX(), this.bird.getHoldPivotY(), 1);
        },

        attack: function () {
           this.blade.attack();
        },

        emulateMovement: function () {
            this.bird.emulateMovement();
            this.blade.suitUp(this.bird.getHoldPivotX(), this.bird.getHoldPivotY(), this.bird.scaleX);
        }

    });

})(window.game);
