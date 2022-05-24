/* eslint-disable no-undef */
'use strict';

var ArrayList = require('dw/util/ArrayList');
var Calendar = require('dw/util/Calendar');
var CSVStreamWriter = require('dw/io/CSVStreamWriter');
var File = require('dw/io/File');
var FileWriter = require('dw/io/FileWriter');
var Logger = require('dw/system/Logger');
var Money = require('dw/value/Money');
var ProductSearchModel = require('dw/catalog/ProductSearchModel');
var Promotion = require('dw/campaign/Promotion');
var PromotionMgr = require('dw/campaign/PromotionMgr');
var Site = require('dw/system/Site');
var StringUtils = require('dw/util/StringUtils');
var URLUtils = require('dw/web/URLUtils');

var Constants = require('~/cartridge/scripts/utils/Constants');
var commonUtils = require('./utils/commonUtils');

function createDirectoryAndFile(targetFolder, fileName) {
    //create directory
    var dirPath = File.IMPEX + targetFolder;
    var dir = new File(dirPath);

    if (!dir.isDirectory()) {
        dir.mkdirs();
    }

    var filePath = dirPath + fileName + ".csv";
    var file = new File(filePath);

    file.createNewFile();

    var fileWriter = new FileWriter(file);
    var csvStreamWriter = new CSVStreamWriter(fileWriter);
    return { fileWriter: fileWriter, csvStreamWriter: csvStreamWriter, fileName: fileName };
}


function exportSmartGiftFeed(args) {
    Logger.info('exportSmartGiftFeed Started');
    var targetFolder = args.targetFolder;
    var fileName = args.fileName;
    var feedColumnsSmartGift = {
        "ID": 1,
        "masterProductID": 2,
        "title": 3,
        "price": 4,
        "link": 5,
        "description": 6,
        "longDescription": 7,
        "imageLinkSmartGift": 8,
        "availability": 9,
        "color": 10,
        "size": 11,
        "width": 12,
        "categories": 13,
        "rating": 14,
        "gender": 15,
        "isMasterProduct": 16
    }
    var feedParametersSmartGift = {
        "colonSeparator": Constants.COLON_SEPARATOR,
        "angleSeparator": Constants.ANGLE_SEPARATOR,
        "pipeSeparator": Constants.PIPE_SEPARATOR,
        "semiColonSeparator": Constants.SEMICOLON_SEPARATOR,
        "categories": true
    }
    var fileArgs = createDirectoryAndFile(targetFolder, fileName);
    exportFeed(feedColumnsSmartGift, fileArgs, feedParametersSmartGift);
}

function exportGoogleFeed(args) {
    var targetFolder = args.targetFolder;
    var fileName = args.fileName;
    var feedColumnsGoogle = {};
    if (Site.current.ID === 'MovadoUS') {
        feedColumnsGoogle = {
            "ID": 1,
            "metaTitle": 2,
            "description": 3,
            "decimalPrice": 4,
            "salePrice": 5,
            "salePriceEffectiveDate": 6,
            "link": 7,
            "imageLink": 8,
            "availability": 9,
            "productType": 10,
            "ProductCategory": 11,
            "condition": 12,
            "gtin": 13,
            "mpn": 14,
            "brand": 15,
            "color": 16,
            "gender": 17,
            "ageGroup": 18,
            "productLabel": 19,
            "fontFamily": 20,
            "price_CA": 21,
            "salePrice_CA": 22,
            "sale_price_effective_date_CA": 23,
            "link_CA": 24,
            "availability_CA": 25,
            "price_GBP": 26,
            "salePrice_GBP": 27,
            "salePrice_EUR": 28,
            "sale_price_effective_date_UK": 29,
            "price_EUR": 30,
            "price_MXN": 31,
            "price_SGD": 32,
            "price_MYR": 33,
            "price_HKD": 34,
            "price_CHF": 35

        }
    } else if (Site.current.ID === 'MCSUS') {
        feedColumnsGoogle = {
            "ID": 1,
            "metaTitle": 2,
            "description": 3,
            "decimalPriceMCSUS": 4,
            "link": 5,
            "imageLink": 6,
            "availability": 7,
            "productType": 8,
            "ProductCategory": 9,
            "condition": 10,
            "gtin": 11,
            "mpn": 12,
            "brand": 13,
            "color": 14,
            "gender": 15,
            "ageGroup": 16,
            "productLabel": 17,
            "fontFamily": 18
        }
    } else if (Site.current.ID === 'OliviaBurtonUK') {
        feedColumnsGoogle = {
            "ID": 1,
            "metaTitle": 2,
            "descriptionGoogle": 3,
            "decimalPrice": 4,
            "salePrice": 5,
            "salePriceEffectiveDate": 6,
            "link": 7,
            "imageLink": 8,
            "additionalImageLink": 9,
            "availability": 10,
            "productTypeGoogle": 11,
            "googleProductCategory": 12,
            "condition": 13,
            "gtin": 14,
            "mpn": 15,
            "brand": 16,
            "color": 17,
            "size": 18,
            "gender": 19,
            "ageGroup": 20,
            "customLabel0": 21,
            "customLabel1": 22,
            "customLabel2": 23,
            "customLabel3": 24,
            "price_FR": 25,
            "salePrice_FR": 26,
            "sale_price_effective_date_FR": 27,
            "link_FR": 28,
            "availability_FR": 29
        }
    } else {
        feedColumnsGoogle = {
            "ID": 1,
            "metaTitle": 2,
            "descriptionGoogle": 3,
            "decimalPrice": 4,
            "salePrice": 5,
            "salePriceEffectiveDate": 6,
            "link": 7,
            "imageLink": 8,
            "additionalImageLink": 9,
            "availability": 10,
            "productTypeGoogle": 11,
            "googleProductCategory": 12,
            "condition": 13,
            "gtin": 14,
            "mpn": 15,
            "brand": 16,
            "color": 17,
            "size": 18,
            "gender": 19,
            "ageGroup": 20,
            "customLabel0": 21,
            "customLabel1": 22,
            "customLabel2": 23,
            "customLabel3": 24
        }
    }

    var feedParametersGoogle = {
        "colonSeparator": Constants.COLON_SEPARATOR,
        "angleSeparator": Constants.ANGLE_SEPARATOR,
        "pipeSeparator": Constants.PIPE_SEPARATOR,
        "semiColonSeparator": Constants.SEMICOLON_SEPARATOR,
        "skipMissingProductTypeSKUs": false
    }

    var fileArgs = createDirectoryAndFile(targetFolder, fileName);
    exportFeed(feedColumnsGoogle, fileArgs, feedParametersGoogle);
}

