import { setupCanvasRatio } from "./chart-utils";
import { DateDataset, LineSeries } from './chart-dataset'


interface ChartSettings {
    gridColor: string               // цвет вертикальных и горизонатльных линий (сетки)
    labelsColor: string             // цвет подписей по осям
    labelsFont: string              // подписи по осям
    areaBorderColor: string         // цвет внешнего прямоугольника
    allowDrag: boolean              // можно таскать график, изменяя левый (и синхронно правый) край
    units: string                   // единицы - будет приписываться к числам (хинтам и пр.) (например, '%' или "руб")
}

const defaultSettings: ChartSettings = {
    gridColor:       '#e2e2e2',
    labelsColor:     '#555',
    labelsFont:      '12px Verdana',
    areaBorderColor: '#d2d2d2',
    allowDrag:       true,
    units:           '',
}

export interface DateChart {
    dataset: DateDataset
    ops: ChartSettings
    canvas: HTMLCanvasElement

    setXScale( newXMin: number, newXMax: number )
    getXScale(): number[]
    updateSize()
    getPointAt( layerX: number, layerY: number ): { x: number, y: number, layerX: number, layerY: number, serie: LineSeries }
    getXAt( layerX: number, layerY: number ): number
    isInArea( x: number, y: number ): boolean
    xToScreen( pointX: number ): number
    yToScreen( pointY: number ): number
    update ()
    on( eventName: string, callback: ( ...args: any[] ) => void ): DateChart
    one( eventName: string, callback: ( ...args: any[] ) => void ): DateChart
    off( eventName: string, callback: ( ...args: any[] ) => void ): DateChart

    start()
}


/**
 * Создание компонента-графика. Для этого нужна разметка .chart > canvas и подготовленный dataset.
 * Это сделано не классом с кучей private-свойств и public/private методов, а через замыкание и создание this:
 * так код в данном случае намного лучше сжимается.
 */
