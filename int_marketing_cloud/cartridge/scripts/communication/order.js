'use strict';

/**
 * @module communication/order
 */

const sendTrigger = require('./util/send').sendTrigger;
const hookPath = 'app.communication.order.';
const helpers = require('../util/helpers');

var OrderMgr = require('dw/order/OrderMgr')

/**
 * Trigger an order confirmation notification
 * @param {SynchronousPromise} promise
 * @param {module:communication/util/trigger~CustomerNotification} data
 * @returns {SynchronousPromise}
 */
function confirmation(promise, data) {
    //Custom Start: Get order from OrderMgr to avoid null object exception on line 22
    var Order = OrderMgr.getOrder(data.context.order.orderNumber);
    data.orderAsXML = helpers.stripXmlNS( Order.getOrderExportXML(null, null) );
    return sendTrigger(hookPath + 'confirmation', promise, data);
}

/**
 * Trigger an order cancellation notification
 * @param {SynchronousPromise} promise
 * @param {module:communication/util/trigger~CustomerNotification} data
 * @returns {SynchronousPromise}
 */
function cancellation(promise, data) {
    //Custom Start: called order_cancellation hook
    return sendTrigger(hookPath + 'cancellation', promise, data);
}

/**
 * Declares attributes available for data mapping configuration
 * @returns {Object} Map of hook function to an array of strings
 */
