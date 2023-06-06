'use strict';

var OrderManager = require('dw/order/OrderMgr');
var PaymentMgr = require('dw/order/PaymentMgr');
var ProductMgr = require('dw/catalog/ProductMgr');
var ProductLineItem = require('dw/order/ProductLineItem');
var PriceBookMgr = require('dw/catalog/PriceBookMgr');
var ShippingLineItem = require('dw/order/ShippingLineItem');
var Order = require('dw/order/Order');
var Logger = require('dw/system/Logger');
var File = require('dw/io/File');
var FileHelper = require('*/cartridge/scripts/file/FileHelper');
var FileWriter = require('dw/io/FileWriter');
var XMLStreamWriter = require('dw/io/XMLStreamWriter');
var StringUtils = require('dw/util/StringUtils');
var ArrayList = require('dw/util/ArrayList');
var Calendar = require('dw/util/Calendar');
var Site = require('dw/system/Site');
var Transaction = require('dw/system/Transaction');
var constants = require('app_custom_movado/cartridge/scripts/helpers/constants.js');
var Resource = require('dw/web/Resource');
var crossBorderUtils = require('~/cartridge/scripts/helpers/utils/crossborderUtils.js');

var GIFTWRAPMESSAGE = 'GIFTMESSAGE';
var GIFTWRAP = 'GIFTWRAP';
var ENGRAVING = 'ENGRAVING';
var EMBOSSING = 'EMBOSSING';
var HORIZONTAL = 'Horizontal';
var VERTICAL = 'Vertical';
var GIFTWRAPPED = 'GiftWrapped';
var ENGRAVED = 'Engraved';
var EMBOSSED = 'Embossed';
var ZERO = 0.00;
var TEN = 10;
var NINETY = 90;
var TWO_DECIMAL_PLACES = 2;
var ORDER_EXPORT_STATUS = '2';
var DATE_FORMAT = 'yyyyMMdd';
var TIME_FORMAT = 'yyyyMMddhhmmss';
var FIXEDFREIGHT = 'FIXEDFREIGHT';

var orderFailedArray = new ArrayList();
var fileExtension = '.xml';
var exportLogger = Logger.getLogger('SAPOrderFeed');

/**
* Splits the string into multiple based on the passed limit.
* @param {string} message String to be splitted.
* @param {number} limit limit
* @return {array} Array of splitted string.
*/
function limitAndSplit(message, limit) {
    var splittedArray = new ArrayList();
    var tempArray = new ArrayList();
    var tempString = message;

    if (tempString.length > limit) {
        while (tempString.length > limit) {
            var whiteSpaceTest = tempString.substr(0, limit);
            var lastSpace = whiteSpaceTest.lastIndexOf(' ');
            if (lastSpace === -1 || lastSpace === 0) {
                lastSpace = limit - 1;
            }
            var firstPart = tempString.substr(0, lastSpace);
            tempArray.add(firstPart);
            var otherPart = tempString.slice(lastSpace + 1);
            if (otherPart.length <= limit) {
                tempArray.add(otherPart);
            }
            tempString = otherPart;
        }
    } else {
        tempArray.add(tempString);
    }
    splittedArray = tempArray;
    return splittedArray;
}

/**
* Formats the date as per the given format.
* @param {date} dateToBeFormatted Date to be formatted.
* @param {string} pattern Date pattern as string.
* @returns {string} Formatted Date.
*/
function formatDate(dateToBeFormatted, pattern) {
    return StringUtils.formatCalendar(new Calendar(dateToBeFormatted), pattern);
}


/**
* Calculate the billability for the Line Item and popupates the custom attribute on PLI.
* @param {ProductLineItem} lineItem Line Item.
* @returns {string}
*/
function isThisBillableItem(lineItem) {
    var isBillable = 'N';
    Transaction.wrap(function () {
        if (lineItem.basePrice.value > 0) {
            lineItem.custom.isThisBillable = true;
            isBillable = 'Y';
        } else {
            lineItem.custom.isThisBillable = false;
        }
    });
    return isBillable;
}

/**
* Calculate the duty amount for the line item.
* @param {ProductLineItem} lineItem Line Item.
* @returns {Number} duty amount
*/
function getLineItemDutyAmount(lineItem) {
    return parseFloat(ZERO).toFixed(TWO_DECIMAL_PLACES);
}

/**
* Calculate the promo amount for the line item against esw order.
* @param {ProductLineItem} lineItem Line Item.
* @param {String} shipping country
* @returns {Number} duty amount
*/
function getLineItemPromoAmount(lineItem, shippingCountry) {
    var crossBorderPromoAmount;
    var eswRetailerCurrencyItemPriceInfoBeforeDiscount = !empty(lineItem.custom.eswRetailerCurrencyItemPriceInfoBeforeDiscount) ?
            lineItem.custom.eswRetailerCurrencyItemPriceInfoBeforeDiscount : parseFloat(ZERO).toFixed(TWO_DECIMAL_PLACES);
    var eswRetailerCurrencyItemPriceInfo = !empty(lineItem.custom.eswRetailerCurrencyItemPriceInfo) ?
            lineItem.custom.eswRetailerCurrencyItemPriceInfo : parseFloat(ZERO).toFixed(TWO_DECIMAL_PLACES);
    var eswRetailerCurrencyItemSubTotal = !empty(lineItem.custom.eswRetailerCurrencyItemSubTotal) ?
            lineItem.custom.eswRetailerCurrencyItemSubTotal : parseFloat(ZERO).toFixed(TWO_DECIMAL_PLACES);
    var eswRetailerCurrencyItemDuty = !empty(lineItem.custom.eswRetailerCurrencyItemDuty) ?
            lineItem.custom.eswRetailerCurrencyItemDuty : parseFloat(ZERO).toFixed(TWO_DECIMAL_PLACES);
    var eswRetailerCurrencyItemTaxes = !empty(lineItem.custom.eswRetailerCurrencyItemTaxes) ?
            lineItem.custom.eswRetailerCurrencyItemTaxes : parseFloat(ZERO).toFixed(TWO_DECIMAL_PLACES);
    var eswRetailerCurrencyItemOtherTaxes = !empty(lineItem.custom.eswRetailerCurrencyItemOtherTaxes) ?
            lineItem.custom.eswRetailerCurrencyItemOtherTaxes : parseFloat(ZERO).toFixed(TWO_DECIMAL_PLACES);
    if(lineItem.custom.eswRetailerCurrencyItemPriceInfoBeforeDiscount > ZERO && lineItem.bonusProductLineItem !== true) {
        if (shippingCountry.value === 'CA') {
            crossBorderPromoAmount = (((parseFloat(eswRetailerCurrencyItemPriceInfoBeforeDiscount) - parseFloat(eswRetailerCurrencyItemPriceInfo)) * parseFloat(eswRetailerCurrencyItemSubTotal)) / (parseFloat(eswRetailerCurrencyItemSubTotal) + parseFloat(eswRetailerCurrencyItemDuty))).toFixed(TWO_DECIMAL_PLACES);
        } else {
            crossBorderPromoAmount = (((parseFloat(eswRetailerCurrencyItemPriceInfoBeforeDiscount) - parseFloat(eswRetailerCurrencyItemPriceInfo)) * parseFloat(eswRetailerCurrencyItemSubTotal)) / (parseFloat(eswRetailerCurrencyItemSubTotal) + parseFloat(eswRetailerCurrencyItemDuty) + parseFloat(eswRetailerCurrencyItemTaxes) + parseFloat(eswRetailerCurrencyItemOtherTaxes))).toFixed(TWO_DECIMAL_PLACES);
        }
    } else if (lineItem.bonusProductLineItem) {
        crossBorderPromoAmount = (((parseFloat(eswRetailerCurrencyItemPriceInfoBeforeDiscount) - ZERO) * 1) / (1)).toFixed(TWO_DECIMAL_PLACES);
    } else {
        crossBorderPromoAmount = parseFloat(ZERO).toFixed(TWO_DECIMAL_PLACES);
    }
    return crossBorderPromoAmount;
}

/**
* Calculate the promo amount for the line item against esw order.
* @param {ProductLineItem} lineItem Line Item.
* @param {String} shipping country
* @returns {Number} duty amount
*/
function getLineItemConsumerPromoAmount(lineItem, shippingCountry) {
    var crossBorderConsumerPromoAmount;
    var eswShopperCurrencyItemPriceInfoBeforeDiscount = !empty(lineItem.custom.eswShopperCurrencyItemPriceInfoBeforeDiscount) ?
            lineItem.custom.eswShopperCurrencyItemPriceInfoBeforeDiscount : parseFloat(ZERO).toFixed(TWO_DECIMAL_PLACES);
    var eswShopperCurrencyItemPriceInfo = !empty(lineItem.custom.eswShopperCurrencyItemPriceInfo) ?
            lineItem.custom.eswShopperCurrencyItemPriceInfo : parseFloat(ZERO).toFixed(TWO_DECIMAL_PLACES);
    var eswShopperCurrencyItemSubTotal = !empty(lineItem.custom.eswShopperCurrencyItemSubTotal) ?
            lineItem.custom.eswShopperCurrencyItemSubTotal : parseFloat(ZERO).toFixed(TWO_DECIMAL_PLACES);
    var eswShopperCurrencyItemDuty = !empty(lineItem.custom.eswShopperCurrencyItemDuty) ?
            lineItem.custom.eswShopperCurrencyItemDuty : parseFloat(ZERO).toFixed(TWO_DECIMAL_PLACES);
    var eswShopperCurrencyItemTaxes = !empty(lineItem.custom.eswShopperCurrencyItemTaxes) ?
            lineItem.custom.eswShopperCurrencyItemTaxes : parseFloat(ZERO).toFixed(TWO_DECIMAL_PLACES);
    var eswShopperCurrencyItemOtherTaxes = !empty(lineItem.custom.eswShopperCurrencyItemOtherTaxes) ?
            lineItem.custom.eswShopperCurrencyItemOtherTaxes : parseFloat(ZERO).toFixed(TWO_DECIMAL_PLACES);
    if (lineItem.custom.eswShopperCurrencyItemPriceInfoBeforeDiscount > ZERO && eswShopperCurrencyItemSubTotal !== ZERO) {
        if (shippingCountry.value === 'CA') {
            crossBorderConsumerPromoAmount = (((parseFloat(eswShopperCurrencyItemPriceInfoBeforeDiscount) - parseFloat(eswShopperCurrencyItemPriceInfo)) * parseFloat(eswShopperCurrencyItemSubTotal)) / (parseFloat(eswShopperCurrencyItemSubTotal) + parseFloat(eswShopperCurrencyItemDuty))).toFixed(TWO_DECIMAL_PLACES);
        } else {
            crossBorderConsumerPromoAmount = (((parseFloat(eswShopperCurrencyItemPriceInfoBeforeDiscount) - parseFloat(eswShopperCurrencyItemPriceInfo)) * parseFloat(eswShopperCurrencyItemSubTotal)) / (parseFloat(eswShopperCurrencyItemSubTotal) + parseFloat(eswShopperCurrencyItemDuty) + parseFloat(eswShopperCurrencyItemTaxes) + parseFloat(eswShopperCurrencyItemOtherTaxes))).toFixed(TWO_DECIMAL_PLACES);
        }
    } else if (eswShopperCurrencyItemSubTotal === ZERO) {
        crossBorderConsumerPromoAmount = (((parseFloat(eswShopperCurrencyItemPriceInfoBeforeDiscount) - ZERO) * 1) / (1)).toFixed(TWO_DECIMAL_PLACES);
    } else {
        crossBorderConsumerPromoAmount = parseFloat(ZERO).toFixed(TWO_DECIMAL_PLACES);
    }
    return crossBorderConsumerPromoAmount;
}

/**
* Calculate the sub total for the line item against esw order.
* @param {ProductLineItem} lineItem Line Item.
* @returns {Number} duty amount
*/
function getLineItemSubTotal(lineItem) {
    var crossBorderSubTotal;
    if (lineItem.bonusProductLineItem) {
        crossBorderSubTotal = parseFloat(ZERO).toFixed(TWO_DECIMAL_PLACES);
    } else {
        crossBorderSubTotal = !empty(lineItem.custom.eswRetailerCurrencyItemSubTotal) ? 
                parseFloat(lineItem.custom.eswRetailerCurrencyItemSubTotal).toFixed(TWO_DECIMAL_PLACES) : parseFloat(ZERO).toFixed(TWO_DECIMAL_PLACES);
    }
    return crossBorderSubTotal;
}

/**
* Calculate the gross value for the line item against esw order.
* @param {ProductLineItem} lineItem Line Item.
* @param {String} shipping country
* @returns {Number} gross value
*/
function getLineItemCrossBorderGrossValue(lineItem, shippingCountry) {
    var promoAmount = getLineItemPromoAmount(lineItem, shippingCountry);
    var eswRetailerCurrencyItemSubTotal = !empty(lineItem.custom.eswRetailerCurrencyItemSubTotal) ? lineItem.custom.eswRetailerCurrencyItemSubTotal
            : parseFloat(ZERO).toFixed(TWO_DECIMAL_PLACES);
    var crossBorderGrossValue = (parseFloat(promoAmount) + parseFloat(eswRetailerCurrencyItemSubTotal)).toFixed(TWO_DECIMAL_PLACES);
    return crossBorderGrossValue;
}

/**
* Calculate the gross value for the line item against esw order.
* @param {ProductLineItem} lineItem Line Item.
* @returns {Number} gross value
*/
function getLineItemCrossBorderConsumerGrossValue(lineItem) {
    var consumerPromoAmount = getLineItemConsumerPromoAmount(lineItem, shippingCountry);
    var eswShopperCurrencyItemSubTotal = !empty(lineItem.custom.eswShopperCurrencyItemSubTotal) ? lineItem.custom.eswShopperCurrencyItemSubTotal
            : parseFloat(ZERO).toFixed(TWO_DECIMAL_PLACES);
    var crossBorderConsumerGrossValue = (parseFloat(promoAmount) + parseFloat(eswShopperCurrencyItemSubTotal)).toFixed(TWO_DECIMAL_PLACES);
    return crossBorderConsumerGrossValue;
}

/**
* find if line item consumer tax by MGI or esw.
* @param {String} esw order no.
* @returns {String} Y or N
*/
function isLineItemConsTaxByMGI(eswOrderNo, isEswEnabled) {
    if (isEswEnabled) {
        var isLineItemConsTaxByMGI = empty(eswOrderNo) ? 'Y' : 'N';
        return isLineItemConsTaxByMGI;
    }
    return '';
}

/**
* Calculate the consumer gross value for the line item.
* @param {ProductLineItem} lineItem Line Item.
* @param {String} shipping country
* @returns {Number} consumer gross value
*/
function getLineItemConsumerGrossValue(lineItem, isEswEnabled, shippingCountry) {
    if (isEswEnabled) {
        var consumerPromoAmount = getLineItemConsumerPromoAmount(lineItem, shippingCountry);
        var eswShopperCurrencyItemSubTotal = !empty(lineItem.custom.eswShopperCurrencyItemSubTotal) ? lineItem.custom.eswShopperCurrencyItemSubTotal
                : parseFloat(ZERO).toFixed(TWO_DECIMAL_PLACES);
        var crossBorderConsumerGrossValue = (parseFloat(consumerPromoAmount) + parseFloat(eswShopperCurrencyItemSubTotal)).toFixed(TWO_DECIMAL_PLACES);
        return crossBorderConsumerGrossValue;
    }
    return '';
}

/**
* Calculate the consumer sub total for the line item.
* @param {ProductLineItem} lineItem Line Item.
* @returns {Number} consumer gross value
*/
function getLineItemConsumerSubTotal(lineItem, isEswEnabled) {
    var consumerSubTotal;
    if (isEswEnabled && !lineItem.bonusProductLineItem) {
        consumerSubTotal = !empty(lineItem.custom.eswShopperCurrencyItemSubTotal) ? 
                lineItem.custom.eswShopperCurrencyItemSubTotal : parseFloat(ZERO).toFixed(TWO_DECIMAL_PLACES);
        return parseFloat(consumerSubTotal).toFixed(TWO_DECIMAL_PLACES);
    } else if (lineItem.bonusProductLineItem) {
        consumerSubTotal = parseFloat(ZERO).toFixed(TWO_DECIMAL_PLACES);
        return consumerSubTotal;
    } else {
        return '';
    }
}

/**
* Calculate the consumer tax amount for the line item.
* @param {ProductLineItem} lineItem Line Item.
* @returns {Number} consumer tax amount
*/
function getLineItemConsumerTaxAmount(lineItem, isEswEnabled) {
    var consumerTaxAmount;
    if (isEswEnabled && !lineItem.bonusProductLineItem) {
        var eswShopperCurrencyItemTaxes = !empty(lineItem.custom.eswShopperCurrencyItemTaxes) ?
                lineItem.custom.eswShopperCurrencyItemTaxes : parseFloat(ZERO).toFixed(TWO_DECIMAL_PLACES);
        var eswShopperCurrencyItemOtherTaxes = !empty(lineItem.custom.eswShopperCurrencyItemOtherTaxes) ?
                lineItem.custom.eswShopperCurrencyItemOtherTaxes : parseFloat(ZERO).toFixed(TWO_DECIMAL_PLACES);
        consumerTaxAmount = parseFloat(eswShopperCurrencyItemTaxes + eswShopperCurrencyItemOtherTaxes).toFixed(TWO_DECIMAL_PLACES);
        return consumerTaxAmount;
    } else if (lineItem.bonusProductLineItem) {
        consumerTaxAmount = eswShopperCurrencyItemTaxes = parseFloat(ZERO).toFixed(TWO_DECIMAL_PLACES);
        return consumerTaxAmount;
    } else {
        return '';
    }
}

/**
* Calculate the consumer duty amount for the line item.
* @param {ProductLineItem} lineItem Line Item.
* @returns {Number} consumer duty amount
*/
function getLineItemConsumerDutyAmount(lineItem, isEswEnabled) {
    var consumerDutyAmount;
    if (isEswEnabled && !lineItem.bonusProductLineItem) {
        consumerDutyAmount = !empty(lineItem.custom.eswShopperCurrencyItemDuty) ?
                parseFloat(lineItem.custom.eswShopperCurrencyItemDuty).toFixed(TWO_DECIMAL_PLACES) : parseFloat(ZERO).toFixed(TWO_DECIMAL_PLACES);
        return consumerDutyAmount;
    } else if (lineItem.bonusProductLineItem) {
        consumerDutyAmount = parseFloat(ZERO).toFixed(TWO_DECIMAL_PLACES);
        return consumerDutyAmount;
    } else {
        return '';
    }

}

/**
* Calculate the consumer net amount for the line item.
* @param {ProductLineItem} lineItem Line Item.
* @returns {Number} consumer net amount
*/
function getLineItemConsumerNetAmount(order, lineItem, isEswEnabled, eswOrderNo) {
    var consumerNetAmount;
    if (isEswEnabled && !lineItem.bonusProductLineItem) {
        var consumerSubTotal = parseFloat(getLineItemConsumerSubTotal(lineItem, isEswEnabled)).toFixed(TWO_DECIMAL_PLACES);
        var consumerDutyAmount = parseFloat(getLineItemConsumerDutyAmount(lineItem, isEswEnabled)).toFixed(TWO_DECIMAL_PLACES);
        var consumerTaxAmount = parseFloat(getLineItemConsumerTaxAmount(lineItem, isEswEnabled)).toFixed(TWO_DECIMAL_PLACES);
        consumerNetAmount = (parseFloat(consumerSubTotal) + parseFloat(consumerDutyAmount) + parseFloat(consumerTaxAmount)).toFixed(TWO_DECIMAL_PLACES);
        return consumerNetAmount;
    } else if (lineItem.bonusProductLineItem) {
        consumerNetAmount = parseFloat(ZERO).toFixed(TWO_DECIMAL_PLACES);
        return consumerNetAmount;
    } else {
        return '';
    }
    
}

/**
* Calculate the shipping consumer net amount for the line item.
* @param {ProductLineItem} lineItem Line Item.
* @returns {Number} shipping consumer net amount
*/
function getShippingConsumerNetAmount(order, isEswEnabled) {
    if (isEswEnabled) {
        var eswShopperCurrencyDelivery = !empty(order.custom.eswShopperCurrencyDelivery) ?
                order.custom.eswShopperCurrencyDelivery : parseFloat(ZERO).toFixed(TWO_DECIMAL_PLACES);
        var eswShopperCurrencyDeliveryDuty = !empty(order.custom.eswShopperCurrencyDeliveryDuty) ?
                order.custom.eswShopperCurrencyDeliveryDuty : parseFloat(ZERO).toFixed(TWO_DECIMAL_PLACES);
        var eswShopperCurrencyDeliveryTaxes = !empty(order.custom.eswShopperCurrencyDeliveryTaxes) ?
                order.custom.eswShopperCurrencyDeliveryTaxes : parseFloat(ZERO).toFixed(TWO_DECIMAL_PLACES);
        var shippingConsumerNetAmount = (parseFloat(eswShopperCurrencyDelivery) + parseFloat(eswShopperCurrencyDeliveryDuty)
                + parseFloat(eswShopperCurrencyDeliveryTaxes)).toFixed(TWO_DECIMAL_PLACES);
        return shippingConsumerNetAmount;
    }
    return '';
}

/**
* Calculate the tax1 for cross border orders for the line item.
* @param {ProductLineItem} lineItem Line Item.
* @returns {Number} tax1 for corss border orders
*/
function getLineItemCrossBorderTax1(lineItem, isEswEnabled) {
    if (isEswEnabled) {
        return parseFloat(ZERO).toFixed(TWO_DECIMAL_PLACES);
    }
    return '';
}

/**
* Calculate the net amount for cross border orders for the line item.
* @param {ProductLineItem} lineItem Line Item.
* @returns {Number} net amount for corss border orders
*/
function getLineItemCrossBorderNetAmount(lineItem, isEswEnabled) {
    var crossBorderNetAmount;
    if (isEswEnabled && !lineItem.bonusProductLineItem) {
        crossBorderNetAmount = !empty(lineItem.custom.eswRetailerCurrencyItemSubTotal) ? 
                parseFloat(lineItem.custom.eswRetailerCurrencyItemSubTotal).toFixed(TWO_DECIMAL_PLACES) : parseFloat(ZERO).toFixed(TWO_DECIMAL_PLACES);
        return crossBorderNetAmount;
    } else if (lineItem.bonusProductLineItem) {
        crossBorderNetAmount = parseFloat(ZERO).toFixed(TWO_DECIMAL_PLACES);
        return crossBorderNetAmount;
    } else {
        return '';
    }
}

/**
* Calculate consumer loyalty amount for cross border order.
* @param {Order} order.
* @returns {Number} net amount for corss border orders
*/
function getConsumerLoyaltyAmount(order) {
    var loyaltyConsumerDiscountAmount = 0.00;
    var PriceAdjustmentsItr = order.getPriceAdjustments().iterator();
    var currentPriceAdjustment;
    while (PriceAdjustmentsItr.hasNext()) {
        currentPriceAdjustment = PriceAdjustmentsItr.next();
        if (!empty(currentPriceAdjustment.custom.swellPointsUsed) && !empty(currentPriceAdjustment.custom.swellRedemptionId)) {
            loyaltyConsumerDiscountAmount += currentPriceAdjustment.netPrice.decimalValue;
        }
    }
    return loyaltyConsumerDiscountAmount * -1;
}

/**
 * 
 */
function getConsumerRoundingAmount(lineItem) {
    var consumerRoundingAmount;
    if (lineItem.custom.eswUnitPriceBeforeRounding) {
        var eswUnitPrice = !empty(lineItem.custom.eswUnitPrice) ? lineItem.custom.eswUnitPrice : 0.00;
        var eswUnitPriceBeforeRounding = !empty(lineItem.custom.eswUnitPriceBeforeRounding) ? lineItem.custom.eswUnitPriceBeforeRounding : 0.00;
        var consumerRoundingAmount = eswUnitPrice - eswUnitPriceBeforeRounding;
    } else {
        consumerRoundingAmount = 0.00;
    }
    return parseFloat(consumerRoundingAmount).toFixed(TWO_DECIMAL_PLACES);
}

/**
* Fetches the shipping address data from an Order
* @param {Order} order Order container.
* @returns {json} Shipping Address JSON
*/
function getShippingAddress(order) {
    exportLogger.debug('Getting shipping address for, order {0}', order.getOrderNo());
    var Site = require('dw/system/Site');
    var SAPMaxLimit = Site.getCurrent().getCustomPreferenceValue('SAPMaxLimit');
    var shipments = order.getShipments();
    var shippingObject = {};

    for (var i = 0; i < shipments.length; i++) {
        var shipment = shipments[i];
        var address = shipment.getShippingAddress();

        if (address.firstName) {
            shippingObject.name = address.firstName;
        } else {
            shippingObject.name = '';
        }
        if (address.lastName) {
            shippingObject.name2 = address.lastName;
        } else {
            shippingObject.name2 = '';
        }

        var combinedName = shippingObject.name + ' ' + shippingObject.name2;

        var splitted = limitAndSplit(combinedName, SAPMaxLimit);
        shippingObject.ShiptoName = splitted[0];
        shippingObject.ShiptoName2 = splitted.length > 1 ? splitted[1] : '';

        if (address.companyName) {
            shippingObject.company = address.companyName;
        } else {
            shippingObject.company = '';
        }

        shippingObject.countryKey = address.countryCode;
        var addressArray = limitAndSplit(address.address1, SAPMaxLimit);

        for (i = 1; i <= addressArray.length; i++) {
            shippingObject['address' + i] = addressArray[i - 1];
        }

        if (address.address2 == null) {
            shippingObject.address2 = '';
        } else {
            shippingObject.address2 = address.address2;
        }

        if (shippingObject.address3 == null) {
            shippingObject.address3 = '';
        }
        if (shippingObject.address4 == null) {
            shippingObject.address4 = '';
        }

        shippingObject.city = address.city;

        shippingObject.postalCode = address.postalCode;

        if (address.stateCode) {
            shippingObject.region = address.stateCode;
        } else {
            shippingObject.region = '';
        }

        shippingObject.phoneNumber = address.phone.replace(/\D/g, '');
        shippingObject.carrier = shipment.getShippingMethod().ID;
        shippingObject.carrierName = shipment.getShippingMethod().displayName;
    }
    return shippingObject;
}

/**
* Fetches the billing information from an Order
* @param {Order} order Order container.
* @returns {json} Billing Address JSON
*/
function getBillingAddress(order) {
    exportLogger.debug('Getting billing address for, order {0}', order.getOrderNo());
    var Site = require('dw/system/Site');
    var SAPMaxLimit = Site.getCurrent().getCustomPreferenceValue('SAPMaxLimit');
    var billingAddressObj = {};

    var combinedName = order.billingAddress.firstName + ' ' + order.billingAddress.lastName;

    var splitted = limitAndSplit(combinedName, SAPMaxLimit);
    billingAddressObj.BilltoName = splitted[0];
    if (splitted.length > 1) {
        billingAddressObj.BilltoName2 = splitted[1];
    } else {
        billingAddressObj.BilltoName2 = '';
    }

    if (order.billingAddress.countryCode) {
        billingAddressObj.BilltoCountry = order.billingAddress.countryCode;
    } else {
        billingAddressObj.BilltoCountry = '';
    }
    billingAddressObj.BilltoAddress1 = order.billingAddress.address1;

    var addressArray = limitAndSplit(order.billingAddress.address1, SAPMaxLimit);

    for (var i = 1; i <= addressArray.length; i++) {
        billingAddressObj['BilltoAddress' + i] = addressArray[i - 1];
    }

    if (billingAddressObj.BilltoAddress2 == null) {
        billingAddressObj.BilltoAddress2 = '';
    }
    if (billingAddressObj.BilltoAddress3 == null) {
        billingAddressObj.BilltoAddress3 = '';
    }
    if (billingAddressObj.BilltoAddress4 == null) {
        billingAddressObj.BilltoAddress4 = '';
    }

    if (order.billingAddress.city) {
        billingAddressObj.BilltoCity = order.billingAddress.city;
    } else {
        billingAddressObj.BilltoCity = '';
    }
    billingAddressObj.BilltoPostalCode = order.billingAddress.postalCode;
    if (order.billingAddress.stateCode) {
        billingAddressObj.BilltoRegion = order.billingAddress.stateCode;
    } else {
        billingAddressObj.BilltoRegion = '';
    }
    if (order.billingAddress.phone) {
        billingAddressObj.BilltoPhone = order.billingAddress.phone.replace(/\D/g, '');
    } else {
        billingAddressObj.BilltoPhone = '';
    }
    return billingAddressObj;
}

