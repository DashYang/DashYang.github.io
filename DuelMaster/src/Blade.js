/**
 * Created by dash on 2017/5/19.
 */
(function (ns) {

    var Blade = ns.Blade = Hilo.Class.create({
        Extends: Hilo.Container,
        constructor: function (properties) {
            Blade.superclass.constructor.call(this, properties);

            this.holdPivotXdistance = 10;
            this.holdPivotYdistance = 100;


            this.blade = new Hilo.Bitmap({
                id: 'blade',
                image: properties.image,
                rect: [0, 0, 20, 100],
                pivotX: this.holdPivotXdistance,
                pivotY: this.holdPivotYdistance,
            }).addTo(this);

            this.suitUp();
        },

        ownerX: 0, ownerY: 0,//持有者坐标
        holdPivotXdistance: 0, holdPivotYdistance: 0, //相对距离
        attackRange: 120,   //反转
        blade: null,

        getHoldPivotX: function () {
            return this.x + this.holdPivotXdistance;
        },

        getHoldPivotY: function () {
            return this.y + this.holdPivotYdistance;
        },


        suitUp: function (holdPivotX, holdPivotY, scaleX, scaleY) {
            //设置起始坐标
            if(scaleX > 0)
                this.attackRange = 120;
            else
                this.attackRange = -120;
            this.blade.x = holdPivotX;
            this.blade.y = holdPivotY;

        },

        attack: function () {
            var rotation = 120;
            if(this.blade.rotation === 0)
                this.blade.tween = Hilo.Tween.to(this.blade, {rotation: this.attackRange}, {duration: 120});
        },

        //运动模拟
        emulateMovement: function () {
            if (this.isDead) return;
        },

        onUpdate: function () {
            if (this.blade.rotation === 120 || this.blade.rotation === -120)
                this.blade.tween = Hilo.Tween.to(this.blade, {rotation: 0}, {duration: 100});
        }
    });

})(window.game);
