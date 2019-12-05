'use strict';

var ArrayList = require('dw/util/ArrayList');
var BasketMgr = require('dw/order/BasketMgr');
var Calendar = require('dw/util/Calendar');
var Site = require('dw/system/Site');
var StringUtils = require('dw/util/StringUtils');

function getShippingDate(shippingMethod) {
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
    
    while (productLineItemsItr.hasNext()) {
        var productLineItems = productLineItemsItr.next();
        if (productLineItems.custom.embossMessageLine1 || productLineItems.custom.engraveMessageLine1) {
            embossed = true;
        }
    }
    
    var basketLastModifiedTime = StringUtils.formatCalendar(
            new Calendar(basket.getLastModified()), 'h:mm a'
    )
    
    var isEstimated = shippingMethod.custom.isEstimated ? true : false;
    var shippingDays = shippingMethod.custom.estimatedArrivalTime ? shippingMethod.custom.estimatedArrivalTime : 0;
    var deliveryDaysBeforeNoon = shippingMethod.custom.daysBeforeNoon ? shippingMethod.custom.daysBeforeNoon : 0;
    var deliveryDaysAfterNoon = shippingMethod.custom.daysAfterNoon ? shippingMethod.custom.daysAfterNoon : 0;
    var optionProductShipmentDelay = shippingMethod.custom.optionProductShipmentDealy ? shippingMethod.custom.daysAfterNoon : 0;
    
    if (!isEstimated) {
        if (basketLastModifiedTime.indexOf('PM') > -1) {
            startingDeliveryDate = new Calendar(basket.getLastModified());
            endingDeliveryDate = new Calendar(basket.getLastModified());
            endingDeliveryDate.add(endingDeliveryDate.DAY_OF_MONTH, deliveryDaysAfterNoon);
            for (var i = 1; i <= deliveryDaysAfterNoon; i++) {
                var currentDate = new Calendar(basket.getLastModified());
                currentDate.add(currentDate.DAY_OF_MONTH, i);
                dateRange.push(currentDate);
            }
        } else {
            endingDeliveryDate = new Calendar(basket.getLastModified());
            endingDeliveryDate.add(endingDeliveryDate.DAY_OF_MONTH, deliveryDaysBeforeNoon);
            for (var i = 0; i <= deliveryDaysBeforeNoon; i++) {
                var currentDate = new Calendar(basket.getLastModified());
                currentDate.add(currentDate.DAY_OF_MONTH, i);
                dateRange.push(currentDate);
            }
        }
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
        formattedStartingDate = startingDeliveryDay + ", " + getFormatedDate(startingDeliveryDate);
        endingDeliveryDate = new Calendar(basket.getLastModified());
        endingDeliveryDate.add(endingDeliveryDate.DAY_OF_MONTH, splitedShippingDays[1]);
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
    
    for (var i = 0; i < dateRange.length; i++) {
        endingDeliveryDate = excludePublicHolidays(endingDeliveryDate, dateRange, dateRange[i]);
    }
    
    for (var i = 0; i < dateRange.length; i++) {
        var deliveryDay = dateRange[i].get(dateRange[i].DAY_OF_WEEK);
        endingDeliveryDate = excludeWeekendDates(deliveryDay, endingDeliveryDate);
    }
    
    endingDeliveryDay = changeNumberToDayName(endingDeliveryDate);
    formattedEndingDate = endingDeliveryDay + ", " +  getFormatedDate(endingDeliveryDate);
    var date = endingDeliveryDate.get(endingDeliveryDate.DAY_OF_MONTH);
    var monthName = getMonthName(endingDeliveryDate);
    var year = endingDeliveryDate.get(endingDeliveryDate.YEAR);
    
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
        }
    }
    var currentDeliveryDate = deliveryDate;
    currentDeliveryDate.add(currentDeliveryDate.DAY_OF_MONTH, "1");
    var deliveryOnSunday = currentDeliveryDate.get(currentDeliveryDate.DAY_OF_WEEK);
    if (deliveryOnSunday == 1) {
        dateRange.push(currentDeliveryDate);
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

function getMonthName(unformattedDate) {
    var monthNumber = unformattedDate.get(unformattedDate.MONTH);
    var monthName;
    switch (monthNumber) {
        case 0:
            monthName = "January";
            return monthName;
            break;
        case 1:
            monthName = "February";
            return monthName;
            break;
        case 2:
            monthName = "March";
            return monthName;
            break;
        case 3:
            monthName = "April";
            return monthName;
            break;
        case 4:
            monthName = "May";
            return monthName;
            break;
        case 5:
            monthName = "June";
            return monthName;
            break;
        case 6:
            monthName = "July";
            return monthName;
            break;
        case 7:
            monthName = "August";
            return monthName;
            break;
        case 8:
            monthName = "September";
            return monthName;
            break;
        case 9:
            monthName = "October";
            return monthName;
            break;
        case 10:
            monthName = "November";
            return monthName;
            break;
        case 11:
            monthName = "December";
            return monthName;
            break;
        default: 'Undefined';
            break;
    }
}

function getFormatedDate(unformattedDate) {
    var date = unformattedDate.get(unformattedDate.DAY_OF_MONTH);
    var month = getMonthName(unformattedDate);
    var year = unformattedDate.get(unformattedDate.YEAR);
    var formatedDate = date + " " + month + " " + year;
    return formatedDate;
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