/**
 * Script file for calling price feed service api and update site preferences from response.
 * @return {boolean} - returns execute result
 */
function execute() {
    var eswHelper = require('*/cartridge/scripts/helper/eswHelper').getEswHelper(),
        eswServices = require('*/cartridge/scripts/services/EswCoreService').getEswServices(),
        logger = require('dw/system/Logger'),
        Status = require('dw/system/Status'),
        Site = require('dw/system/Site').getCurrent();
    try {
        var priceFeedServiceObj,
            priceFeedResult,
            today = new Date();

        var oAuthObj = eswServices.getPricingOAuthService(),
            dayOfAPICall = eswHelper.getDayOfLastAPICall(),
            shortenedDayOfAPICall = dayOfAPICall;
        if (!empty(dayOfAPICall)) {
            shortenedDayOfAPICall = dayOfAPICall.substring(0, dayOfAPICall.indexOf('.') + 4);
            shortenedDayOfAPICall = new Date(shortenedDayOfAPICall.concat(dayOfAPICall.substring(dayOfAPICall.length - 1)));
        }

        if (empty(shortenedDayOfAPICall) || today.toDateString() !== shortenedDayOfAPICall.toDateString()) {
            var formData = {
                'grant_type': 'client_credentials', // eslint-disable-line quote-props
                'scope': 'pricing.advisor.api.all' // eslint-disable-line quote-props
            };
            formData.client_id = eswHelper.getClientID();
            formData.client_secret = eswHelper.getSelectedPriceFeedInstance() === 'production' ? eswHelper.getProductionClientSecret() : eswHelper.getClientSecret();
            var oAuthResult = oAuthObj.call(formData);
            if (oAuthResult.status === 'OK' && !empty(oAuthResult.object)) {
                priceFeedServiceObj = eswServices.getPricingV3Service();
                priceFeedResult = priceFeedServiceObj.call(JSON.parse(oAuthResult.object).access_token);

                if (priceFeedResult.status === 'OK' && !empty(priceFeedResult.object)) {
                    var priceFeed = JSON.parse(priceFeedResult.object);
                    var fxRates = priceFeed.fxRates,
                        countryAdjustments = priceFeed.deliveryCountryAdjustments,
                        rounding = priceFeed.deliveryCountryRoundingModels;

                    Site.setCustomPreferenceValue('eswFxRatesJson', JSON.stringify(fxRates));
                    Site.setCustomPreferenceValue('eswCountryAdjustmentJson', JSON.stringify(countryAdjustments));
                    Site.setCustomPreferenceValue('eswRounding', JSON.stringify(rounding));
                    Site.setCustomPreferenceValue('eswDay', priceFeed.lastUpdated);
                    Site.setCustomPreferenceValue('eswPricingSynchronizationId', priceFeed.pricingSynchronizationId);
                } else if (priceFeedResult.status === 'ERROR' || empty(priceFeedResult.object)) {
                    if (priceFeedResult.error === 403) {
                        logger.error('ESW PriceFeed Service Forbidden Error: 403: Make sure that service URL configurations, Client ID and Client Secret are aligned and correct.');
                        return new Status(Status.ERROR);
                    }
                    logger.error('ESW PriceFeed Service Error: {0} {1}', priceFeedResult.error, priceFeedResult.msg);
                    return new Status(Status.ERROR);
                }
            } else if (oAuthResult.status === 'ERROR' || empty(oAuthResult.object)) {
                logger.error('ESW Service Error: {0}', oAuthResult.errorMessage);
                return new Status(Status.ERROR);
            }
        }
    } catch (e) {
        logger.error('ESW PriceFeed Error: {0} {1}', e.message, e.stack);
        return new Status(Status.ERROR);
    }
    return new Status(Status.OK);
}

exports.execute = execute;
