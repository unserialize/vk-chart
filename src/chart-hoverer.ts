import { DateChart } from './chart'
import { LineSeries } from './chart-dataset'


export interface ChartHovererSettings {
    onMouse?: ( x: number ) => void
    onMouseOut?: () => void
}

export interface ChartHoverer {
    ops: ChartHovererSettings
    shown( yVal: number, xVal: number, serie: LineSeries, hint: Element )
}

const defaultHovererSettings: ChartHovererSettings = {}

/**
 * Интерактив mouseover-функционала графика. Если он нужен, нужно создать сначала график, а потом его.
 * График ведь рисуется на canvas, это не svg, у элементов которого можно было бы ловить события мыши, поэтому тут нужно вручную все делать.
 * Код оптимизирован на производительность в угоду простоте написания/использования - т.к. большинство действий должно работать при mousemove параллельно с отрисовкой.
 */
export function createChartHoverer( chart: DateChart, options: Partial<ChartHovererSettings> ): ChartHoverer {
    var self: ChartHoverer,
        round = Math.round,
        ops   = Object.assign( {}, defaultHovererSettings, options ) as ChartHovererSettings,
        units = ''

    // при ховере на конкретную точку подсвечивается сама точка и пишется подробный хинт возле нее
    var point_hint, point_sign
    // а просто при движении мыши, когда мышь на какой-то x-полосе, отображаются ховеры возле каждой точки с этой x-координатой каждого графика (x_hints) и точки выделяются (x_points)
    var x_hints: HTMLElement[]  = [],
        x_points: HTMLElement[] = []        // [i] отвечает series[i] (отображает ее данные при ховере или не видно, если visible false у серии)

    var thsep = n => n.withThousandSeparator() as string

    function trigger( eventName: string, arg1?, arg2?, arg3? ) {
        if( ops[eventName] )
            ops[eventName].call( this, arg1, arg2, arg3 )
    }

    function mouseMove( e ) {
        var ev      = e.originalEvent, layer_x = ev.offsetX || ev.layerX, layer_y = ev.offsetY || ev.layerY, i, series
        var x_coord = chart.getXAt( layer_x, layer_y ), point_info = chart.getPointAt( layer_x, layer_y )

        if( !point_info ) {             // нет точки НЕПОСРЕДСТВЕННО под курсором
            setPointDisplay( 'none' )
            for( series = chart.dataset.series, i = x_coord != null ? series.length : 0; i--; )
                if( series[i].visible && series[i].data[x_coord] !== null && chart.isInArea( x_coord, series[i].data[x_coord] ) ) {
                    x_hints[i].innerHTML     = thsep( round( series[i].data[x_coord] ) ) + units      // значение y
                    x_hints[i].style.display = x_points[i].style.display = 'block'
                    x_hints[i].style.top   = round( chart.yToScreen( series[i].data[x_coord] ) ) - 28 + 'px'
                    x_hints[i].style.left  = round( chart.xToScreen( x_coord ) - x_hints[i].offsetWidth / 2 ) + 'px'
                    x_points[i].style.top  = round( chart.yToScreen( series[i].data[x_coord] ) ) + 'px'
                    x_points[i].style.left = round( chart.xToScreen( x_coord ) ) + 'px'
                }
                else
                    x_hints[i].style.display = x_points[i].style.display = 'none'
        }
        else {
            setPointDisplay( 'block' )
            setXHintsDisplay( 'none' )
            point_hint.style.left = point_sign.style.left = round( point_info.layerX ) + 'px'
            point_hint.style.top             = round( point_info.layerY - 6 ) + 'px'
            point_sign.style.top             = round( point_info.layerY ) + 'px'
            point_sign.style.backgroundColor = point_hint.style.backgroundColor = point_hint.style.borderTopColor = point_info.serie.lineColor
            self.shown( point_info.y, point_info.x, point_info.serie, point_hint )
        }

        if( x_coord != null )
            trigger( 'onMouse', x_coord )
        else
            mouseOut( e )
    }

    function mouseOut( e ) {
        setPointDisplay( 'none' )
        setXHintsDisplay( 'none' )
        trigger( 'onMouseOut' )
    }

    function setPointDisplay( newDisplay ) {
        if( point_sign.style.display !== newDisplay ) {
            point_hint.style.display = point_sign.style.display = newDisplay
        }
    }

    function setXHintsDisplay( newDisplay ) {
        for( var i = 0; i < x_hints.length; ++i )
            x_hints[i].style.display = x_points[i].style.display = newDisplay
    }

    function update() {     // функцию нужно вызвать, когда количество или свойства (lineColor/visible) у серий изменилось
        units = chart.ops.units || ''
        $( x_hints ).add( x_points as any ).remove()   // эти удаляются и создаются сколько нужно (=сколько серий), за statics отвечает внешний интерфейс (т.к. они вне и находятся)
        x_hints = [], x_points = []
        for( var i = 0, series = chart.dataset.series; i < series.length; ++i ) {
            x_hints.push( $( '<div class="chart_x_hint" style="display:none;background-color: ' + series[i].lineColor + '"></div>' )
                .appendTo( chart.canvas.parentNode as Element )[0] )     // не insertAfter canvas: важен порядок
            x_points.push( $( '<div class="chart_x_point" style="display:none;background-color: ' + series[i].lineColor + '"></div>' )
                .appendTo( chart.canvas.parentNode as Element )[0] )
        }
    }

    function enable() {
        point_hint = $( '<div class="hint-t chart_point_hint" data-hint="" style="display: none"></div>' ).insertAfter( chart.canvas )[0]
        point_sign = $( '<div class="chart_point_sign" style="display: none"></div>' ).insertAfter( chart.canvas )[0]
        $( chart.canvas ).on( 'mousemove.hov mouseover.hov', mouseMove ).on( 'mouseout.hov', mouseOut )
        chart.on( 'updated', update )
        update()
    }

    chart.one( 'updated', () => enable() )      // при chart.start

    return self = {
        ops,
        // может быть извне перегружена для созданного объекта (например, для другого формата data-hint или дать какой-нибудь класс подсказке)
        shown( yVal: number, xVal: number, serie: LineSeries, hint: Element ) {
            var date    = new Date( chart.dataset.dateStart.getTime() + xVal * chart.dataset.dxMinutes * 60000 ),
                is_last = xVal > chart.getXScale()[1] - 2,
                lbl     = chart.dataset.dxMinutes < 1440 ? (<any>date).formatAsVk() : (<any>date).formatDDMMYY_lbl()
            hint.classList[is_last ? 'add' : 'remove']( 'hint-align-r' )
            hint.setAttribute( 'data-hint', thsep( Math.round( yVal ) ) + units + ' — ' + serie.name.toLowerCase() + "\n" + lbl )
        }
    }
}
