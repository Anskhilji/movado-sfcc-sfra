'use strict';

/**
 * @module scripts/jobs/catalog
 * @documentation https://ads.tiktok.com/marketing_api/docs?id=1709242018476033
 */

var ProductAvailabilityModel = require('dw/catalog/ProductAvailabilityModel');
var Logger = require('dw/system/Logger');
var File = require('dw/io/File');
var FileReader = require('dw/io/FileReader');
var FileWriter = require('dw/io/FileWriter');
var Money = require('dw/value/Money');
var Site = require('dw/system/Site');
var PRODUCTS_LIMIT = 4999; // The limit of products per API call as per the docs https://ads.tiktok.com/marketing_api/docs?id=1709242018476033
var PRODUCTS_LIMIT_FOR_DELETION = 999;
var TIKTOK_IMPEX_FOLDER = File.IMPEX + File.SEPARATOR + 'src' + File.SEPARATOR + 'tiktok';
var NEW_EXPORTED_TRACKING_FILE_PATH = TIKTOK_IMPEX_FOLDER + File.SEPARATOR + 'new_exported_products.txt';
var ENCODING = 'UTF-8';
var AVAILABILITY_ENUM = {};
AVAILABILITY_ENUM[ProductAvailabilityModel.AVAILABILITY_STATUS_IN_STOCK] = 'IN_STOCK';
AVAILABILITY_ENUM[ProductAvailabilityModel.AVAILABILITY_STATUS_NOT_AVAILABLE] = 'OUT_OF_STOCK';
AVAILABILITY_ENUM[ProductAvailabilityModel.AVAILABILITY_STATUS_PREORDER] = 'PREORDER';
AVAILABILITY_ENUM[ProductAvailabilityModel.AVAILABILITY_STATUS_BACKORDER] = 'PREORDER';
var productsChunk = [];

/**
 * Reads the previously exported tracking file and return the list of products contained in there
 * @returns {Array} The list of products previously exported
 */
function readPreviousExportTrackingFile() {
    // Try to read any previously written tracking file
    var existingTrackingFile = new File(NEW_EXPORTED_TRACKING_FILE_PATH);
    if (!existingTrackingFile.exists()) {
        return [];
    }

    var fileReader = new FileReader(existingTrackingFile, ENCODING);
    var products = [];

    var nextLine;
    while (!empty(nextLine = fileReader.readLine())) { // eslint-disable-line no-cond-assign
        products = products.concat(JSON.parse(nextLine));
    }
    fileReader.close();
    return products;
}

/**
 * Checks if the given product is exportable or not
 *
 * @param {dw/catalog/Product} product The product to check if it is exportable or not
 * @returns {boolean} true if the product is exportable, false otherwise
 */
function isExportableProduct(product) {
    return product && product.isOnline() && !product.isVariationGroup() && !product.isMaster() && !product.isProductSet();
}

/**
 * Deletes the given products list from TikTok
 *
 * @param {dw/object/CustomObject} tikTokSettings The tiktok settings custom object instance
 * @param {Array} products The list of products to delete from TikTok
 * @returns {boolean} true if the products were deleted from TikTok, false otherwise
 */
function deleteProducts(tikTokSettings, products) {
    var tiktokService = require('int_tiktok/cartridge/scripts/services/tiktokService');
    var response = tiktokService.deleteProducts(tikTokSettings, tikTokSettings.custom.catalogId, products);
    return response.error !== true;
}

/**
 * Delete the previously exported products which are not part of this expor, meaning these have been removed from SFCC
 * @param {dw/object/CustomObject} tikTokSettings The tiktok settings custom object instance
 * @param {Array} previouslyExportedProducts The list of products to delete from TikTok
 */
function deleteProductsFromPreviousExport(tikTokSettings, previouslyExportedProducts) {
    if (previouslyExportedProducts.length === 0) {
        return;
    }

    var chunks = Math.round(previouslyExportedProducts.length / PRODUCTS_LIMIT_FOR_DELETION);
    for (var i = 0; i <= chunks; ++i) {
        deleteProducts(tikTokSettings, previouslyExportedProducts.slice(i * PRODUCTS_LIMIT_FOR_DELETION, (i + 1) * PRODUCTS_LIMIT_FOR_DELETION));
    }
}

/**
 * Exports the given products list to TikTok
 *
 * @param {dw/object/CustomObject} tikTokSettings The tiktok settings custom object instance
 * @param {Array} products The formatted products list to export to TikTok
 * @returns {boolean} true if the products were exported to TikTok, false otherwise
 */
