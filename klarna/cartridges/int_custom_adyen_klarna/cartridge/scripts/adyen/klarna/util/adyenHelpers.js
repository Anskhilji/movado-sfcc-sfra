'use strict';

// Api includes
var URLUtils = require('dw/web/URLUtils');
var Transaction = require('dw/system/Transaction');

// Script includes
var AdyenHelper = require('int_adyen_overlay/cartridge/scripts/util/AdyenHelper');
var collections = require('*/cartridge/scripts/util/collections');
var constants = require('*/cartridge/scripts/helpers/constants.js');
var checkoutLogger = require('*/cartridge/scripts/helpers/customCheckoutLogger').getLogger();

/**
 * This method is used to get Shipping/Product/price-adjustment line item quantity.
 *
 * @param {LineItem} lineItem - product/shipping/price-adjustment line item.
 * @returns {Object} itemQty - line item quantity.
 */
function getQuantity(lineItem) {
    var itemQty;
    checkoutLogger.debug('(adyenHelpers) -> getQuantity: Inside getQuantity trying to get the line item quantity');

    if (lineItem instanceof dw.order.ShippingLineItem) {
        itemQty = '1';
    } else if (lineItem instanceof dw.order.ProductLineItem) {
        itemQty = lineItem.quantityValue.toFixed();
    } else if (lineItem instanceof dw.order.PriceAdjustment) {
        itemQty = lineItem.quantity.toFixed();
    }
    return itemQty;
}

/**
 * This method is used to get Shipping/Product/price-adjustment line item ID.
 *
 * @param {LineItem} lineItem - product/shipping/price-adjustment line item.
 * @returns {string} itemId - line item ID.
 */
function getId(lineItem) {
    var itemId;
    checkoutLogger.debug('(adyenHelpers) -> getId: Inside getId trying to get the line item id');
    if (lineItem instanceof dw.order.ShippingLineItem || lineItem instanceof dw.order.PriceAdjustment) {
        itemId = lineItem.UUID;
    } else if (lineItem instanceof dw.order.ProductLineItem) {
        itemId = lineItem.productID;
    }
    return itemId;
}

/**
 * This method is used to get Shipping/Product/price-adjustment line item amount.
 *
 * @param {LineItem} lineItem - product/shipping/price-adjustment line item.
 * @returns {Money} itemAmount - line item amount.
 */
function getItemAmount(lineItem) {
    var itemAmount;
    checkoutLogger.debug('(adyenHelpers) -> getItemAmount: Inside getItemAmount trying to get the line item amount');
    if (lineItem instanceof dw.order.ProductLineItem || lineItem instanceof dw.order.ShippingLineItem) {
        itemAmount = lineItem.adjustedNetPrice;
    } else if (lineItem instanceof dw.order.PriceAdjustment) {
        itemAmount = lineItem.basePrice;
    }
    return itemAmount;
}

/**
 * This method is used to get Shipping/price-adjustment line item description.
 *
 * @param {LineItem} lineItem - product/shipping/price-adjustment line item.
 * @returns {string} itemDescrition - line item description.
 */
function getDescription(lineItem) {
    var itemDescrition;
    checkoutLogger.debug('(adyenHelpers) -> getDescription: Inside getDescription trying to get the line item description');
    if (lineItem instanceof dw.order.ShippingLineItem) {
        itemDescrition = lineItem.getID();
    } else if (lineItem instanceof dw.order.ProductLineItem) {
        if (lineItem.product) {
            itemDescrition = lineItem.product.name;
        } else {
            itemDescrition = lineItem.optionID;
        }
    } else if (lineItem instanceof dw.order.PriceAdjustment) {
        itemDescrition = 'Discount';
    }
    return itemDescrition;
}

/**
 * This method is used to get Shipping/price-adjustment line item value added tax amount.
 *
 * @param {LineItem} lineItem - product/shipping/price-adjustment line item.
 * @returns {Money} itemAmount - line item vat amount.
 */
function getVatAmount(lineItem) {
    var vatAmount;
    checkoutLogger.debug('(adyenHelpers) -> getVatAmount: Inside getVatAmount trying to get the line item vat amount');
    if (lineItem instanceof dw.order.ProductLineItem || lineItem instanceof dw.order.ShippingLineItem) {
        vatAmount = lineItem.getAdjustedTax();
    } else if (lineItem instanceof dw.order.PriceAdjustment) {
        vatAmount = lineItem.tax;
    }
    return vatAmount;
}

/**
 * This method is used to get Shipping/price-adjustment line item value added tax percentage.
 *
 * @param {LineItem} lineItem - product/shipping/price-adjustment line item.
 * @returns {number} vatPercentage - line item vat percentage.
 */
function getVatPercentage(lineItem) {
    var vatPercentage = 0;
    checkoutLogger.debug('(adyenHelpers) -> getVatPercentage: Inside getVatPercentage trying to get the line item vat percentage');
    if (getVatAmount(lineItem) !== 0) {
        vatPercentage = lineItem.getTaxRate();
    }
    return vatPercentage;
}

