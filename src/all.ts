import './basic-utils.ts'
import { createDateChart } from './chart'
import { createChartPreview } from './chart-preview'
import { createChartHoverer } from './chart-hoverer'
import { DateDataset, LineSeries } from './chart-dataset'


(<any>window).demoEntry = function() {

    const N_POINTS = 400,
          MAX_Y    = 300

    function rand( maxY ) {
        // есть редкие скачки больше maxY
        return Math.round( Math.random() < 0.05 ? Math.random() * maxY * 2 : Math.random() * maxY )
    }

    function generateRandomPoints() {
        s1.data = Array.from( { length: N_POINTS }, () => rand( MAX_Y ) )
        s2.data = Array.from( { length: N_POINTS }, () => rand( MAX_Y ) )
        preview.update()
        preview.setWndGabarites( ds.getMaxX() - 20, ds.getMaxX() )
        chart.update()
    }

    function scaleChanged( e, xFrom: number, xTo: number ) {
        var date_from = chart.dataset.dateStart.clone( xFrom ),
            date_to   = chart.dataset.dateStart.clone( xTo )
        $( '.scale_period' ).text( date_from.formatDDMM_lbl() + ' – ' + date_to.formatDDMM_lbl() )
        $( '.sum1' ).text( chart.dataset.series[0].getSumY( xFrom, xTo ).withThousandSeparator() )
        $( '.sum2' ).text( chart.dataset.series[1].getSumY( xFrom, xTo ).withThousandSeparator() )
    }

    var s1 = new LineSeries( { id: 's1', name: 'График 1', lineColor: '#74c600' } ),
        s2 = new LineSeries( { id: 's2', name: 'График 2', lineColor: '#f7a125' } ),
        ds = new DateDataset( new Date( 2016, 6, 1 ), [s1, s2] )

    var chart   = createDateChart( $( 'canvas' )[0] as HTMLCanvasElement, ds ),
        preview = createChartPreview( chart, { $preview: $( '.chart-preview' ) } ),
        hoverer = createChartHoverer( chart, {} )
    chart.on( 'scaleChanged', scaleChanged )
    generateRandomPoints()
    chart.start()

}