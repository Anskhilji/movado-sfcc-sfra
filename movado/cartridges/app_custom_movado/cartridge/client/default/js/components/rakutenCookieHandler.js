'use strict';
var cookieHandler = require('../utilities/cookieHandler');
var intializeCookieInterval;
var cookieWriteInterval;

/**
 * Checks if cookie is present or not
 * @param {String} cookieName 
 * @returns {boolean}
 */
function isEmptyCookie(cookieName) {
    var cookie = cookieHandler.getCookie(cookieName);
    if (cookie != "") {
      return false;
    } else {
       return true;
    }
}

/**
 * Sets rmStoreGateway cookie if Optanon Consent cookie is present
 */
function setRakutenCookie() {
    if (!isEmptyCookie('OptanonConsent') && isEmptyCookie('rmStoreGateway')) {
        var optanonCookie = cookieHandler.getCookie("OptanonConsent");
        var isOptanonAllowedCookie = optanonCookie.indexOf(window.Resources.OPTANON_ALLOWED_COOKIE);
        if (isOptanonAllowedCookie != -1) {
            $.ajax({
                type: "GET",
                url: window.location.href,
                success: function () {
                }
            });
        }
        clearInterval(cookieWriteInterval);
    }
}

/**
 * Executes call to same page in order to set rakuten cookie
 */
function initializeRakutenCookieCall() {
    if (document.readyState == "complete") {
        clearInterval(intializeCookieInterval);
        if (window.Resources && window.Resources.IS_RAKUTEN_ENABLED && window.Resources.ONE_TRUST_COOKIE_ENABLED) {
            cookieWriteInterval = setInterval(setRakutenCookie, 500);
        }
    }
}

$(document).ready(function() {
    intializeCookieInterval = setInterval(initializeRakutenCookieCall, 500);
});
