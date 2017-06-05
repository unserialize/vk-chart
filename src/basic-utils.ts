/*
 Расширение прототипов нативных js-объектов
 */

interface Number {
    withThousandSeparator(): string
}

interface String {
    withThousandSeparator(): string
}

interface Date {
    formatDDMM_lbl(): string
    formatDDMMYY_lbl(): string
    formatAsVk(): string
    hmm(): string
    clone( addDays: number, addMonths?: number ): Date
}


(function() {

    var thousandsRegex = /(\d+)(\d{3})/;

    /**
     * 1234567 => '1 234 567'
     * Среди всех вариантов выбрана оптимальная по скорости.
     * Поддерживаются только целые числа (отрицательные тоже). Дробные не поддерживаются, чтоб было быстрее (без split и пр.).
     */
    function printWithThousandSeparator( number: number ): string {
        if( number > -1000 && number < 1000 )
            return number.toString()

        var n = number.toString()
        while( thousandsRegex.test( n ) ) {
            n = n.replace( thousandsRegex, '$1 $2' )
        }
        return n
    }

    Number.prototype.withThousandSeparator = function() {
        return printWithThousandSeparator( this )
    }

    String.prototype.withThousandSeparator = function() {
        var number = parseInt( this, 10 )
        return isNaN( number ) ? 'NaN' : printWithThousandSeparator( number )
    }
})();

(function() {
    function z( num ) {
        return num < 10 ? '0' + num : num
    }

    var monthNamesShort = ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек']
    var monthNamesLong  = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря']
    var cur_y           = new Date().getFullYear()


    Date.prototype.formatDDMM_lbl = function() {
        return this.getDate() + ' ' + monthNamesLong[this.getMonth()]
    }

    Date.prototype.formatDDMMYY_lbl = function() {
        return this.getDate() + ' ' + monthNamesLong[this.getMonth()] + ' ' + this.getFullYear()
    }

    Date.prototype.formatAsVk = function() {
        return this.getDate() + ' ' + monthNamesShort[this.getMonth()] +
            (this.getFullYear() === cur_y ? '' : ' ' + this.getFullYear() ) +
            ' в ' + this.getHours() + ':' + z( this.getMinutes() )
    }

    Date.prototype.hmm = function() {
        return this.getHours() + ':' + z( this.getMinutes() )
    }

    Date.prototype.clone = function( addDays: number, addMonths?: number ) {
        return new Date( this.getFullYear(), this.getMonth() + (addMonths >> 0), this.getDate() + (addDays >> 0) )
    }
})();