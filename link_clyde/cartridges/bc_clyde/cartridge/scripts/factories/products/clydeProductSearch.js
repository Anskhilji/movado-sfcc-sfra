'use strict';

/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */

const ProductSearchModel = require('dw/catalog/ProductSearchModel');
const CatalogMgr = require('dw/catalog/CatalogMgr');
const log = require('dw/system/Logger').getLogger('CLYDE', 'clydeProductExport');


/**
 * Object implements default searchModel interface
 * @param {Object} parameters - params for searchModel
 * @param {Object} jobStepExecution - jobID
 * @return {Object} public api methods
 */
let searchModel = function (parameters, jobStepExecution) {
    log.info('Starting product Search....');
    let productSearchModel = new ProductSearchModel();

    try {
        let siteRootCategory = CatalogMgr.getSiteCatalog().getRoot();
        productSearchModel.setCategoryID(siteRootCategory.ID);
        productSearchModel.setRecursiveCategorySearch(true);
        productSearchModel.setOrderableProductsOnly(true);
        productSearchModel.setPriceMin(0.01);
        productSearchModel.excludeHitType(require('dw/catalog/ProductSearchHit').HIT_TYPE_PRODUCT_SET);
        productSearchModel.search();
    } catch (e) {
        log.error('Clyde searchModel() -> failed: ' + e.toString() + ' in ' + e.fileName + ':' + e.lineNumber);
        return false;
    }

    log.info('Found {0} products.', productSearchModel.getCount());

    let productHits = productSearchModel.getProductSearchHits();
    let representedProducts = [];
    let productHit = null;

    return {
        getNext: function () {
            let result = null;
            if (empty(representedProducts) && productHits.hasNext()) {
                productHit = productHits.next();
                representedProducts = productHit.getRepresentedProducts().toArray();
            }
            if (!empty(representedProducts)) {
                result = representedProducts.pop();
            }
            return result;
        }
    };
};

module.exports = searchModel;
