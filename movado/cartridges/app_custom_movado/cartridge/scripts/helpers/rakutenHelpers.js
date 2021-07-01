"use strict";
var Calendar = require('dw/util/Calendar');
var Constants = require('*/cartridge/scripts/util/Constants');
var encoding = require('dw/crypto/Encoding');
var Site = require('dw/system/Site');
var Resource = require('dw/web/Resource');
var sitePreferences = Site.getCurrent().getPreferences().getCustom();

/**
 * This method is used to create cookie into the session.
 *
 * @param {dw.system.Request} request - request
 */
function createCookieInSession(request) {
    var requestHttpParameterMap = request.getHttpParameterMap();
    if (!empty(requestHttpParameterMap) && !empty(requestHttpParameterMap.get('ranMID').value) && !empty(requestHttpParameterMap.get('ranSiteID').value)
        && !empty(requestHttpParameterMap.get('ranEAID').value)) {
        var ranMID = requestHttpParameterMap.get('ranMID').value;
        var ranEAID = requestHttpParameterMap.get('ranEAID').value;
        var ranSiteID = requestHttpParameterMap.get('ranSiteID').value;
        var calendar = Site.current.calendar;
        calendar.setTimeZone('GMT');
        var ald = getDateString(calendar, Constants.ALD_DARE_FORMAT);
        calendar.add(calendar.DAY_OF_MONTH, 30);
        var expiryDateFormat = getDateString(calendar, Constants.DATE_FORMAT);
        var auld = Math.round(new Date().getTime() / 1000).toString();
        var rakutenCookieValuesFormat = Resource.msgf('rakuten.cookie', 'rakuten', null, ranMID, ald, auld, ranSiteID);
        var rakutenCookiesOptionalValues = Resource.msgf('rakuten.optional.cookie.values', 'rakuten',null, expiryDateFormat, (!empty(sitePreferences.rakutenDomainName) ? sitePreferences.rakutenDomainName : ''));
        var encodedValues = encoding.toURI(rakutenCookieValuesFormat) + rakutenCookiesOptionalValues;
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
    var Cookie = require('dw/web/Cookie');
    var newCookie = new Cookie(name, value);
    newCookie.setPath(path);
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
    var StringUtils = require('dw/util/StringUtils');
    var formattedDate = StringUtils.formatCalendar(date, dateFormat);
    return formattedDate;
}
module.exports = {
    createCookieInSession: createCookieInSession,
    setCookiesResponse: setCookiesResponse,
    getDateString: getDateString
}