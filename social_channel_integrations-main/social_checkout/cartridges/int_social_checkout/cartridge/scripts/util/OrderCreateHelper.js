'use strict';
var System = require('dw/system/System'),
    OauthFactory = require('*/cartridge/scripts/util/OauthFactory'),
    OauthService = require('*/cartridge/scripts/services/OauthService'),
    Logger = require('dw/system/Logger'),
    Site = require('dw/system/Site');
var CONSTANTS = OauthFactory.CONST_PARAMETERS;
var OrderUtilCode = require("~/cartridge/scripts/util/OrderUtilCode");
var ProductMgr = require('dw/catalog/ProductMgr');

var ReponseCode = OrderUtilCode.RESPONES_CODE;

/**
 * set the billing address for the order
 * @param {dw.order.Basket} basket - basket
 * @param {Object} billingAdressJson - object representing the billing address
 * */
function  setBillingAddress (basket, billingAdressJson)  {
    var billingAddress = basket.createBillingAddress();
    billingAddress.setFirstName(billingAdressJson.first_name);
    billingAddress.setLastName(billingAdressJson.last_name);
    billingAddress.setAddress1(billingAdressJson.address1);
    billingAddress.setAddress2(billingAdressJson.address2);
    billingAddress.setCity(billingAdressJson.city);
    billingAddress.setPostalCode(billingAdressJson.postal_code);
    billingAddress.setStateCode(billingAdressJson.state_code);
    billingAddress.setCountryCode(billingAdressJson.country_code);
    billingAddress.setPhone(billingAdressJson.phone);
}

/**
 * set the shipping address for the order
 * @param {dw.order.Basket} basket - basket
 * @param {Object} shipmentJson - json representing the shippment
 * @return {object} shipment - shipment object of the basket
 * */
 function setShippingAddress (basket, shipmentJson)  {
    var shipment = basket.getDefaultShipment();
    var shippingAddress = shipment.shippingAddress;
    var shippingAdressJson = shipmentJson.shipping_address;
    shippingAddress = shipment.createShippingAddress();
    shippingAddress.setFirstName(shippingAdressJson.first_name);
    shippingAddress.setLastName(shippingAdressJson.last_name);
    shippingAddress.setAddress1(shippingAdressJson.address1);
    shippingAddress.setAddress2(shippingAdressJson.address2);
    shippingAddress.setCity(shippingAdressJson.city);
    shippingAddress.setPostalCode(shippingAdressJson.postal_code);
    shippingAddress.setStateCode(shippingAdressJson.state_code);
    shippingAddress.setCountryCode(shippingAdressJson.country_code);
    shippingAddress.setPhone(shippingAdressJson.phone);
    return shipment;
}

/**
 * add the items to the basket
 * @param {dw.order.Basket} basket - basket
 * @param {object} shipment - shipment object of the basket
 * @param {Object} productItems - list of product lime items
 * @param {Object} sInventory - social inventory list
 * @param {string} defaultPromoID - ID of the default promo
 * */
function addItemsToBasket(basket, shipment, productItems, sInventory, defaultPromoID) {
    try {
        var itemInfoArray = [];
        for(var i = 0; i < productItems.length; i++) {
            var item =  productItems[i];
            var productID = item.product_id;
            var qty = item.quantity;
            //check inventory
            var piRecord =  null;
            if (sInventory != null) {
                piRecord = sInventory.getRecord(productID);
            }
            else {
                var product = ProductMgr.getProduct(productID);
                if (product != null) {
                    piRecord = product.getAvailabilityModel().getInventoryRecord();
                }
            }
            if (piRecord != null) {
                var scATS = piRecord.ATS.value ;
                if (scATS >= qty) {
                    var Order = require('dw/order/Order');
                    var pli = basket.createProductLineItem(productID, shipment);
                    if (sInventory != null) {
                        pli.setProductInventoryList(sInventory);
                    }
                    pli.setQuantityValue(qty*1);
                    var price = item.net_price;
                    price /= qty;
                    pli.setPriceValue(price);
                    var taxRate = 0.0;
                    if (item.hasOwnProperty("tax_rate")) {
                        taxRate = item.tax_rate;
                    }
                    pli.updateTax(taxRate*1.0);
                    if (item.hasOwnProperty("tax")) {
                        var taxValue = item.tax;
                        pli.setTax(dw.value.Money(taxValue, basket.getCurrencyCode()));
                    }

                    if(item.hasOwnProperty("price_adjustments")) {
                        applyPriceAdjustments(defaultPromoID, item.price_adjustments, pli, basket);
                    }

                    updateOptionProdduct(pli,ProductMgr.getProduct(productID),taxRate);

                    pli.custom.externalLineItemStatus = Order.SHIPPING_STATUS_NOTSHIPPED;
                    itemInfoArray.push({
                        product_id: productID,
                        ats: scATS - qty
                    });
                } else {
                    return {
                        error: true,
                        product_id :productID,
                        ats: piRecord.ATS.value,
                        msg: "Insufficient qty available"
                    };
                }
            } else {
                return {
                    error: true,
                    product_id :productID,
                    msg: "Item not available for the given social channel"
                };
            }
        }
        return {
            error: false,
            itemInfo: itemInfoArray,
            msg: "item added to cart"
        };
    } catch (e) {
        return {
            error: true,
            msg: "Error adding item : " +  e
        };
    }
}


