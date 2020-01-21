'use strict';

var ArrayList = require('dw/util/ArrayList');
var BasketMgr = require('dw/order/BasketMgr');
var Calendar = require('dw/util/Calendar');
var Resource = require('dw/web/Resource');
var Site = require('dw/system/Site');
var StringUtils = require('dw/util/StringUtils');
var System = require('dw/system/System');

var CommonUtils = require('*/cartridge/utils/commonUtils');
var Constants = require('~/cartridge/scripts/helpers/utils/Constants');

function getShippingDate(shippingMethod) {
    var siteCustomPreferences = Site.getCurrent().preferences.custom;
    var cutOffTimeHours = siteCustomPreferences.shippingCutOffTimeHours ? siteCustomPreferences.shippingCutOffTimeHours : 0;
    var cutOffTimeMinutes = siteCustomPreferences.shippingCutOffTimeHours ? siteCustomPreferences.shippingCutOffTimeMinutes : 0;
    var calendar = System.getCalendar();
    var cuttOffTime =  CommonUtils.getDate(cutOffTimeHours, cutOffTimeMinutes);
    var basket = BasketMgr.getCurrentBasket();
    var startingDeliveryDate;
    var endingDeliveryDate = System.getCalendar();
    var endingDeliveryDay;
    var startingDeliveryDay;
    var finalDeliveryDate;
    var formattedStartingDate;
    var formattedEndingDate;
    var startigDateRange= new ArrayList();
    var dateRange= new ArrayList();
    var embossed;
    var basketLastModified;
    
    if (basket) {
        var productLineItemsItr = basket.getAllProductLineItems().iterator();
        while (productLineItemsItr.hasNext()) {
            var productLineItem = productLineItemsItr.next();
            if (!empty(productLineItem.custom.embossMessageLine1) || !empty(productLineItem.custom.engraveMessageLine1)) {
                embossed = true;
            }
        }
        
        var isExpress;
        
        if (!empty(shippingMethod.custom.isExpress)) {
            isExpress = shippingMethod.custom.isExpress ? true : false;
        } else {
            isExpress  = false;
        }
        
        var shippingDays = !empty(shippingMethod.custom.estimatedArrivalTime) ? shippingMethod.custom.estimatedArrivalTime : '0-0';
        var deliveryDaysBeforeNoon = !empty(shippingMethod.custom.daysBeforeNoon) ? shippingMethod.custom.daysBeforeNoon : 0;
        var deliveryDaysAfterNoon = !empty(shippingMethod.custom.daysAfterNoon) ? shippingMethod.custom.daysAfterNoon : 0;
        var optionProductShipmentDelay = !empty(shippingMethod.custom.optionProductShipmentDelay) ? shippingMethod.custom.optionProductShipmentDelay : 0;
        
        if (!isExpress) {
            var splitedShippingDays = shippingDays.split("-");
            for (var i = 0; i <= splitedShippingDays[0]; i++) {
                var currentDate = System.getCalendar();
                currentDate.add(currentDate.DAY_OF_MONTH, i);
                startigDateRange.push(currentDate);
            }
            
            var differenceOfDays = splitedShippingDays[1] - splitedShippingDays[0];
            
            startingDeliveryDate = System.getCalendar();
            startingDeliveryDate.add(startingDeliveryDate.DAY_OF_MONTH, splitedShippingDays[0]);
            
            if (embossed) {
                startingDeliveryDate = includeAdditionalDaysForOptionProduct(startingDeliveryDate, startigDateRange, optionProductShipmentDelay);
            }
            
            if (!isExpress) {
                startingDeliveryDate = excludeNonWorkingDays(startingDeliveryDate, startigDateRange);
            }
            
            for (var i = 0; i <= differenceOfDays; i++) {
                var startingDate;
                if (startigDateRange.length >= 1) {
                    startingDate = startigDateRange[startigDateRange.length - 1];
                }
                var currentDate = new Calendar(startingDate.time);
                currentDate.add(currentDate.DAY_OF_MONTH, i);
                dateRange.push(currentDate);
            }
            endingDeliveryDate = new Calendar(startingDeliveryDate.time);
            endingDeliveryDate.add(endingDeliveryDate.DAY_OF_MONTH, differenceOfDays);
        } else {
            if (calendar.before(cuttOffTime)) {
                endingDeliveryDate = System.getCalendar();
                endingDeliveryDate.add(endingDeliveryDate.DAY_OF_MONTH, deliveryDaysBeforeNoon);
                for (var i = 0; i <= deliveryDaysBeforeNoon; i++) {
                    var currentDate = System.getCalendar();
                    currentDate.add(currentDate.DAY_OF_MONTH, i);
                    dateRange.push(currentDate);
                }
                if (embossed) {
                    endingDeliveryDate = includeAdditionalDaysForOptionProduct(endingDeliveryDate, dateRange, optionProductShipmentDelay);
                }
            } else if (calendar.after(cuttOffTime) || calendar.equals(cuttOffTime)) {
                endingDeliveryDate = System.getCalendar();
                endingDeliveryDate.add(endingDeliveryDate.DAY_OF_MONTH, deliveryDaysAfterNoon);
                for (var i = 0; i <= deliveryDaysAfterNoon; i++) {
                    var currentDate = System.getCalendar();
                    currentDate.add(currentDate.DAY_OF_MONTH, i);
                    dateRange.push(currentDate);
                }
                if (embossed) {
                    endingDeliveryDate = includeAdditionalDaysForOptionProduct(endingDeliveryDate, dateRange, optionProductShipmentDelay);
                }
            } else {
                endingDeliveryDate = System.getCalendar();
                endingDeliveryDate.add(endingDeliveryDate.DAY_OF_MONTH, deliveryDaysAfterNoon);
                for (var i = 0; i <= deliveryDaysAfterNoon; i++) {
                    var currentDate = System.getCalendar();
                    currentDate.add(currentDate.DAY_OF_MONTH, i);
                    dateRange.push(currentDate);
                }
                if (embossed) {
                    endingDeliveryDate = includeAdditionalDaysForOptionProduct(endingDeliveryDate, dateRange, optionProductShipmentDelay);
                }
            
            }
        }
        
        endingDeliveryDate = excludeNonWorkingDays(endingDeliveryDate, dateRange);
        
        formattedEndingDate = CommonUtils.getFormatedDate(endingDeliveryDate);
        
        if (!isExpress) {
            if (differenceOfDays == 0 && embossed) {
                formattedStartingDate = CommonUtils.getFormatedDate(startingDeliveryDate);
                finalDeliveryDate = Resource.msg('delivery.between.callout.message','shipping',null) + formattedStartingDate + "-" + formattedStartingDate;
            } else {
                formattedStartingDate = CommonUtils.getFormatedDate(startingDeliveryDate);
                finalDeliveryDate = Resource.msg('delivery.between.callout.message','shipping',null) + formattedStartingDate + "-" + formattedEndingDate;
            }
        } else {
            finalDeliveryDate = Resource.msg('delivery.on.callout.message','shipping',null) + formattedEndingDate;
        }
        startigDateRange = [];
        dateRange = [];
        return finalDeliveryDate;
    }
}

