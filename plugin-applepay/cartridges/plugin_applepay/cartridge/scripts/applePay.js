var BasketMgr = require('dw/order/BasketMgr');
var CustomObjectMgr = require('dw/object/CustomObjectMgr');
var Status = require('dw/system/Status');
var PaymentInstrument = require('dw/order/PaymentInstrument');
var Logger = require('dw/system/Logger');
var OrderMgr = require('dw/order/OrderMgr');
var Resource = require('dw/web/Resource');
var Transaction = require('dw/system/Transaction');
var ApplePayHookResult = require('dw/extensions/applepay/ApplePayHookResult');

var checkoutAddressHelper = require('*/cartridge/scripts/helpers/checkoutAddressHelper');
var COCustomHelpers = require('*/cartridge/scripts/checkout/checkoutCustomHelpers');
var checkoutLogger = require('*/cartridge/scripts/helpers/customCheckoutLogger').getLogger();
var collections = require('*/cartridge/scripts/util/collections');
var RiskifiedService = require('int_riskified');
var Riskified = require('int_riskified/cartridge/scripts/Riskified');
var Site = require('dw/system/Site');
var hooksHelper = require('*/cartridge/scripts/helpers/hooks');
var Constants = require('*/cartridge/utils/Constants');
var checkoutCustomHelpers = require('*/cartridge/scripts/checkout/checkoutCustomHelpers');
var productCustomHelper = require('*/cartridge/scripts/helpers/productCustomHelper');

var server = require('server');

var EMBOSSED = 'Embossed';
var ENGRAVED = 'Engraved';
var PULSEID_ENGRAVING = 'pulseIdEngraving'
var NEWLINE = '\n';


/**
 * This method is used for checking for PO BOX string in the address passed as parameter.
 * @param address
 * @returns results
 */
function comparePoBox(address) {
    var regex = new RegExp('(?:P(?:ost(?:al)?)?[\\.\\-\\s]*(?:(?:O(?:ffice)?[\\.\\-\\s]*)?B(?:ox|in|\\b|\\d)|o(?:ffice)(?:[-\\s]*)|code))', 'i');
    var results = regex.test(address);
    return results;
}

/**
 * This method is used for checking email address passed as parameter.
 * @param email
 * @returns results
 */
