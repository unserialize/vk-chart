/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// identity function for calling harmony imports with the correct context
/******/ 	__webpack_require__.i = function(value) { return value; };
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 3);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports) {

// removed by extract-text-webpack-plugin

/***/ }),
/* 1 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function($) {
Object.defineProperty(exports, "__esModule", { value: true });
__webpack_require__(8);
var chart_1 = __webpack_require__(4);
var chart_preview_1 = __webpack_require__(7);
var chart_hoverer_1 = __webpack_require__(6);
var chart_dataset_1 = __webpack_require__(9);
window.demoEntry = function () {
    var N_POINTS = 400, MAX_Y = 300;
    function rand(maxY) {
        // есть редкие скачки больше maxY
        return Math.round(Math.random() < 0.05 ? Math.random() * maxY * 2 : Math.random() * maxY);
    }
    function generateRandomPoints() {
        s1.data = Array.from({ length: N_POINTS }, function () { return rand(MAX_Y); });
        s2.data = Array.from({ length: N_POINTS }, function () { return rand(MAX_Y); });
        preview.update();
        preview.setWndGabarites(ds.getMaxX() - 20, ds.getMaxX());
        chart.update();
    }
    function scaleChanged(e, xFrom, xTo) {
        var date_from = chart.dataset.dateStart.clone(xFrom), date_to = chart.dataset.dateStart.clone(xTo);
        $('.scale_period').text(date_from.formatDDMM_lbl() + ' – ' + date_to.formatDDMM_lbl());
        $('.sum1').text(chart.dataset.series[0].getSumY(xFrom, xTo).withThousandSeparator());
        $('.sum2').text(chart.dataset.series[1].getSumY(xFrom, xTo).withThousandSeparator());
    }
    var s1 = new chart_dataset_1.LineSeries({ id: 's1', name: 'График 1', lineColor: '#74c600' }), s2 = new chart_dataset_1.LineSeries({ id: 's2', name: 'График 2', lineColor: '#f7a125' }), ds = new chart_dataset_1.DateDataset(new Date(2016, 6, 1), [s1, s2]);
    var chart = chart_1.createDateChart($('canvas')[0], ds), preview = chart_preview_1.createChartPreview(chart, { $preview: $('.chart-preview') }), hoverer = chart_hoverer_1.createChartHoverer(chart, {});
    chart.on('scaleChanged', scaleChanged);
    generateRandomPoints();
    chart.start();
};

/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(2)))

/***/ }),
/* 2 */
/***/ (function(module, exports) {

module.exports = jQuery;

/***/ }),
/* 3 */
/***/ (function(module, exports, __webpack_require__) {

__webpack_require__(1);
module.exports = __webpack_require__(0);


/***/ }),
/* 4 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function($) {
Object.defineProperty(exports, "__esModule", { value: true });
var chart_utils_1 = __webpack_require__(5);
var defaultSettings = {
    gridColor: '#e2e2e2',
    labelsColor: '#555',
    labelsFont: '12px Verdana',
    areaBorderColor: '#d2d2d2',
    allowDrag: true,
    units: '',
};
/**
 * Создание компонента-графика. Для этого нужна разметка .chart > canvas и подготовленный dataset.
 * Это сделано не классом с кучей private-свойств и public/private методов, а через замыкание и создание this:
 * так код в данном случае намного лучше сжимается.
 */
