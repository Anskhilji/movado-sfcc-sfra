'use strict';

var server = require('server');
server.extend(module.superModule);
var URLUtils = require('dw/web/URLUtils');
var PromotionMgr = require('dw/campaign/PromotionMgr');
var Promotion = require('dw/campaign/Promotion');
var Money = require('dw/value/Money');
var stringUtils = require('*/cartridge/scripts/helpers/stringUtils');

var csrfProtection = require('*/cartridge/scripts/middleware/csrf');
var consentTracking = require('*/cartridge/scripts/middleware/consentTracking');

server.replace(
    'Confirm',
    consentTracking.consent,
    server.middleware.https,
    csrfProtection.generateToken,
    function (req, res, next) {
        var reportingUrlsHelper = require('*/cartridge/scripts/reportingUrls');
        var OrderMgr = require('dw/order/OrderMgr');
        var OrderModel = require('*/cartridge/models/order');
        var ABTestMgr = require('dw/campaign/ABTestMgr');
        var Transaction = require('dw/system/Transaction');
        var Locale = require('dw/util/Locale');

        var abTestSegments;
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
        var assignedTestSegments = ABTestMgr.getAssignedTestSegments();
        var abTestParticipationSegment = '';
        if (!empty(assignedTestSegments)) {
            var assignedTestSegmentsIterator = assignedTestSegments.iterator();
            while (assignedTestSegmentsIterator.hasNext()) {
                abTestSegments = assignedTestSegmentsIterator.next();
                if (abTestParticipationSegment == '') {
                    abTestParticipationSegment = abTestSegments.ABTest.ID + '-' + abTestSegments.ID;
                } else {
                    abTestParticipationSegment = ', ' + abTestSegments.ABTest.ID + '-' + abTestSegments.ID;
                }
            }
        }

        // Save orderModel to custom object during session
        if (!empty(abTestParticipationSegment)) {
            Transaction.wrap(function () {
                order.custom.abTestParticipationSegment = abTestParticipationSegment;
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
    var viewData = res.getViewData();
    var orderAnalyticsTrackingData;
    var order = OrderMgr.getOrder(viewData.order.orderNumber);
    var orderLineItems = order.getAllProductLineItems();
    var productLineItem;
    var checkoutAddrHelper = require('*/cartridge/scripts/helpers/checkoutAddressHelper');
    var orderCustomHelper = require('*/cartridge/scripts/helpers/orderCustomHelper');
    checkoutAddrHelper.saveCheckoutShipAddress(viewData.order);

    if(Site.current.getCustomPreferenceValue('analyticsTrackingEnabled')) {
        var queryStringIntoParts = viewData.queryString.split('&');
        var urlID = queryStringIntoParts[0].split('=');
        var id = urlID[1];
        var urltoken = queryStringIntoParts[1].split('=');
        var token = urltoken[1];
        var thankYouPageUrl = URLUtils.abs('Order-Confirm', 'ID', id, 'token', token).toString();
    	var analyticsTrackingLineItems = [];
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
            }
        }

        orderAnalyticsTrackingData = {
            cart: analyticsTrackingLineItems,
            discount: orderDiscount,
            order_number: viewData.order.orderNumber,
            shipping: order.getShippingTotalGrossPrice().getDecimalValue() ? order.getShippingTotalGrossPrice().getDecimalValue().toString() : 0.00,
            orderConfirmationUrl: thankYouPageUrl,
            tax: order.getTotalTax().getDecimalValue() ? order.getTotalTax().getDecimalValue().toString() : 0.00,
            customerEmailOrUniqueNo: order.getCustomerEmail() ? order.getCustomerEmail() : ''
        };
        res.setViewData({orderAnalyticsTrackingData: JSON.stringify(orderAnalyticsTrackingData)});
    }

    viewData.checkoutPage = true;
    if (viewData.order) {
        var selectedPaymentMethod = orderCustomHelper.getSelectedPaymentMethod(viewData.order);
        viewData.selectedPaymentMethod = selectedPaymentMethod;
    }
    res.setViewData(viewData);
    next();
});

module.exports = server.exports();
