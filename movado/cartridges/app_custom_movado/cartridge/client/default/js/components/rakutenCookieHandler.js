'use strict';
var cookieHandler = require('../utilities/cookieHandler');
var intializeCookieInterval;
var cookieWriteInterval;
var cookieWriteAttempts = 0;

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
    console.info('rakutenCookieHandler.js ~ setRakutenCookie() -> Inside method to set rakuten cookie');
    if (!isEmptyCookie('OptanonConsent') && isEmptyCookie('rmStoreGateway')) {
        console.info('rakutenCookieHandler.js ~ setRakutenCookie() -> Optanon cookies is found and there is no Rakuten cookie');
        cookieWriteAttempts++;
        var optanonCookie = cookieHandler.getCookie("OptanonConsent");
        var isOptanonAllowedCookie = optanonCookie.indexOf(window.Resources.OPTANON_ALLOWED_COOKIE);
        if (isOptanonAllowedCookie != -1) {
            console.info('rakutenCookieHandler.js ~ setRakutenCookie() -> Targeting cookie is allowed and going to make an Ajax call on:' + window.Resources.CALL_RAKUTEN_CONTROLLER);
            $.ajax({
                type: "GET",
                url: window.Resources.CALL_RAKUTEN_CONTROLLER,
                success: function () {
                    clearInterval(cookieWriteInterval);
                }
            });
            console.info('rakutenCookieHandler.js ~ setRakutenCookie() -> Ajax call was successful to following URL: ' + window.Resources.CALL_RAKUTEN_CONTROLLER);
        }

        if (cookieWriteAttempts == 10) {
            clearInterval(cookieWriteInterval);
        }
    }
}

/**
 * Executes call to same page in order to set rakuten cookie
 */
function initializeRakutenCookieCall() {
    console.info('rakutenCookieHandler.js ~ initializeRakutenCookieCall() -> Inside rakuten cookies call method.');
    if (document.readyState == "complete") {
        console.info('rakutenCookieHandler.js ~ initializeRakutenCookieCall -> Page is in the completed state and inside if condition.');
        clearInterval(intializeCookieInterval);
        if (window.Resources && window.Resources.IS_RAKUTEN_ENABLED && window.Resources.ONE_TRUST_COOKIE_ENABLED) {
            console.info('rakutenCookieHandler.js ~ initializeRakutenCookieCall -> Inside if condition because Rakuten and OneTrust is enabled.');
            cookieWriteInterval = setInterval(setRakutenCookie, 500);
        }
    }
}

$(document).ready(function() {
    intializeCookieInterval = setInterval(initializeRakutenCookieCall, 500);
});
