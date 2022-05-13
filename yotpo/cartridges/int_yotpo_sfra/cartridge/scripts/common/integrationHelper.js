'use strict';

/**
 * It loads configuration data for Yotpo module
 * @param {Object} request - currrent request object
 * @param {string} locale - currrent locate id
 * @returns {Object} a JSON object of the yotpo configurations.
 */
function getYotpoConfig(request, locale) {
    var Site = require('dw/system/Site');
    var URLUtils = require('dw/web/URLUtils');
    var YotpoUtils = require('/int_yotpo/cartridge/scripts/yotpo/utils/YotpoUtils.js');
    var isCartridgeEnabled = YotpoUtils.isCartridgeEnabled();

    var isReviewEnabled = false;
    var isRatingEnabled = false;

    if (isCartridgeEnabled) {
        var currentLocaleID = YotpoUtils.getCurrentLocaleMFRA(locale);
        var yotpoAppKey = YotpoUtils.getAppKeyForCurrentLocale(currentLocaleID);
        isReviewEnabled = YotpoUtils.isReviewsEnabledForCurrentLocale(currentLocaleID);
        isRatingEnabled = YotpoUtils.isBottomLineEnabledForCurrentLocale(currentLocaleID);
        var isBottomLineEnabledForCurrentLocale = YotpoUtils.isBottomLineEnabledForCurrentLocale(currentLocaleID);
        var domainAddress = URLUtils.home();
        var productInformationFromMaster = Site.getCurrent().preferences.custom.producInformationFromMaster;

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
    var URLUtils = require('dw/web/URLUtils');
    var isReviewEnabled = false;
    var isRatingEnabled = false;

    if (yotpoConfig.isCartridgeEnabled) {
        var ProductMgr = require('dw/catalog/ProductMgr');
        var product = ProductMgr.getProduct(productId);
        var yotpoAppKey = yotpoConfig.yotpoAppKey;
        isReviewEnabled = yotpoConfig.isReviewEnabled;
        isRatingEnabled = yotpoConfig.isRatingEnabled;

        if (isReviewEnabled || isRatingEnabled) {
            var producInformationFromMaster = yotpoConfig.productInformationFromMaster;
            var currentProduct = product;

            if (product.variant) {
                if (producInformationFromMaster) {
                    currentProduct = product.getVariationModel().master;
                }
            }

            var model = currentProduct.brand;
            if (empty(model)) {
                model = '';
            }

            var YotpoUtils = require('/int_yotpo/cartridge/scripts/yotpo/utils/YotpoUtils.js');

            var domainAddress = yotpoConfig.domainAddress;
            var regex = '([\/])';
            var productID = YotpoUtils.escape(currentProduct.ID, regex, '-');
            var name = currentProduct.name;
            var productDesc	= currentProduct.shortDescription;
            var productURL = URLUtils.abs('Product-Show', 'pid', currentProduct.ID);
            productURL = encodeURI(productURL);

            var imageURL = encodeURI(YotpoUtils.getImageLink(currentProduct));
            imageURL = empty(imageURL) ? 'Image not available' : imageURL;
            var productCategory = YotpoUtils.getCategoryPath(currentProduct);

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

function getIndividualRatingOrReviewsData(yotpoConfig, product){
    if(product.individualProducts.length > 0){
        var yotpoIndividualProductData = {};
        for(var i = 0; i < product.individualProducts.length; i++){
            yotpoIndividualProductData = getRatingsOrReviewsData(yotpoConfig, product.individualProducts[i].id);
            product.individualProducts[i].yotpoIndividualProductData = yotpoIndividualProductData;
            }
        }
}

module.exports = {
    getRatingsOrReviewsData: getRatingsOrReviewsData,
    getConversionTrackingData: getConversionTrackingData,
    getYotpoConfig: getYotpoConfig,
    getIndividualRatingOrReviewsData: getIndividualRatingOrReviewsData
};
