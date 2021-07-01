"use strict";
var Calendar = require('dw/util/Calendar');
var Constants = require('*/cartridge/scripts/util/Constants');
var encoding = require('dw/crypto/Encoding');
var Site = require('dw/system/Site');
var Resource = require('dw/web/Resource');
var sitePreferences = require('dw/system/Site').getCurrent().getPreferences().getCustom();

function createCookieInSession(request) {
    var requestHttpParameterMap = request.getHttpParameterMap();
    if (!empty(requestHttpParameterMap) && !empty(requestHttpParameterMap.get('ranMID').value) && !empty(requestHttpParameterMap.get('ranSiteID').value)
        && !empty(requestHttpParameterMap.get('ranEAID').value)) {
        var ranMID = requestHttpParameterMap.get('ranMID').value;
        var ranEAID = requestHttpParameterMap.get('ranEAID').value;
        var ranSiteID = requestHttpParameterMap.get('ranSiteID').value;
        var calendar = Site.current.calendar;
        calendar.setTimeZone('GMT');
        var ald = getDateString(calendar, Constants.DATE_FORMAT);
        calendar.add(5, 30);
        var expiryDateFormat = getDateString(calendar, Constants.DATE_FORMAT);
        var auld = Math.floor(Date.now() / 1000);
        var rakutenCookieValuesFormat = Resource.msgf('rakuten.cookie', 'rakuten', ranMID, ald, auld, ranSiteID);
        var rakutenCookiesOptionalValues = Resource.msgf('rakuten.optional.cookie.values', 'rakuten',null, expiryDateFormat, (!empty(sitePreferences.rakutenDomainName) ? sitePreferences.rakutenDomainName : ''));
        var encodedValues = encoding.toURI(rakutenCookieValuesFormat) + rakutenCookiesOptionalValues;
        session.privacy.rakutenCookieValues = encodedValues;
        return;
    }
}

function setCookiesResponse(name, value, path) {
    var Cookie = require('dw/web/Cookie');
    var newCookie = new Cookie(name, value);
    newCookie.setPath(path);
    response.addHttpCookie(newCookie);
    return newCookie;
}

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