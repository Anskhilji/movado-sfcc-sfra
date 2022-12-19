'use strict';

/**
 * @module controllers/RiskifiedEndPoint
 */

var server = require('server');

/* Script Modules */
var RCLogger = require('*/cartridge/scripts/riskified/util/RCLogger');
var RCUtilities = require('*/cartridge/scripts/riskified/util/RCUtilities');
var AnalysisResponseModel = require('*/cartridge/scripts/riskified/export/api/riskifiedendpoint/AnalysisResponseModel');
var checkoutNotificationHelpers = require('*/cartridge/scripts/checkout/checkoutNotificationHelpers');
var Constants = require('app_custom_movado/cartridge/scripts/helpers/utils/NotificationConstant');


/**
 * This function handles order analysis status request from Riskified. This perform authorization
 * on incoming request to ensure that its a legitimate request. It also update analysis and order status 
 * accordingly.
 */
server.post('AnalysisNotificationEndpoint', function (req, res, next){
	
	var moduleName = "AnalysisNotificationEndpoint";
	var logLocation = moduleName + " : Riskified~handleAnalysisResponse";
	
	var response = AnalysisResponseModel.handle(moduleName);
	var message;
	
	if(response.error){
		message = "There were errors while updating order analysis. Error Message: " + response.message, "error", logLocation;
		RCLogger.logMessage(message);
	    checkoutNotificationHelpers.sendErrorNotification(Constants.RISKIFIED, message, logLocation, response.message);
		
		res.render('riskified/riskifiedorderanalysisresponse', {
			AnalysisUpdateError:true,
			AnalysisErrorMessage: response.message
			
		});
		res.setViewData({
		    isError: true,
		    responseMessage: response.message
		});
		return next();
		
	} else {
		res.render('riskified/riskifiedorderanalysisresponse', {
			ResponseStatus:'ok'
		});
		return next();
	}
});

/*
 * Web exposed method 
 */

module.exports = server.exports();