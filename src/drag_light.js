"use strict";
/*
    Облегченный drag-n-drop: около половины функциональности вырезано, чтоб он был легким.
 */
(function( $ ) {
    var drag_defaults = {
            distance: 0,        // если перетащить мышку меньше, будет click, drag не начнется; при -1 start/drag возникнет сразу при mousedown
            handle:   null,     // селектор элементов, за которые можно таскать (null - весь элемент)
            noDrag:   ':input,.nodrag'  // селектор элементов, за которые таскать нельзя (можно сделать null)
        },
        dragkey       = "dragdata"

    $.fn.drag = function( callback, ops ) {
        return this.on( "drag", callback ).each( function() {
            $.extend( $.data( this, dragkey ), ops )   // ops перегружают дефолтные, а дефолтные в setup прописываются
        } )
    };

    function DragPerform( drag ) {  // в начале таскания (draginit) для каждого draggable-объекта (ведь callback может возвратить несколько, таскающихся параллельно) создастся такой объект (их массив - dd.performers)
        this.drag   = drag
        this.proxy  = drag                  // он может подмениться, если dragstart возвратит новый
        this.arg    = new CallbackArg()     // в обработчиках ondr[ag|op]*( event, arg ) - будут доступны arg.dx и пр. (см. populate) и методы его
        this.offset = $( drag ).offset()
    }

    function CallbackArg() {    // в обработчики ondrag* вторым параметром передается объект такого класса; его прототипные методы также доступны
    }

    CallbackArg.prototype.populate = function( event, dd, /**DragPerform*/ dragPerform ) {   // аргумент dd для обработчиков ondrag*
        var t       = this;
        t.drag      = dragPerform.drag;         // таскаемый объект
        t.proxy     = dragPerform.proxy;        // если proxy нет, то здесь drag будет
        t.startX    = dd.pageX;                 // эти свойства в dd запомнились в mousedown
        t.startY    = dd.pageY;
        t.dx        = event.pageX - dd.pageX;   // deltaX
        t.dy        = event.pageY - dd.pageY;
        t.originalX = dragPerform.offset.left;  // offset запомнился в начале таскания
        t.originalY = dragPerform.offset.top;   // это будет использоваться, если элемент, на который навешаны callback'и, реально перемещается, а не просто использует паттерн drag типа clickdrag счетчика
        t.offsetX   = t.originalX + t.dx;
        t.offsetY   = t.originalY + t.dy;
    }

    /**
     * Универсальная функция для trigger любого drag-события по всем alive performer'ам. Работает не через triggerHandler, а напрямую через event dispatch, подменяя существующий объект, для экономии памяти.
     * @param {Object} event Существующий event (функция trigDrag вызывается из обработчиков каких-то событий, там есть event)
     * @param {string} type  Название события ("drag", "draginit" и пр.)
     * @param {boolean} [needsResult] Нужно возвращаемое значение (если нет, оно не будет копиться и возвращаться)
     * @returns {Array} Массив результатов user callback'ов, если needsResult (состоит чаще всего из false, undefined, jquery)
     */
    function trigDrag( event, type, needsResult ) {
        var dd     = event.data, orig_type = event.type, results = [], result, i = 0, p, n_perf = dd.performers.length;
        event.type = type;
        do if( p = dd.performers[i] ) {
            p.arg.populate( event, dd, p )  // передадим в callback события параметры текущего контекста
            event.isPropagationStopped = event.isImmediatePropagationStopped = $.Event.prototype.isPropagationStopped;  // returnFalse: для корректного исполнения dispatch
            result = jEvent.dispatch.call( p.drag, event, p.arg );
            if( type === "dragstart" && result && ( result.jquery || result.nodeType === 1 ) )   // dragstart может возвратить прокси-объект, который нужно таскать вместо самого p.drag
                p.proxy = $( result )[0];   // а если нет, то proxy останется =drag
            needsResult && results.push( result );
            event.result = undefined;    // для очистки памяти
        } while( ++i < n_perf )
        event.type = orig_type;
        event.data = dd
        return results; // одномерный массив
    }

    // патчим $.event.special - добавляем drag*-события (патч абсолютно одинаковых для всех них) - про special см. http://learn.jquery.com/events/event-extensions/
    var jEvent = $.event, jSpecial = jEvent.special, drag = jSpecial.drag = jSpecial.draginit = jSpecial.dragstart = jSpecial.dragend = {
        noBubble: true,  // прощай live-события, зато быстрее

        add: function() {       // добавляется drag*-событие к какому-то (this) элементу (если это первое подобное событие к элементу, setup уже произошел, т.е. data существует)
            $.data( this, dragkey ).nBound++;
        },

        remove: function() {    // удаляется drag*-событие из какого-то (this) элемента
            $.data( this, dragkey ).nBound--;
        },

        setup: function() {     // перед привязкой самого первого drag*-события к this элементу
            if( !$.data( this, dragkey ) )  // если привязывается dragstart, а уже привязано drag - data будет уже заполнено, не нужно ничего делать
                jEvent.add( this, "touchstart mousedown", drag.init, $.data( this, dragkey, $.extend( { nBound: 0 }, drag_defaults ) ) );   // extend - не ссылку на def, а копию
        },

        teardown: function() {  // после отвязки последнего drag*-события от this
            if( !$.data( this, dragkey ).nBound ) {  // например, dragstart отключился (teardown), а draginit остался, nBound>0
                $.removeData( this, dragkey );
                jEvent.remove( this, "touchstart mousedown", drag.init );   // антоним для setup
            }
        },

        init: function( event ) {    // нажатие на элемент - начать все механизмы; event тут либо mousedown, либо touchstart
            var dd = event.data, target = event.target   // event.data = $.data(this,dragkey) (одна и та же ссылка, при изменении одного меняется везде)
            if( drag.touched ||                                     // без мультитача, не нужен он
                event.type === 'mousedown' && event.which !== 1 ||  // только левой кнопкой мыши (при таче which нету)
                $( target ).closest( dd.noDrag ).length ||          // нельзя таскать за что-то (по умолчанию за кнопки, инпуты и пр.)
                dd.handle && !$( target ).closest( dd.handle, event.currentTarget ).length )    // только за handle, если он есть
                return;

            drag.touched  = event.type === 'touchstart' ? this : null;
            dd.downed     = target;   // элемент, на который нажали; хотя с ним, впоследствии, смогут параллельно тащиться несколько сразу, или тащиться прокси, тут будет всегда он храниться
            dd.performers = [new DragPerform( this )];
            dd.pageX      = event.pageX; // это запоминаем, чтобы передавать в callback'и drag событий
            dd.pageY      = event.pageY;
            dd.dragging   = false;

            var results = trigDrag( event, "draginit", true );   // возможно, набор draggable-элементов; а в общем случае - это массив из одного элемента
            if( results[0] === false || results[0] === -123 )    // код возврата -123 из draginit введён, чтобы не начинать drag, но оставить propagation наверх
                return;                                             // (false нативными jquery-механизмами вызывает originalEvent.stopPropagation, уже не отменить)

            if( results[0] && results[0].jquery ) // draginit может возвращать элементы, которые должны быть таскаемыми (это results[0]) - для всех них будет вызываться dragstart и пр.
                dd.performers = results[0].map( function() { return new DragPerform( this ) } )   // jquery map
            drag.touched ? jEvent.add( drag.touched, "touchmove touchend", drag.handler, dd ) : jEvent.add( document, "mousemove mouseup", drag.handler, dd );  // dd будет event.data
            if( dd.distance < 0 )   // начать сразу же, не ждать движения мышки (сразу вызовутся dragstart и drag)
                ( event.type = 'mousemove' ), drag.handler( event )

            !drag.touched && event.preventDefault()  // этого достаточно для того, чтоб текст не выделялся в современных браузерах (return false не делаем: пусть mousedown всплывет наверх)
        },

        handler: function( event ) {    // обработчик таскания - mousemove/mouseup для документа или аналогичные touch (но они для самого элемента)
            var dd = event.data;
            //noinspection FallThroughInSwitchStatementJS
            switch( event.type ) {
                case !dd.dragging && 'touchmove':   // еще не начали таскать - нужно проверить distance, и если мышь далеко, то начать
                    event.preventDefault();
                case !dd.dragging && 'mousemove':   // dragstart, если нужно
                    if( dd.distance >= 0 && Math.pow( event.pageX - dd.pageX, 2 ) + Math.pow( event.pageY - dd.pageY, 2 ) < dd.distance * dd.distance )
                        break; // distance еще не преодолена
                    trigDrag( event, "dragstart" ); // к моменту dragstart, draginit уже произошел
                    dd.dragging = true
                // тут break не нужно — нужно, чтобы дальше пробросилось, и после dragstart сразу же drag
                case 'touchmove':
                    event.preventDefault();
                case 'mousemove':   // drag: двигают мышку, а также сюда проваливается из прошлых case
                    trigDrag( event, "drag" );
                    break;
                case 'touchend':
                case 'mouseup':     // отпускают мышку, а также сюда проваливается из прошлых case, если таскание отменено
                default:            // dragend
                    drag.touched ? jEvent.remove( drag.touched, "touchmove touchend", drag.handler ) : jEvent.remove( document, "mousemove mouseup", drag.handler );
                    if( dd.dragging )
                        trigDrag( event, "dragend" );
                    dd.dragging && $.data( dd.downed, "noclick", new Date().getTime() + 99 ); // на всякий случай не просто true: вдруг click не вызовестся сейчас, чтоб вызвался потом
                    dd.dragging = drag.touched = dd.downed = false;
                    delete dd.performers
                    break;
            }
        }
    };

    // запрещаем возникновение события click по элементу, который был только что перетащен; на всякий случай там в data кладется не true, а время
    jSpecial.click.preDispatch = function( e ) {
        if( $.data( e.target, "noclick" ) - new Date().getTime() > 0 )  // если у элемента нет data, будет условие NaN>0 => false
            return $.removeData( e.target, "noclick" ), e.preventDefault(), e.stopPropagation(), false  // предотвращаем не только клик на downed-элементе, но и другую реакцию на клик
    }

    // нормализация тачевских событий: там clientX и другие свойства находятся не в originalEvent, а в специальном объекте, еще и зависящем от ОС (iOS, Android)
    var jFix = jEvent.fixHooks, touchHooks = jFix.touchstart = jFix.touchmove = jFix.touchend = jFix.touchcancel = {
        props:  ["clientX", "clientY", "pageX", "pageY", "screenX", "screenY"],
        filter: function( event, orig ) {
            //noinspection JSUnresolvedVariable
            var touched = ( orig && orig.touches && orig.touches[0] ) || ( orig && orig.changedTouches && orig.changedTouches[0] );
            for( var i = 0, len = touched && touchHooks.props.length; i < len; ++i )  // копируем props: они лежат не в originalEvent (были бы скопированы самим jQuery), а в подсвойствах его
                event[touchHooks.props[i]] = touched[touchHooks.props[i]]
            return event;
        }
    };
})( jQuery );