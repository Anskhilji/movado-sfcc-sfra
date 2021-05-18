'use strict';

var server = require('server');
server.extend(module.superModule);
var URLUtils = require('dw/web/URLUtils');
var ProductMgr = require('dw/catalog/ProductMgr')
var PromotionMgr = require('dw/campaign/PromotionMgr');
var Promotion = require('dw/campaign/Promotion');
var Money = require('dw/value/Money');
var Resource = require('dw/web/Resource');
var stringUtils = require('*/cartridge/scripts/helpers/stringUtils');
var csrfProtection = require('*/cartridge/scripts/middleware/csrf');
var consentTracking = require('*/cartridge/scripts/middleware/consentTracking');
var Logger = require('dw/system/Logger');

server.replace(
    'Confirm',
    consentTracking.consent,
    server.middleware.https,
    csrfProtection.generateToken,
    function (req, res, next) {
        var ABTestMgr = require('dw/campaign/ABTestMgr');
        var Locale = require('dw/util/Locale');
        var OrderMgr = require('dw/order/OrderMgr');
        var Transaction = require('dw/system/Transaction');

        var OrderModel = require('*/cartridge/models/order');
        var reportingUrlsHelper = require('*/cartridge/scripts/reportingUrls');

        var abTestSegment;
        var order = OrderMgr.getOrder(req.querystring.ID);
        var token = req.querystring.token ? req.querystring.token : null;

        if (!order
            || !token
            || token !== order.orderToken
            || order.customer.ID !== req.currentCustomer.raw.ID
        ) {
            res.render('/error', {
                message: Resource.msg('error.confirmation.error', 'confirmation', null)
            });

            return next();
        }
        var lastOrderID = Object.prototype.hasOwnProperty.call(req.session.raw.custom, 'orderID') ? req.session.raw.custom.orderID : null;
        if (lastOrderID === req.querystring.ID) {
            session.custom.orderJustPlaced = false;
            res.redirect(URLUtils.url('Home-Show'));
            return next();
        }

        var config = {
            numberOfLineItems: '*'
        };

        var currentLocale = Locale.getLocale(req.locale.id);

        var orderModel = new OrderModel(
            order,
            { config: config, countryCode: currentLocale.country, containerView: 'order' }
        );
        var passwordForm;

        var reportingURLs = reportingUrlsHelper.getOrderReportingURLs(order);
        var abTestParticipationSegments = '';
        var assignedTestSegmentsIterator = ABTestMgr.getAssignedTestSegments().iterator();
        while (assignedTestSegmentsIterator.hasNext()) {
            abTestSegment = assignedTestSegmentsIterator.next();
            if (abTestParticipationSegments == '') {
                abTestParticipationSegments = abTestSegment.ABTest.ID + '-' + abTestSegment.ID;
            } else {
                abTestParticipationSegments = abTestParticipationSegments + ', ' + abTestSegment.ABTest.ID + '-' + abTestSegment.ID;
            }
        }

        // Save test segments in order custom attribute
        if (!empty(abTestParticipationSegments)) {
            Transaction.wrap(function () {
                order.custom.abTestParticipationSegment = abTestParticipationSegments;
            });
        }


        if (!req.currentCustomer.profile) {
            passwordForm = server.forms.getForm('newPasswords');
            passwordForm.clear();
            res.render('checkout/confirmation/confirmation', {
                order: orderModel,
                returningCustomer: false,
                passwordForm: passwordForm,
                reportingURLs: reportingURLs
            });
        } else {
            res.render('checkout/confirmation/confirmation', {
                order: orderModel,
                returningCustomer: true,
                reportingURLs: reportingURLs
            });
        }
        req.session.raw.custom.orderID = req.querystring.ID; // eslint-disable-line no-param-reassign
        return next();
    }
);

