'use strict';

var ShippingMethodBase = module.superModule;

var ArrayList = require('dw/util/ArrayList');
var BasketMgr = require('dw/order/BasketMgr');
var Calendar = require('dw/util/Calendar');
var PromotionMgr = require('dw/campaign/PromotionMgr');
var Resource = require('dw/web/Resource');
var Site = require('dw/system/Site');
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
    var startingDeliveryDate;
    var endingDeliveryDate;
    var endingDeliveryDay;
    var startingDeliveryDay;
    var finalDeliveryDate;
    var formattedStartingDate;
    var formattedEndingDate;
    var dateRange= new ArrayList();
    var productLineItems;
    var embossed;
    
    var productLineItemsItr = basket.getAllProductLineItems().iterator();
    
    while(productLineItemsItr.hasNext()){
        var productLineItems = productLineItemsItr.next();
        if (productLineItems.custom.embossMessageLine1 || productLineItems.custom.engraveMessageLine1) {
            embossed = true;
        }
    }
    
//    var basketLastModifiedDate = StringUtils.formatCalendar(
//            new Calendar(basket.getLastModified()), 'MM/dd/yyyy'
//        )
    var basketLastModifiedTime = StringUtils.formatCalendar(
            new Calendar(basket.getLastModified()), 'h:mm a'
    )
    
    var isEstimated = shippingMethod.custom.isEstimated;
    var shippingDays = shippingMethod.custom.estimatedArrivalTime;
    var deliveryDaysBeforeNoon = shippingMethod.custom.daysBeforeNoon;
    var deliveryDaysAfterNoon = shippingMethod.custom.daysAfterNoon;
    var optionProductShipmentDelay = shippingMethod.custom.optionProductShipmentDealy;
    
    if(!isEstimated) {
        if (basketLastModifiedTime.indexOf('PM') > -1) {
            startingDeliveryDate = new Calendar(basket.getLastModified());
            endingDeliveryDate = new Calendar(basket.getLastModified());
            endingDeliveryDate.add(endingDeliveryDate.DAY_OF_MONTH, deliveryDaysAfterNoon);
            for (var i = 1; i <= deliveryDaysAfterNoon; i++) {
                var currentDate = new Calendar(basket.getLastModified());
                currentDate.add(currentDate.DAY_OF_MONTH, i);
                dateRange.push(currentDate);
            }
            
//            for (var i = 0; i < dateRange.length; i++) {
//                endingDeliveryDate = excludePublicHolidays(endingDeliveryDate, dateRange, dateRange[i]);
//            }
//            for (var i = 0; i < dateRange.length; i++) {
//                var deliveryDay = dateRange[i].get(dateRange[i].DAY_OF_WEEK);
//                endingDeliveryDate = excludeWeekendDates(deliveryDay, endingDeliveryDate);
//            }
//            endingDeliveryDay = changeNumberToDayName(endingDeliveryDate);
//            formattedEndingDate = endingDeliveryDay + ", " +  formatDate(endingDeliveryDate);
        } else {
            endingDeliveryDate = new Calendar(basket.getLastModified());
            endingDeliveryDate.add(endingDeliveryDate.DAY_OF_MONTH, deliveryDaysBeforeNoon);
            for (var i = 0; i <= deliveryDaysBeforeNoon; i++) {
                var currentDate = new Calendar(basket.getLastModified());
                currentDate.add(currentDate.DAY_OF_MONTH, i);
                dateRange.push(currentDate);
            }
        }
        
//        if (embossed) {
//            for (var i = 1; i <= optionProductShipmentDelay; i++) {
//                var currentEndingDate = endingDeliveryDate.time;
//                var currentDate = new Calendar(currentEndingDate);
//                 currentDate.add(currentDate.DAY_OF_MONTH, i);
//                 dateRange.push(currentDate);
//            } 
//            endingDeliveryDate.add(endingDeliveryDate.DAY_OF_MONTH, optionProductShipmentDelay);
//        }
//        for (var i = 0; i < dateRange.length; i++) {
//            endingDeliveryDate = excludePublicHolidays(endingDeliveryDate, dateRange, dateRange[i]);
//        }
//        for (var i = 0; i < dateRange.length; i++) {
//            var deliveryDay = dateRange[i].get(dateRange[i].DAY_OF_WEEK);
//            endingDeliveryDate = excludeWeekendDates(deliveryDay, endingDeliveryDate);
//        }
//            endingDeliveryDay = changeNumberToDayName(endingDeliveryDate);
//            formattedEndingDate = endingDeliveryDay + ", " +  formatDate(endingDeliveryDate);
    } else {
        var splitedShippingDays = shippingDays.split("-");
        for (var i = 0; i <= splitedShippingDays[1]; i++) {
            var currentDate = new Calendar(basket.getLastModified());
            currentDate.add(currentDate.DAY_OF_MONTH, i);
            dateRange.push(currentDate);
        }
        startingDeliveryDate = new Calendar(basket.getLastModified());
        startingDeliveryDate.add(startingDeliveryDate.DAY_OF_MONTH, splitedShippingDays[0]);
        startingDeliveryDay = changeNumberToDayName(startingDeliveryDate);
        formattedStartingDate = startingDeliveryDay + ", " + formatDate(startingDeliveryDate);
        endingDeliveryDate = new Calendar(basket.getLastModified());
        endingDeliveryDate.add(endingDeliveryDate.DAY_OF_MONTH, splitedShippingDays[1]);
    }
