'use strict';

var csrfProtection = require('*/cartridge/scripts/middleware/csrf');
var consentTracking = require('*/cartridge/scripts/middleware/consentTracking');
var customCartHelpers = require('*/cartridge/scripts/helpers/customCartHelpers');
var server = require('server');
var page = module.superModule;
server.extend(page);

server.replace('MiniCart', server.middleware.include, function(req, res, next) {
    var BasketMgr = require('dw/order/BasketMgr');

    var currentBasket = BasketMgr.getCurrentBasket();
    var quantityTotal;

    if (currentBasket) {
        quantityTotal = currentBasket.productQuantityTotal;
    } else {
        quantityTotal = 0;
    }

    res.render('/components/header/miniCart', { quantityTotal: quantityTotal });
    next();
});

server.append('MiniCartShow', consentTracking.consent, server.middleware.https, csrfProtection.generateToken,
    function(req, res, next) {
    var URLUtils = require('dw/web/URLUtils');
    var target = req.querystring.rurl || 1;
    var actionUrl = URLUtils.url('Account-Login', 'rurl', target, 'isMiniCart', true);
    var createAccountUrl = URLUtils.url('Account-SubmitRegistration', 'rurl', target, 'isMiniCart', true).toString();
    var miniCartRegisterForm = server.forms.getForm('miniCartRegistrationForm');
    miniCartRegisterForm.clear();

    res.setViewData({
        createAccountUrl: createAccountUrl,
        actionUrl: actionUrl,
        miniCartRegisterForm: miniCartRegisterForm,
        paypalButtonImg: customCartHelpers.getContentAssetContent('ca-paypal-button')
    });
    next();
});

module.exports = server.exports();
