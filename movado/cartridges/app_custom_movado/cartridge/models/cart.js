'use strict';

var formatMoney = require('dw/util/StringUtils').formatMoney;
var PromotionMgr = require('dw/campaign/PromotionMgr');
var Resource = require('dw/web/Resource');
var Site = require('dw/system/Site');
var URLUtils = require('dw/web/URLUtils');


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

/**
 * Generates an object of approaching discounts
 * @param {dw.order.Basket} basket - Current users's basket
 * @param {dw.campaign.DiscountPlan} discountPlan - set of applicable discounts
 * @returns {Object} an object of approaching discounts
 */
function getApproachingDiscounts(basket, discountPlan) {
    var approachingOrderDiscounts;
    var approachingShippingDiscounts;
    var orderDiscountObject;
    var shippingDiscountObject;
    var bonusDiscounts;
    var bonusDiscountsObject;
    var discountObject;

    if (basket && basket.productLineItems) {
        // TODO: Account for giftCertificateLineItems once gift certificates are implemented
        approachingOrderDiscounts = discountPlan.getApproachingOrderDiscounts();
        approachingShippingDiscounts =
            discountPlan.getApproachingShippingDiscounts(basket.defaultShipment);
        bonusDiscounts = discountPlan.getBonusDiscounts();
        
        // Custom Start: overide from base to include conditionThreshold and promotion custom attributes into getApproachingDiscounts on Order level.
        orderDiscountObject =
            collections.map(approachingOrderDiscounts, function (approachingOrderDiscount) {
                return {
                    discountMsg: Resource.msgf(
                        'msg.approachingpromo',
                        'cart',
                        null,
                        formatMoney(
                            approachingOrderDiscount.getDistanceFromConditionThreshold()
                        ),
                        approachingOrderDiscount.getDiscount()
                            .getPromotion().getCalloutMsg()
                    ),
                    promotionTotal: formatMoney(approachingOrderDiscount.getDistanceFromConditionThreshold()),
                    conditionThreshold : formatMoney(approachingOrderDiscount.getConditionThreshold()),
                    conditionThresholdValue : approachingOrderDiscount.getConditionThreshold().value,
                    isPromoProgressBarEnable: approachingOrderDiscount.getDiscount().getPromotion().custom.isPromoProgressBarEnable ? approachingOrderDiscount.getDiscount().getPromotion().custom.isPromoProgressBarEnable : false,
                    progressBarPromoMsg: approachingOrderDiscount.getDiscount().getPromotion().custom.progressBarPromoMsg,
                    progressBarSuccessMsg : approachingOrderDiscount.getDiscount().getPromotion().custom.progressBarSuccessMsg,
                    isOrderLevelPromotion : true
                };
            });
        // Custom End:

        // Custom Start: overide from base to include conditionThreshold and promotion custom attributes into getApproachingDiscounts on shipping level.
        shippingDiscountObject =
            collections.map(approachingShippingDiscounts, function (approachingShippingDiscount) {
                return {
                    discountMsg: Resource.msgf(
                        'msg.approachingpromo',
                        'cart',
                        null,
                        formatMoney(
                            approachingShippingDiscount.getDistanceFromConditionThreshold()
                        ),
                        approachingShippingDiscount.getDiscount()
                            .getPromotion().getCalloutMsg()
                    ),
                    promotionTotal: formatMoney(approachingShippingDiscount.getDistanceFromConditionThreshold()),
                    conditionThreshold : formatMoney(approachingShippingDiscount.getConditionThreshold()),
                    conditionThresholdValue : approachingShippingDiscount.getConditionThreshold().value,
                    isPromoProgressBarEnable: approachingShippingDiscount.getDiscount().getPromotion().custom.isPromoProgressBarEnable ? approachingShippingDiscount.getDiscount().getPromotion().custom.isPromoProgressBarEnable : false,
                    progressBarPromoMsg: approachingShippingDiscount.getDiscount().getPromotion().custom.progressBarPromoMsg,
                    progressBarSuccessMsg : approachingShippingDiscount.getDiscount().getPromotion().custom.progressBarSuccessMsg
                };
            });
        // Custom End:

        discountObject = orderDiscountObject.concat(shippingDiscountObject);
        if (!empty(bonusDiscountsObject)) {
            discountObject = orderDiscountObject.concat(bonusDiscountsObject);
        }
    }
    return discountObject;
}