/**
* Populates the GiftMessage JSON object as part of Personalization.
* @param {ProductLineItem} productLineItem ProductLineItem
* @param {float} optionPrice Option Price.
* @param {json} totalObject JSON object containing the price/tax information in Money format.
* @param {string} language Language as per the user browser.
* @returns {JSON} Gift Wrap JSON.
*/
function populateGiftMessageObject(productLineItem, optionPrice, totalObject, language, order, isEswEnabled) {
    var Site = require('dw/system/Site');
    var giftMessageLimit = Site.getCurrent().getCustomPreferenceValue('giftMessageLimit');
    
    var eswOrderNo = !empty(order.custom.eswOrderNo) ? order.custom.eswOrderNo : '';

    var OrderGiftMessage = {};
    OrderGiftMessage.PersonalizationType = GIFTWRAPMESSAGE;
    OrderGiftMessage.LanguageID = language;
    OrderGiftMessage.Location = '';
    OrderGiftMessage.Orientation = '';
    OrderGiftMessage.Alignment = '';
    OrderGiftMessage.Font = '';
    OrderGiftMessage.GiftWrapOption = '';
    OrderGiftMessage.GiftBoxSKU = '';
    OrderGiftMessage.Text = {};
    OrderGiftMessage.Text.SequenceNumber = [];
    OrderGiftMessage.Text.TextMessage = [];

    var fullGiftMessage = productLineItem.custom.GiftWrapMessage;
    var giftMessage = limitAndSplit(fullGiftMessage, giftMessageLimit);
    for (var textLine = 0; textLine < giftMessage.length; textLine++) {
        OrderGiftMessage.Text.SequenceNumber[textLine] = textLine;
        OrderGiftMessage.Text.TextMessage[textLine] = giftMessage[textLine];
    }
    OrderGiftMessage.IsThisBillable = optionPrice > 0 ? 'Y' : 'N';
    OrderGiftMessage.GrossValue = totalObject.personalizationGrossValue;
    OrderGiftMessage.PromoAmount = totalObject.personalizationPromoAmount;
    OrderGiftMessage.SubTotal = totalObject.personalizationSubTotal;
    OrderGiftMessage.Tax1 = totalObject.Tax1;
    OrderGiftMessage.Tax2 = totalObject.Tax2;
    OrderGiftMessage.Tax3 = totalObject.Tax3;
    OrderGiftMessage.Tax4 = totalObject.Tax4;
    OrderGiftMessage.Tax5 = totalObject.Tax5;
    OrderGiftMessage.Tax6 = totalObject.Tax6;
    OrderGiftMessage.TaxAmount = totalObject.personalizationTaxAmount;
    OrderGiftMessage.NetAmount = totalObject.personalizationSubTotal;
    
    OrderGiftMessage.DutyAmount = optionPrice > 0 ? getLineItemDutyAmount(productLineItem) : parseFloat(ZERO).toFixed(TWO_DECIMAL_PLACES);
    OrderGiftMessage.ConsTaxByMGI = optionPrice > 0 ? isLineItemConsTaxByMGI(eswOrderNo, isEswEnabled) : parseFloat(ZERO).toFixed(TWO_DECIMAL_PLACES);
    OrderGiftMessage.ConsumerGrossValue = optionPrice > 0 ? getLineItemConsumerGrossValue(productLineItem, isEswEnabled, shippingCountry) : parseFloat(ZERO).toFixed(TWO_DECIMAL_PLACES);
    OrderGiftMessage.ConsumerSubTotal = optionPrice > 0 ? getLineItemConsumerSubTotal(productLineItem, isEswEnabled) : parseFloat(ZERO).toFixed(TWO_DECIMAL_PLACES);
    OrderGiftMessage.ConsumerTaxAmount = optionPrice > 0 ? getLineItemConsumerTaxAmount(productLineItem, isEswEnabled) : parseFloat(ZERO).toFixed(TWO_DECIMAL_PLACES);
    OrderGiftMessage.ConsumerDutyAmount = optionPrice > 0 ? getLineItemConsumerDutyAmount(productLineItem, isEswEnabled) : parseFloat(ZERO).toFixed(TWO_DECIMAL_PLACES);
    OrderGiftMessage.ConsumerNetAmount = optionPrice > 0 ? getLineItemConsumerNetAmount(order, productLineItem, isEswEnabled, eswOrderNo) : parseFloat(ZERO).toFixed(TWO_DECIMAL_PLACES);
    OrderGiftMessage.CrossBorderTax1 = optionPrice > 0 ? getLineItemCrossBorderTax1(productLineItem, isEswEnabled) : parseFloat(ZERO).toFixed(TWO_DECIMAL_PLACES);
    OrderGiftMessage.CrossBorderNetAmount = optionPrice > 0 ? getLineItemCrossBorderNetAmount(productLineItem, isEswEnabled) : parseFloat(ZERO).toFixed(TWO_DECIMAL_PLACES);
    OrderGiftMessage.CrossBorderPromoAmount = optionPrice > 0 ? getLineItemPromoAmount(productLineItem, shippingCountry) : parseFloat(ZERO).toFixed(TWO_DECIMAL_PLACES);
    OrderGiftMessage.CrossBorderConsumerPromoAmount = optionPrice > 0 ? getLineItemConsumerPromoAmount(productLineItem, shippingCountry) : parseFloat(ZERO).toFixed(TWO_DECIMAL_PLACES);
    OrderGiftMessage.CrossBorderSubTotal = optionPrice > 0 ? getLineItemSubTotal(productLineItem) : parseFloat(ZERO).toFixed(TWO_DECIMAL_PLACES);
    OrderGiftMessage.CrossBorderGrossValue = optionPrice > 0 ? getLineItemCrossBorderGrossValue(productLineItem, shippingCountry) : parseFloat(ZERO).toFixed(TWO_DECIMAL_PLACES);
    OrderGiftMessage.ConsumerRoundingAmount = optionPrice > 0 ? getConsumerRoundingAmount(productLineItem) : parseFloat(ZERO).toFixed(TWO_DECIMAL_PLACES);
    OrderGiftMessage.LoyaltyAmount = optionPrice > 0 ? crossBorderUtils.getSwellDiscountAmount(order) : parseFloat(ZERO).toFixed(TWO_DECIMAL_PLACES);
    OrderGiftMessage.ConsumerLoyaltyAmount = optionPrice > 0 ? getConsumerLoyaltyAmount(order) : parseFloat(ZERO).toFixed(TWO_DECIMAL_PLACES);

    return OrderGiftMessage;
}

/**
* Populates the GiftWrap JSON object as part of Personalization.
* @param {ProductLineItem} productLineItem ProductLineItem
* @param {float} optionPrice Option Price.
* @param {json} totalObject JSON object containing the price/tax information in Money format.
* @param {string} language Language as per the user browser.
* @returns {JSON} Gift Message JSON.
*/
function populateGiftWrapObject(productLineItem, optionPrice, optionUUID, totalObject, language, order, isEswEnabled) {
    var eswOrderNo = !empty(order.custom.eswOrderNo) ? order.custom.eswOrderNo : '';
    var GiftWrap = {};
    GiftWrap.UUID = optionUUID;
    GiftWrap.LanguageID = language;
    GiftWrap.PersonalizationType = GIFTWRAP;
    GiftWrap.Location = '';
    GiftWrap.Orientation = '';
    GiftWrap.Alignment = '';
    GiftWrap.Font = '';
    GiftWrap.GiftWrapOption = productLineItem.custom.giftWrapOption ? productLineItem.custom.giftWrapOption : '';
    GiftWrap.GiftBoxSKU = productLineItem.custom.giftBoxSKU;
    GiftWrap.IsThisBillable = optionPrice > 0 ? 'Y' : 'N';
    GiftWrap.GrossValue = totalObject.personalizationGrossValue;
    GiftWrap.PromoAmount = totalObject.personalizationPromoAmount;
    GiftWrap.SubTotal = totalObject.personalizationSubTotal;
    GiftWrap.Tax1 = totalObject.Tax1;
    GiftWrap.Tax2 = totalObject.Tax2;
    GiftWrap.Tax3 = totalObject.Tax3;
    GiftWrap.Tax4 = totalObject.Tax4;
    GiftWrap.Tax5 = totalObject.Tax5;
    GiftWrap.Tax6 = totalObject.Tax6;
    GiftWrap.TaxAmount = totalObject.personalizationTaxAmount;
    GiftWrap.NetAmount = totalObject.personalizationSubTotal;
    
    GiftWrap.DutyAmount = optionPrice > 0 ? getLineItemDutyAmount(productLineItem) : parseFloat(ZERO).toFixed(TWO_DECIMAL_PLACES);
    GiftWrap.ConsTaxByMGI = optionPrice > 0 ? isLineItemConsTaxByMGI(eswOrderNo, isEswEnabled) : parseFloat(ZERO).toFixed(TWO_DECIMAL_PLACES);
    GiftWrap.ConsumerGrossValue = optionPrice > 0 ? getLineItemConsumerGrossValue(productLineItem, isEswEnabled, shippingCountry) : parseFloat(ZERO).toFixed(TWO_DECIMAL_PLACES);
    GiftWrap.ConsumerSubTotal = optionPrice > 0 ? getLineItemConsumerSubTotal(productLineItem, isEswEnabled) : parseFloat(ZERO).toFixed(TWO_DECIMAL_PLACES);
    GiftWrap.ConsumerTaxAmount = optionPrice > 0 ? getLineItemConsumerTaxAmount(productLineItem, isEswEnabled) : parseFloat(ZERO).toFixed(TWO_DECIMAL_PLACES);
    GiftWrap.ConsumerDutyAmount = optionPrice > 0 ? getLineItemConsumerDutyAmount(productLineItem, isEswEnabled) : parseFloat(ZERO).toFixed(TWO_DECIMAL_PLACES);
    GiftWrap.ConsumerNetAmount = optionPrice > 0 ? getLineItemConsumerNetAmount(order, productLineItem, isEswEnabled, eswOrderNo) : parseFloat(ZERO).toFixed(TWO_DECIMAL_PLACES);
    GiftWrap.CrossBorderTax1 = optionPrice > 0 ? getLineItemCrossBorderTax1(productLineItem, isEswEnabled) : parseFloat(ZERO).toFixed(TWO_DECIMAL_PLACES);
    GiftWrap.CrossBorderNetAmount = optionPrice > 0 ? getLineItemCrossBorderNetAmount(productLineItem, isEswEnabled) : parseFloat(ZERO).toFixed(TWO_DECIMAL_PLACES);
    GiftWrap.CrossBorderPromoAmount = optionPrice > 0 ? getLineItemPromoAmount(productLineItem, shippingCountry) : parseFloat(ZERO).toFixed(TWO_DECIMAL_PLACES);
    GiftWrap.CrossBorderConsumerPromoAmount = optionPrice > 0 ? getLineItemConsumerPromoAmount(productLineItem, shippingCountry) : parseFloat(ZERO).toFixed(TWO_DECIMAL_PLACES);
    GiftWrap.CrossBorderSubTotal = optionPrice > 0 ? getLineItemSubTotal(productLineItem) : parseFloat(ZERO).toFixed(TWO_DECIMAL_PLACES);
    GiftWrap.CrossBorderGrossValue = optionPrice > 0 ? getLineItemCrossBorderGrossValue(productLineItem, shippingCountry) : parseFloat(ZERO).toFixed(TWO_DECIMAL_PLACES);
    GiftWrap.ConsumerRoundingAmount = optionPrice > 0 ? getConsumerRoundingAmount(productLineItem) : parseFloat(ZERO).toFixed(TWO_DECIMAL_PLACES);
    GiftWrap.LoyaltyAmount = optionPrice > 0 ? crossBorderUtils.getSwellDiscountAmount(order) : parseFloat(ZERO).toFixed(TWO_DECIMAL_PLACES);
    GiftWrap.ConsumerLoyaltyAmount = optionPrice > 0 ? getConsumerLoyaltyAmount(order) : parseFloat(ZERO).toFixed(TWO_DECIMAL_PLACES);

    return GiftWrap;
}

/**
* Populates the Engraved JSON object as part of Personalization.
* @param {ProductLineItem} productLineItem ProductLineItem
* @param {float} optionPrice Option Price.
* @param {json} totalObject JSON object containing the price/tax information in Money format.
* @param {string} language Language as per the user browser.
* @returns {JSON} Engraved Personalization JSON.
*/
function populateEngravedObject(productLineItem, optionPrice, optionUUID, totalObject, language, order, isEswEnabled) {
    var eswOrderNo = !empty(order.custom.eswOrderNo) ? order.custom.eswOrderNo : '';
    var Engraving = {};
    Engraving.UUID = optionUUID;
    Engraving.Text = {};
    Engraving.Text.SequenceNumber = new ArrayList();
    Engraving.Text.TextMessage = new ArrayList();

    if ('engraveMessageLine1' in productLineItem.custom && (productLineItem.custom.engraveMessageLine1)) {
        Engraving.Text.SequenceNumber[0] = '1';
        Engraving.Text.TextMessage[0] = productLineItem.custom.engraveMessageLine1;
        if ('engraveMessageLine2' in productLineItem.custom && (productLineItem.custom.engraveMessageLine2)) {
            Engraving.Text.SequenceNumber[1] = '2';
            Engraving.Text.TextMessage[1] = productLineItem.custom.engraveMessageLine2;
        }
    } else {
        Engraving.Text.SequenceNumber[0] = '';
        Engraving.Text.TextMessage[0] = '';
    }
    Engraving.LanguageID = language;
    Engraving.PersonalizationType = ENGRAVING;
    Engraving.Location = '';
    Engraving.Orientation = '';
    Engraving.Alignment = '';
    Engraving.Font = (productLineItem.custom.fontName !== null) ? productLineItem.custom.fontName : '';
    Engraving.GiftWrapOption = '';
    Engraving.GiftBoxSKU = '';
    Engraving.IsThisBillable = optionPrice > 0 ? 'Y' : 'N';
    Engraving.GrossValue = totalObject.personalizationGrossValue;
    Engraving.PromoAmount = totalObject.personalizationPromoAmount;
    Engraving.SubTotal = totalObject.personalizationSubTotal;
    Engraving.Tax1 = totalObject.Tax1;
    Engraving.Tax2 = totalObject.Tax2;
    Engraving.Tax3 = totalObject.Tax3;
    Engraving.Tax4 = totalObject.Tax4;
    Engraving.Tax5 = totalObject.Tax5;
    Engraving.Tax6 = totalObject.Tax6;
    Engraving.TaxAmount = totalObject.personalizationTaxAmount;
    Engraving.NetAmount = totalObject.personalizationSubTotal;
    
    Engraving.DutyAmount = optionPrice > 0 ? getLineItemDutyAmount(productLineItem) : parseFloat(ZERO).toFixed(TWO_DECIMAL_PLACES);
    Engraving.ConsTaxByMGI = optionPrice > 0 ? isLineItemConsTaxByMGI(eswOrderNo, isEswEnabled) : parseFloat(ZERO).toFixed(TWO_DECIMAL_PLACES);
    Engraving.ConsumerGrossValue = optionPrice > 0 ? getLineItemConsumerGrossValue(productLineItem, isEswEnabled, shippingCountry) : parseFloat(ZERO).toFixed(TWO_DECIMAL_PLACES);
    Engraving.ConsumerSubTotal = optionPrice > 0 ? getLineItemConsumerSubTotal(productLineItem, isEswEnabled) : parseFloat(ZERO).toFixed(TWO_DECIMAL_PLACES);
    Engraving.ConsumerTaxAmount = optionPrice > 0 ? getLineItemConsumerTaxAmount(productLineItem, isEswEnabled) : parseFloat(ZERO).toFixed(TWO_DECIMAL_PLACES);
    Engraving.ConsumerDutyAmount = optionPrice > 0 ? getLineItemConsumerDutyAmount(productLineItem, isEswEnabled) : parseFloat(ZERO).toFixed(TWO_DECIMAL_PLACES);
    Engraving.ConsumerNetAmount = optionPrice > 0 ? getLineItemConsumerNetAmount(order, productLineItem, isEswEnabled, eswOrderNo) : parseFloat(ZERO).toFixed(TWO_DECIMAL_PLACES);
    Engraving.CrossBorderTax1 = optionPrice > 0 ? getLineItemCrossBorderTax1(productLineItem, isEswEnabled) : parseFloat(ZERO).toFixed(TWO_DECIMAL_PLACES);
    Engraving.CrossBorderNetAmount = optionPrice > 0 ? getLineItemCrossBorderNetAmount(productLineItem, isEswEnabled) : parseFloat(ZERO).toFixed(TWO_DECIMAL_PLACES);
    Engraving.CrossBorderPromoAmount = optionPrice > 0 ? getLineItemPromoAmount(productLineItem, shippingCountry) : parseFloat(ZERO).toFixed(TWO_DECIMAL_PLACES);
    Engraving.CrossBorderConsumerPromoAmount = optionPrice > 0 ? getLineItemConsumerPromoAmount(productLineItem, shippingCountry) : parseFloat(ZERO).toFixed(TWO_DECIMAL_PLACES);
    Engraving.CrossBorderSubTotal = optionPrice > 0 ? getLineItemSubTotal(productLineItem) : parseFloat(ZERO).toFixed(TWO_DECIMAL_PLACES);
    Engraving.CrossBorderGrossValue = optionPrice > 0 ? getLineItemCrossBorderGrossValue(productLineItem, shippingCountry) : parseFloat(ZERO).toFixed(TWO_DECIMAL_PLACES);
    Engraving.ConsumerRoundingAmount = optionPrice > 0 ? getConsumerRoundingAmount(productLineItem) : parseFloat(ZERO).toFixed(TWO_DECIMAL_PLACES);
    Engraving.LoyaltyAmount = optionPrice > 0 ? crossBorderUtils.getSwellDiscountAmount(order) : parseFloat(ZERO).toFixed(TWO_DECIMAL_PLACES);
    Engraving.ConsumerLoyaltyAmount = optionPrice > 0 ? getConsumerLoyaltyAmount(order) : parseFloat(ZERO).toFixed(TWO_DECIMAL_PLACES);

    return Engraving;
}

/**
* Populates the Embossed JSON object as part of Personalization.
* @param {ProductLineItem} productLineItem ProductLineItem
* @param {float} optionPrice Option Price.
* @param {json} totalObject JSON object containing the price/tax information in Money format.
* @param {string} language Language as per the user browser.
* @returns {JSON} Embossed Personalization JSON.
*/
function populateEmbossedObject(productLineItem, optionPrice, optionUUID, totalObject, language, order, isEswEnabled) {
    var eswOrderNo = !empty(order.custom.eswOrderNo) ? order.custom.eswOrderNo : '';
    var Embossing = {};
    Embossing.UUID = optionUUID;
    Embossing.PersonalizationType = EMBOSSING;
    Embossing.LanguageID = language;
    Embossing.Location = '';

    Embossing.Text = {};
    Embossing.Text.SequenceNumber = '';
    Embossing.Text.TextMessage = '';
    if ('embossMessageLine1' in productLineItem.custom && (productLineItem.custom.embossMessageLine1)) {
        Embossing.Text.SequenceNumber = '1';
        Embossing.Text.TextMessage = productLineItem.custom.embossMessageLine1.toUpperCase();
    } else {
        Embossing.Text.SequenceNumber = '';
        Embossing.Text.TextMessage = '';
    }

    if (productLineItem.custom.isHorizontal) {
        if (productLineItem.custom.isHorizontal === 'isHorizontal') {
            Embossing.Orientation = HORIZONTAL;
        } else {
            Embossing.Orientation = VERTICAL;
        }
    } else {
        Embossing.Orientation = '';
    }
    Embossing.Alignment = '';
    Embossing.Font = '';
    Embossing.GiftWrapOption = '';
    Embossing.GiftBoxSKU = '';
    Embossing.IsThisBillable = optionPrice > 0 ? 'Y' : 'N';
    Embossing.GrossValue = totalObject.personalizationGrossValue;
    Embossing.PromoAmount = totalObject.personalizationPromoAmount;
    Embossing.SubTotal = totalObject.personalizationSubTotal;
    Embossing.Tax1 = totalObject.Tax1;
    Embossing.Tax2 = totalObject.Tax2;
    Embossing.Tax3 = totalObject.Tax3;
    Embossing.Tax4 = totalObject.Tax4;
    Embossing.Tax5 = totalObject.Tax5;
    Embossing.Tax6 = totalObject.Tax6;
    Embossing.TaxAmount = totalObject.personalizationTaxAmount;
    Embossing.NetAmount = totalObject.personalizationSubTotal;
    
    Embossing.DutyAmount = optionPrice > 0 ? getLineItemDutyAmount(productLineItem) : parseFloat(ZERO).toFixed(TWO_DECIMAL_PLACES);
    Embossing.ConsTaxByMGI = optionPrice > 0 ? isLineItemConsTaxByMGI(eswOrderNo, isEswEnabled) : parseFloat(ZERO).toFixed(TWO_DECIMAL_PLACES);
    Embossing.ConsumerGrossValue = optionPrice > 0 ? getLineItemConsumerGrossValue(productLineItem, isEswEnabled, shippingCountry) : parseFloat(ZERO).toFixed(TWO_DECIMAL_PLACES);
    Embossing.ConsumerSubTotal = optionPrice > 0 ? getLineItemConsumerSubTotal(productLineItem, isEswEnabled) : parseFloat(ZERO).toFixed(TWO_DECIMAL_PLACES);
    Embossing.ConsumerTaxAmount = optionPrice > 0 ? getLineItemConsumerTaxAmount(productLineItem, isEswEnabled) : parseFloat(ZERO).toFixed(TWO_DECIMAL_PLACES);
    Embossing.ConsumerDutyAmount = optionPrice > 0 ? getLineItemConsumerDutyAmount(productLineItem, isEswEnabled) : parseFloat(ZERO).toFixed(TWO_DECIMAL_PLACES);
    Embossing.ConsumerNetAmount = optionPrice > 0 ? getLineItemConsumerNetAmount(order, productLineItem, isEswEnabled, eswOrderNo) : parseFloat(ZERO).toFixed(TWO_DECIMAL_PLACES);
    Embossing.CrossBorderTax1 = optionPrice > 0 ? getLineItemCrossBorderTax1(productLineItem, isEswEnabled) : parseFloat(ZERO).toFixed(TWO_DECIMAL_PLACES);
    Embossing.CrossBorderNetAmount = optionPrice > 0 ? getLineItemCrossBorderNetAmount(productLineItem, isEswEnabled) : parseFloat(ZERO).toFixed(TWO_DECIMAL_PLACES);
    Embossing.CrossBorderPromoAmount = optionPrice > 0 ? getLineItemPromoAmount(productLineItem, shippingCountry) : parseFloat(ZERO).toFixed(TWO_DECIMAL_PLACES);
    Embossing.CrossBorderConsumerPromoAmount = optionPrice > 0 ? getLineItemConsumerPromoAmount(productLineItem, shippingCountry) : parseFloat(ZERO).toFixed(TWO_DECIMAL_PLACES);
    Embossing.CrossBorderSubTotal = optionPrice > 0 ? getLineItemSubTotal(productLineItem) : parseFloat(ZERO).toFixed(TWO_DECIMAL_PLACES);
    Embossing.CrossBorderGrossValue = optionPrice > 0 ? getLineItemCrossBorderGrossValue(productLineItem, shippingCountry) : parseFloat(ZERO).toFixed(TWO_DECIMAL_PLACES);
    Embossing.ConsumerRoundingAmount = optionPrice > 0 ? getConsumerRoundingAmount(productLineItem) : parseFloat(ZERO).toFixed(TWO_DECIMAL_PLACES);
    Embossing.LoyaltyAmount = optionPrice > 0 ? crossBorderUtils.getSwellDiscountAmount(order) : parseFloat(ZERO).toFixed(TWO_DECIMAL_PLACES);
    Embossing.ConsumerLoyaltyAmount = optionPrice > 0 ? getConsumerLoyaltyAmount(order) : parseFloat(ZERO).toFixed(TWO_DECIMAL_PLACES);

    return Embossing;
}
/**
* Fetches the personalizations/options from the commerceitem
* @param {order} order Order container.
* @param {ProductLineItem} productLineItem ProductLineItem
* @param {Boolean} to check if esw cartridge enabled or not
* @param {String} shipping country
* @returns {json} Personalizations JSON
*/
function createPOItemPersonalizations(order, productLineItem, isEswEnabled, shippingCountry) {
    var personalizations = {};
    var language = '';

    if ('httpLocale' in order.custom && order.custom.httpLocale) {
        var orderLangLocale = order.custom.httpLocale;
        var orderLangLocaleArray = orderLangLocale.split('_');
        language = orderLangLocaleArray[0];
    } else {
        language = 'en';
    }

    var productLineItemOptions = productLineItem.getOptionProductLineItems();

    if (productLineItemOptions) {
        var option = '';
        var optionValue = '';
        var optionPrice = parseFloat(ZERO);

        /* Setting the default values. Keeping TAX as 0.0 as it will be set by the Sabrix response at Options level. */
        var total = {
            personalizationSubTotal: parseFloat(ZERO).toFixed(TWO_DECIMAL_PLACES),
            personalizationGrossValue: parseFloat(ZERO).toFixed(TWO_DECIMAL_PLACES),
            personalizationPromoAmount: parseFloat(ZERO).toFixed(TWO_DECIMAL_PLACES),
            personalizationTaxAmount: parseFloat(ZERO).toFixed(TWO_DECIMAL_PLACES),
            Tax1: parseFloat(ZERO).toFixed(TWO_DECIMAL_PLACES),
            Tax2: parseFloat(ZERO).toFixed(TWO_DECIMAL_PLACES),
            Tax3: parseFloat(ZERO).toFixed(TWO_DECIMAL_PLACES),
            Tax4: parseFloat(ZERO).toFixed(TWO_DECIMAL_PLACES),
            Tax5: parseFloat(ZERO).toFixed(TWO_DECIMAL_PLACES),
            Tax6: parseFloat(ZERO).toFixed(TWO_DECIMAL_PLACES)
        };

        if ('GiftWrapMessage' in productLineItem.custom && productLineItem.custom.GiftWrapMessage) {
            personalizations.OrderGiftMessage = populateGiftMessageObject(productLineItem, optionPrice, total, language, order, isEswEnabled, shippingCountry);
        } else {
            personalizations.OrderGiftMessage = '';
        }

        if (productLineItem.getOptionModel()) {
            var optionModel = productLineItem.getOptionModel();
            for (var a = 0; a < productLineItemOptions.length; a++) {
                var optionItem = productLineItemOptions[a];
                var optionUUID = optionItem.UUID;
                option = optionModel.getOption(productLineItemOptions[a].getOptionID());
                optionValue = optionModel.getSelectedOptionValue(option);
                optionPrice = optionModel.getPrice(optionValue);

                total.personalizationGrossValue = parseFloat(optionPrice).toFixed(TWO_DECIMAL_PLACES);

                if ((option && option.getID() === GIFTWRAPPED) && ('isGiftWrapped' in productLineItem.custom) && productLineItem.custom.isGiftWrapped) {
                    personalizations.GiftWrap = populateGiftWrapObject(productLineItem, optionPrice, optionUUID, total, language, order, isEswEnabled, shippingCountry);
                }
                if (option && option.getID() === ENGRAVED) {
                    personalizations.Engraving = populateEngravedObject(productLineItem, optionPrice, optionUUID, total, language, order, isEswEnabled, shippingCountry);
                }
                if (option && option.getID() === EMBOSSED) {
                    personalizations.Embossing = populateEmbossedObject(productLineItem, optionPrice, optionUUID, total, language, order, isEswEnabled, shippingCountry);
                }
            }
        }
    }
    return personalizations;
}