function exportDataFeedWatch(args) {
    var targetFolder = args.targetFolder;
    var fileName = args.fileName;
    var feedColumnsDataFeedWatch = {
        "sku": 1,
        "availabilityDataFeedWatch": 2,
        "online/offline": 3,
        "brand": 4,
        "condition": 5,
        "productName": 6,
        "shortDescription": 7,
        "color": 8,
        "productTypeDataFeedWatch": 9,
        "gtin": 10,
        "imageLinkDataFeedWatch": 11,
        "link": 12,
        "priceUSD": 13,
        "priceGBP": 14,
        "priceCAD": 15,
        "priceEUR": 16,
        "priceAUD": 17,
        "gender": 18,
        "caseDiameter": 19
    }
    var feedParametersDataFeedWatch = {
        "colonSeparator": Constants.COLON_SEPARATOR,
        "angleSeparator": Constants.ANGLE_SEPARATOR,
        "pipeSeparator": Constants.PIPE_SEPARATOR,
        "semiColonSeparator": Constants.SEMICOLON_SEPARATOR
    }
    var fileArgs = createDirectoryAndFile(targetFolder, fileName);
    exportFeed(feedColumnsDataFeedWatch, fileArgs, feedParametersDataFeedWatch);
}

function exportFeed(feedColumns, fileArgs, feedParameters) {
    try {
        fileArgs.csvStreamWriter.writeNext(buildCsvHeader(feedColumns));
        var productSearchHitsItr = getProductSearchHitIt();
        while (productSearchHitsItr.hasNext()) {
            try {
                var product = productSearchHitsItr.next().product;
                if (product.variant) {
                    continue;
                }
                var productAttributes = getProductAttributes(product, feedParameters, feedColumns);

                if (feedParameters.categories) {
                    var categoriesPath = buildCategoryPath(product.getOnlineCategories(), feedParameters);
                }

                if (product.productSet) {
                    var productSetCustomHelper = require('*/cartridge/scripts/helpers/productSetCustomHelper');
                    var productCustomHelpers = require('*/cartridge/scripts/helpers/productCustomHelpers');
                    var productSetBasePrice = productSetCustomHelper.getProductSetBasePrice(product.ID);
                    var productSetSalePrice = productSetCustomHelper.getProductSetSalePrice(product.ID);
                    productAttributes.price = productSetBasePrice.basePrice.toFixed(2) + ' ' + product.priceModel.maxPrice.currencyCode;
                    productAttributes.decimalPrice = productSetBasePrice.basePrice.toFixed(2) + ' ' + product.priceModel.maxPrice.currencyCode;
                    if (productSetSalePrice.salePrice > 0) {
                        productAttributes.salePrice = productSetSalePrice.salePrice.toFixed(2) + ' ' + product.priceModel.maxPrice.currencyCode;
                    }
                    productAttributes.salePriceEffectiveDate = productSetSalePrice.salePriceEffectiveDate;
                    var productAvilibiltyModel = productCustomHelpers.productSetStockAvailability(Constants.PRODUCT_TYPE, product);
                    productAttributes.availability = productAvilibiltyModel.availabilityStatus;
                    productAttributes.inStock = productAvilibiltyModel.inStock;

                }

                writeCSVLine(productAttributes, categoriesPath, feedColumns, fileArgs);
                if (product.master) {
                    var isVariant = true;
                    var productVariants = getProductVariants(product.getVariants(), productAttributes, isVariant, feedParameters, feedColumns);
                    productVariants.forEach(function (product) {
                        writeCSVLine(product.product, categoriesPath, feedColumns, fileArgs);
                    });
                }

            } catch (e) {
                Logger.error('Error occurred while adding product into feed. Product {0}: \n Error: {1} \n Message: {2} \n', product, e.stack, e.message);
            }

        }
    } catch (e) {
        Logger.error('Error occurred while generating csv file for product feed. Error: {0} \n Message: {1} \n', e.stack, e.message);
    }
    finally {
        fileArgs.csvStreamWriter.close();
        fileArgs.fileWriter.close();
    }
    Logger.info('Product feed generated successfully with file name: ' + fileArgs.fileName);
}

function getProductSearchHitIt() {
    var productSearchModel = new ProductSearchModel();
    productSearchModel.setCategoryID('root');
    productSearchModel.setRecursiveCategorySearch(true);
    productSearchModel.search();
    var productSearchHitsItr = productSearchModel.getProductSearchHits();
    return productSearchHitsItr;
}

