'use strict';

/* API Includes */
var Logger = require('dw/system/Logger');
var PriceBookMgr = require('dw/catalog/PriceBookMgr');
var eswHelper = require('*/cartridge/scripts/helper/eswHelper').getEswHelper();

/**
 * Get all online product variants
 * @returns {array} returns products array
 */
function getAllProducts() {
    var ProductSearchModel = require('dw/catalog/ProductSearchModel'),
        psm = new ProductSearchModel(),
        products,
        allProducts = [],
        productsIds = [];
    psm.setCategoryID('root');
    psm.setRecursiveCategorySearch(true);
    psm.search();
    var salableProducts = psm.getProductSearchHits();

    while (salableProducts.hasNext()) {
        products = salableProducts.next().getRepresentedProducts().toArray();
        products.forEach(function (product) {
            if (productsIds.indexOf(product.getID()) === -1) {
                allProducts.push(product);
                productsIds.push(product.getID());
            }
        });
    }
    return allProducts;
}

/**
 * Get local price books details mentioned in site prefrence.
 * @param {Object} localizeObj configured in site preference
 * @returns {array} returns price books detail in array
 */
function getLocalPriceBooksDetails(localizeObj) {
    var currencyCode = localizeObj.localizeCountryObj.currencyCode,
        localListPriceBook = localizeObj.localizeCountryObj.localListPriceBook,
        localSalePriceBook = localizeObj.localizeCountryObj.localSalePriceBook,
        localizePriceBooks = [];

    if (!empty(localListPriceBook)) {
        var listPriceBookObj = PriceBookMgr.getPriceBook(localListPriceBook);
        if ((empty(listPriceBookObj)) || (!empty(listPriceBookObj) && listPriceBookObj.getCurrencyCode() === currencyCode)) {
            localizePriceBooks.push({
                localPriceBook: listPriceBookObj,
                type: 'list',
                id: localListPriceBook
            });
        }
    }
    if (!empty(localSalePriceBook)) {
        var salePriceBookObj = PriceBookMgr.getPriceBook(localSalePriceBook);
        if ((empty(salePriceBookObj)) || (!empty(salePriceBookObj) && salePriceBookObj.getCurrencyCode() === currencyCode)) {
            localizePriceBooks.push({
                localPriceBook: salePriceBookObj,
                type: 'sale',
                id: localSalePriceBook
            });
        }
    }
    return localizePriceBooks;
}

/**
 * Get Fx Rate of shopper currency
 * @param {string} shopperCurrencyIso - getting from site preference
 * @returns {array} returns selected fx rate
 */
function getESWCurrencyFXRate(shopperCurrencyIso) {
    var fxRates = JSON.parse(eswHelper.getFxRates()),
        baseCurrency = eswHelper.getBaseCurrencyPreference(),
        selectedFxRate = [];
    if (!empty(fxRates)) {
        selectedFxRate = fxRates.filter(function (rates) {
            return rates.toShopperCurrencyIso === shopperCurrencyIso && rates.fromRetailerCurrencyIso === baseCurrency;
        });
    }
    return selectedFxRate;
}

/**
 * Get localized price after applying country adjustment
 * @param {number} localizePrice - after applying fx rate
 * @param {string} deliveryCountryIso - getting from site preference
 * @returns {number} returns calculated localized price
 */
function applyESWCountryAdjustments(localizePrice, deliveryCountryIso) {
	/* eslint-disable no-mixed-operators */
	/* eslint-disable no-new-wrappers */
	/* eslint-disable no-param-reassign */
    var countryAdjustment = JSON.parse(eswHelper.getCountryAdjustments()),
        selectedCountryAdjustment = [];
    if (!empty(countryAdjustment)) {
        selectedCountryAdjustment = countryAdjustment.filter(function (adjustment) {
            return adjustment.deliveryCountryIso === deliveryCountryIso;
        });
    }
    if (!empty(selectedCountryAdjustment)) {
        // applying adjustment
        localizePrice += new Number((selectedCountryAdjustment[0].retailerAdjustments.priceUpliftPercentage / 100 * localizePrice));
        // applying duty
        localizePrice += new Number((selectedCountryAdjustment[0].estimatedRates.dutyPercentage / 100 * localizePrice));
        // applying tax
        localizePrice += new Number((selectedCountryAdjustment[0].estimatedRates.taxPercentage / 100 * localizePrice));
    }
    return localizePrice;
}

