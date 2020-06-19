'use strict';

var server = require('server');
server.extend(module.superModule);

server.post('UpdateEvent', server.middleware.https, function (req, res, next) {
    var Site = require('dw/system/Site');
    var SFMCApi = require('int_custom_marketing_cloud/cartridge/scripts/api/SFMCApi');
    var isEswEnabled = !empty(Site.current.getCustomPreferenceValue('eswEshopworldModuleEnabled')) ?
            Site.current.getCustomPreferenceValue('eswEshopworldModuleEnabled') : false;
   
    var countryCode = isEswEnabled ? request.httpCookies['esw.location'].value : '';
    
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
