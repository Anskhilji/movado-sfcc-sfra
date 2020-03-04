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
        currentBasket.startCheckout();

        // Custom Start: ESW logic 
        var eswHelper = require('*/cartridge/scripts/helper/eswHelper').getEswHelper();
        var session = req.session.raw;
        if (eswHelper.getEShopWorldModuleEnabled()) {
            if (session.privacy.orderNo && !empty(session.privacy.orderNo)) { // eslint-disable-line no-undef
                res.redirect(URLUtils.https('Cart-Show').toString());
            }
        }
        // Custom End

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

        if(Site.current.getCustomPreferenceValue('analyticsTrackingEnabled')) {
        	var userTracking;
            if (viewData.customer.profile) {
                userTracking = { email : viewData.customer.profile.email };
            } else {
            	userTracking = { email : '' };
            }
            res.setViewData({userTracking: JSON.stringify(userTracking)});
        }

        res.setViewData({
            actionUrls: actionUrls,
            totals: totals
        });

        next();
});

module.exports = server.exports();
