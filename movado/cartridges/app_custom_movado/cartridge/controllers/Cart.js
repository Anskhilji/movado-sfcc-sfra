'use strict';

var server = require('server');

var csrfProtection = require('*/cartridge/scripts/middleware/csrf');
var consentTracking = require('*/cartridge/scripts/middleware/consentTracking');
var collections = require('*/cartridge/scripts/util/collections');
var customCartHelpers = require('*/cartridge/scripts/helpers/customCartHelpers');

var page = module.superModule;
server.extend(page);

// Added custom code for personalization text for Engraving and Embossing
server.append('AddProduct', function (req, res, next) {
    var BasketMgr = require('dw/order/BasketMgr');
    var ContentMgr = require('dw/content/ContentMgr');
    var CartModel = require('*/cartridge/models/cart');
    var currentBasket = BasketMgr.getCurrentOrNewBasket();
    var Site = require('dw/system/Site');
    var basketModel = new CartModel(currentBasket);
    var viewData = res.getViewData();

    if (!viewData.error) {
		// variables for personalization message
        var embossedMessage = req.form.EmbossedMessage; // message to be Embossed Or Engraved  //'EM\nEngraveMessage';
        var engravedMessage = req.form.EngravedMessage;
        var currentBasket = BasketMgr.getCurrentOrNewBasket();
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

        var addCartGtmArray = customCartHelpers.createAddtoCartProdObj(currentBasket, viewData.pliUUID, embossedMessage, engravedMessage);
        viewData.addCartGtmArray = addCartGtmArray;

        if(Site.current.getCustomPreferenceValue('analyticsTrackingEnabled')) {
            var cartAnalyticsTrackingData = {};
        	cartAnalyticsTrackingData.customerEmailOrUniqueNo = customer.isAuthenticated() && customer.getProfile() ? customer.getProfile().getEmail() : '';
            cartAnalyticsTrackingData.cartItems = {};

            if(basketModel.items.length > 0) {
                cartAnalyticsTrackingData = {trackCart: true};
                cartAnalyticsTrackingData.cartItems  = customCartHelpers.getCartForAnalyticsTracking(currentBasket);
            }
            res.setViewData({
                cartAnalyticsTrackingData: JSON.stringify(cartAnalyticsTrackingData)
            });
        }
        res.setViewData({viewData: viewData});
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
        var currentBasket = BasketMgr.getCurrentOrNewBasket();
        var basketModel = new CartModel(currentBasket);
        var cartItems = customCartHelpers.removeFromCartGTMObj(currentBasket.productLineItems);
        var wishlistGTMObj = customCartHelpers.getWishlistGtmObj(currentBasket.productLineItems);

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

        res.setViewData({
            wishlistGTMObj: wishlistGTMObj,
        	cartItemObj: cartItems
        });

        if (req.querystring.paypalerror) {
        	res.setViewData({ paypalerror: true });
        }

        res.setViewData({
            paypalButtonImg: customCartHelpers.getContentAssetContent('ca-paypal-button')
        });

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
