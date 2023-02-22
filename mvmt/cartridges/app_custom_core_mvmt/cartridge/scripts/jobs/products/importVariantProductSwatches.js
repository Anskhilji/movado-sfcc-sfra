'use strict';
var CatalogMgr = require('dw/catalog/CatalogMgr');
var FileWriter = require('dw/io/FileWriter');
var logger = require('dw/system/Logger').getLogger('CLYDE', 'importClydeContract');
var ProductMgr = require('dw/catalog/ProductMgr');
var ProductSearchModel = require('dw/catalog/ProductSearchModel');
var Site = require('dw/system/Site');
var StringUtils = require('dw/util/StringUtils');
var Transaction = require('dw/system/Transaction');

var ProductFactory = require('*/cartridge/scripts/factories/product');



/**
 * main function to get clyde contracts
 * @param {Object} args - job parameter with configuration
 * @returns {void}
 */
function execute() {

        try {
         var allSiteProducts = ProductMgr.queryAllSiteProducts().asList();
         var apiProductIterator = allSiteProducts.iterator();

        while (apiProductIterator.hasNext()) {
        var apiProduct = apiProductIterator.next();
        var product = ProductFactory.get({
            isTopSearch: false,
            lazyload: false,
            pid: apiProduct.ID,
            pview: 'tile',
            ratings: false,
            searchSuggestion: false,
            showAddToCart: true,
            swatches: true,
        });
        Transaction.wrap(function () {
            product.variantsColorSwatch = product.colorVariationsValues;
        });
        break;
        // Do something with the item
        }

         
        
        } catch (e) {
            logger.error('Error Occured while trying to add each variant swatches: {0} in {1} : {2}', e.toString(), e.fileName, e.lineNumber);
            throw new Error(e);
        }
    }

module.exports = {
    execute: execute
};