function buildCsvHeader(feedColumns) {
    var csvFileHeader = new Array();

    if (!empty(feedColumns['ID'])) {
        csvFileHeader.push("id");
    }

    if (!empty(feedColumns['sku'])) {
        csvFileHeader.push("sku");
    }

    if (!empty(feedColumns['masterProductID'])) {
        csvFileHeader.push("item_group_id");
    }

    if (!empty(feedColumns['isMasterProduct'])) {
        csvFileHeader.push("is_master_product");
    }

    if (!empty(feedColumns['title'])) {
        csvFileHeader.push("title");
    }

    if (!empty(feedColumns['metaTitle'])) {
        csvFileHeader.push("title");
    }

    if (!empty(feedColumns['productName'])) {
        csvFileHeader.push("product name");
    }

    if (!empty(feedColumns['description'])) {
        csvFileHeader.push("description");
    }

    if (!empty(feedColumns['descriptionGoogle'])) {
        csvFileHeader.push("descriptionGoogle");
    }

    if (!empty(feedColumns['shortDescription'])) {
        csvFileHeader.push("short description");
    }

    if (!empty(feedColumns['price'])) {
        csvFileHeader.push("price");
    }

    if (!empty(feedColumns['decimalPrice'])) {
        csvFileHeader.push("price");
    }

    if (!empty(feedColumns['decimalPriceMCSUS'])) {
        csvFileHeader.push("price");
    }

    if (!empty(feedColumns['salePrice'])) {
        csvFileHeader.push("sale_price");
    }

    if (!empty(feedColumns['salePriceEffectiveDate'])) {
        csvFileHeader.push("sale_price_effective_date");
    }

    if (!empty(feedColumns['link'])) {
        csvFileHeader.push("link");
    }

    if (!empty(feedColumns['imageLink'])) {
        csvFileHeader.push("image_link");
    }

    if (!empty(feedColumns['imageLinkSmartGift'])) {
        csvFileHeader.push("image_link");
    }

    if (!empty(feedColumns['imageLinkDataFeedWatch'])) {
        csvFileHeader.push("image link");
    }

    if (!empty(feedColumns['additionalImageLink'])) {
        csvFileHeader.push("additional_image_link");
    }

    if (!empty(feedColumns['availability'])) {
        csvFileHeader.push("availability");
    }

    if (!empty(feedColumns['availabilityDataFeedWatch'])) {
        csvFileHeader.push("availability");
    }

    if (!empty(feedColumns['online/offline'])) {
        csvFileHeader.push("online/offline");
    }

    if (!empty(feedColumns['productType'])) {
        csvFileHeader.push("product_type");
    }

    if (!empty(feedColumns['productTypeGoogle'])) {
        csvFileHeader.push("product_type_google");
    }

    if (!empty(feedColumns['productTypeDataFeedWatch'])) {
        csvFileHeader.push("product type");
    }

    if (!empty(feedColumns['categories'])) {
        csvFileHeader.push("Categories");
    }

    if (!empty(feedColumns['googleProductCategory'])) {
        csvFileHeader.push("google_product_category");
    }

    if (!empty(feedColumns['ProductCategory'])) {
        csvFileHeader.push("google_product_category");
    }

    if (!empty(feedColumns['condition'])) {
        csvFileHeader.push("condition");
    }

    if (!empty(feedColumns['gtin'])) {
        csvFileHeader.push("gtin");
    }

    if (!empty(feedColumns['mpn'])) {
        csvFileHeader.push("mpn");
    }

    if (!empty(feedColumns['brand'])) {
        csvFileHeader.push("brand");
    }

    if (!empty(feedColumns['color'])) {
        csvFileHeader.push("color");
    }

    if (!empty(feedColumns['size'])) {
        csvFileHeader.push("size");
    }

    if (!empty(feedColumns['gender'])) {
        csvFileHeader.push("gender");
    }

    if (!empty(feedColumns['ageGroup'])) {
        csvFileHeader.push("age_group");
    }

    if (!empty(feedColumns['customLabel0'])) {
        csvFileHeader.push("custom_label_0");
    }

    if (!empty(feedColumns['customLabel1'])) {
        csvFileHeader.push("custom_label_1");
    }

    if (!empty(feedColumns['customLabel2'])) {
        csvFileHeader.push("custom_label_2");
    }

    if (!empty(feedColumns['customLabel3'])) {
        csvFileHeader.push("custom_label_3");
    }

    if (!empty(feedColumns['longDescription'])) {
        csvFileHeader.push("long_description");
    }

    if (!empty(feedColumns['width'])) {
        csvFileHeader.push("width");
    }

    if (!empty(feedColumns['rating'])) {
        csvFileHeader.push("rating");
    }

    if (!empty(feedColumns['productLabel'])) {
        csvFileHeader.push("Label");
    }

    if (!empty(feedColumns['fontFamily'])) {
        csvFileHeader.push("custom_label_1");
    }

    if (!empty(feedColumns['priceUSD'])) {
        csvFileHeader.push("price - USD");
    }

    if (!empty(feedColumns['priceGBP'])) {
        csvFileHeader.push("price - GBP");
    }

    if (!empty(feedColumns['priceCAD'])) {
        csvFileHeader.push("price - CAD");
    }

    if (!empty(feedColumns['priceEUR'])) {
        csvFileHeader.push("price - EUR");
    }

    if (!empty(feedColumns['priceAUD'])) {
        csvFileHeader.push("price - AUD");
    }

    if (!empty(feedColumns['caseDiameter'])) {
        csvFileHeader.push("case diameter");
    }

    if (!empty(feedColumns['price_CA'])) {
        csvFileHeader.push("price_CA");
    }

    if (!empty(feedColumns['price_GBP'])) {
        csvFileHeader.push("price_GBP");
    }

    if (!empty(feedColumns['price_EUR'])) {
        csvFileHeader.push("price_EUR");
    }

    if (!empty(feedColumns['price_MXN'])) {
        csvFileHeader.push("price_MXN");
    }

    if (!empty(feedColumns['price_SGD'])) {
        csvFileHeader.push("price_SGD");
    }

    if (!empty(feedColumns['price_MYR'])) {
        csvFileHeader.push("price_MYR");
    }

    if (!empty(feedColumns['price_CHF'])) {
        csvFileHeader.push("price_CHF");
    }

    if (!empty(feedColumns['price_HKD'])) {
        csvFileHeader.push("price_HKD");
    }

    if (!empty(feedColumns['salePrice_CA'])) {
        csvFileHeader.push("Sale Price_CA");
    }

    if (!empty(feedColumns['salePrice_GBP'])) {
        csvFileHeader.push("Sale Price_GBP");
    }

    if (!empty(feedColumns['salePrice_EUR'])) {
        csvFileHeader.push("Sale Price_EUR");
    }

    if (!empty(feedColumns['sale_price_effective_date_CA'])) {
        csvFileHeader.push("sale_price_effective_date_CA");
    }

    if (!empty(feedColumns['sale_price_effective_date_UK'])) {
        csvFileHeader.push("sale_price_effective_date_UK");
    }

    if (!empty(feedColumns['link_CA'])) {
        csvFileHeader.push("Link_CA");
    }

    if (!empty(feedColumns['availability_CA'])) {
        csvFileHeader.push("Availability_CA");
    }

    if (!empty(feedColumns['price_FR'])) {
        csvFileHeader.push("price_FR");
    }

    if (!empty(feedColumns['salePrice_FR'])) {
        csvFileHeader.push("Sale Price_FR");
    }

    if (!empty(feedColumns['sale_price_effective_date_FR'])) {
        csvFileHeader.push("sale_price_effective_date_FR");
    }

    if (!empty(feedColumns['link_FR'])) {
        csvFileHeader.push("Link_FR");
    }

    if (!empty(feedColumns['availability_FR'])) {
        csvFileHeader.push("Availability_FR");
    }

    return csvFileHeader
}