function createDateChart(canvas, d, options) {
    var self, ops = Object.assign({}, defaultSettings, options), buffer = document.createElement('canvas'), ctx = buffer.getContext('2d');
    // размеры контекста
    var ctxW, ctxH;
    // область для непосредственно рисования графиков (без надписей и пр.) - экранные координаты (относительно контекста)
    var areaT, areaL, areaW, areaH;
    // ось y (в абсолютных значениях)
    var yMin, yMax, yStep;
    // ось x
    var xLabelsW = 120, xMin, xMax, xStep;
    // предпросчитанные коэффициенты для перевода логических координат в экранные
    var xScreen_summand, xScreen_mult, yScreen_summand, yScreen_mult;
    // для retina: devicePixelRatio; на эту константу нужно умножать многие координаты
    var ratio = 1.0;
    function trigger(eventName, args) {
        if (ctxW > 0)
            $.event.trigger(eventName, args, self, true); // = $(self).triggerHandler
    }
    // пересчитать габариты в пикселях для рисования; функция должна вызываться извне, если внешний интерфейс меняет размер канвы
    function updateDrawSizes() {
        if (ctxW !== canvas.width || ctxH !== canvas.height) {
            ratio = chart_utils_1.setupCanvasRatio(canvas);
            buffer.width = ctxW = canvas.width;
            buffer.height = ctxH = canvas.height;
            areaL = 50 * ratio;
            areaT = 10 * ratio;
            areaW = ctxW - 51 * ratio;
            areaH = ctxH - 40 * ratio;
        }
    }
    function yToScreen(y) {
        //return areaT + ( yMax - y ) / (yMax - yMin) * areaH
        return yScreen_summand + yScreen_mult * y;
    }
    function xToScreen(x) {
        //return areaL + ( x - xMin ) / (xMax - xMin) * areaW
        return xScreen_summand + xScreen_mult * x;
    }
    function screenToY(y) {
        //return (areaT - y) * (yMax - yMin) / areaH + yMax
        return (y - yScreen_summand) / yScreen_mult;
    }
    function screenToX(x) {
        //return (x - areaL) * (xMax - xMin) / areaW + xMin
        return (x - xScreen_summand) / xScreen_mult;
    }
    function draw() {
        ctx.clearRect(0, 0, ctxW, ctxH);
        ctx.fillStyle = 'white';
        ctx.fillRect(areaL, areaT, areaW, areaH);
        drawYGrid();
        drawYLabels();
        drawXGrid();
        drawXLabels();
        // сначала рисуем ободок у area, чтобы сами графики рисовались поверх
        ctx.save();
        ctx.translate(0.5 * ratio, 0.5 * ratio);
        ctx.strokeStyle = ops.areaBorderColor;
        ctx.lineWidth = ratio;
        ctx.strokeRect(areaL, areaT, areaW, areaH);
        ctx.restore();
        // это нужно, чтобы корректно нулевые значения отображались (нулевая линия затирала бордюр area)
        drawSeries();
        canvas.getContext('2d').clearRect(0, 0, ctxW, ctxH);
        canvas.getContext('2d').drawImage(buffer, 0, 0);
    }
    function drawSeries() {
        ctx.save();
        ctx.beginPath();
        ctx.rect(areaL + ratio, areaT, areaW - ratio, areaH + 10 * ratio); // снизу пространство для нулевых линий и точек
        ctx.clip();
        var s, i, i1, i2, l, ncp, cp, has_effects = areaW / (xMax - xMin) > 15 * ratio; // точки и сглаживание видны, если не слишком маленький масштаб
        for (var ds = 0, xValues, yValues; ds < d.series.length; ++ds)
            if ((s = d.series[ds]).visible && (xValues = s.getXValues()).length && (yValues = s.getYValues()).length) {
                // вычисляем 2 индекса с учётом нулей в графике:
                // точки, которая левее текущей видимой области и точки, которая правее
                l = xValues.length;
                for (i1 = 0; i1 < l && xValues[i1] < xMin; ++i1)
                    ;
                for (i2 = i1 + 1; i2 < l && xValues[i2] <= xMax; ++i2)
                    ;
                i1 > 0 && --i1;
                i2 == l && --i2;
                // сами линии
                ctx.strokeStyle = s.lineColor;
                ctx.lineWidth = 2 * ratio;
                ctx.beginPath();
                ctx.moveTo(xToScreen(xValues[i1]), yToScreen(yValues[i1]));
                if (s.smooth && has_effects)
                    for (i = i1, ncp = i * 4, cp = s.getBezierCp(); i < i2; ++i, ncp += 4)
                        ctx.bezierCurveTo(// [x,y]toScreen заинлайнено
                        xScreen_summand + xScreen_mult * cp[ncp + 0], yScreen_summand + yScreen_mult * cp[ncp + 1], xScreen_summand + xScreen_mult * cp[ncp + 2], yScreen_summand + yScreen_mult * cp[ncp + 3], xScreen_summand + xScreen_mult * xValues[i + 1], yScreen_summand + yScreen_mult * yValues[i + 1]);
                else
                    for (i = i1; i <= i2 && i < l; ++i)
                        ctx.lineTo(xScreen_summand + xScreen_mult * xValues[i], yScreen_summand + yScreen_mult * yValues[i]);
                ctx.stroke();
                // заливка под графиком
                if (s.fillColor != 'none') {
                    ctx.lineTo(xToScreen(xValues[i2]) + 2, areaT + areaH);
                    ctx.lineTo(xToScreen(xValues[i1]), areaT + areaH);
                    ctx.closePath();
                    ctx.fillStyle = s.fillColor;
                    ctx.globalAlpha = 0.05; // вся заливка рисуется с фиксированным opacity (чтобы по умолчанию fillColor=lineColor) (решил не делать это опцией)
                    ctx.fill();
                    ctx.globalAlpha = 1;
                }
                else
                    ctx.closePath();
                // точки
                if (s.pointRadius > 0 && has_effects) {
                    ctx.fillStyle = 'white';
                    ctx.strokeStyle = s.lineColor;
                    ctx.lineWidth = 1.6 * ratio;
                    for (i = i1 || 1; i < i2 && i < l - 1; ++i)
                        if (yValues[i] > 0) {
                            ctx.beginPath();
                            ctx.arc(xScreen_summand + xScreen_mult * xValues[i], yScreen_summand + yScreen_mult * yValues[i], s.pointRadius * ratio, 0, Math.PI * 2);
                            ctx.fill();
                            ctx.stroke();
                        }
                }
            }
        ctx.restore();
    }
    function drawYGrid() {
        ctx.save();
        ctx.translate(0.5 * ratio, 0.5 * ratio); // чтобы горизонтальные линии занимали 1 пиксель, а не 2
        ctx.strokeStyle = ops.gridColor;
        ctx.lineWidth = ratio;
        for (var y = yMin, y_scr; y <= yMax; y += yStep) {
            y_scr = Math.ceil(yToScreen(y)); // чтоб было целое число => однопиксельные линии
            ctx.beginPath();
            ctx.moveTo(areaL, y_scr);
            ctx.lineTo(areaL + areaW, y_scr);
            ctx.stroke();
        }
        ctx.restore();
    }
    function drawYLabels() {
        ctx.save();
        ctx.fillStyle = ops.labelsColor;
        ctx.font = ops.labelsFont.replace(/(\d+)(px|pt)/g, function (m, n, units) {
            return n * ratio + units;
        });
        ctx.textBaseline = 'middle';
        var y, n_fixed = yStep < 1 ? 1 : 0; // число знаков после запятой по оси Y: есть, если слишком малые величины
        var yAxisRotated = yMax >= 100000;
        if (yAxisRotated) {
            ctx.textAlign = 'center';
            ctx.rotate(-Math.PI / 2);
            for (y = yMin; y < yMax; y += yStep + yStep)
                ctx.fillText(y.withThousandSeparator(), -yToScreen(y), 40 * ratio);
        }
        else {
            ctx.textAlign = 'right';
            for (y = yMin; y <= yMax; y += yStep)
                ctx.fillText(y.toFixed(n_fixed), 40 * ratio, yToScreen(y));
        }
        ctx.restore();
    }
    function drawXGrid() {
        ctx.save();
        ctx.translate(0.5 * ratio, 0.5 * ratio); // чтобы вертикальные линии занимали 1 пиксель, а не 2
        ctx.strokeStyle = ops.gridColor;
        ctx.lineWidth = ratio;
        for (var x = Math.ceil(xMin / xStep) * xStep - 0.5, x_scr; x < xMax; x += xStep) {
            x_scr = Math.ceil(xToScreen(x)); // чтоб было целое число => однопиксельные линии
            if (x_scr > areaL && x_scr < areaL + areaW) {
                ctx.beginPath();
                ctx.moveTo(x_scr, areaT);
                ctx.lineTo(x_scr, areaT + areaH);
                ctx.stroke();
            }
        }
        ctx.restore();
    }
    function drawXLabels() {
        ctx.save();
        ctx.fillStyle = ops.labelsColor;
        ctx.font = ops.labelsFont.replace(/(\d+)(px|pt)/g, function (m, n, units) { return n * ratio + units; });
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        var dxMs = d.dxMinutes * 60000, showHHMM = d.dxMinutes < 1440 && (xMax - xMin) * d.dxMinutes < 1440 * 5, date = new Date(d.dateStart), x = Math.ceil(xMin / xStep) * xStep - (xStep == 1 ? 0 : 0.5);
        date.setTime(date.getTime() + Math.ceil(x) * dxMs);
        for (var x_scr; x < xMax; x += xStep, date.setTime(date.getTime() + xStep * dxMs)) {
            x_scr = xToScreen(x);
            if (x_scr > areaL + xLabelsW * ratio / 2 && x_scr < areaL + areaW - xLabelsW * ratio / 2) {
                var lbl = showHHMM ? date.hmm() : date.formatDDMM_lbl();
                ctx.fillText(lbl, x_scr, areaT + areaH + 9 * ratio);
            }
        }
        ctx.restore();
    }
    // расчет шага и максимального значения шкалы ординат, учитывая, что максимальная отображаемая точка имеет координату pointMaxY
    function calcYScale(pointMaxY) {
        if (pointMaxY <= 1) {
            yMin = 0;
            yMax = 1;
            yStep = 0.2;
            return;
        }
        yStep = Math.max(1, pointMaxY * 1.5) + 1;
        var ends = [1, 2, 5], vals_now = [], size = pointMaxY, cur_d;
        var max_labels = Math.floor(areaH / 50 / ratio), cur_labels = max_labels + 1;
        if (max_labels <= 0)
            return;
        var need_pow = Math.pow(10, Math.floor(Math.log(size / max_labels) / Math.LN10)), i;
        for (i = 0; i < ends.length; ++i)
            vals_now[i] = ends[i] * need_pow;
        while (cur_labels > max_labels)
            for (i = 0; i < ends.length && cur_labels > max_labels; vals_now[i++] *= 10.) {
                yStep = vals_now[i];
                cur_labels = Math.floor(cur_d = size / yStep);
                if (Math.abs(cur_d - Math.floor(cur_d)) > 1e-6)
                    ++cur_labels; // cur_d не целое
            }
        yMin = 0;
        yMax = Math.ceil(pointMaxY / yStep + 1e-4) * yStep;
    }
    function setXScale(newXMin, newXMax, dontCheckEqual) {
        if (dontCheckEqual === void 0) { dontCheckEqual = false; }
        if (!dontCheckEqual && xMin === newXMin && xMax === newXMax)
            return;
        xMin = Math.min(newXMin, newXMax);
        xMax = Math.max(newXMin, newXMax);
        var max_y = d.getMaxY(Math.floor(xMin), Math.ceil(xMax));
        calcYScale(max_y);
        xStep = Math.ceil((xMax - xMin) / (areaW / xLabelsW / ratio));
        // если смотреть формулу, то x_screen = areaL + ( x - xMin ) / (xMax - xMin) * areaW
        // реально же можно сделать x_screen = xScreen_summand + xScreen_mult * x
        // т.к. [x,y]toScreen вызывается очень часто, эта оптимизация не помешает; кроме того, в главном цикле рисования это даже заинлайнено
        xScreen_mult = areaW / (xMax - xMin);
        xScreen_summand = areaL - xMin * areaW / (xMax - xMin);
        yScreen_mult = -areaH / (yMax - yMin);
        yScreen_summand = areaT + yMax * areaH / (yMax - yMin);
        // фух, все готово
        draw();
        // событие, чтобы внешний интерфейс его поймал и отобразил промежуток видимых дат, какую-нибудь сумму значений по сериям и т.п.
        // если xMin и xMax - дробные, то для внешнего интерфейса большую ценность представляют целые значения - дни, которые полностью влезают внутрь видимой области
        trigger('scaleChanged', self.getXScale());
    }
    function recalcYScale() {
        setXScale(xMin, xMax, true);
    }
    function getPointAt(layerX, layerY) {
        var y = screenToY(layerY), near_x = getRoundedXCoordAt(layerX, layerY), nearest_s_idx, min_dy, s;
        if (near_x == null || near_x < xMin || near_x > xMax)
            return null;
        for (var ds = 0; ds < d.series.length; ++ds)
            if ((s = d.series[ds]).visible && s.data[near_x] != null && (nearest_s_idx === undefined || Math.abs(s.data[near_x] - y) <= min_dy))
                nearest_s_idx = ds, min_dy = Math.abs(s.data[near_x] - y);
        if (nearest_s_idx === undefined)
            return null;
        var near_y = d.series[nearest_s_idx].data[near_x];
        if (Math.abs(layerX - xToScreen(near_x)) > 10 * ratio || Math.abs(layerY - yToScreen(near_y)) > 10 * ratio)
            return null;
        return { y: near_y, layerY: yToScreen(near_y) / ratio, x: near_x, layerX: xToScreen(near_x) / ratio, serie: d.series[nearest_s_idx] };
    }
    function getRoundedXCoordAt(layerX, layerY) {
        if (layerX < areaL || layerX > areaL + areaW || layerY < areaT || layerY > areaT + areaH + 6)
            return null;
        return Math.round(screenToX(layerX));
    }
    function initDragChangeScale() {
        var delta, start_min_x, max_x;
        $(canvas)
            .drag(function (e, dd) {
            var new_xmin = Math.max(0, Math.min(max_x - delta, start_min_x - delta / areaW * dd.dx * ratio));
            setXScale(new_xmin, new_xmin + delta);
        })
            .on('dragstart', function (e, dd) {
            var off = $(this).offset(), layer_x = e.pageX - off.left, layer_y = e.pageY - off.top;
            if (!(layer_x >= areaL && layer_x <= areaL + areaW && layer_y >= areaT && layer_y <= areaT + areaH))
                return false;
            delta = xMax - xMin;
            start_min_x = xMin;
            max_x = d.getMaxX();
            $('<div class="hover_block">').appendTo('body'); // он перехватывает курсор, чтоб в css hover-эффекты не срабатывали
        })
            .on('dragend', function () {
            $('.hover_block').remove();
        });
    }
    /**
     * Фукнция должна вызываться извне, когда изменились свойства (цвет/видимость/значения) серий или их количество.
     * Т.е. нужно пересчитать масштаб, перерисовать все, а также проапдейтить превьюшки, чекбоксы и пр. (последнее делается за счет генерации события, те компоненты на него подписываются).
     */
    function seriesUpdatedCallback() {
        if (ctxW > 0) {
            d.series.forEach(function (serie) { return serie.prepareValues(); });
            recalcYScale(); // это и перерисовка тоже, и scaleChanged
            trigger('updated');
        }
        return self;
    }
    return self = {
        dataset: d,
        ops: ops,
        canvas: canvas,
        setXScale: setXScale,
        getXScale: function () {
            return [Math.ceil(xMin), Math.floor(xMax), xMin, xMax];
        },
        updateSize: function () {
            updateDrawSizes();
        },
        getPointAt: function (layerX, layerY) {
            return getPointAt(layerX * ratio, layerY * ratio);
        },
        getXAt: function (layerX, layerY) {
            return getRoundedXCoordAt(layerX * ratio, layerY * ratio);
        },
        isInArea: function (x, y) {
            return x >= xMin && x <= xMax && y >= yMin && y <= yMax;
        },
        xToScreen: function (pointX) {
            return xToScreen(pointX) / ratio;
        },
        yToScreen: function (pointY) {
            return yToScreen(pointY) / ratio;
        },
        update: function () {
            seriesUpdatedCallback();
        },
        on: function (eventName, callback) {
            return $(this).on(eventName, callback), this;
        },
        one: function (eventName, callback) {
            return $(this).one(eventName, callback), this;
        },
        off: function (eventName, callback) {
            return $(this).off(eventName, callback), this;
        },
        start: function () {
            updateDrawSizes();
            seriesUpdatedCallback();
            ops.allowDrag && initDragChangeScale();
        },
    };
}
exports.createDateChart = createDateChart;

