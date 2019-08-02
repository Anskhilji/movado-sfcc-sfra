'use strict';

var server = require('server');
server.extend(module.superModule);


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
        var analyticsTrackingLineItems = [];
        var orderLineItemsIterator = orderLineItems.iterator();
        while (orderLineItemsIterator.hasNext()) {
            productLineItem = orderLineItemsIterator.next();
            if (productLineItem instanceof dw.order.ProductLineItem &&
                !productLineItem.bonusProductLineItem && !productLineItem.optionID) {
                analyticsTrackingLineItems.push ({
                    item:  productLineItem.productName,
                    quantity: productLineItem.quantityValue,
                    price: productLineItem.basePrice.decimalValue.get(),
                    unique_id: productLineItem.productID
                });
            }
        }
        orderAnalyticsTrackingData = {
            cart: analyticsTrackingLineItems,
            order_number: viewData.order.orderNumber,
            shipping: order.getShippingTotalGrossPrice().toString(),
            tax: order.getTotalTax().getDecimalValue().toString(),
            customerEmailOrUniqueNo: order.getCustomerEmail() ? order.getCustomerEmail() : order.getCustomerNo()
        };
    }

    viewData.checkoutPage = true;
    res.setViewData(viewData);
    res.setViewData({orderAnalyticsTrackingData: JSON.stringify(orderAnalyticsTrackingData)});
    next();
});

module.exports = server.exports();