function triggerDefinitions() {
    return {
        confirmation: {
            description: 'Order Confirmation trigger, contains details of the placed order. To reflect line items,\n' +
            'use orderAsXML attribute and process as XML within the Marketing Cloud template.\n' +
            'To use XML approach, see Marketing Cloud docs:\n' +
            'https://developer.salesforce.com/docs/atlas.en-us.noversion.mc-apis.meta/mc-apis/using_triggered_sends_to_confirm_purchases.htm\n' +
            'Sample XML output:\n' +
            'https://gist.github.com/intel352/23312f0fd3d0d6fd23dec6b64e2668b7',
            attributes: [
                'orderAsXML',
                'Order.affiliatePartnerID',
                'Order.affiliatePartnerName',
                'Order.capturedAmount',
                'Order.capturedAmount.currencyCode',
                'Order.capturedAmount.decimalValue',
                'Order.createdBy',
                'Order.customerLocaleID',
                'Order.customerOrderReference',
                'Order.exportAfter',
                'Order.externalOrderNo',
                'Order.externalOrderStatus',
                'Order.externalOrderText',
                'Order.invoiceNo',
                'Order.orderNo',
                'Order.orderToken',
                'Order.remoteHost',
                'Order.sourceCode',
                'Order.sourceCodeGroupID',
                'Order.adjustedMerchandizeTotalGrossPrice',
                'Order.adjustedMerchandizeTotalGrossPrice.currencyCode',
                'Order.adjustedMerchandizeTotalGrossPrice.decimalValue',
                'Order.adjustedMerchandizeTotalNetPrice',
                'Order.adjustedMerchandizeTotalNetPrice.currencyCode',
                'Order.adjustedMerchandizeTotalNetPrice.decimalValue',
                'Order.adjustedMerchandizeTotalPrice',
                'Order.adjustedMerchandizeTotalPrice.currencyCode',
                'Order.adjustedMerchandizeTotalPrice.decimalValue',
                'Order.adjustedMerchandizeTotalTax',
                'Order.adjustedMerchandizeTotalTax.currencyCode',
                'Order.adjustedMerchandizeTotalTax.decimalValue',
                'Order.adjustedShippingTotalGrossPrice',
                'Order.adjustedShippingTotalGrossPrice.currencyCode',
                'Order.adjustedShippingTotalGrossPrice.decimalValue',
                'Order.adjustedShippingTotalNetPrice',
                'Order.adjustedShippingTotalNetPrice.currencyCode',
                'Order.adjustedShippingTotalNetPrice.decimalValue',
                'Order.adjustedShippingTotalPrice',
                'Order.adjustedShippingTotalPrice.currencyCode',
                'Order.adjustedShippingTotalPrice.decimalValue',
                'Order.adjustedShippingTotalTax',
                'Order.adjustedShippingTotalTax.currencyCode',
                'Order.adjustedShippingTotalTax.decimalValue',
                'Order.billingAddress.address1',
                'Order.billingAddress.address2',
                'Order.billingAddress.city',
                'Order.billingAddress.companyName',
                'Order.billingAddress.countryCode.displayValue',
                'Order.billingAddress.countryCode.value',
                'Order.billingAddress.firstName',
                'Order.billingAddress.fullName',
                'Order.billingAddress.jobTitle',
                'Order.billingAddress.lastName',
                'Order.billingAddress.phone',
                'Order.billingAddress.postalCode',
                'Order.billingAddress.postBox',
                'Order.billingAddress.salutation',
                'Order.billingAddress.secondName',
                'Order.billingAddress.stateCode',
                'Order.billingAddress.suffix',
                'Order.billingAddress.suite',
                'Order.billingAddress.title',
                'Order.billingAddress.salutation',
                'Order.channelType.displayValue',
                'Order.channelType.value',
                'Order.currencyCode',
                'Order.customer.anonymous',
                'Order.customer.authenticated',
                'Order.customer.ID',
                'Order.customer.note',
                'Order.customer.registered',
                'Order.customer.profile.birthday',
                'Order.customer.profile.companyName',
                'Order.customer.profile.customerNo',
                'Order.customer.profile.email',
                'Order.customer.profile.fax',
                'Order.customer.profile.female',
                'Order.customer.profile.firstName',
                'Order.customer.profile.gender.displayValue',
                'Order.customer.profile.gender.value',
                'Order.customer.profile.jobTitle',
                'Order.customer.profile.lastLoginTime',
                'Order.customer.profile.lastName',
                'Order.customer.profile.lastVisitTime',
                'Order.customer.profile.male',
                'Order.customer.profile.nextBirthday',
                'Order.customer.profile.phoneBusiness',
                'Order.customer.profile.phoneHome',
                'Order.customer.profile.phoneMobile',
                'Order.customer.profile.preferredLocale',
                'Order.customer.profile.previousLoginTime',
                'Order.customer.profile.previousVisitTime',
                'Order.customer.profile.salutation',
                'Order.customer.profile.secondName',
                'Order.customer.profile.suffix',
                'Order.customer.profile.taxIDMasked',
                'Order.customer.profile.taxIDType.displayValue',
                'Order.customer.profile.taxIDType.value',
                'Order.customer.profile.title',
                'Order.customerEmail',
                'Order.customerName',
                'Order.customerNo',
                'Order.defaultShipment.adjustedMerchandizeTotalGrossPrice',
                'Order.defaultShipment.adjustedMerchandizeTotalGrossPrice.currencyCode',
                'Order.defaultShipment.adjustedMerchandizeTotalGrossPrice.decimalValue',
                'Order.defaultShipment.adjustedMerchandizeTotalNetPrice',
                'Order.defaultShipment.adjustedMerchandizeTotalNetPrice.currencyCode',
                'Order.defaultShipment.adjustedMerchandizeTotalNetPrice.decimalValue',
                'Order.defaultShipment.adjustedMerchandizeTotalPrice',
                'Order.defaultShipment.adjustedMerchandizeTotalPrice.currencyCode',
                'Order.defaultShipment.adjustedMerchandizeTotalPrice.decimalValue',
                'Order.defaultShipment.adjustedMerchandizeTotalTax',
                'Order.defaultShipment.adjustedMerchandizeTotalTax.currencyCode',
                'Order.defaultShipment.adjustedMerchandizeTotalTax.decimalValue',
                'Order.defaultShipment.adjustedShippingTotalGrossPrice',
                'Order.defaultShipment.adjustedShippingTotalGrossPrice.currencyCode',
                'Order.defaultShipment.adjustedShippingTotalGrossPrice.decimalValue',
                'Order.defaultShipment.adjustedShippingTotalNetPrice',
                'Order.defaultShipment.adjustedShippingTotalNetPrice.currencyCode',
                'Order.defaultShipment.adjustedShippingTotalNetPrice.decimalValue',
                'Order.defaultShipment.adjustedShippingTotalPrice',
                'Order.defaultShipment.adjustedShippingTotalPrice.currencyCode',
                'Order.defaultShipment.adjustedShippingTotalPrice.decimalValue',
                'Order.defaultShipment.adjustedShippingTotalTax',
                'Order.defaultShipment.adjustedShippingTotalTax.currencyCode',
                'Order.defaultShipment.adjustedShippingTotalTax.decimalValue',
                'Order.defaultShipment.gift',
                'Order.defaultShipment.giftMessage',
                'Order.defaultShipment.ID',
                'Order.defaultShipment.merchandizeTotalGrossPrice',
                'Order.defaultShipment.merchandizeTotalGrossPrice.currencyCode',
                'Order.defaultShipment.merchandizeTotalGrossPrice.decimalValue',
                'Order.defaultShipment.merchandizeTotalNetPrice',
                'Order.defaultShipment.merchandizeTotalNetPrice.currencyCode',
                'Order.defaultShipment.merchandizeTotalNetPrice.decimalValue',
                'Order.defaultShipment.merchandizeTotalPrice',
                'Order.defaultShipment.merchandizeTotalPrice.currencyCode',
                'Order.defaultShipment.merchandizeTotalPrice.decimalValue',
                'Order.defaultShipment.merchandizeTotalTax',
                'Order.defaultShipment.merchandizeTotalTax.currencyCode',
                'Order.defaultShipment.merchandizeTotalTax.decimalValue',
                'Order.defaultShipment.proratedMerchandizeTotalPrice',
                'Order.defaultShipment.proratedMerchandizeTotalPrice.currencyCode',
                'Order.defaultShipment.proratedMerchandizeTotalPrice.decimalValue',
                'Order.defaultShipment.shipmentNo',
                'Order.defaultShipment.shippingAddress.address1',
                'Order.defaultShipment.shippingAddress.address2',
                'Order.defaultShipment.shippingAddress.city',
                'Order.defaultShipment.shippingAddress.companyName',
                'Order.defaultShipment.shippingAddress.countryCode.displayValue',
                'Order.defaultShipment.shippingAddress.countryCode.value',
                'Order.defaultShipment.shippingAddress.firstName',
                'Order.defaultShipment.shippingAddress.fullName',
                'Order.defaultShipment.shippingAddress.jobTitle',
                'Order.defaultShipment.shippingAddress.lastName',
                'Order.defaultShipment.shippingAddress.phone',
                'Order.defaultShipment.shippingAddress.postalCode',
                'Order.defaultShipment.shippingAddress.postBox',
                'Order.defaultShipment.shippingAddress.salutation',
                'Order.defaultShipment.shippingAddress.secondName',
                'Order.defaultShipment.shippingAddress.stateCode',
                'Order.defaultShipment.shippingAddress.suffix',
                'Order.defaultShipment.shippingAddress.suite',
                'Order.defaultShipment.shippingAddress.title',
                'Order.defaultShipment.shippingAddress.salutation',
                'Order.defaultShipment.shippingMethod.currencyCode',
                'Order.defaultShipment.shippingMethod.description',
                'Order.defaultShipment.shippingMethod.displayName',
                'Order.defaultShipment.shippingMethod.ID',
                'Order.defaultShipment.shippingMethod.taxClassID',
                'Order.defaultShipment.shippingMethodID',
                'Order.defaultShipment.shippingTotalGrossPrice',
                'Order.defaultShipment.shippingTotalGrossPrice.currencyCode',
                'Order.defaultShipment.shippingTotalGrossPrice.decimalValue',
                'Order.defaultShipment.shippingTotalNetPrice',
                'Order.defaultShipment.shippingTotalNetPrice.currencyCode',
                'Order.defaultShipment.shippingTotalNetPrice.decimalValue',
                'Order.defaultShipment.shippingTotalPrice',
                'Order.defaultShipment.shippingTotalPrice.currencyCode',
                'Order.defaultShipment.shippingTotalPrice.decimalValue',
                'Order.defaultShipment.shippingTotalTax',
                'Order.defaultShipment.shippingTotalTax.currencyCode',
                'Order.defaultShipment.shippingTotalTax.decimalValue',
                'Order.defaultShipment.totalGrossPrice',
                'Order.defaultShipment.totalGrossPrice.currencyCode',
                'Order.defaultShipment.totalGrossPrice.decimalValue',
                'Order.defaultShipment.totalNetPrice',
                'Order.defaultShipment.totalNetPrice.currencyCode',
                'Order.defaultShipment.totalNetPrice.decimalValue',
                'Order.defaultShipment.totalTax',
                'Order.defaultShipment.totalTax.currencyCode',
                'Order.defaultShipment.totalTax.decimalValue',
                'Order.defaultShipment.trackingNumber',
                'Order.giftCertificateTotalGrossPrice',
                'Order.giftCertificateTotalGrossPrice.currencyCode',
                'Order.giftCertificateTotalGrossPrice.decimalValue',
                'Order.giftCertificateTotalNetPrice',
                'Order.giftCertificateTotalNetPrice.currencyCode',
                'Order.giftCertificateTotalNetPrice.decimalValue',
                'Order.giftCertificateTotalPrice',
                'Order.giftCertificateTotalPrice.currencyCode',
                'Order.giftCertificateTotalPrice.decimalValue',
                'Order.giftCertificateTotalTax',
                'Order.giftCertificateTotalTax.currencyCode',
                'Order.giftCertificateTotalTax.decimalValue',
                'Order.merchandizeTotalGrossPrice',
                'Order.merchandizeTotalGrossPrice.currencyCode',
                'Order.merchandizeTotalGrossPrice.decimalValue',
                'Order.merchandizeTotalNetPrice',
                'Order.merchandizeTotalNetPrice.currencyCode',
                'Order.merchandizeTotalNetPrice.decimalValue',
                'Order.merchandizeTotalPrice',
                'Order.merchandizeTotalPrice.currencyCode',
                'Order.merchandizeTotalPrice.decimalValue',
                'Order.merchandizeTotalTax',
                'Order.merchandizeTotalTax.currencyCode',
                'Order.merchandizeTotalTax.decimalValue',
                'Order.productQuantityTotal',
                'Order.shippingTotalGrossPrice',
                'Order.shippingTotalGrossPrice.currencyCode',
                'Order.shippingTotalGrossPrice.decimalValue',
                'Order.shippingTotalNetPrice',
                'Order.shippingTotalNetPrice.currencyCode',
                'Order.shippingTotalNetPrice.decimalValue',
                'Order.shippingTotalPrice',
                'Order.shippingTotalPrice.currencyCode',
                'Order.shippingTotalPrice.decimalValue',
                'Order.shippingTotalTax',
                'Order.shippingTotalTax.currencyCode',
                'Order.shippingTotalTax.decimalValue',
                'Order.totalGrossPrice',
                'Order.totalGrossPrice.currencyCode',
                'Order.totalGrossPrice.decimalValue',
                'Order.totalNetPrice',
                'Order.totalNetPrice.currencyCode',
                'Order.totalNetPrice.decimalValue',
                'Order.totalTax',
                'Order.totalTax.currencyCode',
                'Order.totalTax.decimalValue'
            ]
        },
        cancellation: {
            description: 'Order Cancellation trigger, contains details of the placed order.',
            attributes: [
                'Order.customerEmail',
                'Order.defaultShipment.shippingAddress.firstName',
                'Order.defaultShipment.shippingAddress.lastName',
                'Order.orderNo',
                'Order.creationDate',
                'Order.totalGrossPrice.decimalValue'
            ]
        }
    };
}

module.exports = require('dw/system/HookMgr').callHook(
    'app.communication.handler.initialize',
    'initialize',
    require('./handler').handlerID,
    'app.communication.order',
    {
        confirmation: confirmation,
        cancellation: cancellation
        
    }
);

// non-hook exports
module.exports.triggerDefinitions = triggerDefinitions;