function writeCSVLine(product, categoriesPath, feedColumns, fileArgs) {
    var productDetails = new Array();
    if (!empty(feedColumns['ID'])) {
        if (product.ID) {
            productDetails.push(product.ID);
        } else {
            productDetails.push("");
        }
    }

    if (!empty(feedColumns['sku'])) {
        if (product.ID) {
            productDetails.push(product.ID);
        } else {
            productDetails.push("");
        }
    }

    if (!empty(feedColumns['masterProductID'])) {
        if (product.ID && product.productType) {
            productDetails.push(product.masterProductID);
        } else {
            productDetails.push("");
        }
    }

    if (!empty(feedColumns['isMasterProduct'])) {
        if (product.isMasterProduct) {
            productDetails.push("1");
        } else {
            productDetails.push("0");
        }
    }

    if (!empty(feedColumns['title'])) {
        if (product.title) {
            productDetails.push(product.title);
        } else {
            productDetails.push("");
        }
    }

    if (!empty(feedColumns['metaTitle'])) {
        if (product.metaTitle) {
            productDetails.push(product.metaTitle);
        } else {
            productDetails.push("");
        }
    }

    if (!empty(feedColumns['productName'])) {
        if (product.title) {
            productDetails.push(product.title);
        } else {
            productDetails.push("");
        }
    }

    if (!empty(feedColumns['description'])) {
        if (product.pageDescription) {
            productDetails.push(product.pageDescription);
        } else {
            productDetails.push("");
        }
    }

    if (!empty(feedColumns['descriptionGoogle'])) {
        if (product.pageDescription) {
            productDetails.push(product.pageDescription);
        } else {
            productDetails.push("");
        }
    }

    if (!empty(feedColumns['shortDescription'])) {
        if (product.description) {
            productDetails.push(product.description);
        } else {
            productDetails.push("");
        }
    }

    if (!empty(feedColumns['price'])) {
        if (product.price) {
            productDetails.push(product.price);
        } else {
            productDetails.push("");
        }
    }

    if (!empty(feedColumns['decimalPrice'])) {
        if (product.decimalPrice) {
            productDetails.push(product.decimalPrice);
        } else {
            productDetails.push("");
        }
    }

    if (!empty(feedColumns['decimalPriceMCSUS'])) {
        if (product.salePrice != "") {
            productDetails.push(product.salePrice)
        } else {
            productDetails.push(product.decimalPrice || "");
        }
    }

    if (!empty(feedColumns['salePrice'])) {
        if (product.salePrice) {
            productDetails.push(product.salePrice)
        } else {
            productDetails.push("");
        }
    }

    if (!empty(feedColumns['salePriceEffectiveDate'])) {
        if (product.salePrice) {
            productDetails.push(product.salePriceEffectiveDate)
        } else {
            productDetails.push("");
        }
    }

    if (!empty(feedColumns['link'])) {
        if (product.producturl) {
            productDetails.push(product.producturl);
        } else {
            productDetails.push("");
        }
    }

    if (!empty(feedColumns['imageLink'])) {
        if (product.imageurl) {
            productDetails.push(product.imageurl);
        } else {
            productDetails.push("");
        }
    }

    if (!empty(feedColumns['imageLinkSmartGift'])) {
        if (product.smartGiftImageURL) {
            productDetails.push(product.smartGiftImageURL);
        } else {
            productDetails.push("");
        }
    }

    if (!empty(feedColumns['imageLinkDataFeedWatch'])) {
        if (product.imageurl) {
            productDetails.push(product.imageurl);
        } else {
            productDetails.push("");
        }
    }

    if (!empty(feedColumns['additionalImageLink'])) {
        if (product.isWristedImage == 'Wrist-Shot') {
            productDetails.push(product.additionalImageLink)
        } else {
            productDetails.push("");
        }
    }

    if (!empty(feedColumns['availability'])) {
        switch (product.availability) {
            case "PREORDER":
                productDetails.push("preorder");
                break;
            case "NOT_AVAILABLE":
                productDetails.push("out of stock");
                break;
            case "IN_STOCK":
                productDetails.push("in stock");
                break;
            default:
                productDetails.push("");
                break;
        }
    }

    if (!empty(feedColumns['availabilityDataFeedWatch'])) {
        switch (product.availability) {
            case "PREORDER":
                productDetails.push("pre order");
                break;
            case "NOT_AVAILABLE":
                productDetails.push("out of stock");
                break;
            case "IN_STOCK":
                productDetails.push("in stock");
                break;
            default:
                productDetails.push("");
                break;
        }
    }

    if (!empty(feedColumns['online/offline'])) {
        if (product.instock) {
            productDetails.push("online");
        } else {
            productDetails.push("offline");
        }
    }

    if (!empty(feedColumns['productType'])) {
        if (product.jewelryType) {
            productDetails.push(product.jewelryType);
        } else {
            productDetails.push("");
        }
    }

    if (!empty(feedColumns['productTypeGoogle'])) {
        if (product.jewelryStyle) {
            productDetails.push(product.jewelryStyle);
        } else {
            productDetails.push("");
        }
    }

    if (!empty(feedColumns['productTypeDataFeedWatch'])) {
        if (product.jewelryType) {
            productDetails.push(product.jewelryType);
        } else {
            productDetails.push("");
        }
    }

    if (!empty(feedColumns['categories'])) {
        if (categoriesPath) {
            productDetails.push(categoriesPath);
        } else {
            productDetails.push("");
        }
    }

    if (!empty(feedColumns['googleProductCategory'])) {
        if (product.googleCategoryPath) {
            productDetails.push(product.googleCategoryPath);
        } else {
            productDetails.push("");
        }
    }

    if (!empty(feedColumns['ProductCategory'])) {
        if (product.categoryPath) {
            productDetails.push(product.categoryPath);
        } else {
            productDetails.push("");
        }
    }

    if (!empty(feedColumns['condition'])) {
        productDetails.push("new");
    }

    if (!empty(feedColumns['gtin'])) {
        if (product.gtin) {
            productDetails.push(product.gtin);
        } else {
            productDetails.push("");
        }
    }

    if (!empty(feedColumns['mpn'])) {
        if (product.ID) {
            productDetails.push(product.ID);
        } else {
            productDetails.push("");
        }
    }

    if (!empty(feedColumns['brand'])) {
        if (product.brand) {
            productDetails.push(product.brand)
        } else {
            productDetails.push("");
        }
    }

    if (!empty(feedColumns['color'])) {
        if (product.color) {
            productDetails.push(product.color)
        } else {
            productDetails.push("");
        }
    }

    if (!empty(feedColumns['size'])) {
        if (product.dialStyle) {
            productDetails.push(product.dialStyle)
        } else {
            productDetails.push("");
        }
    }

    if (!empty(feedColumns['gender'])) {
        if (product.gender) {
            productDetails.push(product.gender);
        } else {
            productDetails.push("");
        }
    }

    if (!empty(feedColumns['ageGroup'])) {
        productDetails.push("adult");
    }

    if (!empty(feedColumns['customLabel0'])) {
        if (product.googleCategoryPath) {
            productDetails.push(product.googleCategoryPath);
        } else {
            productDetails.push("");
        }
    }

    if (!empty(feedColumns['customLabel1'])) {
        if (product.color) {
            productDetails.push(product.color)
        } else {
            productDetails.push("");
        }
    }

    if (!empty(feedColumns['customLabel2'])) {
        productDetails.push(product.isWristedImage);
    }

    if (!empty(feedColumns['customLabel3'])) {
        if (product.familyName) {
            productDetails.push(product.familyName)
        } else {
            productDetails.push("");
        }
    }

    if (!empty(feedColumns['longDescription'])) {
        if (product.longDescription) {
            productDetails.push(product.longDescription);
        } else {
            productDetails.push("");
        }
    }

    if (!empty(feedColumns['width'])) {
        if (product.width) {
            productDetails.push(product.width);
        } else {
            productDetails.push("");
        }
    }

    if (!empty(feedColumns['rating'])) {
        productDetails.push("");
    }

    if (!empty(feedColumns['productLabel'])) {
        if (product.label) {
            productDetails.push(product.label);
        } else {
            productDetails.push("");
        }
    }

    if (!empty(feedColumns['fontFamily'])) {
        if (product.familyName) {
            productDetails.push(product.familyName)
        } else {
            productDetails.push("");
        }
    }

    if (!empty(feedColumns['priceUSD'])) {
        if (product.priceUSD) {
            productDetails.push(product.priceUSD)
        } else {
            productDetails.push("");
        }
    }

    if (!empty(feedColumns['priceGBP'])) {
        if (product.priceGBP) {
            productDetails.push(product.priceGBP)
        } else {
            productDetails.push("");
        }
    }

    if (!empty(feedColumns['priceCAD'])) {
        if (product.priceCAD) {
            productDetails.push(product.priceCAD)
        } else {
            productDetails.push("");
        }
    }

    if (!empty(feedColumns['priceEUR'])) {
        if (product.priceEUR) {
            productDetails.push(product.priceEUR)
        } else {
            productDetails.push("");
        }
    }

    if (!empty(feedColumns['priceAUD'])) {
        if (product.priceAUD) {
            productDetails.push(product.priceAUD)
        } else {
            productDetails.push("");
        }
    }

    if (!empty(feedColumns['caseDiameter'])) {
        if (product.priceAUD) {
            productDetails.push(product.caseDiameter)
        } else {
            productDetails.push("");
        }
    }

    if (!empty(feedColumns['price_CA'])) {
        if (product.price_CA) {
            productDetails.push(product.price_CA)
        } else {
            productDetails.push("");
        }
    }

    if (!empty(feedColumns['price_GBP'])) {
        if (product.price_GBP) {
            productDetails.push(product.price_GBP)
        } else {
            productDetails.push("");
        }
    }

    if (!empty(feedColumns['price_EUR'])) {
        if (product.price_EUR) {
            productDetails.push(product.price_EUR)
        } else {
            productDetails.push("");
        }
    }

    if (!empty(feedColumns['price_MXN'])) {
        if (product.price_MXN) {
            productDetails.push(product.price_MXN)
        } else {
            productDetails.push("");
        }
    }

    if (!empty(feedColumns['price_SGD'])) {
        if (product.price_SGD) {
            productDetails.push(product.price_SGD)
        } else {
            productDetails.push("");
        }
    }

    if (!empty(feedColumns['price_MYR'])) {
        if (product.price_MYR) {
            productDetails.push(product.price_MYR)
        } else {
            productDetails.push("");
        }
    }

    if (!empty(feedColumns['price_CHF'])) {
        if (product.price_CHF) {
            productDetails.push(product.price_CHF)
        } else {
            productDetails.push("");
        }
    }

    if (!empty(feedColumns['price_HKD'])) {
        if (product.price_HKD) {
            productDetails.push(product.price_HKD)
        } else {
            productDetails.push("");
        }
    }

    if (!empty(feedColumns['salePrice_CA'])) {
        if (product.salePrice_CA) {
            productDetails.push(product.salePrice_CA)
        } else {
            productDetails.push("");
        }
    } 

    if (!empty(feedColumns['salePrice_GBP'])) {
        if (product.salePrice_GBP) {
            productDetails.push(product.salePrice_GBP)
        } else {
            productDetails.push("");
        }
    } 

    if (!empty(feedColumns['salePrice_EUR'])) {
        if (product.salePrice_EUR) {
            productDetails.push(product.salePrice_EUR)
        } else {
            productDetails.push("");
        }
    } 

    if (!empty(feedColumns['sale_price_effective_date_CA'])) {
        if (product.salePrice_CA) {
            productDetails.push(product.sale_price_effective_date_CA)
        } else {
            productDetails.push("");
        }
    }

    if (!empty(feedColumns['sale_price_effective_date_UK'])) {
        if (product.salePrice_GBP) {
            productDetails.push(product.sale_price_effective_date_UK)
        } else {
            productDetails.push("");
        }
    }

    if (!empty(feedColumns['link_CA'])) {
        if (product.link_CA) {
            productDetails.push(product.link_CA)
        } else {
            productDetails.push("");
        }
    }

    if (!empty(feedColumns['availability_CA'])) {
        switch (product.availability_CA) {
            case "NOT_AVAILABLE":
                productDetails.push("out of stock");
                break;
            case "IN_STOCK":
                productDetails.push("in stock");
                break;
            default:
                productDetails.push("");
                break;
        }
    }

    if (!empty(feedColumns['price_FR'])) {
        if (product.price_FR) {
            productDetails.push(product.price_FR)
        } else {
            productDetails.push("");
        }
    }

    if (!empty(feedColumns['salePrice_FR'])) {
        if (product.salePrice_FR) {
            productDetails.push(product.salePrice_FR)
        } else {
            productDetails.push("");
        }
    }

    if (!empty(feedColumns['sale_price_effective_date_FR'])) {
        if (product.salePrice_FR) {
            productDetails.push(product.sale_price_effective_date_FR)
        } else {
            productDetails.push("");
        }
    }

    if (!empty(feedColumns['link_FR'])) {
        if (product.link_FR) {
            productDetails.push(product.link_FR)
        } else {
            productDetails.push("");
        }
    }

    if (!empty(feedColumns['availability_FR'])) {
        switch (product.availability_FR) {
            case "NOT_AVAILABLE":
                productDetails.push("out of stock");
                break;
            case "IN_STOCK":
                productDetails.push("in stock");
                break;
            default:
                productDetails.push("");
                break;
        }
    }

    fileArgs.csvStreamWriter.writeNext(productDetails);
    productDetails = [];
}

