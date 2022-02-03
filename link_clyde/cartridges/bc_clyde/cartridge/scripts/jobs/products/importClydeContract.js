'use strict';
var clydeHelper = require('~/cartridge/scripts/clydeHelper');
var File = require('dw/io/File');
var FileWriter = require('dw/io/FileWriter');
var CatalogMgr = require('dw/catalog/CatalogMgr');
var ProductSearchModel = require('dw/catalog/ProductSearchModel');
var Site = require('dw/system/Site');
var StringUtils = require('dw/util/StringUtils');
var XMLStreamWriter = require('dw/io/XMLStreamWriter');
var logger = require('dw/system/Logger').getLogger('CLYDE', 'importClydeContract');

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
 * write catalog header
 * @param {dw.io.XMLStreamWriter} clydeContractStreamWriter - The file writer to wirte the file
 * @param {string} catalogID - The catalogID
 * @returns {void}
 */
function writeCatalogHeader(clydeContractStreamWriter, catalogID) {
    clydeContractStreamWriter.writeStartElement('catalog');
    clydeContractStreamWriter.writeAttribute('xmlns', 'http://www.demandware.com/xml/impex/catalog/2006-10-31');
    clydeContractStreamWriter.writeAttribute('catalog-id', catalogID);
}

/**
 * Read callback implementation
 * @param {result} result - The result from clyde contract API
 * @param {dw.io.XMLStreamWriter} fileWriter - The file writer to wirte the file
 * @param {Object} productSearchHitsItr - The productsearchhit model
 * @returns {void}
 */
function writeCatalogFileContent(result, fileWriter, productSearchHitsItr) {
    while (productSearchHitsItr.hasNext()) {
        var product = productSearchHitsItr.next().product;
        // Default Option Product
        fileWriter.writeStartElement('product');
        fileWriter.writeAttribute('product-id', product.ID);

        fileWriter.writeStartElement('options');

        fileWriter.writeStartElement('option');
        fileWriter.writeAttribute('option-id', clydeHelper.CONSTANTS.OPTION_PRODUCT_ID);

        fileWriter.writeStartElement('sort-mode');
        fileWriter.writeCharacters('price');
        fileWriter.writeEndElement();
        fileWriter.writeCharacters('\n');

        fileWriter.writeStartElement('option-values');
        fileWriter.writeStartElement('option-value');
        fileWriter.writeAttribute('value-id', clydeHelper.CONSTANTS.OPTION_PRODUCT_VALUE_ID);
        fileWriter.writeAttribute('default', clydeHelper.CONSTANTS.OPTION_PRODUCT_DEFAULT_VALUE);

        fileWriter.writeStartElement('display-value');
        fileWriter.writeAttribute('xml:lang', 'x-default');
        fileWriter.writeCharacters(clydeHelper.CONSTANTS.OPTION_PRODUCT_VALUE_ID);
        fileWriter.writeEndElement();
        fileWriter.writeCharacters('\n');

        fileWriter.writeStartElement('product-id-modifier');
        fileWriter.writeCharacters(clydeHelper.CONSTANTS.OPTION_PRODUCT_VALUE_ID);
        fileWriter.writeEndElement();
        fileWriter.writeCharacters('\n');

        fileWriter.writeStartElement('option-value-prices');
        fileWriter.writeStartElement('option-value-price');
        fileWriter.writeAttribute('currency', clydeHelper.CONSTANTS.OPTION_PRODUCT_DEFAULT_CURRENCY);
        fileWriter.writeCharacters('0');
        fileWriter.writeEndElement();
        fileWriter.writeCharacters('\n');

        fileWriter.writeEndElement();
        fileWriter.writeCharacters('\n');

        fileWriter.writeEndElement();
        fileWriter.writeCharacters('\n');
        for (var i = 0; i < result.data.length; i++) {
            fileWriter.writeStartElement('option-value');
            fileWriter.writeAttribute('value-id', result.data[i].attributes.sku);
            fileWriter.writeAttribute('default', 'false');

            fileWriter.writeStartElement('display-value');
            fileWriter.writeAttribute('xml:lang', 'x-default');
            fileWriter.writeCharacters(result.data[i].attributes.sku);
            fileWriter.writeEndElement();
            fileWriter.writeCharacters('\n');

            fileWriter.writeStartElement('product-id-modifier');
            fileWriter.writeCharacters(result.data[i].attributes.sku);
            fileWriter.writeEndElement();
            fileWriter.writeCharacters('\n');

            fileWriter.writeStartElement('option-value-prices');

            fileWriter.writeStartElement('option-value-price');
            fileWriter.writeAttribute('currency', clydeHelper.CONSTANTS.OPTION_PRODUCT_DEFAULT_CURRENCY);
            fileWriter.writeCharacters(result.data[i].attributes.premium);
            fileWriter.writeEndElement();
            fileWriter.writeCharacters('\n');

            fileWriter.writeEndElement();
            fileWriter.writeCharacters('\n');

            fileWriter.writeEndElement();
            fileWriter.writeCharacters('\n');
        }
        fileWriter.writeEndElement();
        fileWriter.writeCharacters('\n');

        fileWriter.writeEndElement();
        fileWriter.writeCharacters('\n');

        fileWriter.writeEndElement();
        fileWriter.writeCharacters('\n');

        // product
        fileWriter.writeEndElement();
        fileWriter.writeCharacters('\n');
    }
}

/**
 * main function to get clyde contracts
 * @param {Object} args - job parameter with configuration
 * @returns {void}
 */
function execute() {
    var productSearchHitsItr = getProductSearchHitIt();
    var currentSite = Site.getCurrent();
    var masterCatalogId = currentSite.current.preferences.custom.clydeMasterCatalogID;

    try {
        var writeDir = new File(dw.io.File.IMPEX + clydeHelper.CONSTANTS.CONTRACT_BASE_PATH);
        writeDir.mkdirs();
    } catch (e) {
        logger.error('Cannot create Directory Check log file ');
        throw new Error(e);
    }
    var calendar = currentSite.getCalendar();
    var result = clydeHelper.clydeContractServiceCall(clydeHelper.HTTP_METHOD.GET, clydeHelper.METHOD.CONTRACTS);
    if (!empty(result)) {
        try {
            result = JSON.parse(result);
            logger.info('Going to import {0} skus to master catalog {1}', result.data.length, masterCatalogId);
            // catalog Start
            var clydeContractFile = new File(dw.io.File.IMPEX + clydeHelper.CONSTANTS.CONTRACT_BASE_PATH + 'clydeContract_' + currentSite.getID() + clydeHelper.CONSTANTS.HYPHEN + StringUtils.formatCalendar(calendar, clydeHelper.CONSTANTS.DATETIME_FORMAT) + '.xml');
            clydeContractFile.createNewFile();
            var clydeContractFileWriter = new FileWriter(clydeContractFile, 'UTF-8');
            var clydeContractStreamWriter = new XMLStreamWriter(clydeContractFileWriter);

            // Catalog Header
            writeCatalogHeader(clydeContractStreamWriter, masterCatalogId);

            // Catalog Content
            writeCatalogFileContent(result, clydeContractStreamWriter, productSearchHitsItr);

            clydeContractStreamWriter.writeCharacters('\n');
            clydeContractStreamWriter.writeEndElement();
            clydeContractStreamWriter.close();
            clydeContractFileWriter.close();
            // Catalog end
        } catch (e) {
            logger.error('Error Occured while trying to import clyde contract: {0} in {1} : {2}', e.toString(), e.fileName, e.lineNumber);
            throw new Error(e);
        }
    }
}

module.exports = {
    execute: execute
};