export function createDateChart( canvas: HTMLCanvasElement, d: DateDataset, options?: Partial<ChartSettings> ): DateChart {
    var self: DateChart,
        ops      = Object.assign( {}, defaultSettings, options ) as ChartSettings,
        buffer   = document.createElement( 'canvas' ),
        ctx      = buffer.getContext( '2d' )
    // размеры контекста
    var ctxW: number, ctxH: number
    // область для непосредственно рисования графиков (без надписей и пр.) - экранные координаты (относительно контекста)
    var areaT: number, areaL: number, areaW: number, areaH: number
    // ось y (в абсолютных значениях)
    var yMin: number, yMax: number, yStep: number
    // ось x
    var xLabelsW = 120, xMin: number, xMax: number, xStep: number
    // предпросчитанные коэффициенты для перевода логических координат в экранные
    var xScreen_summand: number, xScreen_mult: number, yScreen_summand: number, yScreen_mult: number
    // для retina: devicePixelRatio; на эту константу нужно умножать многие координаты
    var ratio    = 1.0

    function trigger( eventName: string, args?: any[] ) {
        if( ctxW > 0 )      // == .start() уже вызван (чтоб не генерить события, которые ловят внешние компоненты, во время инициализации)
            (<any>$).event.trigger( eventName, args, self, true )      // = $(self).triggerHandler
    }

    // пересчитать габариты в пикселях для рисования; функция должна вызываться извне, если внешний интерфейс меняет размер канвы
    function updateDrawSizes() {
        if( ctxW !== canvas.width || ctxH !== canvas.height ) {     // защита от повторного вызова, чтобы setupCanvasRatio не увеличил еще раз размеры на ретине
            ratio        = setupCanvasRatio( canvas )
            buffer.width = ctxW = canvas.width
            buffer.height = ctxH = canvas.height
            areaL = 50 * ratio
            areaT = 10 * ratio
            areaW = ctxW - 51 * ratio
            areaH = ctxH - 40 * ratio
        }
    }

    function yToScreen( y: number ) {
        //return areaT + ( yMax - y ) / (yMax - yMin) * areaH
        return yScreen_summand + yScreen_mult * y
    }

    function xToScreen( x: number ) {
        //return areaL + ( x - xMin ) / (xMax - xMin) * areaW
        return xScreen_summand + xScreen_mult * x
    }

    function screenToY( y: number ) {
        //return (areaT - y) * (yMax - yMin) / areaH + yMax
        return ( y - yScreen_summand ) / yScreen_mult
    }

    function screenToX( x: number ) {
        //return (x - areaL) * (xMax - xMin) / areaW + xMin
        return ( x - xScreen_summand ) / xScreen_mult
    }

    function draw() {
        ctx.clearRect( 0, 0, ctxW, ctxH )
        ctx.fillStyle = 'white'
        ctx.fillRect( areaL, areaT, areaW, areaH )

        drawYGrid()
        drawYLabels()
        drawXGrid()
        drawXLabels()
        // сначала рисуем ободок у area, чтобы сами графики рисовались поверх
        ctx.save()
        ctx.translate( 0.5 * ratio, 0.5 * ratio )
        ctx.strokeStyle = ops.areaBorderColor
        ctx.lineWidth   = ratio
        ctx.strokeRect( areaL, areaT, areaW, areaH )
        ctx.restore()
        // это нужно, чтобы корректно нулевые значения отображались (нулевая линия затирала бордюр area)
        drawSeries()

        canvas.getContext( '2d' ).clearRect( 0, 0, ctxW, ctxH )
        canvas.getContext( '2d' ).drawImage( buffer, 0, 0 );
    }

    function drawSeries() {
        ctx.save()
        ctx.beginPath()
        ctx.rect( areaL + ratio, areaT, areaW - ratio, areaH + 10 * ratio ) // снизу пространство для нулевых линий и точек
        ctx.clip()
        var s: LineSeries, i: number, i1: number, i2: number, l: number, ncp: number, cp: number[],
            has_effects = areaW / ( xMax - xMin ) > 15 * ratio   // точки и сглаживание видны, если не слишком маленький масштаб

        for( var ds = 0, xValues, yValues; ds < d.series.length; ++ds )
            if( ( s = d.series[ds]).visible && (xValues = s.getXValues()).length && (yValues = s.getYValues()).length ) {
                // вычисляем 2 индекса с учётом нулей в графике:
                // точки, которая левее текущей видимой области и точки, которая правее
                l = xValues.length
                for( i1 = 0; i1 < l && xValues[i1] < xMin; ++i1 );
                for( i2 = i1 + 1; i2 < l && xValues[i2] <= xMax; ++i2 );
                i1 > 0 && --i1
                i2 == l && --i2

                // сами линии
                ctx.strokeStyle = s.lineColor
                ctx.lineWidth   = 2 * ratio
                ctx.beginPath();
                ctx.moveTo( xToScreen( xValues[i1] ), yToScreen( yValues[i1] ) )
                if( s.smooth && has_effects )
                    for( i = i1, ncp = i * 4, cp = s.getBezierCp(); i < i2; ++i, ncp += 4 )
                        ctx.bezierCurveTo(      // [x,y]toScreen заинлайнено
                            xScreen_summand + xScreen_mult * cp[ncp + 0], yScreen_summand + yScreen_mult * cp[ncp + 1],
                            xScreen_summand + xScreen_mult * cp[ncp + 2], yScreen_summand + yScreen_mult * cp[ncp + 3],
                            xScreen_summand + xScreen_mult * xValues[i + 1], yScreen_summand + yScreen_mult * yValues[i + 1]
                        )
                else
                    for( i = i1; i <= i2 && i < l; ++i )
                        ctx.lineTo( xScreen_summand + xScreen_mult * xValues[i], yScreen_summand + yScreen_mult * yValues[i] )
                ctx.stroke()

                // заливка под графиком
                if( s.fillColor != 'none' ) {
                    ctx.lineTo( xToScreen( xValues[i2] ) + 2, areaT + areaH );
                    ctx.lineTo( xToScreen( xValues[i1] ), areaT + areaH );
                    ctx.closePath();
                    ctx.fillStyle   = s.fillColor;
                    ctx.globalAlpha = 0.05      // вся заливка рисуется с фиксированным opacity (чтобы по умолчанию fillColor=lineColor) (решил не делать это опцией)
                    ctx.fill();
                    ctx.globalAlpha = 1
                }
                else
                    ctx.closePath()

                // точки
                if( s.pointRadius > 0 && has_effects ) {
                    ctx.fillStyle   = 'white';
                    ctx.strokeStyle = s.lineColor;
                    ctx.lineWidth   = 1.6 * ratio;
                    for( i = i1 || 1; i < i2 && i < l - 1; ++i )    // самая-самая первая и самая-самая последняя не обводятся кружком
                        if( yValues[i] > 0 ) {
                            ctx.beginPath();
                            ctx.arc( xScreen_summand + xScreen_mult * xValues[i], yScreen_summand + yScreen_mult * yValues[i], s.pointRadius * ratio, 0, Math.PI * 2 );
                            ctx.fill();
                            ctx.stroke();
                        }
                }
            }
        ctx.restore()
    }

    function drawYGrid() {
        ctx.save()
        ctx.translate( 0.5 * ratio, 0.5 * ratio )   // чтобы горизонтальные линии занимали 1 пиксель, а не 2
        ctx.strokeStyle = ops.gridColor
        ctx.lineWidth   = ratio
        for( var y = yMin, y_scr; y <= yMax; y += yStep ) {
            y_scr = Math.ceil( yToScreen( y ) )    // чтоб было целое число => однопиксельные линии
            ctx.beginPath()
            ctx.moveTo( areaL, y_scr )
            ctx.lineTo( areaL + areaW, y_scr )
            ctx.stroke()
        }
        ctx.restore()
    }

    function drawYLabels() {
        ctx.save()
        ctx.fillStyle    = ops.labelsColor
        ctx.font         = ops.labelsFont.replace( /(\d+)(px|pt)/g, function( m, n, units ) {
            return n * ratio + units
        } )
        ctx.textBaseline = 'middle'
        var y, n_fixed   = yStep < 1 ? 1 : 0            // число знаков после запятой по оси Y: есть, если слишком малые величины
        var yAxisRotated = yMax >= 100000
        if( yAxisRotated ) {
            ctx.textAlign = 'center'
            ctx.rotate( -Math.PI / 2 )
            for( y = yMin; y < yMax; y += yStep + yStep )
                ctx.fillText( y.withThousandSeparator(), -yToScreen( y ), 40 * ratio );
        }
        else {
            ctx.textAlign = 'right'
            for( y = yMin; y <= yMax; y += yStep )
                ctx.fillText( y.toFixed( n_fixed ), 40 * ratio, yToScreen( y ) );
        }
        ctx.restore()
    }

    function drawXGrid() {
        ctx.save()
        ctx.translate( 0.5 * ratio, 0.5 * ratio )   // чтобы вертикальные линии занимали 1 пиксель, а не 2
        ctx.strokeStyle = ops.gridColor
        ctx.lineWidth   = ratio
        for( var x = Math.ceil( xMin / xStep ) * xStep - 0.5, x_scr; x < xMax; x += xStep ) {
            x_scr = Math.ceil( xToScreen( x ) )   // чтоб было целое число => однопиксельные линии
            if( x_scr > areaL && x_scr < areaL + areaW ) {
                ctx.beginPath()
                ctx.moveTo( x_scr, areaT )
                ctx.lineTo( x_scr, areaT + areaH )
                ctx.stroke()
            }
        }
        ctx.restore()
    }

    function drawXLabels() {
        ctx.save()
        ctx.fillStyle    = ops.labelsColor
        ctx.font         = ops.labelsFont.replace( /(\d+)(px|pt)/g, ( m, n, units ) => n * ratio + units )
        ctx.textAlign    = 'center'
        ctx.textBaseline = 'top'

        var dxMs     = d.dxMinutes * 60000,
            showHHMM = d.dxMinutes < 1440 && (xMax - xMin) * d.dxMinutes < 1440 * 5,
            date     = new Date( d.dateStart ),
            x        = Math.ceil( xMin / xStep ) * xStep - (xStep == 1 ? 0 : 0.5)
        date.setTime( date.getTime() + Math.ceil( x ) * dxMs )
        for( var x_scr; x < xMax; x += xStep, date.setTime( date.getTime() + xStep * dxMs ) ) {
            x_scr = xToScreen( x )
            if( x_scr > areaL + xLabelsW * ratio / 2 && x_scr < areaL + areaW - xLabelsW * ratio / 2 ) {
                var lbl = showHHMM ? (<any>date).hmm() : (<any>date).formatDDMM_lbl()
                ctx.fillText( lbl, x_scr, areaT + areaH + 9 * ratio );
            }
        }
        ctx.restore()
    }

    // расчет шага и максимального значения шкалы ординат, учитывая, что максимальная отображаемая точка имеет координату pointMaxY
    function calcYScale( pointMaxY: number ) {
        if( pointMaxY <= 1 ) {
            yMin  = 0
            yMax  = 1
            yStep = 0.2
            return
        }

        yStep          = Math.max( 1, pointMaxY * 1.5 ) + 1
        var ends       = [1, 2, 5], vals_now = [], size = pointMaxY, cur_d;
        var max_labels = Math.floor( areaH / 50 / ratio ), cur_labels = max_labels + 1;
        if( max_labels <= 0 ) return;

        var need_pow = Math.pow( 10, Math.floor( Math.log( size / max_labels ) / Math.LN10 ) ), i
        for( i = 0; i < ends.length; ++i )
            vals_now[i] = ends[i] * need_pow;

        while( cur_labels > max_labels )
            for( i = 0; i < ends.length && cur_labels > max_labels; vals_now[i++] *= 10. ) {
                yStep      = vals_now[i];
                cur_labels = Math.floor( cur_d = size / yStep );
                if( Math.abs( cur_d - Math.floor( cur_d ) ) > 1e-6 ) ++cur_labels;  // cur_d не целое
            }
        yMin = 0
        yMax = Math.ceil( pointMaxY / yStep + 1e-4 ) * yStep
    }

    function setXScale( newXMin: number, newXMax: number, dontCheckEqual = false ) {
        if( !dontCheckEqual && xMin === newXMin && xMax === newXMax )
            return
        xMin      = Math.min( newXMin, newXMax )
        xMax      = Math.max( newXMin, newXMax )
        var max_y = d.getMaxY( Math.floor( xMin ), Math.ceil( xMax ) )
        calcYScale( max_y )
        xStep = Math.ceil( ( xMax - xMin ) / ( areaW / xLabelsW / ratio ) )
        // если смотреть формулу, то x_screen = areaL + ( x - xMin ) / (xMax - xMin) * areaW
        // реально же можно сделать x_screen = xScreen_summand + xScreen_mult * x
        // т.к. [x,y]toScreen вызывается очень часто, эта оптимизация не помешает; кроме того, в главном цикле рисования это даже заинлайнено
        xScreen_mult    = areaW / (xMax - xMin)
        xScreen_summand = areaL - xMin * areaW / (xMax - xMin)
        yScreen_mult    = -areaH / (yMax - yMin)
        yScreen_summand = areaT + yMax * areaH / (yMax - yMin)
        // фух, все готово
        draw()
        // событие, чтобы внешний интерфейс его поймал и отобразил промежуток видимых дат, какую-нибудь сумму значений по сериям и т.п.
        // если xMin и xMax - дробные, то для внешнего интерфейса большую ценность представляют целые значения - дни, которые полностью влезают внутрь видимой области
        trigger( 'scaleChanged', self.getXScale() )
    }

    function recalcYScale() {
        setXScale( xMin, xMax, true )
    }

    function getPointAt( layerX: number, layerY: number ) {
        var y = screenToY( layerY ), near_x = getRoundedXCoordAt( layerX, layerY ), nearest_s_idx, min_dy, s: LineSeries
        if( near_x == null || near_x < xMin || near_x > xMax )
            return null

        for( var ds = 0; ds < d.series.length; ++ds )   // может быть несколько серий с близкими визуально точками, нужно найти ближайшую к курсору (к y) (min_dy)
            if( (s = d.series[ds]).visible && s.data[near_x] != null && ( nearest_s_idx === undefined || Math.abs( s.data[near_x] - y ) <= min_dy ) )
                nearest_s_idx = ds, min_dy = Math.abs( s.data[near_x] - y )
        if( nearest_s_idx === undefined )
            return null

        var near_y = d.series[nearest_s_idx].data[near_x]
        if( Math.abs( layerX - xToScreen( near_x ) ) > 10 * ratio || Math.abs( layerY - yToScreen( near_y ) ) > 10 * ratio )
            return null
        return { y: near_y, layerY: yToScreen( near_y ) / ratio, x: near_x, layerX: xToScreen( near_x ) / ratio, serie: d.series[nearest_s_idx] }
    }

    function getRoundedXCoordAt( layerX, layerY ) {
        if( layerX < areaL || layerX > areaL + areaW || layerY < areaT || layerY > areaT + areaH + 6 )  // есть небольшой зазор снизу, чтоб курсор наводился снизу на нулевые точки
            return null
        return Math.round( screenToX( layerX ) )
    }

    function initDragChangeScale() {
        var delta, start_min_x, max_x
        $( canvas )
            .drag( function( e, dd ) {
                var new_xmin = Math.max( 0, Math.min( max_x - delta, start_min_x - delta / areaW * dd.dx * ratio ) )
                setXScale( new_xmin, new_xmin + delta )
            } )
            .on( 'dragstart', function( e, dd ) {
                var off = $( this ).offset(), layer_x = e.pageX - off.left, layer_y = e.pageY - off.top
                if( !(layer_x >= areaL && layer_x <= areaL + areaW && layer_y >= areaT && layer_y <= areaT + areaH ) )
                    return false
                delta       = xMax - xMin
                start_min_x = xMin
                max_x       = d.getMaxX()
                $( '<div class="hover_block">' ).appendTo( 'body' )    // он перехватывает курсор, чтоб в css hover-эффекты не срабатывали
            } )
            .on( 'dragend', function() {
                $( '.hover_block' ).remove()
            } )
    }

    /**
     * Фукнция должна вызываться извне, когда изменились свойства (цвет/видимость/значения) серий или их количество.
     * Т.е. нужно пересчитать масштаб, перерисовать все, а также проапдейтить превьюшки, чекбоксы и пр. (последнее делается за счет генерации события, те компоненты на него подписываются).
     */
    function seriesUpdatedCallback() {
        if( ctxW > 0 ) {     // была уже инициализация
            d.series.forEach( serie => serie.prepareValues() )
            recalcYScale()      // это и перерисовка тоже, и scaleChanged
            trigger( 'updated' )
        }
        return self
    }

    return self = {
        dataset: d,
        ops:     ops,
        canvas,

        setXScale,
        getXScale() {
            return [Math.ceil( xMin ), Math.floor( xMax ), xMin, xMax]
        },
        updateSize() {
            updateDrawSizes()
        },
        getPointAt( layerX: number, layerY: number ) {
            return getPointAt( layerX * ratio, layerY * ratio )
        },
        getXAt( layerX: number, layerY: number ) {
            return getRoundedXCoordAt( layerX * ratio, layerY * ratio )
        },
        isInArea( x: number, y: number ) {
            return x >= xMin && x <= xMax && y >= yMin && y <= yMax
        },
        xToScreen( pointX: number ) {
            return xToScreen( pointX ) / ratio
        },
        yToScreen( pointY: number ) {
            return yToScreen( pointY ) / ratio
        },
        update () {
            seriesUpdatedCallback()
        },
        on( eventName: string, callback: () => void ) {
            return $( this ).on( eventName, callback ), this
        },
        one( eventName: string, callback: () => void ) {
            return $( this ).one( eventName, callback ), this
        },
        off( eventName: string, callback: () => void ) {
            return $( this ).off( eventName, callback ), this
        },

        start() {
            updateDrawSizes()
            seriesUpdatedCallback()
            ops.allowDrag && initDragChangeScale()
        },
    }
}

