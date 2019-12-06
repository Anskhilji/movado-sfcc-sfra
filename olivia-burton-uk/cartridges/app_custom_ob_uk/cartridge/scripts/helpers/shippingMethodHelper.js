'use strict';

var ArrayList = require('dw/util/ArrayList');
var BasketMgr = require('dw/order/BasketMgr');
var Calendar = require('dw/util/Calendar');
var Site = require('dw/system/Site');
var StringUtils = require('dw/util/StringUtils');
var Resource = require('dw/web/Resource');

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
    var productLineItems;
    var embossed;
    var basketLastModified;
    
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
        var optionProductShipmentDelay = !empty(shippingMethod.custom.optionProductShipmentDealy) ? shippingMethod.custom.daysAfterNoon : 0;
        
        if (isEstimated) {
            var splitedShippingDays = shippingDays.split("-");
            for (var i = 0; i <= splitedShippingDays[1]; i++) {
                var currentDate = new Calendar(basketLastModified);
                currentDate.add(currentDate.DAY_OF_MONTH, i);
                dateRange.push(currentDate);
            }
            startingDeliveryDate = new Calendar(basketLastModified);
            startingDeliveryDate.add(startingDeliveryDate.DAY_OF_MONTH, splitedShippingDays[0]);
            endingDeliveryDate = new Calendar(basketLastModified);
            endingDeliveryDate.add(endingDeliveryDate.DAY_OF_MONTH, splitedShippingDays[1]);
        } else {
            if (basketLastModifiedTime.indexOf('PM') > -1) {
                endingDeliveryDate = new Calendar(basketLastModified);
                endingDeliveryDate.add(endingDeliveryDate.DAY_OF_MONTH, deliveryDaysAfterNoon);
                for (var i = 1; i <= deliveryDaysAfterNoon; i++) {
                    var currentDate = new Calendar(basketLastModified);
                    currentDate.add(currentDate.DAY_OF_MONTH, i);
                    dateRange.push(currentDate);
                }
            } else {
                endingDeliveryDate = new Calendar(basketLastModified);
                endingDeliveryDate.add(endingDeliveryDate.DAY_OF_MONTH, deliveryDaysBeforeNoon);
                for (var i = 0; i <= deliveryDaysBeforeNoon; i++) {
                    var currentDate = new Calendar(basketLastModified);
                    currentDate.add(currentDate.DAY_OF_MONTH, i);
                    dateRange.push(currentDate);
                }
            }
        }
        
        if (embossed) {
            for (var i = 1; i <= optionProductShipmentDelay; i++) {
                var currentEndingDate = endingDeliveryDate.time;
                var currentDate = new Calendar(currentEndingDate);
                currentDate.add(currentDate.DAY_OF_MONTH, i);
                dateRange.push(currentDate);
            } 
            endingDeliveryDate.add(endingDeliveryDate.DAY_OF_MONTH, optionProductShipmentDelay);
        }
        
        if (isEstimated) {
            for (var i = 0; i < dateRange.length; i++) {
                startingDeliveryDate = excludePublicHolidays(startingDeliveryDate, dateRange, dateRange[i]);
            }
            
            for (var i = 0; i < dateRange.length; i++) {
                var deliveryDay = dateRange[i].get(dateRange[i].DAY_OF_WEEK);
                startingDeliveryDate = excludeWeekendDates(deliveryDay, startingDeliveryDate);
            }
            formattedStartingDate = CommonUtils.getFormatedDate(startingDeliveryDate);
        }
        
        for (var i = 0; i < dateRange.length; i++) {
            endingDeliveryDate = excludePublicHolidays(endingDeliveryDate, dateRange, dateRange[i]);
        }
        
        for (var i = 0; i < dateRange.length; i++) {
            var deliveryDay = dateRange[i].get(dateRange[i].DAY_OF_WEEK);
            endingDeliveryDate = excludeWeekendDates(deliveryDay, endingDeliveryDate);
        }
        
        formattedEndingDate = CommonUtils.getFormatedDate(endingDeliveryDate);
        
        if (isEstimated) {
            finalDeliveryDate = "Delivery between: " + formattedStartingDate + "-" + formattedEndingDate;
        } else {
            finalDeliveryDate = "Delivery on: " + formattedEndingDate;
        }
        
        dateRange = [];
        return finalDeliveryDate;
    }
}

function excludeWeekendDates(deliveryDay, deliveryDate) {
    switch (deliveryDay) {
        case 7:
            deliveryDate.add(deliveryDate.DAY_OF_MONTH, "1");
            return deliveryDate;
            break;
        case 1:
            deliveryDate.add(deliveryDate.DAY_OF_MONTH, "1");
            return deliveryDate;
            break;
        default:
            return deliveryDate;
            break;
    }
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
            var currentDeliveryDate = deliveryDate;
            currentDeliveryDate.add(currentDeliveryDate.DAY_OF_MONTH, "1");
            var deliveryOnSunday = currentDeliveryDate.get(currentDeliveryDate.DAY_OF_WEEK);
            if (deliveryOnSunday == 1) {
                dateRange.push(currentDeliveryDate);
            }
        }
    }
    return deliveryDate;
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
    shippingDate.setHours(shippingCutOffTimePreference.shippingCutOffTimeHours);
    shippingDate.setMinutes(shippingCutOffTimePreference.shippingCutOffTimeMinutes);
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