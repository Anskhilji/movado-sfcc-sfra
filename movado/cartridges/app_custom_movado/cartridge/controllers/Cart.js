'use strict';

var server = require('server');

var cache = require('*/cartridge/scripts/middleware/cache');

var csrfProtection = require('*/cartridge/scripts/middleware/csrf');
var consentTracking = require('*/cartridge/scripts/middleware/consentTracking');
var collections = require('*/cartridge/scripts/util/collections');
var customCartHelpers = require('*/cartridge/scripts/helpers/customCartHelpers');
var productHelper = require('*/cartridge/scripts/helpers/productHelpers');


var page = module.superModule;
server.extend(page);

// preprend AddProduct for giftBox Check functionality for MVMT
server.prepend('AddProduct', function (req, res, next) {
    var Transaction = require('dw/system/Transaction');
    var BasketMgr = require('dw/order/BasketMgr');
    var currentBasket = BasketMgr.getCurrentBasket();

    if (!empty(req.form.isGiftItem)) {
        var lineItemsIterator = currentBasket.allProductLineItems.iterator();
        var currentLineItemsIterator;
        var parentUUID = req.form.parentPid;
        while (lineItemsIterator.hasNext()) {
            currentLineItemsIterator = lineItemsIterator.next();
            if (currentLineItemsIterator.UUID == parentUUID) {
                Transaction.wrap(function () {
                    currentLineItemsIterator.custom.giftPid = req.form.pid;
                });
                break;
            }
        }
    } 
    next();
});

// Show add to Cart Button as Remote Include
server.get('ShowAddProductButton', 
    server.middleware.include,
    cache.applyDefaultCache,
    function (req, res, next) {
        var Site = require('dw/system/Site');
        var smartGiftHelper = require('*/cartridge/scripts/helper/SmartGiftHelper.js');
        var showProductPageHelperResult = productHelper.showProductPage(req.querystring, req.pageMetaData);
        var smartGift = smartGiftHelper.getSmartGiftCardBasket(showProductPageHelperResult.product.id);
        var smartGiftAddToCartURL = Site.current.preferences.custom.smartGiftURL + showProductPageHelperResult.product.id;
        var productId = req.querystring.pid;
        res.setViewData(smartGift);
        res.render('product/components/addToCartPDP', {
            product: showProductPageHelperResult.product,
            addToCartUrl: showProductPageHelperResult.addToCartUrl,
            productId: productId,
            smartGiftAddToCartURL: smartGiftAddToCartURL
        });

    next();
});

