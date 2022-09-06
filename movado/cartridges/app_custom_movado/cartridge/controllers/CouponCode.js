'use strict';

var server = require('server');

var URLUtils = require('dw/web/URLUtils');

server.post('Apply', function (req, res, next) {
    // Custom Start : Adding URL Cupon Logic
    var referralCouponHelper = require('*/cartridge/scripts/helpers/referralHelper');
    referralCouponHelper.addReferralCoupon(request);
    // Custom End: Adding URL Cupon Logic
    next();
});

module.exports = server.exports();