function exportProducts(tikTokSettings, products) {
    var tiktokService = require('int_tiktok/cartridge/scripts/services/tiktokService');
    var response = tiktokService.uploadProducts(tikTokSettings, tikTokSettings.custom.catalogId, products);
    return response.error !== true;
}

/**
 * Format the given product variant in the TikTok specific format
 *
 * @param {dw/catalog/Variant} variant The product variant to format before sending it to TikTok
 * @param {string} viewType The name of the view type to use to send the image
 * @returns {Object} the formatted product
 */
function formatProduct(variant, viewType) {
    var priceModel = variant.getPriceModel();
    if (priceModel.getPrice() === Money.NOT_AVAILABLE) {
        Logger.warn('Product ID ' + variant.getID() + " doesn't have any price associated, so it won't be included in the feed");
        return null;
    }
    if (priceModel.getPrice().getValue() === 0) {
        Logger.warn('Product ID ' + variant.getID() + " has $0 price associated, so it won't be included in the feed");
        return null;
    }

    var salesPrice = Math.min(priceModel.getPrice().getValue(), priceModel.getMinPrice().getValue());

    var shortDesc = !empty(variant.getShortDescription()) ? variant.getShortDescription().getMarkup() : '';
    var longDesc = !empty(variant.getLongDescription()) ? variant.getLongDescription().getMarkup() : '';
    var imageLink = getProductImageURL(variant);
    // remove any spaces in the image name
    if (!empty(imageLink)) {
        while (imageLink.indexOf(' ') > 0) {
            imageLink = imageLink.replace(' ', '%20');
        }
    }

    var product = {
        sku_id: variant.getID(),
        title: variant.getName(),
        description: shortDesc || longDesc || variant.getName(),
        availability: AVAILABILITY_ENUM[variant.getAvailabilityModel().getAvailabilityStatus()],
        image_link: imageLink,
        brand: variant.getBrand() || Site.getCurrent().getID(),
        item_group_id: variant.isVariant() ? variant.getMasterProduct().getID() : variant.getID(),
        price: {
            price: priceModel.getPrice().getValue(),
            currency: priceModel.getPrice().getCurrencyCode()
        },
        profession: {
            condition: 'NEW'
        },
        landing_url: {
            link: require('dw/web/URLUtils').abs('Product-Show', 'pid', variant.isVariant() ? variant.getMasterProduct().getID() : variant.getID()).toString()
        }
    };

    if (product.price.price > salesPrice) {
        product.price.sale_price = Math.min(priceModel.getPrice().getValue(), priceModel.getMinPrice().getValue());
    }

    return product;
}

/**
 * Adds the given product to the current chunk array. If the array hits the limit, then perform an API call
 * to export products to TikTok
 *
 * @param {dw/catalog/Product} product The product to add to the chunk
 * @param {Object} parameters The job's parameters
 * @param {dw/object/CustomObject} tikTokSettings The tiktok settings custom object instance
 * @param {Array} previouslyExportedProducts The list of products exported in the last job run
 * @param {dw/io/FileWriter} fileWriter The file writer that writes the tracking file for the current job run
 * @returns {boolean} true if the product was added to the chunk, false otherwise
 */
function ensureChunkSize(product, parameters, tikTokSettings, previouslyExportedProducts, fileWriter) {
    var result = true;
    // If the products chunk hits the limit, do an export, write in the tracking file and flush the chunk
    if (productsChunk.length === PRODUCTS_LIMIT) {
        // Export products to TikTok
        result = exportProducts(tikTokSettings, productsChunk);
        // Write in the tracking file
        var productIds = productsChunk.map(function (variant) {
            return variant.sku_id;
        });
        fileWriter.writeLine(JSON.stringify(productIds));
        // Reset the chunk
        productsChunk.splice(0, productsChunk.length);
    }

    // Remove the product from the previously exported list
    var productIndex = previouslyExportedProducts.indexOf(product.getID());
    if (productIndex > -1) {
        previouslyExportedProducts.splice(productIndex, 1);
    }

    try {
        var formattedProduct = formatProduct(product, parameters.ProductImageViewType);
        if (formattedProduct != null) {
            productsChunk.push(formattedProduct);
        }
    } catch (e) {
        Logger.error(e);
        Logger.info('Error while formatting product ID: ' + product.getID() + '. Skipping --- \n');
    }

    return result;
}

/**
 * get the product search model on base of provide category
 *
 * @param {dw/object/CustomObject} categoryID The hidden category to export
 */
