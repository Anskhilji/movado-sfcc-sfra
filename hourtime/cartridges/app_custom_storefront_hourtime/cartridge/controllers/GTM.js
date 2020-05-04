'use strict';

var server = require('server');
server.extend(module.superModule);

server.append(
    'LoadDataLayer',
    function (req, res, next) {
        var OrderMgr = require('dw/order/OrderMgr');
        var action = req.querystring.urlAction.toLowerCase();
        var customerID = '';
        var couponCode = '';
        var loggedIn = req.currentCustomer.raw.authenticated;
        var orderDiscount = 0;
        
        if (loggedIn) {
            customerID = req.currentCustomer.profile.customerNo;
        }
        
        if (action.equals('order-confirm')) {
            var orderTokenArray = req.querystring.urlQueryString.split('&');
            var orderToken = orderTokenArray[0].split('=');
            var orderID = orderToken[1];
            var Order = OrderMgr.getOrder(orderID);
            orderDiscount = Order.getMerchandizeTotalNetPrice().subtract(Order.getAdjustedMerchandizeTotalNetPrice());
            var couponLineItemsItr = Order.getCouponLineItems().iterator();
            while (couponLineItemsItr.hasNext()) {
                var couponLineItem = couponLineItemsItr.next();
                couponCode = couponLineItem.getCouponCode();
            }
        }
        
        var orderTrackingObj = {
            customerID: customerID,
            orderDiscount: orderDiscount,
            couponCode: couponCode
        }
        
        res.setViewData({ orderTrackingObj: orderTrackingObj });
        next();
    }
);

module.exports = server.exports();

