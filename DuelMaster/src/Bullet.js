/**
 * Created by dash on 2017/5/20.
 */
/**
 * Created by dash on 2017/5/19.
 */
(function (ns) {

    var Bullet = ns.Bullet = Hilo.Class.create({
        Extends: Hilo.Container,
        constructor: function (properties) {
            Bullet.superclass.constructor.call(this, properties);
            this.image = properties.image;
        },

        bullet: null,
        flyingDistance: 500,
        image: null,
        count: 0,
        passed: 0,
        velocity: 15,
        queue: new Array(),

        fire: function (fireX, fireY, ratio) {
            var bullet = new Hilo.Bitmap({
                id: 'bullet' + this.count,
                image: this.image,
                rect: [0, 0, 20, 20],
                pivotX:10,
                pivotY:10,
                x: fireX,
                y: fireY,
            }).addTo(this);
            this.queue.push({bullet:bullet, startX: fireX, velocity: this.velocity*ratio});
            this.count += 1;
        },

        onUpdate: function () {
            for(var i = this.passed ; i < this.queue.length; i ++) {
                var distance = Math.abs(this.queue[i].bullet.x - this.queue[i].startX);
                if(distance >= this.flyingDistance ) {
                    this.passed = i;
                    this.queue[i].bullet.visible = false;
                    continue;
                }
                this.queue[i].bullet.x += this.queue[i].velocity;
                this.queue[i].alpha -= 0.01;
            }
        }

    });

})(window.game);
