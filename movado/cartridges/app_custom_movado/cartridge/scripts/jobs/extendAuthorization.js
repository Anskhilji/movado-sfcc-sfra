'use strict';

//API includes
var Calendar = require('dw/util/Calendar');
var Logger = require('dw/system/Logger');
var OrderManager = require('dw/order/OrderMgr');
var Order = require('dw/order/Order');
var Site = require('dw/system/Site');
var Transaction = require('dw/system/Transaction');
//Script includes
var AdyenHelper = require('int_adyen_overlay/cartridge/scripts/util/AdyenHelper');
var adyenHelpers = require('~/cartridge/scripts/helpers/adyenHelpers');
var adyenExtendAuthService = require('~/cartridge/scripts/services/adyenExtendAuthorizationService');

/**
* Converts amount to specific currency value/minor units
* @param {Number} amount
* @param {Currency} currency
* @returns {Number} converted amount
*/
function getCurrenyValueForAmount(amount, currency) {
    if (amount > 0) {
        return AdyenHelper.getCurrencyValueForApi(new dw.value.Money(amount, currency));
    }
    return amount;
}

/**
 * Find orders flagged as Pre-Order and extend payment authorization validity if 7 days have been passed.
 * @returns
 */
function extendPaymentAuthorization(order) {
    try {
        var currencyCode = order.currencyCode;
        //Days after which authorization extension must happen for pre-order items
        var defaultAuthExtensionDays = Site.getCurrent().getCustomPreferenceValue('adyenAuthorizationExtensionDays');
        var currentDate = new Date();
        var lastAdjustmentDate = order.custom.lastAdjustmentDate ? order.custom.lastAdjustmentDate : order.getCreationDate();
        var isQualifiedDate = (currentDate.getDate() - lastAdjustmentDate.getDate()) >= defaultAuthExtensionDays;
        //It's already in minor units
        var orderTotalAuthorizedAmount = order.custom.Adyen_value;
        var sapAlreadyCapturedAmount = (order.custom.sapAlreadyCapturedAmount) ? getCurrenyValueForAmount(order.custom.sapAlreadyCapturedAmount, currencyCode) : 0.0;
        var sapAlreadyRefundedAmount = (order.custom.sapAlreadyRefundedAmount) ? getCurrenyValueForAmount(order.custom.sapAlreadyRefundedAmount, currencyCode) : 0.0;
        var newAuthAmount = orderTotalAuthorizedAmount - (sapAlreadyRefundedAmount + sapAlreadyCapturedAmount);

        if (newAuthAmount > 0.0 && isQualifiedDate) {
            var adyenAdjustAuthRequestPayload = adyenHelpers.buildAdjustAuthorizationRequestPayload({Order: order, authorizationAmount: newAuthAmount});
            var adyenServiceResponse = adyenExtendAuthService.callAdyenCheckoutPaymentAPI(adyenAdjustAuthRequestPayload);
            adyenHelpers.parseAdyenExtendAuthorizationResponse({Order: order, adyenResponse: adyenServiceResponse});
        } else if (orderTotalAuthorizedAmount == (sapAlreadyCapturedAmount + sapAlreadyRefundedAmount)) {
            Transaction.wrap(function () {
                order.custom.isPreorderProcessing = false;
            });
        }
    } catch (e) {
        Logger.getLogger('AdyenExtendPaymentAuthorization').error('Error occured while try to adjust authorized amount for order ' + order.orderNo + ' Error: ' + e.toString());
    }
}

/**
 * Find orders flagged as Pre-Order and extend payment authorization validity if 7 days have been passed.
 * @returns
 */
function extendAuthorization() {
    var status = false;
    try {
        OrderManager.processOrders(extendPaymentAuthorization,
             'status != {0} AND status != {1} AND status != {2} AND confirmationStatus = {3} AND custom.isPreorder != NULL AND custom.isPreorderProcessing = {4}',
             Order.ORDER_STATUS_REPLACED,
             Order.ORDER_STATUS_FAILED,
             Order.ORDER_STATUS_CANCELLED,
             Order.CONFIRMATION_STATUS_CONFIRMED,
             true
        );
        status = true;
    } catch (e) {
        Logger.getLogger('AdyenExtendPaymentAuthorization').error(e.toString());
    }
    return status;
}

module.exports.extendAuthorization = extendAuthorization;
