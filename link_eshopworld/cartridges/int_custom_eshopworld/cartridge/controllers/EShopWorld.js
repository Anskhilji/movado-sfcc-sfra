'use strict';
​
var server = require('server');
server.extend(module.superModule);
var eswCustomHelper = require('*/cartridge/scripts/helpers/eswCustomHelper');
var eswHelper = require('*/cartridge/scripts/helper/eswHelper').getEswHelper();
var constant = require('*/cartridge/scripts/helpers/constants');
var Logger = require('dw/system/Logger');
var OrderMgr = require('dw/order/OrderMgr');
var Site = require('dw/system/Site');
var Transaction = require('dw/system/Transaction');

function setInitialCookies(selectedLanguage) {
    var eswPreferedLocale = selectedLanguage.eswPreferedLocale;
        if (!empty(eswPreferedLocale)) {
            eswHelper.createCookie('esw.PreferedLocale', eswPreferedLocale, '/');
        }
}
​
server.append('GetEswHeader', function (req, res, next) {
    var allCountries = null;
    var customLanguages = null;
    var locale = request.getLocale();
    var languages = null;
    var selectedLanguage = null;
    var geoLocationCountry = null;
    var isGeoLocation = eswCustomHelper.isGeoLocationEnabled();
    var geoLocationCountryCode = request.geolocation.countryCode;
    var queryCountryCode = request.httpParameterMap.get('countryCode').value;

    if (isGeoLocation) {
        geoLocationCountry = eswCustomHelper.getCustomCountryByCountryCode(geoLocationCountryCode);
    }

    if (queryCountryCode) {
        queriedCountry = eswCustomHelper.getCustomCountryByCountryCode(queryCountryCode);
    }

    var customCountries = eswCustomHelper.getCustomCountries();
    locale = locale.split(constant.LANGUAGE_NAME_AND_COUNTRY_CODE_SEPARATOR);
    customLanguages = eswCustomHelper.getCustomLanguages();
    languages = eswCustomHelper.getAlphabeticallySortedLanguages(customLanguages);
    allCountries = eswCustomHelper.getAlphabeticallySortedCustomCountries(customCountries, locale[0]);

    if (isGeoLocation && !empty(geoLocationCountry) && empty(session.privacy.geoLocated)) {
        res.viewData.EswHeaderObject.selectedCountry = geoLocationCountry.countryCode;
        res.viewData.EswHeaderObject.selectedCountryName = geoLocationCountry.displayName;
        session.privacy.geoLocated = true;
    }

    if (queryCountryCode && !empty(queriedCountry)) {
        res.viewData.EswHeaderObject.selectedCountry = queriedCountry.countryCode;
        res.viewData.EswHeaderObject.selectedCountryName = queriedCountry.displayName;
    }
    selectedLanguage = eswCustomHelper.getSelectedLanguage(customLanguages, locale[0]);
    setInitialCookies(selectedLanguage);
    res.viewData.EswHeaderObject.languages = languages;
    res.viewData.EswHeaderObject.selectedLanguage = selectedLanguage;
    res.viewData.EswHeaderObject.allCountries = allCountries;
    return next();
});
​
server.append('GetEswFooter', function (req, res, next) {
    var allCountries = null;
    var customLanguages = null;
    var locale = request.getLocale();
    var languages = null;
    var selectedLanguage = null;
    var geoLocationCountry = null;
    var queriedCountry = null;
    var isGeoLocation = eswCustomHelper.isGeoLocationEnabled();
    var geoLocationCountryCode = request.geolocation.countryCode;
    var queryCountryCode = request.httpParameterMap.get('countryCode').value;

    if (isGeoLocation) {
        geoLocationCountry = eswCustomHelper.getCustomCountryByCountryCode(geoLocationCountryCode);
    }

    if (queryCountryCode) {
        queriedCountry = eswCustomHelper.getCustomCountryByCountryCode(queryCountryCode);
    }

    var customCountries = eswCustomHelper.getCustomCountries();
    locale = locale.split(constant.LANGUAGE_NAME_AND_COUNTRY_CODE_SEPARATOR);
    customLanguages = eswCustomHelper.getCustomLanguages();
    languages = eswCustomHelper.getAlphabeticallySortedLanguages(customLanguages);
    allCountries = eswCustomHelper.getAlphabeticallySortedCustomCountries(customCountries, locale[0]);

    if (isGeoLocation && !empty(geoLocationCountry) && empty(session.privacy.geoLocated)) {
        res.viewData.EswFooterObject.selectedCountry = geoLocationCountry.countryCode;
        res.viewData.EswFooterObject.selectedCountryName = geoLocationCountry.displayName;
        session.privacy.geoLocated = true;
    }

    if (queryCountryCode && !empty(queriedCountry)) {
        res.viewData.EswFooterObject.selectedCountry = queriedCountry.countryCode;
        res.viewData.EswFooterObject.selectedCountryName = queriedCountry.displayName;
    }
    // Custom Start: Adding Logic to show price for country selected via geolocation
    var availableCountry = eswHelper.getAvailableCountry();
    var currency = !empty(request.httpCookies['esw.currency']) ? request.httpCookies['esw.currency'].value : eswCustomHelper.getSelectedCountry(availableCountry).currencyCode;
    var isFixedPriceCountry = eswHelper.getFixedPriceModelCountries().filter(function (country) { 
        return country.value == availableCountry;
    });

    if (empty(isFixedPriceCountry) && !empty(currency)) {
        eswHelper.setAllAvailablePriceBooks();
        eswHelper.selectCountry(availableCountry, currency, req.locale.id);
    } else {
    ​    if (!empty(currency)) {
            eswHelper.setAllAvailablePriceBooks();
            eswHelper.setBaseCurrencyPriceBook(req, currency);
        }
    }
    // Custom End:
    selectedLanguage = eswCustomHelper.getSelectedLanguage(customLanguages, locale[0]);
    setInitialCookies(selectedLanguage);
    res.viewData.EswFooterObject.languages = languages;
    res.viewData.EswFooterObject.selectedLanguage = selectedLanguage;
    res.viewData.EswFooterObject.allCountries = allCountries;
    return next();
});
​
server.append('GetEswLandingPage', function (req, res, next) {
    var allCountries = null;
    var customLanguages = null;
    var locale = request.getLocale();
    var languages = null;
    var selectedLanguage = null;
​
    var customCountries = eswCustomHelper.getCustomCountries();
    locale = locale.split(constant.LANGUAGE_NAME_AND_COUNTRY_CODE_SEPARATOR);
    customLanguages = eswCustomHelper.getCustomLanguages();
    languages = eswCustomHelper.getAlphabeticallySortedLanguages(customLanguages);
    allCountries = eswCustomHelper.getAlphabeticallySortedCustomCountries(customCountries, locale[0]);
    // Custom Start: Adding Logic to show price for country selected via geolocation
    var availableCountry = eswHelper.getAvailableCountry();
    var currency = !empty(request.httpCookies['esw.currency']) ? request.httpCookies['esw.currency'].value : eswCustomHelper.getSelectedCountry(availableCountry).currencyCode;
    var isFixedPriceCountry = eswHelper.getFixedPriceModelCountries().filter(function (country) { 
        return country.value == availableCountry;
    });

    if (empty(isFixedPriceCountry) && !empty(currency)) {
        eswHelper.setAllAvailablePriceBooks();
        eswHelper.selectCountry(availableCountry, currency, req.locale.id);
    } else {
    ​    if (!empty(currency)) {
            eswHelper.setAllAvailablePriceBooks();
            eswHelper.setBaseCurrencyPriceBook(req, currency);
        }
    }
    // Custom End:
    selectedLanguage = eswCustomHelper.getSelectedLanguage(customLanguages, locale[0]);
    setInitialCookies(selectedLanguage);
    res.viewData.EswLandingObject.languages = languages;
    res.viewData.EswLandingObject.selectedLanguage = selectedLanguage;
    res.viewData.EswLandingObject.allCountries = allCountries;
    return next();
});

