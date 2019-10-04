'use strict';

var server = require('server');
server.extend(module.superModule);
var URLUtils = require('dw/web/URLUtils');
var PromotionMgr = require('dw/campaign/PromotionMgr');
var Promotion = require('dw/campaign/Promotion');
var Money = require('dw/value/Money');

server.append('Confirm', function (req, res, next) {
    var OrderMgr = require('dw/order/OrderMgr');
    
    var Site = require('dw/system/Site');
    var viewData = res.getViewData();
    var orderAnalyticsTrackingData;
    var order = OrderMgr.getOrder(viewData.order.orderNumber);
    var orderLineItems = order.getAllProductLineItems();
    var productLineItem;
    var checkoutAddrHelper = require('*/cartridge/scripts/helpers/checkoutAddressHelper');
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

        while (orderLineItemsIterator.hasNext()) {
            productLineItem = orderLineItemsIterator.next();
            if (productLineItem instanceof dw.order.ProductLineItem &&
                !productLineItem.bonusProductLineItem && !productLineItem.optionID) {
            	var netPrice = productLineItem.getNetPrice().getDecimalValue() ? productLineItem.getNetPrice().getDecimalValue() : 0.00;
            	var discount = netPrice - productLineItem.getAdjustedNetPrice().getDecimalValue();
                analyticsTrackingLineItems.push ({
                    item:  productLineItem.productName,
                    quantity: productLineItem.quantityValue,
                    price: productLineItem.getAdjustedNetPrice().getDecimalValue().toString(),
                    discount: discount,
                    unique_id: productLineItem.productID
                });
            }
        }

        orderAnalyticsTrackingData = {
            cart: analyticsTrackingLineItems,
            order_number: viewData.order.orderNumber,
            shipping: order.getShippingTotalGrossPrice().getDecimalValue() ? order.getShippingTotalGrossPrice().getDecimalValue().toString() : 0.00,
            orderConfirmationUrl: thankYouPageUrl,
            tax: order.getTotalTax().getDecimalValue() ? order.getTotalTax().getDecimalValue().toString() : 0.00,
            customerEmailOrUniqueNo: order.getCustomerEmail() ? order.getCustomerEmail() : ''
        };
        res.setViewData({orderAnalyticsTrackingData: JSON.stringify(orderAnalyticsTrackingData)});
    }

    viewData.checkoutPage = true;
    res.setViewData(viewData);
    next();
});

module.exports = server.exports();
