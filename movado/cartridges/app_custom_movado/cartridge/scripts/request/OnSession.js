'use strict';
var WELCOMEMAT = 'welcomeMat';
/**
 * The onSession hook is called for every new session in a site. This hook can be used for initializations,
 * like to prepare promotions or pricebooks based on source codes or affiliate information in
 * the initial URL. For performance reasons the hook function should be kept short.
 *
 * @module  request/OnSession
 */

var Status = require('dw/system/Status');
/**
 * checks if redirection has happened
 * @return {Boolean}
 */
function checkRedirect() {
    var Site = require('dw/system/Site');
    var Cookie = require('dw/web/Cookie');
    var Locale = require('dw/util/Locale');
    var cookies = request.getHttpCookies();
    for (var i = 0; i < cookies.cookieCount; i++) {
        var cookie = cookies[i];
        if (cookie.name && cookie.name === WELCOMEMAT) {
            var welcomeMatCookie = new Cookie(WELCOMEMAT, false);
            welcomeMatCookie.setMaxAge(0);
            response.addHttpCookie(welcomeMatCookie);
            return false;
        }
    }
    var localeRedirect = Site.current.getCustomPreferenceValue('showWelcomeMat');
    if (localeRedirect && request.geolocation && request.geolocation.countryCode !== Locale.getLocale(request.locale).country) {
        return true;
    }
    return false;
}

function checkStorePickUpSelected() {
    var BasketMgr = require('dw/order/BasketMgr');
    var currentBasket = BasketMgr.getCurrentBasket();
    var isStorePickUp = false;
    if (currentBasket && currentBasket.custom.storePickUp) {
        isStorePickUp = true;
    }
    return isStorePickUp;

}

/**
 * The onSession hook function.
 */
exports.onSession = function () {
    session.custom.welcomeMat = checkRedirect();
    session.custom.pickupFromStore = checkStorePickUpSelected();
    return new Status(Status.OK);
};
