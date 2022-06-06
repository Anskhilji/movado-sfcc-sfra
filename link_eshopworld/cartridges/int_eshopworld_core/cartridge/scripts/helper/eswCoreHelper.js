/* eslint-disable quote-props */
/**
 * Helper script to get all ESW site preferences
 **/
 var Site = require('dw/system/Site').getCurrent();
 var formatMoney = require('dw/util/StringUtils').formatMoney;
 
 var Cookie = require('dw/web/Cookie');
 var Transaction = require('dw/system/Transaction');
 var logger = require('dw/system/Logger');
 
 var getEswHelper = {
     getAllCountries: function () {
         return Site.getCustomPreferenceValue('eswAllCountries');
     },
     getAllowedCountries: function () {
         return Site.getCustomPreferenceValue('eswAllowedCountries');
     },
     getAllowedCurrencies: function () {
         return Site.getCustomPreferenceValue('eswAllowedCurrencies');
     },
     getAllowedLanguages: function () {
         return Site.getCustomPreferenceValue('eswAllowedLanguages');
     },
     getBaseCurrency: function () {
         if (session.getCurrency().currencyCode !== Site.getCustomPreferenceValue('eswBaseCurrency').value) {
             return {
                 'value': session.getCurrency().currencyCode
             };
         }
         return Site.getCustomPreferenceValue('eswBaseCurrency');
     },
     getBaseCurrencyPreference: function () {
         return Site.getCustomPreferenceValue('eswBaseCurrency').value;
     },
     getBasicAuthEnabled: function () {
         return Site.getCustomPreferenceValue('eswBasicAuthEnabled');
     },
     getBasicAuthUser: function () {
         return Site.getCustomPreferenceValue('eswBasicAuthUser') || '';
     },
     getBasicAuthPassword: function () {
         return Site.getCustomPreferenceValue('eswBasicAuthPassword') || '';
     },
     getClientID: function () {
         return Site.getCustomPreferenceValue('eswClientID');
     },
     getClientSecret: function () {
         return Site.getCustomPreferenceValue('eswClientSecret');
     },
     getEnableCountryFooterBar: function () {
         return Site.getCustomPreferenceValue('eswEnableCountryFooterbar');
     },
     getEnableCountryHeaderBar: function () {
         return Site.getCustomPreferenceValue('eswEnableCountryHeaderbar');
     },
     getEnableCountryLandingBar: function () {
         return Site.getCustomPreferenceValue('eswEnableCountryLandingbar');
     },
     getEnableCurrencyFooterBar: function () {
         return Site.getCustomPreferenceValue('eswEnableCurrencyFooterbar');
     },
     getEnableCurrencyHeaderBar: function () {
         return Site.getCustomPreferenceValue('eswEnableCurrencyHeaderbar');
     },
     getEnableCurrencyLandingBar: function () {
         return Site.getCustomPreferenceValue('eswEnableCurrencyLandingbar');
     },
     getEnableFooterBar: function () {
         return Site.getCustomPreferenceValue('eswEnableFooterBar');
     },
     getEnableHeaderBar: function () {
         return Site.getCustomPreferenceValue('eswEnableHeaderPagebar');
     },
     getEnableLandingPage: function () {
         return Site.getCustomPreferenceValue('eswEnableLandingPage');
     },
     getEnableLandingPageBar: function () {
         return Site.getCustomPreferenceValue('eswEnableLandingpageBar');
     },
     getEnableLanguageFooterBar: function () {
         return Site.getCustomPreferenceValue('eswEnableLanguageFooterbar');
     },
     getEnableLanguageHeaderBar: function () {
         return Site.getCustomPreferenceValue('eswEnableLanguageHeaderbar');
     },
     getEnableLanguageLandingBar: function () {
         return Site.getCustomPreferenceValue('eswEnableLanguageLandingbar');
     },
     getEShopWorldModuleEnabled: function () {
         return Site.getCustomPreferenceValue('eswEshopworldModuleEnabled');
     },
     getFixedPriceModelCountries: function () {
         return Site.getCustomPreferenceValue('eswFixedEnabledCountries');
     },
     getMetadataItems: function () {
         return Site.getCustomPreferenceValue('eswMetadataItems');
     },
     getProductLineMetadataItemsPreference: function () {
         return Site.getCustomPreferenceValue('eswProductLineMetadataItems');
     },
     getOverridePriceBook: function () {
         return Site.getCustomPreferenceValue('eswOverridePriceBook');
     },
     getOverrideShipping: function () {
         return Site.getCustomPreferenceValue('eswOverrideShipping');
     },
     getFxRates: function () {
         return Site.getCustomPreferenceValue('eswFxRatesJson');
     },
     getCountryAdjustments: function () {
         return Site.getCustomPreferenceValue('eswCountryAdjustmentJson');
     },
     getDayOfLastAPICall: function () {
         return Site.getCustomPreferenceValue('eswDay');
     },
     getGeoLookup: function () {
         return Site.getCustomPreferenceValue('enableGeoLookup');
     },
     getUrlExpansionPairs: function () {
         return Site.getCustomPreferenceValue('eswUrlExpansionPairs');
     },
     getAdditionalExpansionPairs: function () {
         return Site.getCustomPreferenceValue('additionalExpansionPairs');
     },
     getRedirect: function () {
         return Site.getCustomPreferenceValue('eswRedirect');
     },
     getRoundingRules: function () {
         return Site.getCustomPreferenceValue('eswRounding');
     },
     getSelectedInstance: function () {
         return Site.getCustomPreferenceValue('eswInstance').value.toString();
     },
     getSelectedPriceFeedInstance: function () {
         return Site.getCustomPreferenceValue('eswPriceFeedInstance').value.toString();
     },
     getProductionClientSecret: function () {
         return Site.getCustomPreferenceValue('eswProductionClientSecret');
     },    
     getCheckoutServiceName: function () {
         return Site.getCustomPreferenceValue('eswCheckoutServiceName');
     },
     isUpdateOrderPaymentStatusToPaidAllowed: function () {
         return Site.getCustomPreferenceValue('eswUpdateOrderPaymentStatusToPaid');
     },
     isUseDeliveryContactDetailsForPaymentContactDetailsPrefEnabled: function () {
         return Site.getCustomPreferenceValue('eswUseDeliveryContactDetailsForPaymentContactDetails');
     },
     getLocalizedPricingCountries: function () {
         return Site.getCustomPreferenceValue('eswLocalizedPricingCountries');
     },
     /*
      * Function to get corresponding languages from countries.json
      */
     getLanguageFromCountryJson: function (country) {
         var countryJson = this.getAllCountryFromCountryJson(country);
         if (!empty(countryJson)) {
             return countryJson;
         }
         return countryJson;
     },
     /*
      * Function to set cookies when country, currency and language selectors are selected
      */
     selectCountry: function (country, currency, locale) {
         /* eslint-disable */
         var eswCurrency = this.createCookie('esw.currency', '', '/'),
             eswLanguageIsoCode = this.createCookie('esw.LanguageIsoCode', '', '/'),
             baseCurrency = this.getBaseCurrencyPreference();
         if (request.httpCookies['esw.location'] == null || request.httpCookies['esw.location'].value != country) {
             if (request.httpCookies['esw.location'] == null) {
                 var eswLocation = this.createCookie('esw.location', country, '/');
             } else {
                 var eswLocation = request.getHttpCookies()['esw.location'];
                 this.updateCookieValue(eswLocation, country);
             }
         }
 
         if (!this.getEnableCurrencyFooterBar() || !this.getEnableCurrencyHeaderBar() || !this.getEnableCurrencyLandingBar()) {
             var siteCountries = require('*/cartridge/countries');
             var foundCountry = siteCountries.filter(function (item) {
                 if (item.countryCode === country) {
                     currency = item.currencyCode;
                 }
             });
         }
 
         this.updateCookieValue(eswCurrency, currency);
         this.updateCookieValue(eswLanguageIsoCode, locale);
         delete session.privacy.fxRate;
         delete session.privacy.countryAdjustment;
         delete session.privacy.rounding;
         var fxRates = JSON.parse(this.getFxRates()),
             countryAdjustment = JSON.parse(this.getCountryAdjustments()),
             roundingModels = JSON.parse(this.getRoundingRules()),
             selectedFxRate = [],
             selectedCountryAdjustment = [],
             selectedRoundingRule = [];
 
         if (!empty(fxRates)) {
             selectedFxRate = fxRates.filter(function (rates) {
                 return rates.toShopperCurrencyIso == eswCurrency.value;
             });
         }
 
         if (!empty(countryAdjustment)) {
             selectedCountryAdjustment = countryAdjustment.filter(function (adjustment) {
                 return adjustment.deliveryCountryIso == country;
             });
         }
 
         if (!empty(roundingModels)) {
             selectedRoundingModel = roundingModels.filter(function (rule) {
                 return rule.deliveryCountryIso == country;
             });
 
             //Custom Start: Add defensive check for undefined error handing
             if (!empty(selectedRoundingModel)) {
                 selectedRoundingRule = selectedRoundingModel[0].roundingModels.filter(function (rule) {
                     return rule.currencyIso == eswCurrency.value;
                 });
             }
             //Custom End
         }
 
         if (empty(selectedFxRate) && eswCurrency.value == baseCurrency) {
             var baseCurrencyFxRate = {
                 'fromRetailerCurrencyIso': baseCurrency,
                 'rate': '1',
                 'toShopperCurrencyIso': baseCurrency
             };
             selectedFxRate.push(baseCurrencyFxRate);
         }
 
         if (empty(selectedFxRate)) {
             var currencyFxRate = {
                 'fromRetailerCurrencyIso': currency,
                 'rate': '1',
                 'toShopperCurrencyIso': currency
             };
             selectedFxRate.push(currencyFxRate);
         }
 
         session.privacy.fxRate = JSON.stringify(selectedFxRate[0]);
         session.privacy.countryAdjustment = !empty(selectedCountryAdjustment[0]) ? JSON.stringify(selectedCountryAdjustment[0]) : '';
         session.privacy.rounding = !empty(selectedRoundingRule[0]) ? JSON.stringify(selectedRoundingRule[0]) : '';
         this.setCustomerCookies();
     },
     /*
      * Function to get corresponding ESW Allowed Language
      */
     getLanguagesOptions: function () {
         var langObj = [],
             country = this.getAvailableCountry();
         var allowedMatchCountry = this.checkIsEswAllowedCountry(country);
         if (empty(allowedMatchCountry)) {
             var countryJson = this.getAllCountryFromCountryJson(country);
             if (!empty(countryJson)) {
                 for (var key in countryJson.name) {
                     langObj.push({
                         value: key,
                         displayValue: countryJson.name[key]
                     });
                 }
             } else {
                 langObj.push({
                     value: dw.system.Site.getCurrent().getDefaultLocale(),
                     displayValue: dw.system.Site.getCurrent().getDefaultLocale()
                 });
             }
 
             return langObj;
         } else {
             return this.getAllowedLanguages();
         }
         return;
     },
     /*
      * Function to set initial selected country from cookie or geolocation or preferences
      */
     getAvailableCountry: function () {
         //Custom Change: updated the getAvailableCountry logic with an addition of session country code condition
         if (!empty(session.privacy.countryCode)) {
             return session.privacy.countryCode;
         } else if (request.httpCookies['esw.location'] != null && request.httpCookies['esw.location'].value != '') {
             return request.getHttpCookies()['esw.location'].value;
         } else if (this.getGeoLookup()) {
             var geolocation = request.geolocation.countryCode;
             /**
              * Custom Start: Override geolocation if country or countryCode parameter is present in request
              */
             var requestHttpParameterMap = request.getHttpParameterMap();
             var country;
             var countryCode;
             if (!empty(requestHttpParameterMap) && !empty(requestHttpParameterMap.get('country'))) {
                 country = requestHttpParameterMap.get('country').value;
             }
 
             if (!empty(requestHttpParameterMap) && !empty(requestHttpParameterMap.get('countryCode'))) {
                 countryCode = requestHttpParameterMap.get('countryCode').value;
             }
             
             if (!empty(country) || !empty(countryCode)) { 
                 geolocation = !empty(country) ? country : countryCode;
             }
             /**
              * Custom End: 
              */ 
             var matchCountry = this.getAllCountries().filter(function (value) {
                 if (value.value == geolocation) {
                     return geolocation;
                 }
             });
             if (empty(matchCountry)) {
                 return this.getAllowedCountries()[0].value;
             }
             return geolocation;
         } else {
             return this.getAllowedCountries()[0].value;
         }
     },
     /*
      * Function to get corresponding currencies for selected country
      */
     getCurrenciesOptions: function () {
         var currencyObj = [],
             country = this.getAvailableCountry(),
             allowedMatchCountry = this.checkIsEswAllowedCountry(country);
 
         if (empty(allowedMatchCountry)) {
             var countryJson = this.getAllCountryFromCountryJson(country);
             if (!empty(countryJson)) {
                 currencyObj.push({
                     value: countryJson.currencyCode,
                     displayValue: countryJson.currencyCode
                 });
             } else {
                 currencyObj.push({
                     value: dw.system.Site.getCurrent().getDefaultCurrency(),
                     displayValue: dw.system.Site.getCurrent().getDefaultCurrency()
                 });
             }
             return currencyObj;
         }
         return this.getAllowedCurrencies();
     },
     /*
      * Function to perform fxrate calculations, apply adjustments, duty and tax and returns money object
      */
     getMoneyObject: function (price, noAdjustment, formatted, noRounding) {
         if (!this.getEShopWorldModuleEnabled()) {
             return price;
         }
         try {
             var baseCurrency = this.getBaseCurrencyPreference(),
                 // setting price to zero if it is null
                 billingPrice = (typeof price == 'object') ? new Number(price.value || 0) : new Number(price || 0),
                 selectedCountry = this.getAvailableCountry(),
                 selectedFxRate = !empty(session.privacy.fxRate) ? JSON.parse(session.privacy.fxRate) : false;
 
             // Checking if selected country is set as a fixed price country
             var isFixedPriceCountry = this.getFixedPriceModelCountries().filter(function (country) {
                 return country.value == selectedCountry;
             });
 
             // if fxRate is empty, return the price without applying any calculations
             if (!selectedFxRate || empty(selectedFxRate.toShopperCurrencyIso)) {
                 return (formatted == null) ? formatMoney(new dw.value.Money(billingPrice, session.getCurrency().currencyCode)) : new dw.value.Money(billingPrice, session.getCurrency().currencyCode);
             }
 
             //applying override price if override pricebook is set
             billingPrice = new Number(this.applyOverridePrice(billingPrice, selectedCountry));
             var selectedCountryAdjustment = !empty(session.privacy.countryAdjustment) ? JSON.parse(session.privacy.countryAdjustment) : '';
             // fixed price countries will not have adjustment, duty and taxes applied
             if (!noAdjustment) {
                 if (empty(isFixedPriceCountry) && selectedCountryAdjustment && !empty(selectedCountryAdjustment)) {
                     // applying adjustment
                     billingPrice += new Number((selectedCountryAdjustment.retailerAdjustments.priceUpliftPercentage / 100 * billingPrice));
                     // applying duty
                     billingPrice += new Number((selectedCountryAdjustment.estimatedRates.dutyPercentage / 100 * billingPrice));
                     // applying tax
                     billingPrice += new Number((selectedCountryAdjustment.estimatedRates.taxPercentage / 100 * billingPrice));
                 }
             }
             selectedFxRate = JSON.parse(session.privacy.fxRate);
             // applying FX rate if currency is not same as base currency
             if (selectedFxRate.toShopperCurrencyIso != baseCurrency) {
                 if (selectedFxRate && !empty(selectedFxRate)) {
                     billingPrice = new Number((billingPrice * selectedFxRate.rate).toFixed(2));
                 }
             }
             // applying the rounding model
             if (billingPrice > 0 && !noRounding && empty(isFixedPriceCountry)) {
                 billingPrice = this.applyRoundingModel(billingPrice, false);
             }
             billingPrice = new dw.value.Money(billingPrice, selectedFxRate.toShopperCurrencyIso);
             return (formatted == null) ? formatMoney(billingPrice) : billingPrice;
         } catch (e) { 
             logger.error('Error converting price {0} {1}', e.message, e.stack);
         }
     },
 
     applyRoundingMethod: function (price, model, roundingModel, isFractionalPart) {
         var roundingMethod = model.split(/(\d+)/)[0];
         var roundedPrice;
         if (roundingMethod.equalsIgnoreCase('none')) {
             if (isFractionalPart) {
                 return (price / 100) % 1;
             }
             return price;
         }
         var roundingTarget = model.split(/(\d+)/)[1];
         var rTLength = roundingTarget.length;
         if (isFractionalPart) {
             roundingTarget = rTLength == 1 ? roundingTarget + '0' : roundingTarget.substring(0, 2);
             rTLength = roundingTarget.length;
         }
         if (roundingMethod.equalsIgnoreCase('fixed')) {
             var otherPart = price % Math.pow(10, rTLength);
             var priceWithoutOtherPart = price - otherPart;
             // Logic for fixed rounding method.
             if (roundingModel.direction.equalsIgnoreCase('up')) {
                 roundedPrice = (roundingTarget < otherPart ? priceWithoutOtherPart + 1 * Math.pow(10, rTLength) : priceWithoutOtherPart) + new Number(roundingTarget);
             } else if (roundingModel.direction.equalsIgnoreCase('down')) {
                 roundedPrice = (roundingTarget > otherPart ? priceWithoutOtherPart - 1 * Math.pow(10, rTLength) : priceWithoutOtherPart) + new Number(roundingTarget);
                 roundedPrice = roundedPrice < 0 && !isFractionalPart ? price : roundedPrice;
             } else if (roundingModel.direction.equalsIgnoreCase('nearest')) {
                 var roundedUp = (roundingTarget < otherPart ? priceWithoutOtherPart + 1 * Math.pow(10, rTLength) : priceWithoutOtherPart) + new Number(roundingTarget);
                 var roundedDown = (roundingTarget > otherPart ? priceWithoutOtherPart - 1 * Math.pow(10, rTLength) : priceWithoutOtherPart) + new Number(roundingTarget);
                 roundedDown = roundedDown < 0 && !isFractionalPart ? price : roundedDown;
                 roundedPrice = Math.abs(roundedUp - price) >= Math.abs(price - roundedDown) ? roundedDown : roundedUp;
             }
         } else {
             // Logic for multiple rounding method.
             if (roundingModel.direction.equalsIgnoreCase('up')) {
                 roundedPrice = Math.ceil(price / roundingTarget) * roundingTarget;
             } else if (roundingModel.direction.equalsIgnoreCase('down')) {
                 roundedPrice = Math.floor(price / roundingTarget) * roundingTarget;
             } else if (roundingModel.direction.equalsIgnoreCase('nearest')) {
                 var roundedUp = Math.ceil(price / roundingTarget) * roundingTarget,
                     roundedDown = Math.floor(price / roundingTarget) * roundingTarget,
                 roundedPrice = Math.abs(roundedUp - price) >= Math.abs(price - roundedDown) ? roundedDown : roundedUp;
             }
         }
         if (isFractionalPart) {
             return roundedPrice / Math.pow(10, rTLength);
         }
         return roundedPrice;
     },
     /*
     * applies rounding model received from V3 price feed.
     */
     applyRoundingModel: function (price, roundingModel) {
         try {
             if (!roundingModel) {
                 roundingModel = !empty(session.privacy.rounding) ? JSON.parse(session.privacy.rounding) : false;
             }
             if (!roundingModel || empty(roundingModel) || price == 0) {
                 return price;
             }
 
             if (!empty(roundingModel)) {
                 var roundedWholeNumber = 0, roundedfractionalPart = 0, roundedPrice = 0;
                 price = price.toFixed(2);
 
                 var wholeNumber = parseInt(price);
                 var model = roundingModel.model.split('.')[0];
 
                 var fractionalPart = Math.round((price % 1) * 100);
                 var fractionalModel = roundingModel.model.split('.')[1];
 
                 // First, Apply rounding on the fractional part.
                 roundedFractionalPart = this.applyRoundingMethod(fractionalPart, fractionalModel, roundingModel, true);
 
                 // Update the whole number based on the fractional part rounding.
                 wholeNumber = parseInt(wholeNumber + roundedFractionalPart);
                 roundedFractionalPart = (wholeNumber + roundedFractionalPart) % 1;
 
                 // then, Apply rounding on the whole number.
                 roundedWholeNumber = this.applyRoundingMethod(wholeNumber, model, roundingModel, false);
 
                 roundedPrice = roundedWholeNumber + roundedFractionalPart;
 
                 return roundingModel.currencyExponent == 0 ? parseInt(roundedPrice) : roundedPrice.toFixed(roundingModel.currencyExponent);
             }
         } catch (e) {
             logger.error('Error applying rounding {0} {1}', e.message, e.stack);
             return price;
         }
         return price;
     },
     /*
     * This function is used to get shipping discount if it exist
     */
     getShippingDiscount: function (cart) {
         var totalDiscount = 0;
         var that = this;
         if (cart != null) {
             cart.defaultShipment.shippingPriceAdjustments.toArray().forEach(function (adjustment) {
                 totalDiscount += that.getMoneyObject(adjustment.price, true, false, true).value;
             });
         }
         if (totalDiscount < 0) {
             totalDiscount *= -1;
         }
         var currencyCode = '';
         if (!empty(request.httpCookies['esw.currency'] && !empty(request.httpCookies['esw.currency'].value))) {
             currencyCode = request.httpCookies['esw.currency'].value;
         }  else if (session.custom.currencyCode) {
             currencyCode = session.custom.currencyCode;
         }  else {
             currencyCode = session.currency.currencyCode;
         }
         return new dw.value.Money(totalDiscount, currencyCode);
     },
     /*
      * This function is used to get total of cart or productlineitems based on input
      */
     getSubtotalObject: function (cart, isCart, listPrice) {
         var total = 0;
         if (isCart) {
             for (var productLineItem in cart.productLineItems) {
                 total += this.getSubtotalObject(cart.productLineItems[productLineItem], false);
             }
             /*for (var item in cart.allProductLineItems) {
                 var price = (cart.allProductLineItems[item].adjustedPrice.value / cart.allProductLineItems[item].quantity);
                 var k = this.getMoneyObject(price,false,false).value;
                 total += this.getMoneyObject((price * cart.allProductLineItems[item].quantity),false,false).value;
             }
             */
         } else {
             total = this.getMoneyObject(cart.basePrice.value, false, false).value * cart.quantity.value;
             if (listPrice) {
                 var currencyCode = '';
                 if (!empty(request.httpCookies['esw.currency'] && !empty(request.httpCookies['esw.currency'].value))) {
                     currencyCode = request.httpCookies['esw.currency'].value;
                 }  else if (session.custom.currencyCode) {
                     currencyCode = session.custom.currencyCode;
                 }  else {
                     currencyCode = session.currency.currencyCode;
                 }
                 return new dw.value.Money(total, currencyCode);
             }
             var that = this;
             cart.priceAdjustments.toArray().forEach(function (adjustment) {
                 if (adjustment.appliedDiscount.type == dw.campaign.Discount.TYPE_AMOUNT) {
                     total -= adjustment.price.value * -1;
                 } else if (adjustment.appliedDiscount.type == dw.campaign.Discount.TYPE_FIXED_PRICE) {
                     total = adjustment.appliedDiscount.fixedPrice * adjustment.quantity;
                     if (adjustment.quantity < cart.quantity.value) {
                         total += (cart.quantity.value - adjustment.quantity) * that.getMoneyObject(cart.basePrice.value, false, false).value;
                     }
                 } else {
                     total -= that.getMoneyObject(adjustment.price, false, false).value * -1;
                 }
             });
             // var price = (cart.adjustedPrice.value / cart.quantity).toFixed(2);
             // total += this.getMoneyObject(cart.getAdjustedPrice(false).value,false,false).value;
         }
         var currencyCode = '';
         if (!empty(request.httpCookies['esw.currency']) && !empty(request.httpCookies['esw.currency'].value)) {
             currencyCode = request.httpCookies['esw.currency'].value;
         } else if (session.custom.currencyCode) {
             currencyCode = session.custom.currencyCode;
         } else {
             currencyCode = session.currency.currencyCode;
         }
 
         return new dw.value.Money(total, currencyCode);
     },
     /*
      * This function is used to get order discount if it exist
      */
     getOrderDiscount: function (cart) {
         // var orderSubtotal = this.getSubtotalObject(cart, true).value;
         var totalDiscount = 0;
         var that = this;
         if (cart != null) {
             cart.priceAdjustments.toArray().forEach(function (adjustment) {
                 if (adjustment.appliedDiscount.type == dw.campaign.Discount.TYPE_AMOUNT) {
                     totalDiscount += adjustment.price.value;
                 } else {
                     totalDiscount += that.getMoneyObject(adjustment.price, false, false, true).value;
                 }
             });
         }
         if (totalDiscount < 0) {
             totalDiscount *= -1;
         }
 
         // Custom Start: Add defensive code for currency
         var currencyCode = '';
         if (!empty(request.httpCookies['esw.currency']) && !empty(request.httpCookies['esw.currency'].value)) {
             currencyCode = request.httpCookies['esw.currency'].value;
         }  else if (session.custom.currencyCode) {
             currencyCode = session.custom.currencyCode;
         }  else if ('originalOrder' in cart) {
             currencyCode = cart.originalOrder.custom.eswShopperCurrencyCode ? cart.originalOrder.custom.eswShopperCurrencyCode : cart.originalOrder.currencyCode;
         }  else {
             currencyCode = session.currency.currencyCode;
         }
         // Custom End
 
         return new dw.value.Money(totalDiscount, currencyCode);
         /*
         if(cart.couponLineItems.length > 0) {
             for (var item in cart.couponLineItems) {
                 if(!empty(cart.couponLineItems[item].priceAdjustments) && cart.couponLineItems[item].priceAdjustments[0].appliedDiscount.type == 'AMOUNT'){
                     couponDiscount += cart.couponLineItems[item].priceAdjustments[0].appliedDiscount.amount;
                 }
             }
         }
         if(couponDiscount > 0){
             proratedDiscount = (couponDiscount / (cart.allProductLineItems.length - cart.bonusLineItems.length));
         }
         for (var item in cart.allProductLineItems) {
             if (cart.allProductLineItems[item].bonusProductLineItem) continue;
 
             //defines that product is not discounted
             if(cart.allProductLineItems[item].adjustedPrice.value == cart.allProductLineItems[item].proratedPrice.value) continue;
             var discount = ((cart.allProductLineItems[item].getAdjustedPrice(false).value - cart.allProductLineItems[item].getAdjustedPrice(true).value));
             discount = discount.toFixed(2);
             if(proratedDiscount > 0){
                 var qtyCouponDiscount = new Number((proratedDiscount).toFixed(2));
                 var tempDiscount = new Number((discount - qtyCouponDiscount).toFixed(2));
                 totalDiscount += ((tempDiscount + qtyCouponDiscount));
                 //totalDiscount = totalDiscount;
             }else{
                 totalDiscount += new Number(discount);
 
                 //totalDiscount = this.getMoneyObject(totalDiscount,false,false).value;
             }
         }
         return new dw.value.Money(this.getMoneyObject(totalDiscount, false, false).value, JSON.parse(session.privacy.fxRate).toShopperCurrencyIso);
         */
     },
     /*
      * This function is used to get Order total excluding order level discount
      */
     getFinalOrderTotalsObject: function () {
         var BasketMgr = require('dw/order/BasketMgr');
         var currencyCode = '';
         if (!empty(request.httpCookies['esw.currency'] && !empty(request.httpCookies['esw.currency'].value))) {
             currencyCode = request.httpCookies['esw.currency'].value;
         }  else if (session.custom.currencyCode) {
             currencyCode = session.custom.currencyCode;
         }  else {
             currencyCode = session.currency.currencyCode;
         }
         return new dw.value.Money(this.getSubtotalObject(BasketMgr.currentBasket, true).value - (this.getOrderDiscount(BasketMgr.currentBasket).value), currencyCode);
 
     },
     /*
      * Function that can be used to create cookies
      */
     createCookie: function (name, value, path) {
         var newCookie = new Cookie(name, value);
         newCookie.setPath(path);
         response.addHttpCookie(newCookie);
         return newCookie;
     },
     /*
      * Function to update value of cookies
      */
     updateCookieValue: function (changeCookie, value) {
         changeCookie.setValue(value);
         changeCookie.setPath('/');
         response.addHttpCookie(changeCookie);
     },
     /*
      * Function to check whether selected country is ESW Allowed Country
      */
     checkIsEswAllowedCountry: function (selectedCountry) {
         var isAllowed = this.getAllowedCountries().filter(function (value) {
             if (value.value == selectedCountry) {
                 return true;
             }
         });
         return (!empty(isAllowed)) ? isAllowed : null;
     },
     /*
      * Function that is used to set the pricebook and update session currency
      */
     setBaseCurrencyPriceBook: function (currencyCode) {
         var Currency = require('dw/util/Currency'),
             Cart = require('*/cartridge/scripts/models/CartModel'),
             currency = Currency.getCurrency(currencyCode);
         Transaction.wrap(function () {
             session.setCurrency(currency);
             var currentCart = Cart.get();
             if (currentCart) {
                 currentCart.updateCurrency();
                 currentCart.calculate();
             }
         });
     },
     /*
      * Function to check if selected Country is in countries.json
      */
     getAllCountryFromCountryJson: function (selectedCountry) {
         var siteCountries = require('*/cartridge/countries'),
             allowedCountries = siteCountries.filter(function (country) {
                 if (country.countryCode === selectedCountry) {
                     return country;
                 }
             });
         return (!empty(allowedCountries)) ? allowedCountries[0] : null;
     },
     /*
      * Get Name of country according to locale in countries.json
      */
 
     shortenName: function (name) {
         if (name.length > 15) {
             return name.slice(0, 12) + '...';
         }
         return name;
     },
     /*
      * This function is used to get locale name
      */
     getNameFromLocale: function (language) {
         //This variable is not exist in this method thats why i declared it.
         var eswHelper = this;
         var localeCountry = this.getAllCountryFromCountryJson(this.getAvailableCountry());
         var cookieCountry = this.getAvailableCountry();
         var allESWCountryName = this.getAllCountries().filter(function (value) {
             if (value.value == cookieCountry) {
                 return value.value;
             }
         });
         if (localeCountry != null) {
             var locale = localeCountry.name[language];
             if (locale != null) {
                 return this.shortenName(locale);
             }
             return this.shortenName(this.getAllCountryFromCountryJson(eswHelper.getAvailableCountry()).name['en_GB']);
         }
         var shortName = !empty(allESWCountryName[0]) ? allESWCountryName[0].displayValue : '';
         return this.shortenName(shortName);
     },
     /*
      * Function to apply pricebook if country is override country
      */
     overridePrice: function (selectedCountry) {
         var PriceBookMgr = require('dw/catalog/PriceBookMgr'),
             arrPricebooks = new Array(),
             overrideCountry = null,
             overridePricebooks = this.getOverridePriceBook();
 
         if (overridePricebooks != null) {
             overrideCountry = JSON.parse(overridePricebooks).filter(function (item) {
                 return item.countryCode == selectedCountry;
             });
         }
 
         if (!empty(overrideCountry) && overrideCountry[0].priceBooks != null) {
             overrideCountry[0].priceBooks.map(function (pricebookId) {
                 arrPricebooks.push(PriceBookMgr.getPriceBook(pricebookId));
             });
             try {
                 PriceBookMgr.setApplicablePriceBooks(arrPricebooks);
             } catch (e) {
                 logger.error(e.message + e.stack);
             }
 
             if (overrideCountry[0].currencyCode != null && overrideCountry[0].currencyCode !== this.getBaseCurrency()) {
                 this.setBaseCurrencyPriceBook(overrideCountry[0].currencyCode);
             }
             return true;
         }
         return false;
     },
     /*
      * Function to calculate amount when country is override country
      */
     applyOverridePrice: function (billingAmount, selectedCountry) {
         var overrideCountry = JSON.parse(this.getOverridePriceBook()).filter(function (item) {
             return item.countryCode == selectedCountry;
         });
         if (empty(overrideCountry)) {
             return billingAmount;
         }
         if (overrideCountry[0].currencyCode != null && overrideCountry[0].currencyCode !== this.getBaseCurrencyPreference()) {
             var fxRates = JSON.parse(this.getFxRates());
             var selectedFxRate = [];
 
             if (!empty(fxRates)) {
                 selectedFxRate = fxRates.filter(function (rates) {
                     return rates.toShopperCurrencyIso == overrideCountry[0].currencyCode;
                 });
             }
 
             if (empty(fxRates) || empty(selectedFxRate)) {
                 var currencyFxRate = {
                     'fromRetailerCurrencyIso': this.getBaseCurrencyPreference(),
                     'rate': '1',
                     'toShopperCurrencyIso': session.getCurrency().currencyCode
                 };
                 selectedFxRate.push(currencyFxRate);
             }
 
             billingAmount = billingAmount / selectedFxRate[0].rate;
         }
         return new Number(billingAmount);
     },
     /*
      * Function to apply adjustments to price
      */
     applyAdjustment: function (billingAmount, country) {
         var countryAdjustment = JSON.parse(this.getCountryAdjustments()),
             selectedCountryAdjustment = countryAdjustment.filter(function (adjustment) {
                 return adjustment.countryIso == country;
             });
 
         billingAmount = billingAmount + (selectedCountryAdjustment[0].retailerAdjustments.percentage * billingAmount);
         return new Number(billingAmount);
     },
     /*
      * Function to set all applicable price books
      */
     setAllAvailablePriceBooks: function () {
         var PriceBookMgr = require('dw/catalog/PriceBookMgr'),
             allPriceBooks = PriceBookMgr.getSitePriceBooks();
         PriceBookMgr.setApplicablePriceBooks(allPriceBooks.toArray());
     },
     /*
      * Function to set cookies for customer data
      */
     setCustomerCookies: function () {
         var eswHelper = this;
         if (request.httpCookies['esw.sessionid'] == null) {
             eswHelper.createCookie('esw.sessionid', customer.ID, '/');
         } else {
             eswHelper.updateCookieValue(request.httpCookies['esw.sessionid'], customer.ID);
         }
         var isInternational = this.checkIsEswAllowedCountry(eswHelper.getAvailableCountry());
         var cookieValue = (!empty(isInternational)) ? true : false;
         if (request.httpCookies['esw.InternationalUser'] == null) {
             eswHelper.createCookie('esw.InternationalUser', cookieValue, '/');
         } else {
             eswHelper.updateCookieValue(request.httpCookies['esw.InternationalUser'], cookieValue);
         }
     },
     /*
      * Function to check shipping service type
      */
     getShippingServiceType: function (cart) {
         var ShippingMgr = require('dw/order/ShippingMgr');
         var country = this.getAvailableCountry();
         var countryFound = JSON.parse(this.getOverrideShipping()).filter(function (item) {
             if (item.countryCode == country) {
                 return item;
             }
         });
         if (countryFound[0] != null) {
             var shippingMethodIDsOfCountry = countryFound[0].shippingMethod.ID;
             if (shippingMethodIDsOfCountry.length > 0) {
                 var applicableShippingMethodsOnCart = ShippingMgr.getShipmentShippingModel(cart.shipments[0]).applicableShippingMethods.toArray();
                 var shippingservice = applicableShippingMethodsOnCart.filter(function (ship) {
                     if (shippingMethodIDsOfCountry[0] == ship.ID) {
                         return ship;
                     }
                 });
                 if (shippingservice[0] != null && shippingservice[0].displayName == 'POST') {
                     return 'POST';
                 }
             }
         }
         return 'EXP2';
     },
     /*
      * Function to set url locale
      */
     getRedirectUrl: function (url, selectedLocale) {
         var URLUtils = require('dw/web/URLUtils');
         var Site = require('dw/system/Site').getCurrent();
         var locale = this.getLanguageFromCountryJson(this.getAvailableCountry()).locales[0];
         if (selectedLocale && !empty(selectedLocale)) {
             locale = selectedLocale;
         }
         var pipeline = url.split('/');
 
         var node = pipeline[pipeline.length - 1].split('?');
         var redirect = URLUtils.url(new dw.web.URLAction(node[0], Site.getCurrent().ID, locale)).toString();
         return (node.length > 1) ? redirect + '?' + node[1] : redirect;
     },
     /*
      * Function to check whether a redirecturl is set
      */
     checkRedirect: function () {
         var localeCountry = this.getLanguageFromCountryJson(this.getAvailableCountry());
         var locale = (localeCountry != null) ? localeCountry.locales[0] : request.httpCookies['esw.LanguageIsoCode'].value;
 
         if (request.getLocale() !== locale) {
             return this.getCurrent(locale);
         }
         return null;
     },
     /*
      * Function that returns the previous clickStream pipeline
      */
     getCurrent: function getCurrent(locale) {
         var URLAction = require('dw/web/URLAction');
         var URLParameter = require('dw/web/URLParameter');
         var URLUtils = require('dw/web/URLUtils');
 
         var currentAction = session.clickStream.last.pipelineName;
         var siteId = Site.getID();
         if (!locale) {
             locale = 'default';
         }
         var urlAction = new URLAction(currentAction, siteId, locale);
         var args = [urlAction];
         var parameterMap = request.httpParameterMap;
 
         for (var p in parameterMap) {
             if (parameterMap.hasOwnProperty(p)) {
                 if (p === 'lang') {
                     continue;
                 }
                 args.push(new URLParameter(p, parameterMap[p]));
             }
         }
 
         return request.httpProtocol + '://' +
             request.httpHost +
             URLUtils.url.apply(null, args);
     },
     /*
      * Function to log information
      */
     eswInfoLogger: function (type, params) {
         var log = dw.system.Logger.getLogger('EShopWorldInfo', 'EswInfoLog');
         log.info(type + ':' + params);
     },
     /*
      * Function to encode base authentication user and password
      */
     encodeBasicAuth: function () {
         var StringUtils = require('dw/util/StringUtils'),
             user = this.getBasicAuthUser(),
             password = this.getBasicAuthPassword(),
             concatenatedString = user.concat(':').concat(password);
         return StringUtils.encodeBase64(concatenatedString);
     },
     getUnitPriceCost: function (lineItem) {
         var currencyCode = '';
         if (!empty(request.httpCookies['esw.currency'] && !empty(request.httpCookies['esw.currency'].value))) {
             currencyCode = request.httpCookies['esw.currency'].value;
         }  else if (session.custom.currencyCode) {
             currencyCode = session.custom.currencyCode;
         }  else {
             currencyCode = session.currency.currencyCode;
         }
         return new dw.value.Money((this.getSubtotalObject(lineItem, false).value / lineItem.quantity.value), currencyCode);
     },
     /**
      * Check if it is esw supported country or not,
      * @return {Boolean} - true/ false
      */
     isESWSupportedCountry: function () {
         if (this.checkIsEswAllowedCountry(this.getAvailableCountry())) {
             return true;
         }
         return false;
     },
     /** 
      * Returns current esw currency code,
      * stored in esw currency cookie
      * @return {String} - Currency code
      */
     getCurrentEswCurrencyCode: function () {
         return request.httpCookies['esw.currency'].value;
     },
     /**
     * Merges properties from source object to target object
     * @param {Object} target object
     * @param {Object} source object
     * @returns {Object} target object
     */
     extendObject: function (target, source) {
         Object.keys(source).forEach(function (prop) {
             target[prop] = source[prop];
         });
         return target;
     }
 
 };
 
 module.exports = {
     getEswHelper: getEswHelper
 };