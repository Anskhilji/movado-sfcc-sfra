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
        MINI_CART_HEADER_MESSAGE: Resource.msg('title.your.shopping.cart','cart',null),
        CART_EMPTY_MESSAGE: Resource.msg('info.cart.empty.msg', 'cart', null),
        CONTINUE_SHOPPING: Resource.msg('link.continue.shopping', 'cart', null),
        FOOTER_POPUP_DATE_OF_BIRTHDAY_DAY: Resource.msg('newsletter.form.input.day.placeholder', 'newsLetter', null),
        KLARNA_SLICE_IT_PAYMENT_METHOD_BRAND_CODE: Resource.msg('checkout.payment.method.klarna.slice.it.brand.code', 'checkout', null),
        KLARNA_SLICE_IT_PAYMENT_METHOD_TEXT: Resource.msg('checkout.payment.method.klarna.slice.it.text', 'checkout', null),
        KLARNA_PAY_LATER_PAYMENT_METHOD_BRAND_CODE: Resource.msg('checkout.payment.method.klarna.pay.later.brand.code', 'checkout', null),
        KLARNA_PAY_LATER_PAYMENT_METHOD_TEXT: Resource.msg('checkout.payment.method.klarna.pay.later.text', 'checkout', null),
        PAYPAL_PAYMENT_METHOD_BRAND_CODE: Resource.msg('checkout.payment.method.paypal.brand.code', 'checkout', null),
        PAYPAL_PAYMENT_METHOD_TEXT: Resource.msg('checkout.payment.method.paypal.text', 'checkout', null),
        ADYEN_PAYMENT_METHOD_ID: Resource.msg('checkout.payment.method.adyen', 'checkout', null),
        EMAIL_POPUP_SERVER_ERROR_MSG: Resource.msg('email.popUp.server.error', 'common', null),
        COOKIE_EXPIRY_TIME_WELCOME_MAT: Site.getCurrent().getCustomPreferenceValue('cookieExpiryTimeInDays'),
        CURRENT_SITE_ID : Site.getCurrent().getID(),
        OBUK_SITE_ID: Resource.msg('info.obuk.site.id', 'common', null),
        OBUS_SITE_ID: Resource.msg('info.obus.site.id', 'common', null),
        MVMT_EMAIL_SIGNUP_SUCCESS: Resource.msg('newsletter.signup.success', 'common', null),
        MVMT_EMAIL_SIGNUP_GENERAL_FAILURE: Resource.msg('newsletter.signup.general.failure', 'common', null),
        MVMT_EMAIL_SIGNUP_EMPTY_EMAIL: Resource.msg('newsletter.signup.empty.email', 'common', null),
        MVMT_EMAIL_EMAIL_ERROR_INVALID: Resource.msg('newsletter.email.error.invalid', 'common', null),
        OUT_OF_STOCK_LABEL: Resource.msg('label.out.of.stock', 'common', null),
        ADD_TO_CART_LABEL: Resource.msg('label.add.to.cart', 'common', null),
        YOTPO_REVIEW_COUNT: Site.getCurrent().getCustomPreferenceValue('yotpoReviewsCount')
    };
    return resources;
}

module.exports = {
    getResources: getResources
};
