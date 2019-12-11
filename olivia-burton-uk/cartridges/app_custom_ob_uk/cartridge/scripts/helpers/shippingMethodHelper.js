'use strict';

var ArrayList = require('dw/util/ArrayList');
var BasketMgr = require('dw/order/BasketMgr');
var Calendar = require('dw/util/Calendar');
var Resource = require('dw/web/Resource');
var Site = require('dw/system/Site');
var StringUtils = require('dw/util/StringUtils');

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
    var dateRange= new ArrayList();
    var embossed;
    var basketLastModified;
    
    if (basket) {
        var productLineItemsItr = basket.getAllProductLineItems().iterator();
        var basketLastModified = basket.getLastModified();
        while (productLineItemsItr.hasNext()) {
            var productLineItem = productLineItemsItr.next();
            if (!empty(productLineItem.custom.embossMessageLine1) || !empty(productLineItem.custom.engraveMessageLine1)) {
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
                dateRange.push(currentDate);
            }
            startingDeliveryDate = new Calendar(basketLastModified);
            startingDeliveryDate.add(startingDeliveryDate.DAY_OF_MONTH, splitedShippingDays[0]);
            endingDeliveryDate = new Calendar(basketLastModified);
            endingDeliveryDate.add(endingDeliveryDate.DAY_OF_MONTH, splitedShippingDays[1]);
            if (embossed) {
                endingDeliveryDate = includeAdditionalDaysForOptionProduct(endingDeliveryDate, dateRange, optionProductShipmentDelay);
            }
        } else {
            if (basketLastModifiedTime.indexOf('PM') > -1) {
                endingDeliveryDate = new Calendar(basketLastModified);
                endingDeliveryDate.add(endingDeliveryDate.DAY_OF_MONTH, deliveryDaysAfterNoon);
                for (var i = 1; i <= deliveryDaysAfterNoon; i++) {
                    var currentDate = new Calendar(basketLastModified);
                    currentDate.add(currentDate.DAY_OF_MONTH, i);
                    dateRange.push(currentDate);
                }
                if (embossed) {
                    endingDeliveryDate = includeAdditionalDaysForOptionProduct(endingDeliveryDate, dateRange, optionProductShipmentDelay);
                }
            } else {
                endingDeliveryDate = new Calendar(basketLastModified);
                endingDeliveryDate.add(endingDeliveryDate.DAY_OF_MONTH, deliveryDaysBeforeNoon);
                for (var i = 1; i <= deliveryDaysBeforeNoon; i++) {
                    var currentDate = new Calendar(basketLastModified);
                    currentDate.add(currentDate.DAY_OF_MONTH, i);
                    dateRange.push(currentDate);
                }
                if (embossed) {
                    endingDeliveryDate = includeAdditionalDaysForOptionProduct(endingDeliveryDate, dateRange, optionProductShipmentDelay);
                }
            }
        }
        
        if (isEstimated) {
            var deliveryDay = startingDeliveryDate.get(startingDeliveryDate.DAY_OF_WEEK);
            if (deliveryDay == 7) {
                startingDeliveryDate.add(startingDeliveryDate.DAY_OF_MONTH, "2");
                var currentStartignDate = startingDeliveryDate;
            }
            if (deliveryDay == 1) {
                startingDeliveryDate.add(startingDeliveryDate.DAY_OF_MONTH, "1");
            }
            startingDeliveryDate = excludePublicHolidays(startingDeliveryDate, dateRange);
        }
        
        endingDeliveryDate = excludeWeekendDates(endingDeliveryDate, dateRange);
        endingDeliveryDate = excludePublicHolidays(endingDeliveryDate, dateRange);
        
        formattedEndingDate = CommonUtils.getFormatedDate(endingDeliveryDate);
        
        if (isEstimated) {
            formattedStartingDate = CommonUtils.getFormatedDate(startingDeliveryDate);
            finalDeliveryDate = Resource.msg('delivery.between.callout.message','shipping',null) + formattedStartingDate + "-" + formattedEndingDate;
        } else {
            finalDeliveryDate = Resource.msg('delivery.on.callout.message','shipping',null) + formattedEndingDate;
        }
        
        dateRange = [];
        return finalDeliveryDate;
    }
}

/**
 * Excludes a day from delivery date if the delivery day is on Weekend
 * @param {Object} deliveryDate - calendar object of a deliveryDay
 * @param {Array} dateRange - array of a deliveryDates
 * @returns {Object} calendar object by adding an extra day in the delivery date if its weekend
 */
function excludeWeekendDates(deliveryDate, dateRange) {
    var i = 0;
    while (i < dateRange.length) {
        var currentIndexDate = dateRange.get(i);
        var deliveryDay = currentIndexDate.get(currentIndexDate.DAY_OF_WEEK);
        if (deliveryDay == 1 || deliveryDay == 7) {
            deliveryDate.add(deliveryDate.DAY_OF_MONTH, "1");
            dateRange.push(deliveryDate);
        }
        i++;
    }
    return deliveryDate;
}

/**
 * Excludes a day from delivery date if the delivery is on a public holiday
 * @param {Object} deliveryDate - calendar object of a deliveryDay
 * @param {Array} dateRange - array of a deliveryDate
 * @returns {Object} calendar object by adding an extra day if delivery is on public holiday
 */
function excludePublicHolidays(deliveryDate, dateRange) {
    var publicHolidays = new ArrayList(Site.getCurrent().preferences.custom.publicHolidays);
    var i = 0;
    while(i < dateRange.length) {
        var indexedDate = dateRange.get(i);
        var formatedDeliveryDate = StringUtils.formatCalendar(
                indexedDate, Resource.msg('year.month.date.pattern','shipping',null)
        );
        if (!empty(publicHolidays) && publicHolidays.contains(formatedDeliveryDate)) {
            deliveryDate.add(deliveryDate.DAY_OF_MONTH, "1");
            dateRange.push(deliveryDate);
            var currentDeliveryDate = deliveryDate;
            currentDeliveryDate.add(currentDeliveryDate.DAY_OF_MONTH, "1");
            var deliveryOnSunday = currentDeliveryDate.get(currentDeliveryDate.DAY_OF_WEEK);
            if (deliveryOnSunday == 1) {
                dateRange.push(currentDeliveryDate);
            }
        }
        i++;
    }
    return deliveryDate;
}

/**
 * Adds additional days into the delivery date if any of the product option is selected
 * @param {Object} deliveryDate - calendar object of a deliveryDay
 * @param {Array} dateRange - array of a deliveryDates
 * @param optionProductShipmentDelay
 * return {Object} deliveryDate - calendar object by adding extra days for option product delay
 */
function includeAdditionalDaysForOptionProduct(deliveryDate, dateRange, optionProductShipmentDelay) {
    for (var i = 1; i <= optionProductShipmentDelay; i++) {
        var currentEndingDate = deliveryDate.time;
        var currentDate = new Calendar(currentEndingDate);
        currentDate.add(currentDate.DAY_OF_MONTH, i);
        dateRange.push(currentDate);
    } 
    deliveryDate.add(deliveryDate.DAY_OF_MONTH, optionProductShipmentDelay);
    return deliveryDate;
}


/**
 * Creates an object of shipping cutoff time by adding the time defined in custom preference
 *     into the current time
 * @param {Object} shippingMethod - shipping method object
 * @returns {Object} an object that contains shipping cutoff time
 */
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