server.append('Confirm', function (req, res, next) {
    var OrderMgr = require('dw/order/OrderMgr');
    var Site = require('dw/system/Site');
    var Transaction = require('dw/system/Transaction');
    var viewData = res.getViewData();
    var marketingProductsData = [];
    var orderAnalyticsTrackingData;
    var uniDaysTrackingLineItems;
    var orderNo = !empty(viewData.order) && !empty(viewData.order.orderNumber) ? viewData.order.orderNumber : session.custom.orderNumber;
    var order = OrderMgr.getOrder(orderNo);
    var orderLineItems = order.getAllProductLineItems();
    var productCustomHelpers = require('*/cartridge/scripts/helpers/productCustomHelpers');
    var productLineItem;
    var userIPAddress = request.httpRemoteAddress || '';
    var couponLineItemsItr = order.getCouponLineItems().iterator();
    var checkoutAddrHelper = require('*/cartridge/scripts/helpers/checkoutAddressHelper');
    var orderCustomHelper = require('*/cartridge/scripts/helpers/orderCustomHelper');
    if (!empty(viewData.order)) {
        checkoutAddrHelper.saveCheckoutShipAddress(viewData.order);
    }
    

    Transaction.wrap(function () {
        order.custom.userIPAddress = userIPAddress;
    });

    if(Site.current.getCustomPreferenceValue('analyticsTrackingEnabled')) {
        var queryStringIntoParts = viewData.queryString.split('&');
        var urlID = queryStringIntoParts[0].split('=');
        var id = urlID[1];
        var urltoken = queryStringIntoParts[1].split('=');
        var token = urltoken[1];
        var thankYouPageUrl = URLUtils.abs('Order-Confirm', 'ID', id, 'token', token).toString();
        var analyticsTrackingLineItems = [];
        var orderLineItemArray = [];
        var orderLineItemsIterator = orderLineItems.iterator();
        var orderDiscount = 0.00;
        if (order.getMerchandizeTotalNetPrice() && order.getAdjustedMerchandizeTotalNetPrice()) {
            orderDiscount = order.getMerchandizeTotalNetPrice().subtract(order.getAdjustedMerchandizeTotalNetPrice());
            if (orderDiscount.getDecimalValue() !== null && orderDiscount.getDecimalValue().get() !== null) {
                orderDiscount = orderDiscount.getDecimalValue().get().toFixed(2);
            }
        }
        while (orderLineItemsIterator.hasNext()) {
            productLineItem = orderLineItemsIterator.next();
            if (productLineItem instanceof dw.order.ProductLineItem &&
                !productLineItem.bonusProductLineItem && !productLineItem.optionID) {
                analyticsTrackingLineItems.push ({
                    item: stringUtils.removeSingleQuotes(productLineItem.productName),
                    quantity: productLineItem.quantityValue,
                    price: productLineItem.getAdjustedNetPrice().getDecimalValue().toString(),
                    unique_id: productLineItem.productID
                });
                orderLineItemArray.push ({
                    productName: stringUtils.removeSingleQuotes(productLineItem.productName),
                    quantity: productLineItem.quantityValue,
                    unitPrice: productLineItem.getGrossPrice().getDecimalValue().toString(),
                    unitPriceLessTax: productLineItem.getNetPrice().getDecimalValue().toString(),
                    SKU: productLineItem.productID
                });
            }
        }

        orderAnalyticsTrackingData = {
            cart: analyticsTrackingLineItems,
            discount: orderDiscount,
            order_number: !empty(viewData.order) ? viewData.order.orderNumber : orderNo,
            shipping: order.getShippingTotalGrossPrice().getDecimalValue() ? order.getShippingTotalGrossPrice().getDecimalValue().toString() : 0.00,
            orderConfirmationUrl: thankYouPageUrl,
            tax: order.getTotalTax().getDecimalValue() ? order.getTotalTax().getDecimalValue().toString() : 0.00,
            customerEmailOrUniqueNo: order.getCustomerEmail() ? order.getCustomerEmail() : ''
        };
        res.setViewData({orderAnalyticsTrackingData: JSON.stringify(orderAnalyticsTrackingData)});
    }

    if (Site.current.getCustomPreferenceValue('uniDaysEnabled')) {
        var couponCode;
        var priceAdjustments;
        var couponLineItemsItr = order.getCouponLineItems().iterator();
        while (couponLineItemsItr.hasNext()) {
            var couponLineItem = couponLineItemsItr.next();
            couponCode = couponLineItem.getCouponCode();
            if (couponCode && couponCode.indexOf("UNIDAYS") > -1) {
                priceAdjustments = couponLineItem.getPriceAdjustments();
                break;
            } else {
                couponCode = null;
            }
        }
        if (couponCode) {
            var partnerId = Site.current.getCustomPreferenceValue('uniDaysPartnerId');
            var transcationId;
            var currency;
            var code;
            var isUniDaysTestMode = Site.current.getCustomPreferenceValue('uniDaysMode') == 'TEST' ? true : false;
            var unidaysOrderDiscount = 0.00;
            var unidaysDiscountPercentage = 0.00;
            var merchandizeTotal = order.getMerchandizeTotalNetPrice().getDecimalValue() ? order.getMerchandizeTotalNetPrice().getDecimalValue() : 0.00;
            var priceAdjustmentIterator = priceAdjustments ? priceAdjustments.iterator() : null;
            var orderTotal = order.getTotalNetPrice() ? (order.getTotalNetPrice().value).toFixed(2) : 0.00;
            var itemsGross = order.getMerchandizeTotalGrossPrice() ? (order.getMerchandizeTotalGrossPrice().value).toFixed(2) : 0.00;
            var shippingGross = order.getShippingTotalGrossPrice() ? (order.getShippingTotalGrossPrice().value).toFixed(2) : 0.00;

            if (priceAdjustmentIterator && priceAdjustmentIterator.hasNext()) {
                var priceAdjustmentLineItem = priceAdjustmentIterator.next();
                unidaysOrderDiscount = priceAdjustmentLineItem.priceValue * -1;
            }

            unidaysDiscountPercentage = ((unidaysOrderDiscount * 100) / merchandizeTotal).toFixed(2);
            uniDaysTrackingLineItems = {
                partnerId: partnerId,
                transcationId: !empty(viewData.order) ? viewData.order.orderNumber : orderNo,
                currency: order.currencyCode,
                code: couponCode,
                itemsUnidaysDiscount: unidaysOrderDiscount.toFixed(2),
                unidaysDiscountPercentage : unidaysDiscountPercentage,
                isUniDaysTestMode : isUniDaysTestMode,
                orderTotal : orderTotal,
                itemsGross : itemsGross,
                shippingGross : shippingGross
            };
            res.setViewData({uniDaysTrackingLineItems: JSON.stringify(uniDaysTrackingLineItems)});
        }
    }

    var orderLineItemsIterator = orderLineItems.iterator();

    while (orderLineItemsIterator.hasNext()) {
        productLineItem = orderLineItemsIterator.next();
        if (productLineItem instanceof dw.order.ProductLineItem &&
            !productLineItem.bonusProductLineItem && !productLineItem.optionID) {
                var apiProduct = productLineItem.getProduct();
                var quantity = productLineItem.getQuantity().value;
                marketingProductsData.push(productCustomHelpers.getMarketingProducts(apiProduct, quantity));
        }
    }
    res.setViewData({
        marketingProductData : JSON.stringify(marketingProductsData)
    });

    
    // Custom Start: Salesforce Order Management attributes.  Backup method - only executed if attributes are null (i.e., ORM exception after COPlaceOrder)
    if (Site.current.getCustomPreferenceValue('SOMIntegrationEnabled')) {
        if ('SFCCPriceBookId' in order.custom && !order.custom.SFCCPriceBookId) {
            var populateOrderJSON = require('*/cartridge/scripts/jobs/populateOrderJSON');
            var somLog = require('dw/system/Logger').getLogger('SOM', 'CheckoutServices');
            somLog.debug('Processing Order ' + order.orderNo);
            try {
                Transaction.wrap(function () {
                    populateOrderJSON.populateByOrder(order);
                });
            } catch (exSOM) {
                somLog.error('SOM attribute process failed: ' + exSOM.message + ',exSOM: ' + JSON.stringify(exSOM));
            }
        }
    }
    
    var customerID = '';
    var loggedIn = req.currentCustomer.raw.authenticated;
    
    if (loggedIn) {
        customerID = req.currentCustomer.profile.customerNo;
    }

    var couponLineItem;
    var couponLineItemsItr = order.getCouponLineItems().iterator();
    var discountCode = '';
    
    while (couponLineItemsItr.hasNext()) {
        couponLineItem = couponLineItemsItr.next();
        discountCode = couponLineItem.getCouponCode();
        if (!empty(discountCode)) {
            break;
        }
    }
    
    var orderConfirmationObj = {
        customerID: customerID,
        orderDiscount: orderDiscount,
        couponCode: discountCode,
        orderLineItemArray: orderLineItemArray
    };
    res.setViewData({
        orderConfirmationObj: JSON.stringify(orderConfirmationObj)
    });
    
    viewData.checkoutPage = true;
    if (viewData.order) {
        var selectedPaymentMethod = orderCustomHelper.getSelectedPaymentMethod(viewData.order);
        viewData.selectedPaymentMethod = selectedPaymentMethod;
    }
    res.setViewData(viewData);
    if (!empty(session.custom.orderNumber)) {
        session.custom.orderNumber = '';
    }
    next();
});
server.get('FBConversion', function (req, res, next) {
    var OrderMgr = require('dw/order/OrderMgr');

    var FBConversionAPI = require('*/cartridge/scripts/api/fbConversionAPI');
    var order = OrderMgr.getOrder(req.querystring.order_no);
    try {
        var result = FBConversionAPI.fbConversionAPI(order);
    } catch (error) {
        Logger.error('(Order.js -> FBConversion) Error is occurred in FBConversionAPI.fbConversionAPI', error.toString());
    }
    res.json({
        message: result.message,
        success: result.success,
    });
    return next();
})
module.exports = server.exports();
