/**
 * used to get savingsPrice of line item
 * @param lineItem
 * @returns
 */

function getsavingsPrice(baseprice, adjustedprice) {
    var Money = require('dw/value/Money');

    if (baseprice != undefined && adjustedprice != undefined) {
    	var savingsPrice = Math.abs(baseprice.value - adjustedprice.value);
        var savings = new Money(savingsPrice, baseprice.currencyCode);
        return savings;
    }
}

module.exports = {
    getsavingsPrice: getsavingsPrice
};