//        for (var i = 0; i < dateRange.size(); i++) {
//            endingDeliveryDate = excludePublicHolidays(endingDeliveryDate, dateRange, dateRange[i]);
//        }
//        for (var i = 0; i < dateRange.size(); i++) {
//            var deliveryDay = dateRange[i].get(dateRange[i].DAY_OF_WEEK);
//            endingDeliveryDate = excludeWeekendDates(deliveryDay, endingDeliveryDate);
//        }
    if (embossed) {
        for (var i = 1; i <= optionProductShipmentDelay; i++) {
            var currentEndingDate = endingDeliveryDate.time;
            var currentDate = new Calendar(currentEndingDate);
             currentDate.add(currentDate.DAY_OF_MONTH, i);
             dateRange.push(currentDate);
        } 
        endingDeliveryDate.add(endingDeliveryDate.DAY_OF_MONTH, optionProductShipmentDelay);
    }
    for (var i = 0; i < dateRange.length; i++) {
        endingDeliveryDate = excludePublicHolidays(endingDeliveryDate, dateRange, dateRange[i]);
    }
    for (var i = 0; i < dateRange.length; i++) {
        var deliveryDay = dateRange[i].get(dateRange[i].DAY_OF_WEEK);
        endingDeliveryDate = excludeWeekendDates(deliveryDay, endingDeliveryDate);
    }
        endingDeliveryDay = changeNumberToDayName(endingDeliveryDate);
        formattedEndingDate = endingDeliveryDay + ", " +  formatDate(endingDeliveryDate);
    
    if (isEstimated) {
        finalDeliveryDate = "Delivery between: " + formattedStartingDate + "-" + formattedEndingDate;
    } else {
        finalDeliveryDate = "Delivery on: " + formattedEndingDate;
    }
    dateRange = [];
    return finalDeliveryDate;
}

function excludeWeekendDates(deliveryDay, deliveryDate) {
    switch (deliveryDay) {
    case 7:
        deliveryDate.add(deliveryDate.DAY_OF_MONTH, "1");
        break;
    case 1:
        deliveryDate.add(deliveryDate.DAY_OF_MONTH, "1");
        break;
    default:
        deliveryDate;
        break;
    }
    
    return deliveryDate;
}

function excludePublicHolidays(deliveryDate, dateRange, indexedDate) {
    var formatedDeliveryDate;
    formatedDeliveryDate = StringUtils.formatCalendar(
            indexedDate, 'yyyy-MM-dd'
    )
    var publicHolidays = Site.getCurrent().preferences.custom.publicHolidays;
    for (var i = 0; i < publicHolidays.length; i++) {
        if (formatedDeliveryDate == publicHolidays[i]) {
            deliveryDate.add(deliveryDate.DAY_OF_MONTH, "1");
            dateRange.push(deliveryDate);
        }
    }
    return deliveryDate;
}

function changeNumberToDayName(dayNumber) {
    dayNumber = dayNumber.get(dayNumber.DAY_OF_WEEK);
    var dayName;
    switch (dayNumber) {
        case 1:
            dayName = "Sunday";
            return dayName;
            break;
        case 2:
            dayName = "Monday";
            return dayName;
            break;
        case 3:
            dayName = "Tuesday";
            return dayName;
            break;
        case 4:
            dayName = "Wednesday";
            return dayName;
            break;
        case 5:
            dayName = "Thursday";
            return dayName;
            break;
        case 6:
            dayName = "Friday";
            return dayName;
            break;
        case 7:
            dayName = "Saturday";
            return dayName;
            break;
        default:
            dayName = "Undefined";
            break;
    }
}

function formatDate(unformattedDate) {
    var formatedDate;
    formatedDate = StringUtils.formatCalendar(
        unformattedDate, 'dd MM yyyy'
    )
    return formatedDate;
}

//function isOptionIncluded()

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