// Added custom code for personalization text for Engraving and Embossing
server.append('AddProduct', csrfProtection.generateToken, function (req, res, next) {
    var BasketMgr = require('dw/order/BasketMgr');
    var ContentMgr = require('dw/content/ContentMgr');
    var CartModel = require('*/cartridge/models/cart');
    var currentBasket = BasketMgr.getCurrentOrNewBasket();
    var Site = require('dw/system/Site');
    var Transaction = require('dw/system/Transaction');
    var basketModel = new CartModel(currentBasket);
    var viewData = res.getViewData();
    var productCustomHelpers = require('*/cartridge/scripts/helpers/productCustomHelpers');
    var basketCalculationHelpers = require('*/cartridge/scripts/helpers/basketCalculationHelpers');
    var cartHelper = require('*/cartridge/scripts/cart/cartHelpers');
    var renderTemplateHelper = require('*/cartridge/scripts/renderTemplateHelper');
    var recommendedProductCardHtml = '';
    var isCartPage = req.form.isCartPage;
    var giftProductCardHtml = '';


    if (!viewData.error) {
		// variables for personalization message
        var embossedMessage = req.form.EmbossedMessage; // message to be Embossed Or Engraved  //'EM\nEngraveMessage';
        var engravedMessage = req.form.EngravedMessage;
        var currentBasket = BasketMgr.getCurrentOrNewBasket();
        var apiProduct;
        var marketingProductsData = [];
        var marketingProductData;

        // Custom logic to add product recommendation
        /*
        Listrak Cartridge check is added because if listrak is enabled this logic is shifted to there
        bcz listrak controller calls first and recommendations were not added in calculations.
        */
        if (!Site.current.preferences.custom.Listrak_Cartridge_Enabled && !empty(req.form.recommendationArray)) {
            var recommendationArray = JSON.parse(req.form.recommendationArray);
            if (recommendationArray.length > 0 ) {
                recommendationArray.forEach(function (recommendation) {

                    Transaction.wrap(function () {
                        quantity = 1;
                        result = cartHelper.addProductToCart(
                                currentBasket,
                                recommendation.pid,
                                recommendation.quantity,
                                [],
                                []
                            );
                        if (!result.error) {
                            cartHelper.ensureAllShipmentsHaveMethods(currentBasket);
                            basketCalculationHelpers.calculateTotals(currentBasket);
                        }
                    });
                });
            }
        }
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
                        if (currentLineItemsIterator.UUID == res.viewData.pliUUID) {
                            currentLineItemsIterator.custom.giftPid = req.form.giftPid;
                        }
                    }

                    var lineItemsIterators = currentBasket.allProductLineItems.iterator();
                    var currentLineItemsIterators;
                    while (lineItemsIterators.hasNext()) {
                        currentLineItemsIterators = lineItemsIterators.next();
                        if (currentLineItemsIterators.UUID == result.uuid) {
                            Transaction.wrap(function () {
                                currentLineItemsIterators.custom.giftParentUUID = res.viewData.pliUUID;
                            });
                            break;
                        }
                    }
                    cartHelper.ensureAllShipmentsHaveMethods(currentBasket);
                    basketCalculationHelpers.calculateTotals(currentBasket);
                }
            });
        }
        // Custom End
        var productLineItems = currentBasket.productLineItems.iterator();
        var productLineItem;
        var quantity;
        if (embossedMessage || engravedMessage) {
            customCartHelpers.updateOptionLineItem(currentBasket, viewData.pliUUID, embossedMessage, engravedMessage);
        }

        // update the success message from content
        var content = ContentMgr.getContent('product-successfully-added');
        if (content) {
            viewData.message = content.custom.body.markup;
        }

        if (!!req.form.currentPage && req.form.currentPage.match('Cart-Show')) {
            viewData.cartPageHtml = customCartHelpers.getcartPageHtml(req);
        }

        if (req.form.isCartRecommendation && !empty(req.form.isCartRecommendation)) {
            basketModel.removeProductLineItemUrl = basketModel.actionUrls.removeProductLineItemUrl;
            basketModel.csrf = viewData.csrf;
            recommendedProductCardHtml = renderTemplateHelper.getRenderedHtml(basketModel, 'cart/productCard/recommendationProductCard');
        }

        var addCartGtmArray = customCartHelpers.createAddtoCartProdObj(currentBasket, viewData.pliUUID, embossedMessage, engravedMessage, req.form);
        viewData.addCartGtmArray = addCartGtmArray;

        if(Site.current.getCustomPreferenceValue('analyticsTrackingEnabled')) {
            var cartAnalyticsTrackingData = {};
            cartAnalyticsTrackingData.cartItems = {};

            if(basketModel.items.length > 0) {
                cartAnalyticsTrackingData = {trackCart: true};
                cartAnalyticsTrackingData.customerEmailOrUniqueNo = customer.isAuthenticated() && customer.getProfile() ? customer.getProfile().getEmail() : '';
                cartAnalyticsTrackingData.cartItems  = customCartHelpers.getCartForAnalyticsTracking(currentBasket);
            }
            res.setViewData({
                cartAnalyticsTrackingData: JSON.stringify(cartAnalyticsTrackingData)
            });
        }

        while (productLineItems.hasNext()) {
            productLineItem = productLineItems.next();
            quantity = productLineItem.getQuantity().value;
            apiProduct = productLineItem.getProduct();
            marketingProductData = productCustomHelpers.getMarketingProducts(apiProduct, quantity)
            if (marketingProductData !== null) {
                marketingProductsData.push(marketingProductData);
            }
        }
        marketingProductsData = JSON.stringify(marketingProductsData);
        res.setViewData({marketingProductData : marketingProductsData});
        if (!session.custom.addToCartPerSession || empty(session.custom.addToCartPerSession)) {
            session.custom.addToCartPerSession = true;
            res.setViewData({addToCartPerSession : true});
        }

        res.setViewData({viewData: viewData});

        var quantityTotal;

        if (currentBasket) {
            quantityTotal = currentBasket.productQuantityTotal;
        } else {
            quantityTotal = 0;
        }

        customCartHelpers.removeNullClydeWarrantyLineItemAndEngraving(currentBasket);

        // Custom Start MSS-1930 Added code for Listrak Cart Tracking
        if (Site.current.preferences.custom.Listrak_Cartridge_Enabled) {
            var ltkSendSca = require('*/cartridge/controllers/ltkSendSca');
            var ltkHelper = require('*/cartridge/scripts/helper/ltkHelper');
            var ltkCartHelper = require('*/cartridge/scripts/helper/ltkCartHelper');
            session.privacy.ltkCountryCode = ltkHelper.getCountryCode(req);
            ltkSendSca.SendSCAPost();
            res.setViewData({
                SCACart: ltkCartHelper.ltkLoadBasket(req),
                listrakCountryCode: session.privacy.ltkCountryCode
            });
        }
        // Custom End

        // Custom Start MSS-1935 Gift Box Implementation
        if (req.form.isGiftItem && req.form.parentPid) {
            var lineItemsIterators = currentBasket.allProductLineItems.iterator();
            var currentLineItemsIterators;
            while (lineItemsIterators.hasNext()) {
                currentLineItemsIterators = lineItemsIterators.next();
                if (currentLineItemsIterators.UUID == res.viewData.pliUUID) {
                    Transaction.wrap(function () {
                        currentLineItemsIterators.custom.giftParentUUID = req.form.parentPid;
                    });
                    break;
                }
            }
        }
        // Custom End

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

        res.setViewData({
            quantityTotal: quantityTotal,
            recommendedProductCardHtml: recommendedProductCardHtml,
            giftProductCardHtml: giftProductCardHtml
        });
    }
    return next();
});

