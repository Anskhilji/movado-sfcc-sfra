'use strict';

var Money = require('dw/value/Money');
var Order = require('dw/order/Order');
var ProductMgr = require('dw/catalog/ProductMgr');
var Site = require('dw/system/Site');
var StringUtils = require('dw/util/StringUtils');
var System = require('dw/system/System');

var OauthFactory = require('*/cartridge/scripts/util/OauthFactory');
var OauthService = require('*/cartridge/scripts/services/OauthService');
var OrderUtilCode = require('~/cartridge/scripts/util/OrderUtilCode');
var ReponseCode = OrderUtilCode.RESPONSE_CODE;
var CONSTANTS = OauthFactory.CONST_PARAMETERS;
var DEFAULT_VALUES = {
    FIRST_NAME: 'TikTok',
    LAST_NAME: 'Shop'
};

/**
 * converts state code to state name or state name to state code
 * @param {string} input - the state code or state name
 * @param {string} to - code or name, based on the value that needs to be returned
 * @param {dw.web.FormFieldOptions} options - form field options
 * @returns {string} the state name or code
 */
function convertField(input, to, options) {
    if (!input) return '';
    var Resource = require('dw/web/Resource');

    var option;
    var values = []; // [['Alabama', 'AL'], ['Alaska', 'AK']]
    var retValue = StringUtils.trim(input);

    if (options && Object.keys(options).length) {
        Object.keys(options).forEach(function (key) {
            var fieldOption = options[key];
            if (fieldOption.value && fieldOption.label) {
                var exists = values.find(s => String(s[1]).toLowerCase() === String(fieldOption.value).toLowerCase());
                if (!exists) {
                    values.push([Resource.msg(fieldOption.label, 'forms', retValue), fieldOption.value]);
                }
            }
        });
    }

    if (to === 'name') {
        option = values.find(s => String(s[1]).toLowerCase() === String(input).toLowerCase());
        if (option) retValue = option[0];
    } else {
        option = values.find(s => String(s[0]).toLowerCase() === String(input).toLowerCase());
        if (option) retValue = option[1];
    }

    return retValue;
}

/**
 * converts state code to state name or state name to state code
 * @param {string} input - the state code or state name
 * @param {string} to - code or name, based on the value that needs to be returned
 * @returns {string} the state name or code
 */
function convertState(input, to) {
    if (!input) return '';
    var options = session.forms.address.states.stateCode.getOptions();
    return convertField(input, to, options);
}

/**
 * converts country code to country name or country name to country code
 * @param {string} input - the country code or country name
 * @param {string} to - code or name, based on the value that needs to be returned
 * @returns {string} the country name or code
 */
function convertCountry(input, to) {
    if (!input) return '';
    var options = session.forms.address.country.getOptions();
    return convertField(input, to, options);
}

/**
 * splits a full name into first and last name
 * @param {string} fullName - the full name
 * @returns {Object} customerObject - customer.firstName, customer.lastName
 */
function splitFullName(fullName) {
    var customerObject = {
        firstName: '',
        lastName: ''
    };
    if (!fullName) return customerObject;
    var spaceIndex = fullName.indexOf(' ');
    if (spaceIndex > -1) {
        customerObject.firstName = fullName.substring(0, spaceIndex);
        customerObject.lastName = fullName.substring(spaceIndex + 1);
    } else {
        customerObject.firstName = fullName;
        customerObject.lastName = '';
    }
    return customerObject;
}

/**
 * helper function for setting basket billing and shipping address
 * @param {dw.order.OrderAddress} orderAddress - basket shipping or billing address
 * @param {Object} addressJson - JSON request shipping or billing address
 */
function setAddressFields(orderAddress, addressJson) {
    if (!addressJson || !Object.keys(addressJson).length) return;

    // check to see if first and last name have been combined ("first_name": "Jane Doe")
    var firstName = addressJson.first_name || null;
    var lastName = addressJson.last_name || null;
    if (firstName && firstName.indexOf(' ') > -1 && !lastName) {
        var customerObject = splitFullName(firstName);
        if (customerObject.firstName) firstName = customerObject.firstName;
        if (customerObject.lastName) lastName = customerObject.lastName;
    }

    if (firstName) {
        orderAddress.setFirstName(firstName);
    } else {
        orderAddress.setFirstName(DEFAULT_VALUES.FIRST_NAME);
    }
    if (lastName) {
        orderAddress.setLastName(lastName);
    } else {
        orderAddress.setLastName(DEFAULT_VALUES.LAST_NAME);
    }
    if (addressJson.address1) {
        orderAddress.setAddress1(addressJson.address1);
    }
    if (addressJson.address2) {
        orderAddress.setAddress2(addressJson.address2);
    }
    if (addressJson.city) {
        orderAddress.setCity(addressJson.city);
    }
    if (addressJson.postal_code) {
        orderAddress.setPostalCode(addressJson.postal_code);
    }
    if (addressJson.state_code) {
        orderAddress.setStateCode(convertState(addressJson.state_code, 'code'));
    }
    if (addressJson.country_code) {
        orderAddress.setCountryCode(convertCountry(addressJson.country_code, 'code'));
    }
    if (addressJson.phone) {
        orderAddress.setPhone(addressJson.phone);
    }
}