/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(2)))

/***/ }),
/* 5 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function($) {
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Преобразовать canvas для retina-дислеев.
 * Это делается по следующему принципу: width/height делается в 2 раза больше, а style-габариты - те же (логические) пиксели, что и были
 * @return ratio - плотность пикселей (во столько раз размеры стали больше)
 */
function setupCanvasRatio(canvas) {
    var w = canvas.offsetWidth, h = canvas.offsetHeight, ratio = window.devicePixelRatio || 1;
    if (ratio > 1)
        $(canvas).css({ width: w, height: h }).attr({ width: w * 2, height: h * 2 });
    return ratio;
}
exports.setupCanvasRatio = setupCanvasRatio;

/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(2)))

/***/ }),
/* 6 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function($) {
Object.defineProperty(exports, "__esModule", { value: true });
var defaultHovererSettings = {};
/**
 * Интерактив mouseover-функционала графика. Если он нужен, нужно создать сначала график, а потом его.
 * График ведь рисуется на canvas, это не svg, у элементов которого можно было бы ловить события мыши, поэтому тут нужно вручную все делать.
 * Код оптимизирован на производительность в угоду простоте написания/использования - т.к. большинство действий должно работать при mousemove параллельно с отрисовкой.
 */
function createChartHoverer(chart, options) {
    var self, round = Math.round, ops = Object.assign({}, defaultHovererSettings, options), units = '';
    // при ховере на конкретную точку подсвечивается сама точка и пишется подробный хинт возле нее
    var point_hint, point_sign;
    // а просто при движении мыши, когда мышь на какой-то x-полосе, отображаются ховеры возле каждой точки с этой x-координатой каждого графика (x_hints) и точки выделяются (x_points)
    var x_hints = [], x_points = []; // [i] отвечает series[i] (отображает ее данные при ховере или не видно, если visible false у серии)
    var thsep = function (n) { return n.withThousandSeparator(); };
    function trigger(eventName, arg1, arg2, arg3) {
        if (ops[eventName])
            ops[eventName].call(this, arg1, arg2, arg3);
    }
    function mouseMove(e) {
        var ev = e.originalEvent, layer_x = ev.offsetX || ev.layerX, layer_y = ev.offsetY || ev.layerY, i, series;
        var x_coord = chart.getXAt(layer_x, layer_y), point_info = chart.getPointAt(layer_x, layer_y);
        if (!point_info) {
            setPointDisplay('none');
            for (series = chart.dataset.series, i = x_coord != null ? series.length : 0; i--;)
                if (series[i].visible && series[i].data[x_coord] !== null && chart.isInArea(x_coord, series[i].data[x_coord])) {
                    x_hints[i].innerHTML = thsep(round(series[i].data[x_coord])) + units; // значение y
                    x_hints[i].style.display = x_points[i].style.display = 'block';
                    x_hints[i].style.top = round(chart.yToScreen(series[i].data[x_coord])) - 28 + 'px';
                    x_hints[i].style.left = round(chart.xToScreen(x_coord) - x_hints[i].offsetWidth / 2) + 'px';
                    x_points[i].style.top = round(chart.yToScreen(series[i].data[x_coord])) + 'px';
                    x_points[i].style.left = round(chart.xToScreen(x_coord)) + 'px';
                }
                else
                    x_hints[i].style.display = x_points[i].style.display = 'none';
        }
        else {
            setPointDisplay('block');
            setXHintsDisplay('none');
            point_hint.style.left = point_sign.style.left = round(point_info.layerX) + 'px';
            point_hint.style.top = round(point_info.layerY - 6) + 'px';
            point_sign.style.top = round(point_info.layerY) + 'px';
            point_sign.style.backgroundColor = point_hint.style.backgroundColor = point_hint.style.borderTopColor = point_info.serie.lineColor;
            self.shown(point_info.y, point_info.x, point_info.serie, point_hint);
        }
        if (x_coord != null)
            trigger('onMouse', x_coord);
        else
            mouseOut(e);
    }
    function mouseOut(e) {
        setPointDisplay('none');
        setXHintsDisplay('none');
        trigger('onMouseOut');
    }
    function setPointDisplay(newDisplay) {
        if (point_sign.style.display !== newDisplay) {
            point_hint.style.display = point_sign.style.display = newDisplay;
        }
    }
    function setXHintsDisplay(newDisplay) {
        for (var i = 0; i < x_hints.length; ++i)
            x_hints[i].style.display = x_points[i].style.display = newDisplay;
    }
    function update() {
        units = chart.ops.units || '';
        $(x_hints).add(x_points).remove(); // эти удаляются и создаются сколько нужно (=сколько серий), за statics отвечает внешний интерфейс (т.к. они вне и находятся)
        x_hints = [], x_points = [];
        for (var i = 0, series = chart.dataset.series; i < series.length; ++i) {
            x_hints.push($('<div class="chart_x_hint" style="display:none;background-color: ' + series[i].lineColor + '"></div>')
                .appendTo(chart.canvas.parentNode)[0]); // не insertAfter canvas: важен порядок
            x_points.push($('<div class="chart_x_point" style="display:none;background-color: ' + series[i].lineColor + '"></div>')
                .appendTo(chart.canvas.parentNode)[0]);
        }
    }
    function enable() {
        point_hint = $('<div class="hint-t chart_point_hint" data-hint="" style="display: none"></div>').insertAfter(chart.canvas)[0];
        point_sign = $('<div class="chart_point_sign" style="display: none"></div>').insertAfter(chart.canvas)[0];
        $(chart.canvas).on('mousemove.hov mouseover.hov', mouseMove).on('mouseout.hov', mouseOut);
        chart.on('updated', update);
        update();
    }
    chart.one('updated', function () { return enable(); }); // при chart.start
    return self = {
        ops: ops,
        // может быть извне перегружена для созданного объекта (например, для другого формата data-hint или дать какой-нибудь класс подсказке)
        shown: function (yVal, xVal, serie, hint) {
            var date = new Date(chart.dataset.dateStart.getTime() + xVal * chart.dataset.dxMinutes * 60000), is_last = xVal > chart.getXScale()[1] - 2, lbl = chart.dataset.dxMinutes < 1440 ? date.formatAsVk() : date.formatDDMMYY_lbl();
            hint.classList[is_last ? 'add' : 'remove']('hint-align-r');
            hint.setAttribute('data-hint', thsep(Math.round(yVal)) + units + ' — ' + serie.name.toLowerCase() + "\n" + lbl);
        }
    };
}
exports.createChartHoverer = createChartHoverer;

