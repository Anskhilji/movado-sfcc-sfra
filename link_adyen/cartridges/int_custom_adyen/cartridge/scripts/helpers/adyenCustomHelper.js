var Logger = require('dw/system/Logger');
var Status = require('dw/system/Status');
var ArrayList = require('dw/util/ArrayList');
var Site = require('dw/system/Site');
var Mail = require('dw/net/Mail');
var Money = require('dw/value/Money');
var AdyenHelper = require('*/cartridge/scripts/util/AdyenHelper');
var orderStatusHelper = require('*/cartridge/scripts/lib/orderStatusHelper');

function getUpdatedAuthorizationAmount(order, amount) {
	/* get order total amount */
    var orderTotal = order.getTotalGrossPrice().value;

	/* get the already Captured Amount*/
    var capturedAmount = 0.0;
    var alreadyCapturedList = orderStatusHelper.convertSapAttributesToList(order.custom.sapAlreadyCapturedAmount);
    if (alreadyCapturedList) {
        for (var i = 0; i < alreadyCapturedList.length; i++) {
            capturedAmount = parseFloat(capturedAmount) + parseFloat(alreadyCapturedList[i]);
        }
    }
    /* get the already refunded Amount*/
    var refundedAmount = 0;
    var alreadyRefundedAmountList = orderStatusHelper.convertSapAttributesToList(order.custom.sapAlreadyRefundedAmount);
    if (alreadyRefundedAmountList) {
        for (var i = 0; i < alreadyRefundedAmountList.length; i++) {
            refundedAmount = parseFloat(refundedAmount) + parseFloat(alreadyRefundedAmountList[i]);
        }
    }

    var amountToAuthorize = 0.0;
    amountToAuthorize = (orderTotal - parseFloat(capturedAmount) - parseFloat(refundedAmount) - parseFloat(amount)).toFixed(2);
    return amountToAuthorize;
}


/**
 * Sends Mail to Customer or customer service based on the capture / Refund Response
 * @param order
 * @param response
 * @param amount
 * @returns Boolean
 */
function triggerEmail(order, response, amount) {
    try {
        var mail = new Mail();
        mail.setFrom('noreply@movado.com');

        if (response == 'SUCCESS') {
            // TODO -pick from Site Pref
            mail.addTo('');
            mail.setContent('Order Payment processed with order No : ' + order.orderNo + ' with amount : ' + amount);
        } else {
            // TODO -pick from Site Pref
            mail.addTo('garima.negi@publicissapient.com');
            mail.setContent('Order Payment Failed with order No : ' + order.orderNo + ' with amount : ' + amount);
        }
        mail.send();
        return true;
    } catch (e) {
        return false;
    }
}

/**
 * gets the existing amount List captured/refunded for order from BM
 * add the amount received from Status Feed in the amount List
 * @param {dw.util.ArrayList} : amountList
 * @param sapAmount : the amount to be added
 */
function addSapAttributeToList(attrList, sapAmount) {
    var updatedAmountList;

    if (!attrList || attrList == null || attrList.length < 1) {
        updatedAmountList = sapAmount;
    } else {
        updatedAmountList = attrList + '|' + sapAmount;
    }

    return updatedAmountList;
}


/**
 * validate the order Parameters for Capture or refund request
 * @param order
 * @returns
 */
function validateOrderParameters(order) {
    if (order == null) {
        Logger.getLogger('Adyen').fatal('Capturing of order payment has failed. No order was provided.');
        return false;
    }
    var orderNo = order.getOrderNo();
    var currencyCode = order.getCurrencyCode();
    var pspReference = order.custom.Adyen_pspReference;
    var merchantAccount = Site.getCurrent().getCustomPreferenceValue('Adyen_merchantCode');

    /* check mandatory request validations*/
    if (merchantAccount == null) {
        Logger.getLogger('Adyen').fatal('Payment capturing of order # ' + orderNo + ' has failed.merchantAccount is not set.');
        return false;
    }
    if (pspReference == null) {
        Logger.getLogger('Adyen').fatal('Payment capturing of order # ' + orderNo + 'has failed.PSP reference is not set.');
        return false;
    }
    return true;
}


