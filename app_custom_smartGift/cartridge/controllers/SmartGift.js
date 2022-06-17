'use strict';

var server = require('server');

var Transaction = require('dw/system/Transaction');
var Logger = require('dw/system/Logger');
var ProductMgr = require('dw/catalog/ProductMgr');

function addLineItem(currentBasket, product, quantity, defaultShipment) {
    
    Transaction.wrap(function () {
        var productLineItem = currentBasket.createProductLineItem(product, defaultShipment);
        if (quantity && quantity > 1) {
            productLineItem.setQuantityValue(quantity);
        }
        return productLineItem;
    });
}

server.get('AddToCart', server.middleware.https, function (req, res, next) {
    var BasketMgr = require('dw/order/BasketMgr');
    var smartGiftService = require('*/cartridge/scripts/smartGiftService/smartGiftService');

    var Site = require('dw/system/Site');
    var URLUtils = require('dw/web/URLUtils');
    
    var product;
    var trackingCode;
    var requestPayload; 
    var trackingCode = req.querystring.tc;
    try {
        if (trackingCode) {
            requestPayload = smartGiftService.getCartDetails(trackingCode);
            if (!requestPayload.error && requestPayload.responseObject.data) {
                if (requestPayload.responseObject.data.items.length > 0) {
                    var currentBasket = BasketMgr.getCurrentOrNewBasket();
                    var defaultShipment;
                    var defaultShipmentAddress;
                    var recepient = requestPayload.responseObject.data.customers.recipient;
                    var sender = requestPayload.responseObject.data.customers.sender;
                    var billingAddress;
                    
                    Transaction.wrap(function () {
                        currentBasket.custom.smartGiftTrackingCode = trackingCode;
                        defaultShipment = currentBasket.defaultShipment;
                        defaultShipmentAddress = defaultShipment.createShippingAddress();
                        defaultShipmentAddress.setAddress1(recepient.addressLine1);
                        defaultShipmentAddress.setAddress2(recepient.addressLine2);
                        defaultShipmentAddress.setCity(recepient.city);
                        defaultShipmentAddress.setCountryCode(recepient.country.numcode);
                        defaultShipmentAddress.setFirstName(recepient.firstName);
                        defaultShipmentAddress.setLastName(recepient.lastName);
                        defaultShipmentAddress.setPhone(recepient.phone);
                        defaultShipmentAddress.setPostalCode(recepient.postalCode);
                        defaultShipmentAddress.setStateCode(recepient.state);
                        
                        if (sender.city && sender.postalCode && sender.addressLine1 && sender.firstName && sender.lastName && sender.state && sender.phone && sender.country) {
                            billingAddress = currentBasket.createBillingAddress();
                            billingAddress.setFirstName(sender.firstName);
                            billingAddress.setLastName(sender.lastName);
                            billingAddress.setPhone(sender.phone);
                            billingAddress.setCity(sender.city);
                            billingAddress.setCountryCode(sender.country_id);
                            billingAddress.setPostalCode(sender.postalCode);
                            billingAddress.setAddress1(sender.addressLine1);
                            billingAddress.setAddress2(sender.addressLine2);
                            billingAddress.setStateCode(sender.state);
                        }
                    });
                    
                    var productLineItem;
                    requestPayload.responseObject.data.items.forEach(function (item) {
                            product = ProductMgr.getProduct(item.sku);
                            if (product) {
                                productLineItem = addLineItem(currentBasket, product.ID, item.quantity, defaultShipment);
                            }
                    });

                    if (!Site.getCurrent().preferences.custom.isClydeEnabled || Site.getCurrent().preferences.custom.isClydeEnabled) {
                        var Constants = require('*/cartridge/utils/Constants');
                        var orderLineItems = currentBasket.allProductLineItems;
                        var orderLineItemsIterator = orderLineItems.iterator();
                        var productLineItemW;
                        Transaction.wrap(function () {
                            while (orderLineItemsIterator.hasNext()) {
                                productLineItemW = orderLineItemsIterator.next();
                                if (productLineItemW instanceof dw.order.ProductLineItem && productLineItemW.optionID == Constants.CLYDE_WARRANTY && productLineItemW.optionValueID == Constants.CLYDE_WARRANTY_OPTION_ID_NONE) {
                                    currentBasket.removeProductLineItem(productLineItemW);
                                }
                            }
                        });
                    }
                } else {
                    Logger.error("Items do not exist in the response, and items length is: " + requestPayload.responseObject.data.items);
                    res.redirect('Home-ErrorNotFound');
                }
            } else {
                Logger.error("No Valid response from the API, and response is: " + requestPayload);
                res.redirect('Home-ErrorNotFound');
            }
        }
    } catch (e) {
        Logger.error("Error occurred while try to get details to smart gift, and error is: " + e);
        res.redirect('Home-ErrorNotFound');
    }
    
    res.redirect(URLUtils.https('Cart-Show'));
    next();
});

module.exports = server.exports();