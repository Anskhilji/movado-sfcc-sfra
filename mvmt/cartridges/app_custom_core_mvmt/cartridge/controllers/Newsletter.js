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

module.exports = server.exports();
