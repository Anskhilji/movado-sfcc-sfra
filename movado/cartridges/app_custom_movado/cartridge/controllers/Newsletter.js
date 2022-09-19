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

    var emailSubmitLocation = !empty(req.querystring) ? req.querystring.pageType : 'footer';
    var geolocation = !empty(request.geolocation.countryCode) ? request.geolocation.countryCode : '';

    var requestParams = {
        email: !empty(request.httpParameterMap.email.value) ? request.httpParameterMap.email.value : '',
        country: !empty(request.httpParameterMap.country.value) ? request.httpParameterMap.country.value : geolocation,
        firstName: !empty(request.httpParameterMap.firstName.value) ? request.httpParameterMap.firstName.value : '',
        lastName: !empty(request.httpParameterMap.lastName.value) ? request.httpParameterMap.lastName.value : '',
        campaignName: !empty(request.httpParameterMap.campaignName.value) ? request.httpParameterMap.campaignName.value : '',
        eventName: !empty(request.httpParameterMap.eventName.value) ? request.httpParameterMap.eventName.value : '',
        birthday: !empty(request.httpParameterMap.birthday.value) ? request.httpParameterMap.birthday.value : '',
        birthDate: !empty(request.httpParameterMap.birthDate.value) ? request.httpParameterMap.birthDate.value : '',
        birthMonth: !empty(request.httpParameterMap.birthMonth.value) ? request.httpParameterMap.birthMonth.value : '',
        gender: !empty(request.httpParameterMap.gender.value) ? request.httpParameterMap.gender.value : '',
        phoneNumber: !empty(request.httpParameterMap.phoneNumber.value) ? request.httpParameterMap.phoneNumber.value : '',
        isEmailCheckDisabled: !empty(request.httpParameterMap.isEmailCheckDisabled.value) ? request.httpParameterMap.isEmailCheckDisabled.value : false
    };
    var result;
    if (Site.current.preferences.custom.Listrak_Cartridge_Enabled) {
        var ltkApi = require('*/cartridge/scripts/api/ListrakAPI');
        var ltkConstants = require('*/cartridge/scripts/utils/ListrakConstants');
        requestParams.source = ltkConstants.Source.Footer;
        requestParams.event = ltkConstants.Event.Footer;
        requestParams.subscribe = ltkConstants.Subscribe.Footer;
        result = ltkApi.sendSubscriberToListrak(requestParams);
    } else {
        result = SFMCApi.sendSubscriberToSFMC(requestParams);
    }
    var emailObj = [];
    emailObj.push({
        userEmail: requestParams.email,
        submitLocation: emailSubmitLocation
    });
    res.json(EmailSubscriptionHelper.emailSubscriptionResponse(result));
    
    var isanalyticsTrackingEnabled = Site.current.getCustomPreferenceValue('analyticsTrackingEnabled');
    if(isanalyticsTrackingEnabled) {
    	var userTracking = {email: requestParams.email};
        res.setViewData({
            userTracking: JSON.stringify(userTracking),
            isanalyticsTrackingEnabled: isanalyticsTrackingEnabled,
            emailObj: JSON.stringify(emailObj)
        });
    }
    return next();
});

module.exports = server.exports();
