'use strict';

/**
 * @module scripts/yotpo/utils/Contants
 *
 * This is a file used to put all Constants here which will be reused in Yotpo cartridge.
 */

// The default SiteGenesis controller cartridge name
exports.SITEGENESIS_CARTRIDGE_NAME = 'app_storefront_controllers';

// Export Orders
exports.YOTPO_JOB_CONFIG_ID = '1';
exports.YOTPO_CONFIGURATION_OBJECT = 'yotpoConfiguration';
exports.YOTPO_JOBS_CONFIGURATION_OBJECT = 'yotpoJobsConfiguration';
exports.DATE_FORMAT_FOR_YOTPO_DATA = 'yyyy-MM-dd';
exports.PLATFORM_FOR_YOTPO_DATA = 'general';
exports.REGEX_FOR_YOTPO_DATA = '([\"\'\\\/\\n\\r\\b\\f\\t])';
exports.PRODUCT_REGEX_FOR_YOTPO_DATA = '([\/])';

// Import Ratings and Reviews
exports.MAIN_WIDGET_METHOD = 'main_widget';
exports.BOTTOM_LINE_METHOD = 'bottomline';
exports.BOTTOM_LINE_FORMAT = 'html';
exports.REGEX_FOR_IMPORT_REVIEW = '([\/])';
exports.START_INDEX_FOR_IMPORT_REVIEW = 0;
exports.YOTPO_REVIEWS_PAGE_DEFAULT = 1;

// Error Codes
exports.CARTRIDGE_DISABLED_ERROR = 'CARTRIDGE_DISABLED_ERROR';
exports.AUTH_ERROR = 'AUTH_ERROR';
exports.YOTPO_CONFIGURATION_LOAD_ERROR = 'YOTPO_CONFIGURATION_LOAD_ERROR';
exports.YOTPO_ORDER_MISSING_ERROR = 'YOTPO_ORDER_MISSING_ERROR';
exports.EXPORT_ORDER_CONFIG_ERROR = 'EXPORT_ORDER_CONFIG_ERROR';
exports.EXPORT_ORDER_SERVICE_ERROR = 'EXPORT_ORDER_SERVICE_ERROR';
exports.EXPORT_ORDER_RETRY_ERROR = 'EXPORT_ORDER_RETRY_ERROR';
exports.RATINGS_REVIEW_CONFIG_VALIDATION_ERROR = 'RATINGS_REVIEW_CONFIG_VALIDATION_ERROR';
exports.IMPORT_REVIEWS_REALTIME_DISABLED_ERROR = 'IMPORT_REVIEWS_REALTIME_DISABLED_ERROR';
exports.RATINGS_OR_REVIEW_DISABLED_ERROR = 'RATINGS_OR_REVIEW_DISABLED_ERROR';
exports.IMPORT_REVIEW_SERVICE_ERROR = 'IMPORT_REVIEW_SERVICE_ERROR';
exports.EXPORT_ORDER_MISSING_MANDATORY_FIELDS_ERROR = 'EXPORT_ORDER_MISSING_MANDATORY_FIELDS_ERROR';
exports.DELETE_ORDER_RETRY_ERROR = 'DELETE_ORDER_RETRY_ERROR';

exports.EXPORT_SWELL_ORDER_ERROR = 'EXPORT_SWELL_ORDER_ERROR';
exports.EXPORT_SWELL_CUSTOMER_ERROR = 'EXPORT_SWELL_CUSTOMER_ERROR';
exports.YOTPO_CUSTOMER_MISSING_ERROR = 'YOTPO_CUSTOMER_MISSING_ERROR';
exports.EXPORT_ORDER_MISSING_MANDATORY_FIELDS_ERROR = 'EXPORT_ORDER_MISSING_MANDATORY_FIELDS_ERROR';
exports.EXPORT_ORDER_INVALID_ORDER_STATUS_ERROR = 'EXPORT_ORDER_INVALID_ORDER_STATUS_ERROR';
exports.EXPORT_CUSTOMER_MISSING_MANDATORY_FIELDS_ERROR = 'EXPORT_CUSTOMER_MISSING_MANDATORY_FIELDS_ERROR';
exports.EXPORT_SWELL_SERVICE_ERROR = 'EXPORT_SWELL_SERVICE_ERROR';
exports.DELETE_ORDER_SERVICE_ERROR = 'DELETE_ORDER_SERVICE_ERROR';

// API HTTP STATUS CODES
exports.STATUS_200 = '200';
exports.STATUS_401 = '401';
exports.STATUS_400 = '400';
exports.STATUS_404 = '404';
exports.STATUS_500 = '500';

// Order Volume by days
exports.ORDER_VOLUME_DAYS = 30;

// Sorting Order
exports.PRICE_LOW_TO_HIGH = 'price-low-to-high';
exports.PRICE_HIGH_TO_LOW = 'price-high-to-low';
