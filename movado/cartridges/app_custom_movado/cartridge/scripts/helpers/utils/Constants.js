'use strict';

var Site = require('dw/system/Site');

exports.YEAR_MONTH_DATE_PATTERN = 'yyyy-MM-dd';
exports.PATTERN_TO_CONVERT_TIME_TO_12_HOURS = 'h:mm a';
exports.ALL_COUNTRIES = 'ALL';
exports.ONETRUST_TARGETING_COOKIES_CLASS = 'optanon-category-C0004';
exports.MOVADO_SHIPPING_PIPE_BARS = "|";
exports.ONETRUST_STRICTLY_NECESSARY_COOKIES_CLASS = 'optanon-category-C0001';
exports.ONETRUST_PERFORMANCE_COOKIES_CLASS = 'optanon-category-C0002';
exports.ONETRUST_FUNCTIONAL_COOKIES_CLASS = 'optanon-category-C0003';
exports.ONETRUST_FUNCTIONAL_AND_TARGETING_COOKIES_CLASS = 'optanon-category-C0003-C0004';
exports.SHIPPING_METHODS_UPGRADES_PRECEDENCE = Site.getCurrent().preferences.custom.shippingMethodUpgradesPrecedence;

exports.SERVICE_ID = {
    FB_CONVERSION: 'fb.conversion.event.api',
    GOOGLE_RECAPTCH: 'google.recaptcha.site.verify.api'
}

exports.RAKUTEN_COOKIE_NAME='rmStoreGateway';
exports.DATE_FORMAT='E, dd MMM yyyy HH:mm:ss z';
exports.ALD_DATE_FORMAT='YYYYMMdd_HHMM';
exports.ONE_TRUST_COOKIE_ENABLED = 'C0004:1';
exports.OPTANON_CONSENT_COOKIE_NAME = 'OptanonConsent';
exports.PROMOTION_START_END_DATE_SEPARATOR = '/';

exports.PRICE_LOW_TO_HIGH = 'price-low-to-high';
exports.PRICE_HIGH_TO_LOW = 'price-high-to-low';
exports.RAKUTEN_SITE_ID = 'atrv';
exports.RAKUTEN_Order_GMT_DATE = 'yyyy-MM-dd\'T\'HH:mm:ss\'Z\'';

exports.FEDEX_SERVICE_ID = {
    FEDEX_AUTHENTICATION: 'fedex.auth.api',
    FEDEX_ADDRESS_VALIDATION: 'fedex.validate.address.api'
}