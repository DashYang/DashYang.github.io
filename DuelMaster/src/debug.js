
(function(){

/**
 * 显示舞台上所有可视对象的外接矩形，即显示区域。可用于调试。
 */
Hilo.Stage.prototype.showDrawRect = function(show, lineColor){
    show = show !== false;
    lineColor = lineColor || '#f00';
    if(!this._oldRender) this._oldRender = this._render;

    if(show){
        this._render = function(renderer, delta){
            this._oldRender.call(this, renderer, delta);

            var ctx = renderer.context;
            if(ctx){
                ctx.save();
                ctx.lineWidth = 2;
                ctx.strokeStyle = lineColor;
            }
            drawRect(this, ctx, lineColor);
            if(ctx) ctx.restore();
        }
    }else{
        this._render = this._oldRender;
    }
};

function drawRect(stage, context, lineColor){
    for(var i = 0, len = stage.children.length; i < len; i++){
        var child = stage.children[i];
        if(child.children){
            drawRect(child, context);
        }else{
            if(context){
                var bounds = child.getBounds();

                context.beginPath();
                var p0 = bounds[0];
                context.moveTo((p0.x>>0)-0.5, (p0.y>>0)-0.5);                     
                for(var j = 1; j < bounds.length; j++){
                    var p = bounds[j];                   
                    context.lineTo((p.x>>0)-0.5, (p.y>>0)-0.5);   
                }
                context.lineTo((p0.x>>0)-0.5, (p0.y>>0)-0.5);
                context.stroke();
                context.closePath();
                
                context.globalAlpha = 0.5;
                context.beginPath();
                context.rect((bounds.x>>0)-0.5, (bounds.y>>0)-0.5, bounds.width>>0, bounds.height>>0);
                context.stroke();
                context.closePath();
            }else{
                var domElem = child.drawable && child.drawable.domElement;
                if(domElem){
                    domElem.style.border = '1px solid ' + lineColor;
                }
            }
        }
    }
}

/**
 * 重写console.log方法，便于在移动端查看log日志。
 * 可通过选择器`.hilo-log`来设置日志div容器的样式。
 */
// var console = window.console || {};
// var oldLog = console.log;
// console.log = function(){
//     var args = [].slice.call(arguments);
//     oldLog && oldLog.apply(console, args);
//
//     var logContainer = this._logContainer || (this._logContainer = getLogContainer());
//
//     var msg = '';
//     for(var i = 0, obj, len = args.length; i < len; i++){
//         obj = args[i];
//         try{
//             obj = JSON.stringify(obj);
//         }catch(e){ };
//         if(typeof obj === 'string'){
//             obj = obj.replace(/</g, '&lt;').replace(/>/g, '&gt;');
//         }
//         if(i == 0) msg = obj;
//         else msg += ', ' + obj;
//     }
//
//     logContainer.innerHTML += '> ' + msg + '<br/>';
// };
//
// function getLogContainer(){
//     var elem = new Hilo.createElement('div', {
//         className: 'hilo-log',
//         style: {
//             position: 'absolute',
//             width: '100%',
//             height: 200 + 'px',
//             font: '12px Courier New',
//             color: 'white',
//             backgroundColor: 'rgba(0,0,0,0.2)',
//             wordWrap: 'break-word',
//             wordBreak: 'break-all',
//             overflowY: 'scroll',
//             zIndex: 1e5
//         }
//     });
//     document.body.appendChild(elem);
//
//     return elem;
// }

})();