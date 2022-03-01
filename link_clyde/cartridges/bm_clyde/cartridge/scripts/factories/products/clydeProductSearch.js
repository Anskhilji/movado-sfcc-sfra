'use strict';

/**
 * Implements product search for export jobs
 */
let searchModel = function () {
    var ProductMgr = require('dw/catalog/ProductMgr');
    var Logger = require('dw/system/Logger').getLogger('CLYDE', 'clydeProductExport');

    Logger.info('Starting product search...');

    // Properties
    let productIter = ProductMgr.queryAllSiteProducts();
    let count = 0;

    Logger.info('Found {0} products', productIter.count);

    // Member Functions
    this.getNext = function () {
        let next = null;

        while (productIter.hasNext()) {
            next = productIter.next();

            if (!next.master && !next.productSet && next.priceModel.price.valueOrNull) {
                count++;
                break;
            }
        }

        return next;
    };

    this.getCounter = function () {
        return count;
    };
};

module.exports = searchModel;
