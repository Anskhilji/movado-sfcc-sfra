'use strict';

var ProductLineItem = require('dw/order/ProductLineItem');
var Logger = require('dw/system/Logger');
var productFactory = require('*/cartridge/scripts/factories/product');
var Site = require('dw/system/Site');
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
 * Code to remove gift messaging  on cart in product line items
 * @param  {dw.order.Basket} currentBasket
 * @param  {String} prodUUID
 * @param  {String} giftMsg
 */
 function removeGiftMessaging (currentBasket, prodUUID, giftMsg) {
    var Transaction = require('dw/system/Transaction');
    
    var prodLineItems = currentBasket.productLineItems;

    Transaction.wrap(function() {
        for each (var lineItem in prodLineItems) {
            if (lineItem.UUID === prodUUID) {
                lineItem.custom.GiftWrapMessage = '';
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
    var productGtmArray = {};
    var variant;
    var searchCustomHelper = require('*/cartridge/scripts/helpers/searchCustomHelper');
    collections.forEach(lineItemCtnr.productLineItems, function (pli) {

        if (pli.UUID == productUUID) {
            var productID = pli.product.ID;
            var productPrice;
            
            if (!empty(pli.basePrice) && !empty(pli.adjustedPrice)) {
                if (!empty(pli.basePrice.decimalValue) && !empty(pli.adjustedPrice.decimalValue)) {
                    if (pli.basePrice.decimalValue !== pli.adjustedPrice.decimalValue) {
                        productPrice = pli.adjustedPrice && pli.adjustedPrice.decimalValue ? pli.adjustedPrice.decimalValue.toString() : '0.0';
                    } else {
                        productPrice = pli.basePrice && pli.basePrice.decimalValue ? pli.basePrice.decimalValue.toString() : '0.0';
                    }
                }
            }
            
            var category = pli.product && pli.product.primaryCategory
            ? pli.product.primaryCategory
            : '';
            var categoryHierarchy = searchCustomHelper.getCategoryBreadcrumb(category);
            var primarySiteSection = escapeQuotes(categoryHierarchy.primaryCategory);
            var secoundarySiteSection = escapeQuotes(categoryHierarchy.secondaryCategory);
            secoundarySiteSection = !empty(secoundarySiteSection) ? '|' + secoundarySiteSection : '';

            variant=getProductOptions(embossedMessage,engravedMessage)
                    productGtmArray={
                        "id" : productID,
                        "name" : pli.product.name,
                        "brand" : pli.product.brand,
                        "category" : pli.product.variant && pli.product.masterProduct.primaryCategory ? pli.product.masterProduct.primaryCategory.ID
                                : (pli.product.primaryCategory ? pli.product.primaryCategory.ID : ''),
                        "variant" : variant,
                        "price" : productPrice,
                        "currency" : pli.product.priceModel.price.currencyCode,
                        "quantity" : pli.quantity && pli.quantity.value ? pli.quantity.value: pli.quantity,
                        "deparmentIncludedCategoryName": !empty(primarySiteSection) && !empty(secoundarySiteSection) ? primarySiteSection + secoundarySiteSection : '',
                        "discountPrice": pli.basePrice.value - pli.adjustedGrossPrice.value > 0 ? pli.adjustedGrossPrice.value: '',
                        "list" : Resource.msg('gtm.list.pdp.value','cart',null)
                    };
                }
        });

        return productGtmArray;
}

function getCartForAnalyticsTracking(lineItemCtnr){
	var productDetail={};
	var analyticsTrackingCartItems = [];
	collections.forEach(lineItemCtnr.productLineItems, function (pli) {
            var productID = pli.product.ID;
            var quantity = pli.quantity.decimalValue ? pli.quantity.decimalValue.toString() : '0.0';
            var productPrice;

            if (!empty(pli.basePrice) && !empty(pli.adjustedPrice)) {
                if (!empty(pli.basePrice.decimalValue) && !empty(pli.adjustedPrice.decimalValue)) {
                    if (pli.basePrice.decimalValue !== pli.adjustedPrice.decimalValue) {
                        productPrice = pli.adjustedPrice && pli.adjustedPrice.decimalValue ? pli.adjustedPrice.decimalValue.toString() : '0.0';
                    } else {
                        productPrice = pli.basePrice && pli.basePrice.decimalValue ? pli.basePrice.decimalValue.toString() : '0.0';
                    }
                }
            }

            productDetail = {
                item : productID,
                quantity: quantity,
                price : productPrice,
                unique_id: productID
            };
            analyticsTrackingCartItems.push(productDetail);
        });

        return analyticsTrackingCartItems;
}

function removeFromCartGTMObj(productLineItems){

	var cartItemObj =[];
	var variant='';
	 collections.forEach(productLineItems, function (pli) {
		variant = getProductOptions(pli.custom.embossMessageLine1,pli.custom.engraveMessageLine1);
		var price;

        if (!empty(pli.basePrice) && !empty(pli.adjustedPrice)) {
            if (!empty(pli.basePrice.decimalValue) && !empty(pli.adjustedPrice.decimalValue)) {
                if (pli.basePrice.decimalValue !== pli.adjustedPrice.decimalValue) {
                    price = pli.adjustedPrice && pli.adjustedPrice.decimalValue ? pli.adjustedPrice.decimalValue.toString() : '0.0';
                } else {
                    price = pli.basePrice && pli.basePrice.decimalValue ? pli.basePrice.decimalValue.toString() : '0.0';
                }
            }
        }

     	cartItemObj.push({
     		'id':pli.product.ID,
     		'name':pli.product.name,
     		'brand':pli.product.brand,
     		'category':(pli.product.variant && pli.product.masterProduct.primaryCategory)? pli.product.masterProduct.primaryCategory.displayName : (pli.product.primaryCategory ? pli.product.primaryCategory.displayName : ''),
     		'variant':variant,
     		'price': price
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
    try {
        collections.forEach(productLineItems, function (pli) {
            wishlistGtmObj.push({
                "event" : "dataTrack",
                "eventCategory" : "Wishlist Add",
                "eventAction" : request.httpURL,
                "eventLabel" : pli.product.name + "|" + pli.product.ID
                });
        });
    
    } catch (ex) {
        Logger.error('(customCartHelpers~getWishlistGtmObj) -> Error occurred while generating whishlist impress and errror is:{0} at line: {1} in file {2}', ex.toString(), ex.lineNumber, ex.fileName);
    }

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
  basketModel.lastNameError = req.querystring.lastNameError;

  return renderTemplateHelper.getRenderedHtml(basketModel, '/cart/cartSection');
};

function getCountrySwitch() {
    
    var Logger = require('dw/system/Logger');

    var isEswEnabled = !empty(Site.current.preferences.custom.eswEshopworldModuleEnabled) ? Site.current.preferences.custom.eswEshopworldModuleEnabled : false;
    if (isEswEnabled) {
        try {
            var eswCustomHelper = require('*/cartridge/scripts/helpers/eswCustomHelper');
            var eswHelper = require('*/cartridge/scripts/helper/eswHelper').getEswHelper();
            var selectedCountryCode = eswHelper.getAvailableCountry();
            var selectedCountry = eswCustomHelper.getCustomCountryByCountryCode(selectedCountryCode);
        
            if (empty(selectedCountry) || empty(selectedCountry.siteId)) {
                return false;
            }

            if (!empty(selectedCountry) && (selectedCountry.siteId !== Site.getCurrent().ID)) {
                return selectedCountry;
            }
        
            return false;
        } catch (e) {
            Logger.error('(customCartHelpers.js -> getCountrySwitch) Error occured while getting countrySwitch: ' + e + e.stack);
            return false;
        }
    }
    return false;

};

function removeNullClydeWarrantyLineItemAndEngraving(currentBasket) {
    var Transaction = require('dw/system/Transaction');

    var Constants = require('*/cartridge/utils/Constants');

    var enablePulseIdEngraving = !empty(Site.current.preferences.custom.enablePulseIdEngraving) ? Site.current.preferences.custom.enablePulseIdEngraving : false;
    var orderLineItems = currentBasket.allProductLineItems;
    var orderLineItemsIterator = orderLineItems.iterator();
    var pulseIdEngraving = 'pulseIdEngraving';
    var productLineItem;
    var pulseIdConstants;

    if (enablePulseIdEngraving) {
        pulseIdConstants = require('*/cartridge/scripts/utils/pulseIdConstants');
    }

    Transaction.wrap(function () {
        while (orderLineItemsIterator.hasNext()) {
            productLineItem = orderLineItemsIterator.next();
            if (productLineItem instanceof dw.order.ProductLineItem && (productLineItem.optionID == Constants.ENGRAVING || productLineItem.optionID == Constants.CLYDE_WARRANTY) && productLineItem.optionValueID == Constants.CLYDE_WARRANTY_OPTION_ID_NONE) {
                currentBasket.removeProductLineItem(productLineItem);
            } else if ((productLineItem instanceof dw.order.ProductLineItem && pulseIdConstants && productLineItem.optionID == pulseIdConstants.PULSEID_SERVICE_ID.ENGRAVED_OPTION_PRODUCT_ID && productLineItem.optionValueID == pulseIdConstants.PULSEID_SERVICE_ID.ENGRAVED_OPTION_PRODUCT_VALUE_ID_NONE) || (!enablePulseIdEngraving && productLineItem.optionID == pulseIdEngraving)) {
                currentBasket.removeProductLineItem(productLineItem);
            } else if ((productLineItem instanceof dw.order.ProductLineItem && productLineItem.optionID == EMBOSSED && productLineItem.optionValueID == Constants.OPTION_VALUE_ID_ZERO)) {
                currentBasket.removeProductLineItem(productLineItem);
            } else if ((productLineItem instanceof dw.order.ProductLineItem && productLineItem.optionID == ENGRAVED && productLineItem.optionValueID == Constants.CLYDE_WARRANTY_OPTION_ID_NONE)) {
                currentBasket.removeProductLineItem(productLineItem);
            } else if ((productLineItem instanceof dw.order.ProductLineItem && productLineItem.optionID == GIFTWRAPPED && productLineItem.optionValueID == Constants.OPTION_VALUE_ID_ZERO)) {
                currentBasket.removeProductLineItem(productLineItem);
            }
        }
    });
};

function removeClydeWarranty(currentItems) {
    var Constants = require('*/cartridge/utils/Constants');
    if (currentItems && currentItems.items && currentItems.items.length > 0) {
        for (var i = 0; i < currentItems.items.length; i++) {
            if (currentItems.items[i].options.length > 0) {
                for (var j = 0; j < currentItems.items[i].options.length; j++) {
                    if (currentItems.items[i].options[j].optionId == Constants.CLYDE_WARRANTY && currentItems.items[i].options[j].selectedValueId == Constants.CLYDE_WARRANTY_OPTION_ID_NONE) {
                        currentItems.items[i].options[j] = currentItems.items[i].options[j].displayName;
                    }
                }
            }
        }
    }
};

function getGiftTransactionATC(currentBasket, giftsParentUUID) {
    var Transaction = require('dw/system/Transaction');
    var linesItemsIterator = currentBasket.allProductLineItems.iterator();
    var currentsLineItemsIterator;
    while (linesItemsIterator.hasNext()) {
        currentsLineItemsIterator = linesItemsIterator.next();
        if (currentsLineItemsIterator.UUID == giftsParentUUID[0].custom.giftParentUUID) {
            Transaction.wrap(function () {
                currentsLineItemsIterator.custom.giftPid = "";
            });
            break;
        }
    }
};

/**
 * Function to escape quotes
 * @param value
 * @returns escape quote value
 */
function escapeQuotes(value) {
    if (value != null) {
        return value.replace(/'/g, "\\'");
    }
    return value;
}

/**
 * Code to populate personalization message in the ProductLineItem for Apple pay button from PDP and Quickview
 * @param lineItemCtnr : current basket
 * @param embossOptionID
 * @param engraveOptionID
 * @param embossedMessage
 * @param engravedMessage
 * @returns
 */

var EMBOSSED = 'Embossed';
var ENGRAVED = 'Engraved';
var PULSEID_ENGRAVING = 'pulseIdEngraving';
var NEWLINE = '\n';
function updateOptionLineItemAfterShopperRecovery(lineItemCtnr, embossOptionID, engraveOptionID, embossedMessage, engravedMessage, pulseIDPreviewURL) {
    // since there will be only on Product from PDP/ Quick view
    var pli = lineItemCtnr.productLineItems[0];
    if (pli.optionProductLineItems) {
        Transaction.wrap(function () {
            collections.forEach(pli.optionProductLineItems, function (option) {
                if (option.optionID === EMBOSSED) {
                    if (embossOptionID) {
                        var optionModel = option.parent.optionModel;
                        var getOption = optionModel.getOption(EMBOSSED);
                        var optionValue = optionModel.getOptionValue(getOption, embossOptionID);
                        option.updateOptionValue(optionValue);
                        option.updateOptionPrice();
                        if (embossedMessage) {
                            pli.custom.embossMessageLine1 = embossedMessage;
                        }
                    }
                } else if (option.optionID === ENGRAVED) {
                    if (engraveOptionID) {
                        var optionModel = option.parent.optionModel;
                        var getOption = optionModel.getOption(ENGRAVED);
                        var optionValue = optionModel.getOptionValue(getOption, engraveOptionID);
                        option.updateOptionValue(optionValue);
                        option.updateOptionPrice();
                        if (engravedMessage) {
                            // code to split the message based on newline character
                            engravedMessage = engravedMessage.split(NEWLINE);
                            pli.custom.engraveMessageLine1 = engravedMessage[0];
                            if (engravedMessage[1]) {
                                pli.custom.engraveMessageLine2 = engravedMessage[1];
                            }
                        }
                    }
                } else if (option.optionID === PULSEID_ENGRAVING) { // PulseID Engraving
                    if (engraveOptionID) {
                        var optionModel = option.parent.optionModel;
                        var getOption = optionModel.getOption(PULSEID_ENGRAVING);
                        var optionValue = optionModel.getOptionValue(getOption, engraveOptionID);
                        option.updateOptionValue(optionValue);
                        option.updateOptionPrice();
                        if (engravedMessage) {
                            option.custom.pulseIDPreviewURL = pulseIDPreviewURL;
                            // code to split the message based on newline character
                            engravedMessage = engravedMessage.split(NEWLINE);
                            option.custom.engraveMessageLine1 = engravedMessage[0];
                            if (engravedMessage[1]) {
                                option.custom.engraveMessageLine2 = engravedMessage[1];
                            }
                        }
                    }
                }
            });
        }); // end of Transaction
    }
}

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
    getCartForAnalyticsTracking: getCartForAnalyticsTracking,
    getGiftTransactionATC: getGiftTransactionATC,
    getCountrySwitch: getCountrySwitch,
    removeClydeWarranty: removeClydeWarranty,
    removeNullClydeWarrantyLineItemAndEngraving: removeNullClydeWarrantyLineItemAndEngraving,
    removeGiftMessaging: removeGiftMessaging,
    updateOptionLineItemAfterShopperRecovery: updateOptionLineItemAfterShopperRecovery
};