/**
* Fetches the Promotion Code from custom attribute of productLineItem
* @param {ProductLineItem} itemInfo ProductLineItem object
* @returns {string} Promotion Code
*/
function getPromotionCode(order, itemInfo) {
    var promoCode = '';
    if (itemInfo instanceof ShippingLineItem) {
        if (itemInfo.getShippingPriceAdjustments().length !== 0) {
            var shippingAdjustmentCollection = itemInfo.getShippingPriceAdjustments();
            for (var n = 0; n < shippingAdjustmentCollection.length; n++) {
                var shippingPriceAdjustment = shippingAdjustmentCollection[n];
                if (shippingPriceAdjustment.getPromotion()) {
                    var shippingPromotion = shippingPriceAdjustment.getPromotion();
                    promoCode += ((shippingPromotion.custom.promoCode ? shippingPromotion.custom.promoCode : shippingPromotion.getID()) + ' ');
                }
            }
        }
    } else if (itemInfo instanceof ProductLineItem) {
        if (itemInfo.getPriceAdjustments().length !== 0) {
            var adjustmentCollection = itemInfo.getPriceAdjustments();
            for (var m = 0; m < adjustmentCollection.length; m++) {
                var productPriceAdjustment = adjustmentCollection[m];
                if (productPriceAdjustment.getPromotion()) {
                    var productPromotion = productPriceAdjustment.getPromotion();
                    promoCode += ((productPromotion.custom.promoCode ? productPromotion.custom.promoCode : productPromotion.getID()) + ' ');
                }
            }
        }
        if (order.getPriceAdjustments().length > 0 && !order.custom.eswOrderNo) {
            var orderAdjustmentCollection = order.getPriceAdjustments();
            for (var n = 0; n < orderAdjustmentCollection.length; n++) {
                var orderPriceAdjustment = orderAdjustmentCollection[n];
                if (orderPriceAdjustment.getPromotion()) {
                    var orderPromotion = orderPriceAdjustment.getPromotion();
                    promoCode += ((orderPromotion.custom.promoCode ? orderPromotion.custom.promoCode : orderPromotion.getID()) + ' ');
                }
            }
        }
        else if (order.custom.eswOrderNo && !itemInfo.bonusProductLineItem) {
            var orderAdjustmentCollection = order.getPriceAdjustments();
            for (var n = 0; n < orderAdjustmentCollection.length; n++) {
                var orderPriceAdjustment = orderAdjustmentCollection[n];
                if (orderPriceAdjustment.getPromotion()) {
                    var orderPromotion = orderPriceAdjustment.getPromotion();
                    promoCode += ((orderPromotion.custom.promoCode ? orderPromotion.custom.promoCode : orderPromotion.getID()) + ' ');
                }
            }
        }
    }
    return promoCode;
}

/**
* Fetches the PriceBook ID from the Order.
* @param {Order} order Order
* @returns {string} PriceBookID
*/
function fecthPriceBookId(order) {
    var PriceHelper = require('*/cartridge/scripts/helpers/pricing');
    var allProductLineItems = order.getProductLineItems();
    for (var a = 0; a < allProductLineItems.length; a++) {
        var productLineItem = allProductLineItems[a];
        var product = ProductMgr.getProduct(productLineItem.productID);
        var model = product.getPriceModel();
        var priceBook = PriceHelper.getRootPriceBook(model.priceInfo.priceBook);
        if (priceBook) {
            return priceBook.ID;
        }
    }
    return '';
}

/**
* Fetches the PriceBook ID from the Order.
* @param {Order} order Order
* @returns {string} PriceBookID
*/
function getPriceBookId(order) {
    var currencyCode = order.getCurrencyCode();
    var sitePriceBooks = PriceBookMgr.getSitePriceBooks();
    var sitePriceBooksItr = sitePriceBooks.iterator();
    var priceBook;
    var priceBookId;
    while (sitePriceBooksItr.hasNext()) {
        priceBook = sitePriceBooksItr.next();
        if (priceBook.currencyCode == currencyCode) {
            priceBookId = priceBook.ID;
            break;
        }
    }
    return priceBookId;
}

/**
 *
 * @param resultTaxObject
 * @param orderPriceRatio
 * @param customAttrTaxValue
 * @param attrName
 * @param prodLeveltaxAttributeAdjTotal
 * @param orderLevelTaxAttrAdjTotal
 * @returns
 */
function getIndividualPricingTaxBreakup(resultTaxObject, orderPriceRatio, customAttrTaxValue, attrName,
    prodLeveltaxAttributeAdjTotal, orderLevelTaxAttrAdjTotal, orderPromoApplied) {
    var pliCustomAttrTaxes = 0.0;
    var productProrationPrice = 0.0;

    if (orderPromoApplied) {
        productProrationPrice = parseFloat(orderLevelTaxAttrAdjTotal * orderPriceRatio);
        pliCustomAttrTaxes = customAttrTaxValue - prodLeveltaxAttributeAdjTotal - productProrationPrice;
    } else {
        pliCustomAttrTaxes = customAttrTaxValue - prodLeveltaxAttributeAdjTotal;
    }

    if (attrName == 'sabrixCityTotal') {
        resultTaxObject.cityTotal = pliCustomAttrTaxes;
    } else if (attrName == 'sabrixCountyTotal') {
        resultTaxObject.countyTotal = pliCustomAttrTaxes;
    } else if (attrName == 'sabrixDistrictTotal') {
        resultTaxObject.districtTotal = pliCustomAttrTaxes;
    } else if (attrName == 'sabrixStateTotal') {
        resultTaxObject.stateTotal = pliCustomAttrTaxes;
    } else if (attrName == 'sabrixAdditionalCityTotal') {
        resultTaxObject.additionalCityTotal = pliCustomAttrTaxes;
    } else if (attrName == 'sabrixAdditionalDistrictTotal') {
        resultTaxObject.additionalDistrictTotal = pliCustomAttrTaxes;
    }

    return resultTaxObject;
}

/**
* gets the line item level tax after applying all the promotions
* @param resultTaxObject
* @param lineItemAdjustedTax
* @param orderPriceRatio
* @param orderLevelTaxAttrAdjTotal
* @param orderPromoApplied
* @returns
*/
function getLineItemLevelTax(resultTaxObject, lineItemAdjustedTax, orderPriceRatio, orderLevelTaxAttrAdjTotal, orderPromoApplied) {
    var pliTaxes = 0.0;
    var productProrationPrice = 0.0;

    if (orderPromoApplied && lineItemAdjustedTax > 0) {
        productProrationPrice = parseFloat(orderLevelTaxAttrAdjTotal * orderPriceRatio);
        pliTaxes = lineItemAdjustedTax - productProrationPrice;
    } else if (orderPromoApplied) {
        pliTaxes = parseFloat(orderLevelTaxAttrAdjTotal * orderPriceRatio);
    } else {
        pliTaxes = lineItemAdjustedTax;
    }

    resultTaxObject.lineItemTax = pliTaxes;
    return resultTaxObject;
}


/**
* gets the taxes bifurcation, price  after performing all the pro-rations
* calls sub method for taxes and price calculations
* @param priceAdj
* @returns
*/
function getPromotionalTaxBreakup(priceAdj) {
    var cityTotal = 0.0;
    var stateTotal = 0.0;
    var districtTotal = 0.0;
    var additionalCityTotal = 0.0;
    var additionalDistrictTotal = 0.0;
    var countyTotal = 0.0;

    var taxPromoTotalsObj = {};

    for (var k = 0; k < priceAdj.length; k++) {
        if (priceAdj[k].custom.sabrixCityTotal) {
            cityTotal += parseInt(priceAdj[k].custom.sabrixCityTotal);
        }
        if (priceAdj[k].custom.sabrixStateTotal) {
            stateTotal += parseInt(priceAdj[k].custom.sabrixStateTotal);
        }
        if (priceAdj[k].custom.sabrixDistrictTotal) {
            districtTotal += parseInt(priceAdj[k].custom.sabrixDistrictTotal);
        }
        if (priceAdj[k].custom.sabrixAdditionalDistrictTotal) {
            additionalDistrictTotal += parseInt(priceAdj[k].custom.sabrixAdditionalDistrictTotal);
        }
        if (priceAdj[k].custom.sabrixCountyTotal) {
            countyTotal += parseInt(priceAdj[k].custom.sabrixCountyTotal);
        }
        if (priceAdj[k].custom.sabrixAdditionalCityTotal) {
            additionalCityTotal += parseInt(priceAdj[k].custom.sabrixAdditionalCityTotal);
        }
    }

    taxPromoTotalsObj.cityTotal = cityTotal;
    taxPromoTotalsObj.stateTotal = stateTotal;
    taxPromoTotalsObj.districtTotal = districtTotal;
    taxPromoTotalsObj.additionalDistrictTotal = additionalDistrictTotal;
    taxPromoTotalsObj.countyTotal = countyTotal;
    taxPromoTotalsObj.additionalCityTotal = additionalCityTotal;

    return taxPromoTotalsObj;
}


/**
*
* @param resultTaxObject
* @param orderPriceRatio
* @param productLineItem
* @param customTaxAttrArray
* @param productPromoTaxPriceAdjTotals
* @param orderPromoTaxPriceAdjTotals
* @param orderPromoApplied
* @returns
*/
function calculateTaxes(resultTaxObject, orderPriceRatio, productLineItem, customTaxAttrArray, productPromoTaxPriceAdjTotals,
    orderPromoTaxPriceAdjTotals, orderPromoApplied) {
    for (var k = 0; k < customTaxAttrArray.length; k++) {
        if (customTaxAttrArray[k] && customTaxAttrArray[k] == 'sabrixCityTotal') {
            resultTaxObject = getIndividualPricingTaxBreakup(resultTaxObject, orderPriceRatio, productLineItem.custom.sabrixCityTotal, customTaxAttrArray[k], productPromoTaxPriceAdjTotals.cityTotal,
                orderPromoTaxPriceAdjTotals.cityTotal, orderPromoApplied);
        } else if (customTaxAttrArray[k] && customTaxAttrArray[k] == 'sabrixStateTotal') {
            resultTaxObject = getIndividualPricingTaxBreakup(resultTaxObject, orderPriceRatio, productLineItem.custom.sabrixStateTotal, customTaxAttrArray[k], productPromoTaxPriceAdjTotals.stateTotal,
                orderPromoTaxPriceAdjTotals.stateTotal, orderPromoApplied);
        } else if (customTaxAttrArray[k] && customTaxAttrArray[k] == 'sabrixDistrictTotal') {
            resultTaxObject = getIndividualPricingTaxBreakup(resultTaxObject, orderPriceRatio, productLineItem.custom.sabrixDistrictTotal, customTaxAttrArray[k], productPromoTaxPriceAdjTotals.districtTotal,
                orderPromoTaxPriceAdjTotals.districtTotal, orderPromoApplied);
        } else if (customTaxAttrArray[k] && customTaxAttrArray[k] == 'sabrixAdditionalDistrictTotal') {
            resultTaxObject = getIndividualPricingTaxBreakup(resultTaxObject, orderPriceRatio, productLineItem.custom.sabrixAdditionalDistrictTotal, customTaxAttrArray[k], productPromoTaxPriceAdjTotals.additionalDistrictTotal,
                orderPromoTaxPriceAdjTotals.additionalDistrictTotal, orderPromoApplied);
        } else if (customTaxAttrArray[k] && customTaxAttrArray[k] == 'sabrixAdditionalCityTotal') {
            resultTaxObject = getIndividualPricingTaxBreakup(resultTaxObject, orderPriceRatio, productLineItem.custom.sabrixAdditionalCityTotal, customTaxAttrArray[k], productPromoTaxPriceAdjTotals.additionalCityTotal,
                orderPromoTaxPriceAdjTotals.additionalCityTotal, orderPromoApplied);
        } else if (customTaxAttrArray[k] && customTaxAttrArray[k] == 'sabrixCountyTotal') {
            resultTaxObject = getIndividualPricingTaxBreakup(resultTaxObject, orderPriceRatio, productLineItem.custom.sabrixCountyTotal, customTaxAttrArray[k], productPromoTaxPriceAdjTotals.countyTotal,
                orderPromoTaxPriceAdjTotals.countyTotal, orderPromoApplied);
        }
    }

    return resultTaxObject;
}


/**
 * gets the Prices at Line Item
 * @param resultObject
 * @param productLineItem
 * @param orderPromoApplied
 * @param totalTax
 * @returns
 */
function getLineItemPrices(resultObject, productLineItem, orderPromoApplied, totalTax, order) {
    var promoAmount = 0.0;
    var subTotal = 0.0;
    var netAmount = 0.0;
    var promoCode;

    if (orderPromoApplied) {
        promoAmount = parseFloat(productLineItem.basePrice.value) - parseFloat(productLineItem.proratedPrice.value);
    } else {
        promoAmount = parseFloat(productLineItem.basePrice.value) - parseFloat(productLineItem.adjustedPrice.value);
    }

    subTotal = parseFloat(productLineItem.basePrice.value) - parseFloat(promoAmount);
    netAmount = parseFloat(subTotal) + parseFloat(totalTax);

    /* gets the promotion code string to be applied on the line item*/
    promoCode = getPromotionCode(order, productLineItem);

    resultObject.grossPrice = parseFloat(productLineItem.basePrice.value);
    resultObject.promoAmount = promoAmount;
    resultObject.subtotal = subTotal;
    resultObject.netAmount = netAmount;
    resultObject.promoCode = promoCode;


    return resultObject;
}


/**
 * rounds the prices upto two decimal places
 * @param roundedPricesObject
 * @param pricesObject
 * @returns
 */
function getRoundedPricesObject(roundedPricesObject, pricesObject) {
    for (var i = 0; i < pricesObject.length; i++) {
        var priceBreakupObject;
        var roundedPriceBreakupObject = {};
        priceBreakupObject = pricesObject[i].taxBreakup;
        roundedPriceBreakupObject.cityTotal = (parseFloat(priceBreakupObject.cityTotal).toFixed(TWO_DECIMAL_PLACES));
        roundedPriceBreakupObject.stateTotal = (parseFloat(priceBreakupObject.stateTotal).toFixed(TWO_DECIMAL_PLACES));
        roundedPriceBreakupObject.districtTotal = (parseFloat(priceBreakupObject.districtTotal).toFixed(TWO_DECIMAL_PLACES));
        roundedPriceBreakupObject.additionalDistrictTotal = (parseFloat(priceBreakupObject.additionalDistrictTotal).toFixed(TWO_DECIMAL_PLACES));
        roundedPriceBreakupObject.countyTotal = (parseFloat(priceBreakupObject.countyTotal).toFixed(TWO_DECIMAL_PLACES));
        roundedPriceBreakupObject.additionalCityTotal = (parseFloat(priceBreakupObject.additionalCityTotal).toFixed(TWO_DECIMAL_PLACES));
        roundedPriceBreakupObject.lineItemTax = (parseFloat(priceBreakupObject.lineItemTax).toFixed(TWO_DECIMAL_PLACES));
        roundedPriceBreakupObject.grossValue = parseFloat(priceBreakupObject.grossPrice.toFixed(TWO_DECIMAL_PLACES));
        roundedPriceBreakupObject.promoAmount = parseFloat(priceBreakupObject.promoAmount.toFixed(TWO_DECIMAL_PLACES));
        roundedPriceBreakupObject.subTotal = parseFloat(priceBreakupObject.subtotal.toFixed(TWO_DECIMAL_PLACES));
        roundedPriceBreakupObject.netAmount = parseFloat(priceBreakupObject.netAmount.toFixed(TWO_DECIMAL_PLACES));
        roundedPriceBreakupObject.promoCode = priceBreakupObject.promoCode;

        roundedPricesObject.push({
            UUID: pricesObject[i].UUID,
            pid: pricesObject[i].pid,
            taxBreakup: roundedPriceBreakupObject
        });
    }
    return roundedPricesObject;
}

/**
 * Adjust deficits at PLI level
 * @param roundedPriceObject
 * @param priceObject
 * @returns
 */
function adustDefictsAtPLI(roundedPriceObject, priceObject) {
    var subtotalDeficit = 0.0;
    var netAmountDeficit = 0.0;
    for (var i = 0; i < roundedPriceObject.length; i++) {
        for (var k = 0; k < priceObject.length; k++) {
            if (priceObject[k].UUID == roundedPriceObject[i].UUID) {
                subtotalDeficit = (roundedPriceObject[i].taxBreakup.subTotal - (priceObject[k].taxBreakup.grossPrice - roundedPriceObject[i].taxBreakup.promoAmount));
                netAmountDeficit = (roundedPriceObject[i].taxBreakup.netAmount - (roundedPriceObject[i].taxBreakup.subTotal + parseFloat(roundedPriceObject[i].taxBreakup.lineItemTax)));
                roundedPriceObject[i].taxBreakup.subTotalDeficit = subtotalDeficit;
                roundedPriceObject[i].taxBreakup.netAmountDeficit = netAmountDeficit;
                roundedPriceObject[i].taxBreakup.subTotal = roundedPriceObject[i].taxBreakup.subTotal + subtotalDeficit;
                roundedPriceObject[i].taxBreakup.promoAmount = roundedPriceObject[i].taxBreakup.promoAmount + subtotalDeficit;
                roundedPriceObject[i].taxBreakup.netAmount = roundedPriceObject[i].taxBreakup.subTotal + parseFloat(roundedPriceObject[i].taxBreakup.lineItemTax);
            }
        }
    }
    return roundedPriceObject;
}

function adjustCustomTaxAmount(lineItemObject) {
    Object.keys(lineItemObject).forEach(function (key) {
        var sum = parseFloat(ZERO);
        var taxAmountDeficit = parseFloat(ZERO);
        var item = lineItemObject[key];
        sum = parseFloat(item.taxBreakup.stateTotal) + parseFloat(item.taxBreakup.cityTotal) + parseFloat(item.taxBreakup.countyTotal) + parseFloat(item.taxBreakup.districtTotal) + parseFloat(item.taxBreakup.additionalCityTotal) + parseFloat(item.taxBreakup.additionalDistrictTotal);
        taxAmountDeficit = parseFloat(item.taxBreakup.lineItemTax) - sum;
        item.taxBreakup.stateTotal = parseFloat(item.taxBreakup.stateTotal) + parseFloat(taxAmountDeficit);
        lineItemObject[key] = item;
    });
    return lineItemObject;
}

function adjustSubTotal(lineItemObject, order) {
    var sum = parseFloat(ZERO);
    var subTotalDeficit = parseFloat(ZERO);
    Object.keys(lineItemObject).forEach(function (key) {
        var item = lineItemObject[key];
        sum += parseFloat(item.taxBreakup.subTotal);
    });
    subTotalDeficit = parseFloat(order.adjustedMerchandizeTotalPrice.value) - sum;
    lineItemObject[0].taxBreakup.subTotal = parseFloat(lineItemObject[0].taxBreakup.subTotal) + parseFloat(subTotalDeficit);
    lineItemObject[0].taxBreakup.promoAmount = parseFloat(lineItemObject[0].taxBreakup.promoAmount) + parseFloat(subTotalDeficit);
    lineItemObject[0].taxBreakup.netAmount = parseFloat(lineItemObject[0].taxBreakup.lineItemTax) + parseFloat(lineItemObject[0].taxBreakup.subTotal);
    return lineItemObject;
}

function adjustNetAmount(lineItemObject, order) {
    var sum = parseFloat(ZERO);
    var netAmountDeficit = parseFloat(ZERO);
    Object.keys(lineItemObject).forEach(function (key) {
        var item = lineItemObject[key];
        sum += parseFloat(item.taxBreakup.netAmount);
    });
    if (order.shipments[0] && order.shipments[0].shippingPriceAdjustments.length > 0) {
        netAmountDeficit = order.getTotalGrossPrice() - (sum + order.adjustedShippingTotalGrossPrice.value);
    } else {
        netAmountDeficit = order.getTotalGrossPrice() - (sum + order.shippingTotalGrossPrice.value);
    }
    lineItemObject[0].taxBreakup.netAmount = parseFloat(lineItemObject[0].taxBreakup.netAmount) + parseFloat(netAmountDeficit);
    return lineItemObject;
}

function adjustTaxAmount(lineItemObject, order) {
    var sum = parseFloat(ZERO);
    var taxAmountDeficit = parseFloat(ZERO);
    Object.keys(lineItemObject).forEach(function (key) {
        var item = lineItemObject[key];
        sum += parseFloat(item.taxBreakup.lineItemTax);
    });
    taxAmountDeficit = order.getTotalTax() - sum;
    var lineItemTax = parseFloat(lineItemObject[0].taxBreakup.lineItemTax) + parseFloat(taxAmountDeficit) - order.adjustedShippingTotalTax.value;
    var stateTotal = parseFloat(lineItemObject[0].taxBreakup.stateTotal) + parseFloat(taxAmountDeficit) - order.adjustedShippingTotalTax.value;
    if (lineItemTax < 0) {
        lineItemObject[0].taxBreakup.lineItemTax = lineItemTax * (-1);
    } else {
        lineItemObject[0].taxBreakup.lineItemTax = lineItemTax;
    }
    
    if (stateTotal < 0) {
        lineItemObject[0].taxBreakup.stateTotal = stateTotal * (-1);
    } else {
        lineItemObject[0].taxBreakup.stateTotal = stateTotal;
    }
    return lineItemObject;
}

/**
* populates the proRated price in line items
* includes adjustments, personalizations, bonus line items
* @param order
* @returns
*/
function populatePriceBreakup(order) {
    var orderPriceRatio = 0.0;
    var productLineItem;
    var orderPriceAdj;
    var shippingPriceAdj;
    var totalOrderPriceAdjValue = 0.0;
    var shippingOrderPriceAdjValue = 0.0;
    var totalTaxInShippingAdjustments = 0.0;
    var totalTaxInOrderAdjustments = 0.0;
    var productPromoTaxPriceAdjTotals;
    var orderPromoTaxPriceAdjTotals;
    var shippingPromoTaxPriceAdjTotals;
    var lineItemTaxMapping = [];
    var orderPromoApplied = false;
    var totalLinesAdjPrice = 0.0;
    var roundedTaxObject = [];

/* get total of tax breakup at order level and shipping level promotions*/
    orderPromoTaxPriceAdjTotals = getPromotionalTaxBreakup(order.priceAdjustments);
    shippingPromoTaxPriceAdjTotals = getPromotionalTaxBreakup(order.shippingPriceAdjustments);

    for (var p = 0; p < order.allProductLineItems.length; p++) {
        var pli = order.allProductLineItems[p];
        if (pli.adjustedPrice.value > pli.proratedPrice.value) {
            totalLinesAdjPrice = parseFloat(totalLinesAdjPrice) + parseFloat(pli.adjustedPrice.value);
        }
    }

    for (var i = 0; i < order.priceAdjustments.length; i++) {
        orderPriceAdj = order.priceAdjustments[i];
        totalOrderPriceAdjValue = parseFloat(totalOrderPriceAdjValue) + parseFloat(Math.abs(orderPriceAdj.price.value));
        totalTaxInOrderAdjustments = parseFloat(totalTaxInOrderAdjustments) + parseFloat(Math.abs(orderPriceAdj.tax.value));
    }

    for (var j = 0; j < order.shippingPriceAdjustments.length; j++) {
        shippingPriceAdj = order.shippingPriceAdjustments[j];
        shippingOrderPriceAdjValue = parseFloat(shippingOrderPriceAdjValue) + parseFloat(Math.abs(shippingPriceAdj.price.value));
        totalTaxInShippingAdjustments = parseFloat(totalTaxInShippingAdjustments) + parseFloat(Math.abs(shippingPriceAdj.tax.value));
    }

    for (var l = 0; l < order.allProductLineItems.length; l++) {
        var resultTaxObject = {};
        productLineItem = order.allProductLineItems[l];

        orderPriceRatio = 1.0;
    /* calculate the shipping price and order perice adjustment ratio*/
        if (totalLinesAdjPrice > 0) {
            orderPriceRatio = parseFloat(productLineItem.adjustedPrice.value / totalLinesAdjPrice);
        }
    /* get total of tax breakup at product level promotions*/
        productPromoTaxPriceAdjTotals = getPromotionalTaxBreakup(productLineItem.priceAdjustments);
        var customTaxAttrArray = Object.keys(productLineItem.custom);

        if (productLineItem.adjustedPrice.value > productLineItem.proratedPrice.value) {
            orderPromoApplied = true;

        /* get the breakup at line item custom attributes level*/
            resultTaxObject = calculateTaxes(resultTaxObject, orderPriceRatio, productLineItem, customTaxAttrArray, productPromoTaxPriceAdjTotals,
                orderPromoTaxPriceAdjTotals, orderPromoApplied);

        /* get the breakup at line item*/
            resultTaxObject = getLineItemLevelTax(resultTaxObject, productLineItem.adjustedTax.value, orderPriceRatio,
                totalTaxInOrderAdjustments, orderPromoApplied);

        /* get the prices at line item */
            resultTaxObject = getLineItemPrices(resultTaxObject, productLineItem, orderPromoApplied, resultTaxObject.lineItemTax, order);

        /* populate the tax mapping calculated along with the PID in the list*/
            lineItemTaxMapping.push({
                UUID: productLineItem.UUID,
                pid: productLineItem.productID,
                taxBreakup: resultTaxObject
            });
        } else if (productLineItem.basePrice.value > productLineItem.adjustedPrice.value) {
        /* get the breakup at line item custom attributes level*/
            resultTaxObject = calculateTaxes(resultTaxObject, orderPriceRatio, productLineItem, customTaxAttrArray, productPromoTaxPriceAdjTotals,
                orderPromoTaxPriceAdjTotals, orderPromoApplied);

        /* get the breakup at line item*/
            resultTaxObject = getLineItemLevelTax(resultTaxObject, productLineItem.adjustedTax.value, orderPriceRatio,
                 totalTaxInOrderAdjustments, orderPromoApplied);

        /* get the prices at line item */
            resultTaxObject = getLineItemPrices(resultTaxObject, productLineItem, orderPromoApplied, resultTaxObject.lineItemTax, order);

        /* populate the tax mapping calculated along with the PID in the list*/
            lineItemTaxMapping.push({
                UUID: productLineItem.UUID,
                pid: productLineItem.productID,
                taxBreakup: resultTaxObject
            });
        } else if (productLineItem.basePrice.value == 0) {
            resultTaxObject.cityTotal = 0;
            resultTaxObject.stateTotal = 0;
            resultTaxObject.districtTotal = 0;
            resultTaxObject.additionalDistrictTotal = 0;
            resultTaxObject.countyTotal = 0;
            resultTaxObject.additionalCityTotal = 0;
            resultTaxObject.lineItemTax = 0;
            resultTaxObject.grossPrice = 0;
            resultTaxObject.promoAmount = 0;
            resultTaxObject.subtotal = 0;
            resultTaxObject.netAmount = 0;
            resultTaxObject.promoCode = '';

            lineItemTaxMapping.push({
                UUID: productLineItem.UUID,
                pid: productLineItem.productID,
                taxBreakup: resultTaxObject
            });
        } else {
            resultTaxObject.cityTotal = productLineItem.custom.sabrixCityTotal;
            resultTaxObject.stateTotal = productLineItem.custom.sabrixStateTotal;
            resultTaxObject.districtTotal = productLineItem.custom.sabrixDistrictTotal;
            resultTaxObject.additionalDistrictTotal = productLineItem.custom.sabrixAdditionalDistrictTotal;
            resultTaxObject.countyTotal = productLineItem.custom.sabrixCountyTotal;
            resultTaxObject.additionalCityTotal = productLineItem.custom.sabrixAdditionalCityTotal;
            resultTaxObject.lineItemTax = productLineItem.tax.value;
            resultTaxObject.grossPrice = productLineItem.basePrice.value;
            resultTaxObject.promoCode = '';
            if (productLineItem.isBonusProductLineItem()) {
                resultTaxObject.promoAmount = productLineItem.basePrice.value;
                resultTaxObject.subtotal = 0.0;
                resultTaxObject.netAmount = 0.0;
            } else {
                resultTaxObject.promoAmount = 0.0;
                resultTaxObject.subtotal = productLineItem.basePrice.value;
                resultTaxObject.netAmount = parseFloat(productLineItem.basePrice.value) + parseFloat(productLineItem.tax.value);
            }

            lineItemTaxMapping.push({
                UUID: productLineItem.UUID,
                pid: productLineItem.productID,
                taxBreakup: resultTaxObject
            });
        }
    }

    roundedTaxObject = getRoundedPricesObject(roundedTaxObject, lineItemTaxMapping);
    roundedTaxObject = adustDefictsAtPLI(roundedTaxObject, lineItemTaxMapping);
    roundedTaxObject = adjustSubTotal(roundedTaxObject, order);
    roundedTaxObject = adjustTaxAmount(roundedTaxObject, order);
    roundedTaxObject = adjustCustomTaxAmount(roundedTaxObject);
    roundedTaxObject = adjustNetAmount(roundedTaxObject, order);

    return roundedTaxObject;
}

