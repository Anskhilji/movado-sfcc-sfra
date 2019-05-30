/**
* Description of the Controller and the logic it provides
*
* @module  controllers/RiskifiedHandler
*/

'use strict';

var server = require('server');

server.get('Cancel', function (req, res, next){
	var response,
    message,
    orderNo = req.querystring.orderno,
    apiParams = {
        order: {
            orderNo: orderNo
        },
        cancel_reason: 'Canceled to show the SFRA cancel Api call'
    };

	var Riskified = require('int_riskified/cartridge/scripts/Riskified');

	response = Riskified.sendCancelOrder(apiParams.order, apiParams.cancel_reason);

	if (response.error) {
		message = 'Error Code: ' + response.errorCode + ', Text: ' + response.message;
	} else {
		message = 'Order canceled';
	}
	
	res.json({
        message: message,
        response: response
    });
	return next();
	
});

server.get('Refund', function (req, res, next){
	var response,
    message,
    refundDetails,
    orderNo,
    amount,
    refundDate,
    currentDate;
	
	var Calendar = require('dw/util/Calendar');
	var StringUtils = require('dw/util/StringUtils');
	var Constants = require('int_riskified/cartridge/scripts/riskified/util/Constants');
	
	var RiskifiedAPI = require('int_riskified/cartridge/scripts/riskifiedhandler');

	if (request.httpParameterMap.isParameterSubmitted('orderno') && request.httpParameterMap.isParameterSubmitted('amount')) {
		orderNo = req.querystring.orderno;
		amount = req.querystring.amount;
	} else {
		res.json({
			message   : 'Please specify both `orderno` and `amount` parameter in get request',
			apiMethod : 'refund',
			apiParams : 'null'
		});

    return next();
	}

	currentDate = new Calendar();
	refundDate = StringUtils.formatCalendar(currentDate, Constants.RISKIFIED_DATE_FORMAT);

	refundDetails = [{
        refund_id   : '456123',
        amount      : amount,
        refunded_at : refundDate,
        currency    : 'USD',
        reason      : 'SFRA Refund API Test'
    }];

	response = RiskifiedAPI.partialRefund(orderNo, refundDetails);

	if (response.error) {
		message = 'Error Code: ' + response.errorCode + ', Text: ' + response.message;
	} else {
		message = 'Order refunded';
	}

	res.json({
		message   : message,
		apiMethod : 'refund',
		apiParams : JSON.stringify(refundDetails)
	});

	return next();
});

server.get('Update', function (req, res, next){
	var response,
    message,
    orderNo = req.querystring.orderno;    

	var Riskified = require('int_riskified/cartridge/scripts/Riskified');
	
	var orderUpdateData = {
	        note: 'This is the order update by the Update Order call'
	    };
	
	var response = Riskified.sendUpdateOrder(orderNo, orderUpdateData);

	if (response.error) {
		message = 'Error Code: ' + response.errorCode + ', Text: ' + response.message;
	} else {
		message = 'Order updated';
	}
	
	res.json({
        message: message,
        response: response
    });
	return next();
	
});

server.get('Fulfill', function (req, res, next){
	var response,
    message,
    orderNo = req.querystring.orderno;
	
	orderMgr = require('dw/order/OrderMgr');
	
	var order = orderMgr.getOrder(orderNo);
    
	var fulfillment = [{
        fulfillmentId   : '12sfra123test',
        status          : 'success',
        trackingCompany : 'fedex',
        trackingNumbers : '321abc123',
        trackingUrls    : 'http://fedex.com/track?q=321abc123',
        message         : 'fulfillment sfra message',
        receipt         : 'authorization: 765656'
    }];

	var Riskified = require('int_riskified/cartridge/scripts/Riskified');

	response = Riskified.sendFulfillOrder(order, fulfillment);

	if (response.error) {
		message = 'Error Code: ' + response.errorCode + ', Text: ' + response.message;
	} else {
		message = 'Order fullfiled';
	}
	
	res.json({
        message: message,
        response: response
    });
	return next();
	
});

module.exports = server.exports();