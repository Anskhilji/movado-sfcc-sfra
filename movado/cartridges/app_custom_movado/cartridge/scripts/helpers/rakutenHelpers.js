"use strict";
var Calendar = require('dw/util/Calendar');
var Constants = require('~/cartridge/scripts/util/Constants');
var encoding = require('dw/crypto/Encoding');
var Site = require('dw/system/Site');
var Resource = require('dw/web/Resource');
var RakutenLogger = require('dw/system/Logger').getLogger('Rakuten');

var sitePreferences = Site.getCurrent().getPreferences().getCustom();

/**
 * This method is used to create cookie into the session.
 *
 * @param {dw.system.Request} request - request
 */
function createCookieInSession(request) {
    RakutenLogger.info('rakutenHelpers.js ~ createCookieInSession() -> Inside createCookiesInSession method.')
    var requestHttpParameterMap = request.getHttpParameterMap();
    if (!empty(requestHttpParameterMap) && !empty(requestHttpParameterMap.get('ranMID').value) && !empty(requestHttpParameterMap.get('ranSiteID').value) 
        && !empty(requestHttpParameterMap.get('ranEAID').value)) {
        RakutenLogger.info('rakutenHelpers.js ~ createCookieInSession() -> Inside if condition because current request contains rakuten parameters.')
        var ranMID = requestHttpParameterMap.get('ranMID').value;
        var ranSiteID = requestHttpParameterMap.get('ranSiteID').value;
        var calendar = Site.current.calendar;
        calendar.setTimeZone('GMT');
        var ald = getDateString(calendar, Constants.ALD_DATE_FORMAT);
        calendar.add(calendar.DAY_OF_MONTH, 30);
        var auld = Math.round(new Date().getTime() / 1000).toString();
        var rakutenCookieValuesFormat = Resource.msgf('rakuten.cookie', 'rakuten', null, ranMID, ald, auld, ranSiteID);
        var encodedValues = encoding.toURI(rakutenCookieValuesFormat);
        session.privacy.rakutenCookieValues = encodedValues;
        return;
    }
}

/**
 * This method is used to set the session cookie into response.
 *
 * @param {String} name - name of cookie.
 * @param {String} value - value of the cookie.
 * @param {String} path - path.
 * @returns {Object} newCookie - returned a new cookie.
 */
function setCookiesResponse(name, value, path) {
    RakutenLogger.info('rakutenHelpers.js ~ setCookiesResponse() -> Inside set cookies response method to set response.');
    var Cookie = require('dw/web/Cookie');
    var newCookie = new Cookie(name, value);
    newCookie.setPath(path);
    newCookie.setMaxAge(2592000);
    newCookie.setDomain('.' + request.httpHost);
    response.addHttpCookie(newCookie);
    return newCookie;
}

/**
 * This method is used to set the date into given format.
 *
 * @param {Date} date - current date.
 * @param {String} dateFormat - Format which is going to be set.
 * @returns {Date} formattedDate - returned date in the form of given format.
 */
function getDateString(date, dateFormat) {
    RakutenLogger.info('rakutenHelpers.js ~ getDateString() -> Inside getDateString method to set the date.');
    var StringUtils = require('dw/util/StringUtils');
    var formattedDate = StringUtils.formatCalendar(date, dateFormat);
    return formattedDate;
}

/**
 * This method is used to get the rakuten allowed countries from site preferences.
 *
 * @returns {boolean} booleal - returned true if there is any rakuten country available.
 */
function isRakutenAllowedCountry() {
    var Site = require('dw/system/Site');
    var rakutenAllowedCountries = !empty(Site.current.preferences.custom.rakutenAllowedCountries) ? Site.current.preferences.custom.rakutenAllowedCountries : '';
    var customerIPAddressLocation = (!empty(request.geolocation.countryCode) && request.geolocation.countryCode) ? request.geolocation.countryCode : '';

    if (!empty(rakutenAllowedCountries) && rakutenAllowedCountries) {
        if (rakutenAllowedCountries.length > 0) {
            var isIPAddressLocationMatched = false;
            for ( var i = 0; i < rakutenAllowedCountries.length; i++) {
                if (!empty(customerIPAddressLocation) && customerIPAddressLocation) {
                    if (customerIPAddressLocation == rakutenAllowedCountries[i]) {
                        isIPAddressLocationMatched = true;
                        RakutenLogger.info('rakutenHelpers.js ~ isRakutenAllowedCountry() -> Rakuten allowed countries contains value and country matching is {0}', isIPAddressLocationMatched);
                        break;
                    }
                }
            }
            return isIPAddressLocationMatched;
        }
    }
}

module.exports = {
    createCookieInSession: createCookieInSession,
    setCookiesResponse: setCookiesResponse,
    getDateString: getDateString,
    isRakutenAllowedCountry: isRakutenAllowedCountry
}