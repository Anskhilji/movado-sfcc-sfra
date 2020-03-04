/* eslint-disable */
'use strict';

var server = require('server');

/* API includes */
var URLUtils = require('dw/web/URLUtils');
var Site = require('dw/system/Site').getCurrent();
var logger = require('dw/system/Logger');
var Order = require('dw/order/Order');

/* Script Modules */
var eswHelper = require('*/cartridge/scripts/helper/eswHelper').getEswHelper();


/*
 * Function used to set initial cookies for country, currency and local.
 * this function will set cookies only if there is no cookie set for any variable
 */
function setInitialCookies(req) {
    var Cookie = require('dw/web/Cookie');
    var log = dw.system.Logger.getLogger("EswDebugLog");
    var allowedLanguages = eswHelper.getAllowedLanguages();
    var allowedCurrencies = eswHelper.getAllowedCurrencies();
    var allowedCountries = eswHelper.getAllowedCountries();
    var countryFromJson = eswHelper.getAllCountryFromCountryJson(eswHelper.getAvailableCountry());
    var currencyCode = (countryFromJson != null) ? countryFromJson.currencyCode : session.getCurrency();
    eswHelper.createCookie('esw.InternationalUser', true, '/');
    eswHelper.createCookie('esw.sessionid', customer.ID, '/');
    if (request.httpCookies['esw.location'] == null) {
        eswHelper.createCookie('esw.location', eswHelper.getAvailableCountry(), '/');
        session.privacy.countryCode = eswHelper.getAvailableCountry();
    }
    if (request.httpCookies['esw.currency'] == null) {
        eswHelper.createCookie('esw.currency', currencyCode, '/');
    }
    if (request.httpCookies['esw.LanguageIsoCode'] == null) {
        var locale = eswHelper.getAllCountryFromCountryJson(eswHelper.getAvailableCountry()).locales[0];
        eswHelper.createCookie('esw.LanguageIsoCode', locale, '/');
    }
    eswHelper.setCustomerCookies();
    var selectedFxRate = JSON.parse(session.privacy.fxRate);
    if (!selectedFxRate && selectedFxRate !== 'null') {

        var country = eswHelper.getAvailableCountry();
        if (eswHelper.checkIsEswAllowedCountry(country)) {
            if (!eswHelper.overridePrice(req, country)) {
                eswHelper.setBaseCurrencyPriceBook(req, eswHelper.getBaseCurrencyPreference());
            }
        }
        if (eswHelper.checkIsEswAllowedCountry(eswHelper.getAvailableCountry()) != null) {
            var locale = eswHelper.getLanguageFromCountryJson(eswHelper.getAvailableCountry()).locales;
            if (request.httpCookies['esw.currency'] == null) {
                eswHelper.selectCountry(eswHelper.getAvailableCountry(), currencyCode, locale[0]);
            } else {
                eswHelper.selectCountry(eswHelper.getAvailableCountry(), request.httpCookies['esw.currency'].value, locale[0]);
            }
        }
    }
}

/**
 * Get header bar of ESW and render template for it in response
 */
server.get('GetEswHeader', function (req, res, next) {
    setInitialCookies(req);
    var language = !empty(request.httpCookies['esw.LanguageIsoCode']) ? request.httpCookies['esw.LanguageIsoCode'].value : eswHelper.getAllCountryFromCountryJson(eswHelper.getAvailableCountry()).locales[0];
    var currency = !empty(request.httpCookies['esw.currency']) ? request.httpCookies['esw.currency'].value : eswHelper.getAllCountryFromCountryJson(eswHelper.getAvailableCountry()).currencyCode;
    var ESWHeaderObject = {
        'allCountries': eswHelper.getAllCountries(),
        'languages': eswHelper.getLanguagesOptions(),
        'enabledHeaderBar': eswHelper.getEnableHeaderBar(),
        'enabledESWModule': eswHelper.getEShopWorldModuleEnabled(),
        'enabledCountriesInHeader': eswHelper.getEnableCountryHeaderBar(),
        'enabledLanguagesInHeader': eswHelper.getEnableLanguageHeaderBar(),
        'selectedCountry': eswHelper.getAvailableCountry(),
        'selectedCountryName': eswHelper.getNameFromLocale(language),
        'selectedCurrency': currency,
        'selectedLanguage': language,
        'selectorUrl': URLUtils.https('Page-SetLocale').toString(),
        'currencies': eswHelper.getCurrenciesOptions(),
        'enabledCurrencyInHeader': eswHelper.getEnableCurrencyHeaderBar()
    }

    res.render('/EswMfComponents/headerCountrySelector', {
        'EswHeaderObject': ESWHeaderObject,
        'eswHelper': eswHelper
    });
    next();
});