/**
 * add price adjustment
 * @param {string} defaultPromoID - ID of the default promo
 * @param {JSON} price_adjustments[] - Price adjustment array
 * @param {dw.order.ProductLineItem/dw.order.LineItemCtnr} li - Item or basket for item level or order level price adjustment
 * @param {dw.order.Basket} basket - current basket
 * */
function applyPriceAdjustments(defaultPromoID, priceAdjs, li,basket) {
    var taxRate = 0.0;
    for(var i = 0; i < priceAdjs.length; i++) {
        if (priceAdjs[i].hasOwnProperty("net_price")) {
            var promoID = priceAdjs[i].hasOwnProperty("promotion_id") ? priceAdjs[i].promotion_id : defaultPromoID;
            var priceAdjustment = li.createPriceAdjustment(promoID);
            priceAdjustment.setPriceValue(priceAdjs[i].net_price)
            priceAdjustment.updateTax(taxRate*1.0);
            if (priceAdjs[i].hasOwnProperty("tax")) {
                priceAdjustment.setTax(dw.value.Money(priceAdjs[i].tax, basket.getCurrencyCode()));
            }
        }
    }
}


/**
 * update price for option product
 * @param {object} ProductLineItem - Item representing in the cart
 * @param {Object} Product - Item that was just added to cart
 * @param {Object} Product - Item that was just added to cart
 * */
function updateOptionProdduct(pli, product,taxRate) {
    var prdOptionModel = product.getOptionModel();
    var prdOptionIter = prdOptionModel.getOptions().iterator();
    if (prdOptionIter.hasNext()) {
        var prdOption = prdOptionIter.next();
        var defaultPrdOptionValue = prdOption.defaultValue;

        if (defaultPrdOptionValue != null) {
            var optionPrice = prdOptionModel.getPrice(defaultPrdOptionValue).getValue();
            var pliOptions = pli.getOptionProductLineItems().iterator();
            if (pliOptions.hasNext()) {
                var optionPLI = pliOptions.next();
                optionPLI.setPriceValue(optionPrice);
                if (taxRate == 0.0) {
                    optionPLI.updateTax(pli.getAdjustedTax().getValue() / pli.getAdjustedNetPrice().getValue())
                }
            }
        }
    }
}

/**
 * set shipping method
 * @param {object} shipment - shipment object of the basket
 * @param {Object} shipmentJson - json representing the shippment
 * */
 function setShippingMethod(shipment, shipmentJson) {
    var ShippingMgr = require('dw/order/ShippingMgr');
    var methods = ShippingMgr.getAllShippingMethods().iterator();
    var shipMethodID = shipmentJson.shipping_method;
    var shippingMethod = null;
    while (methods.hasNext()) {
        var method = methods.next();
        if (method.getID() === shipMethodID) {
            shippingMethod = method;
            break;
        }
    }
    shipment.setShippingMethod(shippingMethod);
}


