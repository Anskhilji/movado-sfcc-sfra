'use strict';


var csrfProtection = require('*/cartridge/scripts/middleware/csrf');
var consentTracking = require('*/cartridge/scripts/middleware/consentTracking');
var customCartHelpers = require('*/cartridge/scripts/helpers/customCartHelpers');
var server = require('server');
var page = module.superModule;
server.extend(page);

var Site = require('dw/system/Site');
var URLUtils = require('dw/web/URLUtils');

server.replace('MiniCart', server.middleware.include, function (req, res, next) {
    var BasketMgr = require('dw/order/BasketMgr');

    var isMobile = req.querystring.isMobile;
    var currentBasket = BasketMgr.getCurrentBasket();
    var quantityTotal;

    if (currentBasket) {
        quantityTotal = currentBasket.productQuantityTotal;
    } else {
        quantityTotal = 0;
    }

    res.render('/components/header/miniCart', {isMobile: isMobile, quantityTotal: quantityTotal });
    next();
});

server.append('MiniCartShow', server.middleware.https, csrfProtection.generateToken, function(req, res, next) {
    var removeProductLineItemUrl = URLUtils.url('Cart-RemoveProductLineItem', 'isMiniCart', true).toString();
    res.viewData.removeProductLineItemUrl = removeProductLineItemUrl;
    next();
});

server.append('RemoveProductLineItem', function (req, res, next) {
    var homePageURL = URLUtils.url('Home-Show').toString();
    var isMiniCart = empty(req.querystring.isMiniCart) ? false : req.querystring.isMiniCart;
    var basket = empty(res.getViewData().basket) ? '' : res.getViewData().basket;
    var basketItems = empty(basket) ? 0 : basket.items.length;

    if (basketItems == 0 && isMiniCart) {
        var ContentMgr = require('dw/content/ContentMgr');
        var emptyMiniContentAssetImage = empty(ContentMgr.getContent('mini-cart-content-image').custom.body.markup) ? null : ContentMgr.getContent('mini-cart-content-image').custom.body.markup;
        var emptyMiniContentAssetDescription = empty(ContentMgr.getContent('mini-cart-content-description').custom.body.markup) ? null : ContentMgr.getContent('mini-cart-content-description').custom.body.markup;
        var emptyMiniContentAssetUrls = empty(ContentMgr.getContent('empty-mini-cart-content-urls').custom.body.markup) ? null : ContentMgr.getContent('empty-mini-cart-content-urls').custom.body.markup;
        var staticCrossImage = URLUtils.staticURL('/images/cross.svg').toString();
        res.setViewData({
            emptyMiniContentAssetImage: emptyMiniContentAssetImage,
            emptyMiniContentAssetDescription: emptyMiniContentAssetDescription,
            emptyMiniContentAssetUrls: emptyMiniContentAssetUrls,
            crossImage: staticCrossImage
        });
    } else {
        var ContentMgr = require('dw/content/ContentMgr');
        var emptyMiniContentAssetImage = empty(ContentMgr.getContent('mini-cart-content-image').custom.body.markup) ? null : ContentMgr.getContent('mini-cart-content-image').custom.body.markup;
        var emptyMiniContentAssetDescription = empty(ContentMgr.getContent('mini-cart-content-description').custom.body.markup) ? null : ContentMgr.getContent('mini-cart-content-description').custom.body.markup;
        var emptyMiniContentAssetUrls = empty(ContentMgr.getContent('empty-mini-cart-content-urls').custom.body.markup) ? null : ContentMgr.getContent('empty-mini-cart-content-urls').custom.body.markup;
        res.setViewData({
            emptyMiniContentAssetImage: emptyMiniContentAssetImage,
            emptyMiniContentAssetDescription: emptyMiniContentAssetDescription,
            emptyMiniContentAssetUrls: emptyMiniContentAssetUrls
        });
        res.setViewData({homePageURL: homePageURL});
    }
    next();
});

module.exports = server.exports();
