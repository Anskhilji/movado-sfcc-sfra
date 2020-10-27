/**
 * The controller submits the newsletter signup from homepage footer.
 * @module  controllers/Newsletter
 */

'use strict';


var server = require('server');
var csrfProtection = require('*/cartridge/scripts/middleware/csrf');
var newletterHelper = require('*/cartridge/scripts/helpers/newsletterHelper');

server.post('Subscribe', server.middleware.https, function (req, res, next) {
    var Site = require('dw/system/Site');
    var SFMCApi = require('int_custom_marketing_cloud/cartridge/scripts/api/SFMCApi');
    var EmailSubscriptionHelper = require('int_custom_marketing_cloud/cartridge/scripts/helper/EmailSubscriptionHelper');

    var requestParams = {
        email: !empty(request.httpParameterMap.email.value) ? request.httpParameterMap.email.value : '',
        country: !empty(request.httpParameterMap.country.value) ? request.httpParameterMap.country  .value : '',
        firstName: !empty(request.httpParameterMap.firstName.value) ? request.httpParameterMap.firstName.value : '',
        lastName: !empty(request.httpParameterMap.lastName.value) ? request.httpParameterMap.lastName.value : '',
        campaignName: !empty(request.httpParameterMap.campaignName.value) ? request.httpParameterMap.campaignName.value : '',
        eventName: !empty(request.httpParameterMap.eventName.value) ? request.httpParameterMap.eventName.value : '',
        birthday: !empty(request.httpParameterMap.birthday.value) ? request.httpParameterMap.birthday.value : '',
        gender: !empty(request.httpParameterMap.gender.value) ? request.httpParameterMap.gender.value : '',
        phoneNumber: !empty(request.httpParameterMap.phoneNumber.value) ? request.httpParameterMap.phoneNumber.value : '',
        isEmailCheckDisabled: !empty(request.httpParameterMap.isEmailCheckDisabled.value) ? request.httpParameterMap.isEmailCheckDisabled.value : false
    };
    var result = SFMCApi.sendSubscriberToSFMC(requestParams);
    res.json(EmailSubscriptionHelper.emailSubscriptionResponse(result));
    
    var isanalyticsTrackingEnabled = Site.current.getCustomPreferenceValue('analyticsTrackingEnabled');
    if(isanalyticsTrackingEnabled) {
    	var userTracking = {email: requestParams.email};
        res.setViewData({
            userTracking: JSON.stringify(userTracking),
            isanalyticsTrackingEnabled: isanalyticsTrackingEnabled
        });
    }
    return next();
});

module.exports = server.exports();
