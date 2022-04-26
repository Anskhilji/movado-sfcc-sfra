'use strict';

/**
 * @module jobs/Yotpo
 *
 * This is the main script called by the Job Schedule to import product star rattings to product attribute.
 * It delegates the request to ImportReviewModel for processing.
 */

var CatalogMgr = require('dw/catalog/CatalogMgr');
var Constants = require('*/cartridge/scripts/yotpo/utils/Constants');
var ProductSearchModel = require('dw/catalog/ProductSearchModel');
var Site = require('dw/system/Site');
var YotpoLogger = require('*/cartridge/scripts/yotpo/utils/YotpoLogger');


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
    var yotpoStarRatingsInProductAttributeEnab = Site.getCurrent().preferences.custom.yotpoStarRatingsInProductAttributeEnabled;

    var isreview = 'true';
    var locale = 'default';
    var product;
    var productID;
    var productRatting;
    var yotporeviewspage = '1';
    var yotpoResponseHTML = '';

    var logLocation = 'importYotpoStarRattings~execute';

    if (!YotpoUtils.isCartridgeEnabled() || !yotpoStarRatingsInProductAttributeEnab) {
        return new Status(Status.ERROR);
    }

    try {
        var productSearchHitsItr = getProductSearchHitIt();

        while (productSearchHitsItr.hasNext()) {
            product = productSearchHitsItr.next().product;
            productID = product.ID;
            yotpoResponseHTML = ImportReviewModel.importReviewsAndRatings(productID, yotporeviewspage, isreview, locale);

            for (let i = 0; i < yotpoResponseHTML.length; i++) {
                if (yotpoResponseHTML[i].method == 'bottomline') {
                    productRatting = yotpoResponseHTML[i].result;
                    Transaction.wrap(function () {
                        product.custom.yotpoStarRattings = productRatting;
                    });
                    break;
                }
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
