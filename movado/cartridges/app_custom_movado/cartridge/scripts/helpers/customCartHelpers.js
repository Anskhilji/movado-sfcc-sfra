'use strict';

var ProductLineItem = require('dw/order/ProductLineItem');
var productFactory = require('*/cartridge/scripts/factories/product');
var Transaction = require('dw/system/Transaction');
var collections = require('*/cartridge/scripts/util/collections');
var EMBOSSED = 'Embossed';
var ENGRAVED = 'Engraved';
var NEWLINE = '\n';
var GIFTWRAPPED = 'GiftWrapped';
var Resource = require('dw/web/Resource');

/**
 * Code to populate personalization message in the ProductLineItem
 * @param basket
 * @param productId
 * @param result
 * @param text
 * @param persoonalizationtype
 * @returns
 */
function updateOptionLineItem(lineItemCtnr, productUUID, embossedMessage, engravedMessage) {
    collections.forEach(lineItemCtnr.productLineItems, function (pli) {
        if (pli.UUID == productUUID) {
            if (pli.optionProductLineItems) {
                collections.forEach(pli.optionProductLineItems, function (option) {
                    Transaction.wrap(function () {
                        if (option.optionID == EMBOSSED && embossedMessage) {
                            pli.custom.embossMessageLine1 = embossedMessage.toUpperCase();
                        } else if (option.optionID == ENGRAVED && engravedMessage) {
								// code to split the message based on newline character
                        	engravedMessage = engravedMessage.split(NEWLINE);
                            pli.custom.engraveMessageLine1 = engravedMessage[0];
                            if (engravedMessage[1]) {
                                pli.custom.engraveMessageLine2 = engravedMessage[1];
                            }
                        }
                    });
                });
            }
        }
	 });
}

/**
 * function updates gift option values in productline items
 * @param  {dw.order.Basket} basket
 * @param  {string} uuid
 * @param  {string} selectedOptionID
 */
function updateOption(basket, uuid, selectedOptionID){
    var Transaction = require('dw/system/Transaction');
    var basketCalculationHelpers = require('*/cartridge/scripts/helpers/basketCalculationHelpers');

    var currentBasket = basket;
    var allLineItems = currentBasket.allLineItems;

    Transaction.wrap(function(){
        for each(var lineItem in allLineItems){
            if(lineItem.UUID === uuid){
                var giftWrapOptionModel = lineItem.parent.optionModel;
                var giftWrapOption = giftWrapOptionModel.getOption(GIFTWRAPPED);
                var giftWrapOptionValue = giftWrapOptionModel.getOptionValue(giftWrapOption, selectedOptionID)
                lineItem.updateOptionValue(giftWrapOptionValue);
                if(selectedOptionID === 0){
                    lineItem.parent.custom.giftWrapOption = "";
                    lineItem.parent.custom.giftBoxSKU = "";
                    lineItem.parent.custom.isGiftWrapped = false;
                }else{
                    lineItem.parent.custom.giftWrapOption = giftWrapOptionValue.displayValue;
                    lineItem.parent.custom.giftBoxSKU = giftWrapOptionValue.productIDModifier;
                    lineItem.parent.custom.isGiftWrapped = true;
                }
                lineItem.updateOptionPrice();
            }
        }
        basketCalculationHelpers.calculateTotals(currentBasket);
    });
}
/**
 * Code to update gidt messaging changes on cart in product line items
 * @param  {dw.order.Basket} currentBasket
 * @param  {String} prodUUID
 * @param  {String} giftMsg
 */
function updateGiftMessaging(currentBasket, prodUUID, giftMsg){
    var Transaction = require('dw/system/Transaction');
    var prodLineItems = currentBasket.productLineItems;
    Transaction.wrap(function(){
        for each(var lineItem in prodLineItems){
            if(lineItem.UUID === prodUUID){
                lineItem.custom.GiftWrapMessage = giftMsg ? giftMsg : '';
            }
        }
    });
}



/**
 * return the title texts to be added if cart is empty
 * @returns [List] assets
 */
function getCartAssets(){

	var ContentMgr = require('dw/content/ContentMgr');
	var emptyCartDom;

	var emptyCartContent  = ContentMgr.getContent('ca-empty-cart');
	if(emptyCartContent && emptyCartContent.custom && emptyCartContent.custom.body) {
		emptyCartDom = emptyCartContent.custom.body;
	}

	return emptyCartDom;
}

function createAddtoCartProdObj(lineItemCtnr, productUUID, embossedMessage, engravedMessage){
	var productGtmArray={};
	var variant;
	collections.forEach(lineItemCtnr.productLineItems, function (pli) {

        if (pli.UUID == productUUID) {
            var productID = pli.product.ID;
            var productModel = productFactory.get({pid: productID});
            var productPrice = productModel.price && productModel.price.sales ? productModel.price.sales.decimalPrice : (productModel.price && productModel.price.list ? productModel.price.list.decimalPrice : '');

            variant=getProductOptions(embossedMessage,engravedMessage)
                    productGtmArray={
                        "id" : productID,
                        "name" : pli.product.name,
                        "brand" : pli.product.brand,
                        "category" : pli.product.variant && pli.product.masterProduct.primaryCategory ? pli.product.masterProduct.primaryCategory.ID
                                : pli.product.primaryCategory.ID,
                        "variant" : variant,
                        "price" : productPrice,
                        "currency" : pli.product.priceModel.price.currencyCode,
                        "list" : Resource.msg('gtm.list.pdp.value','cart',null)
                    };
                }
        });

        return productGtmArray;
}