/**
 * set the billing address for the order
 * @param {dw.order.Basket} basket - basket
 * @param {Object} billingAddressJson - object representing the billing address
 * @param {Object} shippingAddressJson - object representing the shipping address
 * @param {Object} customerObject - object representing the customer
 * */
function setBillingAddress(basket, billingAddressJson, shippingAddressJson, customerObject) {
    var billingAddress = basket.createBillingAddress();

    var addressJson = billingAddressJson;
    if (!addressJson || !Object.keys(addressJson).length) {
        addressJson = shippingAddressJson || {
            first_name: customerObject && customerObject.firstName ? customerObject.firstName : DEFAULT_VALUES.FIRST_NAME,
            last_name: customerObject && customerObject.lastName ? customerObject.lastName : DEFAULT_VALUES.LAST_NAME
        };
    }
    setAddressFields(billingAddress, addressJson);
}

/**
 * set the shipping address for the order
 * @param {dw.order.Basket} basket - basket
 * @param {Object} shipmentJson - json representing the shipment
 * @return {Object} shipment - shipment object of the basket
 * */
function setShippingAddress(basket, shipmentJson) {
    var shipment = basket.getDefaultShipment();
    var shippingAddress = shipment.shippingAddress;
    if (!shippingAddress) {
        shippingAddress = shipment.createShippingAddress();
    }
    var addressJson = shipmentJson.shipping_address;
    if (!addressJson) {
        addressJson = {
            first_name: DEFAULT_VALUES.FIRST_NAME,
            last_name: DEFAULT_VALUES.LAST_NAME
        };
    }
    setAddressFields(shippingAddress, addressJson);
    return shipment;
}

/**
 * set the customer name for the order - customer name must be set
 * from the customer profile or order billing address
 * @param {dw.order.Basket} basket - basket
 * @param {Object} orderJSON - object representing the order
 * @param {dw.customer.Customer} orderCustomer - object representing the customer
 * @returns {Object} customerNameObject - customer.firstName, customer.lastName
 */
function getCustomerName(basket, orderJSON, orderCustomer) {
    var customerObject = {
        firstName: DEFAULT_VALUES.FIRST_NAME,
        lastName: DEFAULT_VALUES.LAST_NAME
    };

    // set from billing address
    if (basket && basket.billingAddress && basket.billingAddress.firstName && basket.billingAddress.lastName) {
        customerObject.firstName = basket.billingAddress.firstName;
        customerObject.lastName = basket.billingAddress.lastName;
        return customerObject;
    }
    // set from order customer profile
    if (orderCustomer && orderCustomer.profile && orderCustomer.profile.firstName && orderCustomer.profile.lastName) {
        customerObject.firstName = orderCustomer.profile.firstName;
        customerObject.lastName = orderCustomer.profile.lastName;
        return customerObject;
    }

    // set from order JSON data
    if (orderJSON) {
        if (Object.hasOwnProperty.call(orderJSON, 'customer')) {
            // set from billing address
            if (Object.hasOwnProperty.call(orderJSON.customer, 'billing_address')
                && orderJSON.customer.billing_address.first_name
                && orderJSON.customer.billing_address.last_name) {
                customerObject.firstName = orderJSON.customer.billing_address.first_name;
                customerObject.lastName = orderJSON.customer.billing_address.last_name;
                return customerObject;
            }

            // set from customer info
            if (Object.hasOwnProperty.call(orderJSON.customer, 'customer_name') && orderJSON.customer.customer_name) {
                var splitResult = splitFullName(orderJSON.customer.customer_name);
                if (splitResult.firstName) customerObject.firstName = splitResult.firstName;
                if (splitResult.lastName) customerObject.lastName = splitResult.lastName;
                return customerObject;
            }

            // set from shipping address
            if (Object.hasOwnProperty.call(orderJSON, 'shipment')
                && Object.hasOwnProperty.call(orderJSON.shipment, 'shipping_address')
                && orderJSON.shipment.shipping_address.first_name
                && orderJSON.shipment.shipping_address.last_name) {
                customerObject.firstName = orderJSON.shipment.shipping_address.first_name;
                customerObject.lastName = orderJSON.shipment.shipping_address.last_name;
                return customerObject;
            }
        }
    }
    // fallback to defaults
    return customerObject;
}

