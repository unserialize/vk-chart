/**
 * Расчет контрольных точек для кривой Безье.
 * Для каждого графика точки предрасчитываются и кешируются для рендеринга.
 * http://scaledinnovation.com/analytics/splines/aboutSplines.html
 */
function getControlPoints( x0, y0, x1, y1, x2, y2, t ): number[] {
    var d01 = Math.sqrt( ( x1 - x0 ) * ( x1 - x0 ) + ( y1 - y0 ) * ( y1 - y0 ) ),
        d12 = Math.sqrt( ( x2 - x1 ) * ( x2 - x1 ) + ( y2 - y1 ) * ( y2 - y1 ) ),
        fa  = t * d01 / (d01 + d12),
        fb  = t * d12 / (d01 + d12);
    return [x1 - fa * (x2 - x0), y1 - fa * (y2 - y0), x1 + fb * (x2 - x0), y1 + fb * (y2 - y0)];        // [p1x,p1y,p2x,p2y]
}


/**
 * Серия данных для графика.
 * Сами данные представляют собой одномерный массив - начиная от начала периода (конкретного дня) и по каждому дню непрерывно.
 */
export class LineSeries {
    private bezier_cp: number[]
    private xValues: number[]
    private yValues: number[]

    id: string
    lineColor: string                   // Цвет линий
    fillColor: string                   // Цвет заливки под графиком (вся заливка рисуется с фиксированным opacity) (при 'none' нет заливки)
    pointRadius: number = 4             // Радиус обводки точек (при 0 нет обводки)
    smooth: boolean     = true          // Сглаживание линий через кривую Безье (false - соединительные линии будут прямыми отрезками)
    visible: boolean    = true          // Отображать на графике
    name: string        = 'Серия'       // Название серии (для хинтов и подписей)
    data: number[]      = []            // Данные (y-значения) по каждому дню, начиная от начала, могут быть null (отсутствие точек)

    constructor( ops: { id: string, name: string, lineColor: string, fillColor?: string, data?: number[] } ) {
        this.id        = ops.id
        this.name      = ops.name
        this.lineColor = ops.lineColor
        this.fillColor = ops.fillColor || this.lineColor
        this.data      = ops.data || []
    }

    /** Нормализация в xValues/yValues с учетом null (что некоторые точки могут отсутствовать, а Безье должно чертиться) */
    private normalizeData() {
        this.xValues = []
        this.yValues = []
        for( var data = this.data, x = 0, l = data.length; x < l; ++x )
            if( data[x] !== null )
                this.xValues.push( x ), this.yValues.push( data[x] )
    }

    private ensureDataNormalized() {
        if( !this.xValues )
            this.normalizeData()
    }

    private calcBezierControlPoints( tension ) {
        this.ensureDataNormalized()
        var xValues = this.xValues, yValues = this.yValues
        var cp      = [xValues[0], yValues[0]]        // начальные и конечные точки тоже будут чертиться через bezier, чтобы не писать отдельные ветки как quadratic
        for( var p = 0, l = xValues.length; p < l - 2; ++p )
            cp.push.apply( cp, getControlPoints( xValues[p], yValues[p], xValues[p + 1], yValues[p + 1], xValues[p + 2], yValues[p + 2], tension / (xValues[p + 1] - xValues[p]) ) );
        cp.push( xValues[l - 1], yValues[l - 1] )
        // при данных [0,0,1,0,0] точки возле единицы уходят ниже - такого допускать нельзя; при [10,10,100,10,10] пофиг, не будет заметно - главное ниже нуля не чертить
        // аналогично - с самого верху
        for( l = cp.length - 1, p = this.getMaxY( 0, l ); l > 0; l -= 2 )       // -=2: только по y'ам (в cp чередуются x,y)
            if( cp[l] < 0 )
                cp[l] = 0;
            else if( cp[l] > p )
                cp[l] = p
        return cp
    }

    getXValues() {
        this.ensureDataNormalized()
        return this.xValues
    }

    getYValues() {
        this.ensureDataNormalized()
        return this.yValues
    }

    /** Получить максимальное x-значение (т.е. последнюю дату, для которой есть точка) */
    getMaxX() {
        this.ensureDataNormalized()
        return this.xValues.length ? this.xValues[this.xValues.length - 1] : 0
    }

    /** Получить максимальное значение в конкретном срезе дат */
    getMaxY( xFrom: number, xTo: number ) {         // параметры — целые числа, не дробные
        for( var p = Math.max( 0, xFrom ), max_y = 0, data = this.data; p <= xTo && p < data.length; ++p )
            if( data[p] !== null && data[p] > max_y )
                max_y = data[p]
        return max_y
    }

    /** Получить сумму значений в конкретном срезе дат */
    getSumY( xFrom: number, xTo: number ) {
        for( var p = Math.max( 0, xFrom ), sum_y = 0, data = this.data; p <= xTo && p < data.length; ++p )
            if( data[p] !== null )
                sum_y += data[p]
        return sum_y
    }

    /** Получить control points для рисования кривой Безье; все значения - в логических (не экранных) координатах */
    getBezierCp() {
        if( !this.bezier_cp )
            this.prepareValues()
        return this.bezier_cp
    }

    /** Перекешировать данные; должно вызываться, если данные изменились (значения или количество точек) */
    prepareValues() {
        this.normalizeData()
        this.bezier_cp = this.calcBezierControlPoints( 0.4 )      // подобрано экспериментально, можно поменять и посмотреть что будет
    }
}

/**
 * Данные для графика значений от даты.
 * Может содержать несколько серий, при этом все они начинаются с одного и того же дня (и данные в них идут по каждому дню).
 * @constructor
 */
export class DateDataset {
    dateStart: Date                 // Дата начала всех данных всех серий
    dxMinutes: number               // Расстояние по оси Х между точками (1440 — день)
    series: LineSeries[]            // Серии данных (если не предоставлено, потом можно записать через dataset.series)

    constructor( dateStart: Date, series: LineSeries[], dxMinutes = 1440 ) {
        this.dateStart = dateStart
        this.dxMinutes = dxMinutes
        this.series    = series
    }

    findByID( serieID: string ): LineSeries | null {
        return this.series.filter( s => s.id === serieID )[0] || null
    }

    getVisibleIDs(): string[] {
        return this.series.filter( s => s.visible ).map( s => s.id )
    }

    getMaxX() {
        return this.series.reduce( ( curmax, serie ) => Math.max( curmax, serie.visible ? serie.getMaxX() : 0 ), 0 )
    }

    getMaxY( xFrom: number, xTo: number ) {
        return this.series.reduce( ( curmax, serie ) => Math.max( curmax, serie.visible ? serie.getMaxY( xFrom, xTo ) : 0 ), 0 )
    }
}