/**
 * Get localized price after applying rounding model
 * @param {number} localizePrice - price after applying fx rate & country adjustment
 * @param {Object} localizeObj configured in site preference
 * @returns {number} returns calculated localized price
 */
function applyESWRoundingRule(localizePrice, localizeObj) {
    var roundingModels = JSON.parse(eswHelper.getRoundingRules()),
        selectedRoundingModel,
        selectedRoundingRule = [];
    if (!empty(roundingModels)) {
        selectedRoundingModel = roundingModels.filter(function (rule) {
            return rule.deliveryCountryIso === localizeObj.localizeCountryObj.countryCode;
        });

        selectedRoundingRule = selectedRoundingModel[0].roundingModels.filter(function (rule) {
            return rule.currencyIso === localizeObj.localizeCountryObj.currencyCode;
        });

        if (!empty(selectedRoundingRule)) {
            localizePrice = eswHelper.applyRoundingModel(localizePrice, selectedRoundingRule[0]);
        }
    }
    return localizePrice;
}

/**
 * Calculate localized price of selected product using base price book, FxRate, country adjustment & rounding model
 * @param {Object} product object
 * @param {Object} basePriceBook - tenant base currency price book
 * @param {Object} localizeObj configured in site preference
 * @returns {number} returns calculated localized price
 */
function localizePricingConversion(product, basePriceBook, localizeObj) {
    var productPriceModel = product.getPriceModel(),
        localizePrice = null;
    if (!productPriceModel.priceInfo) {
        return localizePrice;
    }
    var baseProductPrice = productPriceModel.getPriceBookPrice(basePriceBook.getID());
    if ((baseProductPrice.valueOrNull !== null)) {
        localizePrice = new Number(baseProductPrice.value);
        var selectedFxRate = getESWCurrencyFXRate(localizeObj.localizeCountryObj.currencyCode);
        if (!empty(selectedFxRate)) {
            localizePrice = (localizeObj.applyCountryAdjustments.toLowerCase() === 'true') ? applyESWCountryAdjustments(localizePrice, localizeObj.localizeCountryObj.countryCode) : localizePrice;
            localizePrice = new Number((localizePrice * selectedFxRate[0].rate).toFixed(2));
            localizePrice = (localizeObj.applyRoundingModel.toLowerCase() === 'true') ? applyESWRoundingRule(localizePrice, localizeObj) : localizePrice;
        }
    }
    return localizePrice;
}

/**
 * Build price book schema XML.
 * @param {string} writeDirPath - IMPEX path
 * @param {array} products - array with all online products variants
 * @param {Object} priceBook - selected price book
 * @param {Object} localizeObj configured in site preference
 * @returns {boolean} returns boolean after schema build
 */