/**
 * add price adjustment
 * @param {string} defaultPromoID - ID of the default promo
 * @param {JSON} priceAdjs - Price adjustment array
 * @param {dw.order.ProductLineItem/dw.order.LineItemCtnr} li - Item or basket for item level or order level price adjustment
 * @param {dw.order.Basket} basket - current basket
 * */
function applyPriceAdjustments(defaultPromoID, priceAdjs, li, basket) {
    var currencyCode = basket.getCurrencyCode();
    for (var i = 0; i < priceAdjs.length; i++) {
        if (Object.hasOwnProperty.call(priceAdjs[i], 'net_price')) {
            var promoID = Object.hasOwnProperty.call(priceAdjs[i], 'promotion_id') ? priceAdjs[i].promotion_id : defaultPromoID;
            var priceAdjustment = li.createPriceAdjustment(promoID);
            priceAdjustment.setPriceValue(priceAdjs[i].net_price);
            var taxRate = 0;
            var taxAmount = new Money(0, currencyCode);
            if (Object.hasOwnProperty.call(priceAdjs[i], 'tax')) {
                taxAmount = new Money(priceAdjs[i].tax, currencyCode);
            }
            priceAdjustment.setTax(taxAmount);
            priceAdjustment.updateTax(taxRate * 1.0);
            priceAdjustment.updateTaxAmount(taxAmount);
        }
    }
}

/**
 * update price for option product
 * @param {dw.order.ProductLineItem} pli - Item representing in the cart
 * @param {dw.catalog.Product} product - Item that was just added to cart
 * @param {Object} taxRate - Item that was just added to cart
 * */
function updateOptionProdduct(pli, product, taxRate) {
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
                if (taxRate == 0.0) { // eslint-disable-line eqeqeq
                    optionPLI.updateTax(pli.getAdjustedTax().getValue() / pli.getAdjustedNetPrice().getValue());
                }
            }
        }
    }
}

/**
 * add the items to the basket
 * @param {dw.order.Basket} basket - basket
 * @param {Object} shipment - shipment object of the basket
 * @param {Object} productItems - list of product lime items
 * @param {Object} sInventory - social inventory list
 * @param {string} defaultPromoID - ID of the default promo
 * @return {Object} result object
 * */
function addItemsToBasket(basket, shipment, productItems, sInventory, defaultPromoID) {
    try {
        var itemInfoArray = [];
        var currencyCode = basket.getCurrencyCode();
        for (var i = 0; i < productItems.length; i++) {
            var item = productItems[i];
            var productID = item.product_id;
            var qty = item.quantity;
            // check inventory
            var piRecord = null;
            if (sInventory != null) {
                piRecord = sInventory.getRecord(productID);
            } else {
                var product = ProductMgr.getProduct(productID);
                if (product != null) {
                    piRecord = product.getAvailabilityModel().getInventoryRecord();
                }
            }
            if (piRecord != null) {
                var scATS = piRecord.ATS.value;
                if (scATS >= qty) {
                    var pli = basket.createProductLineItem(productID, shipment);
                    var taxRate = 0;
                    var taxAmount = new Money(0, currencyCode);

                    if (sInventory != null) {
                        pli.setProductInventoryList(sInventory);
                    }
                    pli.setQuantityValue(qty * 1);
                    var price = item.net_price;
                    price /= qty;
                    pli.setPriceValue(price);

                    if (Object.hasOwnProperty.call(item, 'tax_rate') && item.tax_rate > 0) {
                        taxRate = item.tax_rate;
                    }

                    if (Object.hasOwnProperty.call(item, 'tax') && item.tax > 0) {
                        taxAmount = new Money(item.tax, currencyCode);
                    }

                    // update line item tax
                    pli.setTax(taxAmount);
                    pli.updateTax(taxRate * 1.0);
                    pli.updateTaxAmount(taxAmount);

                    if (Object.hasOwnProperty.call(item, 'price_adjustments')) {
                        applyPriceAdjustments(defaultPromoID, item.price_adjustments, pli, basket);
                    }

                    updateOptionProdduct(pli, ProductMgr.getProduct(productID), taxRate);

                    pli.custom.externalLineItemStatus = Order.SHIPPING_STATUS_NOTSHIPPED;
                    itemInfoArray.push({
                        product_id: productID,
                        ats: scATS - qty
                    });
                } else {
                    return {
                        error: true,
                        product_id: productID,
                        ats: piRecord.ATS.value,
                        msg: 'Insufficient qty available'
                    };
                }
            } else {
                return {
                    error: true,
                    product_id: productID,
                    msg: 'Item not available for the given social channel'
                };
            }
        }
        return {
            error: false,
            itemInfo: itemInfoArray,
            msg: 'item added to cart'
        };
    } catch (e) {
        return {
            error: true,
            msg: 'Error adding item : ' + e
        };
    }
}

