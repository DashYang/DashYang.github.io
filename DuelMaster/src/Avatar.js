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
            this.bird.addTo(this);
            this.blade.addTo(this);
        },

        bird: null,
        blade: null,

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

        emulateMovement: function () {
            this.bird.emulateMovement();
            this.blade.suitUp(this.bird.getHoldPivotX(), this.bird.getHoldPivotY(), this.bird.scaleX, this.bird.scaleY);
            console.log(this.bird.x + " " + this.bird.y);
        }

    });

})(window.game);
