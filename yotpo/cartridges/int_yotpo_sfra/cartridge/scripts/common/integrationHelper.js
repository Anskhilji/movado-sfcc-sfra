'use strict';

/**
 * It loads configuration data for Yotpo module
 * @param {Object} request - currrent request object
 * @param {string} locale - currrent locate id
 * @returns {Object} a JSON object of the yotpo configurations.
 */
function getYotpoConfig(request, locale) {
    const Site = require('dw/system/Site');
    const URLUtils = require('dw/web/URLUtils');
    const YotpoUtils = require('/int_yotpo/cartridge/scripts/yotpo/utils/YotpoUtils.js');
    const isCartridgeEnabled = YotpoUtils.isCartridgeEnabled();

    const isReviewEnabled = false;
    const isRatingEnabled = false;

    if (isCartridgeEnabled) {
        const currentLocaleID = YotpoUtils.getCurrentLocaleMFRA(locale);
        const yotpoAppKey = YotpoUtils.getAppKeyForCurrentLocale(currentLocaleID);
        isReviewEnabled = YotpoUtils.isReviewsEnabledForCurrentLocale(currentLocaleID);
        isRatingEnabled = YotpoUtils.isBottomLineEnabledForCurrentLocale(currentLocaleID);
        const isBottomLineEnabledForCurrentLocale = YotpoUtils.isBottomLineEnabledForCurrentLocale(currentLocaleID);
        const domainAddress = URLUtils.home();
        const productInformationFromMaster = Site.getCurrent().preferences.custom.producInformationFromMaster;

        return {
            isCartridgeEnabled: isCartridgeEnabled,
            isReviewEnabled: isReviewEnabled,
            isRatingEnabled: isRatingEnabled,
            yotpoAppKey: yotpoAppKey,
            domainAddress: domainAddress,
            productInformationFromMaster: productInformationFromMaster,
            isBottomLineEnabledForCurrentLocale: isBottomLineEnabledForCurrentLocale
        };
    }

    return {
        isCartridgeEnabled: isCartridgeEnabled,
        isReviewEnabled: isReviewEnabled,
        isRatingEnabled: isRatingEnabled
    };
}

/**
 * It retrieves the product reviews for the current product. In case of variant product,
 * it might retrieve reviews for master product depending on the site preference.
 * @param {Object} yotpoConfig - JSON object of yotpo configurations
 * @param {string} productId - the current product-id
 * @returns {Object} a JSON object of the yotpo ratings and reviews.
 */
function getRatingsOrReviewsData(yotpoConfig, productId) {
    const URLUtils = require('dw/web/URLUtils');
    let isReviewEnabled = false;
    let isRatingEnabled = false;

    if (yotpoConfig.isCartridgeEnabled) {
        const ProductMgr = require('dw/catalog/ProductMgr');
        const product = ProductMgr.getProduct(productId);
        const yotpoAppKey = yotpoConfig.yotpoAppKey;
        isReviewEnabled = yotpoConfig.isReviewEnabled;
        isRatingEnabled = yotpoConfig.isRatingEnabled;

        if (isReviewEnabled || isRatingEnabled) {
            const producInformationFromMaster = yotpoConfig.productInformationFromMaster;
            let currentProduct = product;

            if (product.variant) {
                if (producInformationFromMaster) {
                    currentProduct = product.getVariationModel().master;
                }
            }

            let model = currentProduct.brand;
            if (empty(model)) {
                model = '';
            }

            const YotpoUtils = require('/int_yotpo/cartridge/scripts/yotpo/utils/YotpoUtils.js');

            const domainAddress = yotpoConfig.domainAddress;
            const regex = '([\/])';
            const productID = YotpoUtils.escape(currentProduct.ID, regex, '-');
            const name = currentProduct.name;
            const productDesc	= currentProduct.shortDescription;
            let productURL = URLUtils.abs('Product-Show', 'pid', currentProduct.ID);
            productURL = encodeURI(productURL);

            let imageURL = encodeURI(YotpoUtils.getImageLink(currentProduct));
            imageURL = empty(imageURL) ? 'Image not available' : imageURL;
            const productCategory = YotpoUtils.getCategoryPath(currentProduct);

            return {
                isReviewEnabled: isReviewEnabled,
                isRatingEnabled: isRatingEnabled,
                yotpoAppKey: yotpoAppKey,
                domainAddress: domainAddress,
                productID: productID,
                productName: name,
                productDesc: productDesc,
                productModel: model,
                productURL: productURL,
                imageURL: imageURL,
                productCategory: productCategory
            };
        }
    }

    return {
        isReviewEnabled: isReviewEnabled,
        isRatingEnabled: isRatingEnabled
    };
}

/**
 * It retrieves the conversion tracking URL for Yotpo,
 * To send it to Yotpo at order confirmation page,
 * @param {Object} request - currrent request object
 * @param {Object} order - currrent processed order
 * @param {string} currentLocale - current locale id
 * @returns {Object} a JSON object with initial checks
 */
function getConversionTrackingData(request, order, currentLocale) {
    var Site = require('dw/system/Site');
    var YotpoUtils = require('/int_yotpo/cartridge/scripts/yotpo/utils/YotpoUtils.js');
    var isCartridgeEnabled = YotpoUtils.isCartridgeEnabled();
    var conversionTrkURL = '';

    if (isCartridgeEnabled) {
        var orderTotalValue;

        if (!empty(order)) {
            if (order.totalGrossPrice.available) {
                orderTotalValue = order.totalGrossPrice.value;
            } else {
                orderTotalValue = order.getAdjustedMerchandizeTotalPrice(true).add(order.giftCertificateTotalPrice.value);
            }
        }

        var currentLocaleID = YotpoUtils.getCurrentLocaleMFRA(currentLocale);
        var yotpoAppKey = YotpoUtils.getAppKeyForCurrentLocale(currentLocaleID);
        var conversionTrackingURL = Site.getCurrent().preferences.custom.yotpoConversionTrackingPixelURL;
        conversionTrkURL = conversionTrackingURL + '?order_amount=' + orderTotalValue +
            '&order_id=' + order.orderNo + '&order_currency=' + order.currencyCode + '&app_key=' + yotpoAppKey;
    }

    return {
        isCartridgeEnabled: isCartridgeEnabled,
        conversionTrackingURL: conversionTrkURL
    };
};

module.exports = {
    getRatingsOrReviewsData: getRatingsOrReviewsData,
    getConversionTrackingData: getConversionTrackingData,
    getYotpoConfig: getYotpoConfig
};