/**
 * Get footer bar of ESW and render template for it in response
 */
server.get('GetEswFooter', function (req, res, next) {
    setInitialCookies(req);
    var language = !empty(request.httpCookies['esw.LanguageIsoCode']) ? request.httpCookies['esw.LanguageIsoCode'].value : eswHelper.getAllCountryFromCountryJson(eswHelper.getAvailableCountry()).locales[0];
    var currency = !empty(request.httpCookies['esw.currency']) ? request.httpCookies['esw.currency'].value : eswHelper.getAllCountryFromCountryJson(eswHelper.getAvailableCountry()).currencyCode;
    var ESWFooterObject = {
        'allCountries': eswHelper.getAllCountries(),
        'languages': eswHelper.getLanguagesOptions(),
        'enabledESWModule': eswHelper.getEShopWorldModuleEnabled(),
        'enabledFooterBar': eswHelper.getEnableFooterBar(),
        'enabledCountriesInFooter': eswHelper.getEnableCountryFooterBar(),
        'enabledLanguagesInFooter': eswHelper.getEnableLanguageFooterBar(),
        'selectedCountry': eswHelper.getAvailableCountry(),
        'selectedCountryName': eswHelper.getNameFromLocale(language),
        'selectedCurrency': currency,
        'selectorUrl': URLUtils.https('Page-SetLocale').toString(),
        'currencies': eswHelper.getCurrenciesOptions(),
        'enabledCurrencyInFooter': eswHelper.getEnableCurrencyFooterBar()
    }

    res.render('/EswMfComponents/eswFooterBar', {
        'EswFooterObject': ESWFooterObject
    });
    next();
});

/**
 * Get landing page of ESW and render template for it in response
 */
server.get('GetEswLandingPage', function (req, res, next) {
    if (request.httpCookies['esw.Landing.Played'] == null || request.httpCookies['esw.Landing.Played'] == false) {
        var Cookie = require('dw/web/Cookie');
        var eswLandingCookie = new Cookie('esw.Landing.Played', true);
        eswLandingCookie.setPath('/');
        response.addHttpCookie(eswLandingCookie);
        setInitialCookies(req);

        //var overridePricebooks = eswHelper.getOverridePriceBook();
        var language = !empty(request.httpCookies['esw.LanguageIsoCode']) ? request.httpCookies['esw.LanguageIsoCode'].value : eswHelper.getAllCountryFromCountryJson(eswHelper.getAvailableCountry()).locales[0];
        var currency = !empty(request.httpCookies['esw.currency']) ? request.httpCookies['esw.currency'].value : eswHelper.getAllCountryFromCountryJson(eswHelper.getAvailableCountry()).currencyCode;
        var ESWLandingObject = {
            'allCountries': eswHelper.getAllCountries(),
            'languages': eswHelper.getLanguagesOptions(),
            'enabledESWModule': eswHelper.getEShopWorldModuleEnabled(),
            'enabledLandingPageBar': eswHelper.getEnableLandingPageBar(),
            'enabledLandingPage': eswHelper.getEnableLandingPage(),
            'enabledCountriesInLandingPage': eswHelper.getEnableCountryLandingBar(),
            'enabledLanguagesInLandingPage': eswHelper.getEnableLanguageLandingBar(),
            'selectedCountry': eswHelper.getAvailableCountry(),
            'selectedCountryName': eswHelper.getNameFromLocale(language),
            'selectedCurrency': currency,
            'currencies': eswHelper.getCurrenciesOptions(),
            'enabledCurrencyInLandingPage': eswHelper.getEnableCurrencyLandingBar()
        }

        res.render('/EswMfComponents/eswLandingPage', {
            'EswLandingObject': ESWLandingObject
        });
    } else {
        return "";
    }
    next();
});