/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(2)))

/***/ }),
/* 7 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/* WEBPACK VAR INJECTION */(function($) {
Object.defineProperty(exports, "__esModule", { value: true });
var chart_utils_1 = __webpack_require__(5);
var defaultPreviewSettings = {
    $preview: null
};
/**
 * Превьюшка графика, отображающая все данные сразу в мелком масштабе, где можно выбирать область просмотра. Для создания должна быть корректная html-верстка $preview.
 * При ее необходимости сначала нужно создать график chart, а потом превью.
 */
function createChartPreview(chart, options) {
    var self, ops = Object.assign({}, defaultPreviewSettings, options), $preview = ops.$preview;
    // контролы
    var wnd = $preview.find('.cp-wnd')[0], overlay_l = $preview.find('.cpo-l')[0], overlay_r = $preview.find('.cpo-r')[0], area_select = $preview.find('.area_select')[0];
    // размеры для таскания и определения текущего масштаба
    var was_wnd_l, was_wnd_r, wnd_w, preview_w, preview_h;
    // диапазоны осей и wnd-выделения
    var xMin, xMax, yMin, yMax, selected_xMin, selected_xMax;
    // для retina: devicePixelRatio; на эту константу нужно умножать многие координаты
    var ratio = 1.0;
    function dragstart(e, dd) {
        was_wnd_l = xToScreen(selected_xMin) / ratio;
        was_wnd_r = xToScreen(selected_xMax) / ratio;
        wnd_w = was_wnd_r - was_wnd_l;
    }
    function move(e, dd) {
        var delta = selected_xMax - selected_xMin, new_l = screenToX(Math.max(0, Math.min(preview_w - wnd_w, was_wnd_l + dd.dx)));
        setWndGabarites(new_l, new_l + delta);
    }
    function resizeL(e, dd) {
        var new_l = screenToX(Math.max(0, Math.min(was_wnd_r - 10, was_wnd_l + dd.dx)));
        setWndGabarites(new_l, selected_xMax);
    }
    function resizeR(e, dd) {
        var new_r = screenToX(Math.max(was_wnd_l + 10, Math.min(preview_w, was_wnd_r + dd.dx)));
        setWndGabarites(selected_xMin, new_r);
    }
    function areaSelectStart(e, dd) {
        dd.clickX = dd.startX - $preview.offset().left;
        area_select.style.display = 'block';
        area_select.style.left = dd.clickX + 'px';
        area_select.style.width = '0';
    }
    function areaSelect(e, dd) {
        area_select.style.left = (dd.dx > 0 ? dd.clickX : Math.max(0, dd.clickX + dd.dx)) + 'px';
        area_select.style.width = (dd.dx > 0 ? Math.min(preview_w - dd.clickX, dd.dx) : dd.clickX - parseInt(area_select.style.left)) + 'px';
    }
    function areaSelectEnd(e, dd) {
        if (parseInt(area_select.style.width) >= 10)
            setWndGabarites(screenToX(parseInt(area_select.style.left)), screenToX(parseInt(area_select.style.left) + parseInt(area_select.style.width)));
        area_select.style.display = 'none';
    }
    function setWndGabarites(newXMin, newXMax) {
        selected_xMin = newXMin;
        selected_xMax = newXMax;
        var left_scr = Math.round(xToScreen(selected_xMin) / ratio), right_scr = Math.round(xToScreen(selected_xMax) / ratio);
        wnd.style.left = left_scr + 'px';
        wnd.style.right = preview_w - right_scr + 'px';
        overlay_r.style.left = right_scr + 'px';
        overlay_l.style.width = left_scr + 'px';
        chart.setXScale(selected_xMin, selected_xMax);
    }
    function yToScreen(y) {
        return (yMax - y) / (yMax - yMin) * preview_h * ratio;
    }
    function xToScreen(x) {
        return (x - xMin) / (xMax - xMin) * preview_w * ratio;
    }
    function screenToY(y) {
        return -y * (yMax - yMin) / preview_h + yMax;
    }
    function screenToX(x) {
        return +x * (xMax - xMin) / preview_w + xMin;
    }
    function redraw() {
        var ctx = $preview.find('canvas')[0].getContext('2d'), d = chart.dataset, s;
        for (var ds = 0, xValues, yValues; ds < d.series.length; ++ds)
            if ((s = d.series[ds]).visible && (xValues = s.getXValues()).length && (yValues = s.getYValues()).length) {
                var cp = s.getBezierCp();
                ctx.strokeStyle = s.lineColor;
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(xToScreen(0), yToScreen(yValues[xMin]));
                for (var p = 0, l = xValues.length, ncp = 0; p <= xMax && p < l; ++p, ncp += 4)
                    ctx.bezierCurveTo(xToScreen(cp[ncp + 0]), yToScreen(cp[ncp + 1]), xToScreen(cp[ncp + 2]), yToScreen(cp[ncp + 3]), xToScreen(xValues[p + 1]), yToScreen(yValues[p + 1]));
                ctx.stroke();
            }
    }
    function update() {
        xMin = 0;
        xMax = chart.dataset.getMaxX();
        yMin = 0;
        yMax = chart.dataset.getMaxY(0, xMax);
        if (selected_xMax === undefined)
            selected_xMax = xMax;
        preview_w = $preview.innerWidth();
        preview_h = $preview.innerHeight();
        ratio = chart_utils_1.setupCanvasRatio($preview.find('canvas')[0]);
        setWndGabarites(selected_xMin, selected_xMax);
        redraw();
    }
    $preview.drag(areaSelect).on('dragstart', areaSelectStart).on('dragend', areaSelectEnd);
    $(wnd).drag(move).on('dragstart', dragstart).mousedown(false);
    $preview.find('.cpr-l').drag(resizeL).on('dragstart', dragstart).mousedown(false);
    $preview.find('.cpr-r').drag(resizeR).on('dragstart', dragstart).mousedown(false);
    chart
        .on('scaleChanged', function (e, xFrom, xTo, xMin, xMax) { return setWndGabarites(xMin, xMax); })
        .on('updated', update);
    return self = {
        update: update,
        setWndGabarites: setWndGabarites,
    };
}
exports.createChartPreview = createChartPreview;

/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(2)))