function getProductAttributes(product, feedParameters, feedColumns) {
    var productPrice = product.getPriceModel().getPrice() ? product.getPriceModel().getPrice().value : "";
    if (product.getPriceModel().getPrice()) {
        if (product.getPriceModel().getPrice().decimalValue) {
            var productDecimalPrice = product.getPriceModel().getPrice().decimalValue.toString()
        }
    }
    var saleEffectiveDate = '';
    if (!empty(getProductPromoAndSalePrice(product).storefrontPromo)) {
        saleEffectiveDate = getProductPromoAndSalePrice(product).salePriceEffectiveDate;
    }
    var productSalePriceCurrencyCode = getProductPromoAndSalePrice(product).salePrice != "" ? product.getPriceModel().getPrice().currencyCode : "";
    var productCurrencyCode = product.getPriceModel().getPrice() != null ? product.getPriceModel().getPrice().currencyCode : "";
    var productImages = getProductImageURL(product);
    var jewelryStyle = product.custom.jewelryStyle ? product.custom.jewelryStyle : "";
    var jewelryType = product.custom.jewelryType ? product.custom.jewelryType : "";
    var productAttributes = {
        ID: product.ID,
        title: product.name,
        metaTitle: product.pageTitle,
        imageurl: productImages.firstImageLink,
        additionalImageLink: productImages.additionalImageLink ? productImages.additionalImageLink : "",
        producturl: URLUtils.url('Product-Show', 'pid', product.ID).abs().toString(),
        description: product.getShortDescription(),
        decimalPrice: productDecimalPrice + " " + productCurrencyCode,
        label: product.custom.label ? product.custom.label : "",
        price: productPrice + " " + productCurrencyCode,
        salePrice: getProductPromoAndSalePrice(product).salePrice ? getProductPromoAndSalePrice(product).salePrice + " " + productSalePriceCurrencyCode : "",
        salePriceEffectiveDate: saleEffectiveDate,
        instock: product.onlineFlag,
        brand: product.brand ? product.brand : "",
        color: product.custom.color ? product.custom.color : "",
        dialStyle: product.custom.dialStyle ? product.custom.dialStyle : "",
        familyName: buildStringAttributes(product.custom.familyName, feedParameters),
        gtin: product.custom.gtins ? product.custom.gtins : "",
        jewelryType: jewelryType,
        masterProductID: product.ID,
        productType: false,
        longDescription: product.getLongDescription(),
        gender: product.custom.watchGender ? buildStringAttributes(product.custom.watchGender, feedParameters) : "",
        width: product.custom.width ? product.custom.width : "",
        isMasterProduct: product.master ? true : false,
        jewelryStyle: jewelryStyle,
        googleCategoryPath: Constants.GOOGLE_CATEGORY_PATH + jewelryStyle,
        categoryPath: Constants.GOOGLE_CATEGORY_PATH + jewelryType,
        isWristedImage: productImages.isWristedImage ? "Wrist-Shot" : "Non Wrist-Shot",
        smartGiftImageURL: productImages.firstImageLinkSmartGift,
        availability: product.availabilityModel.availabilityStatus,
        caseDiameter: product.custom.caseDiameter ? product.custom.caseDiameter : "",
        pageDescription: product.pageDescription,
        link_CA: URLUtils.url('Product-Show', 'pid', product.ID, 'country', Constants.COUNTRY_CA).abs().toString(),
        link_FR: URLUtils.url('Product-Show', 'pid', product.ID, 'country', Constants.COUNTRY_FR).abs().toString(),
    };

    //Custom Columns for MovadoUS and OBUK
    if (!empty(feedColumns['price_CA'])) {
        productAttributes.price_CA = getProductPriceByCurrencyCode(product, Constants.CURRENCY_CAD) + " " + Constants.CURRENCY_CAD;
    }
    if (!empty(feedColumns['price_GBP'])) {
        productAttributes.price_GBP = getProductPriceByCurrencyCode(product, Constants.CURRENCY_GBP) + " " + Constants.CURRENCY_GBP;
    }
    if (!empty(feedColumns['price_EUR'])) {
        productAttributes.price_EUR = getProductPriceByCurrencyCode(product, Constants.CURRENCY_EUR) + " " + Constants.CURRENCY_EUR;
    }
    if (!empty(feedColumns['price_MXN'])) {
        productAttributes.price_MXN = getProductPriceByCurrencyCode(product, Constants.CURRENCY_MXN) + " " + Constants.CURRENCY_MXN;
    }
    if (!empty(feedColumns['price_SGD'])) {
        productAttributes.price_SGD = getProductPriceByCurrencyCode(product, Constants.CURRENCY_SGD) + " " + Constants.CURRENCY_SGD;
    }
    if (!empty(feedColumns['price_MYR'])) {
        productAttributes.price_MYR = getProductPriceByCurrencyCode(product, Constants.CURRENCY_MYR) + " " + Constants.CURRENCY_MYR;
    }
    if (!empty(feedColumns['price_CHF'])) {
        productAttributes.price_CHF = getProductPriceByCurrencyCode(product, Constants.CURRENCY_CHF) + " " + Constants.CURRENCY_CHF;
    }
    if (!empty(feedColumns['price_HKD'])) {
        productAttributes.price_HKD = getProductPriceByCurrencyCode(product, Constants.CURRENCY_HKD) + " " + Constants.CURRENCY_HKD;
    }
    if (!empty(feedColumns['salePrice_CA'])) {
        productAttributes.salePrice_CA = getPromotionalPricePerPriceBook(Constants.CURRENCY_CAD, product, true).productDecimalPrice;
    }
    if (!empty(feedColumns['sale_price_effective_date_CA'])) {
        productAttributes.sale_price_effective_date_CA = getPromotionalPricePerPriceBook(Constants.CURRENCY_CAD, product, true).salePriceEffectiveDate;
    }
    if (!empty(feedColumns['salePrice_GBP'])) {
        productAttributes.salePrice_GBP = getPromotionalPricePerPriceBook(Constants.CURRENCY_GBP, product, true).productDecimalPrice;
    }

    if (!empty(feedColumns['salePrice_EUR'])) {
        productAttributes.salePrice_EUR = getPromotionalPricePerPriceBook(Constants.CURRENCY_EUR, product, true).productDecimalPrice;
    }
    if (!empty(feedColumns['sale_price_effective_date_UK'])) {
        productAttributes.sale_price_effective_date_UK = getPromotionalPricePerPriceBook(Constants.CURRENCY_GBP, product, true).salePriceEffectiveDate;
    }
    if (!empty(feedColumns['availability_CA'])) {
        productAttributes.availability_CA = getProductAvailability(product, Constants.COUNTRY_CA);
    }
    if (!empty(feedColumns['price_FR'])) {
        productAttributes.price_FR = getProductPriceByCurrencyCode(product, Constants.CURRENCY_EUR) + " " + Constants.CURRENCY_EUR;
    }
    if (!empty(feedColumns['salePrice_FR'])) {
        productAttributes.salePrice_FR = getPromotionalPricePerPriceBook(Constants.CURRENCY_EUR, product, true).productDecimalPrice;
    }
    if (!empty(feedColumns['sale_price_effective_date_FR'])) {
        productAttributes.sale_price_effective_date_FR = getPromotionalPricePerPriceBook(Constants.CURRENCY_EUR, product, true).salePriceEffectiveDate;
    }
    if (!empty(feedColumns['availability_FR'])) {
        productAttributes.availability_FR = getProductAvailability(product, Constants.COUNTRY_FR);
    }
    //End Custom Columns for MovadoUS and OBUK
    
    if (!empty(feedColumns['priceUSD'])) {
        productAttributes.priceUSD = getPromotionalPricePerPriceBook(Constants.CURRENCY_USD, product).productDecimalPrice;
    }
    if (!empty(feedColumns['priceGBP'])) {
        productAttributes.priceGBP = getPromotionalPricePerPriceBook(Constants.CURRENCY_GBP, product).productDecimalPrice;
    }
    if (!empty(feedColumns['priceCAD'])) {
        productAttributes.priceCAD = getPromotionalPricePerPriceBook(Constants.CURRENCY_CAD, product).productDecimalPrice;
    }
    if (!empty(feedColumns['priceEUR'])) {
        productAttributes.priceEUR = getPromotionalPricePerPriceBook(Constants.CURRENCY_EUR, product).productDecimalPrice;
    }
    if (!empty(feedColumns['priceAUD'])) {
        productAttributes.priceAUD = getPromotionalPricePerPriceBook(Constants.CURRENCY_AUD, product).productDecimalPrice;
    }

    return productAttributes;
}

