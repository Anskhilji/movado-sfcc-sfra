'use strict';

var csrfProtection = require('*/cartridge/scripts/middleware/csrf');
var consentTracking = require('*/cartridge/scripts/middleware/consentTracking');
var customCartHelpers = require('*/cartridge/scripts/helpers/customCartHelpers');
var server = require('server');
var page = module.superModule;
server.extend(page);

server.replace('MiniCart', function(req, res, next) {
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
    //it is need to test
    var target = req.querystring.rurl || 1;
    var createAccountUrl = URLUtils.url('Account-SubmitAccountRegistrationFromMiniCart', 'rurl', target).relative().toString();
    var miniCartRegisterForm = server.forms.getForm('miniCartRegistrationForm');
    miniCartRegisterForm.clear();

    res.setViewData({
        createAccountUrl: createAccountUrl,
        miniCartRegisterForm: miniCartRegisterForm,
        paypalButtonImg: customCartHelpers.getContentAssetContent('ca-paypal-button')
    });
    next();
});

module.exports = server.exports();
