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

function getTrackingUrlsAndNumbers(lineItems) {
    var trackingUrls = new ArrayList();
    var baseTrackingUrl = Site.current.getCustomPreferenceValue('baseTrackingUrl');

    if (!empty(baseTrackingUrl)) {
        baseTrackingUrl = JSON.parse(baseTrackingUrl);
        var trackingUrlsObj = baseTrackingUrl.trackingUrls;
        var trackingNumbers = new HashMap();
        collections.forEach(lineItems, function (lineItem) {
        	var vendorCode = lineItem.custom.sapCarrierCode;
            var trackingNumber = lineItem.custom.sapTrackingNumber;
            if (!empty(trackingNumber) && !empty(vendorCode)) {
                var val = getTrackingURL(trackingUrlsObj, vendorCode, trackingNumber);
                if (empty(trackingNumbers.get(trackingNumber))) {
                    trackingNumbers.put(trackingNumber, trackingNumber);
                    var trackingInfo = {
                        trackingNumber: trackingNumber,
                        trackingURL: getTrackingURL(trackingUrlsObj, vendorCode, trackingNumber)
                    };
                    trackingUrls.add(trackingInfo);
                }
            }
        });
    }
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

    return phoneNumber;
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

function isPreOrder(order) {
    var Transaction = require('dw/system/Transaction');
    var ProductMgr = require('dw/catalog/ProductMgr');
    var isPreOrder = false;
    if (order) {
        var productLineItems = order.getProductLineItems();
        if (productLineItems) {
            var productLineItemsIterator = productLineItems.iterator();
            while (productLineItemsIterator.hasNext()) {
                var lineItem = productLineItemsIterator.next();
                if (lineItem instanceof dw.order.ProductLineItem && !lineItem.bonusProductLineItem) {
	                var apiProduct = ProductMgr.getProduct(lineItem.getProductID());
	                var productAvailabilityModel = apiProduct.getAvailabilityModel();
	                var availabilityModelLevels = productAvailabilityModel.getAvailabilityLevels(lineItem.getQuantity().decimalValue);
	                if (availabilityModelLevels.preorder.value > 0) {
                        Transaction.wrap(function (){
                            lineItem.custom.isPreOrderProduct = true;
                        });
	                    isPreOrder = true;
	                } else {
                        var apiProduct = ProductMgr.getProduct(lineItem.getProductID());
                        var productAvailabilityModel = apiProduct.getAvailabilityModel();
                        var ociCurrentAllocation = productAvailabilityModel.inventoryRecord.allocation.value;
                        var ociProductATO = productAvailabilityModel.inventoryRecord.ATS.value;
                        var ociProductFuture = productAvailabilityModel.inventoryRecord.backorderable;
                        if (ociCurrentAllocation === 0.00 && ociProductATO > 0 && ociProductFuture === true) {
                            Transaction.wrap(function () {
                                lineItem.custom.isPreOrderProduct = true;
                            });
                            isPreOrder = true;
                        }
                    }
                }
            }
        }
    }
    return isPreOrder;
}

/**
* Fetches the payment method from order
* @param {Order} order.
* @returns {PaymentMethod} order payment method
*/
function getPaymentMethod(order) {
    var paymentMethod;
    for (var i = 0; i < order.paymentInstruments.length; i++) {
        paymentMethod = order.paymentInstruments[i].paymentMethod;
    }
    return paymentMethod;
}

/**
 * Fetches the selected payment method from order
 * @param {orderModel} order model.
 * @returns {String} order selected payment method
 */
function getSelectedPaymentMethod(orderModel) {
    var constants = require('*/cartridge/scripts/helpers/constants');
    var selectedPaymentMethod;
    var paymentInstrument;
    
    if (orderModel && orderModel.billing && orderModel.billing.payment && orderModel.billing.payment.selectedPaymentInstruments) {
        var selectedPaymentInstruments = orderModel.billing.payment.selectedPaymentInstruments;
        for (var i = 0; i < selectedPaymentInstruments.length; i++) {
            paymentInstrument = selectedPaymentInstruments[i];
            
            switch (paymentInstrument.paymentMethod) {
                case constants.PAYMENT_METHOD_AFFIRM:
                    selectedPaymentMethod = constants.PAYMENT_METHOD_AFFIRM;
                    break;
                case constants.PAYMENT_METHOD_DW_APPLE_PAY:
                    selectedPaymentMethod = constants.SELECTED_PAYMENT_METHOD_APPLE_PAY;
                    break;
                case constants.PAYMENT_METHOD_CREDIT_CARD:
                    selectedPaymentMethod = constants.SELECTED_PAYMENT_METHOD_CREDIT_CARD;
                    break;
                case constants.PAYMENT_METHOD_EXPRESS_PAY_PAL:
                    selectedPaymentMethod = constants.SELECTED_PAYMENT_METHOD_EXPRESS_PAY_PAL;
                    break;
                case constants.PAYMENT_METHOD_ADYEN:
                    selectedPaymentMethod = paymentInstrument.selectedAdyenPM;
                    break;
                default:
                    selectedPaymentMethod = '';
                    break;
            }
        }
    }

    return selectedPaymentMethod;
}

function getCountryCode(request) {
    var countryCode;
    if (!empty(session.privacy.countryCode)) {
        countryCode = session.privacy.countryCode;
    } else if (request.httpCookies && request.httpCookies['esw.location'] != null && request.httpCookies['esw.location'].value != '') {
        countryCode = request.httpCookies['esw.location'] != null ? (request.httpCookies['esw.location'].value != null ? request.httpCookies['esw.location'].value : '') : '';
    } else {
        countryCode = request.geolocation.countryCode;
    }
    return countryCode;
}

module.exports = {
    formatOrderDate: formatOrderDate,
    getTrackingURL: getTrackingURL,
    getTrackingUrlsAndNumbers: getTrackingUrlsAndNumbers,
    getProductLineItemCustomAttributes: getProductLineItemCustomAttributes,
    getSapOrderStatus: getSapOrderStatus,
    formatPhoneNumber: formatPhoneNumber,
    getCheckoutCouponUrl: getCheckoutCouponUrl,
    getSaveShippingAddressValue: getSaveShippingAddressValue,
    getShippingAddressId: getShippingAddressId,
    getCustomerNo: getCustomerNo,
    isPreOrder: isPreOrder,
    getPaymentMethod: getPaymentMethod,
    getSelectedPaymentMethod: getSelectedPaymentMethod,
    getCountryCode: getCountryCode
};

function getTrackingURL(trackingUrl, vendorCode, trackingNum) {
    var trackingURL = "";
    var trackingURLData = trackingUrl[vendorCode];
    if (trackingURLData !== undefined && trackingURLData) {
        trackingURL = trackingURLData.replace('{trackingNumber}', trackingNum);
    }
    return trackingURL;
}
