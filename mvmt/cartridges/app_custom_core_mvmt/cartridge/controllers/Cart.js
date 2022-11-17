'use strict';


var csrfProtection = require('*/cartridge/scripts/middleware/csrf');
var consentTracking = require('*/cartridge/scripts/middleware/consentTracking');
var customCartHelpers = require('*/cartridge/scripts/helpers/customCartHelpers');
var productFactory = require('*/cartridge/scripts/factories/product');
var productCustomHelper = require('*/cartridge/scripts/helpers/productCustomHelper');
var ProductMgr = require('dw/catalog/ProductMgr');
var productHelper = require('*/cartridge/scripts/helpers/productHelpers');

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

/**
* Opens the Modal and populates it with GiftBox and Gift Message.
*/
server.get('ShowGiftBoxModal', server.middleware.https, csrfProtection.generateToken, function (req, res, next) {
    var renderTemplateHelper = require('*/cartridge/scripts/renderTemplateHelper');
    var viewData;
    var params = {
        pid: req.querystring.pid,
        uuid: req.querystring.uuid,
        itemLevelGiftMessage: req.querystring.itemLevelGiftMessage,
        isCartPage: req.querystring.isCartPage
    };

    var product = productFactory.get(params);
    var apiProduct = ProductMgr.getProduct(req.querystring.pid);
    var giftBoxSKUData = productCustomHelper.getGiftBoxSKU(apiProduct);
    var images = product.images.tile150;

    var BasketMgr = require('dw/order/BasketMgr');
    var CartModel = require('*/cartridge/models/cart');
    var currentBasket = BasketMgr.getCurrentOrNewBasket();
    var basketModel = new CartModel(currentBasket);
    var itemLevelGiftMessage;

    for (var i = 0; i < basketModel.items.length; i++) {
        var lineItem = basketModel.items[i];
        if (lineItem.id == params.pid) {
            itemLevelGiftMessage = (!empty(lineItem.customAttributes) && !empty(lineItem.customAttributes.itemLevelGiftMessage)) ? lineItem.customAttributes.itemLevelGiftMessage.msgLine1 : '';
            var ProductLineItemUUID = lineItem.UUID;
        }
    }

    viewData = {
        product: product,
        image: images[0],
        productUUID: params.uuid,
        giftBoxSKUData: giftBoxSKUData,
        isCartPage: params.isCartPage,
        itemLevelGiftMessage: itemLevelGiftMessage,
        basketModel: basketModel,
        ProductLineItemUUID: ProductLineItemUUID
    };

    var template = 'checkout/cart/giftBoxModel';

    var giftModelTemplate = renderTemplateHelper.getRenderedHtml(viewData, template);

    res.setViewData(viewData);

    res.json({
        template : giftModelTemplate,
        itemLevelGiftMessage : itemLevelGiftMessage
    });

    next();
});

// Show add to Cart Button as Remote Include
server.replace('ShowAddProductButton', function (req, res, next) {
    var showProductPageHelperResult = productHelper.showProductPage(req.querystring, req.pageMetaData);
    var productId = req.querystring.pid;
    var display = {
        plpTile: false
    }

    res.render('product/components/showCartButtonProduct', {
        product: showProductPageHelperResult.product,
        isPLPProduct: req.querystring.isPLPProduct ? req.querystring.isPLPProduct : false,
        productId: productId,
        display: display
    });

    next();
});

