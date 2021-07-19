'use strict';

/**
 * Resource helper
 *
 */

/**
 * Get the client-side resources of a given page
 * @param {string} pageContext : The page context which need to be render
 * @returns {Object} resources : An objects key key-value pairs holding the resources
 */
function getResources(pageContext) {
    var Resource = require('dw/web/Resource');
    var Site = require('dw/system/Site');

    var resources = {
        KLARNA_SLICE_IT_PAYMENT_METHOD_BRAND_CODE: Resource.msg('checkout.payment.method.klarna.slice.it.brand.code', 'checkout', null),
        KLARNA_SLICE_IT_PAYMENT_METHOD_TEXT: Resource.msg('checkout.payment.method.klarna.slice.it.text', 'checkout', null),
        KLARNA_PAY_LATER_PAYMENT_METHOD_BRAND_CODE: Resource.msg('checkout.payment.method.klarna.pay.later.brand.code', 'checkout', null),
        KLARNA_PAY_LATER_PAYMENT_METHOD_TEXT: Resource.msg('checkout.payment.method.klarna.pay.later.text', 'checkout', null),
        PAYPAL_PAYMENT_METHOD_BRAND_CODE: Resource.msg('checkout.payment.method.paypal.brand.code', 'checkout', null),
        PAYPAL_PAYMENT_METHOD_TEXT: Resource.msg('checkout.payment.method.paypal.text', 'checkout', null),
        ADYEN_PAYMENT_METHOD_ID: Resource.msg('checkout.payment.method.adyen', 'checkout', null),
        EMAIL_POPUP_SERVER_ERROR_MSG: Resource.msg('email.popUp.server.error', 'common', null),
        COOKIE_EXPIRY_TIME_WELCOME_MAT: Site.getCurrent().getCustomPreferenceValue('cookieExpiryTimeInDays'),
        AFFIRM_PAYMENT_METHOD_STATUS: Site.getCurrent().getCustomPreferenceValue('AffirmOnline'),
        CURRENT_SITE_ID : Site.getCurrent().getID(),
        OBUK_SITE_ID: Resource.msg('info.obuk.site.id', 'common', null),
        OBUS_SITE_ID: Resource.msg('info.obus.site.id', 'common', null),
        INVALID_EMAIL_ERROR: Resource.msg('newsletter.email.error.invalid', 'common', null),
        EMAIL_SUBSCRIPTION_SUCCESS: Resource.msg('newsletter.signup.success', 'common', null),
        LINK_QUICKVIEW_VIEWDETAILS: Resource.msg('link.quickview.viewdetails', 'product', null),
        LINK_QUICKVIEW_CLOSE: Resource.msg('link.quickview.close', 'product', null),
        CREDIT_CARD_PAYMENT_METHOD_ID: Resource.msg('checkout.payment.method.credit.card.id', 'checkout', null),
        KLARNA_PDP_MESSAGES_ENABLED: !empty(Site.current.preferences.custom.klarnaPdpPromoMsg) ? Site.current.preferences.custom.klarnaPdpPromoMsg : false,
        IS_RAKUTEN_ENABLED:  Site.current.preferences.custom.isRakutenEnable || false,
        ONE_TRUST_COOKIE_ENABLED: Site.current.preferences.custom.oneTrustCookieEnabled || false,
        CART_GIFT_MESSAGE_LIMIT: !empty(Site.current.preferences.custom.cartGiftMessageLimit) ? Site.current.preferences.custom.cartGiftMessageLimit : 0
    };
    return resources;
}

module.exports = {
    getResources: getResources
};
