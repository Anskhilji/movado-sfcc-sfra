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
var Site = require('dw/system/Site');

var checkoutLogger = require('*/cartridge/scripts/helpers/customCheckoutLogger').getLogger();
var RCLogger = require('*/cartridge/scripts/riskified/util/RCLogger');
var RCUtilities = require('*/cartridge/scripts/riskified/util/RCUtilities');
var riskifiedResponseResult = require('*/cartridge/scripts/riskified/RiskifiedParseResponseResult');



/**
 * This function used to check if order is being placed then let Riskified
 * change the order status, otherwise send an error.
 */

server.prepend('AnalysisNotificationEndpoint', function (req, res, next) {
    var moduleName = "AnalysisNotificationEndpoint";
    var logLocation = moduleName + " : Riskified~handleAnalysisResponse";

    var body = request.httpParameterMap.requestBodyAsString;
    var jsonObj = JSON.parse(body);
    var orderId = jsonObj.order.id;
    var order = OrderMgr.getOrder(orderId);
	
	if(!RCUtilities.isCartridgeEnabled()) {
	    RCLogger.logMessage("riskifiedCartridgeEnabled site preference is not enabled therefore cannot proceed further", "debug", logLocation);
		
        res.render('riskified/riskifiedorderanalysisresponse', {
            CartridgeDisabled: true
	    });
        this.emit('route:Complete', req, res);
        return;
	}

    if (order && !order.custom.isOrderCompleted) {
        res.render('riskified/riskifiedorderanalysisresponse', {
            AnalysisUpdateError:true,
            AnalysisErrorMessage: 'Order is not placed yet: ' + orderId
        });
        this.emit('route:Complete', req, res);
        return;
    }
    return next();
});

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
    } else if (order && isError == true && order.custom.isOrderCompleted) {

        /* Reject in OMS - Do not process to fulfillment status */
        if ('SOMIntegrationEnabled' in Site.getCurrent().preferences && Site.getCurrent().preferences.custom.SOMIntegrationEnabled) {
            var somLog = require('dw/system/Logger').getLogger('SOM', 'CheckoutServices');
            try {
                var SalesforceModel = require('*/cartridge/scripts/SalesforceService/models/SalesforceModel');
                var responseFraudUpdateStatus = SalesforceModel.updateOrderSummaryFraudStatus({
                    orderSummaryNumber: order.getOrderNo(),
                    status: 'Cancelled'
                });
            }
            catch (exSOM) {
                somLog.error('RiskifiedParseResponseResult - ' + exSOM);
            }
        }

        if (!Site.getCurrent().preferences.custom.SOMIntegrationEnabled) {
            Transaction.wrap(function () {
                //if order status is CREATED
                if (order.getStatus() == Order.ORDER_STATUS_CREATED) {
                    checkoutLogger.error('(RiskifiedParseResponseResult) -> parseRiskifiedResponse: There is an error with message ' + responseMessage + ' and riskified failed the order and order status is failed and order number is: ' + order.orderNo);
                    // MSS-1169 Passed true as param to fix deprecated method usage
                    OrderMgr.failOrder(order, true);  //Order must be in status CREATED
                    order.setConfirmationStatus(Order.CONFIRMATION_STATUS_NOTCONFIRMED);
                } else { //Only orders in status OPEN, NEW, or COMPLETED can be cancelled.
                    checkoutLogger.error('(RiskifiedParseResponseResult) -> parseRiskifiedResponse: There is an error with message ' + responseMessage + ' and order status is OPEN, NEW, or COMPLETED can be cancelled and order number is: ' + order.orderNo);
                    OrderMgr.cancelOrder(order);
                    order.setConfirmationStatus(Order.CONFIRMATION_STATUS_NOTCONFIRMED);
                }
            });
        }
    }
});


module.exports = server.exports();
