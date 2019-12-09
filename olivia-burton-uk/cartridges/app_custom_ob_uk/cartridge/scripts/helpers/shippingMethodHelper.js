'use strict';

var ArrayList = require('dw/util/ArrayList');
var BasketMgr = require('dw/order/BasketMgr');
var Calendar = require('dw/util/Calendar');
var Resource = require('dw/web/Resource');
var Site = require('dw/system/Site');
var StringUtils = require('dw/util/StringUtils');
var Util = require('dw/util');

var CommonUtils = require('app_custom_movado/cartridge/utils/commonUtils');

function getShippingDate(shippingMethod) {
    var calendar = new Calendar();
    var basket = BasketMgr.getCurrentBasket();
    var startingDeliveryDate;
    var endingDeliveryDate;
    var endingDeliveryDay;
    var startingDeliveryDay;
    var finalDeliveryDate;
    var formattedStartingDate;
    var formattedEndingDate;
    var dateRange= new Util.HashMap();
    var productLineItems;
    var embossed;
    var basketLastModified;
    var publicHolidays = new Util.HashMap();
    
    if (basket) {
        var productLineItemsItr = basket.getAllProductLineItems().iterator();
        var basketLastModified = basket.getLastModified();
        while (productLineItemsItr.hasNext()) {
            var productLineItems = productLineItemsItr.next();
            if (!empty(productLineItems.custom.embossMessageLine1) || !empty(productLineItems.custom.engraveMessageLine1)) {
                embossed = true;
            }
        }
        
        var basketLastModifiedTime = StringUtils.formatCalendar(
            new Calendar(basketLastModified), Resource.msg('pattern.to.convert.time.to.12.hours','shipping',null)
        )
        
        var isEstimated =  shippingMethod.custom.isEstimated ? true : false;
        var shippingDays = !empty(shippingMethod.custom.estimatedArrivalTime) ? shippingMethod.custom.estimatedArrivalTime : 0;
        var deliveryDaysBeforeNoon = !empty(shippingMethod.custom.daysBeforeNoon) ? shippingMethod.custom.daysBeforeNoon : 0;
        var deliveryDaysAfterNoon = !empty(shippingMethod.custom.daysAfterNoon) ? shippingMethod.custom.daysAfterNoon : 0;
        var optionProductShipmentDelay = !empty(shippingMethod.custom.optionProductShipmentDelay) ? shippingMethod.custom.optionProductShipmentDelay : 0;
        
        if (isEstimated) {
            var splitedShippingDays = shippingDays.split("-");
            for (var i = 1; i <= splitedShippingDays[1]; i++) {
                var currentDate = new Calendar(basketLastModified);
                currentDate.add(currentDate.DAY_OF_MONTH, i);
                dateRange.put(currentDate, currentDate);
            }
            startingDeliveryDate = new Calendar(basketLastModified);
            startingDeliveryDate.add(startingDeliveryDate.DAY_OF_MONTH, splitedShippingDays[0]);
            endingDeliveryDate = new Calendar(basketLastModified);
            endingDeliveryDate.add(endingDeliveryDate.DAY_OF_MONTH, splitedShippingDays[1]);
            if (embossed) {
                includeAdditionalDaysForOptionProduct(endingDeliveryDate, dateRange, optionProductShipmentDelay);
            }
        } else {
            if (basketLastModifiedTime.indexOf('PM') > -1) {
                endingDeliveryDate = new Calendar(basketLastModified);
                endingDeliveryDate.add(endingDeliveryDate.DAY_OF_MONTH, deliveryDaysAfterNoon);
                for (var i = 1; i <= deliveryDaysAfterNoon; i++) {
                    var currentDate = new Calendar(basketLastModified);
                    currentDate.add(currentDate.DAY_OF_MONTH, i);
                    dateRange.put(currentDate, currentDate);
                }
                if (embossed) {
                    includeAdditionalDaysForOptionProduct(endingDeliveryDate, dateRange, optionProductShipmentDelay);
                }
            } else {
                endingDeliveryDate = new Calendar(basketLastModified);
                endingDeliveryDate.add(endingDeliveryDate.DAY_OF_MONTH, deliveryDaysBeforeNoon);
                for (var i = 1; i <= deliveryDaysBeforeNoon; i++) {
                    var currentDate = new Calendar(basketLastModified);
                    currentDate.add(currentDate.DAY_OF_MONTH, i);
                    dateRange.put(currentDate, currentDate);
                }
                if (embossed) {
                    includeAdditionalDaysForOptionProduct(endingDeliveryDate, dateRange, optionProductShipmentDelay);
                }
            }
        }
        
        if (isEstimated) {
            startingDeliveryDate = excludePublicHolidays(startingDeliveryDate, dateRange);
            
            // Exclude weekends from starting delivery date
            var dateRangeItr =  dateRange.values().iterator();
            while (dateRangeItr.hasNext()) {
                var deliveryDate = dateRangeItr.next();
                var deliveryDay = deliveryDate.get(deliveryDate.DAY_OF_WEEK);
                startingDeliveryDate = excludeWeekendDates(deliveryDay, startingDeliveryDate);
            }
            formattedStartingDate = CommonUtils.getFormatedDate(startingDeliveryDate);
        }

        endingDeliveryDate = excludePublicHolidays(endingDeliveryDate, dateRange);
            
        // exclude weekends from ending delivery date
        var dateRangeItr =  dateRange.values().iterator();
        while (dateRangeItr.hasNext()) {
            var deliveryDate = dateRangeItr.next();
            var deliveryDay = deliveryDate.get(deliveryDate.DAY_OF_WEEK);
            endingDeliveryDate = excludeWeekendDates(deliveryDay, endingDeliveryDate, dateRange);
        }
        
        formattedEndingDate = CommonUtils.getFormatedDate(endingDeliveryDate);
        
        if (isEstimated) {
            finalDeliveryDate = Resource.msg('delivery.between.callout.message','shipping',null) + formattedStartingDate + "-" + formattedEndingDate;
        } else {
            finalDeliveryDate = Resource.msg('delivery.on.callout.message','shipping',null) + formattedEndingDate;
        }
        
        dateRange = [];
        return finalDeliveryDate;
    }
}

