'use strict';

var server = require('server');

var csrfProtection = require('*/cartridge/scripts/middleware/csrf');
var consentTracking = require('*/cartridge/scripts/middleware/consentTracking');

var page = module.superModule;
server.extend(page);

server.append(
	'Begin',
	server.middleware.https,
	consentTracking.consent,
	csrfProtection.generateToken,
	function (req, res, next) {
    var viewData = res.getViewData();
    var actionUrls = viewData.order.checkoutCouponUrls;
    var totals = viewData.order.totals;

    res.setViewData({
        actionUrls: actionUrls,
        totals: totals
    });

    next();
});

module.exports = server.exports();
