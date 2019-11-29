'use strict';

var ShippingMethodBase = module.superModule;

var BasketMgr = require('dw/order/BasketMgr');
var Calendar = require('dw/util/Calendar');
var PromotionMgr = require('dw/campaign/PromotionMgr');
var Resource = require('dw/web/Resource');
var ShippingMgr = require('dw/order/ShippingMgr');
var StringUtils = require('dw/util/StringUtils');

var formatCurrency = require('*/cartridge/scripts/util/formatting').formatCurrency;

/**
 * Returns shippingCost property for a specific Shipment / ShippingMethod pair
 * @param {dw.order.ShippingMethod} shippingMethod - the default shipment of the current basket
 * @param {dw.order.Shipment} shipment - a shipment of the current basket
 * @returns {string} String representation of Shipping Cost
 */
function getShippingCost(shippingMethod, shipment) {
    
    var shipmentShippingModel = ShippingMgr.getShipmentShippingModel(shipment);
    var shippingCost = shipmentShippingModel.getShippingCost(shippingMethod);
    this.shipingCostDecimalValue = shippingCost.getAmount().getDecimalValue();

    return formatCurrency(shippingCost.amount.value, shippingCost.amount.currencyCode);
}

function getIsFree(shippingMethod, shipment) {
    var freeShippingDiscountItem = false;
    var promotionPlan = PromotionMgr.getActivePromotions();
    var shippingPromotions = promotionPlan.getShippingPromotions(shippingMethod).toArray() ;
    
   for (var i = 0 ; i < shippingPromotions.length; i++) {
        var promotion = shippingPromotions[i];
        if (promotion.promotionClass === dw.campaign.Promotion.PROMOTION_CLASS_SHIPPING) {
        	var shippingPriceAdjustmentsItr = shipment.getShippingPriceAdjustments().iterator();
        	while (shippingPriceAdjustmentsItr.hasNext()) {
        		var shippingAdjustment = shippingPriceAdjustmentsItr.next();
        		var appliedDiscount = shippingAdjustment.getAppliedDiscount()
        		if (appliedDiscount.type === 'FREE') {
        			freeShippingDiscountItem = true;
        		} else {
        			freeShippingDiscountItem = false;
        		}
        	}
            
        } else {
        	freeShippingDiscountItem = true;
        }
    }
    var isFree = freeShippingDiscountItem;
    var freeShippingLabel = Resource.msg('shipping.free.label.text','shipping',null);
    return {isFree : isFree, freeShippingLabel : freeShippingLabel};
}

function getShippingDate(shippingMethod, shipment) {
    var calendar = new Calendar();
    var weekend;
    var today = calendar.get(calendar.DAY_OF_WEEK);
    var basket = BasketMgr.getCurrentBasket();
    var deliverDate;
    var deliveryDay;
    
//    var basketLastModifiedDate = StringUtils.formatCalendar(
//            new Calendar(basket.getLastModified()), 'MM/dd/yyyy'
//        )
        
    var basketLastModifiedTime = StringUtils.formatCalendar(
            new Calendar(basket.getLastModified()), 'h:mm a'
    )
    
    if (basketLastModifiedTime.indexOf('PM') > -1){
        deliverDate = new Calendar(basket.getLastModified());
        deliverDate.add(deliverDate.DAY_OF_MONTH, "2");
        deliveryDay = deliverDate.get(deliverDate.DAY_OF_WEEK);
    } else {
        deliverDate = new Calendar(basket.getLastModified());
        deliverDate.add(deliverDate.DAY_OF_MONTH, "1");
        deliveryDay = deliverDate.get(deliverDate.DAY_OF_WEEK);
    }
    
    
    
//    var basketLastModified = basket.getLastModified();
//    var creationTimeHours = basketCreationTime.getHours();
    switch (deliveryDay) {
        case deliverDate.FRIDAY:
            deliverDate.add(deliverDate.DAY_OF_MONTH, "4");
            break;
        case deliverDate.SATURDAY:
            deliverDate.add(deliverDate.DAY_OF_MONTH, "3");
            break;
        case deliverDate.SUNDAY:
            deliverDate.add(deliverDate.DAY_OF_MONTH, "2");
            break;
        default:
            weekend = "Not Defined"
    }
    return today;
}

/**
 * Plain JS object that represents a DW Script API dw.order.ShippingMethod object
 * @param {dw.order.ShippingMethod} shippingMethod - the default shipment of the current basket
 * @param {dw.order.Shipment} [shipment] - a Shipment
 */
function ShippingMethodModel(shippingMethod, shipment) {
    ShippingMethodBase.call(this, shippingMethod, shipment);
    if (shipment) {
        this.shippingCost = getShippingCost(shippingMethod, shipment);
        this.freeShippingContent = getIsFree(shippingMethod, shipment);
        this.dayOfWeek = getShippingDate(shippingMethod, shipment);
    }
}

module.exports = ShippingMethodModel;