/**
 * Returns the converted price
 */
server.get('GetConvertedPrice', function (req, res, next) {
    var price = req.querystring.price;
    var isLowPrice = req.querystring.isLowPrice;
    var convertedPrice = eswHelper.getMoneyObject(price);
    res.render('eswPrice', {
        'price': convertedPrice,
        'isLowPrice': isLowPrice
    });
    next();
});

/*
 * Functions for both API versions and controller function to call pre-order request based on Active API Version
 */

/**
 * Handle Pre-Order V2. It prepares Pre-Order service request and calls it.
 */
function handlePreOrderRequestV2() {
    var eswCoreService = require('*/cartridge/scripts/services/EswCoreService').getEswServices(),
        preorderServiceObj = eswCoreService.getPreorderServiceV2(),
        oAuthObj = eswCoreService.getOAuthService(),
        eswServiceHelper = require('*/cartridge/scripts/helper/serviceHelper'),
        redirectPreference = eswHelper.getRedirect();
    if (redirectPreference.value !== 'Cart' && session.privacy.guestCheckout == null) {
        if (!customer.authenticated) {
            session.privacy.TargetLocation = URLUtils.https('EShopWorld-PreOrderRequest').toString();

            return {
                'status': 'REDIRECT'
            };
        }
    }
    var formData = {
        'grant_type': 'client_credentials',
        'scope': 'checkout.preorder.api.all'
    }
    formData.client_id = eswHelper.getClientID();
    formData.client_secret = eswHelper.getClientSecret();
    var oAuthResult = oAuthObj.call(formData);
    if (oAuthResult.status == 'ERROR' || empty(oAuthResult.object)) {
        logger.error('ESW Service Error: {0}', oAuthResult.errorMessage);
    }
    session.privacy.eswOAuthToken = JSON.parse(oAuthResult.object).access_token;

    var requestObj = eswServiceHelper.preparePreOrderV2();
    requestObj.retailerCartId = eswServiceHelper.createOrder();
    var result = preorderServiceObj.call(JSON.stringify(requestObj));
    return result;
}

/*
 * This is the preorder request which is generating at time of redirection from cart page to ESW checkout
 */
server.get('PreOrderRequest', function (req, res, next) {
    var result;
    var isAjax = Object.hasOwnProperty.call(request.httpHeaders, 'x-requested-with');
    try {

        result = handlePreOrderRequestV2();

        if (result.status == 'REDIRECT') {
            res.json({
                'redirectURL': URLUtils.https('Checkout-Login').toString()
            });
            return next();
        }
        if (result.status == 'ERROR' || empty(result.object)) {


            logger.error('ESW Service Error: {0}', result.errorMessage);
            session.privacy.eswfail = true;
            if (isAjax) {
                res.json({
                    'redirectURL': URLUtils.https('Cart-Show').toString()
                });
            } else {
                res.redirect(URLUtils.https('Cart-Show').toString());
            }
        } else {
            var redirectURL = JSON.parse(result.object).redirectUrl;
            delete session.privacy.guestCheckout;
            if (isAjax) {
                res.json({
                    'redirectURL': redirectURL
                });
            } else {
                res.redirect(redirectURL);
            }
        }
    } catch (e) {
        logger.error('ESW Service Error: {0} {1}', e.message, e.stack);
        session.privacy.eswfail = true;
        res.redirect(URLUtils.https('Cart-Show').toString());
    }
    next();
});

/*
 * Notify url will call from ESW to udpate Order configuration in SFCC side.
 */
