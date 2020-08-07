'use strict';

var server = require('server');
server.extend(module.superModule);

server.append('Confirm', function (req, res, next) {
    var OrderMgr = require('dw/order/OrderMgr');
    var viewData = res.getViewData();
    var order = OrderMgr.getOrder(viewData.order.orderNumber);
    var orderLineItems = order.getAllProductLineItems();
    var productCustomHelpers = require('*/cartridge/scripts/helpers/productCustomHelpers');
    var productLineItem;
    var checkoutAddrHelper = require('*/cartridge/scripts/helpers/checkoutAddressHelper');
    checkoutAddrHelper.saveCheckoutShipAddress(viewData.order);

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
    viewData.marketingProductData = marketingProductsData;

    res.setViewData(viewData);
    next();
});

module.exports = server.exports();