'use strict';

var server = require('server');

var csrfProtection = require('*/cartridge/scripts/middleware/csrf');
var consentTracking = require('*/cartridge/scripts/middleware/consentTracking');

var page = module.superModule;
server.extend(page);

server.append(
    'Login',
    server.middleware.https,
    consentTracking.consent,
    csrfProtection.generateToken,
    function (req, res, next) {
        var BasketMgr = require('dw/order/BasketMgr');
        var Site = require('dw/system/Site');
        var currentBasket = BasketMgr.getCurrentBasket();

        if (currentBasket && !req.currentCustomer.profile) {
			var facebookOauthProvider = Site.getCurrent().getCustomPreferenceValue('facebookOauthProvider');
            var googleOauthProvider = Site.getCurrent().getCustomPreferenceValue('googleOauthProvider');
			var oAuthObject = {
        		facebookOauthProvider : facebookOauthProvider,
        		googleOauthProvider : googleOauthProvider
            }
            res.setViewData(oAuthObject);
        }

        return next();
    }
);


server.append(
	'Begin',
	server.middleware.https,
	consentTracking.consent,
	csrfProtection.generateToken,
	function (req, res, next) {
        var Site = require('dw/system/Site');
        
        var viewData = res.getViewData();
        var actionUrls = viewData.order.checkoutCouponUrls;
        var totals = viewData.order.totals;
        var userTracking;
        
        if(Site.current.getCustomPreferenceValue('analyticsTrackingEnabled')) {
            if (viewData.customer.profile) {
                userTracking = { email : viewData.customer.profile.email };
            } else {
            	userTracking = { email : '' };
            }
        }

        res.setViewData({
            actionUrls: actionUrls,
            totals: totals,
            userTracking: JSON.stringify(userTracking)
        });

        next();
});

module.exports = server.exports();