function getProductPriceByCurrencyCode(product, currencyCode) {
    var Currency = require('dw/util/Currency');
    var defaultCurrency;
    var productPrice;
    if (currencyCode) {
        defaultCurrency = session.getCurrency();
        session.setCurrency(Currency.getCurrency(currencyCode));
    }
    productPrice = product.getPriceModel().getPrice() ? product.getPriceModel().getPrice().value : "";
    if (currencyCode && defaultCurrency) {
        session.setCurrency(defaultCurrency);
    }
    return productPrice;
}

function getProductAvailability(product, country) {
    var result = 'NOT_AVAILABLE';
    if (product.custom.eswProductRestrictedCountries) {
       var value = product.custom.eswProductRestrictedCountries.filter(function (restrictedCountry) {
            return restrictedCountry == country
        });
        if (!empty(value)) {
            return 'NOT_AVAILABLE';
        }
    }

    if (product.availabilityModel.inStock) {
        result = 'IN_STOCK';
    }
    return result;
}

function getProductVariants(products, masterProductAttributes, isVariant, feedParameters, feedColumns) {
    var variants = new Array();
    if (products.length !== 0) {
        var productIt = products.iterator();
        while (productIt.hasNext()) {
            var product = productIt.next();
            var variantJSON = {};
            variantJSON.product = getProductAttributes(product, feedParameters, feedColumns);
            variantJSON.product.masterProductID = masterProductAttributes.ID;
            variantJSON.product.productType = true;
            if (empty(variantJSON.product.description)) {
                variantJSON.product.description = masterProductAttributes.description;
            }

            if (empty(variantJSON.product.name)) {
                variantJSON.product.name = masterProductAttributes.name;
            }

            variants.push(variantJSON);
        }
    }
    return variants;
}

