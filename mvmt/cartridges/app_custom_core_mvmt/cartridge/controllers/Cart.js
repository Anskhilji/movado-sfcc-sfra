'use strict';


var csrfProtection = require('*/cartridge/scripts/middleware/csrf');
var consentTracking = require('*/cartridge/scripts/middleware/consentTracking');
var customCartHelpers = require('*/cartridge/scripts/helpers/customCartHelpers');

var server = require('server');
var page = module.superModule;
server.extend(page);

var ArrayList = require('dw/util/ArrayList');
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

server.get('MiniCartCheckout', server.middleware.include, function (req, res, next) {
    var BasketMgr = require('dw/order/BasketMgr');

    var isMobile = req.querystring.isMobile;
    var currentBasket = BasketMgr.getCurrentBasket();
    var quantityTotal;

    if (currentBasket) {
        quantityTotal = currentBasket.productQuantityTotal;
    } else {
        quantityTotal = 0;
    }

    res.render('/components/header/miniCartCheckout', {isMobile: isMobile, quantityTotal: quantityTotal });
    next();
});

server.append('MiniCartShow', server.middleware.https, csrfProtection.generateToken, function (req, res, next) {
    var BasketMgr = require('dw/order/BasketMgr');
    var currentBasket = BasketMgr.getCurrentOrNewBasket();
    var removeProductLineItemUrl = URLUtils.url('Cart-RemoveProductLineItem', 'isMiniCart', true).toString();
    var cartItems = customCartHelpers.removeFromCartGTMObj(currentBasket.productLineItems);
    var productCustomHelpers = require('*/cartridge/scripts/helpers/productCustomHelpers');
    var productLineItems = currentBasket.productLineItems.iterator();
    var marketingProductsData = [];

    while (productLineItems.hasNext()) {
        var productLineItem = productLineItems.next();
        var apiProduct = productLineItem.getProduct();
        var quantity = productLineItem.getQuantity().value;

        marketingProductsData.push(productCustomHelpers.getMarketingProducts(apiProduct, quantity));
    }

    var quantityTotal;

    if (currentBasket) {
        quantityTotal = currentBasket.productQuantityTotal;
    } else {
        quantityTotal = 0;
    }

    res.viewData.marketingProductData = JSON.stringify(marketingProductsData);
    res.viewData.removeProductLineItemUrl = removeProductLineItemUrl;
    res.viewData.cartItemObj = cartItems;
    res.viewData.quantityTotal = quantityTotal;

    next();
});

server.prepend(
        'Show',
        server.middleware.https,
	    consentTracking.consent,
	    csrfProtection.generateToken,
	    function (req, res, next) {
        res.setViewData({ loggedIn: req.currentCustomer.raw.authenticated });
        var BasketMgr = require('dw/order/BasketMgr');
        var CartModel = require('*/cartridge/models/cart');
        var currentBasket = BasketMgr.getCurrentOrNewBasket();
        var basketModel = new CartModel(currentBasket);
        var productLineItems = currentBasket.productLineItems.iterator();

        while (productLineItems.hasNext()) {
            var productLineItem = productLineItems.next();
        }

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

server.get('Recommendations', function (req, res, next) {
    var productCustomHelper = require('*/cartridge/scripts/helpers/productCustomHelper');
    var renderTemplateHelper = require('*/cartridge/scripts/renderTemplateHelper');
    var explicitRecommendations;
    var recommendedProductTemplate = '';
    var pid = req.querystring.pid;

    if (pid) {
        explicitRecommendations = productCustomHelper.getExplicitRecommendations(pid);
    }
    var attributeContext = {
        pid: pid,
        explicitRecommendations: explicitRecommendations
    };
    var attributeTemplateLinked = 'cart/recommendedProducts';
    recommendedProductTemplate = renderTemplateHelper.getRenderedHtml(
        attributeContext,
        attributeTemplateLinked
    );
    res.json({
        recommendedProductTemplate: recommendedProductTemplate
    });

    next();
});

module.exports = server.exports();
