'use strict';

var Site = require('dw/system/Site');
var Resource = require('dw/web/Resource');
var Calendar = require('dw/util/Calendar');
var HashMap = require('dw/util/HashMap');
var ArrayList = require('dw/util/ArrayList');
var SystemObjectMgr = require('dw/object/SystemObjectMgr');
var collections = require('*/cartridge/scripts/util/collections');
var URLUtils = require('dw/web/URLUtils');

var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
var baseTrackingUrl = Site.getCurrent().getCustomPreferenceValue('baseTrackingUrl');

function formatOrderDate(lineItemContainer) {
    var creationDate = Object.hasOwnProperty.call(lineItemContainer, 'creationDate')
	    ? lineItemContainer.creationDate
	    : null;

    if (creationDate) {
        var calendar = new Calendar(creationDate);
        var date = calendar.get(Calendar.DAY_OF_MONTH);
        var month = months[calendar.get(Calendar.MONTH)];
        var year = calendar.get(Calendar.YEAR);
        creationDate = month + ' ' + date + ', ' + year;
    }

    return creationDate;
}

function getTrackingUrls(lineItems) {
    var trackingUrls = new ArrayList();
    var trackingNumbers = new HashMap();

    collections.forEach(lineItems, function (lineItem) {
        var trackingNumber = lineItem.custom.sapTrackingNumber;
        if (trackingNumber != undefined) {
            if (trackingNumbers[trackingNumber] == undefined) {
                trackingNumbers.put(trackingNumber, trackingNumber);
                var trackingURL = baseTrackingUrl + trackingNumber;
                var trackingInfo = {
                    trackingNumber: trackingNumber,
                    trackingURL: trackingURL
                };
                trackingUrls.add(trackingInfo);
            }
        }
    });

    return trackingUrls;
}

function getProductLineItemCustomAttributes(item) {
    var customAttributes = {};
    var optionLineItems = item.optionProductLineItems;
    var formatMoney = require('dw/util/StringUtils').formatMoney;

    if (item.custom.engraveMessageLine1 != undefined) {
        var engrave = { msgLine1: item.custom.engraveMessageLine1 };
        if (item.custom.engraveMessageLine2 != undefined) {
            engrave.msgLine2 = item.custom.engraveMessageLine2;
        }

        collections.map(optionLineItems, function (item) {
	        if (item.optionID.equalsIgnoreCase(Resource.msg('label.personalization.engraved', 'confirmation', null))) {
	        	if (item.basePrice.decimalValue == 0.00) {
	        		engrave.price = Resource.msg('label.personalization.free', 'confirmation', null);
	        	} else {
	        		engrave.price = formatMoney(item.basePrice);
	        	}
	        }
	    });

        customAttributes.engrave = engrave;
    }

    if (item.custom.embossMessageLine1 != undefined) {
        var emboss = { msgLine1: item.custom.embossMessageLine1 };

        collections.map(optionLineItems, function (item) {
        	if (item.optionID.equalsIgnoreCase(Resource.msg('label.personalization.embossed', 'confirmation', null))) {
	        	if (item.basePrice.decimalValue == 0.00) {
	        		emboss.price = Resource.msg('label.personalization.free', 'confirmation', null);
	        	} else {
	        		emboss.price = formatMoney(item.basePrice);
	        	}
	        }
	    });

        customAttributes.emboss = emboss;
    }

    if (item.custom.GiftWrapMessage != undefined) {
        customAttributes.itemLevelGiftMessage = { msgLine1: item.custom.GiftWrapMessage };
    }

    if (item.custom.isGiftWrapped) {
        var price;

        collections.map(optionLineItems, function (item) {
        	if (item.optionID.equalsIgnoreCase(Resource.msg('label.personalization.giftWrapped', 'confirmation', null))) {
	        	if (item.basePrice.decimalValue == 0.00) {
	        		price = Resource.msg('label.personalization.free', 'confirmation', null);
	        	} else {
	        		price = formatMoney(item.basePrice);
	        	}
	        }
	    });

        customAttributes.giftWrap = { price: price };
    }

    if (item.giftMessage != null) {
        customAttributes.giftMessage = item.giftMessage;
    }
    if (item.custom.sapLineStatus) {
        customAttributes.sapLineStatus = item.custom.sapLineStatus;
    }
    return customAttributes;
}

function getSapOrderStatus(lineItemContainer, view) {
    if (view == 'basket') {
        return '';
    }
    	if (lineItemContainer.custom.sapOrderStatus != undefined) {
	    	return lineItemContainer.custom.sapOrderStatus;
	    }
	    	return Resource.msg('label.order.defaultOrderStatus', 'confirmation', null);
}

function formatPhoneNumber(phoneNumber) {
    var cleanedPhoneNumber = ('' + phoneNumber).replace(/\D/g, '');
    var currentLocal = request.locale;
    var match = cleanedPhoneNumber.match(/^(\d{3})(\d{3})(\d{4})$/);

    if (currentLocal === 'en_GB') {
        return phoneNumber;
    }
 
    if (match) {
        return match[1] + '-' + match[2] + '-' + match[3];
    }

    return null;
}

function getCheckoutCouponUrl() {
    return {
        submitCouponCodeUrl: URLUtils.url('Cart-AddCoupon').toString(),
        removeCouponLineItem: URLUtils.url('Cart-RemoveCouponLineItem').toString()
    };
}

function getSaveShippingAddressValue(lineItemContainer) {
    if (lineItemContainer.custom.saveShippingAddress != undefined) {
        return lineItemContainer.custom.saveShippingAddress;
    }
    return false;
}

function getShippingAddressId(lineItemContainer) {
    if (lineItemContainer.custom.shipAddressId != undefined) {
        return lineItemContainer.custom.shipAddressId;
    }
    return null;
}

function getCustomerNo(customer) {
    if (customer && customer.profile) {
        return customer.profile.customerNo;
    }
    return null;
}

module.exports = {
    formatOrderDate: formatOrderDate,
    getTrackingUrls: getTrackingUrls,
    getProductLineItemCustomAttributes: getProductLineItemCustomAttributes,
    getSapOrderStatus: getSapOrderStatus,
    formatPhoneNumber: formatPhoneNumber,
    getCheckoutCouponUrl: getCheckoutCouponUrl,
    getSaveShippingAddressValue: getSaveShippingAddressValue,
    getShippingAddressId: getShippingAddressId,
    getCustomerNo: getCustomerNo
};
