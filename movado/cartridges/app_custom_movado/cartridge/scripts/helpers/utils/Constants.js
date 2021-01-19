'use strict';

var Site = require('dw/system/Site');

exports.YEAR_MONTH_DATE_PATTERN = 'yyyy-MM-dd';
exports.PATTERN_TO_CONVERT_TIME_TO_12_HOURS = 'h:mm a';
exports.ALL_COUNTRIES = 'ALL';
exports.ONETRUST_TARGETING_COOKIES_CLASS = 'optanon-category-C0004';

exports.SHIPPING_METHODS_UPGRADES_PRECEDENCE = Site.getCurrent().preferences.custom.shippingMethodUpgradesPrecedence;