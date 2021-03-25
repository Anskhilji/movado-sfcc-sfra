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
        var Logger = require('dw/system/Logger');
        
        var action = req.querystring.urlAction.toLowerCase();
        var currentCustomer = req.currentCustomer;
        var customerStatus = currentCustomer.raw.anonymous ? 'New' : 'Existing';
        var customerID = !empty(currentCustomer) && !empty(currentCustomer.profile) ? currentCustomer.profile.customerNo : '';
        var discountCode = [];
        var reqQueryString = req.querystring;
        var queryString;

        try {
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
                            if (couponCode) {
                                discountCode.push(couponCode);
                            }
                        }
                    }
                }
            }
        } catch (e) {
            Logger.error('Error occurred while trying to push the order level discount codes, ERROR: ' + e.stack);
        }

        res.setViewData({
            customerStatus: customerStatus,
            customerID: customerID,
            discountCode: discountCode.join()
		});
        
        next();
    }
);

module.exports = server.exports();