/**
 * set shipping method
 * @param {Object} shipment - shipment object of the basket
 * @param {Object} shipmentJson - json representing the shipment
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
 * @param {Object} shipment - shipment object of the basket
 * @param {Object} shippingTotalsJson - Json of the shipping totals
 * */
function setShippingCost(shipment, shippingTotalsJson) {
    var sli = shipment.getStandardShippingLineItem();
    var shippingCost = shippingTotalsJson.net_price;
    sli.setPriceValue(shippingCost * 1.0);
    sli.updateTax(0.0);
}

/**
 * remove any auto applied promotion/price adjustments
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
 * make OCAPI call to validate accessToken
 * @param {string} accessToken - accessToken
 * @returns {boolean} true if token is valid otherwise false.
 * */
function validateAccessToken(accessToken) {
    var requestDataContainer = OauthFactory.buildUserSearchRequestContainer(accessToken, 'POST');
    var scvUser = OauthService.getUserService(requestDataContainer);
    scvUser.URL = 'https://' + System.getInstanceHostname() + scvUser.configuration.credential.URL;
    var svcResponse = scvUser.call(requestDataContainer);
    if (svcResponse.ok) {
        return true;
    }
    if (svcResponse.errorMessage) {
        return svcResponse.errorMessage.indexOf('InvalidAccessTokenException') <= -1;
    }
    return false;
}

/**
 * check access token
 * @param {dw.system.Request} req - request
 * @returns {Object} response object
 * */
function checkAccessToken(req) {
    var httpHeaders = req.httpHeaders;
    if (httpHeaders.containsKey(CONSTANTS.HTTP_HEADERS.AUTH) || httpHeaders.containsKey(CONSTANTS.HTTP_HEADERS.X_AUTH)) {
        var authString = httpHeaders.get(CONSTANTS.HTTP_HEADERS.X_AUTH) || httpHeaders.get(CONSTANTS.HTTP_HEADERS.AUTH);
        var accessToken = authString.substring(CONSTANTS.AUTH_TYPES.BEARER.length + 1);
        if (validateAccessToken(accessToken)) {
            return ReponseCode.SUCCESS;
        }

        return ReponseCode.INVALID_ACCESS_TOKEN;
    }

    return ReponseCode.INVALID_ACCESS_TOKEN;
}

/**
 * @param {string} key site preference key that needs to be looked up
 * @returns {string} The SitePreference value.
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
 * check if order already created in Commerce Cloud
 * @param {string} extOrdID site preference key that needs to be looked up
 * @returns {Object|null} order object or null
*/
function orderExists(extOrdID) {
    var OrderMgr = require('dw/order/OrderMgr');
    var order = OrderMgr.searchOrder('custom.externalOrderId={0}', extOrdID);
    if (!order) return null;
    return {
        error: false,
        orderNo: order.orderNo,
        c_externalChannelOrderStatus: order.getStatus().getDisplayValue(),
        shippingStatus: order.getShippingStatus().getDisplayValue(),
        msg: 'Order already exists'
    };
}

/**
 * check if order already created in Commerce Cloud by channelID
 * @param {string} extOrdID external order ID
 * @param {string} channelTypeID channel type
 * @returns {Object|null} order object or null
*/
function orderExistsByChannel(extOrdID, channelTypeID) {
    var OrderMgr = require('dw/order/OrderMgr');
    var orderResult = OrderMgr.searchOrder(
        'custom.externalOrderId={0} AND channelType={1}',
        extOrdID,
        channelTypeID
    );
    if (!orderResult) return null;

    return {
        error: false,
        orderNo: orderResult.orderNo,
        msg: 'Order already exists for the channel'
    };
}

