'use strict';


var csrfProtection = require('*/cartridge/scripts/middleware/csrf');
var consentTracking = require('*/cartridge/scripts/middleware/consentTracking');
var customCartHelpers = require('*/cartridge/scripts/helpers/customCartHelpers');
var server = require('server');
var page = module.superModule;
server.extend(page);

var Site = require('dw/system/Site');
var URLUtils = require('dw/web/URLUtils');

server.append('MiniCartShow', consentTracking.consent, server.middleware.https, csrfProtection.generateToken,
    function(req, res, next) {
    var target = req.querystring.rurl || 1;
    var actionUrl = URLUtils.url('Account-Login', 'rurl', target, 'isMiniCart', true);
    var createAccountUrl = URLUtils.url('Account-SubmitRegistration', 'rurl', target, 'isMiniCart', true).toString();
    var removeProductLineItemUrl = URLUtils.url('Cart-RemoveProductLineItem', 'isMiniCart', true).toString();
    var facebookOauthProvider = Site.getCurrent().getCustomPreferenceValue('facebookOauthProvider');
    var googleOauthProvider = Site.getCurrent().getCustomPreferenceValue('googleOauthProvider');
    var miniCartRegisterForm = server.forms.getForm('miniCartRegistrationForm');
    miniCartRegisterForm.clear();

    res.setViewData({
        facebookOauthProvider: facebookOauthProvider,
        googleOauthProvider: googleOauthProvider,
        oAuthReentryEndpoint: 2,
        createAccountUrl: createAccountUrl,
        actionUrl: actionUrl,
        miniCartRegisterForm: miniCartRegisterForm,
        removeProductLineItemUrl: removeProductLineItemUrl,
        paypalButtonImg: customCartHelpers.getContentAssetContent('ca-paypal-button')
    });
    next();
});

server.append('RemoveProductLineItem', function (req, res, next) {
    var homePageURL = URLUtils.url('Home-Show').toString();
    var isMiniCart = empty(req.querystring.isMiniCart) ? false : true;
    var basket = empty(res.getViewData().basket) ? '' : res.getViewData().basket;
    var basketItems = empty(basket) ? 0 : basket.items.length;

    if (basketItems == 0 && isMiniCart) {
        var ContentMgr = require('dw/content/ContentMgr');
        var emptyMiniContentAssetImage = ContentMgr.getContent('mini-cart-content-image').custom.body.markup;
        var emptyMiniContentAssetDescription = ContentMgr.getContent('mini-cart-content-description').custom.body.markup;
        var emptyMiniContentAssetUrls = ContentMgr.getContent('empty-mini-cart-content-urls').custom.body.markup;
        var staticCrossImage = URLUtils.staticURL('/images/cross.svg').toString();
        res.setViewData({
            emptyMiniContentAssetImage: emptyMiniContentAssetImage,
            emptyMiniContentAssetDescription: emptyMiniContentAssetDescription,
            emptyMiniContentAssetUrls: emptyMiniContentAssetUrls,
            crossImage: staticCrossImage
        });
    } else {
        res.setViewData({homePageURL: homePageURL});
    }
    next();
});

module.exports = server.exports();