/**
* To find if Duty is included on the Order.
* @param {json} optionItem Option Item
* @param {json} taxObject Tax Object
* @returns {json}
*/
function addDataOnOption(optionItem, taxObject) {
    for (var a = 0; a < taxObject.length; a++) {
        var temp = taxObject[a];
        if (temp.UUID === optionItem.UUID) {
            optionItem.TaxAmount = temp.taxBreakup.lineItemTax;
            optionItem.Tax1 = temp.taxBreakup.stateTotal;
            optionItem.Tax2 = temp.taxBreakup.countyTotal;
            optionItem.Tax3 = temp.taxBreakup.cityTotal;
            optionItem.Tax4 = temp.taxBreakup.additionalCityTotal;
            optionItem.Tax5 = temp.taxBreakup.districtTotal;
            optionItem.Tax6 = temp.taxBreakup.additionalDistrictTotal;
            optionItem.SubTotal = parseFloat(temp.taxBreakup.subTotal);
            optionItem.PromoAmount = parseFloat(temp.taxBreakup.promoAmount);
            optionItem.NetAmount = parseFloat(optionItem.SubTotal) + parseFloat(optionItem.TaxAmount);
            break;
        }
    }
    return optionItem;
}

function persistData(productLineItems, taxObject) {
    var Site = require('dw/system/Site');
    var shippingLineItemSKU = Site.getCurrent().getCustomPreferenceValue('shippingLineItemSKU');
    Object.keys(productLineItems).forEach(function (key) {
        if (productLineItems[key].SKUNumber !== shippingLineItemSKU) {
            var pli = productLineItems[key];
            for (var a = 0; a < taxObject.length; a++) {
                var temp = taxObject[a];
                if (temp.UUID === pli.UUID) {
                    pli.GrossValue = temp.taxBreakup.grossValue;
                    pli.PromoAmount = temp.taxBreakup.promoAmount;
                    pli.PromoCode = temp.taxBreakup.promoCode;
                    pli.Tax1 = temp.taxBreakup.stateTotal;
                    pli.Tax2 = temp.taxBreakup.countyTotal;
                    pli.Tax3 = temp.taxBreakup.cityTotal;
                    pli.Tax4 = temp.taxBreakup.additionalCityTotal;
                    pli.Tax5 = temp.taxBreakup.districtTotal;
                    pli.Tax6 = temp.taxBreakup.additionalDistrictTotal;
                    pli.TaxAmount = temp.taxBreakup.lineItemTax;
                    pli.SubTotal = temp.taxBreakup.subTotal;
                    pli.NetAmount = temp.taxBreakup.netAmount;
                    if (pli.embossingObj && 'UUID' in pli.embossingObj && pli.embossingObj.UUID) {
                        pli.embossingObj = addDataOnOption(pli.embossingObj, taxObject);
                    }
                    if (pli.engravingObj && 'UUID' in pli.engravingObj && pli.engravingObj.UUID) {
                        pli.engravingObj = addDataOnOption(pli.engravingObj, taxObject);
                    }
                    if (pli.giftWrapObj && 'UUID' in pli.giftWrapObj && pli.giftWrapObj.UUID) {
                        pli.giftWrapObj = addDataOnOption(pli.giftWrapObj, taxObject);
                    }
                }
            }
            productLineItems[key] = pli;
        }
    });

    return productLineItems;
}

/**
* To populate the taxes at each PLI/OptionItem and adjsuting the amount/taxes after proration.
* @param {Order} order Order container.
* @param {json} commerceObject Commerce Items JSON
* @returns {json}
*/
function amountAdjustmentsAndWrapping(order, commerceObject) {
    var commerceItemsObject = commerceObject;
    var taxObj = populatePriceBreakup(order);
    commerceItemsObject = persistData(commerceItemsObject, taxObj);

    for (var z = 0; z < commerceItemsObject.length; z++) {
        var commerceItem = commerceItemsObject[z];
        commerceItem.GrossValue = parseFloat(commerceItem.GrossValue).toFixed(TWO_DECIMAL_PLACES);
        commerceItem.SubTotal = parseFloat(commerceItem.SubTotal).toFixed(TWO_DECIMAL_PLACES);
        commerceItem.PromoAmount = parseFloat(commerceItem.PromoAmount).toFixed(TWO_DECIMAL_PLACES);
        commerceItem.TaxAmount = parseFloat(commerceItem.TaxAmount).toFixed(TWO_DECIMAL_PLACES);
        commerceItem.Tax1 = parseFloat(commerceItem.Tax1).toFixed(TWO_DECIMAL_PLACES);
        commerceItem.Tax2 = parseFloat(commerceItem.Tax2).toFixed(TWO_DECIMAL_PLACES);
        commerceItem.Tax3 = parseFloat(commerceItem.Tax3).toFixed(TWO_DECIMAL_PLACES);
        commerceItem.Tax4 = parseFloat(commerceItem.Tax4).toFixed(TWO_DECIMAL_PLACES);
        commerceItem.Tax5 = parseFloat(commerceItem.Tax5).toFixed(TWO_DECIMAL_PLACES);
        commerceItem.Tax6 = parseFloat(commerceItem.Tax6).toFixed(TWO_DECIMAL_PLACES);
        if (commerceItem.engravingObj) {
            commerceItem.engravingObj.GrossValue = parseFloat(commerceItem.engravingObj.GrossValue).toFixed(TWO_DECIMAL_PLACES);
            commerceItem.engravingObj.SubTotal = parseFloat(commerceItem.engravingObj.SubTotal).toFixed(TWO_DECIMAL_PLACES);
            commerceItem.engravingObj.TaxAmount = parseFloat(commerceItem.engravingObj.TaxAmount).toFixed(TWO_DECIMAL_PLACES);
            commerceItem.engravingObj.PromoAmount = parseFloat(commerceItem.engravingObj.PromoAmount).toFixed(TWO_DECIMAL_PLACES);
            commerceItem.engravingObj.NetAmount = parseFloat(commerceItem.engravingObj.NetAmount).toFixed(TWO_DECIMAL_PLACES);
            commerceItem.engravingObj.Tax1 = parseFloat(commerceItem.engravingObj.Tax1).toFixed(TWO_DECIMAL_PLACES);
            commerceItem.engravingObj.Tax2 = parseFloat(commerceItem.engravingObj.Tax2).toFixed(TWO_DECIMAL_PLACES);
            commerceItem.engravingObj.Tax3 = parseFloat(commerceItem.engravingObj.Tax3).toFixed(TWO_DECIMAL_PLACES);
            commerceItem.engravingObj.Tax4 = parseFloat(commerceItem.engravingObj.Tax4).toFixed(TWO_DECIMAL_PLACES);
            commerceItem.engravingObj.Tax5 = parseFloat(commerceItem.engravingObj.Tax5).toFixed(TWO_DECIMAL_PLACES);
            commerceItem.engravingObj.Tax6 = parseFloat(commerceItem.engravingObj.Tax6).toFixed(TWO_DECIMAL_PLACES);
        }
        if (commerceItem.embossingObj) {
            commerceItem.embossingObj.GrossValue = parseFloat(commerceItem.embossingObj.GrossValue).toFixed(TWO_DECIMAL_PLACES);
            commerceItem.embossingObj.SubTotal = parseFloat(commerceItem.embossingObj.SubTotal).toFixed(TWO_DECIMAL_PLACES);
            commerceItem.embossingObj.TaxAmount = parseFloat(commerceItem.embossingObj.TaxAmount).toFixed(TWO_DECIMAL_PLACES);
            commerceItem.embossingObj.PromoAmount = parseFloat(commerceItem.embossingObj.PromoAmount).toFixed(TWO_DECIMAL_PLACES);
            commerceItem.embossingObj.NetAmount = parseFloat(commerceItem.embossingObj.NetAmount).toFixed(TWO_DECIMAL_PLACES);
            commerceItem.embossingObj.Tax1 = parseFloat(commerceItem.embossingObj.Tax1).toFixed(TWO_DECIMAL_PLACES);
            commerceItem.embossingObj.Tax2 = parseFloat(commerceItem.embossingObj.Tax2).toFixed(TWO_DECIMAL_PLACES);
            commerceItem.embossingObj.Tax3 = parseFloat(commerceItem.embossingObj.Tax3).toFixed(TWO_DECIMAL_PLACES);
            commerceItem.embossingObj.Tax4 = parseFloat(commerceItem.embossingObj.Tax4).toFixed(TWO_DECIMAL_PLACES);
            commerceItem.embossingObj.Tax5 = parseFloat(commerceItem.embossingObj.Tax5).toFixed(TWO_DECIMAL_PLACES);
            commerceItem.embossingObj.Tax6 = parseFloat(commerceItem.embossingObj.Tax6).toFixed(TWO_DECIMAL_PLACES);
        }
        if (commerceItem.giftWrapObj) {
            commerceItem.giftWrapObj.GrossValue = parseFloat(commerceItem.giftWrapObj.GrossValue).toFixed(TWO_DECIMAL_PLACES);
            commerceItem.giftWrapObj.SubTotal = parseFloat(commerceItem.giftWrapObj.SubTotal).toFixed(TWO_DECIMAL_PLACES);
            commerceItem.giftWrapObj.TaxAmount = parseFloat(commerceItem.giftWrapObj.TaxAmount).toFixed(TWO_DECIMAL_PLACES);
            commerceItem.giftWrapObj.PromoAmount = parseFloat(commerceItem.giftWrapObj.PromoAmount).toFixed(TWO_DECIMAL_PLACES);
            commerceItem.giftWrapObj.NetAmount = parseFloat(commerceItem.giftWrapObj.NetAmount).toFixed(TWO_DECIMAL_PLACES);
            commerceItem.giftWrapObj.Tax1 = parseFloat(commerceItem.giftWrapObj.Tax1).toFixed(TWO_DECIMAL_PLACES);
            commerceItem.giftWrapObj.Tax2 = parseFloat(commerceItem.giftWrapObj.Tax2).toFixed(TWO_DECIMAL_PLACES);
            commerceItem.giftWrapObj.Tax3 = parseFloat(commerceItem.giftWrapObj.Tax3).toFixed(TWO_DECIMAL_PLACES);
            commerceItem.giftWrapObj.Tax4 = parseFloat(commerceItem.giftWrapObj.Tax4).toFixed(TWO_DECIMAL_PLACES);
            commerceItem.giftWrapObj.Tax5 = parseFloat(commerceItem.giftWrapObj.Tax5).toFixed(TWO_DECIMAL_PLACES);
            commerceItem.giftWrapObj.Tax6 = parseFloat(commerceItem.giftWrapObj.Tax6).toFixed(TWO_DECIMAL_PLACES);
        }
        commerceItem.NetAmount = parseFloat(commerceItem.NetAmount).toFixed(TWO_DECIMAL_PLACES);
        commerceItemsObject[z] = commerceItem;
    };

    return commerceItemsObject;
}

/**
* Fetches the pre-sale item requested delivery date.
* @param {ProductLineItem} product line item.
* @returns {Date} in-stock date
*/
function getPreSaleItemRequestedDeliveryDate(lineItem) {
    var requestedDeliverDate;
    var apiProduct = dw.catalog.ProductMgr.getProduct(lineItem.getProductID());
    var productAvailabilityModel = apiProduct.getAvailabilityModel();
    if (productAvailabilityModel && productAvailabilityModel.getInventoryRecord()) {
        requestedDeliverDate = productAvailabilityModel.getInventoryRecord().getInStockDate();
    }
    return requestedDeliverDate;
}

/**
* Fetches the item information for an Order.
* @param {Order} order Order container.
* @param {String} shipping country
* @returns {json} Commerce Items JSON
*/
function getPOItemsInfo(order, isEswEnabled, shippingCountry) {
    exportLogger.debug('Getting POItemsInfo for, order {0}', order.getOrderNo());
    var Site = require('dw/system/Site');
    var inventoryLocation = Site.getCurrent().getCustomPreferenceValue('inventoryLocation');
    var shippingLineItemSKU = Site.getCurrent().getCustomPreferenceValue('shippingLineItemSKU');
    var allProductLineItems = order.getProductLineItems();
    var allShipments = order.getShipments();
    var sequenceNumber = 1;
    var commerceItems = new ArrayList();
    var lineItemTotalNetAmount = getLineItemTotalNetAmount(allProductLineItems);
    
    var eswOrderNo = !empty(order.custom.eswOrderNo) ? order.custom.eswOrderNo : '';

    var tax1 = ZERO;
    var tax2 = ZERO;
    var tax3 = ZERO;
    var tax4 = ZERO;
    var tax5 = ZERO;
    var tax6 = ZERO;

    for (var a = 0; a < allProductLineItems.length; a++) {
        var obj = { PromoAmount: parseFloat(ZERO), TaxAmount: parseFloat(ZERO), SubTotal: parseFloat(ZERO), Tax1: parseFloat(ZERO), Tax2: parseFloat(ZERO), Tax3: parseFloat(ZERO), Tax4: parseFloat(ZERO), Tax5: parseFloat(ZERO), Tax6: parseFloat(ZERO) };
        var productLineItem = allProductLineItems[a];

        obj.UUID = productLineItem.UUID;
        obj.POItemNumber = sequenceNumber;
        obj.SKUNumber = productLineItem.getProductID();
        obj.Quantity = productLineItem.quantityValue.toString();
        var requestedDeliveryDate;

        if ('custom' in productLineItem) {
            if ('isPreOrderProduct' in productLineItem.custom && (productLineItem.custom.isPreOrderProduct)) {
                if (productLineItem.custom.isPreOrderProduct === true) {
                    obj.PreSale = 'Y';
                    requestedDeliveryDate = formatDate(getPreSaleItemRequestedDeliveryDate(productLineItem), DATE_FORMAT);
                } else {
                    obj.PreSale = 'N';
                }
            } else {
                obj.PreSale = '';
            }
        }

        obj.RequestedDeliveryDate = requestedDeliveryDate ? requestedDeliveryDate : formatDate(new Date(), DATE_FORMAT);
        obj.IsThisBillable = isThisBillableItem(productLineItem);
        obj.InventoryLocation = inventoryLocation;
        obj.DutyAmount = getLineItemDutyAmount(productLineItem);
        obj.ConsTaxByMGI = isLineItemConsTaxByMGI(eswOrderNo, isEswEnabled);
        obj.ConsumerGrossValue = getLineItemConsumerGrossValue(productLineItem, isEswEnabled, shippingCountry);
        obj.ConsumerSubTotal = getLineItemConsumerSubTotal(productLineItem, isEswEnabled);
        obj.ConsumerTaxAmount = getLineItemConsumerTaxAmount(productLineItem, isEswEnabled);
        obj.ConsumerDutyAmount = getLineItemConsumerDutyAmount(productLineItem, isEswEnabled);
        obj.ConsumerNetAmount = getLineItemConsumerNetAmount(order, productLineItem, isEswEnabled, eswOrderNo);
        obj.CrossBorderTax1 = getLineItemCrossBorderTax1(productLineItem, isEswEnabled);
        obj.CrossBorderNetAmount = getLineItemCrossBorderNetAmount(productLineItem, isEswEnabled);
        obj.CrossBorderPromoAmount = getLineItemPromoAmount(productLineItem, shippingCountry);
        obj.CrossBorderConsumerPromoAmount = getLineItemConsumerPromoAmount(productLineItem, shippingCountry);
        obj.CrossBorderSubTotal = getLineItemSubTotal(productLineItem);
        obj.CrossBorderGrossValue = getLineItemCrossBorderGrossValue(productLineItem, shippingCountry);
        obj.ShippingCost = getLineItemShippingCost(productLineItem, lineItemTotalNetAmount, eswOrderNo);
        obj.LoyaltyAmount = crossBorderUtils.getSwellDiscountAmount(order);
        obj.ConsumerLoyaltyAmount = getConsumerLoyaltyAmount(order);
        obj.ConsumerRoundingAmount = getConsumerRoundingAmount(productLineItem);
        obj.CrossBorderPromoCode = getPromotionCode(order, productLineItem);

        var personalizationsInfo = createPOItemPersonalizations(order, productLineItem, isEswEnabled, shippingCountry);

        if (personalizationsInfo) {
            if (personalizationsInfo.OrderGiftMessage) {
                obj.giftMessageObj = personalizationsInfo.OrderGiftMessage;
            }

            if (personalizationsInfo.GiftWrap) {
                obj.giftWrapObj = personalizationsInfo.GiftWrap;
            }

            if (personalizationsInfo.Embossing) {
                obj.embossingObj = personalizationsInfo.Embossing;
            }

            if (personalizationsInfo.Engraving) {
                obj.engravingObj = personalizationsInfo.Engraving;
            }
        }
        commerceItems[sequenceNumber - 1] = obj;
        sequenceNumber++;
        requestedDeliveryDate = null;
    }

    if (allShipments) {
        var shipObj = { PromoAmount: parseFloat(ZERO), TaxAmount: parseFloat(ZERO), SubTotal: parseFloat(ZERO), Tax1: parseFloat(ZERO), Tax2: parseFloat(ZERO), Tax3: parseFloat(ZERO), Tax4: parseFloat(ZERO), Tax5: parseFloat(ZERO), Tax6: parseFloat(ZERO)};
        for (var i = 0; i < allShipments.length; i++) {
            var shipment = allShipments[i];
            for (var z = 0; z < shipment.shippingLineItems.length; z++) {
                var shippingLineItem = shipment.shippingLineItems[z];
                shipObj.UUID = shippingLineItem.UUID;
                shipObj.PromoCode = getPromotionCode(order, shippingLineItem);
                shipObj.POItemNumber = sequenceNumber;
                shipObj.SKUNumber = shippingLineItemSKU;
                shipObj.Quantity = 1;
                shipObj.InventoryLocation = inventoryLocation;
                shipObj.GrossValue = parseFloat(shippingLineItem.basePrice.value).toFixed(TWO_DECIMAL_PLACES);
                shipObj.SubTotal = parseFloat(shippingLineItem.adjustedPrice.value).toFixed(TWO_DECIMAL_PLACES);
                shipObj.PromoAmount = (parseFloat(shippingLineItem.basePrice.value) - parseFloat(shippingLineItem.adjustedPrice.value)).toFixed(TWO_DECIMAL_PLACES);

                if ('sabrixStateTotal' in shippingLineItem.custom && shippingLineItem.custom.sabrixStateTotal) {
                    this.tax1 = parseFloat(shippingLineItem.custom.sabrixStateTotal);
                    shipObj.Tax1 = this.tax1;
                }
                if ('sabrixCountyTotal' in shippingLineItem.custom && shippingLineItem.custom.sabrixCountyTotal) {
                    this.tax2 = parseFloat(shippingLineItem.custom.sabrixCountyTotal);
                    shipObj.Tax2 = this.tax2;
                }
                if ('sabrixCityTotal' in shippingLineItem.custom && shippingLineItem.custom.sabrixCityTotal) {
                    this.tax3 = parseFloat(shippingLineItem.custom.sabrixCityTotal);
                    shipObj.Tax3 = this.tax3;
                }
                if ('sabrixDistrictTotal' in shippingLineItem.custom && shippingLineItem.custom.sabrixDistrictTotal) {
                    this.tax4 = parseFloat(shippingLineItem.custom.sabrixDistrictTotal);
                    shipObj.Tax4 = this.tax4;
                }
                if ('sabrixAdditionalCityTotal' in shippingLineItem.custom && shippingLineItem.custom.sabrixAdditionalCityTotal) {
                    this.tax5 = parseFloat(shippingLineItem.custom.sabrixAdditionalCityTotal);
                    shipObj.Tax5 = this.tax5;
                }
                if ('sabrixAdditionalDistrictTotal' in shippingLineItem.custom && shippingLineItem.custom.sabrixAdditionalDistrictTotal) {
                    this.tax6 = parseFloat(shippingLineItem.custom.sabrixAdditionalDistrictTotal);
                    shipObj.Tax6 = this.tax6;
                }

                if (order.shipments[0].shippingPriceAdjustments && order.shipments[0].shippingPriceAdjustments.length > 0) {
                    var taxes = order.shipments[0].shippingPriceAdjustments[0].custom;
                    shipObj.Tax1 -= taxes.sabrixStateTotal;
                    shipObj.Tax2 -= taxes.sabrixCountyTotal;
                    shipObj.Tax3 -= taxes.sabrixCityTotal;
                    shipObj.Tax4 -= taxes.sabrixDistrictTotal;
                    shipObj.Tax5 -= taxes.sabrixAdditionalCityTotal;
                    shipObj.Tax6 -= taxes.sabrixAdditionalDistrictTotal;
                    shipObj.TaxAmount = order.shipments[0].shippingPriceAdjustments[0].tax.value;
                }
                
                // eqv of shipObj.TaxAmount = parseFloat(shippingLineItem.tax.value) + shipObj.TaxAmount;
                shipObj.TaxAmount = shippingLineItem.adjustedTax.value;

                if (order.adjustedShippingTotalPrice.value <= ZERO) {
                    shipObj.TaxAmount = parseFloat(ZERO);
                    shipObj.Tax1 = parseFloat(ZERO).toFixed(TWO_DECIMAL_PLACES);
                    shipObj.Tax2 = parseFloat(ZERO).toFixed(TWO_DECIMAL_PLACES);
                    shipObj.Tax3 = parseFloat(ZERO).toFixed(TWO_DECIMAL_PLACES);
                    shipObj.Tax4 = parseFloat(ZERO).toFixed(TWO_DECIMAL_PLACES);
                    shipObj.Tax5 = parseFloat(ZERO).toFixed(TWO_DECIMAL_PLACES);
                    shipObj.Tax6 = parseFloat(ZERO).toFixed(TWO_DECIMAL_PLACES);
                }

                shipObj.TaxAmount = (shipObj.TaxAmount).toFixed(TWO_DECIMAL_PLACES);

                shipObj.NetAmount = (parseFloat(shippingLineItem.adjustedPrice.value) + parseFloat(shipObj.TaxAmount)).toFixed(TWO_DECIMAL_PLACES);
                shipObj.IsThisBillable = isThisBillableItem(shippingLineItem);
                shipObj.CrossBorderNetAmount = parseFloat(ZERO).toFixed(TWO_DECIMAL_PLACES);
                shipObj.IsThisBillableCrossBorder = isShipmentBillableCrossBorder(order);
                commerceItems[sequenceNumber - 1] = shipObj;
                sequenceNumber++;
            }
        }
    }
    exportLogger.debug('POItemsInfo for, order {0} , Commerce Items: {1}', order.getOrderNo(), JSON.stringify(commerceItems));
    return commerceItems;
}

/**
* To find if Duty is included on the Order.
* @param {Order} order Order container.
* @returns {string} Yes or No
*/
function isDutyInclusive(order, eswOrderNo) {
    return 'Y';
}

/**
* To find if VAT is included on the Order.
* @param {Order} order Order container.
* @returns {string} Yes or No
*/
function isVATInclusive(order, eswOrderNo, shippingCountry) {
    if (eswOrderNo) {
        return shippingCountry.value === 'CA'  ? 'N' : 'Y';
    }
    var siteId = Site.current.getID();
    return (siteId == 'OliviaBurtonUK' || siteId == 'BossWatches' || siteId == 'HourTime') ? 'Y' : 'N';
}

/**
* To add specific days to the Date object.
* @param {Date} date
* @param {number} days
* @returns {Date}
*/
function addDays(date, days) {
    var result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}

/**
* Fetches the SAP payment method from the custom attribute of PaymentMethod and AuthExpirationDate.
* @param {Order} order Order container.
* @returns {json} Payment Method and Authorization Date JSON
*/
function getPaymentMethodData(order) {
    var orderPaymentInstruments = order.getPaymentInstruments();
    var paymentMethodsMultiplePayments = new ArrayList();
    var presaleOrderAuthExpirationDays = dw.system.Site.getCurrent().getCustomPreferenceValue('presaleOrderAuthExpirationDays');
    var paymentMethodData = {};
    var KLARNA_SLICE_IT_CODE = Resource.msg('checkout.payment.method.klarna.slice.it.brand.code', 'checkout', null);
    var KLARNA_SLICE_IT_TEXT = Resource.msg('checkout.payment.method.klarna.slice.it.brand.order.export.text', 'checkout', null);
    var KLARNA_PAY_LATER_CODE = Resource.msg('checkout.payment.method.klarna.pay.later.brand.code', 'checkout', null);
    var KLARNA_PAY_LATER_TEXT = Resource.msg('checkout.payment.method.klarna.pay.later.brand.order.export.text', 'checkout', null);

    if (orderPaymentInstruments && orderPaymentInstruments.length > 0) {
        for (var b = 0; b < orderPaymentInstruments.length; b++) {
            var orderPaymentInstrument = orderPaymentInstruments[b];
            paymentMethodsMultiplePayments[b] = orderPaymentInstrument.getPaymentMethod();
            if ('isPreorder' in order.custom && order.custom.isPreorder) {
                presaleOrderAuthExpirationDays = presaleOrderAuthExpirationDays ? presaleOrderAuthExpirationDays : NINETY;
                paymentMethodData.AuthExpirationDate = formatDate(addDays(order.getCreationDate(), presaleOrderAuthExpirationDays), DATE_FORMAT);
            } else {
                if ('authExpirationDate' in orderPaymentInstrument.custom) {
                    if (orderPaymentInstrument.custom.authExpirationDate) {
                        paymentMethodData.AuthExpirationDate = orderPaymentInstrument.custom.authExpirationDate;
                    } else {
                        paymentMethodData.AuthExpirationDate = formatDate(addDays(order.getCreationDate(), TEN), DATE_FORMAT);
                    }
                } else {
                    paymentMethodData.AuthExpirationDate = formatDate(addDays(order.getCreationDate(), TEN), DATE_FORMAT);
                }
            }

        }
    }

    var paymentMethodObj = PaymentMgr.getPaymentMethod(paymentMethodsMultiplePayments[0]);
    
    if (order.custom.Adyen_paymentMethod && order.custom.Adyen_paymentMethod.search(constants.KLARNA_PAYMENT_METHOD_TEXT) > -1) {
        switch (order.custom.Adyen_paymentMethod) {
            case KLARNA_SLICE_IT_CODE:
                paymentMethodData.paymentMethod=KLARNA_SLICE_IT_TEXT;
                break;
            case KLARNA_PAY_LATER_CODE:
                paymentMethodData.paymentMethod=KLARNA_PAY_LATER_TEXT;
        }
        
    } else {
        if ('SAPPaymentMethod' in paymentMethodObj.custom && paymentMethodObj.custom.SAPPaymentMethod) {
            paymentMethodData.paymentMethod = paymentMethodObj.custom.SAPPaymentMethod;
        } else {
            paymentMethodData.paymentMethod = '';
        }
    }
    
    return paymentMethodData;
}

