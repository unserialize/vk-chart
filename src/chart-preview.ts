import { DateChart } from './chart'
import { setupCanvasRatio } from './chart-utils'
import { LineSeries } from './chart-dataset'


export interface ChartPreviewSettings {
    $preview: JQuery
}

export interface ChartPreview {
    update()
    setWndGabarites( newXMin: number, newXMax: number )
}

const defaultPreviewSettings: ChartPreviewSettings = {
    $preview: null
}

/**
 * Превьюшка графика, отображающая все данные сразу в мелком масштабе, где можно выбирать область просмотра. Для создания должна быть корректная html-верстка $preview.
 * При ее необходимости сначала нужно создать график chart, а потом превью.
 */
export function createChartPreview( chart: DateChart, options: Partial<ChartPreviewSettings> ): ChartPreview {
    var self: ChartPreview,
        ops         = Object.assign( {}, defaultPreviewSettings, options ) as ChartPreviewSettings,
        $preview    = ops.$preview
    // контролы
    var wnd         = $preview.find( '.cp-wnd' )[0],
        overlay_l   = $preview.find( '.cpo-l' )[0],
        overlay_r   = $preview.find( '.cpo-r' )[0],
        area_select = $preview.find( '.area_select' )[0]
    // размеры для таскания и определения текущего масштаба
    var was_wnd_l: number, was_wnd_r: number, wnd_w: number, preview_w: number, preview_h: number
    // диапазоны осей и wnd-выделения
    var xMin: number, xMax: number, yMin: number, yMax: number, selected_xMin: number, selected_xMax: number
    // для retina: devicePixelRatio; на эту константу нужно умножать многие координаты
    var ratio       = 1.0

    function dragstart( e, dd ) {
        was_wnd_l = xToScreen( selected_xMin ) / ratio
        was_wnd_r = xToScreen( selected_xMax ) / ratio
        wnd_w     = was_wnd_r - was_wnd_l
    }

    function move( e, dd ) {
        var delta = selected_xMax - selected_xMin, new_l = screenToX( Math.max( 0, Math.min( preview_w - wnd_w, was_wnd_l + dd.dx ) ) )
        setWndGabarites( new_l, new_l + delta )
    }

    function resizeL( e, dd ) {
        var new_l = screenToX( Math.max( 0, Math.min( was_wnd_r - 10, was_wnd_l + dd.dx ) ) )
        setWndGabarites( new_l, selected_xMax )
    }

    function resizeR( e, dd ) {
        var new_r = screenToX( Math.max( was_wnd_l + 10, Math.min( preview_w, was_wnd_r + dd.dx ) ) )
        setWndGabarites( selected_xMin, new_r )
    }

    function areaSelectStart( e, dd ) {
        dd.clickX                 = dd.startX - $preview.offset().left
        area_select.style.display = 'block'
        area_select.style.left    = dd.clickX + 'px'
        area_select.style.width   = '0'
    }

    function areaSelect( e, dd ) {
        area_select.style.left  = ( dd.dx > 0 ? dd.clickX : Math.max( 0, dd.clickX + dd.dx ) ) + 'px'
        area_select.style.width = ( dd.dx > 0 ? Math.min( preview_w - dd.clickX, dd.dx ) : dd.clickX - parseInt( area_select.style.left ) ) + 'px'
    }

    function areaSelectEnd( e, dd ) {
        if( parseInt( area_select.style.width ) >= 10 )
            setWndGabarites( screenToX( parseInt( area_select.style.left ) ), screenToX( parseInt( area_select.style.left ) + parseInt( area_select.style.width ) ) )
        area_select.style.display = 'none'
    }

    function setWndGabarites( newXMin: number, newXMax: number ) {
        selected_xMin         = newXMin
        selected_xMax         = newXMax
        var left_scr          = Math.round( xToScreen( selected_xMin ) / ratio ), right_scr = Math.round( xToScreen( selected_xMax ) / ratio )
        wnd.style.left        = left_scr + 'px'
        wnd.style.right       = preview_w - right_scr + 'px'
        overlay_r.style.left  = right_scr + 'px'
        overlay_l.style.width = left_scr + 'px'
        chart.setXScale( selected_xMin, selected_xMax )
    }

    function yToScreen( y: number ) {
        return ( yMax - y ) / (yMax - yMin) * preview_h * ratio
    }

    function xToScreen( x: number ) {
        return ( x - xMin ) / (xMax - xMin) * preview_w * ratio
    }

    function screenToY( y: number ) {
        return -y * (yMax - yMin) / preview_h + yMax
    }

    function screenToX( x: number ) {
        return +x * (xMax - xMin) / preview_w + xMin
    }

    function redraw() {
        var ctx = ($preview.find( 'canvas' )[0] as HTMLCanvasElement).getContext( '2d' ), d = chart.dataset, s: LineSeries
        for( var ds = 0, xValues, yValues; ds < d.series.length; ++ds )
            if( ( s = d.series[ds]).visible && (xValues = s.getXValues()).length && (yValues = s.getYValues()).length ) {
                var cp          = s.getBezierCp()
                ctx.strokeStyle = s.lineColor
                ctx.lineWidth   = 1
                ctx.beginPath();
                ctx.moveTo( xToScreen( 0 ), yToScreen( yValues[xMin] ) )
                for( var p = 0, l = xValues.length, ncp = 0; p <= xMax && p < l; ++p, ncp += 4 )
                    ctx.bezierCurveTo(
                        xToScreen( cp[ncp + 0] ), yToScreen( cp[ncp + 1] ),
                        xToScreen( cp[ncp + 2] ), yToScreen( cp[ncp + 3] ),
                        xToScreen( xValues[p + 1] ), yToScreen( yValues[p + 1] )
                    );
                ctx.stroke()
            }
    }

    function update() {
        xMin = 0
        xMax = chart.dataset.getMaxX()
        yMin = 0
        yMax = chart.dataset.getMaxY( 0, xMax )
        if( selected_xMax === undefined )
            selected_xMax = xMax
        preview_w = $preview.innerWidth()
        preview_h = $preview.innerHeight()

        ratio = setupCanvasRatio( $preview.find( 'canvas' )[0] as HTMLCanvasElement )
        setWndGabarites( selected_xMin, selected_xMax )
        redraw()
    }


    $preview.drag( areaSelect ).on( 'dragstart', areaSelectStart ).on( 'dragend', areaSelectEnd )
    $( wnd ).drag( move ).on( 'dragstart', dragstart ).mousedown( false )
    $preview.find( '.cpr-l' ).drag( resizeL ).on( 'dragstart', dragstart ).mousedown( false )
    $preview.find( '.cpr-r' ).drag( resizeR ).on( 'dragstart', dragstart ).mousedown( false )
    chart
        .on( 'scaleChanged', ( e, xFrom, xTo, xMin, xMax ) => setWndGabarites( xMin, xMax ) )
        .on( 'updated', update )


    return self = {
        update,
        setWndGabarites,
    }
}