function createAddtoCartAnalyticsTrackingArray(lineItemCtnr, productUUID, embossedMessage, engravedMessage){
	var productDetail={};
	var analyticsTrackingCartItems = [];
	var variant;
	collections.forEach(lineItemCtnr.productLineItems, function (pli) {

        if (pli.UUID == productUUID) {
            var productID = pli.product.ID;
            var productModel = productFactory.get({pid: productID});
            var productPrice = productModel.price && productModel.price.sales ? productModel.price.sales.decimalPrice : (productModel.price && productModel.price.list ? productModel.price.list.decimalPrice : '');
            variant=getProductOptions(embossedMessage,engravedMessage)
                    productDetail={
                        item : productID,
                        quantity: pli.quantity.decimalValue.toString(),
                        price : productPrice,
                        unique_id: productID
                    };
            		analyticsTrackingCartItems.push(productDetail);
                }
        });

        return analyticsTrackingCartItems;
}

function removeFromCartGTMObj(productLineItems){

	var cartItemObj =[];
	var variant='';
	 collections.forEach(productLineItems, function (pli) {
		variant  =getProductOptions(pli.custom.embossMessageLine1,pli.custom.engraveMessageLine1)

     	cartItemObj.push({
     		'id':pli.product.ID,
     		'name':pli.product.name,
     		'brand':pli.product.brand,
     		'category':(pli.product.variant && pli.product.masterProduct.primaryCategory)? pli.product.masterProduct.primaryCategory.displayName : pli.product.primaryCategory.displayName,
     		'variant':variant,
     		'price':pli.priceValue
     		});
     	});
	 return cartItemObj;

}

function getProductOptions(embossedMessage,engravedMessage){
	var variant;
	if (embossedMessage!= undefined && engravedMessage != undefined) {
		variant = EMBOSSED +','+ENGRAVED ;
    } else if (engravedMessage != undefined) {
    	variant = ENGRAVED;
    }
    else if (embossedMessage != undefined) {
    	variant = EMBOSSED;
    }else{
    	variant = '';
    }
	return variant;
}
/**
 *
 * @param productIds
 * @returns wishlistGtmObj
 */
function getWishlistGtmObj(productLineItems) {
	var wishlistGtmObj = [];
	collections.forEach(productLineItems, function (pli) {
		wishlistGtmObj.push({
			"event" : "dataTrack",
			"eventCategory" : "Wishlist Add",
			"eventAction" : request.httpURL,
			"eventLabel" : pli.product.name + "|" + pli.product.ID
			});
	});

	return wishlistGtmObj;
}

/**
 *  validation ForCrossSiteScriptCharacters
 * @param message
 * @returns
 */
function validStringXSS(message){
	var regex = new RegExp("^[A-Za-z0-9\\.\\?\\!\\,\\;\\:\\-\\(\\)\\'\\*\\&\\$\\\"\\\n]+$",'i');
	var results=false;
	if(message){
		results = regex.test(message);
	}
	return results;
}

/**
 *  validation ForCrossSiteScriptCharacters
 * @param message
 * @returns
 */
function validGiftMsgStringXSS(message){
	var regex = new RegExp("^[A-Za-z0-9\\.\\?\\!\\,\\;\\:\\-\\(\\)\\'\\*\\&\\$\\\"\\\s\n]+$",'i');
	var results=false;
	if(message){
		results = regex.test(message);
	}
	return results;
}

function getContentAssetContent (caId) {
  var ContentMgr = require('dw/content/ContentMgr');
  var apiContent = ContentMgr.getContent(caId);
  return (apiContent && apiContent.custom && apiContent.custom.body) ? apiContent.custom.body : '';
};

function getcartPageHtml (req) {
  var BasketMgr = require('dw/order/BasketMgr');
  var CartModel = require('*/cartridge/models/cart');
  var csrfProtectionClass = require('dw/web/CSRFProtection');
  var renderTemplateHelper = require('*/cartridge/scripts/renderTemplateHelper');
  var currentBasket = BasketMgr.getCurrentOrNewBasket();
  var basketModel = new CartModel(currentBasket);
  var cartItemObj = removeFromCartGTMObj(currentBasket.productLineItems);
  var wishlistGTMObj = getWishlistGtmObj(currentBasket.productLineItems);

  basketModel.loggedIn = req.currentCustomer.raw.authenticated;
  basketModel.cartItemObj = cartItemObj;
  basketModel.wishlistGTMObj = wishlistGTMObj;
  basketModel.csrf = {
    tokenName: csrfProtectionClass.getTokenName(),
    token: csrfProtectionClass.generateToken()
  };
  basketModel.paypalButtonImg = getContentAssetContent('ca-paypal-button');
  basketModel.paypalerror = !!req.querystring.paypalerror;

  return renderTemplateHelper.getRenderedHtml(basketModel, '/cart/cartSection');
};

module.exports = {
    updateOptionLineItem: updateOptionLineItem,
    updateOption: updateOption,
    updateGiftMessaging: updateGiftMessaging,
    getCartAssets:getCartAssets,
    createAddtoCartProdObj:createAddtoCartProdObj,
    removeFromCartGTMObj:removeFromCartGTMObj,
    getWishlistGtmObj:getWishlistGtmObj,
    validStringXSS:validStringXSS,
    validGiftMsgStringXSS:validGiftMsgStringXSS,
    getContentAssetContent: getContentAssetContent,
    getcartPageHtml: getcartPageHtml,
    createAddtoCartAnalyticsTrackingArray: createAddtoCartAnalyticsTrackingArray
};