function buildPriceBookSchema(writeDirPath, products, priceBook, localizeObj) {
    var File = require('dw/io/File');
    var FileWriter = require('dw/io/FileWriter');
    var XMLStreamWriter = require('dw/io/XMLStreamWriter');
    var Site = require('dw/system/Site').getCurrent();
    var writeDir = new File(writeDirPath);
    writeDir.mkdirs();
    var totalAssignedProducts = 0;
    var basePriceBook = (priceBook.type.toLowerCase() === 'list') ? PriceBookMgr.getPriceBook(localizeObj.baseListPriceBook) : PriceBookMgr.getPriceBook(localizeObj.baseSalePriceBook);
    if (empty(basePriceBook)) {
        return totalAssignedProducts;
    }
    var priceBookFile = new File(writeDirPath + 'PriceBookExport_' + Site.getID() + '_' + priceBook.id + '.xml');

    priceBookFile.createNewFile();
    var priceBookFileWriter = new FileWriter(priceBookFile, 'UTF-8');
    var priceBookStreamWriter = new XMLStreamWriter(priceBookFileWriter);
    priceBookStreamWriter.writeStartElement('pricebooks');
    priceBookStreamWriter.writeAttribute('xmlns', 'http://www.demandware.com/xml/impex/pricebook/2006-10-31');
    priceBookStreamWriter.writeCharacters('\n');
    priceBookStreamWriter.writeStartElement('pricebook');
    priceBookStreamWriter.writeCharacters('\n');
    priceBookStreamWriter.writeStartElement('header');
    priceBookStreamWriter.writeAttribute('pricebook-id', priceBook.id);
    priceBookStreamWriter.writeCharacters('\n');
    priceBookStreamWriter.writeStartElement('currency');
    priceBookStreamWriter.writeCharacters((!empty(priceBook.localPriceBook)) ? priceBook.localPriceBook.getCurrencyCode() : localizeObj.localizeCountryObj.currencyCode);
    priceBookStreamWriter.writeEndElement();
    priceBookStreamWriter.writeCharacters('\n');
    priceBookStreamWriter.writeStartElement('display-name');
    priceBookStreamWriter.writeAttribute('xml:lang', 'x-default');
    priceBookStreamWriter.writeCharacters((!empty(priceBook.localPriceBook)) ? priceBook.localPriceBook.getDisplayName() : priceBook.id);
    priceBookStreamWriter.writeEndElement();
    priceBookStreamWriter.writeCharacters('\n');
    priceBookStreamWriter.writeStartElement('online-flag');
    priceBookStreamWriter.writeCharacters('true');
    priceBookStreamWriter.writeEndElement();
    priceBookStreamWriter.writeCharacters('\n');
    if (!empty(priceBook.localPriceBook) && !empty(priceBook.localPriceBook.getParentPriceBook())) {
        priceBookStreamWriter.writeStartElement('parent');
        priceBookStreamWriter.writeCharacters(priceBook.localPriceBook.getParentPriceBook().getID());
        priceBookStreamWriter.writeEndElement();
        priceBookStreamWriter.writeCharacters('\n');
    } else if (empty(priceBook.localPriceBook) && priceBook.type.toLowerCase() === 'sale') {
        priceBookStreamWriter.writeStartElement('parent');
        priceBookStreamWriter.writeCharacters(localizeObj.localizeCountryObj.localListPriceBook);
        priceBookStreamWriter.writeEndElement();
        priceBookStreamWriter.writeCharacters('\n');
    }
    priceBookStreamWriter.writeEndElement();
    priceBookStreamWriter.writeStartElement('price-tables');
    priceBookStreamWriter.writeCharacters('\n');
    products.forEach(function (product) {
        var localizedPrice = localizePricingConversion(product, basePriceBook, localizeObj);
        if (!empty(localizedPrice)) {
            priceBookStreamWriter.writeStartElement('price-table');
            priceBookStreamWriter.writeAttribute('product-id', product.getID());
            priceBookStreamWriter.writeCharacters('\n');
            priceBookStreamWriter.writeStartElement('amount');
            priceBookStreamWriter.writeAttribute('quantity', '1');
            priceBookStreamWriter.writeCharacters(localizedPrice);
            priceBookStreamWriter.writeEndElement();
            priceBookStreamWriter.writeCharacters('\n');
            priceBookStreamWriter.writeEndElement();
            totalAssignedProducts++;
        }
    });
    priceBookStreamWriter.writeCharacters('\n');
    priceBookStreamWriter.writeEndElement();
    priceBookStreamWriter.writeCharacters('\n');
    priceBookStreamWriter.writeEndElement();
    priceBookStreamWriter.writeCharacters('\n');
    priceBookStreamWriter.writeEndElement();
    priceBookStreamWriter.close();
    priceBookFileWriter.close();
    return totalAssignedProducts;
}

/**
 * Script to build PriceBook schema.
 * If price book exist: Find and update products with missing prices without modifying the existing products prices.
 * If price book does not exist: Generate a Price Book for a required/specified currency in the site preferences
 * @param {Object} args The argument object
 * @returns {boolean} - returns execute result
 */
function execute(args) {
    try {
        var localizedPricingCountries = JSON.parse(eswHelper.getLocalizedPricingCountries());
        var writeDirPath = args.impexDirPath;
        var products = getAllProducts();
        var totalAssignedProducts;

        localizedPricingCountries.forEach(function (localizeObj) {
            var localizePriceBooks = getLocalPriceBooksDetails(localizeObj);
            if (!empty(localizePriceBooks)) {
                localizePriceBooks.forEach(function (priceBook) {
                    totalAssignedProducts = buildPriceBookSchema(writeDirPath, products, priceBook, localizeObj);
                    Logger.info('{0} products localized prices assigned to new price book {1}', totalAssignedProducts, priceBook.id);
                });
            }
        });
    } catch (e) {
        Logger.error('ESW Localize Pricing Job error: ' + e);
        return false;
    }
    return true;
}

exports.execute = execute;
