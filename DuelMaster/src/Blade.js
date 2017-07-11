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

            this.attackDamage = properties.attackDamage;

            this.entity = new Hilo.Bitmap({
                id: 'blade',
                image: properties.image,
                rect: [0, 0, 20, 100],
                pivotX: this.holdPivotXdistance,
                pivotY: this.holdPivotYdistance,
            }).addTo(this);

            this.suitUp();
        },

        holdPivotXdistance: 0, holdPivotYdistance: 0, //相对距离
        attackRange: 120,   //挥动范围
        coolDown: 500,
        startime: 0,
        entity: null,
        attackDamage: 0,
        currentDamage: 0,

        getAttackDamage: function () {
            var result = this.currentDamage;
            this.currentDamage = 0;
            return result;
        },

        getHoldPivotX: function () {
            return this.x + this.holdPivotXdistance;
        },

        getHoldPivotY: function () {
            return this.y + this.holdPivotYdistance;
        },

        isAttacking: function () {
            if(this.getWaitingTime() == 0)
                return false;
            else
                return true;
        },

		getWaitingTime: function() {
			var elapseTime = (+new Date()) - this.startime;
			var res =  this.coolDown - elapseTime;
		  	if(res < 0)
				res = 0;
			return res;
		},

        attack: function () {
            if((+new Date()) - this.startime > this.coolDown) {
                this.entity.tween = Hilo.Tween.to(this.entity, {rotation: this.attackRange}, {duration: this.coolDown});
                this.startime = (+new Date());
            }
        },

        suitUp: function (holdPivotX, holdPivotY, scaleX) {
            //设置起始坐标
            if(scaleX > 0)
                this.attackRange = 120;
            else
                this.attackRange = -120;
            this.entity.x = holdPivotX;
            this.entity.y = holdPivotY;

        },

        //运动模拟
        emulateMovement: function () {
            if (this.isDead) return;
        },

        onUpdate: function () {
            if (this.entity.rotation === 120 || this.entity.rotation === -120)
                this.entity.tween = Hilo.Tween.to(this.entity, {rotation: 0}, {duration: this.coolDown});

            if(this.entity.rotation === 0)
                this.currentDamage = this.attackDamage;
        }
    });

})(window.game);
