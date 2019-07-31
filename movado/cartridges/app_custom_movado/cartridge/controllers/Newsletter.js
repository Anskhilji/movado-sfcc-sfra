/**
 * The controller submits the newsletter signup from homepage footer.
 * @module  controllers/Newsletter
 */

'use strict';


var server = require('server');
var csrfProtection = require('*/cartridge/scripts/middleware/csrf');
var newletterHelper = require('*/cartridge/scripts/helpers/newsletterHelper');
var Resource = require('dw/web/Resource');


server.post('Subscribe', server.middleware.https, function (req, res, next) {
    var Site = require('dw/system/Site');
    
    res.json(newletterHelper.subscribeToNewsletter(req.form.email, null, req.currentCustomer));
    
    var userTracking;
    var isanalyticsTrackingEnabled = Site.current.getCustomPreferenceValue('analyticsTrackingEnabled');
    
    if(isanalyticsTrackingEnabled) {
        var userTracking = {email: req.form.email};
        res.setViewData({
            userTracking: JSON.stringify(userTracking),
            isanalyticsTrackingEnabled: isanalyticsTrackingEnabled
        });
    }
    return next();
});

module.exports = server.exports();