/**
 * This method is used to build order delivery/shipping address object.
 *
 * @param {Object} args - array like object holding parameters.
 * @returns {Object} deliveryAdress - delivery address object.
 */
function getOrderDeliveryAdress(args) {
    var deliveryAdress = {};
    var shipments = args.Order.getShipments();
    var orderNumber = args.Order.orderNo;
    var shippingAddr = shipments[0].getShippingAddress();
    checkoutLogger.debug('(adyenHelpers) -> getOrderDeliveryAdress: Inside getOrderDeliveryAdress trying to get the order delivery address and order number is: ' + orderNumber);
    deliveryAdress.city = shippingAddr.city;
    deliveryAdress.country = shippingAddr.countryCode.value.toString().toUpperCase();
    deliveryAdress.houseNumberOrName = !empty(args.houseNumber) ? args.houseNumber : 'NA';
    deliveryAdress.postalCode = shippingAddr.postalCode;
    deliveryAdress.stateOrProvince = (!empty(shippingAddr.stateCode) ? shippingAddr.stateCode : 'NA');
    deliveryAdress.street = shippingAddr.address1;

    return deliveryAdress;
}

/**
 * This method is used to build shopper's browser info object.
 *
 * @returns {Object} browserInfo - browser info object.
 */
function getShopperBrowserInfo() {
    var browserUserAgent = request.getHttpHeaders().get('user-agent');
    var requestAcceptHeader = request.getHttpHeaders().get('accept');
    var requestAcceptLanguage = request.getHttpHeaders().get('accept-language');
    checkoutLogger.debug('(adyenHelpers) -> getShopperBrowserInfo: Inside getShopperBrowserInfo trying to get the shopper browser info and browser info is: browserUserAgent is: ' + browserUserAgent + ', requestAcceptHeader is: ' + requestAcceptHeader + ', requestAcceptLanguage is: ' + requestAcceptLanguage);
    var browserInfo = {
        acceptHeader: requestAcceptHeader,
        language: requestAcceptLanguage,
        userAgent: browserUserAgent
    };

    return browserInfo;
}

/**
 * This method is used to build request object required to get Adyen payment details through API.
 *
 * @param {Object} args - array like object holding parameters.
 * @returns {Object} requestPayload - request object holding necessary data.
 */
function buildGetPaymentDetailsRequestPayload(args) {
    var order;
    checkoutLogger.debug('(adyenHelpers) -> buildGetPaymentDetailsRequestPayload: Inside buildGetPaymentDetailsRequestPayload build request payload for GetPaymentDetails API');
    if (!empty(args.Order)) {
        order = args.Order;
    } else {
        checkoutLogger.error('(adyenHelpers) -> buildGetPaymentDetailsRequestPayload: Order is null and going to return the error');
        return { error: true };
    }

    var billingAddr = order.getBillingAddress();
    if ((args.brandCode).search(constants.KLARNA_PAYMENT_METHOD_TEXT) > -1) {
        var requestPayload = {
            merchantAccount: args.MerchantAccount,
            reference: args.OrderNo,
            paymentMethod: {
                type: args.brandCode
            },
            amount: {
                currency: order.currencyCode
            },
            shopperLocale: request.httpLocale,
            countryCode: billingAddr.countryCode.value.toString().toUpperCase(),
            telephoneNumber: billingAddr.getPhone(),
            shopperEmail: order.customerEmail,
            shopperName: {
                firstName: billingAddr.getFirstName(),
                gender: (!empty(args.gender)) ? args.gender : 'UNKNOWN',
                lastName: billingAddr.getLastName()
            },
            shopperIP: request.getHttpRemoteAddress(),
            shopperReference: args.CurrentUser.ID,
            billingAddress: {
                city: billingAddr.city,
                country: billingAddr.countryCode.value.toString().toUpperCase(),
                houseNumberOrName: (!empty(args.houseNumber)) ? args.houseNumber : 'NA',
                postalCode: billingAddr.postalCode,
                street: billingAddr.address1,
                stateOrProvince: (!empty(billingAddr.stateCode) ? billingAddr.stateCode : 'NA')
            },
            deliveryAddress: getOrderDeliveryAdress({ Order: order }),
            browserInfo: getShopperBrowserInfo(),
            returnUrl: URLUtils.https('Adyen-ShowConfirmation').toString()
        };

        var lineItems = [];
        var totalAmount = 0;
        // Add all product and shipping line items to request payload.
        collections.forEach(order.getAllLineItems(), function (lineItem) {
            if ((lineItem instanceof dw.order.ProductLineItem && !lineItem.bonusProductLineItem && (lineItem.optionID ? lineItem.adjustedNetPrice != 0 : true))
                || lineItem instanceof dw.order.ShippingLineItem
                || (lineItem instanceof dw.order.PriceAdjustment && lineItem.promotion.promotionClass === dw.campaign.Promotion.PROMOTION_CLASS_ORDER)) {
                var quantity = getQuantity(lineItem);
                // Amounts must be in minor units e.g. 10GBP is equal to 1000GBP
                var itemAmount = AdyenHelper.getCurrencyValueForApi(getItemAmount(lineItem)) / quantity;
                var vatAmount = AdyenHelper.getCurrencyValueForApi(getVatAmount(lineItem)) / quantity;
                var itemAmountIncludingVat = itemAmount + vatAmount;
                var vatPercentage = getVatPercentage(lineItem);
                totalAmount += itemAmountIncludingVat * quantity;
                var item = {
                    quantity: quantity,
                    amountExcludingTax: itemAmount,
                    // [MSS-1089] Removed [taxPercentage: (new Number(vatPercentage) * 10000).toFixed(),] to fix Adyen internal validation error
                    description: getDescription(lineItem),
                    id: getId(lineItem),
                    taxAmount: vatAmount,
                    amountIncludingTax: itemAmountIncludingVat,
                    taxCategory: 'NONE'
                };
                lineItems.push(item);
            }

        });
        requestPayload.lineItems = lineItems;
        requestPayload.amount.value = totalAmount;
    } else {
        var requestPayload = {
            amount: {
              currency: order.currencyCode,
              value: Math.round(order.totalGrossPrice * 100)
            },
            reference: order.orderNo,
            paymentMethod: {
              type: args.brandCode
            },
            merchantAccount: args.MerchantAccount,
            returnUrl: URLUtils.https('Adyen-ShowConfirmation').toString()
        }
    }

    return requestPayload;
}

