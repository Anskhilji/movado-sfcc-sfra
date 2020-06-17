/**
 * The controller submits the newsletter signup from homepage footer.
 * @module  controllers/Newsletter
 */

'use strict';

var server = require('server');
var page = module.superModule;
server.extend(page);

server.append('Subscribe', server.middleware.https, function (req, res, next) {
    var Site = require('dw/system/Site');
    var SFMCApi = require('int_custom_marketing_cloud/cartridge/scripts/api/SFMCApi');
    var Encoding = require('dw/crypto/Encoding');
    var Bytes = require('dw/util/Bytes');
    var emailObj = [];
    var requestParams = {
        email: req.form.email
    }
    var result = SFMCApi.sendSubscriberToSFMC(requestParams);
    if(result.success){
        var isGtmEnabled = Site.current.getCustomPreferenceValue('gtmEnabled');
        if(isGtmEnabled) {
            var userEmail = req.form.email;
            var userHashedEmail = Encoding.toHex(new Bytes(userEmail, 'UTF-8'));
            emailObj.push({
                userEmail: userEmail,
                userHashedEmail: userHashedEmail,
                submitLocation: 'footer'
            });
            res.setViewData({emailObj: JSON.stringify(emailObj)});  
        }
        
    }
    return next();
});

module.exports = server.exports();