/**
 * Generates an object of approaching discounts
 * @param {dw.order.Basket} basket - Current users's basket
 * @param {dw.campaign.DiscountPlan} discountPlan - set of applicable discounts
 * @returns {Object} an object of approaching discounts
 */
function getOrderDiscounts(basket, discountPlan) {

    var progressBarOrderDiscountObject;
    var discountObject;
    var orderDiscounts;
    var shippingDiscounts;
    var shippingDiscountObject;

    if (basket && basket.productLineItems) {
        orderDiscounts = discountPlan.getOrderDiscounts();
        shippingDiscounts = discountPlan.getShippingDiscounts(basket.defaultShipment);
          
        progressBarOrderDiscountObject = 
        collections.map(orderDiscounts, function (orderDiscount) {
            return {
                isPromoProgressBarEnable: orderDiscount.getPromotion().custom.isPromoProgressBarEnable ? orderDiscount.getPromotion().custom.isPromoProgressBarEnable : false,
                progressBarSuccessMsg : orderDiscount.getPromotion().custom.progressBarSuccessMsg ? orderDiscount.getPromotion().custom.progressBarSuccessMsg : false,
                isOrderLevelPromotion : true
            };
        });


        shippingDiscountObject = 
        collections.map(shippingDiscounts, function (shippingDiscount) {
            return {
                isPromoProgressBarEnable: shippingDiscount.getPromotion().custom.isPromoProgressBarEnable ? shippingDiscount.getPromotion().custom.isPromoProgressBarEnable : false,
                progressBarSuccessMsg : shippingDiscount.getPromotion().custom.progressBarSuccessMsg ? shippingDiscount.getPromotion().custom.progressBarSuccessMsg : false
            };
        });

        discountObject = progressBarOrderDiscountObject.concat(shippingDiscountObject);
    }
    return discountObject;
}

/**
 * Generates an object of approaching discounts
 * @param {dw.order.Basket} basket - Current users's basket
 * @param {dw.campaign.DiscountPlan} discountPlan - set of applicable discounts
 * @returns {Object} an object of approaching discounts
 */