/***/ }),
/* 8 */
/***/ (function(module, exports) {

/*
 Расширение прототипов нативных js-объектов
 */
(function () {
    var thousandsRegex = /(\d+)(\d{3})/;
    /**
     * 1234567 => '1 234 567'
     * Среди всех вариантов выбрана оптимальная по скорости.
     * Поддерживаются только целые числа (отрицательные тоже). Дробные не поддерживаются, чтоб было быстрее (без split и пр.).
     */
    function printWithThousandSeparator(number) {
        if (number > -1000 && number < 1000)
            return number.toString();
        var n = number.toString();
        while (thousandsRegex.test(n)) {
            n = n.replace(thousandsRegex, '$1 $2');
        }
        return n;
    }
    Number.prototype.withThousandSeparator = function () {
        return printWithThousandSeparator(this);
    };
    String.prototype.withThousandSeparator = function () {
        var number = parseInt(this, 10);
        return isNaN(number) ? 'NaN' : printWithThousandSeparator(number);
    };
})();
(function () {
    function z(num) {
        return num < 10 ? '0' + num : num;
    }
    var monthNamesShort = ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
    var monthNamesLong = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
    var cur_y = new Date().getFullYear();
    Date.prototype.formatDDMM_lbl = function () {
        return this.getDate() + ' ' + monthNamesLong[this.getMonth()];
    };
    Date.prototype.formatDDMMYY_lbl = function () {
        return this.getDate() + ' ' + monthNamesLong[this.getMonth()] + ' ' + this.getFullYear();
    };
    Date.prototype.formatAsVk = function () {
        return this.getDate() + ' ' + monthNamesShort[this.getMonth()] +
            (this.getFullYear() === cur_y ? '' : ' ' + this.getFullYear()) +
            ' в ' + this.getHours() + ':' + z(this.getMinutes());
    };
    Date.prototype.hmm = function () {
        return this.getHours() + ':' + z(this.getMinutes());
    };
    Date.prototype.clone = function (addDays, addMonths) {
        return new Date(this.getFullYear(), this.getMonth() + (addMonths >> 0), this.getDate() + (addDays >> 0));
    };
})();


/***/ }),
/* 9 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Расчет контрольных точек для кривой Безье.
 * Для каждого графика точки предрасчитываются и кешируются для рендеринга.
 * http://scaledinnovation.com/analytics/splines/aboutSplines.html
 */