/**
* To find if the shipping is charged on an order
* @param {Order} order Order container.
* @returns {string} Y or N value
*/
function isShippingCharged(order) {
    if (order.getShippingTotalPrice() > 0) {
        return 'Y';
    }
    return 'N';
}

/**
* To check if order is cross border send shipping cost
* @param {Order} order Order container.
* @param {Boolean} isEswEnabled to check if eShop World is enabled or not
* @returns {Decimal} shipping cost
*/
function getShippingCost(order, eswOrderNo) {
    if (eswOrderNo) {
        var allProductLineItems = order.getProductLineItems();
        var totalLineItemNetAmount = getLineItemTotalNetAmount(allProductLineItems)
        var headerShippingCost =  Site.getCurrent().getCustomPreferenceValue('shippingCost');
        var totalLineItemShippingCost = 0.00;
        for (var a = 0; a < allProductLineItems.length; a++) {
            productLineItem = allProductLineItems[a];
            var lineItemShippingCost = getLineItemShippingCost(productLineItem, totalLineItemNetAmount, eswOrderNo)
            totalLineItemShippingCost = (parseFloat(totalLineItemShippingCost) + parseFloat(lineItemShippingCost)).toFixed(TWO_DECIMAL_PLACES);
        }
        if (headerShippingCost !== totalLineItemShippingCost) {
            return totalLineItemShippingCost;
        } else {
            return parseFloat(headerShippingCost).toFixed(TWO_DECIMAL_PLACES);
        }
    } else {
        return parseFloat(ZERO).toFixed(TWO_DECIMAL_PLACES);
    }
}

/**
* To get billing currency from order
* @param {Order} order Order container.
* @returns {String} billing currency
*/
function getBillingCurrency(order, isEswEnabled) {
    if (isEswEnabled) {
        var billingCurrency = !empty(order.custom.eswRetailerCurrencyCode) ? order.custom.eswRetailerCurrencyCode
                : order.getCurrencyCode();
        return billingCurrency;
    }
    return order.getCurrencyCode();
}

/**
* get commercial entity of an order
* @param {String} eswOrderNo or null.
* @returns {String} ESW or null
*/
function getCommercialEntity(eswOrderNo, isEswEnabled) {
    if (isEswEnabled) {
        var commercialEntity = eswOrderNo ? 'ESW' : '';
        return commercialEntity;
    }
    return '';
}

/**
* get consumer exchange rate of an order
* @param {Order} order Order container.
* @returns {Number} consumer exchange rate
*/
function getConsumerExchangeRate(order) {
    var consumerExchangeRate = !empty(order.custom.eswFxrate) ? order.custom.eswFxrate 
            : parseFloat(ZERO).toFixed(TWO_DECIMAL_PLACES);
    return consumerExchangeRate;
}

/**
* To get billing currency from order
* @param {Order} order Order container.
* @returns {String} billing currency
*/
function getConsumerCurrency(order) {
    var consumerCurrency = !empty(order.custom.eswShopperCurrencyCode) ? order.custom.eswShopperCurrencyCode
            : order.getCurrencyCode();
    return consumerCurrency;
}

/**
* get sub total of an order
* @param {Order} order Order container.
* @returns {Number} sub total
*/
function getSubTotal(order, eswOrderNo) {
    var subTotal;
    if (eswOrderNo) {
        var eswRetailerCurrencyTotal = !empty(order.custom.eswRetailerCurrencyTotal) ? order.custom.eswRetailerCurrencyTotal
                : parseFloat(ZERO).toFixed(TWO_DECIMAL_PLACES);
        var eswRetailerCurrencyDelivery = !empty(order.custom.eswRetailerCurrencyDelivery) ? order.custom.eswRetailerCurrencyDelivery
                : parseFloat(ZERO).toFixed(TWO_DECIMAL_PLACES);
        subTotal = eswRetailerCurrencyTotal+ eswRetailerCurrencyDelivery;
    } else {
        subTotal = order.adjustedMerchandizeTotalPrice.value + order.adjustedShippingTotalPrice.value
    }
    return parseFloat(subTotal).toFixed(TWO_DECIMAL_PLACES);
}

/**
* get total tax of an order
* @param {Order} order Order container.
* @returns {Number} total tax
*/
function getTotalTax(order, eswOrderNo) {
    var totalTax;
    if (eswOrderNo) {
        totalTax = parseFloat(ZERO).toFixed(TWO_DECIMAL_PLACES);
    } else {
        totalTax = order.getTotalTax();
    }
    return parseFloat(totalTax).toFixed(TWO_DECIMAL_PLACES);
}

/**
* get net amount of an order
* @param {Order} order Order container.
* @returns {Number} net amount
*/
function getNetAmount(order, eswOrderNo) {
    var netAmount;
    if (eswOrderNo) {
        var eswRetailerCurrencyTotal = !empty(order.custom.eswRetailerCurrencyTotal) ? order.custom.eswRetailerCurrencyTotal
                : parseFloat(ZERO).toFixed(TWO_DECIMAL_PLACES);
        var eswRetailerCurrencyDelivery = !empty(order.custom.eswRetailerCurrencyDelivery) ? order.custom.eswRetailerCurrencyDelivery
                : parseFloat(ZERO).toFixed(TWO_DECIMAL_PLACES);
        netAmount = eswRetailerCurrencyTotal+ eswRetailerCurrencyDelivery;
    } else {
        netAmount = order.getTotalGrossPrice();
    }
    return parseFloat(netAmount).toFixed(TWO_DECIMAL_PLACES);
}

/**
* get auth amount of an order
* @param {Order} order Order container.
* @returns {Number} total tax
*/
function getAuthAmount(order, eswOrderNo) {
    var authAmount;
    if (eswOrderNo) {
        authAmount = order.custom.eswRetailerCurrencyPaymentAmount;
    } else {
        authAmount = order.getTotalGrossPrice();
    }
    return parseFloat(authAmount).toFixed(TWO_DECIMAL_PLACES);
}

/**
* To find if the shipping is charged by MGI
* @param {Order} order Order container.
* @returns {string} Y or N value
*/
function isShippingChargedByMGI(eswOrderNo) {
    if (eswOrderNo) {
        return 'N';
    }
    return 'Y';
}

/**
* To find if duty is charge by MGI
* @param {Order} order Order container.
* @returns {string} Y or N value
*/
function isDutyByMGI(eswOrderNo) {
    if (eswOrderNo) {
        return 'N';
    }
    return 'Y';
}

/**
* To find if duty is charge by MGI
* @param {Order} order Order container.
* @returns {string} Y or N value
*/
function isInsuranceByMGI(eswOrderNo) {
    if (eswOrderNo) {
        return 'N';
    }
    return 'Y';
}

/**
* To find if consumer tax by MGI
* @param {Order} order Order container.
* @returns {string} Y or N value
*/
function isConsumerTaxByMGI(eswOrderNo) {
    if (eswOrderNo) {
        return 'N';
    }
    return 'Y';
}

/**
* To get consumer gross value
* @param {Order} order Order container.
* @returns {Number} total consumer gross value
*/
function getConsumerGrossValue(order) {
    var eswShopperCurrencyItemPriceInfoBeforeDiscount = !empty(order.custom.eswShopperCurrencyItemPriceInfoBeforeDiscount) 
        ? order.custom.eswShopperCurrencyItemPriceInfoBeforeDiscount : parseFloat(ZERO).toFixed(TWO_DECIMAL_PLACES);
    return eswShopperCurrencyItemPriceInfoBeforeDiscount;
}

/**
* To get consumer sub total
* @param {Order} order Order container.
* @returns {Number} consume sub total value
*/
function getConsumerGrossValue(order) {
    if (order.custom.eswShopperCurrencyItemSubTotal) {
        return (order.custom.eswShopperCurrencyItemSubTotal).toFixed(TWO_DECIMAL_PLACES)
    }
    
    return (order.adjustedMerchandizeTotalPrice.value + order.adjustedShippingTotalPrice.value).toFixed(TWO_DECIMAL_PLACES);
}

/**
* To get Incoterms
* @param {Order} order Order container.
* @returns {Number} consume net amount value
*/
function getIncoterms(countryCode) {
    var dduCountyCodes = !empty(Site.getCurrent().getCustomPreferenceValue('incoTerms')) ?
            Site.getCurrent().getCustomPreferenceValue('incoTerms') : '';
    if (dduCountyCodes.length > 0) {
        for (i = 0; i < dduCountyCodes.length; i++) {
            if (countryCode == dduCountyCodes[i]) {
                return 'DDU';
            }
        }
    }
    return 'DDP';
}
/**
* To get consumer sub total
* @param {Order} order Order container.
* @returns {Number} consumer sub total value
*/
function getConsumerSubTotal(order, eswOrderNo) {
    if (eswOrderNo) {
        var eswShopperCurrencyTotal = !empty(order.custom.eswShopperCurrencyTotal) ? order.custom.eswShopperCurrencyTotal 
                : parseFloat(ZERO).toFixed(TWO_DECIMAL_PLACES);
        var eswShopperCurrencyDelivery = !empty(order.custom.eswShopperCurrencyDelivery) ? order.custom.eswShopperCurrencyDelivery
                : parseFloat(ZERO).toFixed(TWO_DECIMAL_PLACES);
        var consumerSubTotal = (parseFloat(eswShopperCurrencyTotal) + parseFloat(eswShopperCurrencyDelivery)).toFixed(TWO_DECIMAL_PLACES);
        return consumerSubTotal;
    }
    return (order.adjustedMerchandizeTotalPrice.value + order.adjustedShippingTotalPrice.value).toFixed(TWO_DECIMAL_PLACES);
}

/**
* To get consumer total tax
* @param {Order} order Order container.
* @returns {Number} value of consumer total tax
*/
function getConsumerTotalTax(order) {
    var consumerTotalTax;
    if (!empty(order.custom.eswShopperCurrencyTaxes) || !empty(order.custom.eswShopperCurrencyDeliveryTaxes) 
            || !empty(order.custom.eswShopperCurrencyOtherTaxes)) {
        var eswShopperCurrencyTaxes = !empty(order.custom.eswShopperCurrencyTaxes) 
            ? order.custom.eswShopperCurrencyTaxes : parseFloat(ZERO).toFixed(TWO_DECIMAL_PLACES);
        var eswShopperCurrencyDeliveryTaxes = !empty(order.custom.eswShopperCurrencyDeliveryTaxes) 
            ? order.custom.eswShopperCurrencyDeliveryTaxes : parseFloat(ZERO).toFixed(TWO_DECIMAL_PLACES);
        var eswShopperCurrencyOtherTaxes = !empty(order.custom.eswShopperCurrencyOtherTaxes) 
            ? order.custom.eswShopperCurrencyOtherTaxes : parseFloat(ZERO).toFixed(TWO_DECIMAL_PLACES);
        consumerTotalTax = parseFloat(eswShopperCurrencyTaxes + eswShopperCurrencyDeliveryTaxes 
                + eswShopperCurrencyOtherTaxes).toFixed(TWO_DECIMAL_PLACES);
    } else {
        consumerTotalTax = parseFloat(order.getTotalTax()).toFixed(TWO_DECIMAL_PLACES);
    }
    return consumerTotalTax;
}

/**
* To get consumer total duty amount
* @param {Order} order Order container.
* @returns {Number} value of consumer total duty amount
*/
function getConsumerTotalDutyAmount(order) {
    var consumerTotalDutyAmount;
    if (!empty(order.custom.eswShopperCurrencyDuty) || !empty(order.custom.eswShopperCurrencyDeliveryDuty)) {
        var eswShopperCurrencyDuty = !empty(order.custom.eswShopperCurrencyDuty) 
            ? order.custom.eswShopperCurrencyDuty : parseFloat(ZERO).toFixed(TWO_DECIMAL_PLACES);
        var eswShopperCurrencyDeliveryDuty = !empty(order.custom.eswShopperCurrencyDeliveryDuty) 
            ? order.custom.eswShopperCurrencyDeliveryDuty : parseFloat(ZERO).toFixed(TWO_DECIMAL_PLACES);
        consumerTotalDutyAmount = (parseFloat(eswShopperCurrencyDuty) + parseFloat(eswShopperCurrencyDeliveryDuty)).toFixed(TWO_DECIMAL_PLACES);
    } else {
        consumerTotalDutyAmount = parseFloat(ZERO).toFixed(TWO_DECIMAL_PLACES);
    }
    return consumerTotalDutyAmount;
}

/**
* To get consumer net amount
* @param {Order} order Order container.
* @returns {Number} value of consumer net amount
*/
function getConsumerNetAmount(order, eswOrderNo) {
    var consumerNetAmount;
    if (eswOrderNo) {
        var consumerSubTotal = getConsumerSubTotal(order, eswOrderNo);
        var consumerTotalTax = getConsumerTotalTax(order);
        var consumerTotalDutyAmount = getConsumerTotalDutyAmount(order);
        consumerNetAmount = (parseFloat(consumerSubTotal) + parseFloat(consumerTotalTax) + parseFloat(consumerTotalDutyAmount)).toFixed(TWO_DECIMAL_PLACES);
    } else {
        consumerNetAmount = parseFloat(order.getTotalGrossPrice()).toFixed(TWO_DECIMAL_PLACES);
    }
    return consumerNetAmount;
}

/**
* To get consumer auth amount
* @param {Order} order Order container.
* @param {Boolean} to check if esw cartridge is enabled or not
* @param {String} esw order no
* @returns {Number} value of consumer net amount
*/
function getConsumerAuthAmount(order, eswOrderNo) {
    var consumerAuthAmount;
    if (eswOrderNo) {
        consumerAuthAmount = parseFloat(order.custom.eswShopperCurrencyPaymentAmount).toFixed(TWO_DECIMAL_PLACES);
    } else {
        consumerAuthAmount = parseFloat(order.getTotalGrossPrice()).toFixed(TWO_DECIMAL_PLACES);
    }
    return consumerAuthAmount;
}

/**
* To get line items total net amount
* @param {ProductLineItem} lineItem Line Item.
* @returns {Number} value of total net amount
*/
function getLineItemTotalNetAmount(allProductLineItems) {
    var productLineItem
    var totalLineItemNetAmount = 0.00;
    for (var a = 0; a < allProductLineItems.length; a++) {
        productLineItem = allProductLineItems[a];
        var eswRetailerCurrencyItemSubTotal = !empty(productLineItem.custom.eswRetailerCurrencyItemSubTotal) ?  productLineItem.custom.eswRetailerCurrencyItemSubTotal : 0.00;
        totalLineItemNetAmount = totalLineItemNetAmount + eswRetailerCurrencyItemSubTotal;
    }
    return parseFloat(totalLineItemNetAmount).toFixed(TWO_DECIMAL_PLACES);
}

/**
* To get line item shipping cost
* @param {ProductLineItem} lineItem Line Item.
* @param {Number} total line item net amount.
* @param {Boolean} to check if esw cartridge is enabled or not.
* @returns {Number} value of total net amount
*/
function getLineItemShippingCost(lineItem, totalLineItemNetAmount, eswOrderNo) {
    if (eswOrderNo) {
        var headerShippingCost =  Site.getCurrent().getCustomPreferenceValue('shippingCost');
        var lineItemShippingCost = (parseFloat(headerShippingCost) * parseFloat(lineItem.custom.eswRetailerCurrencyItemSubTotal) / parseFloat(totalLineItemNetAmount)).toFixed(TWO_DECIMAL_PLACES);
        return parseFloat(lineItemShippingCost).toFixed(TWO_DECIMAL_PLACES);
    }
    return '';
}

/**
 * To check if shipment for crossborder is billable or not
 * @param {ProductLineItem} lineItem Line Item.
 * @returns {char} Y or N
 */
function isShipmentBillableCrossBorder(order) {
    var eswShopperCurrencyDelivery = !empty(order.custom.eswShopperCurrencyDelivery) ? order.custom.eswShopperCurrencyDelivery : 0.00;
    var eswRetailerCurrencyDelivery = !empty(order.custom.eswRetailerCurrencyDelivery) ? order.custom.eswRetailerCurrencyDelivery : 0.00;
    if (eswShopperCurrencyDelivery > 0.00 && eswRetailerCurrencyDelivery > 0.00) {
        return 'Y';
    } else {
        return 'N';
    }
}