/**
 * Excludes a day from delivery date if the delivery is on non working day
 * @param {Object} deliveryDate - calendar object of a deliveryDay
 * @param {Array} dateRange - array of a deliveryDate
 * @returns {Object} calendar object by adding an extra day if delivery is on non working day
 */
function excludeNonWorkingDays(deliveryDate, dateRange) {
    var publicHolidays = new ArrayList(Site.getCurrent().preferences.custom.publicHolidays);
    var i = 0;
    while(i < dateRange.length) {
        var indexedDate = dateRange.get(i);
        var formatedDeliveryDate = StringUtils.formatCalendar(
                indexedDate, Constants.YEAR_MONTH_DATE_PATTERN
        );
        var deliveryDay = indexedDate.get(indexedDate.DAY_OF_WEEK);
        if ((!empty(publicHolidays) && publicHolidays.contains(formatedDeliveryDate)) || deliveryDay == 1 || deliveryDay == 7 ) {
            deliveryDate.add(deliveryDate.DAY_OF_MONTH, "1");
            var currentDeliveryDate = new Calendar(deliveryDate.time);
            dateRange.push(currentDeliveryDate);
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
    var isExpress = shippingMethod.custom.isExpress ? shippingMethod.custom.isExpress : false;
    currentDate.setHours(currentTime.getHours());
    currentDate.setMinutes(currentTime.getMinutes());
    currentDate.setSeconds(currentTime.getSeconds());
    shippingDate.setHours(!empty(shippingCutOffTimePreference) ? shippingCutOffTimePreference.shippingCutOffTimeHours : 0);
    shippingDate.setMinutes(!empty(shippingCutOffTimePreference) ? shippingCutOffTimePreference.shippingCutOffTimeMinutes : 0);
    shippingDate.setSeconds(0);
    if (shippingDate.valueOf() < currentDate.valueOf()) {
        shippingDate.setHours(shippingDate.getHours() + 24);
    }
    var diffMilliSeconds = Math.abs(shippingDate.valueOf() - currentDate.valueOf());
    var remainingTime = new Date(diffMilliSeconds);

    var shippingCutOffTime = {
            "hours" : remainingTime.getHours() || 0,
            "minutes" : remainingTime.getMinutes() || 0,
            "seconds" : remainingTime.getSeconds() || 0,
            "isExpress" : isExpress
    }
    return shippingCutOffTime;
}

module.exports = {
    getShippingDate: getShippingDate,
    getShippingTime: getShippingTime
};