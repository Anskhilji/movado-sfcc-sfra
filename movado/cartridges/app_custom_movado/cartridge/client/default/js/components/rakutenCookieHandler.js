'use strict';
var cookieHandler = require('../utilities/cookieHandler');
var intervalHandler;
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
 * Executes call to same page in order to set rakuten cookie
 */
function initializeRakutenCookieCall() {
    if (document.readyState == "complete") {
        clearInterval(intervalHandler);
        cookieWriteAttempts++;
        if (window.Resources && window.Resources.IS_RAKUTEN_ENABLED && window.Resources.ONE_TRUST_COOKIE_ENABLED) {
            if (!isEmptyCookie('OptanonConsent') && isEmptyCookie('rmStoreGateway')) {
                $.ajax({
                    type: "GET",
                    url: window.location.href,
                    success: function () {
                    }
                });
            } else if (cookieWriteAttempts <= 3) {
                setTimeout(initializeRakutenCookieCall(), 500);
            }
        }
    }

}

$(document).ready(function() {
    intervalHandler = setInterval(initializeRakutenCookieCall, 500);
});
