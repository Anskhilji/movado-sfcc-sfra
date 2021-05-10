'use strict';

var Resource = require('dw/web/Resource');
var Site = require('dw/system/Site');

var Cart = module.superModule;

var collections = require('*/cartridge/scripts/util/collections');
var GIFTWRAPPED = 'GiftWrapped';
/**
* extend is use to extend super module
* @param target - super module
* @param source - child module
*/
function extend(target, source) {
    var _source;

    if (!target) {
        return source;
    }

    for (var i = 1; i < arguments.length; i++) {
        _source = arguments[i];
        for (var prop in _source) {
			// recurse for non-API objects
            if (_source[prop] && typeof _source[prop] === 'object' && !_source[prop].class) {
                target[prop] = this.extend(target[prop], _source[prop]);
            } else {
                target[prop] = _source[prop];
            }
        }
    }

    return target;
}
/**
 * getGiftMessagingObject creates the gift message text data
 * @returns {Object} an object of gift messaging
 */
function getGiftMessagingObject(){
    var giftMessagingObject = {};
    giftMessagingObject.giftText = Resource.msg('cart.gift.message.text','cart',null);
    giftMessagingObject.giftCharLimitText = Resource.msg('cart.gift.message.char.limit.text','cart',null);
    giftMessagingObject.giftCharLimit = !empty(Site.current.preferences.custom.cartGiftMessageLimit) ? Site.current.preferences.custom.cartGiftMessageLimit : 0;
    giftMessagingObject.giftTextPlaceholder = Resource.msg('cart.gift.message.placeholder','cart',null);
    giftMessagingObject.buttonText = Resource.msg('cart.gift.message.button.text','cart',null);
    giftMessagingObject.missingText = Resource.msg('cart.gift.message.missing', 'cart', null);
    giftMessagingObject.apply = Resource.msg('cart.gift.message.apply', 'cart', null);
    giftMessagingObject.saved = Resource.msg('cart.gift.message.saved', 'cart', null);
    return giftMessagingObject;
}

/**
 * getLineItemGiftMessage creates the gift message text entered in line item
 * @param {dw.order.Basket} basket - Current users's basket
 * @returns {Object} an object of gift messaging
 */
function getLineItemGiftMessage(basket){
    var lineItemsGiftMsgObject = {};
    if(basket){
        var prodLineItems = basket.productLineItems;
        collections.forEach(prodLineItems, function (item) {
            var lineItemGiftMsgObject = {};
            lineItemGiftMsgObject.giftMessage = item.custom.GiftWrapMessage;

            if (!empty(item.custom.GiftWrapMessage) && Site.current.preferences.custom.cartGiftMessageLimit && !empty(Site.current.preferences.custom.cartGiftMessageLimit)) {
                lineItemGiftMsgObject.giftCharLimit = (Site.current.preferences.custom.cartGiftMessageLimit - item.custom.GiftWrapMessage.length).toFixed()
            }
            else if (empty(Site.current.preferences.custom.cartGiftMessageLimit)) {
                lineItemGiftMsgObject.giftCharLimit = 0;
            }
            else{
                lineItemGiftMsgObject.giftCharLimit = !empty(Site.current.preferences.custom.cartGiftMessageLimit) ? Site.current.preferences.custom.cartGiftMessageLimit : 0;
            }

            lineItemsGiftMsgObject[item.UUID] = lineItemGiftMsgObject;
        });
    }
    return lineItemsGiftMsgObject;
}

/**
 * getItemOptions sets the gift options in cart model
 * @param {dw.order.Basket} basket - Current users's basket
 * @returns {Object} an object of option line items
 */
function getItemOptions(basket) {
    var optionLineItems = {};
    if(basket){
        var allLineItems = basket.productLineItems;
        collections.forEach(allLineItems, function (item) {
            if (!item.product) { return; }
            var optionModel = {};
            var option = item.product.optionModel.getOption(GIFTWRAPPED);
            if(option){
                var optionValues = option.getOptionValues();
                var selectedOptionValue = item.optionModel.getSelectedOptionValue(option).ID;
                var productOptionValues = [];
                for each (var optionValue in optionValues){
                    var price = item.product.optionModel.getPrice(optionValue);
                    var productOptionValue = {};
                    productOptionValue.ID = optionValue.ID;
                    productOptionValue.display = optionValue.displayValue;
                    productOptionValue.price = price.value > 0 ? price.toFormattedString() : null;
                    productOptionValues.push(productOptionValue);
                }
                for each (var optionLineItem in item.optionProductLineItems){
                    if(optionLineItem.optionID === GIFTWRAPPED){
                        optionModel.optionUUID = optionLineItem.UUID;
                    }
                }
                optionModel.selectedOptionValue = selectedOptionValue;
                optionModel.selectOptionValue = productOptionValues;
                optionModel.isGiftWrap = item.product.custom.GiftWrap;
            }
            optionLineItems[item.UUID] = optionModel;
        });
    }
    return optionLineItems;
}


/**
 * returns the need help section on the cart page from content asset
 * @returns {Object} assets
 */
function getCustomAssets(){
  
  var ContentMgr = require('dw/content/ContentMgr');
  var assets = {};
  
  var content = ContentMgr.getContent('need-help');
  needHelp = (content && 'body' in content.custom && (content.custom.body)) ? content.custom.body : ''; 
  assets.needHelp = needHelp;
  
  return assets;
}

function getSwellRedemption(priceAdjustments) {
    var result = {
        swellRedemptionID : '',
        swellRedemptionText : ''
    };

    if (!empty(priceAdjustments)) {
        priceAdjustments.toArray().forEach(function (priceAdjustment) {
            if (!empty(priceAdjustment) && !empty(priceAdjustment.custom.swellRedemptionId)) {
                result = {
                    swellRedemptionID : priceAdjustment.custom.swellRedemptionId,
                    swellRedemptionText : priceAdjustment.lineItemText
                };
            } 
        });
        return result;
    }
}
/**
 * Order class that represents the current order
 * @param {dw.order.Basket} basket - Current users's basket
 * @returns {Object} an object of Cart
 */
function CartModel(basket) {
  
    var cartModel;
    var totalTaxVal;
    var cartObject;
    var lineItemOptionModel = getItemOptions(basket);
    var assets = getCustomAssets();
    var giftMessaging = getGiftMessagingObject();  
    
    if((!basket) || (basket && basket.totalTax && basket.totalTax.value ==0 && basket.defaultShipment && basket.defaultShipment.shippingAddress==null)){
       totalTaxVal = '-';
    } else {
      totalTaxVal = basket.totalTax.value;
    }
    
    cartModel = new Cart(basket);
    
    cartObject = extend(cartModel,{
      lineItemOptions: lineItemOptionModel,
      giftMessaging: giftMessaging,
      lineItemGiftMessage: getLineItemGiftMessage(basket),
      totalTaxVal : totalTaxVal,
      resources: {
        toBeDeclared: Resource.msg('tax.tbd', 'cart', null),
        additionalCheckout: Resource.msg('additional.checkout', 'cart', null)
      },
      assets: assets,
      swellRedemption: getSwellRedemption(!empty(basket) ? basket.getPriceAdjustments() : null)
    });
    return cartObject;
}

module.exports = CartModel;