/**
* Generates the order xml provided by the processOrders
* @param {Order} order Order container.
*/
function generateOrderXML(order) {
    var Site = require('dw/system/Site');
    var impexFilePath = Site.getCurrent().getCustomPreferenceValue('orderExportImpexFilePath');
    var webSiteID = Site.getCurrent().getCustomPreferenceValue('webSiteID');
    var POType = Site.getCurrent().getCustomPreferenceValue('POType');
    var orderType = Site.getCurrent().getCustomPreferenceValue('orderType');
    var WebOrderCreationTimeZone = Site.getCurrent().getCustomPreferenceValue('webOrderCreationTimeZone');
    var shippingLineItemSKU = Site.getCurrent().getCustomPreferenceValue('shippingLineItemSKU');
    var isEswEnabled = !empty(Site.current.getCustomPreferenceValue('eswEshopworldModuleEnabled')) ? 
            Site.current.getCustomPreferenceValue('eswEshopworldModuleEnabled') : false;
    var isRoundingAmountEnabled = !empty(Site.getCurrent().preferences.custom.roundingAmountEnabled) ? 
            Site.getCurrent().preferences.custom.roundingAmountEnabled : false;
    var fxRates = parseFloat(crossBorderUtils.getFXRates(order)).toFixed(TWO_DECIMAL_PLACES);
    if (order) {
        var billingAddress = getBillingAddress(order);
        var shippingAddress = getShippingAddress(order);
        var commerceItemsRawData = getPOItemsInfo(order, isEswEnabled, shippingAddress.countryKey);
        var commerceItemsInfo = amountAdjustmentsAndWrapping(order, commerceItemsRawData);
        var paymentMethodData;

        try {
            var eswOrderNo = !empty(order.custom.eswOrderNo) ? order.custom.eswOrderNo : '';
            exportLogger.info('Starting feed file generation for order number {0}', order.getOrderNo());
            FileHelper.createDirectory(impexFilePath);
            paymentMethodData = getPaymentMethodData(order);
            var file = new File(impexFilePath + order.getOrderNo() + '_' + formatDate(order.getCreationDate(), 'yyyyMMdd_hhmmss') + fileExtension);
            if (file.exists()) {
                file.remove();
            }
            var fileWriter = new FileWriter(file, true);
            var streamWriter = new XMLStreamWriter(fileWriter);

            if (streamWriter) {
                exportLogger.debug('started stream wirting for, order {0}', order.getOrderNo());
                streamWriter.writeRaw('<?xml version="1.0" encoding="UTF-8"?>\r\n');
                /* Start of the root element*/
                streamWriter.writeStartElement('root');
                streamWriter.writeCharacters(''); streamWriter.writeRaw('\r\n');
                /* Start of the Order header element*/
                streamWriter.writeStartElement('EcommerceOrder');
                streamWriter.writeCharacters(''); streamWriter.writeRaw('\r\n');
                /* EcommercePOHeader Elements: starts*/
                streamWriter.writeStartElement('EcommercePOHeader');
                streamWriter.writeCharacters(''); streamWriter.writeRaw('\r\n');
                streamWriter.writeStartElement('WebSiteID');
                streamWriter.writeCharacters(webSiteID);
                streamWriter.writeEndElement();
                streamWriter.writeRaw('\r\n');
                streamWriter.writeStartElement('OrderType');
                streamWriter.writeCharacters(orderType);
                streamWriter.writeEndElement();
                streamWriter.writeRaw('\r\n');
                streamWriter.writeStartElement('POType');
                streamWriter.writeCharacters(POType);
                streamWriter.writeEndElement();
                streamWriter.writeRaw('\r\n');
                streamWriter.writeStartElement('ReasonCode');
                streamWriter.writeEndElement();
                streamWriter.writeRaw('\r\n');
                streamWriter.writeStartElement('WebOrderCreationTimeStamp');
                streamWriter.writeCharacters(formatDate(order.getCreationDate(), TIME_FORMAT));
                streamWriter.writeEndElement();
                streamWriter.writeRaw('\r\n');
                streamWriter.writeStartElement('WebOrderCreationTimeZone');
                streamWriter.writeCharacters(WebOrderCreationTimeZone);
                streamWriter.writeEndElement();
                streamWriter.writeRaw('\r\n');
                streamWriter.writeStartElement('PONumber');
                streamWriter.writeCharacters(order.getOrderNo());
                streamWriter.writeEndElement();
                streamWriter.writeRaw('\r\n');
                streamWriter.writeStartElement('PODate');
                streamWriter.writeCharacters(formatDate(order.getCreationDate(), DATE_FORMAT));
                streamWriter.writeEndElement();
                streamWriter.writeRaw('\r\n');
                streamWriter.writeStartElement('ReferenceOrder');
                streamWriter.writeEndElement();
                streamWriter.writeRaw('\r\n');
                streamWriter.writeStartElement('ShiptoName');
                streamWriter.writeCharacters(shippingAddress.ShiptoName);
                streamWriter.writeEndElement();
                streamWriter.writeRaw('\r\n');
                streamWriter.writeStartElement('ShiptoName2');
                streamWriter.writeCharacters(shippingAddress.ShiptoName2);
                streamWriter.writeEndElement();
                streamWriter.writeRaw('\r\n');
                streamWriter.writeStartElement('ShiptoCompany');
                streamWriter.writeCharacters(shippingAddress.company);
                streamWriter.writeEndElement();
                streamWriter.writeRaw('\r\n');
                streamWriter.writeStartElement('ShiptoCountry');
                streamWriter.writeCharacters(shippingAddress.countryKey);
                streamWriter.writeEndElement();
                streamWriter.writeRaw('\r\n');
                streamWriter.writeStartElement('ShiptoAddress1');
                streamWriter.writeCharacters(shippingAddress.address1);
                streamWriter.writeEndElement();
                streamWriter.writeRaw('\r\n');
                streamWriter.writeStartElement('ShiptoAddress2');
                streamWriter.writeCharacters(shippingAddress.address2);
                streamWriter.writeEndElement();
                streamWriter.writeRaw('\r\n');
                streamWriter.writeStartElement('ShiptoAddress3');
                streamWriter.writeCharacters(shippingAddress.address3);
                streamWriter.writeEndElement();
                streamWriter.writeRaw('\r\n');
                streamWriter.writeStartElement('ShiptoAddress4');
                streamWriter.writeCharacters(shippingAddress.address4);
                streamWriter.writeEndElement();
                streamWriter.writeRaw('\r\n');
                streamWriter.writeStartElement('ShiptoCity');
                streamWriter.writeCharacters(shippingAddress.city);
                streamWriter.writeEndElement();
                streamWriter.writeRaw('\r\n');
                streamWriter.writeStartElement('ShiptoPostalCode');
                if (shippingAddress.postalCode !== 'undefined') {
                    streamWriter.writeCharacters(shippingAddress.postalCode);
                } else {
                    streamWriter.writeCharacters('');
                }
                streamWriter.writeEndElement();
                streamWriter.writeRaw('\r\n');
                streamWriter.writeStartElement('ShiptoRegion');
                if (shippingAddress.region !== 'undefined') {
                    streamWriter.writeCharacters(shippingAddress.region);
                } else {
                    streamWriter.writeCharacters('');
                }
                streamWriter.writeEndElement();
                streamWriter.writeRaw('\r\n');
                streamWriter.writeStartElement('ShiptoPhone');
                streamWriter.writeCharacters(shippingAddress.phoneNumber);
                streamWriter.writeEndElement();
                streamWriter.writeRaw('\r\n');
                streamWriter.writeStartElement('BilltoName');
                streamWriter.writeCharacters(billingAddress.BilltoName);
                streamWriter.writeEndElement();
                streamWriter.writeRaw('\r\n');
                streamWriter.writeStartElement('BilltoName2');
                streamWriter.writeCharacters(billingAddress.BilltoName2);
                streamWriter.writeEndElement();
                streamWriter.writeRaw('\r\n');
                streamWriter.writeStartElement('BilltoCountry');
                streamWriter.writeCharacters(billingAddress.BilltoCountry);
                streamWriter.writeEndElement();
                streamWriter.writeRaw('\r\n');
                streamWriter.writeStartElement('BilltoAddress1');
                streamWriter.writeCharacters(billingAddress.BilltoAddress1);
                streamWriter.writeEndElement();
                streamWriter.writeRaw('\r\n');
                streamWriter.writeStartElement('BilltoAddress2');
                streamWriter.writeCharacters(billingAddress.BilltoAddress2);
                streamWriter.writeEndElement();
                streamWriter.writeRaw('\r\n');
                streamWriter.writeStartElement('BilltoAddress3');
                streamWriter.writeCharacters(billingAddress.BilltoAddress3);
                streamWriter.writeEndElement();
                streamWriter.writeRaw('\r\n');
                streamWriter.writeStartElement('BilltoAddress4');
                streamWriter.writeCharacters(billingAddress.BilltoAddress4);
                streamWriter.writeEndElement();
                streamWriter.writeRaw('\r\n');
                streamWriter.writeStartElement('BilltoCity');
                streamWriter.writeCharacters(billingAddress.BilltoCity);
                streamWriter.writeEndElement();
                streamWriter.writeRaw('\r\n');
                streamWriter.writeStartElement('BilltoPostalCode');
                if (billingAddress.BilltoPostalCode !== 'undefined') {
                    streamWriter.writeCharacters(billingAddress.BilltoPostalCode);
                } else {
                    streamWriter.writeCharacters('');
                }
                streamWriter.writeEndElement();
                streamWriter.writeRaw('\r\n');
                streamWriter.writeStartElement('BilltoRegion');
                if (billingAddress.BilltoRegion !== 'undefined') {
                    streamWriter.writeCharacters(billingAddress.BilltoRegion);
                } else {
                    streamWriter.writeCharacters('');
                }
                streamWriter.writeEndElement();
                streamWriter.writeRaw('\r\n');
                streamWriter.writeStartElement('BilltoPhone');
                streamWriter.writeCharacters(billingAddress.BilltoPhone);
                streamWriter.writeEndElement();
                streamWriter.writeRaw('\r\n');
                streamWriter.writeStartElement('CarrierCode');
                if (eswOrderNo) {
                    streamWriter.writeCharacters(shippingAddress.carrierName);
                } else {
                    streamWriter.writeCharacters(shippingAddress.carrier);
                }
                streamWriter.writeEndElement();
                streamWriter.writeRaw('\r\n');
                streamWriter.writeStartElement('VATEntity');
                if (eswOrderNo && Site.getCurrent().getCustomPreferenceValue('vatEntityEnabled')) {
                    streamWriter.writeCharacters(crossBorderUtils.getCountryVATEntity(shippingAddress.countryKey));
                } else {
                    streamWriter.writeCharacters('');
                }
                streamWriter.writeEndElement();
                streamWriter.writeRaw('\r\n');
                streamWriter.writeStartElement('CommercialEntity');
                streamWriter.writeCharacters(getCommercialEntity(eswOrderNo, isEswEnabled));
                streamWriter.writeEndElement();
                streamWriter.writeRaw('\r\n');
                streamWriter.writeStartElement('InventoryLocation');
                if (isEswEnabled) {
                    streamWriter.writeCharacters(Site.getCurrent().getCustomPreferenceValue('inventoryLocation'));
                }
                streamWriter.writeEndElement();
                streamWriter.writeRaw('\r\n');
                streamWriter.writeStartElement('BillingCurrency');
                streamWriter.writeCharacters(getBillingCurrency(order, isEswEnabled));
                streamWriter.writeEndElement();
                streamWriter.writeRaw('\r\n');
                streamWriter.writeStartElement('ConsumerExchangeRate');
                streamWriter.writeCharacters(getConsumerExchangeRate(order));
                streamWriter.writeEndElement();
                streamWriter.writeRaw('\r\n');
                streamWriter.writeStartElement('ConsumerCurrency');
                streamWriter.writeCharacters(getConsumerCurrency(order));
                streamWriter.writeEndElement();
                streamWriter.writeRaw('\r\n');
                streamWriter.writeStartElement('PriceBookId');
                if (isEswEnabled) {
                    streamWriter.writeCharacters(getPriceBookId(order));
                } else {
                    streamWriter.writeCharacters(fecthPriceBookId(order));
                }
                streamWriter.writeEndElement();
                streamWriter.writeRaw('\r\n');
                streamWriter.writeStartElement('PriceBookCurrency');
                streamWriter.writeCharacters(order.getCurrencyCode());
                streamWriter.writeEndElement();
                streamWriter.writeRaw('\r\n');
                streamWriter.writeStartElement('CrossBorderSystemReference');
                streamWriter.writeCharacters(eswOrderNo);
                streamWriter.writeEndElement();
                streamWriter.writeRaw('\r\n');
                streamWriter.writeStartElement('SubTotal');
                streamWriter.writeCharacters(getSubTotal(order, eswOrderNo));
                streamWriter.writeEndElement();
                streamWriter.writeRaw('\r\n');
                streamWriter.writeStartElement('TotalTax');
                streamWriter.writeCharacters(getTotalTax(order, eswOrderNo));
                streamWriter.writeEndElement();
                streamWriter.writeRaw('\r\n');
                streamWriter.writeStartElement('TotalDutyAmount');
                streamWriter.writeCharacters(parseFloat(ZERO).toFixed(TWO_DECIMAL_PLACES));
                streamWriter.writeEndElement();
                streamWriter.writeRaw('\r\n');
                streamWriter.writeStartElement('TotalInsAmount');
                if (isEswEnabled) {
                    streamWriter.writeCharacters(parseFloat(ZERO).toFixed(TWO_DECIMAL_PLACES));
                }
                streamWriter.writeEndElement();
                streamWriter.writeRaw('\r\n');
                streamWriter.writeStartElement('GiftCardAmount');
                if (isEswEnabled) {
                    streamWriter.writeCharacters(parseFloat(ZERO).toFixed(TWO_DECIMAL_PLACES));
                }
                streamWriter.writeEndElement();
                streamWriter.writeRaw('\r\n');
                streamWriter.writeStartElement('TotalLoyaltyAmount');
                if (eswOrderNo && isYotpoSwellLoyaltyEnabled) {
                    streamWriter.writeCharacters(parseFloat(crossBorderUtils.getSwellDiscountAmount(order)).toFixed(TWO_DECIMAL_PLACES));
                } else {
                    streamWriter.writeCharacters('');
                }
                streamWriter.writeEndElement();
                streamWriter.writeRaw('\r\n');
                streamWriter.writeStartElement('NetAmount');
                streamWriter.writeCharacters(getNetAmount(order, eswOrderNo));
                streamWriter.writeEndElement();
                streamWriter.writeRaw('\r\n');
                streamWriter.writeStartElement('AuthAmount');
                streamWriter.writeCharacters(getAuthAmount(order, eswOrderNo));
                streamWriter.writeEndElement();
                streamWriter.writeRaw('\r\n');
                streamWriter.writeStartElement('ChargingShipping');
                streamWriter.writeCharacters(isShippingCharged(order));
                streamWriter.writeEndElement();
                streamWriter.writeRaw('\r\n');
                streamWriter.writeStartElement('ShippingCost');
                streamWriter.writeCharacters(getShippingCost(order, eswOrderNo));
                streamWriter.writeEndElement();
                streamWriter.writeRaw('\r\n');
                streamWriter.writeStartElement('ShippingByMGI');
                streamWriter.writeCharacters(isShippingChargedByMGI(eswOrderNo));
                streamWriter.writeEndElement();
                streamWriter.writeRaw('\r\n');
                streamWriter.writeStartElement('DutyByMGI');
                streamWriter.writeCharacters(isDutyByMGI(eswOrderNo));
                streamWriter.writeEndElement();
                streamWriter.writeRaw('\r\n');
                streamWriter.writeStartElement('InsByMGI');
                streamWriter.writeCharacters(isInsuranceByMGI(eswOrderNo));
                streamWriter.writeEndElement();
                streamWriter.writeRaw('\r\n');
                streamWriter.writeStartElement('DutyInclusive');
                streamWriter.writeCharacters(isDutyInclusive(order));
                streamWriter.writeEndElement();
                streamWriter.writeRaw('\r\n');
                streamWriter.writeStartElement('VATInclusive');
                streamWriter.writeCharacters(isVATInclusive(order, eswOrderNo, shippingAddress.countryKey));
                streamWriter.writeEndElement();
                streamWriter.writeRaw('\r\n');
                streamWriter.writeStartElement('PaymentMethod');
                streamWriter.writeCharacters(!empty(order.custom.eswPaymentMethod) ? order.custom.eswPaymentMethod : paymentMethodData.paymentMethod);
                streamWriter.writeEndElement();
                streamWriter.writeRaw('\r\n');
                streamWriter.writeStartElement('AuthExpirationDate');
                streamWriter.writeCharacters(paymentMethodData.AuthExpirationDate);
                streamWriter.writeEndElement();
                streamWriter.writeRaw('\r\n');
                streamWriter.writeStartElement('ConsumerSubTotal');
                streamWriter.writeCharacters(getConsumerSubTotal(order, eswOrderNo));
                streamWriter.writeEndElement();
                streamWriter.writeRaw('\r\n');
                streamWriter.writeStartElement('ConsumerTotalTax');
                streamWriter.writeCharacters(getConsumerTotalTax(order));
                streamWriter.writeEndElement();
                streamWriter.writeRaw('\r\n');
                streamWriter.writeStartElement('ConsumerTotalDutyAmount');
                streamWriter.writeCharacters(getConsumerTotalDutyAmount(order));
                streamWriter.writeEndElement();
                streamWriter.writeRaw('\r\n');
                streamWriter.writeStartElement('ConsumerTotalInsAmount');
                streamWriter.writeCharacters(parseFloat(ZERO).toFixed(TWO_DECIMAL_PLACES));
                streamWriter.writeEndElement();
                streamWriter.writeRaw('\r\n');
                streamWriter.writeStartElement('ConsumerGiftCardAmount');
                streamWriter.writeEndElement();
                streamWriter.writeRaw('\r\n');
                streamWriter.writeStartElement('ConsumerTotalLoyaltyAmount');
                if (eswOrderNo && isYotpoSwellLoyaltyEnabled) {
                    streamWriter.writeCharacters(parseFloat(getConsumerLoyaltyAmount(order)).toFixed(TWO_DECIMAL_PLACES));
                } else {
                    streamWriter.writeCharacters('');
                }
                streamWriter.writeEndElement();
                streamWriter.writeRaw('\r\n');
                streamWriter.writeStartElement('ConsumerNetAmount');
                streamWriter.writeCharacters(getConsumerNetAmount(order, eswOrderNo));
                streamWriter.writeEndElement();
                streamWriter.writeRaw('\r\n');
                streamWriter.writeStartElement('ConsumerAuthAmount');
                streamWriter.writeCharacters(getConsumerAuthAmount(order, eswOrderNo));
                streamWriter.writeEndElement();
                streamWriter.writeRaw('\r\n');
                streamWriter.writeStartElement('Incoterms');
                if (eswOrderNo) {
                    streamWriter.writeCharacters(getIncoterms(shippingAddress.countryKey));
                }
                streamWriter.writeEndElement();
                streamWriter.writeRaw('\r\n');
                streamWriter.writeStartElement('ConsTaxByMGI');
                streamWriter.writeCharacters(isConsumerTaxByMGI(eswOrderNo));
                streamWriter.writeEndElement();
                streamWriter.writeRaw('\r\n');
                streamWriter.writeStartElement('TotalConsTaxByMGI');
                if (isConsumerTaxByMGI(eswOrderNo) == 'Y') {
                    streamWriter.writeCharacters(order.getTotalTax());
                } else {
                    streamWriter.writeCharacters(parseFloat(ZERO).toFixed(TWO_DECIMAL_PLACES));
                }
                streamWriter.writeEndElement();
                streamWriter.writeRaw('\r\n');
                streamWriter.writeStartElement('UserField1');
                streamWriter.writeCharacters('');
                streamWriter.writeEndElement();
                streamWriter.writeRaw('\r\n');
                streamWriter.writeStartElement('UserField2');
                streamWriter.writeCharacters('');
                streamWriter.writeEndElement();
                streamWriter.writeRaw('\r\n');
                streamWriter.writeStartElement('UserField3');
                streamWriter.writeCharacters('');
                streamWriter.writeEndElement();
                streamWriter.writeRaw('\r\n');
                streamWriter.writeStartElement('UserField4');
                streamWriter.writeCharacters('');
                streamWriter.writeEndElement();
                /* Create EcommercePOHeader Elements : end*/
                streamWriter.writeRaw('\r\n');
                streamWriter.writeEndElement();

                var requestDeliveryDate;
                var requestDeliveryDateFixedFreight;
                for (var i = 0; i < commerceItemsInfo.length; i++) {
                    var commerceItem = commerceItemsInfo[i];
                    if (!requestDeliveryDateFixedFreight) {
                        requestDeliveryDateFixedFreight = commerceItem.RequestedDeliveryDate;
                    }
                    else if (requestDeliveryDateFixedFreight > commerceItem.RequestedDeliveryDate) {
                        requestDeliveryDateFixedFreight = commerceItem.RequestedDeliveryDate;
                    }
                }
                for (var i = 0; i < commerceItemsInfo.length; i++) {
                    var commerceItem = commerceItemsInfo[i];
                    exportLogger.debug('Writing EcommercePOItemHeader Element commerceItem {0} for order {1}', commerceItem.POItemNumber , order.getOrderNo());
                    /* Create EcommercePOItemHeader Elements: start*/
                    
                    if (commerceItem.RequestedDeliveryDate) {
                        requestDeliveryDate = commerceItem.RequestedDeliveryDate;
                    }
                    
                    streamWriter.writeRaw('\r\n');
                    streamWriter.writeStartElement('EcommercePOItem');
                    streamWriter.writeCharacters(''); streamWriter.writeRaw('\r\n');
                    streamWriter.writeStartElement('POItemNumber');
                    streamWriter.writeCharacters(commerceItem.POItemNumber);
                    streamWriter.writeEndElement();
                    streamWriter.writeRaw('\r\n');
                    streamWriter.writeStartElement('SKUNumber');
                    streamWriter.writeCharacters(commerceItem.SKUNumber);
                    streamWriter.writeEndElement();
                    streamWriter.writeRaw('\r\n');
                    streamWriter.writeStartElement('Quantity');
                    streamWriter.writeCharacters(commerceItem.Quantity);
                    streamWriter.writeEndElement();
                    streamWriter.writeRaw('\r\n'); 
                    if (commerceItem.SKUNumber !== shippingLineItemSKU) {
                        streamWriter.writeStartElement('RequestedDeliveryDate');
                        streamWriter.writeCharacters(requestDeliveryDate);
                        streamWriter.writeEndElement();
                        streamWriter.writeRaw('\r\n');
                        streamWriter.writeStartElement('PreSale');
                        streamWriter.writeCharacters(commerceItem.PreSale);
                        streamWriter.writeEndElement();
                        streamWriter.writeRaw('\r\n');
                    }
                    if (commerceItem.SKUNumber === FIXEDFREIGHT) {
                        streamWriter.writeStartElement('RequestedDeliveryDate');
                        streamWriter.writeCharacters(requestDeliveryDateFixedFreight);
                        streamWriter.writeEndElement();
                        streamWriter.writeRaw('\r\n');
                    }
                    streamWriter.writeStartElement('IsThisBillable');
                    if (eswOrderNo && commerceItem.SKUNumber === FIXEDFREIGHT) {
                        streamWriter.writeCharacters(commerceItem.IsThisBillableCrossBorder);
                    } else {
                        streamWriter.writeCharacters(commerceItem.IsThisBillable);
                    }
                    streamWriter.writeEndElement();
                    streamWriter.writeRaw('\r\n');
                    streamWriter.writeStartElement('VATEntity');
                    if (eswOrderNo && Site.getCurrent().getCustomPreferenceValue('vatEntityEnabled')) {
                        streamWriter.writeCharacters(crossBorderUtils.getCountryVATEntity(shippingAddress.countryKey));
                    } else {
                        streamWriter.writeCharacters('');
                    }
                    streamWriter.writeEndElement();
                    streamWriter.writeRaw('\r\n');
                    streamWriter.writeStartElement('CommercialEntity');
                    streamWriter.writeCharacters(getCommercialEntity(eswOrderNo, isEswEnabled));
                    streamWriter.writeEndElement();
                    streamWriter.writeRaw('\r\n');
                    streamWriter.writeStartElement('InventoryLocation');
                    streamWriter.writeCharacters(commerceItem.InventoryLocation);
                    streamWriter.writeEndElement();
                    streamWriter.writeRaw('\r\n');
                    streamWriter.writeStartElement('GrossValue');
                    if (eswOrderNo && commerceItem.SKUNumber !== FIXEDFREIGHT) {
                        streamWriter.writeCharacters(parseFloat(commerceItem.CrossBorderGrossValue).toFixed(TWO_DECIMAL_PLACES));
                    }  else if (eswOrderNo && commerceItem.SKUNumber === FIXEDFREIGHT) {
                        !empty(order.custom.eswRetailerCurrencyDelivery) ?
                                streamWriter.writeCharacters(parseFloat(order.custom.eswRetailerCurrencyDelivery).toFixed(TWO_DECIMAL_PLACES)) 
                                : streamWriter.writeCharacters(parseFloat(ZERO).toFixed(TWO_DECIMAL_PLACES));
                    }  else {
                        streamWriter.writeCharacters(commerceItem.GrossValue);
                    }
                    streamWriter.writeEndElement();
                    streamWriter.writeRaw('\r\n');
                    streamWriter.writeStartElement('MarkDownAmount');
                    streamWriter.writeEndElement();
                    streamWriter.writeRaw('\r\n');
                    streamWriter.writeStartElement('PromoCode');
                    if (eswOrderNo && commerceItem.SKUNumber !== FIXEDFREIGHT) {
                        streamWriter.writeCharacters(commerceItem.CrossBorderPromoCode);
                    } else {
                        streamWriter.writeCharacters(commerceItem.PromoCode);
                    }
                    streamWriter.writeEndElement();
                    streamWriter.writeRaw('\r\n');
                    streamWriter.writeStartElement('PromoAmount');
                    if (eswOrderNo && commerceItem.SKUNumber !== FIXEDFREIGHT) {
                        streamWriter.writeCharacters(commerceItem.CrossBorderPromoAmount);
                    } else if (eswOrderNo && commerceItem.SKUNumber === FIXEDFREIGHT) {
                        streamWriter.writeCharacters(parseFloat(ZERO).toFixed(TWO_DECIMAL_PLACES));
                    } else {
                        streamWriter.writeCharacters(commerceItem.PromoAmount);
                    }
                    streamWriter.writeEndElement();
                    streamWriter.writeRaw('\r\n');
                    streamWriter.writeStartElement('RoundingAmount');
                    if (eswOrderNo && isRoundingAmountEnabled && commerceItem.SKUNumber !== FIXEDFREIGHT) {
                        streamWriter.writeCharacters(parseFloat(commerceItem.ConsumerRoundingAmount * fxRates).toFixed(TWO_DECIMAL_PLACES));
                    } else {
                        streamWriter.writeCharacters('');
                    }
                    streamWriter.writeEndElement();
                    streamWriter.writeRaw('\r\n');
                    streamWriter.writeStartElement('LoyaltyAmount');
                    if (eswOrderNo && isYotpoSwellLoyaltyEnabled && commerceItem.SKUNumber !== FIXEDFREIGHT) {
                        streamWriter.writeCharacters(parseFloat(commerceItem.LoyaltyAmount).toFixed(TWO_DECIMAL_PLACES));
                    } else {
                        streamWriter.writeCharacters('');
                    }
                    streamWriter.writeEndElement();
                    streamWriter.writeRaw('\r\n');
                    streamWriter.writeStartElement('SubTotal');
                    if (eswOrderNo && commerceItem.SKUNumber !== FIXEDFREIGHT) {
                        streamWriter.writeCharacters(commerceItem.CrossBorderSubTotal);
                    } else if (eswOrderNo && commerceItem.SKUNumber === FIXEDFREIGHT) {
                        !empty(order.custom.eswRetailerCurrencyDelivery) ?
                                streamWriter.writeCharacters(parseFloat(order.custom.eswRetailerCurrencyDelivery).toFixed(TWO_DECIMAL_PLACES)) 
                                : streamWriter.writeCharacters(parseFloat(ZERO).toFixed(TWO_DECIMAL_PLACES));
                    } else {
                        streamWriter.writeCharacters(commerceItem.SubTotal);
                    }
                    streamWriter.writeEndElement();
                    streamWriter.writeRaw('\r\n');
                    streamWriter.writeStartElement('TaxAmount');
                    if (eswOrderNo) {
                        streamWriter.writeCharacters(parseFloat(ZERO).toFixed(TWO_DECIMAL_PLACES));
                    } else {
                        streamWriter.writeCharacters(commerceItem.TaxAmount);
                    }
                    streamWriter.writeEndElement();
                    streamWriter.writeRaw('\r\n');
                    streamWriter.writeStartElement('Tax1');
                    if (eswOrderNo) {
                        streamWriter.writeCharacters(parseFloat(ZERO).toFixed(TWO_DECIMAL_PLACES));
                    } else {
                        streamWriter.writeCharacters(commerceItem.Tax1);
                    }
                    streamWriter.writeEndElement();
                    streamWriter.writeRaw('\r\n');
                    streamWriter.writeStartElement('Tax2');
                    if (eswOrderNo) {
                        streamWriter.writeCharacters(parseFloat(ZERO).toFixed(TWO_DECIMAL_PLACES));
                    } else {
                        streamWriter.writeCharacters(commerceItem.Tax2);
                    }
                    streamWriter.writeEndElement();
                    streamWriter.writeRaw('\r\n');
                    streamWriter.writeStartElement('Tax3');
                    if (eswOrderNo) {
                        streamWriter.writeCharacters(parseFloat(ZERO).toFixed(TWO_DECIMAL_PLACES));
                    } else {
                        streamWriter.writeCharacters(commerceItem.Tax3);
                    }
                    streamWriter.writeEndElement();
                    streamWriter.writeRaw('\r\n');
                    streamWriter.writeStartElement('Tax4');
                    if (eswOrderNo) {
                        streamWriter.writeCharacters(parseFloat(ZERO).toFixed(TWO_DECIMAL_PLACES));
                    } else {
                        streamWriter.writeCharacters(commerceItem.Tax4);
                    }
                    streamWriter.writeEndElement();
                    streamWriter.writeRaw('\r\n');
                    streamWriter.writeStartElement('Tax5');
                    if (eswOrderNo) {
                        streamWriter.writeCharacters(parseFloat(ZERO).toFixed(TWO_DECIMAL_PLACES));
                    } else {
                        streamWriter.writeCharacters(commerceItem.Tax5);
                    }
                    streamWriter.writeEndElement();
                    streamWriter.writeRaw('\r\n');
                    streamWriter.writeStartElement('Tax6');
                    if (eswOrderNo) {
                        streamWriter.writeCharacters(parseFloat(ZERO).toFixed(TWO_DECIMAL_PLACES));
                    } else {
                        streamWriter.writeCharacters(commerceItem.Tax6);
                    }
                    streamWriter.writeEndElement();
                    streamWriter.writeRaw('\r\n');
                    if (eswOrderNo) {
                        streamWriter.writeStartElement('DutyAmount');
                        if (commerceItem.SKUNumber !== FIXEDFREIGHT) {
                            streamWriter.writeCharacters(commerceItem.DutyAmount);
                        } else {
                            streamWriter.writeCharacters(parseFloat(ZERO).toFixed(TWO_DECIMAL_PLACES));
                        }
                        streamWriter.writeEndElement();
                        streamWriter.writeRaw('\r\n');
                    }
                    streamWriter.writeStartElement('NetAmount');
                    if (eswOrderNo && commerceItem.SKUNumber !== FIXEDFREIGHT) {
                        streamWriter.writeCharacters(commerceItem.CrossBorderNetAmount);
                    } else if (eswOrderNo && commerceItem.SKUNumber === FIXEDFREIGHT) {
                        !empty(order.custom.eswRetailerCurrencyDelivery) ?
                                streamWriter.writeCharacters(parseFloat(order.custom.eswRetailerCurrencyDelivery).toFixed(TWO_DECIMAL_PLACES)) 
                                : streamWriter.writeCharacters(parseFloat(ZERO).toFixed(TWO_DECIMAL_PLACES));
                    } else {
                        streamWriter.writeCharacters(commerceItem.NetAmount);
                    }
                    streamWriter.writeEndElement();
                    streamWriter.writeRaw('\r\n');
                    streamWriter.writeStartElement('ShippingCost');
                    if (eswOrderNo && commerceItem.SKUNumber !== FIXEDFREIGHT) {
                        streamWriter.writeCharacters(commerceItem.ShippingCost);
                    }
                    streamWriter.writeEndElement();
                    streamWriter.writeRaw('\r\n');
                    streamWriter.writeStartElement('ConsTaxByMGI');
                    if (isConsumerTaxByMGI(eswOrderNo) == 'Y') {
                        streamWriter.writeCharacters(commerceItem.TaxAmount);
                    } else {
                        streamWriter.writeCharacters(parseFloat(ZERO).toFixed(TWO_DECIMAL_PLACES));
                    }
                    streamWriter.writeEndElement();
                    streamWriter.writeRaw('\r\n');
                    streamWriter.writeStartElement('ConsumerGrossValue');
                    if (commerceItem.SKUNumber !== FIXEDFREIGHT) {
                        if (eswOrderNo) {
                            streamWriter.writeCharacters(commerceItem.ConsumerGrossValue);
                        } else {
                            streamWriter.writeCharacters(commerceItem.GrossValue);
                        }
                    }
                    if (commerceItem.SKUNumber === FIXEDFREIGHT) {
                        if (eswOrderNo) {
                            !empty(order.custom.eswShopperCurrencyDelivery) ? 
                                    streamWriter.writeCharacters(parseFloat(order.custom.eswShopperCurrencyDelivery).toFixed(TWO_DECIMAL_PLACES))
                                    : streamWriter.writeCharacters(parseFloat(ZERO).toFixed(TWO_DECIMAL_PLACES));
                        } else {
                            streamWriter.writeCharacters(commerceItem.GrossValue);
                        }
                    }
                    streamWriter.writeEndElement();
                    streamWriter.writeRaw('\r\n');
                    streamWriter.writeStartElement('ConsumerMarkDownAmount');
                    streamWriter.writeEndElement();
                    streamWriter.writeRaw('\r\n');
                    streamWriter.writeStartElement('ConsumerPromoAmount');
                    if (eswOrderNo && commerceItem.SKUNumber !== FIXEDFREIGHT) {
                        streamWriter.writeCharacters(commerceItem.CrossBorderConsumerPromoAmount);
                    } else if (eswOrderNo && commerceItem.SKUNumber === FIXEDFREIGHT) {
                        streamWriter.writeCharacters(parseFloat(ZERO).toFixed(TWO_DECIMAL_PLACES));
                    } else {
                        streamWriter.writeCharacters(commerceItem.PromoAmount);
                    }
                    streamWriter.writeEndElement();
                    streamWriter.writeRaw('\r\n');
                    streamWriter.writeStartElement('ConsumerRoundingAmount');
                    if (eswOrderNo && isRoundingAmountEnabled && commerceItem.SKUNumber !== FIXEDFREIGHT) {
                        streamWriter.writeCharacters(commerceItem.ConsumerRoundingAmount);
                    } else {
                        streamWriter.writeCharacters('');
                    }
                    streamWriter.writeEndElement();
                    streamWriter.writeRaw('\r\n');
                    streamWriter.writeStartElement('ConsumerLoyaltyAmount');
                    if (eswOrderNo && isYotpoSwellLoyaltyEnabled && commerceItem.SKUNumber !== FIXEDFREIGHT) {
                        streamWriter.writeCharacters(parseFloat(commerceItem.ConsumerLoyaltyAmount).toFixed(TWO_DECIMAL_PLACES));
                    } else {
                        streamWriter.writeCharacters('');
                    }
                    streamWriter.writeEndElement();
                    streamWriter.writeRaw('\r\n');
                    streamWriter.writeStartElement('ConsumerSubTotal');
                    if (commerceItem.SKUNumber !== FIXEDFREIGHT) {
                        if (eswOrderNo) {
                            streamWriter.writeCharacters(commerceItem.ConsumerSubTotal);
                        } else {
                            streamWriter.writeCharacters(commerceItem.SubTotal);
                        }
                    }
                    if (commerceItem.SKUNumber === FIXEDFREIGHT) {
                        if (eswOrderNo) {
                            !empty(order.custom.eswShopperCurrencyDelivery) ? 
                                    streamWriter.writeCharacters(parseFloat(order.custom.eswShopperCurrencyDelivery).toFixed(TWO_DECIMAL_PLACES))
                                    : streamWriter.writeCharacters(parseFloat(ZERO).toFixed(TWO_DECIMAL_PLACES));
                        } else {
                            streamWriter.writeCharacters(commerceItem.SubTotal);
                        }
                    }
                    streamWriter.writeEndElement();
                    streamWriter.writeRaw('\r\n');
                    streamWriter.writeStartElement('ConsumerTaxAmount');
                    if (commerceItem.SKUNumber !== FIXEDFREIGHT) {
                        if (eswOrderNo) {
                            streamWriter.writeCharacters(commerceItem.ConsumerTaxAmount);
                        } else {
                            streamWriter.writeCharacters(commerceItem.TaxAmount);
                        }
                    }
                    if (commerceItem.SKUNumber === FIXEDFREIGHT) {
                        if (eswOrderNo) {
                            !empty(order.custom.eswShopperCurrencyDeliveryTaxes) ? 
                                    streamWriter.writeCharacters(parseFloat(order.custom.eswShopperCurrencyDeliveryTaxes).toFixed(TWO_DECIMAL_PLACES))
                                    : streamWriter.writeCharacters(parseFloat(ZERO).toFixed(TWO_DECIMAL_PLACES));
                        } else {
                            streamWriter.writeCharacters(commerceItem.TaxAmount);
                        }
                    }
                    streamWriter.writeEndElement();
                    streamWriter.writeRaw('\r\n');
                    streamWriter.writeStartElement('ConsumerDutyAmount');
                    if (commerceItem.SKUNumber !== FIXEDFREIGHT) {
                        if (eswOrderNo) {
                            streamWriter.writeCharacters(commerceItem.ConsumerDutyAmount);
                        } else {
                            streamWriter.writeCharacters(commerceItem.DutyAmount);
                        }
                    }
                    if (commerceItem.SKUNumber === FIXEDFREIGHT) {
                        if (eswOrderNo) {
                            !empty(order.custom.eswShopperCurrencyDeliveryDuty) ? 
                                    streamWriter.writeCharacters(parseFloat(order.custom.eswShopperCurrencyDeliveryDuty).toFixed(TWO_DECIMAL_PLACES))
                                    : streamWriter.writeCharacters(parseFloat(ZERO).toFixed(TWO_DECIMAL_PLACES));
                        }
                    }
                    streamWriter.writeEndElement();
                    streamWriter.writeRaw('\r\n');
                    streamWriter.writeStartElement('ConsumerInsAmount');
                    streamWriter.writeEndElement();
                    streamWriter.writeRaw('\r\n');
                    streamWriter.writeStartElement('ConsumerNetAmount');
                    if (commerceItem.SKUNumber !== FIXEDFREIGHT) {
                        if (eswOrderNo) {
                            streamWriter.writeCharacters(commerceItem.ConsumerNetAmount);
                        } else {
                            streamWriter.writeCharacters(commerceItem.NetAmount);
                        }
                    }
                    if (commerceItem.SKUNumber === FIXEDFREIGHT) {
                        if (eswOrderNo) {
                            streamWriter.writeCharacters(getShippingConsumerNetAmount(order, isEswEnabled));
                        } else {
                            streamWriter.writeCharacters(commerceItem.NetAmount);
                        }
                    }
                    streamWriter.writeEndElement();
                    streamWriter.writeRaw('\r\n');
                    if (commerceItem.SKUNumber !== shippingLineItemSKU) {
                        /* EcommercePOItemPersonalization Elements: starts*/
                        if (commerceItem.giftMessageObj) {
                            streamWriter.writeStartElement('EcommercePOItemPersonalization');
                            streamWriter.writeCharacters(''); streamWriter.writeRaw('\r\n');
                            streamWriter.writeStartElement('PersonalizationType');
                            streamWriter.writeCharacters(commerceItem.giftMessageObj.PersonalizationType);
                            streamWriter.writeEndElement();
                            streamWriter.writeRaw('\r\n');
                            streamWriter.writeStartElement('LanguageID');
                            streamWriter.writeCharacters(commerceItem.giftMessageObj.LanguageID);
                            streamWriter.writeEndElement();
                            streamWriter.writeRaw('\r\n');
                            streamWriter.writeStartElement('Location');
                            streamWriter.writeCharacters(commerceItem.giftMessageObj.Location);
                            streamWriter.writeEndElement();
                            streamWriter.writeRaw('\r\n');
                            streamWriter.writeStartElement('Orientation');
                            streamWriter.writeCharacters(commerceItem.giftMessageObj.Orientation);
                            streamWriter.writeEndElement();
                            streamWriter.writeRaw('\r\n');
                            streamWriter.writeStartElement('Alignment');
                            streamWriter.writeCharacters(commerceItem.giftMessageObj.Alignment);
                            streamWriter.writeEndElement();
                            streamWriter.writeRaw('\r\n');
                            streamWriter.writeStartElement('Font');
                            streamWriter.writeCharacters(commerceItem.giftMessageObj.Font);
                            streamWriter.writeEndElement();
                            streamWriter.writeRaw('\r\n');
                            streamWriter.writeStartElement('GiftWrapOption');
                            streamWriter.writeCharacters(commerceItem.giftMessageObj.GiftWrapOption);
                            streamWriter.writeEndElement();
                            streamWriter.writeRaw('\r\n');
                            streamWriter.writeStartElement('GiftBoxSKU');
                            streamWriter.writeCharacters(commerceItem.giftMessageObj.GiftBoxSKU);
                            streamWriter.writeEndElement();
                            streamWriter.writeRaw('\r\n');
                            streamWriter.writeStartElement('IsThisBillable');
                            streamWriter.writeCharacters(commerceItem.giftMessageObj.IsThisBillable);
                            streamWriter.writeEndElement();
                            streamWriter.writeRaw('\r\n');
                            streamWriter.writeStartElement('GrossValue');
                            streamWriter.writeCharacters(commerceItem.giftMessageObj.GrossValue);
                            streamWriter.writeEndElement();
                            streamWriter.writeRaw('\r\n');
                            streamWriter.writeStartElement('MarkDownAmount');
                            streamWriter.writeEndElement();
                            streamWriter.writeRaw('\r\n');
                            streamWriter.writeStartElement('PromoAmount');
                            if (eswOrderNo && commerceItem.SKUNumber !== FIXEDFREIGHT) {
                                streamWriter.writeCharacters(commerceItem.giftMessageObj.CrossBorderPromoAmount);
                            } else if (eswOrderNo && commerceItem.SKUNumber === FIXEDFREIGHT) {
                                streamWriter.writeCharacters(parseFloat(ZERO).toFixed(TWO_DECIMAL_PLACES));
                            } else {
                                streamWriter.writeCharacters(commerceItem.giftMessageObj.PromoAmount);
                            }
                            streamWriter.writeEndElement();
                            streamWriter.writeRaw('\r\n');
                            streamWriter.writeStartElement('RoundingAmount');
                            if (eswOrderNo && isRoundingAmountEnabled) {
                                streamWriter.writeCharacters(commerceItem.giftMessageObj.ConsumerRoundingAmount * fxRates);
                            } else {
                                streamWriter.writeCharacters('');
                            }
                            streamWriter.writeEndElement();
                            streamWriter.writeRaw('\r\n');
                            streamWriter.writeStartElement('LoyaltyAmount');
                            if (eswOrderNo && isYotpoSwellLoyaltyEnabled) {
                                streamWriter.writeCharacters(commerceItem.giftMessageObj.LoyaltyAmount);
                            } else {
                                streamWriter.writeCharacters('');
                            }
                            streamWriter.writeEndElement();
                            streamWriter.writeRaw('\r\n');
                            streamWriter.writeStartElement('SubTotal');
                            streamWriter.writeCharacters(commerceItem.giftMessageObj.SubTotal);
                            streamWriter.writeEndElement();
                            streamWriter.writeRaw('\r\n');
                            streamWriter.writeStartElement('TaxAmount');
                            streamWriter.writeCharacters(commerceItem.giftMessageObj.TaxAmount);
                            streamWriter.writeEndElement();
                            streamWriter.writeRaw('\r\n');
                            streamWriter.writeStartElement('Tax1');
                            if (eswOrderNo) {
                                streamWriter.writeCharacters(parseFloat(ZERO).toFixed(TWO_DECIMAL_PLACES));
                            } else {
                                streamWriter.writeCharacters(commerceItem.giftMessageObj.Tax1);
                            }
                            streamWriter.writeEndElement();
                            streamWriter.writeRaw('\r\n');
                            streamWriter.writeStartElement('Tax2');
                            if (eswOrderNo) {
                                streamWriter.writeCharacters(parseFloat(ZERO).toFixed(TWO_DECIMAL_PLACES));
                            } else {
                                streamWriter.writeCharacters(commerceItem.giftMessageObj.Tax2);
                            }
                            streamWriter.writeEndElement();
                            streamWriter.writeRaw('\r\n');
                            streamWriter.writeStartElement('Tax3');
                            if (eswOrderNo) {
                                streamWriter.writeCharacters(parseFloat(ZERO).toFixed(TWO_DECIMAL_PLACES));
                            } else {
                                streamWriter.writeCharacters(commerceItem.giftMessageObj.Tax3);
                            }
                            streamWriter.writeEndElement();
                            streamWriter.writeRaw('\r\n');
                            streamWriter.writeStartElement('Tax4');
                            if (eswOrderNo) {
                                streamWriter.writeCharacters(parseFloat(ZERO).toFixed(TWO_DECIMAL_PLACES));
                            } else {
                                streamWriter.writeCharacters(commerceItem.giftMessageObj.Tax4);
                            }
                            streamWriter.writeEndElement();
                            streamWriter.writeRaw('\r\n');
                            streamWriter.writeStartElement('Tax5');
                            if (eswOrderNo) {
                                streamWriter.writeCharacters(parseFloat(ZERO).toFixed(TWO_DECIMAL_PLACES));
                            } else {
                                streamWriter.writeCharacters(commerceItem.giftMessageObj.Tax5);
                            }
                            streamWriter.writeEndElement();
                            streamWriter.writeRaw('\r\n');
                            streamWriter.writeStartElement('Tax6');
                            if (eswOrderNo) {
                                streamWriter.writeCharacters(parseFloat(ZERO).toFixed(TWO_DECIMAL_PLACES));
                            } else {
                                streamWriter.writeCharacters(commerceItem.giftMessageObj.Tax6);
                            }
                            streamWriter.writeEndElement();
                            streamWriter.writeRaw('\r\n');
                            if(eswOrderNo) {
                                streamWriter.writeStartElement('DutyAmount');
                                streamWriter.writeCharacters(commerceItem.giftMessageObj.DutyAmount);
                                streamWriter.writeEndElement();
                                streamWriter.writeRaw('\r\n');
                            }
                            streamWriter.writeStartElement('NetAmount');
                            if (eswOrderNo) {
                                streamWriter.writeCharacters(commerceItem.giftMessageObj.CrossBorderNetAmount);
                            } else {
                                streamWriter.writeCharacters(commerceItem.giftMessageObj.NetAmount);
                            }
                            streamWriter.writeEndElement();
                            streamWriter.writeRaw('\r\n');
                            streamWriter.writeStartElement('ConsTaxByMGI');
                            streamWriter.writeCharacters(commerceItem.giftMessageObj.ConsTaxByMGI);
                            streamWriter.writeEndElement();
                            streamWriter.writeRaw('\r\n');
                            streamWriter.writeStartElement('ConsumerGrossValue');
                            if (eswOrderNo) {
                                streamWriter.writeCharacters(commerceItem.giftMessageObj.ConsumerGrossValue);
                            } else {
                                streamWriter.writeCharacters(commerceItem.giftMessageObj.GrossValue);
                            }
                            streamWriter.writeEndElement();
                            streamWriter.writeRaw('\r\n');
                            streamWriter.writeStartElement('ConsumerMarkDownAmount');
                            streamWriter.writeEndElement();
                            streamWriter.writeRaw('\r\n');
                            streamWriter.writeStartElement('ConsumerPromoAmount');
                            if (eswOrderNo && commerceItem.SKUNumber !== FIXEDFREIGHT) {
                                streamWriter.writeCharacters(commerceItem.giftMessageObj.CrossBorderConsumerPromoAmount);
                            } else if (eswOrderNo && commerceItem.SKUNumber === FIXEDFREIGHT) {
                                streamWriter.writeCharacters(parseFloat(ZERO).toFixed(TWO_DECIMAL_PLACES));
                            } else {
                                streamWriter.writeCharacters(commerceItem.giftMessageObj.PromoAmount);
                            }
                            streamWriter.writeEndElement();
                            streamWriter.writeRaw('\r\n');
                            streamWriter.writeStartElement('ConsumerRoundingAmount');
                            if (eswOrderNo && isRoundingAmountEnabled) {
                                streamWriter.writeCharacters(commerceItem.giftMessageObj.ConsumerRoundingAmount);
                            } else {
                                streamWriter.writeCharacters('');
                            }
                            streamWriter.writeEndElement();
                            streamWriter.writeRaw('\r\n');
                            streamWriter.writeStartElement('ConsumerLoyaltyAmount');
                            if (eswOrderNo && isYotpoSwellLoyaltyEnabled) {
                                streamWriter.writeCharacters(commerceItem.giftMessageObj.ConsumerLoyaltyAmount);
                            } else {
                                streamWriter.writeCharacters('');
                            }
                            streamWriter.writeEndElement();
                            streamWriter.writeRaw('\r\n');
                            streamWriter.writeStartElement('ConsumerSubTotal');
                            if (eswOrderNo) {
                                streamWriter.writeCharacters(commerceItem.giftMessageObj.ConsumerSubTotal);
                            } else {
                                streamWriter.writeCharacters(commerceItem.giftMessageObj.SubTotal);
                            }
                            streamWriter.writeEndElement();
                            streamWriter.writeRaw('\r\n');
                            streamWriter.writeStartElement('ConsumerTaxAmount');
                            if (eswOrderNo) {
                                streamWriter.writeCharacters(commerceItem.giftMessageObj.ConsumerTaxAmount);
                            } else {
                                streamWriter.writeCharacters(commerceItem.giftMessageObj.TaxAmount);
                            }
                            streamWriter.writeEndElement();
                            streamWriter.writeRaw('\r\n');
                            streamWriter.writeStartElement('ConsumerDutyAmount');
                            if (eswOrderNo) {
                                streamWriter.writeCharacters(commerceItem.giftMessageObj.ConsumerDutyAmount);
                            } else {
                                streamWriter.writeCharacters(commerceItem.giftMessageObj.DutyAmount);
                            }
                            streamWriter.writeEndElement();
                            streamWriter.writeRaw('\r\n');
                            streamWriter.writeStartElement('ConsumerInsAmount');
                            streamWriter.writeEndElement();
                            streamWriter.writeRaw('\r\n');
                            streamWriter.writeStartElement('ConsumerNetAmount');
                            if (eswOrderNo) {
                                streamWriter.writeCharacters(commerceItem.giftMessageObj.ConsumerNetAmount);
                            } else {
                                streamWriter.writeCharacters(commerceItem.giftMessageObj.NetAmount);
                            }
                            streamWriter.writeEndElement();
                            streamWriter.writeRaw('\r\n');
                                // Iterating over the Text object : Starts
                            for (var c = 0; c < Object.keys(commerceItem.giftMessageObj.Text.SequenceNumber).length; c++) {
                                streamWriter.writeStartElement('Text');
                                streamWriter.writeRaw('\r\n');
                                streamWriter.writeStartElement('SequenceNumber');
                                streamWriter.writeCharacters(commerceItem.giftMessageObj.Text.SequenceNumber[c]);
                                streamWriter.writeEndElement();
                                streamWriter.writeRaw('\r\n');
                                streamWriter.writeStartElement('TextMessage');
                                streamWriter.writeCharacters(commerceItem.giftMessageObj.Text.TextMessage[c]);
                                streamWriter.writeEndElement();
                                streamWriter.writeRaw('\r\n');
                                streamWriter.writeEndElement();
                                streamWriter.writeRaw('\r\n');
                            }
                                // Iterating over the Text object : Ends
                            streamWriter.writeEndElement();
                            streamWriter.writeCharacters(''); streamWriter.writeRaw('\r\n');
                        }
                        if (commerceItem.giftWrapObj) {
                            streamWriter.writeStartElement('EcommercePOItemPersonalization');
                            streamWriter.writeCharacters(''); streamWriter.writeRaw('\r\n');
                            streamWriter.writeStartElement('PersonalizationType');
                            streamWriter.writeCharacters(commerceItem.giftWrapObj.PersonalizationType);
                            streamWriter.writeEndElement();
                            streamWriter.writeRaw('\r\n');
                            streamWriter.writeStartElement('LanguageID');
                            streamWriter.writeCharacters(commerceItem.giftWrapObj.LanguageID);
                            streamWriter.writeEndElement();
                            streamWriter.writeRaw('\r\n');
                            streamWriter.writeStartElement('Location');
                            streamWriter.writeCharacters(commerceItem.giftWrapObj.Location);
                            streamWriter.writeEndElement();
                            streamWriter.writeRaw('\r\n');
                            streamWriter.writeStartElement('Orientation');
                            streamWriter.writeCharacters(commerceItem.giftWrapObj.Orientation);
                            streamWriter.writeEndElement();
                            streamWriter.writeRaw('\r\n');
                            streamWriter.writeStartElement('Alignment');
                            streamWriter.writeCharacters(commerceItem.giftWrapObj.Alignment);
                            streamWriter.writeEndElement();
                            streamWriter.writeRaw('\r\n');
                            streamWriter.writeStartElement('Font');
                            streamWriter.writeCharacters(commerceItem.giftWrapObj.Font);
                            streamWriter.writeEndElement();
                            streamWriter.writeRaw('\r\n');
                            streamWriter.writeStartElement('GiftWrapOption');
                            streamWriter.writeCharacters(commerceItem.giftWrapObj.GiftWrapOption);
                            streamWriter.writeEndElement();
                            streamWriter.writeRaw('\r\n');
                            streamWriter.writeStartElement('GiftBoxSKU');
                            streamWriter.writeCharacters(commerceItem.giftWrapObj.GiftBoxSKU);
                            streamWriter.writeEndElement();
                            streamWriter.writeRaw('\r\n');
                            streamWriter.writeStartElement('IsThisBillable');
                            streamWriter.writeCharacters(commerceItem.giftWrapObj.IsThisBillable);
                            streamWriter.writeEndElement();
                            streamWriter.writeRaw('\r\n');
                            streamWriter.writeStartElement('GrossValue');
                            streamWriter.writeEndElement();
                            streamWriter.writeRaw('\r\n');
                            streamWriter.writeStartElement('MarkDownAmount');
                            streamWriter.writeEndElement();
                            streamWriter.writeRaw('\r\n');
                            streamWriter.writeStartElement('PromoAmount');
                            if (eswOrderNo && commerceItem.SKUNumber !== FIXEDFREIGHT) {
                                streamWriter.writeCharacters(commerceItem.giftWrapObj.CrossBorderPromoAmount);
                            } else if (eswOrderNo && commerceItem.SKUNumber === FIXEDFREIGHT) {
                                streamWriter.writeCharacters(parseFloat(ZERO).toFixed(TWO_DECIMAL_PLACES));
                            } else {
                                streamWriter.writeCharacters(commerceItem.giftWrapObj.PromoAmount);
                            }
                            streamWriter.writeEndElement();
                            streamWriter.writeRaw('\r\n');
                            streamWriter.writeStartElement('RoundingAmount');
                            if (eswOrderNo && isRoundingAmountEnabled) {
                                streamWriter.writeCharacters(commerceItem.giftWrapObj.ConsumerRoundingAmount * fxRates);
                            } else {
                                streamWriter.writeCharacters('');
                            }
                            streamWriter.writeEndElement();
                            streamWriter.writeRaw('\r\n');
                            streamWriter.writeStartElement('LoyaltyAmount');
                            if (eswOrderNo && isYotpoSwellLoyaltyEnabled) {
                                streamWriter.writeCharacters(commerceItem.giftWrapObj.LoyaltyAmount);
                            } else {
                                streamWriter.writeCharacters('');
                            }
                            streamWriter.writeEndElement();
                            streamWriter.writeRaw('\r\n');
                            streamWriter.writeStartElement('SubTotal');
                            streamWriter.writeCharacters(commerceItem.giftWrapObj.SubTotal);
                            streamWriter.writeEndElement();
                            streamWriter.writeRaw('\r\n');
                            streamWriter.writeStartElement('TaxAmount');
                            streamWriter.writeCharacters(commerceItem.giftWrapObj.TaxAmount);
                            streamWriter.writeEndElement();
                            streamWriter.writeRaw('\r\n');
                            streamWriter.writeStartElement('Tax1');
                            if (eswOrderNo) {
                                streamWriter.writeCharacters(parseFloat(ZERO).toFixed(TWO_DECIMAL_PLACES));
                            } else {
                                streamWriter.writeCharacters(commerceItem.giftWrapObj.Tax1);
                            }
                            streamWriter.writeEndElement();
                            streamWriter.writeRaw('\r\n');
                            streamWriter.writeStartElement('Tax2');
                            if (eswOrderNo) {
                                streamWriter.writeCharacters(parseFloat(ZERO).toFixed(TWO_DECIMAL_PLACES));
                            } else {
                                streamWriter.writeCharacters(commerceItem.giftWrapObj.Tax2);
                            }
                            streamWriter.writeEndElement();
                            streamWriter.writeRaw('\r\n');
                            streamWriter.writeStartElement('Tax3');
                            if (eswOrderNo) {
                                streamWriter.writeCharacters(parseFloat(ZERO).toFixed(TWO_DECIMAL_PLACES));
                            } else {
                                streamWriter.writeCharacters(commerceItem.giftWrapObj.Tax3);
                            }
                            streamWriter.writeEndElement();
                            streamWriter.writeRaw('\r\n');
                            streamWriter.writeStartElement('Tax4');
                            if (eswOrderNo) {
                                streamWriter.writeCharacters(parseFloat(ZERO).toFixed(TWO_DECIMAL_PLACES));
                            } else {
                                streamWriter.writeCharacters(commerceItem.giftWrapObj.Tax4);
                            }
                            streamWriter.writeEndElement();
                            streamWriter.writeRaw('\r\n');
                            streamWriter.writeStartElement('Tax5');
                            if (eswOrderNo) {
                                streamWriter.writeCharacters(parseFloat(ZERO).toFixed(TWO_DECIMAL_PLACES));
                            } else {
                                streamWriter.writeCharacters(commerceItem.giftWrapObj.Tax5);
                            }
                            streamWriter.writeEndElement();
                            streamWriter.writeRaw('\r\n');
                            streamWriter.writeStartElement('Tax6');
                            if (eswOrderNo) {
                                streamWriter.writeCharacters(parseFloat(ZERO).toFixed(TWO_DECIMAL_PLACES));
                            } else {
                                streamWriter.writeCharacters(commerceItem.giftWrapObj.Tax6);
                            }
                            streamWriter.writeEndElement();
                            streamWriter.writeRaw('\r\n');
                            if(eswOrderNo) {
                                streamWriter.writeStartElement('DutyAmount');
                                streamWriter.writeCharacters(commerceItem.giftWrapObj.DutyAmount);
                                streamWriter.writeEndElement();
                                streamWriter.writeRaw('\r\n');
                            }
                            streamWriter.writeStartElement('NetAmount');
                            if (eswOrderNo) {
                                streamWriter.writeCharacters(commerceItem.giftWrapObj.CrossBorderNetAmount);
                            } else {
                                streamWriter.writeCharacters(commerceItem.giftWrapObj.NetAmount);
                            }
                            streamWriter.writeEndElement();
                            streamWriter.writeRaw('\r\n');
                            streamWriter.writeStartElement('ConsTaxByMGI');
                            streamWriter.writeCharacters(commerceItem.giftWrapObj.ConsTaxByMGI);
                            streamWriter.writeEndElement();
                            streamWriter.writeRaw('\r\n');
                            streamWriter.writeStartElement('ConsumerGrossValue');
                            if (eswOrderNo) {
                                streamWriter.writeCharacters(commerceItem.giftWrapObj.ConsumerGrossValue);
                            } else {
                                streamWriter.writeCharacters(commerceItem.giftWrapObj.GrossValue);
                            }
                            streamWriter.writeEndElement();
                            streamWriter.writeRaw('\r\n');
                            streamWriter.writeStartElement('ConsumerMarkDownAmount');
                            streamWriter.writeEndElement();
                            streamWriter.writeRaw('\r\n');
                            streamWriter.writeStartElement('ConsumerPromoAmount');
                            if (eswOrderNo && commerceItem.SKUNumber !== FIXEDFREIGHT) {
                                streamWriter.writeCharacters(commerceItem.giftWrapObj.CrossBorderConsumerPromoAmount);
                            } else if (eswOrderNo && commerceItem.SKUNumber === FIXEDFREIGHT) {
                                streamWriter.writeCharacters(parseFloat(ZERO).toFixed(TWO_DECIMAL_PLACES));
                            } else {
                                streamWriter.writeCharacters(commerceItem.giftWrapObj.PromoAmount);
                            }
                            streamWriter.writeEndElement();
                            streamWriter.writeRaw('\r\n');
                            streamWriter.writeStartElement('ConsumerRoundingAmount');
                            if (eswOrderNo && isRoundingAmountEnabled) {
                                streamWriter.writeCharacters(commerceItem.giftWrapObj.ConsumerRoundingAmount);
                            } else {
                                streamWriter.writeCharacters('');
                            }
                            streamWriter.writeEndElement();
                            streamWriter.writeRaw('\r\n');
                            streamWriter.writeStartElement('ConsumerLoyaltyAmount');
                            if (eswOrderNo && isYotpoSwellLoyaltyEnabled) {
                                streamWriter.writeCharacters(commerceItem.giftWrapObj.ConsumerLoyaltyAmount);
                            } else {
                                streamWriter.writeCharacters('');
                            }
                            streamWriter.writeEndElement();
                            streamWriter.writeRaw('\r\n');
                            streamWriter.writeStartElement('ConsumerSubTotal');
                            if (eswOrderNo) {
                                streamWriter.writeCharacters(commerceItem.giftWrapObj.ConsumerSubTotal);
                            } else {
                                streamWriter.writeCharacters(commerceItem.giftWrapObj.SubTotal);
                            }
                            streamWriter.writeEndElement();
                            streamWriter.writeRaw('\r\n');
                            streamWriter.writeStartElement('ConsumerTaxAmount');
                            if (eswOrderNo) {
                                streamWriter.writeCharacters(commerceItem.giftWrapObj.ConsumerTaxAmount);
                            } else {
                                streamWriter.writeCharacters(commerceItem.giftWrapObj.TaxAmount);
                            }
                            streamWriter.writeEndElement();
                            streamWriter.writeRaw('\r\n');
                            streamWriter.writeStartElement('ConsumerDutyAmount');
                            if (eswOrderNo) {
                                streamWriter.writeCharacters(commerceItem.giftWrapObj.ConsumerDutyAmount);
                            } else {
                                streamWriter.writeCharacters(commerceItem.giftWrapObj.DutyAmount);
                            }
                            streamWriter.writeEndElement();
                            streamWriter.writeRaw('\r\n');
                            streamWriter.writeStartElement('ConsumerInsAmount');
                            streamWriter.writeEndElement();
                            streamWriter.writeRaw('\r\n');
                            streamWriter.writeStartElement('ConsumerNetAmount');
                            if (eswOrderNo) {
                                streamWriter.writeCharacters(commerceItem.giftWrapObj.ConsumerNetAmount);
                            } else {
                                streamWriter.writeCharacters(commerceItem.giftWrapObj.NetAmount);
                            }
                            streamWriter.writeEndElement();
                            streamWriter.writeRaw('\r\n');
                                // Iterating over the Text object : Starts
                            streamWriter.writeEndElement();
                            streamWriter.writeCharacters(''); streamWriter.writeRaw('\r\n');
                        }
                        if (commerceItem.engravingObj && commerceItem.engravingObj.Text && commerceItem.engravingObj.Text.TextMessage[0]
                                && commerceItem.engravingObj.Text.TextMessage[0] != '') {
                            streamWriter.writeStartElement('EcommercePOItemPersonalization');
                            streamWriter.writeCharacters(''); streamWriter.writeRaw('\r\n');
                            streamWriter.writeStartElement('PersonalizationType');
                            streamWriter.writeCharacters(commerceItem.engravingObj.PersonalizationType);
                            streamWriter.writeEndElement();
                            streamWriter.writeRaw('\r\n');
                            streamWriter.writeStartElement('LanguageID');
                            streamWriter.writeCharacters(commerceItem.engravingObj.LanguageID);
                            streamWriter.writeEndElement();
                            streamWriter.writeRaw('\r\n');
                            streamWriter.writeStartElement('Location');
                            streamWriter.writeCharacters(commerceItem.engravingObj.Location);
                            streamWriter.writeEndElement();
                            streamWriter.writeRaw('\r\n');
                            streamWriter.writeStartElement('Orientation');
                            streamWriter.writeCharacters(commerceItem.engravingObj.Orientation);
                            streamWriter.writeEndElement();
                            streamWriter.writeRaw('\r\n');
                            streamWriter.writeStartElement('Alignment');
                            streamWriter.writeCharacters(commerceItem.engravingObj.Alignment);
                            streamWriter.writeEndElement();
                            streamWriter.writeRaw('\r\n');
                            streamWriter.writeStartElement('Font');
                            streamWriter.writeCharacters(commerceItem.engravingObj.Font);
                            streamWriter.writeEndElement();
                            streamWriter.writeRaw('\r\n');
                            streamWriter.writeStartElement('GiftWrapOption');
                            streamWriter.writeCharacters(commerceItem.engravingObj.GiftWrapOption);
                            streamWriter.writeEndElement();
                            streamWriter.writeRaw('\r\n');
                            streamWriter.writeStartElement('GiftBoxSKU');
                            streamWriter.writeCharacters(commerceItem.engravingObj.GiftBoxSKU);
                            streamWriter.writeEndElement();
                            streamWriter.writeRaw('\r\n');
                            streamWriter.writeStartElement('IsThisBillable');
                            streamWriter.writeCharacters(commerceItem.engravingObj.IsThisBillable);
                            streamWriter.writeEndElement();
                            streamWriter.writeRaw('\r\n');
                            streamWriter.writeStartElement('GrossValue');
                            streamWriter.writeCharacters(commerceItem.engravingObj.GrossValue);
                            streamWriter.writeEndElement();
                            streamWriter.writeRaw('\r\n');
                            streamWriter.writeStartElement('MarkDownAmount');
                            streamWriter.writeEndElement();
                            streamWriter.writeRaw('\r\n');
                            streamWriter.writeStartElement('PromoAmount');
                            if (eswOrderNo && commerceItem.SKUNumber !== FIXEDFREIGHT) {
                                streamWriter.writeCharacters(commerceItem.engravingObj.CrossBorderPromoAmount);
                            } else if (eswOrderNo && commerceItem.SKUNumber === FIXEDFREIGHT) {
                                streamWriter.writeCharacters(parseFloat(ZERO).toFixed(TWO_DECIMAL_PLACES));
                            } else {
                                streamWriter.writeCharacters(commerceItem.engravingObj.PromoAmount);
                            }
                            streamWriter.writeEndElement();
                            streamWriter.writeRaw('\r\n');
                            streamWriter.writeStartElement('RoundingAmount');
                            if (eswOrderNo && isRoundingAmountEnabled) {
                                streamWriter.writeCharacters(commerceItem.engravingObj.ConsumerRoundingAmount * fxRates);
                            } else {
                                streamWriter.writeCharacters('');
                            }
                            streamWriter.writeEndElement();
                            streamWriter.writeRaw('\r\n');
                            streamWriter.writeStartElement('LoyaltyAmount');
                            if (eswOrderNo && isYotpoSwellLoyaltyEnabled) {
                                streamWriter.writeCharacters(commerceItem.engravingObj.LoyaltyAmount);
                            } else {
                                streamWriter.writeCharacters('');
                            }
                            streamWriter.writeEndElement();
                            streamWriter.writeRaw('\r\n');
                            streamWriter.writeStartElement('SubTotal');
                            streamWriter.writeCharacters(commerceItem.engravingObj.SubTotal);
                            streamWriter.writeEndElement();
                            streamWriter.writeRaw('\r\n');
                            streamWriter.writeStartElement('TaxAmount');
                            streamWriter.writeCharacters(commerceItem.engravingObj.TaxAmount);
                            streamWriter.writeEndElement();
                            streamWriter.writeRaw('\r\n');
                            streamWriter.writeStartElement('Tax1');
                            if (eswOrderNo) {
                                streamWriter.writeCharacters(parseFloat(ZERO).toFixed(TWO_DECIMAL_PLACES));
                            } else {
                                streamWriter.writeCharacters(commerceItem.engravingObj.Tax1);
                            }
                            streamWriter.writeEndElement();
                            streamWriter.writeRaw('\r\n');
                            streamWriter.writeStartElement('Tax2');
                            if (eswOrderNo) {
                                streamWriter.writeCharacters(parseFloat(ZERO).toFixed(TWO_DECIMAL_PLACES));
                            } else {
                                streamWriter.writeCharacters(commerceItem.engravingObj.Tax2);
                            }
                            streamWriter.writeEndElement();
                            streamWriter.writeRaw('\r\n');
                            streamWriter.writeStartElement('Tax3');
                            if (eswOrderNo) {
                                streamWriter.writeCharacters(parseFloat(ZERO).toFixed(TWO_DECIMAL_PLACES));
                            } else {
                                streamWriter.writeCharacters(commerceItem.engravingObj.Tax3);
                            }
                            streamWriter.writeEndElement();
                            streamWriter.writeRaw('\r\n');
                            streamWriter.writeStartElement('Tax4');
                            if (eswOrderNo) {
                                streamWriter.writeCharacters(parseFloat(ZERO).toFixed(TWO_DECIMAL_PLACES));
                            } else {
                                streamWriter.writeCharacters(commerceItem.engravingObj.Tax4);
                            }
                            streamWriter.writeEndElement();
                            streamWriter.writeRaw('\r\n');
                            streamWriter.writeStartElement('Tax5');
                            if (eswOrderNo) {
                                streamWriter.writeCharacters(parseFloat(ZERO).toFixed(TWO_DECIMAL_PLACES));
                            } else {
                                streamWriter.writeCharacters(commerceItem.engravingObj.Tax5);
                            }
                            streamWriter.writeEndElement();
                            streamWriter.writeRaw('\r\n');
                            streamWriter.writeStartElement('Tax6');
                            if (eswOrderNo) {
                                streamWriter.writeCharacters(parseFloat(ZERO).toFixed(TWO_DECIMAL_PLACES));
                            } else {
                                streamWriter.writeCharacters(commerceItem.engravingObj.Tax6);
                            }
                            streamWriter.writeEndElement();
                            streamWriter.writeRaw('\r\n');
                            if(eswOrderNo) {
                                streamWriter.writeStartElement('DutyAmount');
                                streamWriter.writeCharacters(commerceItem.engravingObj.DutyAmount);
                                streamWriter.writeEndElement();
                                streamWriter.writeRaw('\r\n');
                            }
                            streamWriter.writeStartElement('NetAmount');
                            if (eswOrderNo) {
                                streamWriter.writeCharacters(commerceItem.engravingObj.CrossBorderNetAmount);
                            } else {
                                streamWriter.writeCharacters(commerceItem.engravingObj.NetAmount);
                            }
                            streamWriter.writeEndElement();
                            streamWriter.writeRaw('\r\n');
                            streamWriter.writeStartElement('ConsTaxByMGI');
                            streamWriter.writeCharacters(commerceItem.engravingObj.ConsTaxByMGI);
                            streamWriter.writeEndElement();
                            streamWriter.writeRaw('\r\n');
                            streamWriter.writeStartElement('ConsumerGrossValue');
                            if (eswOrderNo) {
                                streamWriter.writeCharacters(commerceItem.engravingObj.ConsumerGrossValue);
                            } else {
                                streamWriter.writeCharacters(commerceItem.engravingObj.GrossValue);
                            }
                            streamWriter.writeEndElement();
                            streamWriter.writeRaw('\r\n');
                            streamWriter.writeStartElement('ConsumerMarkDownAmount');
                            streamWriter.writeEndElement();
                            streamWriter.writeRaw('\r\n');
                            streamWriter.writeStartElement('ConsumerPromoAmount');
                            if (eswOrderNo && commerceItem.SKUNumber !== FIXEDFREIGHT) {
                                streamWriter.writeCharacters(commerceItem.engravingObj.CrossBorderConsumerPromoAmount);
                            } else if (eswOrderNo && commerceItem.SKUNumber === FIXEDFREIGHT) {
                                streamWriter.writeCharacters(parseFloat(ZERO).toFixed(TWO_DECIMAL_PLACES));
                            } else {
                                streamWriter.writeCharacters(commerceItem.engravingObj.PromoAmount);
                            }
                            streamWriter.writeEndElement();
                            streamWriter.writeRaw('\r\n');
                            streamWriter.writeStartElement('ConsumerRoundingAmount');
                            if (eswOrderNo && isRoundingAmountEnabled) {
                                streamWriter.writeCharacters(commerceItem.engravingObj.ConsumerRoundingAmount);
                            } else {
                                streamWriter.writeCharacters('');
                            }
                            streamWriter.writeEndElement();
                            streamWriter.writeRaw('\r\n');
                            streamWriter.writeStartElement('ConsumerLoyaltyAmount');
                            if (eswOrderNo && isYotpoSwellLoyaltyEnabled) {
                                streamWriter.writeCharacters(commerceItem.engravingObj.ConsumerLoyaltyAmount);
                            } else {
                                streamWriter.writeCharacters('');
                            }
                            streamWriter.writeEndElement();
                            streamWriter.writeRaw('\r\n');
                            streamWriter.writeStartElement('ConsumerSubTotal');
                            if (eswOrderNo) {
                                streamWriter.writeCharacters(commerceItem.engravingObj.ConsumerSubTotal);
                            } else {
                                streamWriter.writeCharacters(commerceItem.engravingObj.SubTotal);
                            }
                            streamWriter.writeEndElement();
                            streamWriter.writeRaw('\r\n');
                            streamWriter.writeStartElement('ConsumerTaxAmount');
                            if (eswOrderNo) {
                                streamWriter.writeCharacters(commerceItem.engravingObj.ConsumerTaxAmount);
                            } else {
                                streamWriter.writeCharacters(commerceItem.engravingObj.TaxAmount);
                            }
                            streamWriter.writeEndElement();
                            streamWriter.writeRaw('\r\n');
                            streamWriter.writeStartElement('ConsumerDutyAmount');
                            if (eswOrderNo) {
                                streamWriter.writeCharacters(commerceItem.engravingObj.ConsumerDutyAmount);
                            } else {
                                streamWriter.writeCharacters(commerceItem.engravingObj.DutyAmount);
                            }
                            streamWriter.writeEndElement();
                            streamWriter.writeRaw('\r\n');
                            streamWriter.writeStartElement('ConsumerInsAmount');
                            streamWriter.writeEndElement();
                            streamWriter.writeRaw('\r\n');
                            streamWriter.writeStartElement('ConsumerNetAmount');
                            if (eswOrderNo) {
                                streamWriter.writeCharacters(commerceItem.engravingObj.ConsumerNetAmount);
                            } else {
                                streamWriter.writeCharacters(commerceItem.engravingObj.NetAmount);
                            }
                            streamWriter.writeEndElement();
                            streamWriter.writeRaw('\r\n');
                                // Iterating over the Text object : Starts
                            if (commerceItem.engravingObj.Text.SequenceNumber[0]) {
                                streamWriter.writeStartElement('Text');
                                streamWriter.writeRaw('\r\n');
                                streamWriter.writeStartElement('SequenceNumber');
                                streamWriter.writeCharacters(commerceItem.engravingObj.Text.SequenceNumber[0]);
                                streamWriter.writeEndElement();
                                streamWriter.writeRaw('\r\n');
                                streamWriter.writeStartElement('TextMessage');
                                streamWriter.writeCharacters(commerceItem.engravingObj.Text.TextMessage[0]);
                                streamWriter.writeEndElement();
                                streamWriter.writeRaw('\r\n');
                                streamWriter.writeEndElement();
                                streamWriter.writeRaw('\r\n');
                                if (commerceItem.engravingObj.Text.SequenceNumber.length === 2) {
                                    streamWriter.writeStartElement('Text');
                                    streamWriter.writeRaw('\r\n');
                                    streamWriter.writeStartElement('SequenceNumber');
                                    streamWriter.writeCharacters(commerceItem.engravingObj.Text.SequenceNumber[1]);
                                    streamWriter.writeEndElement();
                                    streamWriter.writeRaw('\r\n');
                                    streamWriter.writeStartElement('TextMessage');
                                    streamWriter.writeCharacters(commerceItem.engravingObj.Text.TextMessage[1]);
                                    streamWriter.writeEndElement();
                                    streamWriter.writeRaw('\r\n');
                                    streamWriter.writeEndElement();
                                    streamWriter.writeRaw('\r\n');
                                }
                            }
                            streamWriter.writeEndElement();
                            streamWriter.writeCharacters(''); streamWriter.writeRaw('\r\n');
                        }
                        if (commerceItem.embossingObj && commerceItem.embossingObj.Text && commerceItem.embossingObj.Text.TextMessage &&
                                commerceItem.embossingObj.Text.TextMessage != '') {
                            streamWriter.writeStartElement('EcommercePOItemPersonalization');
                            streamWriter.writeCharacters(''); streamWriter.writeRaw('\r\n');
                            streamWriter.writeStartElement('PersonalizationType');
                            streamWriter.writeCharacters(commerceItem.embossingObj.PersonalizationType);
                            streamWriter.writeEndElement();
                            streamWriter.writeRaw('\r\n');
                            streamWriter.writeStartElement('LanguageID');
                            streamWriter.writeCharacters(commerceItem.embossingObj.LanguageID);
                            streamWriter.writeEndElement();
                            streamWriter.writeRaw('\r\n');
                            streamWriter.writeStartElement('Location');
                            streamWriter.writeCharacters(commerceItem.embossingObj.Location);
                            streamWriter.writeEndElement();
                            streamWriter.writeRaw('\r\n');
                            streamWriter.writeStartElement('Orientation');
                            streamWriter.writeCharacters(commerceItem.embossingObj.Orientation);
                            streamWriter.writeEndElement();
                            streamWriter.writeRaw('\r\n');
                            streamWriter.writeStartElement('Alignment');
                            streamWriter.writeCharacters(commerceItem.embossingObj.Alignment);
                            streamWriter.writeEndElement();
                            streamWriter.writeRaw('\r\n');
                            streamWriter.writeStartElement('Font');
                            streamWriter.writeCharacters(commerceItem.embossingObj.Font);
                            streamWriter.writeEndElement();
                            streamWriter.writeRaw('\r\n');
                            streamWriter.writeStartElement('GiftWrapOption');
                            streamWriter.writeCharacters(commerceItem.embossingObj.GiftWrapOption);
                            streamWriter.writeEndElement();
                            streamWriter.writeRaw('\r\n');
                            streamWriter.writeStartElement('GiftBoxSKU');
                            streamWriter.writeCharacters(commerceItem.embossingObj.GiftBoxSKU);
                            streamWriter.writeEndElement();
                            streamWriter.writeRaw('\r\n');
                            streamWriter.writeStartElement('IsThisBillable');
                            streamWriter.writeCharacters(commerceItem.embossingObj.IsThisBillable);
                            streamWriter.writeEndElement();
                            streamWriter.writeRaw('\r\n');
                            streamWriter.writeStartElement('GrossValue');
                            streamWriter.writeCharacters(commerceItem.embossingObj.GrossValue);
                            streamWriter.writeEndElement();
                            streamWriter.writeRaw('\r\n');
                            streamWriter.writeStartElement('MarkDownAmount');
                            streamWriter.writeCharacters(commerceItem.embossingObj.GrossValue);
                            streamWriter.writeEndElement();
                            streamWriter.writeRaw('\r\n');
                            streamWriter.writeStartElement('PromoAmount');
                            if (eswOrderNo && commerceItem.SKUNumber !== FIXEDFREIGHT) {
                                streamWriter.writeCharacters(commerceItem.embossingObj.CrossBorderPromoAmount);
                            } else if (eswOrderNo && commerceItem.SKUNumber === FIXEDFREIGHT) {
                                streamWriter.writeCharacters(parseFloat(ZERO).toFixed(TWO_DECIMAL_PLACES));
                            } else {
                                streamWriter.writeCharacters(commerceItem.embossingObj.PromoAmount);
                            }
                            streamWriter.writeEndElement();
                            streamWriter.writeRaw('\r\n');
                            streamWriter.writeStartElement('RoundingAmount');
                            if (eswOrderNo && isRoundingAmountEnabled) {
                                streamWriter.writeCharacters(commerceItem.embossingObj.ConsumerRoundingAmount * fxRates);
                            } else {
                                streamWriter.writeCharacters('');
                            }
                            streamWriter.writeEndElement();
                            streamWriter.writeRaw('\r\n');
                            streamWriter.writeStartElement('LoyaltyAmount');
                            if (eswOrderNo && isYotpoSwellLoyaltyEnabled) {
                                streamWriter.writeCharacters(commerceItem.embossingObj.LoyaltyAmount);
                            } else {
                                streamWriter.writeCharacters('');
                            }
                            streamWriter.writeEndElement();
                            streamWriter.writeRaw('\r\n');
                            streamWriter.writeStartElement('SubTotal');
                            streamWriter.writeCharacters(commerceItem.embossingObj.SubTotal);
                            streamWriter.writeEndElement();
                            streamWriter.writeRaw('\r\n');
                            streamWriter.writeStartElement('TaxAmount');
                            streamWriter.writeCharacters(commerceItem.embossingObj.TaxAmount);
                            streamWriter.writeEndElement();
                            streamWriter.writeRaw('\r\n');
                            streamWriter.writeStartElement('Tax1');
                            if (eswOrderNo) {
                                streamWriter.writeCharacters(parseFloat(ZERO).toFixed(TWO_DECIMAL_PLACES));
                            } else {
                                streamWriter.writeCharacters(commerceItem.embossingObj.Tax1);
                            }
                            streamWriter.writeEndElement();
                            streamWriter.writeRaw('\r\n');
                            streamWriter.writeStartElement('Tax2');
                            if (eswOrderNo) {
                                streamWriter.writeCharacters(parseFloat(ZERO).toFixed(TWO_DECIMAL_PLACES));
                            } else {
                                streamWriter.writeCharacters(commerceItem.embossingObj.Tax2);
                            }
                            streamWriter.writeEndElement();
                            streamWriter.writeRaw('\r\n');
                            streamWriter.writeStartElement('Tax3');
                            if (eswOrderNo) {
                                streamWriter.writeCharacters(parseFloat(ZERO).toFixed(TWO_DECIMAL_PLACES));
                            } else {
                                streamWriter.writeCharacters(commerceItem.embossingObj.Tax3);
                            }
                            streamWriter.writeEndElement();
                            streamWriter.writeRaw('\r\n');
                            streamWriter.writeStartElement('Tax4');
                            if (eswOrderNo) {
                                streamWriter.writeCharacters(parseFloat(ZERO).toFixed(TWO_DECIMAL_PLACES));
                            } else {
                                streamWriter.writeCharacters(commerceItem.embossingObj.Tax4);
                            }
                            streamWriter.writeEndElement();
                            streamWriter.writeRaw('\r\n');
                            streamWriter.writeStartElement('Tax5');
                            if (eswOrderNo) {
                                streamWriter.writeCharacters(parseFloat(ZERO).toFixed(TWO_DECIMAL_PLACES));
                            } else {
                                streamWriter.writeCharacters(commerceItem.embossingObj.Tax5);
                            }
                            streamWriter.writeEndElement();
                            streamWriter.writeRaw('\r\n');
                            streamWriter.writeStartElement('Tax6');
                            if (eswOrderNo) {
                                streamWriter.writeCharacters(parseFloat(ZERO).toFixed(TWO_DECIMAL_PLACES));
                            } else {
                                streamWriter.writeCharacters(commerceItem.embossingObj.Tax6);
                            }
                            streamWriter.writeEndElement();
                            streamWriter.writeRaw('\r\n');
                            if(eswOrderNo) {
                                streamWriter.writeStartElement('DutyAmount');
                                streamWriter.writeCharacters(commerceItem.embossingObj.DutyAmount);
                                streamWriter.writeEndElement();
                                streamWriter.writeRaw('\r\n');
                            }
                            streamWriter.writeStartElement('NetAmount');
                            if (eswOrderNo) {
                                streamWriter.writeCharacters(commerceItem.embossingObj.CrossBorderNetAmount);
                            } else {
                                streamWriter.writeCharacters(commerceItem.embossingObj.NetAmount);
                            }
                            streamWriter.writeEndElement();
                            streamWriter.writeRaw('\r\n');
                            streamWriter.writeStartElement('ConsTaxByMGI');
                            streamWriter.writeCharacters(commerceItem.embossingObj.ConsTaxByMGI);
                            streamWriter.writeEndElement();
                            streamWriter.writeRaw('\r\n');
                            streamWriter.writeStartElement('ConsumerGrossValue');
                            if (eswOrderNo) {
                                streamWriter.writeCharacters(commerceItem.embossingObj.ConsumerGrossValue);
                            } else {
                                streamWriter.writeCharacters(commerceItem.embossingObj.GrossValue);
                            }
                            streamWriter.writeEndElement();
                            streamWriter.writeRaw('\r\n');
                            streamWriter.writeStartElement('ConsumerMarkDownAmount');
                            streamWriter.writeEndElement();
                            streamWriter.writeRaw('\r\n');
                            streamWriter.writeStartElement('ConsumerPromoAmount');
                            if (eswOrderNo && commerceItem.SKUNumber !== FIXEDFREIGHT) {
                                streamWriter.writeCharacters(commerceItem.embossingObj.CrossBorderConsumerPromoAmount);
                            } else if (eswOrderNo && commerceItem.SKUNumber === FIXEDFREIGHT) {
                                streamWriter.writeCharacters(parseFloat(ZERO).toFixed(TWO_DECIMAL_PLACES));
                            } else {
                                streamWriter.writeCharacters(commerceItem.embossingObj.PromoAmount);
                            }
                            streamWriter.writeEndElement();
                            streamWriter.writeRaw('\r\n');
                            streamWriter.writeStartElement('ConsumerRoundingAmount');
                            if (eswOrderNo && isRoundingAmountEnabled) {
                                streamWriter.writeCharacters(commerceItem.embossingObj.ConsumerRoundingAmount);
                            } else {
                                streamWriter.writeCharacters('');
                            }
                            streamWriter.writeEndElement();
                            streamWriter.writeRaw('\r\n');
                            streamWriter.writeStartElement('ConsumerLoyaltyAmount');
                            if (eswOrderNo && isYotpoSwellLoyaltyEnabled) {
                                streamWriter.writeCharacters(commerceItem.embossingObj.ConsumerLoyaltyAmount);
                            } else {
                                streamWriter.writeCharacters('');
                            }
                            streamWriter.writeEndElement();
                            streamWriter.writeRaw('\r\n');
                            streamWriter.writeStartElement('ConsumerSubTotal');
                            if (eswOrderNo) {
                                streamWriter.writeCharacters(commerceItem.embossingObj.ConsumerSubTotal);
                            } else {
                                streamWriter.writeCharacters(commerceItem.embossingObj.SubTotal);
                            }
                            streamWriter.writeEndElement();
                            streamWriter.writeRaw('\r\n');
                            streamWriter.writeStartElement('ConsumerTaxAmount');
                            if (eswOrderNo) {
                                streamWriter.writeCharacters(commerceItem.embossingObj.ConsumerTaxAmount);
                            } else {
                                streamWriter.writeCharacters(commerceItem.embossingObj.TaxAmount);
                            }
                            streamWriter.writeEndElement();
                            streamWriter.writeRaw('\r\n');
                            streamWriter.writeStartElement('ConsumerDutyAmount');
                            if (eswOrderNo) {
                                streamWriter.writeCharacters(commerceItem.embossingObj.ConsumerDutyAmount);
                            } else {
                                streamWriter.writeCharacters(commerceItem.embossingObj.DutyAmount);
                            }
                            streamWriter.writeEndElement();
                            streamWriter.writeRaw('\r\n');
                            streamWriter.writeStartElement('ConsumerInsAmount');
                            streamWriter.writeEndElement();
                            streamWriter.writeRaw('\r\n');
                            streamWriter.writeStartElement('ConsumerNetAmount');
                            if (eswOrderNo) {
                                streamWriter.writeCharacters(commerceItem.embossingObj.ConsumerNetAmount);
                            } else {
                                streamWriter.writeCharacters(commerceItem.embossingObj.NetAmount);
                            }
                            streamWriter.writeEndElement();
                            streamWriter.writeRaw('\r\n');
                                // Iterating over the Text objects
                            if (commerceItem.embossingObj.Text.SequenceNumber) {
                                streamWriter.writeStartElement('Text');
                                streamWriter.writeRaw('\r\n');
                                streamWriter.writeStartElement('SequenceNumber');
                                streamWriter.writeCharacters(commerceItem.embossingObj.Text.SequenceNumber);
                                streamWriter.writeEndElement();
                                streamWriter.writeRaw('\r\n');
                                streamWriter.writeStartElement('TextMessage');
                                streamWriter.writeCharacters(commerceItem.embossingObj.Text.TextMessage);
                                streamWriter.writeEndElement();
                                streamWriter.writeRaw('\r\n');
                                streamWriter.writeEndElement();
                                streamWriter.writeRaw('\r\n');
                            }
                            streamWriter.writeEndElement();
                            streamWriter.writeCharacters(''); streamWriter.writeRaw('\r\n');
                        }
                            /* EcommercePOItemPersonalization Elements: ends*/
                    }
                    streamWriter.writeEndElement();
                    exportLogger.debug('Finished writing EcommercePOItemHeader Element for order {0}', order.getOrderNo());
                        /* EcommercePOItemHeader Elements: ends*/
                }
                /* End of the Order element*/
                streamWriter.writeRaw('\r\n');
                streamWriter.writeEndElement();
                streamWriter.writeRaw('\r\n');
                /* End of the root element*/
                streamWriter.writeEndElement();
                streamWriter.writeRaw('\r\n');

                /* End of stream wirting to file*/
                streamWriter.writeEndDocument();
                streamWriter.flush();
                streamWriter.close();
                exportLogger.debug('Closed stream writers successfully for order {0}', order.getOrderNo());
            }

            fileWriter.close();

            Transaction.wrap(function () {
                order.setExportStatus(Order.EXPORT_STATUS_EXPORTED);
            });
            exportLogger.debug('Generated feed file successfully for order {0}', order.getOrderNo());
        } catch (error) {
            orderFailedArray.push(order.getOrderNo());
            exportLogger.error('Error occurred while generating xml, order {0} added to the failed list.', order.getOrderNo());
            exportLogger.error('Exception is: {0}', error);
        }
    } else {
        exportLogger.error('Incorrect Order Object {0} passed to generate XML.', order);
    }
}

/**
*Exports the selected orders to SAP in XML format.
* @returns {boolean} Status of the feed generation success/failure.
*/
function exportOrderFeed() {
    var status = false;
    var Site = require('dw/system/Site');
    try {
        exportLogger.info('Starting order export feed for site:  {0}', Site.current.getID());
        OrderManager.processOrders(generateOrderXML,
             'exportStatus = {0} AND status != {1} AND status != {2} AND status != {3} AND confirmationStatus = {4}',
             ORDER_EXPORT_STATUS,
             Order.ORDER_STATUS_REPLACED,
             Order.ORDER_STATUS_FAILED,
             Order.ORDER_STATUS_CANCELLED,
             Order.CONFIRMATION_STATUS_CONFIRMED
        );
        status = true;
        exportLogger.info('Export OrderFeed Completed successfully');
    } catch (e) {
        exportLogger.error('Error occurred while running order export job. Exception is: {0} ', e.toString())
    }
    return status;
}

module.exports.exportOrderFeed = exportOrderFeed;
