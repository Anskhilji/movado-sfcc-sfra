/**
* Script file for calling price feed service api and update site preferences from response.
*/
function execute()
{
	var eswHelper = require('*/cartridge/scripts/helper/eswHelper').getEswHelper(),
		eswServices = require('*/cartridge/scripts/services/EswCoreService').getEswServices(),
		logger = require('dw/system/Logger'),
		Site = require('dw/system/Site').getCurrent();
	try {
		var priceFeedServiceObj,
			priceFeedResult,
			today = new Date();
		
		var oAuthObj = eswServices.getOAuthService(),
			dayOfAPICall = eswHelper.getDayOfLastAPICall(),
			shortenedDayOfAPICall = dayOfAPICall;
		if (!empty(dayOfAPICall)) {
			shortenedDayOfAPICall = dayOfAPICall.substring(0, dayOfAPICall.indexOf('.') + 4);
			shortenedDayOfAPICall = new Date(shortenedDayOfAPICall.concat(dayOfAPICall.substring(dayOfAPICall.length - 1)));
		}
		
		if (empty(shortenedDayOfAPICall) || today.toDateString() != shortenedDayOfAPICall.toDateString()) {
			var formData =  {
				'grant_type': 'client_credentials',
				'scope': 'pricing.advisor.api.all'
			   }
			formData.client_id = eswHelper.getClientID();
			formData.client_secret = eswHelper.getClientSecret();
			var oAuthResult = oAuthObj.call(formData);
			if (oAuthResult.status == 'OK' && !empty(oAuthResult.object)) {
				priceFeedServiceObj = eswServices.getPricingV2Service();
				priceFeedResult = priceFeedServiceObj.call(JSON.parse(oAuthResult.object).access_token);
				
				if (priceFeedResult.status == 'OK' && !empty(priceFeedResult.object)) {
					var priceFeed = JSON.parse(priceFeedResult.object);
					let	fxRates = priceFeed.fxRates,
						countryAdjustments = priceFeed.deliveryCountryAdjustments,
						rounding = priceFeed.rounding;

						Site.setCustomPreferenceValue('eswFxRatesJson', JSON.stringify(fxRates));
						Site.setCustomPreferenceValue('eswCountryAdjustmentJson', JSON.stringify(countryAdjustments));
						Site.setCustomPreferenceValue('eswRounding', JSON.stringify(rounding));
						Site.setCustomPreferenceValue('eswDay', priceFeed.lastUpdated);
				}
			} else if(oAuthResult.status == 'ERROR' || empty(oAuthResult.object)){
				logger.error('ESW Service Error: {0}',oAuthResult.errorMessage);
				return true;
			}
		}
	} catch(e){
		logger.error('ESW PriceFeed Error: {0} {1}',e.message, e.stack);
		return true;
	}
	return false;
}

exports.execute = execute;