function getProductImageURL(product) {
    var ProductFactory = require('*/cartridge/scripts/factories/product');
    var firstImageLinkSmartGift = null;
    var params = {
        pid: product.ID
    }
    var productFactory = ProductFactory.get(params);

    if (!empty(productFactory) && !empty(productFactory.images) && !empty(productFactory.images.pdp533[0])) {
        firstImageLinkSmartGift = productFactory.images.pdp533[0].url != null ? productFactory.images.pdp533[0].url : null;
    }

    var firstImageLink = product.getImage("large", 0) != null ? product.getImage("large", 0).absURL.toString() : null;
    var imageList = product.getImages("large");
    var additionalImageLink = '';
    var isWristedImage = '';
    if (!empty(imageList)) {
        for (var i = 0; i < imageList.length; i++) {
            additionalImageLink = imageList[i].absURL.toString();
            if (!empty(additionalImageLink) && ((additionalImageLink.indexOf("wrist") > -1 || (additionalImageLink.indexOf("Wrist") > -1)))) {
                isWristedImage = additionalImageLink;
                break;
            }
        }
    }

    return { firstImageLink: firstImageLink, additionalImageLink: additionalImageLink, isWristedImage: isWristedImage, firstImageLinkSmartGift: firstImageLinkSmartGift }
}

