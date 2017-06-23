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
        coolDown: 500,
        fireStartime: 0,

        fire: function (fireX, fireY, ratio) {
            if(((+new Date())) - this.fireStartime <= this.coolDown)
                return;
            this.fireStartime = (+new Date());
            var bullet1 = new Hilo.Bitmap({
                id: 'bullet' + this.count,
                image: this.image,
                rect: [0, 0, 20, 20],
                pivotX:10,
                pivotY:10,
                x: fireX,
                y: fireY,
            }).addTo(this);
            this.count += 1;
            this.queue.push({bullet:bullet1, startX: fireX, horizontalVelocity: this.velocity*ratio,
                verticalVelocity: this.velocity*ratio * 0.5});

            var bullet2 = new Hilo.Bitmap({
                id: 'bullet' + this.count,
                image: this.image,
                rect: [0, 0, 20, 20],
                pivotX:10,
                pivotY:10,
                x: fireX,
                y: fireY,
            }).addTo(this);
            //上下的是一半速度
            this.count += 1;
            this.queue.push({bullet:bullet2, startX: fireX, horizontalVelocity: this.velocity*ratio,
                verticalVelocity: 0});

            var bullet3 = new Hilo.Bitmap({
                id: 'bullet' + this.count,
                image: this.image,
                rect: [0, 0, 20, 20],
                pivotX:10,
                pivotY:10,
                x: fireX,
                y: fireY,
            }).addTo(this);
            //上下的是一半速度
            this.count += 1;
            this.queue.push({bullet:bullet3, startX: fireX, horizontalVelocity: this.velocity*ratio,
                verticalVelocity: this.velocity*ratio * -0.5});


        },

        onUpdate: function () {
            for(var i = this.passed ; i < this.queue.length; i ++) {
                var distance = Math.abs(this.queue[i].bullet.x - this.queue[i].startX);
                if(distance >= this.flyingDistance ) {
                    this.passed = i;
                    this.queue[i].bullet.visible = false;
                    continue;
                }
                this.queue[i].bullet.x += this.queue[i].horizontalVelocity;
                this.queue[i].bullet.y += this.queue[i].verticalVelocity;

            }
            //TODO 垃圾回收
        }

    });

})(window.game);