/**
 * set shipping cost
 * @param {object} shipment - shipment object of the basket
 * @param {object} shippingTotalsJson - Json of the shipping totals
 * */
 function setShippingCost(shipment, shippingTotalsJson) {
	    var sli = shipment.getStandardShippingLineItem();
	    var shippingCost = shippingTotalsJson.net_price;
	    sli.setPriceValue(shippingCost*1.0);
		sli.updateTax(0.0);
}

/**
 * remove any auto aplied promotion/price adjustments
 * @param {dw.order.Basket} basket - basket
 * @param {string} defaultPromoID - ID of the default promo*
 * */
 function removePriceAdjustments(basket, defaultPromoID) {
    var paIter = basket.priceAdjustments.iterator();
    while (paIter.hasNext()) {
        var pa = paIter.next();
        if (!pa.getPromotionID().equalsIgnoreCase(defaultPromoID)) {
            basket.removePriceAdjustment(pa);
        }
    }
}

/**
 * check access token
 * @param {dw.system.Request} req - request
 * */
function checkAccessToken(req) {

    var httpHeaders = req.httpHeaders;
    if (httpHeaders.containsKey(CONSTANTS.HTTP_HEADER_AUTH) ||  httpHeaders.containsKey(CONSTANTS.HTTP_HEADER_X_AUTH)) {
        var authString = httpHeaders.get(CONSTANTS.HTTP_HEADER_X_AUTH);
        if (authString == null) {
            authString = httpHeaders.get(CONSTANTS.HTTP_HEADER_AUTH)
        }
        var accessToken = authString.substring(CONSTANTS.TOKEN_TYPE.length+1);
        if (validateAccessToken(accessToken)) {
            return ReponseCode.SUCCESS;
        }
        else {
            return ReponseCode.INVALID_ACCESS_TOKEN;
        }
    }
    else {
        return ReponseCode.INVALID_ACCESS_TOKEN;
    }

    Logger.error("HTTP Header = " + httpHeaders);
    //var accessToken =
}

/**
 * make OCAPI call to validate accessToken
 * @param {String} accessToken - accessToken
 * @returns {boolean} true if token is valid otherwise false.
 * */
function validateAccessToken(accessToken) {
    var requestDataContainer = OauthFactory.buildUserSeachRequestContainer(accessToken, CONSTANTS.POST_POST);
    var scvUser = OauthService.getUserService(requestDataContainer);
    scvUser.URL = CONSTANTS.HTTPS + CONSTANTS.COLON + CONSTANTS.FSLASH + CONSTANTS.FSLASH + System.getInstanceHostname() + scvUser.configuration.credential.URL;
    var errResponse = scvUser.call(requestDataContainer).errorMessage;
    if (errResponse != null) {
        if (errResponse.indexOf("InvalidAccessTokenException") > -1) {
            return false;
        }
        else {
            return true;
        }
    }
    else {
        return false;
    }
}

/**
 * @param {string} key site preference key that needs to be looked up
 * @returns {result} The SitePreference value.
*/
function getSitePreference(key) {
    let result = null;
    result = Site.getCurrent().getCustomPreferenceValue(key);
    if (empty(result)) {
        result = '';
    }
    return result;
}


/**
 * check if order already created in Commerc eCloud
 * @param {string} key site preference key that needs to be looked up
*/
function orderExists(extOrdID) {
    var OrderMgr = require('dw/order/OrderMgr');
    var order = OrderMgr.searchOrder('custom.externalOrderId={0}', extOrdID);
    if (order !=null) {
        //order found
        return {
            error: false,
            orderNo: order.orderNo,
            c_externalChannelOrderStatus: order.getStatus().getDisplayValue() ,
            shippingStatus: order.getShippingStatus().getDisplayValue() ,
            msg: "Order already exists"
        };
    }
    else {
        return null;
    }
}



module.exports = {
    setBillingAddress: setBillingAddress,
    setShippingAddress: setShippingAddress,
    addItemsToBasket : addItemsToBasket,
    setShippingMethod : setShippingMethod,
    setShippingCost : setShippingCost,
    removePriceAdjustments : removePriceAdjustments,
    checkAccessToken : checkAccessToken,
    getSitePreference: getSitePreference,
    orderExists: orderExists,
    applyPriceAdjustments: applyPriceAdjustments
};
