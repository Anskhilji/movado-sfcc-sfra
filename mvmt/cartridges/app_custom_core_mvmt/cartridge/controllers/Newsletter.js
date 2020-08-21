/**
 * The controller submits the newsletter signup from homepage footer.
 * @module  controllers/Newsletter
 */

'use strict';

var server = require('server');
var page = module.superModule;
server.extend(page);

server.append('Subscribe', server.middleware.https, function (req, res, next) {
    var Bytes = require('dw/util/Bytes');
    var Encoding = require('dw/crypto/Encoding');
    var Site = require('dw/system/Site');

    var emailSubmitLocation = !empty(req.querystring) ? req.querystring.pageType : 'footer';
    var emailObj = [];

    if (res.viewData.success) {
        var isGtmEnabled = Site.current.getCustomPreferenceValue('gtmEnabled');
        if (isGtmEnabled) {
            var userEmail = req.form.email;
            var userHashedEmail = Encoding.toHex(new Bytes(userEmail, 'UTF-8'));
            emailObj.push({
                userEmail: userEmail,
                userHashedEmail: userHashedEmail,
                submitLocation: emailSubmitLocation
            });
            res.setViewData({emailObj: JSON.stringify(emailObj)});  
        }
        
    }
    return next();
});

server.post('UpdateEvent', server.middleware.https, function (req, res, next) {
    var Site = require('dw/system/Site');
    var SFMCApi = require('int_custom_marketing_cloud/cartridge/scripts/api/SFMCApi');
    var isEswEnabled = !empty(Site.current.getCustomPreferenceValue('eswEshopworldModuleEnabled')) ?
            Site.current.getCustomPreferenceValue('eswEshopworldModuleEnabled') : false;
   
    var countryCode = isEswEnabled ? session.custom.countryCode : '';
    
    var params = {
        email: !empty(request.httpParameterMap.email.value) ? request.httpParameterMap.email.value : '',
        country: countryCode,
        firstName: !empty(request.httpParameterMap.firstName.value) ? request.httpParameterMap.firstName.value : '',
        lastName: !empty(request.httpParameterMap.lastName.value) ? request.httpParameterMap.lastName.value : '',
        campaignName: !empty(request.httpParameterMap.campaignName.value) ? request.httpParameterMap.campaignName.value : '',
        eventName: !empty(request.httpParameterMap.eventName.value) ? request.httpParameterMap.eventName.value : '',
        birthday: !empty(request.httpParameterMap.birthday.value) ? request.httpParameterMap.birthday.value : '',
        gender: !empty(request.httpParameterMap.gender.value) ? request.httpParameterMap.gender.value : '',
        phoneNumber: !empty(request.httpParameterMap.phoneNumber.value) ? request.httpParameterMap.phoneNumber.value : ''
    };
    var result = SFMCApi.sendSubscriberToSFMC(params);
});

module.exports = server.exports();
