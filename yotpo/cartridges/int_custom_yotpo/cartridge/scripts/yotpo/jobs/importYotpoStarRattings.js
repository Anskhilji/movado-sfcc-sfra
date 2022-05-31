'use strict';

/**
 * @module jobs/Yotpo
 *
 * This is the main script called by the Job Schedule to import product star rattings to product attribute.
 * It delegates the request to ImportReviewModel for processing.
 */

var CatalogMgr = require('dw/catalog/CatalogMgr');
var ProductSearchModel = require('dw/catalog/ProductSearchModel');
var Site = require('dw/system/Site');
var YotpoLogger = require('int_yotpo/cartridge/scripts/yotpo/utils/YotpoLogger');

/**
 * Function used to get product search hits
 * @returns {Object} - productSearchHitsItr
 */
function getProductSearchHitIt() {
    var siteRootCategory = CatalogMgr.getSiteCatalog().getRoot();
    var productSearchModel = new ProductSearchModel();
    productSearchModel.setCategoryID(siteRootCategory.ID);
    productSearchModel.setRecursiveCategorySearch(true);
    productSearchModel.setOrderableProductsOnly(true);
    productSearchModel.search();
    var productSearchHitsItr = productSearchModel.getProductSearchHits();
    return productSearchHitsItr;
}

/**
 * This function imports product star rattings to product attribute.
 * @returns {Object} Status
 */
function execute() {
    var ImportReviewModel = require('*/cartridge/scripts/yotpo/model/reviewspayload/ImportReviewModel');
    var Status = require('dw/system/Status');
    var Transaction = require('dw/system/Transaction');
    var YotpoUtils = require('*/cartridge/scripts/yotpo/utils/YotpoUtils');

    var isReview = '';
    var locale = 'default';
    var product;
    var productID;
    var productRating;
    var yotpoReviewsPage = '1';
    var yotpoResponseHTML = '';

    var logLocation = 'importYotpoStarRattings~execute';

    if (!YotpoUtils.isCartridgeEnabled()) {
        return new Status(Status.ERROR);
    }

    try {
        var productSearchHitsItr = getProductSearchHitIt();

        while (productSearchHitsItr.hasNext()) {
            product = productSearchHitsItr.next().product;
            if (!empty(product)) {
                productID = product.ID;
                yotpoResponseHTML = ImportReviewModel.importReviewsAndRatings(productID, yotpoReviewsPage, isReview, locale);

                if (!empty(yotpoResponseHTML)) {
                    Transaction.wrap(function () {
                        product.custom.yotpoStarRattings = yotpoResponseHTML;
                    });
                }
            } else {
                continue;
            }
        }
    } catch (ex) {
        YotpoLogger.logMessage('Something went wrong while importing reviews and ratings, Exception code is: ' + ex, 'error', logLocation);
        return new Status(Status.ERROR);
    }
    return new Status(Status.OK);
}

/* Module Exports */
exports.execute = execute;
