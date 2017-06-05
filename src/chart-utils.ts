/**
 * Преобразовать canvas для retina-дислеев.
 * Это делается по следующему принципу: width/height делается в 2 раза больше, а style-габариты - те же (логические) пиксели, что и были
 * @return ratio - плотность пикселей (во столько раз размеры стали больше)
 */
export function setupCanvasRatio( canvas: HTMLCanvasElement ): number {
    var w = canvas.offsetWidth, h = canvas.offsetHeight, ratio = window.devicePixelRatio || 1
    if( ratio > 1 )
        $( canvas ).css( { width: w, height: h } ).attr( { width: w * 2, height: h * 2 } )
    return ratio
}