server.post('UpdateOptionProduct',
		server.middleware.https,
		function (req, res, next) {
    var BasketMgr = require('dw/order/BasketMgr');
    var CartModel = require('*/cartridge/models/cart');
    var currentBasket = BasketMgr.getCurrentBasket();
    var cartHelpers = require('*/cartridge/scripts/helpers/customCartHelpers');
    if (currentBasket) {
        cartHelpers.updateOption(currentBasket, req.form.uuid, req.form.selectedOptionID);
    }
    var basketModel = new CartModel(currentBasket);
    res.json(basketModel);
    next();
});

server.post('AddGiftMessage',
		server.middleware.https,
		function (req, res, next) {
    var BasketMgr = require('dw/order/BasketMgr');
    var CartModel = require('*/cartridge/models/cart');
    var currentBasket = BasketMgr.getCurrentBasket();
    var cartHelpers = require('*/cartridge/scripts/helpers/customCartHelpers');
    var result = { error: false };
    var prodUUID = req.form.productUUID;
    var giftMessage = req.form.giftMessage;
    var isValidString = customCartHelpers.validGiftMsgStringXSS(giftMessage);


    if (currentBasket && prodUUID && isValidString) {
        cartHelpers.updateGiftMessaging(currentBasket, prodUUID, giftMessage);
    } else {
        result = { error: true };
    }
    var basketModel = new CartModel(currentBasket);
    res.json({
        basketModel: basketModel,
        result: result
    });
    next();
});