/**
 * creates the cancel or refund request for cancelling or refunding the amount sent in status feed
 * called when payment method is credit card
 * @param orderNo
 * @param merchantAccount
 * @param amount
 * @param currencyCode
 * @param pspReference
 * @returns JSON - Capture Request Object
 */
function createCancelOrRefundRequest(orderNo, merchantAccount, pspReference) {
    var requestObj = {};
    requestObj.originalReference = pspReference;
    requestObj.reference = orderNo;
    requestObj.merchantAccount = merchantAccount;

    Logger.getLogger('Adyen').debug('Service Request for Cancel of Refund  : ' + JSON.stringify(requestObj));
    return JSON.stringify(requestObj);
}

/**
 * creates the request body for technically cancel request
 * @param orderNo
 * @param merchantAccount
 * @returns JSON - Technical Cancel Request Object
 */
 function createTechnicalCancelRequest(orderNo, merchantAccount) {
    var requestObj = {};
    requestObj.reference = orderNo;
    requestObj.paymentReference = orderNo;
    requestObj.merchantAccount = merchantAccount;

    Logger.getLogger('Adyen').debug('Service Request for Technical Cancel  : ' + JSON.stringify(requestObj));
    return JSON.stringify(requestObj);
}


/**
 * creates the capture or refund request for capturing or refunding the amount sent in status feed
 * @param orderNo
 * @param merchantAccount
 * @param amount
 * @param currencyCode
 * @param pspReference
 * @returns JSON - Capture Request Object
 */
function createCaptureOrRefundRequest(orderNo, merchantAccount, amount, currencyCode, pspReference) {
    var requestObj = {};
    requestObj.originalReference = pspReference;
    requestObj.reference = orderNo;
    requestObj.merchantAccount = merchantAccount;

    /* get the Adyen formatted amount*/
    var amountVal = new Money(amount, currencyCode);
    var formattedAmount = Math.round(AdyenHelper.getCurrencyValueForApi(amountVal));

    requestObj.modificationAmount = {};
    requestObj.modificationAmount.value = formattedAmount;
    requestObj.modificationAmount.currency = currencyCode;

    Logger.getLogger('Adyen').debug('Service Request  : ' + JSON.stringify(requestObj));
    return JSON.stringify(requestObj);
}


/**
 * creates the authorization adjustment request for revoking the auth amount sent in status feed
 * called when payment method is credit card
 * @param orderNo
 * @param merchantAccount
 * @param amount
 * @param currencyCode
 * @param pspReference
 * @returns JSON - Capture Request Object
 */
function createAdjustAuthorisationRequest(orderNo, merchantAccount, amount, currencyCode, pspReference) {
    var requestObj = {};
    requestObj.originalReference = pspReference;
    requestObj.reference = orderNo;
    requestObj.merchantAccount = merchantAccount;

    /* get the Adyen formatted amount*/
    var amountVal = new Money(amount, currencyCode);
    var formattedAmount = Math.round(AdyenHelper.getCurrencyValueForApi(amountVal));

    requestObj.modificationAmount = {};
    requestObj.modificationAmount.value = formattedAmount;
    requestObj.modificationAmount.currency = currencyCode;

    requestObj.additionalData = {};
    requestObj.additionalData.industryUsage = 'DelayedCharge';

    Logger.getLogger('Adyen').debug('Service Request  : ' + JSON.stringify(requestObj));
    return JSON.stringify(requestObj);
}


module.exports.createCaptureOrRefundRequest = createCaptureOrRefundRequest;
module.exports.validateOrderParameters = validateOrderParameters;
module.exports.addSapAttributeToList = addSapAttributeToList;
module.exports.createCancelOrRefundRequest = createCancelOrRefundRequest;
module.exports.createAdjustAuthorisationRequest = createAdjustAuthorisationRequest;
module.exports.triggerEmail = triggerEmail;
module.exports.getUpdatedAuthorizationAmount = getUpdatedAuthorizationAmount;
module.exports.createTechnicalCancelRequest = createTechnicalCancelRequest;