function getProductSearchHitIt(categoryID) {
    var CatalogMgr = require('dw/catalog/CatalogMgr');
    var ProductSearchModel = require('dw/catalog/ProductSearchModel');
    var categoryID = CatalogMgr.getCategory(categoryID);
    var productSearchModel = new ProductSearchModel();
    productSearchModel.setCategoryID(categoryID.ID);
    productSearchModel.search();
    var productSearchHitsItr = productSearchModel.getProductSearchHits();
    return productSearchHitsItr;
}

/**
 * get the product model on base of provide product
 *
 * @param {dw/catalog/Product} product product to genrate image URL
 */
function getProductImageURL(product) {
    try {
        var ProductFactory = require('*/cartridge/scripts/factories/product');
        var tikTokproductImageUrl = null;
        var params = {
            pid: product.ID
        }
        var productFactory = ProductFactory.get(params);

        if (!empty(productFactory) && !empty(productFactory.images) && !empty(productFactory.images.pdp600[0])) {
            tikTokproductImageUrl = productFactory.images.pdp600[0].url != null ? productFactory.images.pdp600[0].url : null;
        }

        return tikTokproductImageUrl;
    } catch (error) {
        Logger.error('Error occurred while genrating product image Url into feed . ProductId {0}: \n Error: {1} \n Message: {2} \n lineNumber: {3} \n fileName: {4} \n', 
        product.ID, e.stack, e.message, e.lineNumber, e.fileName);
    }
}


/**
 * Exports the current site's catalog. Only online products are exported
 *
 * @param {Object} parameters The job's parameters
 * @returns {dw/system/Status} The status of the job
 */
function exportCatalog(parameters) {
    var ProductMgr = require('dw/catalog/ProductMgr');
    var Status = require('dw/system/Status');
    var StepHelper = require('int_tiktok/cartridge/scripts/stepHelper');
    var customObjectHelper = require('int_tiktok/cartridge/scripts/customObjectHelper');

    //  Is the current jobStep being skipped?  If so, exit early
    if (StepHelper.isDisabled(parameters)) {
        return new Status(Status.OK, 'SKIP', 'Step disabled, skip it...');
    }

    // Get the TikTok access token from previously authenticated app
    var tikTokSettings = customObjectHelper.getCustomObject();
    if (empty(tikTokSettings.custom.accessToken)) {
        return new Status(Status.ERROR, 'ERROR', 'No access token available, skip this step...');
    }

    // Get the products hits from PSM on the base of given category
    var productsIterator = getProductSearchHitIt(parameters.HiddenCategory);

    var fileWriter;
    try {
        var allCallsSucceed = true;

        // Create the IMPEX directy in case it does not exist yet
        var tiktokFolder = new File(TIKTOK_IMPEX_FOLDER);
        if (!tiktokFolder.exists()) {
            tiktokFolder.mkdirs();
        }

        var previouslyExportedProducts = readPreviousExportTrackingFile();

        var newTrackingFile = new File(NEW_EXPORTED_TRACKING_FILE_PATH);
        fileWriter = new FileWriter(newTrackingFile, ENCODING);

        while (productsIterator.hasNext()) {
            var product = productsIterator.next().product;

            // Ignore offline products
            if (!isExportableProduct(product)) {
                continue; // eslint-disable-line no-continue
            }

            allCallsSucceed = allCallsSucceed && ensureChunkSize(product, parameters, tikTokSettings, previouslyExportedProducts, fileWriter);
        }
        var exportsOK = exportProducts(tikTokSettings, productsChunk);
        // Write in the tracking file
        var productIds = productsChunk.map(function (variant) {
            return variant.sku_id;
        });
        fileWriter.writeLine(JSON.stringify(productIds));

        // If some products remain in the previouslyExportedProducts array, this means these products have been
        // deleted since the last export; or put offline. We need to delete them from TikTok
        deleteProductsFromPreviousExport(tikTokSettings, previouslyExportedProducts);

        if (allCallsSucceed && exportsOK) {
            return new Status(Status.OK, 'OK', 'All exports succeed.');
        }
        return new Status(Status.ERROR, 'ERROR', 'Something went wrong with the data export.');
    } catch (e) {
        Logger.error(e);
        return new Status(Status.ERROR, 'ERROR', 'Something went wrong with the data export.');
    } finally {
        if (fileWriter) fileWriter.close();
    }
}

module.exports.exportCatalog = exportCatalog;