/**
 * validate if the products sent are available
 * @param {*} productItems list of products to be validated
 * @returns {Object} status of validation
 */
function validateProducts(productItems) {
    var returnObject = {
        success: true
    };

    try {
        var invalidProduct;
        productItems.toArray().every(function (productItem) {
            var productId = productItem.productId;
            var quantity = productItem.quantity;
            var apiProduct = ProductMgr.getProduct(productId);
            var isAssignedToSiteCatalog = apiProduct ? apiProduct.assignedToSiteCatalog : false;
            var availabilityModel = apiProduct ? apiProduct.getAvailabilityModel() : null;
            var isOrderable = availabilityModel ? availabilityModel.isOrderable(quantity) : false;

            if (!apiProduct || !isAssignedToSiteCatalog || !availabilityModel.getAvailability()) {
                invalidProduct = productId;
                returnObject.responseCode = ReponseCode.INVALID_PRODUCTS;
                returnObject.responseCode.msg = StringUtils.format(returnObject.responseCode.msg, productId);
                return false;
            }

            if (!isOrderable) {
                invalidProduct = productId;
                returnObject.responseCode = ReponseCode.INSUFFICIENT_INVENTORY;
                returnObject.responseCode.msg = StringUtils.format(returnObject.responseCode.msg, productId);
                return false;
            }

            return true;
        });

        if (invalidProduct) {
            returnObject.success = false;
            returnObject.invalidProduct = invalidProduct;
        }
    } catch (ex) {
        returnObject.success = false;
        returnObject.responseCode = ReponseCode.INTERNAL_ERROR;
        returnObject.responseCode.msg = ex.message;
    }
    return returnObject;
}

/**
 * validate if the shipments of the order
 * @param {*} shipmentItems list of shipments to be validated
 * @returns {Object} status of validation
 */
function validateShipments(shipmentItems) {
    var returnObject = {
        success: true
    };

    try {
        var ShippingMgr = require('dw/order/ShippingMgr');
        // returns only shippings according to current session currency
        var availableShippingMethods = ShippingMgr.getAllShippingMethods().toArray();
        var invalidShipment = null;

        var shippingMethodIds = shipmentItems.toArray().map((si) => si.shippingMethod);
        var availableShippingMethodIds = availableShippingMethods.map((m) => m.getID());

        for (var i = 0; i < shippingMethodIds.length; i++) {
            if (availableShippingMethodIds.indexOf(shippingMethodIds[i]) < 0) {
                invalidShipment = shippingMethodIds[i];
                break;
            }
        }

        if (invalidShipment) {
            returnObject.success = false;
            returnObject.invalidShipment = invalidShipment;
            returnObject.responseCode = ReponseCode.INVALID_SHIPMENT;
            returnObject.responseCode.msg = StringUtils.format(returnObject.responseCode.msg, invalidShipment);
        }
    } catch (ex) {
        returnObject.success = false;
        returnObject.responseCode = ReponseCode.INTERNAL_ERROR;
        returnObject.responseCode.msg = ex.message;
    }
    return returnObject;
}

/**
 * if the currency is sent in the request we need to change the current session currency because some data depend on this information, such as the shipping methods
 * @param {*} order parsed JSON order sent as parameter in beforePost hook function
 */
function setCurrencySession(order) {
    if (order.currency) {
        var Currency = require('dw/util/Currency');
        var currency = Currency.getCurrency(order.currency);
        // if the currency is null it is because such currency does not exists or it is invalid
        if (currency) {
            session.setCurrency(currency);
        }
    }
}

module.exports = {
    convertState: convertState,
    convertCountry: convertCountry,
    setBillingAddress: setBillingAddress,
    setShippingAddress: setShippingAddress,
    getCustomerName: getCustomerName,
    addItemsToBasket: addItemsToBasket,
    setShippingMethod: setShippingMethod,
    setShippingCost: setShippingCost,
    removePriceAdjustments: removePriceAdjustments,
    checkAccessToken: checkAccessToken,
    getSitePreference: getSitePreference,
    orderExists: orderExists,
    applyPriceAdjustments: applyPriceAdjustments,
    orderExistsByChannel: orderExistsByChannel,
    validateProducts: validateProducts,
    validateShipments: validateShipments,
    setCurrencySession: setCurrencySession
};