function emailValidation (email) {
    var regex =/^(?=[a-zA-Z0-9_-]{1,64}(?!.*?\.\.)+(?!\@)+[a-zA-Z0-9!.#\/$%&'*+-=?^_`{|}~\S+-]{1,64})+[^\\@,;:"[\]()<>\s]{1,64}[^\\@.,;:"[\]\/()<>\s-]+@[^\\@!.,;:#$%&'*+=?^_`{|}()[\]~+<>"\s\-][a-zA-Z0-9\-\.]*[^\\@!,;:#$%&'*+=?^_`{|}()[\]~+<>"\s]*[\.]+(?!.*web|.*'')[a-zA-Z]{1,15}$/i;
    var results = regex.test(email);
    return results;
}

/**
 * This method is used for checking for Postal Code validation in the address passed as parameter.
 * @param address
 * @returns results
 */
function comparePostalCode(address) {

    // postal code validation for US
    var postalCodeRegex = /(^\d{5}$)|(^\d{9}$)|(^\d{5}-\d{4}$)|(^[abceghjklmnprstvxyABCEGHJKLMNPRSTVXY]{1}\d{1}[A-Za-z]{1} *\d{1}[A-Za-z]{1}\d{1}$)|(^[abceghjklmnprstvxyABCEGHJKLMNPRSTVXY]{1}\d{1}[A-Za-z]{1} *\d{1}[A-Za-z]{1}\d{1}$)/g;
    var result = !postalCodeRegex.test(address);
    if (result) {
        // postal code validation for UK
        postalCodeRegex = /(^([A-PR-UWYZ0-9][A-HK-Y0-9][AEHMNPRTVXY0-9]?[ABEHMNPRVWXY0-9]? {1,2}[0-9][ABD-HJLN-UW-Z]{2}|GIR 0AA)$)/g;
        result = !postalCodeRegex.test(address);
    }

    return result;
}

/**
 *	After Authorization Order Payment hook implementation for Apple pay
 * @param order
 * @param payment
 * @param custom
 * @param status
 * @returns status
 */
exports.afterAuthorization = function (order, payment, custom, status) {
    var isBillingPostalNotValid;
    var orderShippingAddress;
    var isShippingPostalNotValid;
    var orderNumber = order.orderNo;
    var paymentInstruments = order.getPaymentInstruments(
        PaymentInstrument.METHOD_DW_APPLE_PAY).toArray();
    var currentCountry = productCustomHelper.getCurrentCountry();
    if (!paymentInstruments.length) {
        hooksHelper(
            'app.fraud.detection.checkoutdenied',
            'checkoutDenied',
            orderNumber,
            paymentInstruments[0],
            require('*/cartridge/scripts/hooks/fraudDetectionHook').checkoutDenied);
        checkoutLogger.error('Unable to find Apple Pay payment instrument for order:' + order.orderNo);
        return new Status(Status.ERROR);
    }

    if (!empty(status) && status.isError()) {
        hooksHelper(
            'app.fraud.detection.checkoutdenied',
            'checkoutDenied',
            orderNumber,
            paymentInstruments[0],
            require('*/cartridge/scripts/hooks/fraudDetectionHook').checkoutDenied);
        checkoutLogger.error('Unable to authorze Apple Pay payment for order: ' + order.orderNo);
        return new Status(Status.ERROR);
    }

    if (order.custom.storePickUp) {
        session.custom.applePayCheckout = false;
    } else {
        session.custom.StorePickUp = false;
        if (currentCountry == Constants.US_COUNTRY_CODE) {
            session.custom.isEswShippingMethod = false;
        }
    }

    var transactionID = payment.getPaymentTransaction().getTransactionID();
    if (transactionID) {
        Transaction.wrap(function () {
            order.custom.Adyen_pspReference = transactionID;
        });
    }

    var addressError = new Status(Status.ERROR);
    var deliveryValidationFail = false;
    var countryCode = '';

    // loop of order shipments
    collections.forEach(order.getShipments(), function (shipment) {
        var address1 = shipment.getShippingAddress().getAddress1();
        var address2 = shipment.getShippingAddress().getAddress2();
        countryCode = shipment.getShippingAddress().getCountryCode().value;
        // Check for PO box validation and CountryCode
        if (comparePoBox(address1) || comparePoBox(address2) || !isAllowedCountryCode(countryCode)) {
            addressError.addDetail(ApplePayHookResult.STATUS_REASON_DETAIL_KEY, ApplePayHookResult.REASON_SHIPPING_ADDRESS);
            // order.addNote('Payment Authorization fails!', 'Delivery not allowed on PO Box');
            deliveryValidationFail = true;
        }
    });
    // copying the phone number from shipping address to billing Address
    if (order.billingAddress.phone == null) {
        order.billingAddress.phone = order.shipments[0].getShippingAddress().getPhone();
    }
    // copying the city from shipping address to billing address
    if (order.billingAddress.city == null) {
        order.billingAddress.city = order.shipments[0].getShippingAddress().getCity();
    }
    // copying the postal code from shipping address to billing address
    if (order.billingAddress.postalCode == null) {
        order.billingAddress.postalCode = order.shipments[0].getShippingAddress().getPostalCode();
    }

    // Country code Check for billing Address
    var billCountryCode = order.getBillingAddress().getCountryCode().value;
    if (!isAllowedCountryCode(billCountryCode) && !deliveryValidationFail) {
        addressError.addDetail(ApplePayHookResult.STATUS_REASON_DETAIL_KEY, ApplePayHookResult.REASON_BILLING_ADDRESS);
        deliveryValidationFail = true;
    }
    // State code Check for billing Address
    var billingStateCode = order.getBillingAddress().stateCode ? order.getBillingAddress().stateCode : '';

    try {
        isBillingPostalNotValid = comparePostalCode(order.billingAddress.postalCode);
        var billingAddressFirstName = !empty(order.billingAddress.firstName) ? order.billingAddress.firstName.trim() : '';
        var billingAddressLastName = !empty(order.billingAddress.lastName) ? order.billingAddress.lastName.trim() : '';
        var billingAddressAddress1 = !empty(order.billingAddress.address1) ? order.billingAddress.address1.trim() : '';
        var billingAddressCity = !empty(order.billingAddress.city) ? order.billingAddress.city.trim() : '';
        if (empty(billingAddressFirstName) || empty(billingAddressLastName) || empty(billingAddressAddress1) || isBillingPostalNotValid || empty(billingAddressCity)) {
            addressError.addDetail(ApplePayHookResult.STATUS_REASON_DETAIL_KEY, ApplePayHookResult.REASON_BILLING_ADDRESS);
            deliveryValidationFail = true;
            Logger.error('There is something missing or invalid in billing address for order: {0}', order.orderNo);
        }
        if (order.shipments.length) {
            orderShippingAddress = order.shipments[0].getShippingAddress();
            isShippingPostalNotValid = comparePostalCode(orderShippingAddress.postalCode);
            var shippingAddressFirstName = !empty(orderShippingAddress.firstName) ? orderShippingAddress.firstName.trim() : '';
            var shippingAddressLastName = !empty(orderShippingAddress.lastName) ? orderShippingAddress.lastName.trim() : '';
            var shippingAddressAddress1 = !empty(orderShippingAddress.address1) ? orderShippingAddress.address1.trim() : '';
            var shippingAddressCity = !empty(orderShippingAddress.city) ? orderShippingAddress.city.trim() : '';
            var shippingAddressStateCode = !empty(orderShippingAddress.stateCode) ? orderShippingAddress.stateCode.trim() : '';
            var shippingAddressCountryCode = !empty(orderShippingAddress.countryCode) ? orderShippingAddress.countryCode.value : '';
        }
        if (empty(shippingAddressFirstName) || empty(shippingAddressLastName) || empty(shippingAddressAddress1) || isShippingPostalNotValid || empty(shippingAddressCity)) {
            addressError.addDetail(ApplePayHookResult.STATUS_REASON_DETAIL_KEY, ApplePayHookResult.REASON_SHIPPING_ADDRESS);
            deliveryValidationFail = true;
            Logger.error('There is something missing or invalid in shipping address for order: {0}', order.orderNo);
        }

        if (shippingAddressStateCode) {
            var shippingFormServer = server.forms.getForm('shipping');
            var shippingFormServerStateCode = shippingFormServer.shippingAddress.addressFields.states.stateCode.options;
            var isValidStateCode = checkoutAddressHelper.isStateCodeAllowed(shippingFormServerStateCode, shippingAddressStateCode);

            if ((!empty(isValidStateCode) && !isValidStateCode) || (empty(isValidStateCode) && shippingAddressCountryCode == Constants.COUNTRY_US)) {
                addressError.addDetail(ApplePayHookResult.STATUS_REASON_DETAIL_KEY, ApplePayHookResult.REASON_SHIPPING_ADDRESS);
                deliveryValidationFail = true;
                Logger.error('Selected state is {0} which is restricted for order: {1}', shippingAddressStateCode, order.orderNo);
            }
        }

        if (billingStateCode) {
            var billingFormServer = server.forms.getForm('billing');
            var billingFormServerStateCode = billingFormServer.addressFields.states.stateCode.options;
            var isValidStateCode = checkoutAddressHelper.isStateCodeAllowed(billingFormServerStateCode, billingStateCode);

            if ((!empty(isValidStateCode) && !isValidStateCode) || (empty(isValidStateCode) && billCountryCode == Constants.COUNTRY_US)) {
                addressError.addDetail(ApplePayHookResult.STATUS_REASON_DETAIL_KEY, ApplePayHookResult.REASON_BILLING_ADDRESS);
                deliveryValidationFail = true;
                Logger.error('Selected state is {0} which is restricted for order: {1}', billingStateCode, order.orderNo);
            }
        }

        var email = order.customerEmail;
        if (!empty(email)) {
            var emailValidate = emailValidation(email);
            if (!emailValidate) {
                addressError.addDetail(ApplePayHookResult.STATUS_REASON_DETAIL_KEY, ApplePayHookResult.REASON_SHIPPING_CONTACT);
                deliveryValidationFail = true;
                Logger.error('Invalid email address for order {0}', order.orderNo);
            } else {
                var maskedEmail = checkoutCustomHelpers.maskEmail(email);
                checkoutLogger.info('(applePay.js) -> SubmitPayment: Step-2: Customer Email is ' + maskedEmail);
            }
        }
    } catch (e) {
        Logger.error('(applePay.js) --> Exception occured while try to validate shipping & billing address for orderID: {0} and exception is: {1}', order.orderNo, e);
    }

    var checkoutDecisionStatus = hooksHelper(
        'app.fraud.detection.create',
        'create',
        order.orderNo,
        order.paymentInstrument,
        require('*/cartridge/scripts/hooks/fraudDetectionHook').create);
    
    if (!deliveryValidationFail) {
        var RiskifiedOrderDescion = require('*/cartridge/scripts/riskified/RiskifiedOrderDescion');
        if (checkoutDecisionStatus.response && checkoutDecisionStatus.response.order.status === 'declined') {
            // Riskified order declined response from decide API
            riskifiedOrderDeclined = RiskifiedOrderDescion.orderDeclined(order);
            if (riskifiedOrderDeclined) {
                var riskifiedError = new Status(Status.ERROR);
                session.privacy.riskifiedDeclined = true;
                return riskifiedError;
            }
        } else if (checkoutDecisionStatus.response && checkoutDecisionStatus.response.order.status === 'approved') {
            // Riskified order approved response from decide API
            RiskifiedOrderDescion.orderApproved(order);
        }
    }
    
    if (deliveryValidationFail) {
        var sendMail = true; // send email is set to true
        var isJob = false; // isJob is set to false because in case of job this hook is never called
        var refundResponse = hooksHelper(
            'app.payment.adyen.refund',
            'refund',
            order,
            order.getTotalGrossPrice().value,
            sendMail,
            isJob,
            require('*/cartridge/scripts/hooks/payment/adyenCaptureRefundSVC').refund);
        Riskified.sendCancelOrder(order, Resource.msg('error.payment.not.valid', 'checkout', null));
        if (refundResponse.decision !== 'SUCCESS') {
            Logger.error('Ayden refund not processed : order failed due to PO BOX check : refundResponse.decision ' + refundResponse.decision);
        }
        return addressError;
    }
    var Order = OrderMgr.getOrder(order.orderNo);
    Transaction.wrap(function () {
        Order.setConfirmationStatus(Order.CONFIRMATION_STATUS_NOTCONFIRMED);
    });

    if ('SOMIntegrationEnabled' in Site.getCurrent().preferences.custom && Site.getCurrent().preferences.custom.SOMIntegrationEnabled) {
        // Salesforce Order Management attributes
        var populateOrderJSON = require('*/cartridge/scripts/jobs/populateOrderJSON');
        var somLog = require('dw/system/Logger').getLogger('SOM', 'CheckoutServices');
        try {
            Transaction.wrap(function () {
                populateOrderJSON.populateByOrder(Order);
            });
        } catch (exSOM) {
            somLog.error('SOM attribute process failed: ' + exSOM.message + ',exSOM: ' + JSON.stringify(exSOM));
        }
    }
    // End Salesforce Order Management

    var email = order.customerEmail;
    if (!empty(email)) {
        var maskedEmail = checkoutCustomHelpers.maskEmail(email);
        checkoutLogger.info('(applePay.js) -> PlaceOrder: Step-3: Customer Email is ' + maskedEmail);
    }

    // order.addNote('After Authorization for Payment completed','Proceed with completing the order');

    // remove personalization details from session once order is authorized and placed
    session.custom.appleProductId = '';
    session.custom.appleEngraveOptionId = '';
    session.custom.appleEmbossOptionId = '';
    session.custom.appleEmbossedMessage = '';
    session.custom.appleEngravedMessage = '';

    Transaction.wrap(function () {
        var currentSessionPaymentParams = CustomObjectMgr.getCustomObject('RiskifiedPaymentParams', session.custom.checkoutUUID);
        if (currentSessionPaymentParams) {
            CustomObjectMgr.remove(currentSessionPaymentParams);
        }
    });

    return status;
};

/**
 *	if order is failed and RiskDeclined true then based on session privacy check redirect to the checkout declined page
 * @param order
 * @param status
 * @returns status
 */
 exports.failOrder = function (order, status) {
    var URLUtils = require('dw/web/URLUtils');

    if (session.privacy.riskifiedDeclined) {
        delete session.privacy.riskifiedDeclined;
        return new ApplePayHookResult(new Status(Status.ERROR), URLUtils.url('Checkout-Declined', 'ID', order.orderNo));
    } else {
        return new Status(Status.OK);
    }
};

/**

/**
 *	prepareBasket hook implementation for Apple pay updating the  personalization data in Basket from PDP and Quickview
 * @param order
 * @param payment
 * @param custom
 * @param status
 * @returns status
 */
exports.prepareBasket = function (basket, parameters) {
    // get personalization data from session for PDP and Quickview

    var currentCountry = productCustomHelper.getCurrentCountry();

    if (!empty(parameters.sku)) {
        if (!basket.custom.storePickUp) {
            session.custom.StorePickUp = false;
            session.custom.applePayCheckout = true;
        } else {
            session.custom.applePayCheckout = true;
            session.custom.StorePickUp = false;
            if (currentCountry == Constants.US_COUNTRY_CODE) {
                session.custom.isEswShippingMethod = false;
            }
        }
    } else {
        if (!basket.custom.storePickUp) {
            session.custom.applePayCheckout = true;
            if (currentCountry == Constants.US_COUNTRY_CODE) {
                session.custom.isEswShippingMethod = false;
            }
        } else {
            session.custom.StorePickUp = true;
        }
    }

    if (parameters.sku && parameters.sku === session.custom.appleProductId) {
        var appleEngraveOptionId = session.custom.appleEngraveOptionId;
        var appleEmbossOptionId = session.custom.appleEmbossOptionId;
        var appleEmbossedMessage = session.custom.appleEmbossedMessage;
        var appleEngravedMessage = session.custom.appleEngravedMessage;
        var pulseIDPreviewURL = session.custom.pulseIDPreviewURL;

        updateOptionLineItem(basket, appleEmbossOptionId, appleEngraveOptionId, appleEmbossedMessage, appleEngravedMessage, pulseIDPreviewURL);
        // sample data for testing
        // updateOptionLineItem(basket, 'MovadoUS-3650057', 'MovadoUS-0607271', 'embossedMessage', 'engraved\nMessage');
    }
    var currentBasket = BasketMgr.getCurrentBasket();
    if (currentBasket && !empty(currentBasket.custom.smartGiftTrackingCode)) {
        session.custom.trackingCode = currentBasket.custom.smartGiftTrackingCode;
    }
    var status = new Status(Status.OK);
    var result = new ApplePayHookResult(status, null);
    return result;
};

/**
 * Code to populate personalization message in the ProductLineItem for Apple pay button from PDP and Quickview
 * @param lineItemCtnr : current basket
 * @param embossOptionID
 * @param engraveOptionID
 * @param embossedMessage
 * @param engravedMessage
 * @returns
 */
function updateOptionLineItem(lineItemCtnr, embossOptionID, engraveOptionID, embossedMessage, engravedMessage, pulseIDPreviewURL) {
    var basketCalculationHelpers = require('*/cartridge/scripts/helpers/basketCalculationHelpers');
    // since there will be only on Product from PDP/ Quick view
    var pli = lineItemCtnr.productLineItems[0];
    if (pli.optionProductLineItems) {
        Transaction.wrap(function () {
            collections.forEach(pli.optionProductLineItems, function (option) {
                if (option.optionID === EMBOSSED) {
                    if (embossOptionID) {
                        var optionModel = option.parent.optionModel;
                        var getOption = optionModel.getOption(EMBOSSED);
                        var optionValue = optionModel.getOptionValue(getOption, embossOptionID);
                        option.updateOptionValue(optionValue);
                        option.updateOptionPrice();
                        if (embossedMessage) {
                            pli.custom.embossMessageLine1 = embossedMessage;
                        }
                    }
                } else if (option.optionID === ENGRAVED) {
                    if (engraveOptionID) {
                        var optionModel = option.parent.optionModel;
                        var getOption = optionModel.getOption(ENGRAVED);
                        var optionValue = optionModel.getOptionValue(getOption, engraveOptionID);
                        option.updateOptionValue(optionValue);
                        option.updateOptionPrice();
                        if (engravedMessage) {
                            // code to split the message based on newline character
                            engravedMessage = engravedMessage.split(NEWLINE);
                            pli.custom.engraveMessageLine1 = engravedMessage[0];
                            if (engravedMessage[1]) {
                                pli.custom.engraveMessageLine2 = engravedMessage[1];
                            }
                        }
                    }
                } else if (option.optionID === PULSEID_ENGRAVING) { // PulseID Engraving
                    if (engraveOptionID) {
                        var optionModel = option.parent.optionModel;
                        var getOption = optionModel.getOption(PULSEID_ENGRAVING);
                        var optionValue = optionModel.getOptionValue(getOption, engraveOptionID);
                        option.updateOptionValue(optionValue);
                        option.updateOptionPrice();
                        if (engravedMessage) {
                            option.custom.pulseIDPreviewURL = pulseIDPreviewURL;
                            // code to split the message based on newline character
                            engravedMessage = engravedMessage.split(NEWLINE);
                            option.custom.engraveMessageLine1 = engravedMessage[0];
                            if (engravedMessage[1]) {
                                option.custom.engraveMessageLine2 = engravedMessage[1];
                            }
                        }
                    }
                }
            });
        }); // end of Trasaction
    }
}

exports.beforeAuthorization = function (order, payment, custom) {

    var Status = require('dw/system/Status');
    var orderLineItems = order.getAllProductLineItems();
    var orderLineItemsIterator = orderLineItems.iterator();
    var pulseIdEngraving = 'pulseIdEngraving';
    var productLineItem;
    var pulseIdConstants;
    /**~
     * Custom Start: Clyde Integration
     */

    var enablePulseIdEngraving = !empty(Site.current.preferences.custom.enablePulseIdEngraving) ? Site.current.preferences.custom.enablePulseIdEngraving : false;
    if (enablePulseIdEngraving) {
        pulseIdConstants = require('*/cartridge/scripts/utils/pulseIdConstants');
    }

    if (Site.current.preferences.custom.isClydeEnabled) {
        var addClydeContract = require('*/cartridge/scripts/clydeAddContracts.js');
        Transaction.wrap(function () {
            while (orderLineItemsIterator.hasNext()) {
                productLineItem = orderLineItemsIterator.next();
                if (productLineItem instanceof dw.order.ProductLineItem && productLineItem.optionID == Constants.CLYDE_WARRANTY && productLineItem.optionValueID == Constants.CLYDE_WARRANTY_OPTION_ID_NONE) {
                    order.removeProductLineItem(productLineItem);
                } else if ((productLineItem instanceof dw.order.ProductLineItem && pulseIdConstants && productLineItem.optionID == pulseIdConstants.PULSEID_SERVICE_ID.ENGRAVED_OPTION_PRODUCT_ID && productLineItem.optionValueID == pulseIdConstants.PULSEID_SERVICE_ID.ENGRAVED_OPTION_PRODUCT_VALUE_ID_NONE) || (!enablePulseIdEngraving && productLineItem.optionID == pulseIdEngraving)) {
                    order.removeProductLineItem(productLineItem);
                }
            }
            order.custom.isContainClydeContract = false;
            order.custom.clydeContractProductMapping = '';
        });
        addClydeContract.createOrderCustomAttr(order);
        //custom : PulseID engraving
        if (enablePulseIdEngraving) {
            var pulseIdAPIHelper = require('*/cartridge/scripts/helpers/pulseIdAPIHelper');
            pulseIdAPIHelper.setPulseJobID(order);
        }
        // custom end
    }
    /**
     * Custom: End
     */

     if (!Site.getCurrent().preferences.custom.isClydeEnabled) {
        var orderLineItems = order.getAllProductLineItems();
        var orderLineItemsIterator = orderLineItems.iterator();
        var productLineItem;
        Transaction.wrap(function () {
            while (orderLineItemsIterator.hasNext()) {
                productLineItem = orderLineItemsIterator.next();
                if (productLineItem instanceof dw.order.ProductLineItem && productLineItem.optionID == Constants.CLYDE_WARRANTY && productLineItem.optionValueID == Constants.CLYDE_WARRANTY_OPTION_ID_NONE) {
                    order.removeProductLineItem(productLineItem);
                }
            }
        });
    }

    var riskifiedCheckoutCreateResponse = RiskifiedService.sendCheckoutCreate(order);
    RiskifiedService.storePaymentDetails({
        avsResultCode: 'Y', // Street address and 5-digit ZIP code
        // both
        // match
        cvvResultCode: 'M', // CVV2 Match
        paymentMethod: 'Card'
    });

    if (riskifiedCheckoutCreateResponse && riskifiedCheckoutCreateResponse.error) {
        hooksHelper(
            'app.fraud.detection.checkoutdenied',
            'checkoutDenied',
            orderNumber,
            paymentInstrument,
            require('*/cartridge/scripts/hooks/fraudDetectionHook').checkoutDenied);
        Logger.error('Unable to find Apple Pay payment instrument for order.');
        checkoutLogger.error('(applePay) -> beforeAuthorization: Riskified checkout create call failed for order:' + order.orderNo);
        return new Status(Status.ERROR);
    }

    var email = order.customerEmail;
    if (!empty(email)) {
        var maskedEmail = checkoutCustomHelpers.maskEmail(email);
        checkoutLogger.info('(applePay.js) -> SubmitShipping: Step-1: Customer Email is ' + maskedEmail);
    }
    return new Status(Status.OK);
};

/**
 *  check for AllowedCountryCodes
 * @param countryCode
 * @returns
 */

function isAllowedCountryCode(countryCode) {
    var deliveryAllowedCountryCodes = Site.getCurrent().preferences.custom.deliveryAllowedCountryCodes;
    for (var i = 0; i < deliveryAllowedCountryCodes.length; i++) {
        if (countryCode && countryCode.equalsIgnoreCase(deliveryAllowedCountryCodes[i])) {
            return true;
        }
    }
    return false;
}