server.post('NotifyV2', function (req, res, next) {
    var Transaction = require('dw/system/Transaction'),
        OrderMgr = require('dw/order/OrderMgr'),
        logger = require('dw/system/Logger'),
        responseJSON = {};
    if (eswHelper.getBasicAuthEnabled() && !request.httpHeaders.authorization.equals("Basic " + eswHelper.encodeBasicAuth())) {
        response.setStatus(401);
        logger.error('ESW Order Confirmation Error: Basic Authentication Token did not match');
    } else {
        var obj = JSON.parse(req.body);
        try {
            eswHelper.eswInfoLogger("Esw Order Confirmation V2 Request", JSON.stringify(obj));
            if (!eswHelper.overridePrice(req, obj.deliveryCountryIso, obj.shopperCurrencyPaymentAmount.substring(0, 3))) {
                eswHelper.setAllAvailablePriceBooks();
                eswHelper.setBaseCurrencyPriceBook(req, obj.shopperCurrencyPaymentAmount.substring(0, 3));
            }
            Transaction.wrap(function () {

                var order = OrderMgr.queryOrder("orderNo={0}", obj.retailerCartId);
                if (order && order.status.value == 0) {
                    if (order.status.value != 8) {
                        var eswServiceHelper = require('*/cartridge/scripts/helper/serviceHelper');
                        var appliedShipping = eswServiceHelper.applyShippingMethod(order, obj.deliveryOption.deliveryOption, obj.deliveryCountryIso, false);
                        if (appliedShipping == null) {
                            eswHelper.setBaseCurrencyPriceBook(req, Site.defaultCurrency);
                            var appliedShipping = eswServiceHelper.applyShippingMethod(order, obj.deliveryOption.deliveryOption);
                        }
                        var billingCustomer = obj.contactDetails.filter(function (details) {
                            return details.contactDetailType == 'IsPayment'
                        });
                        order.customerEmail = billingCustomer[0].email;
                        order.customerName = billingCustomer[0].firstName + ' ' + billingCustomer[0].lastName;

                        order.custom.eswShopperCurrencyDeliveryTaxes = new Number(obj.charges.shopperCurrencyDeliveryTaxes.substring(3));
                        order.custom.eswRetailerCurrencyDeliveryTaxes = new Number(obj.charges.retailerCurrencyDeliveryTaxes.substring(3));
                        order.custom.eswShopperCurrencyDeliveryDuty = new Number(obj.charges.shopperCurrencyDeliveryDuty.substring(3));
                        order.custom.eswRetailerCurrencyDeliveryDuty = new Number(obj.charges.retailerCurrencyDeliveryDuty.substring(3));
                        order.custom.eswShopperCurrencyDuty = new Number(obj.charges.shopperCurrencyDuty.substring(3));
                        order.custom.eswRetailerCurrencyDuty = new Number(obj.charges.retailerCurrencyDuty.substring(3));
                        order.custom.eswShopperCurrencyDelivery = new Number(obj.charges.shopperCurrencyDelivery.substring(3));
                        order.custom.eswRetailerCurrencyDelivery = new Number(obj.charges.retailerCurrencyDelivery.substring(3));
                        order.custom.eswShopperCurrencyTaxes = new Number(obj.charges.shopperCurrencyTaxes.substring(3));
                        order.custom.eswRetailerCurrencyTaxes = new Number(obj.charges.retailerCurrencyTaxes.substring(3));
                        order.custom.eswShopperCurrencyOtherTaxes = new Number(obj.charges.shopperCurrencyOtherTaxes.substring(3));
                        order.custom.eswRetailerCurrencyOtherTaxes = new Number(obj.charges.retailerCurrencyOtherTaxes.substring(3));
                        order.custom.eswShopperCurrencyAdministration = new Number(obj.charges.shopperCurrencyAdministration.substring(3));
                        order.custom.eswRetailerCurrencyAdministration = new Number(obj.charges.retailerCurrencyAdministration.substring(3));
                        order.custom.eswShopperCurrencyUplift = new Number(obj.charges.shopperCurrencyUplift.substring(3));
                        order.custom.eswRetailerCurrencyUplift = new Number(obj.charges.retailerCurrencyUplift.substring(3));
                        order.custom.eswRetailerCurrencyCode = eswHelper.getBaseCurrencyPreference();
                        order.custom.eswShopperCurrencyCode = obj.shopperCurrencyPaymentAmount.substring(0, 3);
                        order.custom.eswOrderNo = obj.eShopWorldOrderNumber;
                        order.custom.eswShopperCurrencyTotal = new Number(obj.charges.shopperCurrencyTotal.substring(3));
                        order.custom.eswRetailerCurrencyTotal = new Number(obj.charges.retailerCurrencyTotal.substring(3));
                        order.custom.eswShopperCurrencyPaymentAmount = new Number(obj.shopperCurrencyPaymentAmount.substring(3));
                        order.custom.eswRetailerCurrencyPaymentAmount = new Number(obj.retailerCurrencyPaymentAmount.substring(3));
                        order.custom.eswEmailMarketingOptIn = obj.shopperCheckoutExperience.emailMarketingOptIn;
                        order.custom.eswDeliveryOption = obj.deliveryOption.deliveryOption;

                        if ('shopperCurrencyDeliveryPriceInfo' in obj.deliveryOption) {
                            order.custom.eswShopperCurrencyDeliveryPriceInfo = new Number(obj.deliveryOption.shopperCurrencyDeliveryPriceInfo.price.substring(3));
                        } else {
                            order.custom.eswShopperCurrencyDeliveryPriceInfo = new Number(obj.charges.shopperCurrencyDelivery.substring(3)) + new Number(obj.charges.shopperCurrencyDeliveryDuty.substring(3)) + new Number(obj.charges.shopperCurrencyDeliveryTaxes.substring(3));
                        }
                        if ('retailerCurrencyDeliveryPriceInfo' in obj.deliveryOption) {
                            order.custom.eswRetailerCurrencyDeliveryPriceInfo = new Number(obj.deliveryOption.retailerCurrencyDeliveryPriceInfo.price.substring(3));
                        } else {
                            order.custom.eswRetailerCurrencyDeliveryPriceInfo = new Number(obj.charges.retailerCurrencyDelivery.substring(3)) + new Number(obj.charges.retailerCurrencyDeliveryDuty.substring(3)) + new Number(obj.charges.retailerCurrencyDeliveryTaxes.substring(3));
                        }

                        order.custom.eswPaymentMethod = (obj.paymentMethod && obj.paymentMethod != null) ? obj.paymentMethod : null;
                        order.custom.eswFraudHold = (obj.fraudHold && obj.fraudHold != null) ? obj.fraudHold : null;

                        if (obj.cartItems != null && obj.cartItems[0].product.productCode) {
                            var cartItem;
                            for (var lineItem in order.productLineItems) {
                                cartItem = obj.cartItems.filter(function (value) {
                                    if (value.product.productCode == order.productLineItems[lineItem].productID) {
                                        return value;
                                    }
                                });
                                order.productLineItems[lineItem].custom.eswShopperCurrencyItemPriceInfoBeforeDiscount = new Number(!empty(cartItem[0].product.shopperCurrencyProductPriceInfo.beforeDiscount) ? cartItem[0].product.shopperCurrencyProductPriceInfo.beforeDiscount.substring(3) : '');
                                order.productLineItems[lineItem].custom.eswRetailerCurrencyItemPriceInfoBeforeDiscount = new Number(!empty(cartItem[0].product.retailerCurrencyProductPriceInfo.beforeDiscount) ? cartItem[0].product.retailerCurrencyProductPriceInfo.beforeDiscount.substring(3) : '');

                                order.productLineItems[lineItem].custom.eswRetailerCurrencyItemAdministration = new Number(cartItem[0].retailerCurrencyItemAdministration.substring(3));
                                order.productLineItems[lineItem].custom.eswShopperCurrencyItemAdministration = new Number(cartItem[0].shopperCurrencyItemAdministration.substring(3));
                                order.productLineItems[lineItem].custom.eswRetailerCurrencyItemDuty = new Number(cartItem[0].retailerCurrencyItemDuty.substring(3));
                                order.productLineItems[lineItem].custom.eswShopperCurrencyItemDuty = new Number(cartItem[0].shopperCurrencyItemDuty.substring(3));
                                order.productLineItems[lineItem].custom.eswHSCode = cartItem[0].product.hsCode;
                                order.productLineItems[lineItem].custom.eswRetailerCurrencyItemOtherTaxes = new Number(cartItem[0].retailerCurrencyItemOtherTaxes.substring(3));
                                order.productLineItems[lineItem].custom.eswShopperCurrencyItemOtherTaxes = new Number(cartItem[0].shopperCurrencyItemOtherTaxes.substring(3));
                                order.productLineItems[lineItem].custom.eswRetailerCurrencyItemSubTotal = new Number(cartItem[0].retailerCurrencyItemSubTotal.substring(3));
                                order.productLineItems[lineItem].custom.eswRetailerCurrencyItemPriceInfo = new Number(cartItem[0].product.retailerCurrencyProductPriceInfo.price.substring(3));
                                order.productLineItems[lineItem].custom.eswShopperCurrencyItemSubTotal = new Number(cartItem[0].shopperCurrencyItemSubTotal.substring(3));
                                order.productLineItems[lineItem].custom.eswShopperCurrencyItemPriceInfo = new Number(cartItem[0].product.shopperCurrencyProductPriceInfo.price.substring(3));
                                order.productLineItems[lineItem].custom.eswRetailerCurrencyItemDelivery = new Number(cartItem[0].retailerCurrencyItemDelivery.substring(3));
                                order.productLineItems[lineItem].custom.eswShopperCurrencyItemDelivery = new Number(cartItem[0].shopperCurrencyItemDelivery.substring(3));
                                order.productLineItems[lineItem].custom.eswRetailerCurrencyItemDeliveryDuty = new Number(cartItem[0].retailerCurrencyItemDeliveryDuty.substring(3));
                                order.productLineItems[lineItem].custom.eswShopperCurrencyItemDeliveryDuty = new Number(cartItem[0].shopperCurrencyItemDeliveryDuty.substring(3));
                                order.productLineItems[lineItem].custom.eswRetailerCurrencyItemDeliveryTaxes = new Number(cartItem[0].retailerCurrencyItemDeliveryTaxes.substring(3));
                                order.productLineItems[lineItem].custom.eswShopperCurrencyItemDeliveryTaxes = new Number(cartItem[0].shopperCurrencyItemDeliveryTaxes.substring(3));
                                order.productLineItems[lineItem].custom.eswRetailerCurrencyItemUplift = new Number(cartItem[0].retailerCurrencyItemUplift.substring(3));
                                order.productLineItems[lineItem].custom.eswShopperCurrencyItemUplift = new Number(cartItem[0].shopperCurrencyItemUplift.substring(3));
                                order.productLineItems[lineItem].custom.eswRetailerCurrencyItemTaxes = new Number(cartItem[0].retailerCurrencyItemTaxes.substring(3));
                                order.productLineItems[lineItem].custom.eswShopperCurrencyItemTaxes = new Number(cartItem[0].shopperCurrencyItemTaxes.substring(3));
                            }
                        }

                        for (var detail in obj.contactDetails) {
                            if (obj.contactDetails[detail].contactDetailType.equalsIgnoreCase('IsDelivery')) {
                                order.shipments[0].shippingAddress.firstName = obj.contactDetails[detail].firstName;
                                order.shipments[0].shippingAddress.lastName = obj.contactDetails[detail].lastName;
                                order.shipments[0].shippingAddress.address1 = obj.contactDetails[detail].address1;
                                order.shipments[0].shippingAddress.address2 = obj.contactDetails[detail].address2;
                                order.shipments[0].shippingAddress.city = obj.contactDetails[detail].city;
                                order.shipments[0].shippingAddress.countryCode = obj.contactDetails[detail].country;
                                order.shipments[0].shippingAddress.postalCode = obj.contactDetails[detail].postalCode;
                                order.shipments[0].shippingAddress.phone = obj.contactDetails[detail].telephone;
                            } else if (obj.contactDetails[detail].contactDetailType.equalsIgnoreCase('IsPayment')) {
                                order.billingAddress.firstName = obj.contactDetails[detail].firstName;
                                order.billingAddress.lastName = obj.contactDetails[detail].lastName;
                                order.billingAddress.address1 = obj.contactDetails[detail].address1;
                                order.billingAddress.address2 = obj.contactDetails[detail].address2;
                                order.billingAddress.city = obj.contactDetails[detail].city;
                                order.billingAddress.countryCode = obj.contactDetails[detail].country;
                                order.billingAddress.postalCode = obj.contactDetails[detail].postalCode;
                                order.billingAddress.phone = obj.contactDetails[detail].telephone;
                            }
                        }

                        order.paymentInstruments[0].paymentTransaction.custom.eswPaymentAmount = new Number(obj.shopperCurrencyPaymentAmount.substring(3));
                        order.paymentInstruments[0].paymentTransaction.custom.eswPaymentMethodCardBrand = obj.paymentMethodCardBrand;

                        OrderMgr.placeOrder(order);
                        order.setConfirmationStatus(Order.CONFIRMATION_STATUS_CONFIRMED);
                        order.setExportStatus(Order.EXPORT_STATUS_READY);

                        responseJSON = {
                            "OrderNumber": obj.retailerCartId.toString(),
                            "EShopWorldOrderNumber": obj.eShopWorldOrderNumber.toString(),
                            "ResponseCode": "200",
                            "ResponseText": "Success"
                        }
                    } else {
                        response.setStatus(400);
                        if (!order) {
                            responseJSON = {
                                "OrderNumber": obj.retailerCartId.toString(),
                                "EShopWorldOrderNumber": obj.eShopWorldOrderNumber.toString(),
                                "ResponseCode": "400",
                                "ResponseText": "Order not found"
                            }
                        } else {
                            responseJSON = {
                                "OrderNumber": obj.retailerCartId.toString(),
                                "EShopWorldOrderNumber": obj.eShopWorldOrderNumber.toString(),
                                "ResponseCode": "400",
                                "ResponseText": "Order Failed"
                            }
                        }

                    }
                } else if (empty(order)) {
                    response.setStatus(400);
                    responseJSON = {
                        "OrderNumber": obj.retailerCartId.toString(),
                        "EShopWorldOrderNumber": obj.eShopWorldOrderNumber.toString(),
                        "ResponseCode": "400",
                        "ResponseText": "Order not found"
                    }
                } else {
                    response.setStatus(400);
                    responseJSON = {
                        "OrderNumber": obj.retailerCartId.toString(),
                        "EShopWorldOrderNumber": obj.eShopWorldOrderNumber.toString(),
                        "ResponseCode": "400",
                        "ResponseText": "Order already exists"
                    }
                }

            });
        } catch (e) {
            logger.error('ESW Service Error: {0}', e.message);
            response.setStatus(400);
            responseJSON = {
                "OrderNumber": obj.retailerCartId.toString(),
                "EShopWorldOrderNumber": obj.eShopWorldOrderNumber.toString(),
                "ResponseCode": "400",
                "ResponseText": "Error: Internal error"
            }
        }
        eswHelper.eswInfoLogger("Esw Order Confirmation V2 Response", JSON.stringify(responseJSON));
    }
    res.json(responseJSON);
    next();
});
/*
 * When user failed in checkout process this function will call to failed order. 
 */
server.get('Failure', function (req, res, next) {
    var eswServiceHelper = require('*/cartridge/scripts/helper/serviceHelper');
    eswServiceHelper.failOrder();
    res.redirect(URLUtils.https('Cart-Show', 'eswfail', true).toString());
    next();
});

module.exports = server.exports();