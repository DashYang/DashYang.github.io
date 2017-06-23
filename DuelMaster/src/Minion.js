/**
 * Created by dash on 2017/5/23.
 */

(function (ns) {
    var Minion = ns.Minion = Hilo.Class.create({
        Extends: Hilo.Container,
        constructor: function (properties) {
            Minion.superclass.constructor.call(this, properties);

            this.body = properties.body;
            this.blade = properties.blade;
            this.bullet = properties.bullet;
            this.body.addTo(this);
            this.blade.addTo(this);
            this.bullet.addTo(this);
        },

        body: null,
        blade: null,
        bullet: null,

        getReady: function () {
            //主体
            this.body.x = this.body.startX;
            this.body.y = this.body.startY;

            //武器
            this.blade.suitUp(this.body.getHoldPivotX(), this.body.getHoldPivotY(),this.body.scaleX, this.body.scaleY);

            this.body.isDead = false;
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

        stopDown: function () {
            this.body.floorFlag = true;
            this.body.hitFloor();
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

        emulateMovement: function () {
            this.body.emulateMovement();
            this.blade.suitUp(this.body.getHoldPivotX(), this.body.getHoldPivotY(), this.body.scaleX);
        },

        onUpdate: function () {
            this.emulateMovement();
            if(this.body.horizontalVelocity === 0)
                this.attack();
        }
    });

})(window.game);
