/* eslint-disable no-unused-vars */
'use strict';

var formatMoney = require('dw/util/StringUtils').formatMoney;
var eswHelper = require('*/cartridge/scripts/helper/eswHelper').getEswHelper();

var base = module.superModule;

/**
 * Accepts a total object and formats the value
 * @param {dw.value.Money} total - Total price of the cart
 * @param {Object} availableObject - Available Money Object
 * @returns {string} the formatted money value
 */
function getTotals(total, availableObject) {
    if (availableObject) {
        return !total.available ? '-' : formatMoney(eswHelper.getMoneyObject(total, true, false));
    } else { // eslint-disable-line no-else-return
        return !total.available ? '-' : formatMoney(eswHelper.getMoneyObject(total, false, false));
    }
}

/**
 * Accepts a total object and formats the value for order history
 * @param {dw.value.Money} total - Total price of the cart
 * @param {string} currency - currency of eswShopperCurrencyCode
 * @returns {string} the formatted money value
 */
function getOrderTotals(total, currency) {
    /** Custom Start: When there is no shipping apply total has 0 and it is
     * considered to be false the condition therefore improved check.
    */
    if (!empty(total) && !empty(currency)) {
    // Custom End
        return formatMoney(new dw.value.Money(total, currency));
    }
    return '-';
}

/**
 * @constructor
 * @classdesc totals class that represents the order totals of the current line item container
 *
 * @param {dw.order.lineItemContainer} lineItemContainer - The current user's line item container
 */
function totals(lineItemContainer) {
    base.call(this, lineItemContainer);

    if (eswHelper.getEShopWorldModuleEnabled()) {
        if (lineItemContainer) {
            var orderHistoryFlag = false;
            var eswShopperCurrencyCode = null;
            var isESWSupportedCountry = eswHelper.isESWSupportedCountry();
            if (Object.hasOwnProperty.call(lineItemContainer, 'orderNo')) {
                if (lineItemContainer.orderNo != null) {
                    orderHistoryFlag = true;
                    eswShopperCurrencyCode = lineItemContainer.originalOrder.custom.eswShopperCurrencyCode;
                }
            }
            if (!orderHistoryFlag) {
                this.subTotal = (isESWSupportedCountry) ? formatMoney(eswHelper.getFinalOrderTotalsObject()) : getTotals(lineItemContainer.adjustedMerchandizeTotalNetPrice);
            } else {
                this.subTotal = (eswShopperCurrencyCode != null) ? getCalculatedSubTotal(lineItemContainer, eswShopperCurrencyCode) : getOrderTotals(lineItemContainer.adjustedMerchandizeTotalNetPrice.decimalValue, lineItemContainer.getCurrencyCode());
            }

        }
    }
}

module.exports = totals;
