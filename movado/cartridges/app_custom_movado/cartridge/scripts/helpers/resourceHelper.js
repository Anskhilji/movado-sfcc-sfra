'use strict';
var Constants = require('*/cartridge/scripts/util/Constants');
var rakutenCookiesHelper = require('*/cartridge/scripts/helpers/rakutenHelpers');

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
    var ContentMgr = require('dw/content/ContentMgr');
    var Resource = require('dw/web/Resource');
    var Site = require('dw/system/Site');
    var URLUtils = require('dw/web/URLUtils');
    var ArrayList = require('dw/util/ArrayList');
    var currentBasket = require('dw/order/BasketMgr').getCurrentBasket();

    var autoComplete = new ArrayList(Site.current.preferences.custom.autoCompleteAllowedCountries).toArray();
    var allowedCountryCodes = new ArrayList(Site.current.preferences.custom.googlePayShippingAllowedCountryCodes).toArray();
    var fedexAddressNoRecommendation =  ContentMgr.getContent('checkout-address-validation-no-recommendation');
    fedexAddressNoRecommendation = fedexAddressNoRecommendation && fedexAddressNoRecommendation.custom.body ? fedexAddressNoRecommendation.custom.body.source : '';
    var giftMessageCartError = ContentMgr.getContent('ca-gift-message-cart-error');
    giftMessageCartError = giftMessageCartError && giftMessageCartError.custom.body ? giftMessageCartError.custom.body.source : '';

    var isPickUpFromStore;
    if (currentBasket) {
        isPickUpFromStore = currentBasket.custom.storePickUp === true ? true : false;
    }
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
        ESW_COUPON_VALIDATION_EMAIL_REQUIRE: Resource.msg('esw.guest.email.required', 'account', null),
        EMAIL_SUBSCRIPTION_SUCCESS: Resource.msg('newsletter.signup.success', 'common', null),
        EMAIL_SUBSCRIPTION_THANK_YOU: Resource.msg('newsletter.signup.thank.you', 'common', null),
        LINK_QUICKVIEW_VIEWDETAILS: Resource.msg('link.quickview.viewdetails', 'product', null),
        LINK_QUICKVIEW_CLOSE: Resource.msg('link.quickview.close', 'product', null),
        CREDIT_CARD_PAYMENT_METHOD_ID: Resource.msg('checkout.payment.method.credit.card.id', 'checkout', null),
        COUPON_LINE_ITEM_LENGTH: Resource.msg('coupon.applied.counter','cart', null),
        KLARNA_PDP_MESSAGES_ENABLED:!empty(Site.current.preferences.custom.klarnaPdpPromoMsg) ? Site.current.preferences.custom.klarnaPdpPromoMsg : false,
        CART_GIFT_MESSAGE_LIMIT: !empty(Site.current.preferences.custom.cartGiftMessageLimit) ? Site.current.preferences.custom.cartGiftMessageLimit : 0,
        PICKUP_FROM_STORE: isPickUpFromStore || false,
        BOPIS_STORE_FETCHING_ERROR: Resource.msg('store.pickup.search.result.error', 'storePickUp', null),
        BOPIS_STORE_AVAILABLE_TEXT: Resource.msg('store.pickup.search.available.text', 'storePickUp', null),
        BOPIS_STORE_UNAVAILABLE_TEXT: Resource.msg('storepickup.unavalibilty', 'storePickUp', null),
        BOPIS_STORE_CART_ERROR: Resource.msg('store.pickup.cart.error', 'storePickUp', null),
        IS_CLYDE_ENABLED: Site.current.preferences.custom.isClydeEnabled || false,
        IS_PDP_QUANTITY_SELECTOR: Site.current.preferences.custom.enablePDPQuantitySelector || false,
        IS_CART_QUANTITY_SELECTOR: Site.current.preferences.custom.enableCartQuantitySelector || false,
        IS_RAKUTEN_ENABLED:  Site.current.preferences.custom.isRakutenEnable || false,
        ONE_TRUST_COOKIE_ENABLED: Site.current.preferences.custom.oneTrustCookieEnabled || false,
        OPTANON_ALLOWED_COOKIE: Constants.ONE_TRUST_COOKIE_ENABLED,
        LISTRAK_ENABLED: Site.current.preferences.custom.Listrak_Cartridge_Enabled || false,
        RAKUTEN_REQUEST: rakutenCookiesHelper.getRakutenRequestObject(),
        FAMILY_NAME_ENABLED: !empty(Site.current.preferences.custom.plpProductFamilyName) ? Site.current.preferences.custom.plpProductFamilyName : false,
        GOOGLE_AUTO_COMPLETE_ENABLED: !empty(Site.current.preferences.custom.enableAutoComplete) ? Site.current.preferences.custom.enableAutoComplete : false,
        GOOGLE_PAY_ENABLED: Site.current.preferences.custom.isGooglePayEnabled || false,
        GOOGLE_PAY_MERCHANT_ACCOUNT: Site.current.preferences.custom.googlePayMerchantID,
        GOOGLE_PAY_MERCHANT_NAME: Site.current.preferences.custom.Adyen_merchantCode,
        GOOGLE_PAY_AUTOCOMPLETE: autoComplete,
        GOOGLE_PAY_ALLOWED_COUNTRY_CODES: allowedCountryCodes,
        COUPONCODE_URL: URLUtils.url('CouponCode-Apply').toString(),
        IS_YOTPO_ENABLED: !empty(Site.current.preferences.custom.yotpoCartridgeEnabled) ? Site.current.preferences.custom.yotpoCartridgeEnabled : false,
        EMIAL_ADDRESS_INVALID: Resource.msg('listrak.invalid.email', 'product', null),
        EMIAL_ADDRESS_REQUIRED: Resource.msg('listrak.required.email', 'product', null),
        PHONE_NUMBER_INVALID: Resource.msg('listrak.invalid.phone', 'product', null),
        PHONE_NUMBER_REQUIRED: Resource.msg('listrak.required.phone', 'product', null),
        LISTRAK_SUCCESS_MESSAGE: Resource.msg('listrak.success.message', 'product', null),
        INVALID_STATE: Resource.msg('invalid.state.error', 'forms', null),
        CHECKOUT_FIRST_NAME_VALIDATION: Resource.msg('error.message.parse.firstname.invalid', 'forms', null),
        CHECKOUT_LAST_NAME_VALIDATION: Resource.msg('error.message.parse.lastname.invalid', 'forms', null),
        CHECKOUT_EMAIL_VALIDATION: Resource.msg('error.message.email.invalid', 'forms', null),
        CHECKOUT_COMPANY_NAME_VALIDATION: Resource.msg('error.message.parse.companyName.invalid', 'forms', null),
        CHECKOUT_CITY_NAME_VALIDATION: Resource.msg('error.message.parse.city.invalid', 'forms', null),
        CHECKOUT_ZIP_CODE_VALIDATION: Resource.msg('error.message.parse.zip', 'forms', null),
        CHECKOUT_PHONE_NUMBER_VALIDATION: Resource.msg('error.message.parse.phone', 'forms', null),
        CHECKOUT_STATE_VALIDATION: Resource.msg('invalid.state.error', 'forms', null),
        CHECKOUT_ADDRESS_1_VALIDATION: Resource.msg('error.message.parse.address1PObox', 'forms', null),
        CHECKOUT_ADDRESS_2_VALIDATION: Resource.msg('error.message.parse.address2PObox', 'forms', null),
        CHECKOUT_CARD_NUMBER_VALIDATION: Resource.msg('error.card.number', 'creditCard', null),
        CHECKOUT_CARD_EXPIRY_DATE_VALIDATION: Resource.msg('error.credit.card.expiry', 'creditCard', null),
        CHECKOUT_CARD_HOLDER_NAME_VALIDATION: Resource.msg('error.card.holderName', 'creditCard', null),
        CHECKOUT_CARD_SECUIRTY_CODE_VALIDATION: Resource.msg('error.credit.card.security.code.validate', 'creditCard', null),
        CHECKOUT_COUNTRY_US: 'US',
        CHECKOUT_COUNTRY_GB: 'GB',
        CHECKOUT_COUNTRY_CH: 'CH',
        FEDEX_USER_ADDRESS_MESSAGE: fedexAddressNoRecommendation,
        FEDEX_RECOMMENDED_ADDRESS_MESSAGE: Resource.msg('popup.label.content.sub', 'checkout', null),
        LISTRAK_SMS_API_CLIENT_SECRET: !empty(Site.current.preferences.custom.Listrak_SMS_ClientSecret) ? Site.current.preferences.custom.Listrak_SMS_ClientSecret : '',
        LISTRAK_ENABLE_BACK_IN_STOCK_SMS: !empty(Site.current.preferences.custom.Listrak_EnableBackInStockSms) ? Site.current.preferences.custom.Listrak_EnableBackInStockSms : false,
        CLYDE_WARRANTY: Constants.CLYDE_WARRANTY,
        INFO_PRODUCT_AVAILABILITY_PREORDER: Resource.msg('info.product.availability.preorder', 'common', null),
        INFO_PRODUCT_AVAILABILITY_BACK_ORDER: Resource.msg('info.product.availability.backorder', 'common', null),
        BUTTON_ADD_TO_CART: Resource.msg('button.addtocart', 'common', null),
        BUTTON_PREORDER_NOW: Resource.msg('button.preorder.now', 'common', null),
        GIFT_MESSAGE_CART_ERROR: giftMessageCartError
    };
    return resources;
}

module.exports = {
    getResources: getResources
};