/**
 * @param deliveryDay
 * @param deliveryDate
 * @returns excludes a day from delivery date if the delivery day is on Weekend
 */
function excludeWeekendDates(deliveryDay, deliveryDate) {
    switch (deliveryDay) {
        case 7:
        case 1:
            deliveryDate.add(deliveryDate.DAY_OF_MONTH, "1");
            dateRange.push(deliveryDate);
            return deliveryDate;
            break;
        default:
            return deliveryDate;
            break;
    }
}

/**
 * @param deliveryDate
 * @param dateRange
 * @returns excludes a day from delivery date if the delivery the delivery is on a public holiday
 */
function excludePublicHolidays(deliveryDate, dateRange) {
    var dateRangeCollection = dateRange.values();
    var dateRangeItr = dateRangeCollection.iterator();
    var publicHolidays = Site.getCurrent().preferences.custom.publicHolidays;
    while(dateRangeItr.hasNext()) {
        var indexedDate = dateRangeItr.next();
        var formatedDeliveryDate = StringUtils.formatCalendar(
                indexedDate, Resource.msg('year.month.date.pattern','shipping',null)
        );
        if (!empty(publicHolidays) && publicHolidays.valueOf(indexedDate) > -1) {
            deliveryDate.add(deliveryDate.DAY_OF_MONTH, "1");
            dateRange.put(deliveryDate, deliveryDate);
            var currentDeliveryDate = deliveryDate;
            currentDeliveryDate.add(currentDeliveryDate.DAY_OF_MONTH, "1");
            var deliveryOnSunday = currentDeliveryDate.get(currentDeliveryDate.DAY_OF_WEEK);
            if (deliveryOnSunday == 1) {
                dateRange.put(currentDeliveryDate, currentDeliveryDate);
            }
        }
    }
    return deliveryDate;
}

function includeAdditionalDaysForOptionProduct(deliveryDate, dateRange, optionProductShipmentDelay) {
    for (var i = 1; i <= optionProductShipmentDelay; i++) {
        var currentEndingDate = deliveryDate.time;
        var currentDate = new Calendar(currentEndingDate);
        currentDate.add(currentDate.DAY_OF_MONTH, i);
        dateRange.put(currentDate, currentDate);
    } 
    deliveryDate.add(deliveryDate.DAY_OF_MONTH, optionProductShipmentDelay);
}

function getShippingTime(shippingMethod) {
    var shippingCutOffTimePreference = Site.getCurrent().preferences.custom;
    var currentTime = Site.current.getCalendar().getTime();
    var currentDate = Site.current.getCalendar().getTime();
    var shippingDate = Site.current.getCalendar().getTime();
    var isEstimated = shippingMethod.custom.isEstimated ? true : false;
    currentDate.setHours(currentTime.getHours());
    currentDate.setMinutes(currentTime.getMinutes());
    currentDate.setSeconds(currentTime.getSeconds());
    shippingDate.setHours(!empty(shippingCutOffTimePreference) ? shippingCutOffTimePreference.shippingCutOffTimeHours : 0);
    shippingDate.setMinutes(!empty(shippingCutOffTimePreference) ? shippingCutOffTimePreference.shippingCutOffTimeMinutes : 0);
    shippingDate.setSeconds(0);
    if (shippingDate.valueOf() < currentDate.valueOf()) {
        shippingDate.setHours(shippingDate.getHours() + 12);
    }
    var diffMilliSeconds = Math.abs(shippingDate.valueOf() - currentDate.valueOf());
    var remainingTime = new Date(diffMilliSeconds);
    
    var shippingCutOffTime = {
            "hours" : remainingTime.getHours() || 0,
            "minutes" : remainingTime.getMinutes() || 0,
            "seconds" : remainingTime.getSeconds() || 0,
            "isEstimated" : isEstimated
    }
    return shippingCutOffTime;
}

module.exports = {
    getShippingDate: getShippingDate,
    getShippingTime: getShippingTime
    };