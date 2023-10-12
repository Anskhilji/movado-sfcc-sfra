'use strict';

exports.SFMC_SUBSCRIBER_OBJECT = 'MCSubscriber';
exports.SFMC_ACCESS_TOKEN_OBJECT = 'MCAccessToken';
exports.SFMC_ACCESS_TOKEN_OBJECT_ID = 'MCAccessToken';
exports.SFMC_UPDATE_API_METHOD = 'updateEvents';
exports.SFMC_DATA_API_ENDPOINT = {
     CONTACT: '/contacts/v1/contacts',
     EVENT: '/interaction/v1/events',
     DATA_EXTENSION: '/hub/v1/dataevents/key:{dataExtensionKey}/rowset'
}
exports.SERVICE_ID = {
    INSTANT_AUTH: 'mc.instant.auth.api',
    INSTANT_CHECKOUT_AUTH: 'mc.instant.auth.checkout.api',
    BATCH_AUTH: 'mc.batch.auth.api',
    BATCH_MVMT_AUTH: 'mc.batch.mvmt.auth.api',
    INSTANT_DATA: 'mc.instant.data.api',
    INSTANT_CHECKOUT_DATA: 'mc.instant.data.checkout.api',
    BATCH_DATA: 'mc.batch.data.api',
    BATCH_MVMT_DATA: 'mc.batch.mvmt.data.api',
    UPDATE_DATA: 'mc.update.event.api',
    UPDATE_CHECKOUT_DATA: 'mc.update.event.checkout.api'
}
exports.SFMC_SERVICE_API_TYPE = {
    CONTACT: 'CONTACT',
    EVENT: 'EVENT',
    DATA_EXTENSION: 'DATA_EXTENSION'
}

exports.CREDENTIAL_ID = {
    UPDATE_DATA_CREDENTIAL_ID : 'mc.update.event.api.cred.'
}

exports.RAKUTEN_COOKIE_NAME='rmStoreGateway';
exports.DATE_FORMAT='E, dd MMM yyyy HH:mm:ss z';
exports.ALD_DATE_FORMAT='YYYYMMdd_HHMM';
exports.ONE_TRUST_COOKIE_ENABLED = 'C0004:1';
exports.OPTANON_CONSENT_COOKIE_NAME = 'OptanonConsent';
exports.US_COUNTRY_CODE = 'US';
exports.DE_COUNTRY_CODE = 'DE';
exports.PRICE_LOW_TO_HIGH = 'price-low-to-high';
exports.PRICE_HIGH_TO_LOW = 'price-high-to-low';
exports.SLICING_GROUP = 'slicing_group';
exports.VARIATION_GROUP = 'variation_group';
exports.ROOT_CATEGORY = 'root';
exports.YOTPO_REFINEMENT_ID = 'yotpoAverageScore';
exports.CLYDE_WARRANTY = 'clydeWarranty';
exports.NO_APPLICABLE_PROMOTION = 'NO_APPLICABLE_PROMOTION';
exports.APPLIED_COUPON = 'APPLIED';
exports.EN_LOCALE = 'en';
exports.EN_GB_LOCALE = 'en_GB';
exports.WATCH_INITIALS = 'OB16';
exports.WATCHES_INITIALS = '240';
exports.STRAPS_INITIALS = '243';
exports.JEWELRY_INITIALS = '241';
exports.JEWELRY_INITIALS_CHAR = 'OBJ';
exports.WATCHES_CATEGORY= 'watches';
exports.JEWELRY_CATEGORY= 'jewelry';
exports.SMALL_MM_UNIT= 'mm';
