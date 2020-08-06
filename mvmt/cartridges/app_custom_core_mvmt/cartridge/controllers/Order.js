'use strict';

var server = require('server');
server.extend(module.superModule);

server.append('Confirm', function (req, res, next) {
    var OrderMgr = require('dw/order/OrderMgr');
    var Site = require('dw/system/Site');
    var Transaction = require('dw/system/Transaction');
    var viewData = res.getViewData();
    var orderAnalyticsTrackingData;
    var uniDaysTrackingLineItems;
    var order = OrderMgr.getOrder(viewData.order.orderNumber);
    var orderLineItems = order.getAllProductLineItems();
    var productCustomHelpers = require('*/cartridge/scripts/helpers/productCustomHelpers');
    var productLineItem;
    var userIPAddress = request.httpRemoteAddress || '';
    var couponLineItemsItr = order.getCouponLineItems().iterator();
    var checkoutAddrHelper = require('*/cartridge/scripts/helpers/checkoutAddressHelper');
    var orderCustomHelper = require('*/cartridge/scripts/helpers/orderCustomHelper');
    checkoutAddrHelper.saveCheckoutShipAddress(viewData.order);
    var ProductMgr = require('dw/catalog/ProductMgr');

    if(Site.current.getCustomPreferenceValue('analyticsTrackingEnabled')) {
        var orderLineItemArray = [];
        var orderLineItemsIterator = orderLineItems.iterator();
        var marketingProductsData = [];
        while (orderLineItemsIterator.hasNext()) {
            productLineItem = orderLineItemsIterator.next();
            if (productLineItem instanceof dw.order.ProductLineItem &&
                !productLineItem.bonusProductLineItem && !productLineItem.optionID) {
                    var apiProduct = productLineItem.getProduct();
                    var quantity = productLineItem.getQuantity().value;
                    marketingProductsData.push(productCustomHelpers.getMarketingProducts(apiProduct, quantity));
            }
        }
    }
    res.setViewData(marketingProductsData);
    next();
});

module.exports = server.exports();