server.post('RemoveGiftMessage',
server.middleware.https,
function (req, res, next) {
    var BasketMgr = require('dw/order/BasketMgr');

    var cartHelpers = require('*/cartridge/scripts/helpers/customCartHelpers');
    var CartModel = require('*/cartridge/models/cart');
            
    var currentBasket = BasketMgr.getCurrentBasket();
    var giftMessage = req.form.giftMessage;
    var prodUUID = req.form.productUUID;
                
    var result = { error: false };
        
    if (currentBasket && prodUUID) {
        cartHelpers.removeGiftMessaging(currentBasket, prodUUID, giftMessage);
    } else {
        result = { error: true };
    }
    var basketModel = new CartModel(currentBasket);
    res.json({
        basketModel: basketModel,
        result: result
    });
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

server.append(
	    'Show',
	    server.middleware.https,
        consentTracking.consent,
        csrfProtection.generateToken,
	    function (req, res, next) {
        res.setViewData({ loggedIn: req.currentCustomer.raw.authenticated });
        var BasketMgr = require('dw/order/BasketMgr');
        var CartModel = require('*/cartridge/models/cart');
        var Site = require('dw/system/Site');

        var aydenExpressPaypalHelper = require('*/cartridge/scripts/helper/aydenExpressPaypalHelper');
        var Constants = require('*/cartridge/scripts/util/Constants');
        var productCustomHelpers = require('*/cartridge/scripts/helpers/productCustomHelpers');
        var productCustomHelper = require('*/cartridge/scripts/helpers/productCustomHelper');
        var currentBasket = BasketMgr.getCurrentOrNewBasket();
        var basketModel = new CartModel(currentBasket);
        var isEswEnabled = !empty(Site.current.getCustomPreferenceValue('eswEshopworldModuleEnabled')) ? Site.current.getCustomPreferenceValue('eswEshopworldModuleEnabled') : false;
        var cartItems = customCartHelpers.removeFromCartGTMObj(currentBasket.productLineItems);
        var wishlistGTMObj = customCartHelpers.getWishlistGtmObj(currentBasket.productLineItems);
        var productLineItems = currentBasket.productLineItems.iterator();
        var currentCountry = productCustomHelper.getCurrentCountry();
        var marketingProductsData = [];

        
        // Custom Start: Adding ESW cartridge integration
        if (isEswEnabled) {
            var eswHelper = require('*/cartridge/scripts/helper/eswHelper').getEswHelper();
            var eswServiceHelper = require('*/cartridge/scripts/helper/serviceHelper');
            var Transaction = require('dw/system/Transaction');
            var basketCalculationHelpers = require('*/cartridge/scripts/helpers/basketCalculationHelpers');
            var session = req.session.raw;

            var viewData = res.getViewData();
            // ESW fail order if order no is set in session
            if (session.privacy.eswfail || (session.privacy.orderNo && !empty(session.privacy.orderNo))) { // eslint-disable-line no-undef
                eswServiceHelper.failOrder();
            }
            var currentBasket = BasketMgr.getCurrentBasket();
            if (currentBasket) {
                Transaction.wrap(function () {
                    if (eswHelper.getShippingServiceType(currentBasket) === 'POST') {
                        eswServiceHelper.applyShippingMethod(currentBasket, 'POST', eswHelper.getAvailableCountry(), true);
                    } else {
                        eswServiceHelper.applyShippingMethod(currentBasket, 'EXP2', eswHelper.getAvailableCountry(), true);
                    }
                    basketCalculationHelpers.calculateTotals(currentBasket);
                });
            }
            res.setViewData(viewData);
            // Custom Start: Adding country switch control
            var countrySwitch = customCartHelpers.getCountrySwitch();

            if (countrySwitch && !empty(countrySwitch)) {
                res.viewData.countrySwitch = countrySwitch;
            }

        }
        // Custom End
        var session = req.session.raw;
        if (currentBasket.custom.storePickUp) {
            session.custom.applePayCheckout = false;
        } else {
            session.custom.StorePickUp = false;
            if (currentCountry == Constants.US_COUNTRY_CODE) {
                session.custom.isEswShippingMethod = false;
            }
        }

        if(Site.current.getCustomPreferenceValue('analyticsTrackingEnabled')) {
            var cartAnalyticsTrackingData;

        	if (basketModel.items.length == 0) {
               cartAnalyticsTrackingData = {clear_cart: true};
               cartAnalyticsTrackingData.customerEmailOrUniqueNo = customer.isAuthenticated() && customer.getProfile() ? customer.getProfile().getEmail() : '';
               cartAnalyticsTrackingData = JSON.stringify(cartAnalyticsTrackingData);
            } else {
                cartAnalyticsTrackingData = {trackCart: true};
                cartAnalyticsTrackingData.cartItems  = customCartHelpers.getCartForAnalyticsTracking(currentBasket);
                cartAnalyticsTrackingData.customerEmailOrUniqueNo = customer.isAuthenticated() && customer.getProfile() ? customer.getProfile().getEmail() : '';
                cartAnalyticsTrackingData = JSON.stringify(cartAnalyticsTrackingData);
            }
            res.setViewData({
                cartAnalyticsTrackingData: cartAnalyticsTrackingData
            });
        }

        while (productLineItems.hasNext()) {
            var productLineItem = productLineItems.next();
            var quantity = productLineItem.getQuantity().value;
            var apiProduct = productLineItem.getProduct();
             //custom : PulseID engraving
             if (Site.current.preferences.custom.enablePulseIdEngraving) {
                var pulseIdAPIHelper = require('*/cartridge/scripts/helpers/pulseIdAPIHelper');
                var setPulseJobID = pulseIdAPIHelper.setOptionalLineItemUUID(viewData, productLineItem);
            }
            // custom end
            marketingProductsData.push(productCustomHelpers.getMarketingProducts(apiProduct, quantity));
        }
        marketingProductsData = JSON.stringify(marketingProductsData);
        res.setViewData({
            wishlistGTMObj: wishlistGTMObj,
            cartItemObj: cartItems,
            marketingProductData : marketingProductsData
        });
        var paypalerrors = aydenExpressPaypalHelper.getPaypalErrors(req.querystring);
        if (!empty(req.querystring.paypalerror)) {
            res.setViewData({ 
                paypalerror: req.querystring.paypalerror,
                paypalerrors: paypalerrors
             });
        }
        res.setViewData({
            paypalButtonImg: customCartHelpers.getContentAssetContent('ca-paypal-button')
        });

        customCartHelpers.removeClydeWarranty(viewData);
        customCartHelpers.removeNullClydeWarrantyLineItemAndEngraving(currentBasket);

        if (!empty(req.querystring.lastNameError)) {
            res.setViewData({ 
                lastNameError: req.querystring.lastNameError
            });
        }

        if (!empty(req.querystring.cartOptionalProductError)) {
            res.setViewData({ 
                cartOptionalProductError: req.querystring.cartOptionalProductError
            });
        }

        var FolderSearch = require('*/cartridge/models/search/folderSearch');
        var pageMetaHelper = require('*/cartridge/scripts/helpers/pageMetaHelper');
        var searchCustomHelpers = require('*/cartridge/scripts/helpers/searchCustomHelper');
        var folderSearch = searchCustomHelpers.setupContentFolderSearch('root');
        var contentObj = {
        		pageTitle: folderSearch.folder.pageTitle,
        		pageDescription: folderSearch.folder.pageDescription,
        		pageKeywords: folderSearch.folder.pageKeywords };

        pageMetaHelper.setPageMetaData(req.pageMetaData, contentObj);

	        next();
	    }
	);

server.replace(
	'AddCoupon',
	server.middleware.https,
	csrfProtection.validateAjaxRequest,
	function (req, res, next) {
        var BasketMgr = require('dw/order/BasketMgr');
        var Resource = require('dw/web/Resource');
        var Transaction = require('dw/system/Transaction');
        var URLUtils = require('dw/web/URLUtils');
        var CartModel = require('*/cartridge/models/cart');
        var basketCalculationHelpers = require('*/cartridge/scripts/helpers/basketCalculationHelpers');
        var Site = require('dw/system/Site');

        var currentBasket = BasketMgr.getCurrentBasket();

        if (!currentBasket) {
            res.setStatusCode(500);
            res.json({
                error: true,
                redirectUrl: URLUtils.url('Cart-Show').toString()
            });

            return next();
        }

        if (!currentBasket) {
            res.setStatusCode(500);
            res.json({ errorMessage: Resource.msg('error.add.coupon', 'cart', null) });
            return next();
        }

        var error = false;
        var errorMessage;

        try {
            Transaction.wrap(function () {
                return currentBasket.createCouponLineItem(req.querystring.couponCode, true);
            });
        } catch (e) {
            error = true;
            // Custom Start: if custom preference 'couponErrorMessages' in strofront group is not empty and have promotion error messages json 
            var couponErrorMessages = !empty(Site.current.preferences.custom.couponErrorMessages) ? Site.current.preferences.custom.couponErrorMessages : false;

            if (couponErrorMessages) {
                var errorCodes = JSON.parse(couponErrorMessages);
                var localeErrorCodes = errorCodes[req.locale.id] || errorCodes['default'];
                var errorMessage = localeErrorCodes[e.errorCode] || localeErrorCodes.DEFAULT;
                // Custom End
            } else {
                var errorCodes = {
                    COUPON_CODE_ALREADY_IN_BASKET: 'error.coupon.already.in.cart',
                    COUPON_ALREADY_IN_BASKET: 'error.coupon.cannot.be.combined',
                    COUPON_CODE_ALREADY_REDEEMED: 'error.coupon.already.redeemed',
                    COUPON_CODE_UNKNOWN: 'error.unable.to.add.coupon',
                    COUPON_DISABLED: 'error.unable.to.add.coupon',
                    REDEMPTION_LIMIT_EXCEEDED: 'error.unable.to.add.coupon',
                    TIMEFRAME_REDEMPTION_LIMIT_EXCEEDED: 'error.unable.to.add.coupon',
                    NO_ACTIVE_PROMOTION: 'error.unable.to.add.coupon',
                    default: 'error.unable.to.add.coupon'
                };
    
                var errorMessageKey = errorCodes[e.errorCode] || errorCodes.default;
                errorMessage = Resource.msg(errorMessageKey, 'cart', null);
            }
        }

        if (error) {
            res.json({
                error: error,
                errorMessage: errorMessage
            });
            return next();
        }
        
        Transaction.wrap(function () {
            basketCalculationHelpers.calculateTotals(currentBasket);
        });

        var basketModel = new CartModel(currentBasket);

        res.json(basketModel);
        return next();
    }
);

server.append(
	'AddCoupon',
	server.middleware.https,
	csrfProtection.validateAjaxRequest,
	function (req, res, next) {
    var BasketMgr = require('dw/order/BasketMgr');
    var CartModel = require('*/cartridge/models/cart');

    var basketModel = new CartModel(BasketMgr.getCurrentBasket());
    res.setViewData({
        couponLineItems: BasketMgr.currentBasket.couponLineItems,
        couponLineItemsLength : BasketMgr.currentBasket.couponLineItems.length,
    });
    res.json(basketModel);
    next();
});

/**
 * Function adds product to cart and show the cart page to user
 * when clicking on add to bag button from PDP share emails.
 */
server.get(
	'AddProductFromEmail',
	server.middleware.https,
	function (req, res, next) {
    var Transaction = require('dw/system/Transaction');
    var URLUtils = require('dw/web/URLUtils');
    var BasketMgr = require('dw/order/BasketMgr');
    var currentBasket = BasketMgr.getCurrentOrNewBasket();
    var cartHelper = require('*/cartridge/scripts/cart/cartHelpers');
    var basketCalculationHelpers = require('*/cartridge/scripts/helpers/basketCalculationHelpers');
    var previousBonusDiscountLineItems = currentBasket.getBonusDiscountLineItems();
    var productId = req.querystring.pid;
    var childProducts = [];
    var options = [];
    var quantity;
    var result;

    if (currentBasket) {
        Transaction.wrap(function () {
            quantity = 1;
            result = cartHelper.addProductToCart(
					currentBasket,
					productId,
					quantity,
					childProducts,
					options
				);
            if (!result.error) {
                cartHelper.ensureAllShipmentsHaveMethods(currentBasket);
                basketCalculationHelpers.calculateTotals(currentBasket);
            }
        });
    }
    var urlObject = {
        url: URLUtils.url('Cart-ChooseBonusProducts').toString(),
        configureProductstUrl: URLUtils.url('Product-ShowBonusProducts').toString(),
        addToCartUrl: URLUtils.url('Cart-AddBonusProducts').toString()
    };
    var newBonusDiscountLineItem =
			cartHelper.getNewBonusDiscountLineItem(
				currentBasket,
				previousBonusDiscountLineItems,
				urlObject,
				result.uuid
		);
    if (newBonusDiscountLineItem) {
        var allLineItems = currentBasket.allProductLineItems;
        collections.forEach(allLineItems, function (pli) {
            if (pli.UUID === result.uuid) {
                Transaction.wrap(function () {
                    pli.custom.bonusProductLineItemUUID = 'bonus'; // eslint-disable-line no-param-reassign
                    pli.custom.preOrderUUID = pli.UUID; // eslint-disable-line no-param-reassign
                });
            }
        });
    }
    res.redirect(URLUtils.https('Cart-Show'));
    next();
}
);

server.prepend('RemoveProductLineItem', function (req, res, next) {
    var BasketMgr = require('dw/order/BasketMgr');
    var currentBasket = BasketMgr.getCurrentOrNewBasket();
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
    var customCartHelpers = require('*/cartridge/scripts/helpers/customCartHelpers');
    var ArrayList = require('dw/util/ArrayList');
    var BasketMgr = require('dw/order/BasketMgr');
    var currentBasket = BasketMgr.getCurrentOrNewBasket();
    var emptyCartDom;
    var Site = require('dw/system/Site');
    var Transaction = require('dw/system/Transaction');
    var isKlarnaCartPromoEnabled = Site.current.getCustomPreferenceValue('klarnaCartPromoMsg');

    emptyCartDom = customCartHelpers.getCartAssets();

    if (currentBasket.productLineItems.length === 0) {

        if (currentBasket.custom.storePickUp) {
            Transaction.wrap(function () {
                currentBasket.custom.storePickUp = false;
            });
        }
        
    	var cartAnalyticsTrackingData;
        if(Site.current.getCustomPreferenceValue('analyticsTrackingEnabled')) {
            cartAnalyticsTrackingData = {
                clear_cart: true,
                email : (customer.isAnonymous() ? '' : customer.getProfile().getEmail())
            };
            res.setViewData({cartAnalyticsTrackingData: JSON.stringify(cartAnalyticsTrackingData)});
        }
        res.setViewData({emptyCartDom: emptyCartDom.markup});
    } else {
        if(Site.current.getCustomPreferenceValue('analyticsTrackingEnabled')) {
            var cartAnalyticsTrackingData = {};
            cartAnalyticsTrackingData = {trackCart: true};
            cartAnalyticsTrackingData.customerEmailOrUniqueNo = customer.isAuthenticated() && customer.getProfile() ? customer.getProfile().getEmail() : '';
            cartAnalyticsTrackingData.cartItems  = customCartHelpers.getCartForAnalyticsTracking(currentBasket);
            res.setViewData({
                cartAnalyticsTrackingData: JSON.stringify(cartAnalyticsTrackingData)
            });
        }
        res.setViewData({emptyCartDom: emptyCartDom});
    }

    res.setViewData({isKlarnaCartPromoEnabled: isKlarnaCartPromoEnabled});
	 next();
});

server.append('MiniCartShow', function(req, res, next){
    var BasketMgr = require('dw/order/BasketMgr');
    var CartModel = require('*/cartridge/models/cart');
    var currentBasket = BasketMgr.getCurrentOrNewBasket();
    var Site = require('dw/system/Site');
    
    var basketModel = new CartModel(currentBasket);
    // Custom Start: Adding ESW country switch control
    var isEswEnabled = !empty(Site.current.preferences.custom.eswEshopworldModuleEnabled) ? Site.current.preferences.custom.eswEshopworldModuleEnabled : false;
    
    if (isEswEnabled) {
        var countrySwitch = customCartHelpers.getCountrySwitch();
        if (countrySwitch && !empty(countrySwitch)) {
            res.viewData.countrySwitch = countrySwitch;
        }    
    }
    // Custom End
    
    if(Site.current.getCustomPreferenceValue('analyticsTrackingEnabled')) {
    	var cartAnalyticsTrackingData;
    	if(basketModel.items.length > 0) {
            var analyticsTrackingLineItems = [];
            for (var i = 0; i < basketModel.items.length; i++) {
                analyticsTrackingLineItems.push ({
                    item:  basketModel.items[i].id,
                    quantity: basketModel.items[i].quantity,
                    price: basketModel.items[i].price.sales.decimalPrice,
                    unique_id: basketModel.items[i].id
                });
            }
            cartAnalyticsTrackingData = {trackCart: true};
            cartAnalyticsTrackingData.trackCart  = analyticsTrackingLineItems;
            cartAnalyticsTrackingData.customerEmailOrUniqueNo = customer.isAuthenticated() && customer.getProfile() ? customer.getProfile().getEmail() : '';
        } else {
            cartAnalyticsTrackingData = {clear_cart: true};
            cartAnalyticsTrackingData.customerEmailOrUniqueNo = customer.isAuthenticated() && customer.getProfile() ? customer.getProfile().getEmail() : '';
        }
        res.setViewData({cartAnalyticsTrackingData: JSON.stringify(cartAnalyticsTrackingData)});
    }
    
    next();
});

server.append(
	'RemoveCouponLineItem',
	function (req, res, next) {
    var BasketMgr = require('dw/order/BasketMgr');
    res.setViewData({
        couponLineItems: BasketMgr.currentBasket.couponLineItems,
        couponLineItemsLength : BasketMgr.currentBasket.couponLineItems.length,
    });
    next();
});

server.post('RemoveClydeProduct', function (req, res, next) {
    var BasketMgr = require('dw/order/BasketMgr');
    var CartModel = require('*/cartridge/models/cart');
    var basketCalculationHelpers = require('*/cartridge/scripts/helpers/basketCalculationHelpers');
    var currentBasket = BasketMgr.getCurrentBasket();
    var productLineItem = null;
    var basketModel = null;
    var optionProductLineItem = null;
    var lineItems = currentBasket.productLineItems.iterator();
    var productUUID = req.querystring.uuid;
    while (lineItems.hasNext()) {
        var item = lineItems.next();
        if (item.UUID === productUUID) {
            productLineItem = item;
            break;
        }
    }
    if (productLineItem) {
        var optionLineItems = productLineItem.optionProductLineItems.iterator();
        var Transaction = require('dw/system/Transaction');
        Transaction.wrap(function () {
            while (optionLineItems.hasNext()) {
                var optionLineItem = optionLineItems.next();
                if (optionLineItem) {
                    optionProductLineItem = optionLineItem;
                    currentBasket.removeProductLineItem(optionProductLineItem);
                    basketCalculationHelpers.calculateTotals(currentBasket);
                    break;
                }
            }
        });
        basketModel = new CartModel(currentBasket);
    } res.json({
        success: optionProductLineItem || false,
        deleteUuid: productUUID,
        basket: basketModel
    });
    next();
});

module.exports = server.exports();