function getProductPromoAndSalePrice(product) {
    var Currency = require('dw/util/Currency');
    var salePrice = '';
    var PromotionIt = PromotionMgr.activePromotions.getProductPromotions(product).iterator();
    var promotionalPrice = Money.NOT_AVAILABLE;
    var currentPromotionalPrice = Money.NOT_AVAILABLE;
    var storefrontPromo;
    var salePriceEffectiveDate;
    
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
                storefrontPromo = promo;
                salePriceEffectiveDate = getSalePriceEffectiveDate(promo, product);
            } else if (promotionalPrice.value == 0) {
                if ((currentPromotionalPrice.value !== 0 && currentPromotionalPrice.value !== null)) {
                    promotionalPrice = currentPromotionalPrice;
                    storefrontPromo = promo;
                    salePriceEffectiveDate = getSalePriceEffectiveDate(promo, product);
                }
            }
        }
    }

    if (promotionalPrice.available) {
        salePrice = promotionalPrice.decimalValue.toString();
    }
    
    return {
        storefrontPromo: storefrontPromo,
        salePrice: salePrice,
        salePriceEffectiveDate: salePriceEffectiveDate
    };
}

function buildCategoryPath(categories, feedParameters) {
    var categoriesIt = categories.iterator();
    var categoryList = new Array();
    while (categoriesIt.hasNext()) {
        var category = categoriesIt.next();
        var categoryArray = new ArrayList();
        while (!empty(category)) {
            if ((!empty(category.displayName)) && category.ID !== 'root' && category.online) {
                categoryArray.add(category.displayName);
                category = category.parent;
            } else {
                category = null;
            }
        }
        categoryArray.reverse();
        categoryList.push(categoryArray.join(feedParameters.angleSeparator));
        var replacedCategoryList = categoryList.join(',').replace(/,/g, feedParameters.pipeSeparator).split();
    }
    return replacedCategoryList;
}

function buildStringAttributes(attributeArray, feedParameters) {
    var attribute;
    attributeArray.forEach(function (item) {
        if (attribute) {
            attribute = attribute + feedParameters.semiColonSeparator + item;
        } else {
            attribute = item;
        }
    })
    return attribute;
}

/**
 * This method is used to get price of a product after promotion
 * if promotion is not applicable method will return actual price in decimal
 * @param {String} currencyCode
 * @param {dw.catalog.Product} product
 * @returns {String} product price decimal.
 */

function getPromotionalPricePerPriceBook(currencyCode, product, skipOriginalPrice) {
    var Transaction = require('dw/system/Transaction');
    var Currency = require('dw/util/Currency');
    var promotionalPrice;
    var productDecimalPrice = '';
    var defaultCurrency;

    Transaction.wrap(function () {
    
    if (currencyCode) {
        defaultCurrency = session.getCurrency();
        var currency = Currency.getCurrency(currencyCode);
        session.setCurrency(currency);
    }
        promotionalPrice = getProductPromoAndSalePrice(product).salePrice;
        salePriceEffectiveDate = getProductPromoAndSalePrice(product).salePriceEffectiveDate;
    });
    if (promotionalPrice > 0) {
        productDecimalPrice = promotionalPrice;
    } else if(!skipOriginalPrice) {
        if (product.getPriceModel().getPrice()) {
            if (product.getPriceModel().getPrice().decimalValue) {
                productDecimalPrice = product.getPriceModel().getPrice().decimalValue.toString()
            }
        }
    }

    if (currencyCode && defaultCurrency) {
        session.setCurrency(defaultCurrency);
    }

    return {
        productDecimalPrice: productDecimalPrice !== '' ? productDecimalPrice + " " + currencyCode : '',
        salePriceEffectiveDate: salePriceEffectiveDate
    }
}

/**
 * This method is used to get end date of a product campaign after promotion
 * @param {dw.catalog.Product} promotion
 * @returns {Date} end date.
 */
function getSalePriceEffectiveDate(promotion) {
    var campaignStartingDate = '';
    var campaignEndingDate = '';
    var currentDateTime = new Calendar();
    if (!empty(promotion.campaign.startDate)) {
        campaignStartingDate = commonUtils.formatDateTimeISO_8601(new Calendar(promotion.campaign.startDate));
    } else {
        campaignStartingDate = commonUtils.formatDateTimeISO_8601(currentDateTime);
    }
    if (!empty(promotion.campaign.endDate)) {
        campaignEndingDate = commonUtils.formatDateTimeISO_8601(new Calendar(promotion.campaign.endDate));
    } else {
        currentDateTime.add(currentDateTime.YEAR, "1");
        campaignEndingDate = commonUtils.formatDateTimeISO_8601(currentDateTime);
    }

    return campaignStartingDate + Constants.PROMOTION_START_END_DATE_SEPARATOR + campaignEndingDate;
}

module.exports = {
    exportGoogleFeed: exportGoogleFeed,
    exportSmartGiftFeed: exportSmartGiftFeed,
    exportDataFeedWatch: exportDataFeedWatch
};