function getControlPoints(x0, y0, x1, y1, x2, y2, t) {
    var d01 = Math.sqrt((x1 - x0) * (x1 - x0) + (y1 - y0) * (y1 - y0)), d12 = Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1)), fa = t * d01 / (d01 + d12), fb = t * d12 / (d01 + d12);
    return [x1 - fa * (x2 - x0), y1 - fa * (y2 - y0), x1 + fb * (x2 - x0), y1 + fb * (y2 - y0)]; // [p1x,p1y,p2x,p2y]
}
/**
 * Серия данных для графика.
 * Сами данные представляют собой одномерный массив - начиная от начала периода (конкретного дня) и по каждому дню непрерывно.
 */
var LineSeries = (function () {
    function LineSeries(ops) {
        this.pointRadius = 4; // Радиус обводки точек (при 0 нет обводки)
        this.smooth = true; // Сглаживание линий через кривую Безье (false - соединительные линии будут прямыми отрезками)
        this.visible = true; // Отображать на графике
        this.name = 'Серия'; // Название серии (для хинтов и подписей)
        this.data = []; // Данные (y-значения) по каждому дню, начиная от начала, могут быть null (отсутствие точек)
        this.id = ops.id;
        this.name = ops.name;
        this.lineColor = ops.lineColor;
        this.fillColor = ops.fillColor || this.lineColor;
        this.data = ops.data || [];
    }
    /** Нормализация в xValues/yValues с учетом null (что некоторые точки могут отсутствовать, а Безье должно чертиться) */
    LineSeries.prototype.normalizeData = function () {
        this.xValues = [];
        this.yValues = [];
        for (var data = this.data, x = 0, l = data.length; x < l; ++x)
            if (data[x] !== null)
                this.xValues.push(x), this.yValues.push(data[x]);
    };
    LineSeries.prototype.ensureDataNormalized = function () {
        if (!this.xValues)
            this.normalizeData();
    };
    LineSeries.prototype.calcBezierControlPoints = function (tension) {
        this.ensureDataNormalized();
        var xValues = this.xValues, yValues = this.yValues;
        var cp = [xValues[0], yValues[0]]; // начальные и конечные точки тоже будут чертиться через bezier, чтобы не писать отдельные ветки как quadratic
        for (var p = 0, l = xValues.length; p < l - 2; ++p)
            cp.push.apply(cp, getControlPoints(xValues[p], yValues[p], xValues[p + 1], yValues[p + 1], xValues[p + 2], yValues[p + 2], tension / (xValues[p + 1] - xValues[p])));
        cp.push(xValues[l - 1], yValues[l - 1]);
        // при данных [0,0,1,0,0] точки возле единицы уходят ниже - такого допускать нельзя; при [10,10,100,10,10] пофиг, не будет заметно - главное ниже нуля не чертить
        // аналогично - с самого верху
        for (l = cp.length - 1, p = this.getMaxY(0, l); l > 0; l -= 2)
            if (cp[l] < 0)
                cp[l] = 0;
            else if (cp[l] > p)
                cp[l] = p;
        return cp;
    };
    LineSeries.prototype.getXValues = function () {
        this.ensureDataNormalized();
        return this.xValues;
    };
    LineSeries.prototype.getYValues = function () {
        this.ensureDataNormalized();
        return this.yValues;
    };
    /** Получить максимальное x-значение (т.е. последнюю дату, для которой есть точка) */
    LineSeries.prototype.getMaxX = function () {
        this.ensureDataNormalized();
        return this.xValues.length ? this.xValues[this.xValues.length - 1] : 0;
    };
    /** Получить максимальное значение в конкретном срезе дат */
    LineSeries.prototype.getMaxY = function (xFrom, xTo) {
        for (var p = Math.max(0, xFrom), max_y = 0, data = this.data; p <= xTo && p < data.length; ++p)
            if (data[p] !== null && data[p] > max_y)
                max_y = data[p];
        return max_y;
    };
    /** Получить сумму значений в конкретном срезе дат */
    LineSeries.prototype.getSumY = function (xFrom, xTo) {
        for (var p = Math.max(0, xFrom), sum_y = 0, data = this.data; p <= xTo && p < data.length; ++p)
            if (data[p] !== null)
                sum_y += data[p];
        return sum_y;
    };
    /** Получить control points для рисования кривой Безье; все значения - в логических (не экранных) координатах */
    LineSeries.prototype.getBezierCp = function () {
        if (!this.bezier_cp)
            this.prepareValues();
        return this.bezier_cp;
    };
    /** Перекешировать данные; должно вызываться, если данные изменились (значения или количество точек) */
    LineSeries.prototype.prepareValues = function () {
        this.normalizeData();
        this.bezier_cp = this.calcBezierControlPoints(0.4); // подобрано экспериментально, можно поменять и посмотреть что будет
    };
    return LineSeries;
}());
exports.LineSeries = LineSeries;
/**
 * Данные для графика значений от даты.
 * Может содержать несколько серий, при этом все они начинаются с одного и того же дня (и данные в них идут по каждому дню).
 * @constructor
 */
var DateDataset = (function () {
    function DateDataset(dateStart, series, dxMinutes) {
        if (dxMinutes === void 0) { dxMinutes = 1440; }
        this.dateStart = dateStart;
        this.dxMinutes = dxMinutes;
        this.series = series;
    }
    DateDataset.prototype.findByID = function (serieID) {
        return this.series.filter(function (s) { return s.id === serieID; })[0] || null;
    };
    DateDataset.prototype.getVisibleIDs = function () {
        return this.series.filter(function (s) { return s.visible; }).map(function (s) { return s.id; });
    };
    DateDataset.prototype.getMaxX = function () {
        return this.series.reduce(function (curmax, serie) { return Math.max(curmax, serie.visible ? serie.getMaxX() : 0); }, 0);
    };
    DateDataset.prototype.getMaxY = function (xFrom, xTo) {
        return this.series.reduce(function (curmax, serie) { return Math.max(curmax, serie.visible ? serie.getMaxY(xFrom, xTo) : 0); }, 0);
    };
    return DateDataset;
}());
exports.DateDataset = DateDataset;


/***/ })
/******/ ]);