server.post('AddGiftProduct', function (req, res, next) {

    var Transaction = require('dw/system/Transaction');
    var cartHelper = require('*/cartridge/scripts/cart/cartHelpers');
    var BasketMgr = require('dw/order/BasketMgr');
    var currentBasket = BasketMgr.getCurrentOrNewBasket();
    var basketCalculationHelpers = require('*/cartridge/scripts/helpers/basketCalculationHelpers');
    var ProductLineItemsModel = require('*/cartridge/models/productLineItems');
    var CartModel = require('*/cartridge/models/cart');
    var renderTemplateHelper = require('*/cartridge/scripts/renderTemplateHelper');
    var isCartPage = req.form.isCartPage;
    var result;
    var quantity;
    var parentUUID = req.form.parentPid;
         // Custom Start MSS-1935 Gift Box Implementation
         if (!empty(req.form.giftPid)) {
            Transaction.wrap(function () {
                quantity = 1;
                result = cartHelper.addProductToCart(
                        currentBasket,
                        req.form.giftPid,
                        1,
                        [],
                        []
                    );
                if (!result.error) {
                   
                    var lineItemsIterator = currentBasket.allProductLineItems.iterator();
                    var currentLineItemsIterator;
                    while (lineItemsIterator.hasNext()) {
                        currentLineItemsIterator = lineItemsIterator.next();
                        if (currentLineItemsIterator.UUID == req.form.parentPid) {
                            currentLineItemsIterator.custom.giftPid = req.form.giftPid;
                        } else if (currentLineItemsIterator.UUID == result.uuid) {
                            currentLineItemsIterator.custom.giftParentUUID = req.form.parentPid;
                        }
                    }

                    cartHelper.ensureAllShipmentsHaveMethods(currentBasket);
                    basketCalculationHelpers.calculateTotals(currentBasket);
                }
            });
        }
        
        
        if (req.form.isGiftItem && !empty(req.form.isGiftItem)) {
            basketModel = new CartModel(currentBasket);
            basketModel.removeProductLineItemUrl = basketModel.actionUrls.removeProductLineItemUrl;
            var template;
            if (isCartPage === 'true') {
                template = 'cart/productCard/cartGiftProductCard';
            } else {
                template = 'cart/productCard/miniCartGiftProductCard';
            }
            giftProductCardHtml = renderTemplateHelper.getRenderedHtml(basketModel, template);
        }

        var quantityTotal = ProductLineItemsModel.getTotalQuantity(currentBasket.productLineItems);
        var cartModel = new CartModel(currentBasket);
        var SCACart;
        var listrakCountryCode;

        if (dw.system.Site.current.preferences.custom.Listrak_Cartridge_Enabled) {
            var ltkSendSca = require('*/cartridge/controllers/ltkSendSca');
            var ltkHelper = require('*/cartridge/scripts/helper/ltkHelper');
            var ltkCartHelper = require('*/cartridge/scripts/helper/ltkCartHelper');
            session.privacy.ltkCountryCode = ltkHelper.getCountryCode(req);
            ltkSendSca.SendSCAPost();
            SCACart =  ltkCartHelper.ltkLoadBasket(req);
            listrakCountryCode = session.privacy.ltkCountryCode;
        }

        res.json({
            quantityTotal: quantityTotal,
            message: result.message,
            cart: cartModel,
            error: result.error,
            pliUUID: result.uuid,
            giftProductCardHtml: giftProductCardHtml,
            SCACart: SCACart,
            listrakCountryCode: listrakCountryCode
        });
    
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

// this logic is used to remove child gift item if we remove parent product
server.prepend('RemoveProductLineItem', function (req, res, next) {
    var BasketMgr = require('dw/order/BasketMgr');
    var Transaction = require('dw/system/Transaction');
    var currentBasket = BasketMgr.getCurrentBasket();
    var basketCalculationHelpers = require('*/cartridge/scripts/helpers/basketCalculationHelpers');
    var customCartHelpers = require('*/cartridge/scripts/helpers/customCartHelpers');

    Transaction.wrap(function () {
        if (req.querystring.pid && req.querystring.uuid) {
            var productId = req.querystring.pid;
            var productLineItems = currentBasket.getAllProductLineItems(productId); 
            for (var i = 0; i < productLineItems.length; i++) {
                var item = productLineItems[i];
                if (item.custom.giftPid) {
                    var giftProductLineItems = currentBasket.getAllProductLineItems(item.custom.giftPid);
                    for (var i = 0; i < giftProductLineItems.length; i++) {
                        var childGiftitem = giftProductLineItems[i];
                        if (childGiftitem.custom.giftParentUUID == item.UUID) {
                            currentBasket.removeProductLineItem(childGiftitem);
                        }
                    }
                }
            }
            basketCalculationHelpers.calculateTotals(currentBasket);
        }
    });

    var deletedGiftPid = req.querystring.uuid;

    // Custom Start MSS-1935 Gift Box Implementation
    var giftsParentUUID = currentBasket.allProductLineItems.toArray().filter(function(product) {
        return product.UUID == deletedGiftPid;
    });
    customCartHelpers.getGiftTransactionATC(currentBasket, giftsParentUUID);
    // Custom End

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
