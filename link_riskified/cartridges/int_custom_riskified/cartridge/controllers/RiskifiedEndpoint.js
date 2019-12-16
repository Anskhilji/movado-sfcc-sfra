'use strict';

/**
 * @module controllers/RiskifiedEndPoint
 */

var server = require('server');
var page = module.superModule;
server.extend(page);
var riskifiedResponseResult = require('*/cartridge/scripts/riskified/RiskifiedParseResponseResult');
var OrderMgr = require('dw/order/OrderMgr');

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
    if (order && !isError) {
        riskifiedResponseResult.parseRiskifiedResponse(order);
    }
});


module.exports = server.exports();
