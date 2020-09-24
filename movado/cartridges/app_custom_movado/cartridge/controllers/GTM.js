'use strict';

var server = require('server');
server.extend(module.superModule);

function getOrderIDfromQueryString(queryString) {
    var orderTokenArray = queryString.split('&');
    var orderToken = orderTokenArray[0].split('=');
    return orderToken[1];
}

server.append(
    'LoadDataLayer',
    function (req, res, next) {
        var OrderMgr = require('dw/order/OrderMgr');
        var action = req.querystring.urlAction.toLowerCase();
        var currentCustomer = req.currentCustomer;
        var customerStatus = currentCustomer.raw.anonymous ? 'New' : 'Existing';
        var customerID = !empty(currentCustomer) && !empty(currentCustomer.profile) ? currentCustomer.profile.customerNo : '';
        var discountCode = '';
        var reqQueryString = req.querystring;
        var queryString;

        if (!empty(reqQueryString)) {
            queryString = req.querystring.urlQueryString;
            if (action.equals('order-confirm')) {
                var orderId = getOrderIDfromQueryString(queryString);
                if (orderId) {
                    var order = OrderMgr.getOrder(orderId);
                    var couponLineItemsItr = order.getCouponLineItems().iterator();
                    while (couponLineItemsItr.hasNext()) {
                        var couponLineItem = couponLineItemsItr.next();
                        var couponCode = couponLineItem.getCouponCode();
                        if (couponCode && !empty(discountCode)) {
                            discountCode = discountCode + ', ' + couponCode;
                        } else if (couponCode) {
                            discountCode = couponCode;
                        }
                    }
                }
            }
        }

        res.setViewData({
            customerStatus: customerStatus,
            customerID: customerID,
            discountCode: discountCode
		});
        
        next();
    }
);

module.exports = server.exports();

