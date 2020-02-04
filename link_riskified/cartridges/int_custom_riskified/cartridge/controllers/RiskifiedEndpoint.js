'use strict';

/**
 * @module controllers/RiskifiedEndPoint
 */

var server = require('server');
var page = module.superModule;
server.extend(page);

var Order = require('dw/order/Order');
var OrderMgr = require('dw/order/OrderMgr');
var Transaction = require('dw/system/Transaction');

var checkoutLogger = require('*/cartridge/scripts/helpers/customCheckoutLogger').getLogger();
var riskifiedResponseResult = require('*/cartridge/scripts/riskified/RiskifiedParseResponseResult');

/**
 * This function handles order analysis status request from Riskified. This
 * perform authorization on incoming request to ensure that its a legitimate
 * request. It also update analysis and order status accordingly.
 */

server.append('AnalysisNotificationEndpoint', function (req, res, next) {
    var body = request.httpParameterMap.requestBodyAsString;
    var jsonObj = JSON.parse(body);
    var orderId = jsonObj.order.id;
    var order = OrderMgr.getOrder(orderId);
    var viewData = res.getViewData();
    var isError = viewData.isError ? viewData.isError : false;
    var responseMessage = viewData.responseMessage ? viewData.responseMessage : "";
    if (order && !isError) {
        riskifiedResponseResult.parseRiskifiedResponse(order);
    } else if (order && isError == true) {
        Transaction.wrap(function () {
            //if order status is CREATED
            if (order.getStatus() == Order.ORDER_STATUS_CREATED) {
                checkoutLogger.error('(RiskifiedParseResponseResult) -> parseRiskifiedResponse: There is an error with message ' + responseMessage + ' and riskified failed the order and order status is failed and order number is: ' + order.orderNo);
                OrderMgr.failOrder(order);  //Order must be in status CREATED
                order.setConfirmationStatus(Order.CONFIRMATION_STATUS_NOTCONFIRMED);
            } else { //Only orders in status OPEN, NEW, or COMPLETED can be cancelled.
                checkoutLogger.error('(RiskifiedParseResponseResult) -> parseRiskifiedResponse: There is an error with message ' + responseMessage + ' and order status is OPEN, NEW, or COMPLETED can be cancelled and order number is: ' + order.orderNo);
                OrderMgr.cancelOrder(order);
                order.setConfirmationStatus(Order.CONFIRMATION_STATUS_NOTCONFIRMED);
            }
        });
    }
});


module.exports = server.exports();
