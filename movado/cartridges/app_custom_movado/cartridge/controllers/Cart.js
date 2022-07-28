'use strict';

var server = require('server');

var csrfProtection = require('*/cartridge/scripts/middleware/csrf');
var consentTracking = require('*/cartridge/scripts/middleware/consentTracking');
var collections = require('*/cartridge/scripts/util/collections');
var customCartHelpers = require('*/cartridge/scripts/helpers/customCartHelpers');

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
        var parentPid = req.form.parentPid;
        while (lineItemsIterator.hasNext()) {
            currentLineItemsIterator = lineItemsIterator.next();
            if (currentLineItemsIterator.productID == parentPid) {
                Transaction.wrap(function () {
                    currentLineItemsIterator.custom.giftPid = req.form.pid;
                });
                break;
            }
        }
    }
    next();
});
// Added custom code for personalization text for Engraving and Embossing
server.append('AddProduct', function (req, res, next) {
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
                    var parentPid = req.form.pid;

                    while (lineItemsIterator.hasNext()) {
                        currentLineItemsIterator = lineItemsIterator.next();
                        if (currentLineItemsIterator.productID == parentPid) {
                            currentLineItemsIterator.custom.giftPid = req.form.giftPid;
                            break;
                        }
                    }
                    cartHelper.ensureAllShipmentsHaveMethods(currentBasket);
                    basketCalculationHelpers.calculateTotals(currentBasket);
                }
            });
        }
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
            recommendedProductCardHtml = renderTemplateHelper.getRenderedHtml(basketModel, 'cart/productCard/recommendationProductCard');
        }

        if (req.form.isGiftItem && !empty(req.form.isGiftItem)) {
            basketModel.removeProductLineItemUrl = basketModel.actionUrls.removeProductLineItemUrl;
            var template = isCartPage ? 'cart/productCard/cartGiftProductCard' : 'cart/productCard/miniCartGiftProductCard';
            giftProductCardHtml = renderTemplateHelper.getRenderedHtml(basketModel, template);
        }

        var addCartGtmArray = customCartHelpers.createAddtoCartProdObj(currentBasket, viewData.pliUUID, embossedMessage, engravedMessage);
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

        customCartHelpers.removeNullClydeLineItem(currentBasket);
        
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
        var currentBasket = BasketMgr.getCurrentOrNewBasket();
        var basketModel = new CartModel(currentBasket);
        var cartItems = customCartHelpers.removeFromCartGTMObj(currentBasket.productLineItems);
        var productCustomHelpers = require('*/cartridge/scripts/helpers/productCustomHelpers');
        var wishlistGTMObj = customCartHelpers.getWishlistGtmObj(currentBasket.productLineItems);
        var isEswEnabled = !empty(Site.current.getCustomPreferenceValue('eswEshopworldModuleEnabled')) ? Site.current.getCustomPreferenceValue('eswEshopworldModuleEnabled') : false;
        var productLineItems = currentBasket.productLineItems.iterator();
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

        customCartHelpers.removeNullClydeLineItem(currentBasket);

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

server.append(
	'AddCoupon',
	server.middleware.https,
	csrfProtection.validateAjaxRequest,
	function (req, res, next) {
    var BasketMgr = require('dw/order/BasketMgr');
    var CartModel = require('*/cartridge/models/cart');

    var basketModel = new CartModel(BasketMgr.getCurrentBasket());
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

server.append('RemoveProductLineItem', function (req, res, next) {
    var customCartHelpers = require('*/cartridge/scripts/helpers/customCartHelpers');
    var BasketMgr = require('dw/order/BasketMgr');
    var currentBasket = BasketMgr.getCurrentOrNewBasket();
    var emptyCartDom;
    var Site = require('dw/system/Site');
    var isKlarnaCartPromoEnabled = Site.current.getCustomPreferenceValue('klarnaCartPromoMsg');

    emptyCartDom = customCartHelpers.getCartAssets();

    if (currentBasket.productLineItems.length === 0) {
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

module.exports = server.exports();
