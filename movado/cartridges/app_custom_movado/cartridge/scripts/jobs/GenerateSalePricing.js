'use strict';

/* API Includes */
var Logger = require('dw/system/Logger');
var PriceBookMgr = require('dw/catalog/PriceBookMgr');
var Status = require('dw/system/Status');
var Promotion = require('dw/campaign/Promotion');
var PromotionMgr = require('dw/campaign/PromotionMgr');
var Money = require('dw/value/Money');

/**
 * Get local price books details mentioned in site prefrence.
 * @param {Object} localizeObj configured in site preference
 * @returns {array} returns price books detail in array
 */
function getLocalPriceBooksDetails(localizeObj) {

    var localSalePriceBook = localizeObj.promotionalConversion.sale_pricebook.indexOf('SALE') > -1 ? localizeObj.promotionalConversion.sale_pricebook : '';
    var localizePriceBooks = [];

    if (!empty(localSalePriceBook)) {
        var salePriceBookObj = PriceBookMgr.getPriceBook(localSalePriceBook);
        if (salePriceBookObj) {
            localizePriceBooks.push({
                localPriceBook: salePriceBookObj,
                type: 'sale',
                id: localSalePriceBook
            });
        }
    }

    return localizePriceBooks;
}

function convertedSalePrice(product,localizeObj) {
    var Currency = require('dw/util/Currency');
    var salePrice = '';
    var priceBook;
    var PromotionIt;

    if (product && product.priceModel && product.priceModel.priceInfo && product.priceModel.priceInfo.priceBook) {
        priceBook = product.priceModel.priceInfo.priceBook.ID;
    }

    if (priceBook == localizeObj.promotionalConversion.base_pricebook) {
        PromotionIt = PromotionMgr.activePromotions.getProductPromotions(product).iterator();
    }

    var promotionalPrice = Money.NOT_AVAILABLE;
    var currentPromotionalPrice = Money.NOT_AVAILABLE;

    if(PromotionIt){
        while (PromotionIt.hasNext()) {
            var promo = PromotionIt.next();
            if (promo.getPromotionClass() != null && promo.getPromotionClass().equals(Promotion.PROMOTION_CLASS_PRODUCT) && !promo.basedOnCoupons) {

                if (product.optionProduct) {
                    currentPromotionalPrice = promo.getPromotionalPrice(product, product.getOptionModel());
                } else {
                    currentPromotionalPrice = promo.getPromotionalPrice(product);
                }

                if (promotionalPrice.value > currentPromotionalPrice.value && currentPromotionalPrice.value !== 0) {
                    promotionalPrice = currentPromotionalPrice;
                } else if (promotionalPrice.value == 0) {

                    if ((currentPromotionalPrice.value !== 0 && currentPromotionalPrice.value !== null)) {
                        promotionalPrice = currentPromotionalPrice;
                    }
                }
            }
        }
    }

    if (promotionalPrice.available) {
        salePrice = promotionalPrice.decimalValue.toString();
    }

    return {
        salePrice: salePrice
    };
}

/**
 * Build price book schema XML.
 * @param {string} writeDirPath - IMPEX path
 * @param {Object} priceBook - selected price book
 * @param {Object} localizeObj configured in site preference
 * @returns {boolean} returns boolean after schema build
 */
function buildPriceBookSchema(writeDirPath, priceBook, localizeObj) {
    var File = require('dw/io/File');
    var FileWriter = require('dw/io/FileWriter');
    var XMLStreamWriter = require('dw/io/XMLStreamWriter');
    var Site = require('dw/system/Site').getCurrent();
    var ProductSearchModel = require('dw/catalog/ProductSearchModel'),
        psm = new ProductSearchModel(),
        products;
    psm.setCategoryID('root');
    psm.setRecursiveCategorySearch(true);
    psm.search();

    var salableProducts = psm.getProductSearchHits();

    var writeDir = new File(writeDirPath);
    writeDir.mkdirs();
    var totalAssignedProducts = 0;
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
    priceBookStreamWriter.writeCharacters((!empty(priceBook.localPriceBook)) ? priceBook.localPriceBook.getCurrencyCode() : priceBook.localPriceBook.currencyCode);
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
        priceBookStreamWriter.writeCharacters(localizeObj);
        priceBookStreamWriter.writeEndElement();
        priceBookStreamWriter.writeCharacters('\n');
    }
    priceBookStreamWriter.writeEndElement();
    priceBookStreamWriter.writeStartElement('price-tables');
    priceBookStreamWriter.writeCharacters('\n');

        while (salableProducts.hasNext()) {
            products = salableProducts.next().getRepresentedProducts().toArray();
            products.forEach(function (product) { // eslint-disable-line no-loop-func
                var AdjustedSalePrice = convertedSalePrice(product,localizeObj);
                    if (!empty(AdjustedSalePrice.salePrice)) {
                        priceBookStreamWriter.writeStartElement('price-table');
                        priceBookStreamWriter.writeAttribute('product-id', product.getID());
                        priceBookStreamWriter.writeCharacters('\n');
                        priceBookStreamWriter.writeStartElement('amount');
                        priceBookStreamWriter.writeAttribute('quantity', '1');
                        priceBookStreamWriter.writeCharacters(AdjustedSalePrice.salePrice);
                        priceBookStreamWriter.writeEndElement();
                        priceBookStreamWriter.writeCharacters('\n');
                        priceBookStreamWriter.writeEndElement();
                        totalAssignedProducts++;
                    }
            });
        }

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
    var Site = require('dw/system/Site').getCurrent();

    try {
        var salePriceBooks = JSON.parse(Site.getCurrent().getCustomPreferenceValue('promotionalPriceBookConverstion'));
        var writeDirPath = args.impexDirPath;
        var totalAssignedProducts;
        salePriceBooks.forEach(function (localizeObj) {
            var	localizePriceBooks = getLocalPriceBooksDetails(localizeObj);
            if (!empty(localizePriceBooks)) {
                localizePriceBooks.forEach(function (priceBook) {
                    totalAssignedProducts = buildPriceBookSchema(writeDirPath, priceBook, localizeObj);
                    Logger.info('{0} products localized prices assigned to new price book {1}', totalAssignedProducts, priceBook.id);
                });
            }
        });
    } catch (e) {
        Logger.error('ESW Localize Pricing Job error: ' + e);
        return new Status(Status.ERROR);
    }
    return new Status(Status.OK);
}

exports.execute = execute;