server.append('NotifyV2', function(req, res, next) {
    var obj = JSON.parse(req.body);
    Transaction.wrap(function () {
        var order = OrderMgr.getOrder(res.viewData.OrderNumber);
        for (var detail in obj.contactDetails) {
            if (obj.contactDetails[detail].contactDetailType.equalsIgnoreCase('IsDelivery')) {
                order.shipments[0].shippingAddress.stateCode = obj.contactDetails[detail].region;
            } else if (obj.contactDetails[detail].contactDetailType.equalsIgnoreCase('IsPayment')) {
                order.billingAddress.stateCode = obj.contactDetails[detail].region;
            }
        }
    });

    // Salesforce Order Management attributes
    if ('SOMIntegrationEnabled' in Site.getCurrent().preferences.custom && Site.getCurrent().preferences.custom.SOMIntegrationEnabled) {
        var populateOrderJSON = require('*/cartridge/scripts/jobs/populateOrderJSON');
        var somLog = require('dw/system/Logger').getLogger('SOM', 'CheckoutServices');
        try {
            var order = OrderMgr.getOrder(res.viewData.OrderNumber);
            Transaction.wrap(function () {
                populateOrderJSON.populateByOrder(order);
            }); 
        } catch (exSOM) {
            somLog.error('SOM attribute process failed: ' + exSOM.message + ',exSOM: ' + JSON.stringify(exSOM));
        }
    }
    // End Salesforce Order Management
    var deliveryCountryCode = obj.deliveryCountryIso;
    var isSwellAllowedCountry = require('*/cartridge/scripts/helpers/utilCustomHelpers').isSwellLoyaltyAllowedCountry(deliveryCountryCode);
    if (res.viewData.ResponseCode == '200' && Site.getCurrent().preferences.custom.yotpoSwellLoyaltyEnabled && isSwellAllowedCountry) {
        var SwellExporter = require('int_yotpo/cartridge/scripts/yotpo/swell/export/SwellExporter');
        SwellExporter.exportOrder({
            orderNo: res.viewData.OrderNumber,
            orderState: 'created'
        });
    }
    var emailOptIn = !empty(obj.shopperCheckoutExperience.emailMarketingOptIn) ? obj.shopperCheckoutExperience.emailMarketingOptIn : false;
    if (emailOptIn) {
        var SFMCApi = require('*/cartridge/scripts/api/SFMCApi');
        var billingCustomer = obj.contactDetails;
        var deliveryCountry = obj.deliveryCountryIso;
        var requestParams = {
            email: billingCustomer[0].email,
            country: deliveryCountry
        }
        if (!empty(requestParams) && !empty(requestParams.email)) {
            SFMCApi.sendSubscriberToSFMC(requestParams);
        }
    }
    return next();
});

module.exports = server.exports();