/**
 * This method is used to set custom attribute against order payment method.
 *
 * @param {Object} args - array like object holding parameters.
 */
function updateOrderCustomAttibutes(args) {
    var order = args.Order;
    checkoutLogger.debug('(adyenHelpers) -> updateOrderCustomAttibutes: Inside updateOrderCustomAttibutes to update the order custom attribute of klarna payment data and order number is: ' + args.Order.orderNo);
    Transaction.wrap(function () {
        order.custom.klarnaPaymentdata = args.Paymentdata;
    });
}

/**
 * This method is used to parse response object returned by Adyen payment API.
 *
 * @param {Object} args - response returned from Adyen API.
 * @returns {Object} result - parsed response.
 */
function parseGetPaymentDetailsResponse(args) {
    var order = args.Order;
    var orderNumber = args.Order.orderNo;
    checkoutLogger.debug('(adyenHelpers) -> parseGetPaymentDetailsResponse: Inside parseGetPaymentDetailsResponse to parse the service response and order number is: ' + orderNumber);
    var result = { error: false };
    var serviceResponse = args.ServiceResponse;
    if (serviceResponse && serviceResponse.hasOwnProperty('resultCode') && serviceResponse.resultCode === 'RedirectShopper') {
        if (serviceResponse.hasOwnProperty('paymentData') && serviceResponse.hasOwnProperty('redirect') && serviceResponse.redirect.hasOwnProperty('url')) {
            result.redirectUrl = serviceResponse.redirect.url;
            updateOrderCustomAttibutes({ Order: order, Paymentdata: serviceResponse.paymentData });
        } else {
            checkoutLogger.error('(adyenHelpers) -> parseGetPaymentDetailsResponse: Error occurred while trying to validate the service response and order number is: ' + orderNumber + ' and going to set the error');
            result.error = true;
        }
    } else {
        checkoutLogger.error('(adyenHelpers) -> parseGetPaymentDetailsResponse: Error occurred because service not have the resultCode and redirectShopper property and order number is: ' + orderNumber + ' and going to set the error');
        result.error = true;
    }

    return result;
}

/**
 * This method is used to get payment data custom attribute stored against order payment method.
 *
 * @param {Order} order - current order.
 * @return {string} paymentData - stored payment data.
 */
function getPaymentData(order) {
    var paymentData;
    checkoutLogger.debug('(adyenHelpers) -> getPaymentData: Inside getPaymentData to update the order custom attribute of klarna payment data and order number is: ' + order.orderNo);
    Transaction.wrap(function () {
        paymentData = order.custom.klarnaPaymentdata;
        order.custom.klarnaPaymentdata = null;
    });

    return paymentData;
}

/**
 * This method is used to build request object required to verify Adyen payment details through API.
 *
 * @param {Object} args - array like object holding parameters.
 * @returns {Object} requestPayload - request object holding necessary data.
 */
function buildVerifyPaymentDetailsRequestPayload(args) {
    checkoutLogger.debug('(adyenHelpers) -> buildVerifyPaymentDetailsRequestPayload: Inside buildVerifyPaymentDetailsRequestPayload trying to get the requestPayload and orderNumber is: ' + args.Order.orderNo);
    var requestPayload = {
        paymentData: getPaymentData(args.Order),
        details: {
            redirectResult: args.RedirectPaymentResult
        }
    };

    return requestPayload;
}

module.exports = {
    buildGetPaymentDetailsRequestPayload: buildGetPaymentDetailsRequestPayload,
    parseGetPaymentDetailsResponse: parseGetPaymentDetailsResponse,
    buildVerifyPaymentDetailsRequestPayload: buildVerifyPaymentDetailsRequestPayload
};