function getBonusDiscounts(basket, discountPlan) {

    var bonusDiscounts;
    var bonusDiscountsObject;
    var discountObject;

    if (basket && basket.productLineItems) {
        bonusDiscounts = discountPlan.getBonusDiscounts();
          
        bonusDiscountsObject = 
        collections.map(bonusDiscounts, function (bonusDiscount) {
            return {
                isPromoProgressBarEnable: bonusDiscount.getPromotion().custom.isPromoProgressBarEnable ? bonusDiscount.getPromotion().custom.isPromoProgressBarEnable : false,
                progressBarSuccessMsg : bonusDiscount.getPromotion().custom.progressBarSuccessMsg,
                isOrderLevelPromotion : true
            };
        });

        discountObject = bonusDiscountsObject;
    }
    return discountObject;
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
    var isPromoProgressBarEnabled = false;
    var progressBarSuccessMsg;
    var isOrderLevelPromotion = false;
    
    if((!basket) || (basket && basket.totalTax && basket.totalTax.value ==0 && basket.defaultShipment && basket.defaultShipment.shippingAddress==null)){
       totalTaxVal = '-';
    } else {
      totalTaxVal = basket.totalTax.value;
    }

    cartModel = new Cart(basket);

    if (basket !== null && cartModel.numItems > 0) {
        var discountPlan = PromotionMgr.getDiscounts(basket);
        if (discountPlan) {
            var progressBarApproachingDiscounts = getApproachingDiscounts(basket, discountPlan);
            var progressBarDiscounts = getOrderDiscounts(basket, discountPlan);
            var progressBarBonusDiscounts = getBonusDiscounts(basket, discountPlan);
            var orderLevelPromoImg = URLUtils.httpStatic('/images/checkgreen.svg').toString();
            var orderLevelPromoImgMiniCart = URLUtils.httpStatic('/images/checkwhite.svg').toString();
            var shippingLevelPromoImg = URLUtils.httpStatic('/images/green_delivery.svg').toString();
            var shippingLevelPromoImgMiniCart = URLUtils.httpStatic('/images/delivery.svg').toString();

            if (!empty(progressBarBonusDiscounts)) {
                isPromoProgressBarEnabled =  progressBarBonusDiscounts[0].isPromoProgressBarEnable ? progressBarBonusDiscounts[0].isPromoProgressBarEnable : false;
                progressBarSuccessMsg = progressBarBonusDiscounts[0].progressBarSuccessMsg ? progressBarBonusDiscounts[0].progressBarSuccessMsg : '';
                isOrderLevelPromotion = progressBarBonusDiscounts[0].isOrderLevelPromotion ? progressBarBonusDiscounts[0].isOrderLevelPromotion : false;
            }

            if (!empty(progressBarDiscounts)) {
                isPromoProgressBarEnabled =  progressBarDiscounts[0].isPromoProgressBarEnable ? progressBarDiscounts[0].isPromoProgressBarEnable : false;
                progressBarSuccessMsg = progressBarDiscounts[0].progressBarSuccessMsg ? progressBarDiscounts[0].progressBarSuccessMsg : '';
                isOrderLevelPromotion = progressBarDiscounts[0].isOrderLevelPromotion ? progressBarDiscounts[0].isOrderLevelPromotion : false;
            }
        }

        if (cartModel && cartModel.approachingDiscounts && cartModel.approachingDiscounts[0] && progressBarApproachingDiscounts[0].isPromoProgressBarEnable  && typeof progressBarApproachingDiscounts[0].promotionTotal !== undefined) {
            var approachingDiscountsTotal = progressBarApproachingDiscounts[0].promotionTotal;
            var conditionThreshold = progressBarApproachingDiscounts[0].conditionThreshold;
            var conditionThresholdCurrencyValue = progressBarApproachingDiscounts[0].conditionThresholdValue;
            var approachingDiscountCurrencyValue = approachingDiscountsTotal.substring(1);
            var progressBarPromoMsg = progressBarApproachingDiscounts[0].progressBarPromoMsg ? progressBarApproachingDiscounts[0].progressBarPromoMsg : '';
            isOrderLevelPromotion = progressBarApproachingDiscounts[0].isOrderLevelPromotion ? progressBarApproachingDiscounts[0].isOrderLevelPromotion : false;
            progressBarSuccessMsg = progressBarApproachingDiscounts[0].progressBarSuccessMsg ? progressBarApproachingDiscounts[0].progressBarSuccessMsg : '';
            isPromoProgressBarEnabled = progressBarApproachingDiscounts[0].isPromoProgressBarEnable ? progressBarApproachingDiscounts[0].isPromoProgressBarEnable : false;

            var progressBarPromoTotal = conditionThresholdCurrencyValue;
            var progressBarPromoCurrent = cartModel.totals.progressBarGrandTotal.value;
            var progressBarpercentage;

            if (isNaN(progressBarPromoTotal) || isNaN(progressBarPromoCurrent)){
                progressBarpercentage='';
            } else {
                progressBarpercentage = ((progressBarPromoCurrent/progressBarPromoTotal) * 100).toFixed(3);
            }
        }
    }

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
        swellRedemption: getSwellRedemption(!empty(basket) ? basket.getPriceAdjustments() : null),
        giftOptions: getGiftOptions(!empty(basket) ? basket : null),
        approachingDiscountCurrencyValue: approachingDiscountCurrencyValue ? approachingDiscountCurrencyValue : '',
        approachingDiscountsTotal: approachingDiscountsTotal ? approachingDiscountsTotal : '',
        conditionThreshold: conditionThreshold ? conditionThreshold : '',
        conditionThresholdCurrencyValue: conditionThresholdCurrencyValue ? conditionThresholdCurrencyValue : '',
        progressBarpercentage: progressBarpercentage,
        progressBarPromoMsg: progressBarPromoMsg,
        isPromoProgressBarEnabled: isPromoProgressBarEnabled,
        progressBarSuccessMsg: progressBarSuccessMsg,
        isOrderLevelPromotion : isOrderLevelPromotion,
        orderLevelPromoImg : orderLevelPromoImg,
        orderLevelPromoImgMiniCart: orderLevelPromoImgMiniCart,
        shippingLevelPromoImg : shippingLevelPromoImg,
        shippingLevelPromoImgMiniCart : shippingLevelPromoImgMiniCart
        });
        return cartObject;
    }

function getGiftOptions(basket) {
    var productHasGift = [];
    var lineItems = basket.allProductLineItems.toArray();
    for (var i = 0; i < lineItems.length; i++) {
        if (lineItems[i].custom.giftPid) {
            productHasGift.push(basket.allProductLineItems[i].UUID);
        }
    }
    return productHasGift;
}

module.exports = CartModel;
