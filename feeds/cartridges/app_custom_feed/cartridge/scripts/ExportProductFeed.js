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
    return {fileWriter : fileWriter, csvStreamWriter: csvStreamWriter, fileName: fileName};
}


function exportSmartGiftFeed(args) {
    Logger.info('exportSmartGiftFeed Started');
    var targetFolder = args.targetFolder;
    var fileName = args.fileName;
    var feedColumnsSmartGift = {
            "ID" : 1,
            "masterProductID" : 2,
            "title" : 3,
            "price" : 4,
            "link" : 5,
            "description" : 6,
            "longDescription" : 7,
            "imageLinkSmartGift": 8,
            "availability" : 9,
            "color" : 10,
            "size" : 11,
            "width" :12,
            "categories" : 13,
            "rating" : 14,
            "gender" : 15,
            "isMasterProduct" : 16
    }
    var feedParametersSmartGift = {
            "colonSeparator" : Constants.COLON_SEPARATOR,
            "angleSeparator" : Constants.ANGLE_SEPARATOR,
            "pipeSeparator" : Constants.PIPE_SEPARATOR,
            "semiColonSeparator" : Constants.SEMICOLON_SEPARATOR,
            "categories" : true
    }
    var fileArgs = createDirectoryAndFile(targetFolder, fileName);
    exportFeed(feedColumnsSmartGift, fileArgs, feedParametersSmartGift);
}

function exportGoogleFeed(args) {
    var targetFolder = args.targetFolder;
    var fileName = args.fileName;
    var feedColumnsGoogle = {};
    if(Site.current.ID === 'MovadoUS' || Site.current.ID === 'MCSUS') {
        feedColumnsGoogle = {
            "ID" : 1,
            "metaTitle" : 2,
            "description" : 3,
            "decimalPrice" : 4,
            "link" : 5,
            "imageLink" : 6,
            "availability" : 7,
            "productType" : 8,
            "ProductCategory": 9,
            "condition" : 10,
            "gtin" : 11,
            "mpn" : 12,
            "brand" : 13,
            "color" : 14,
            "gender" : 15,
            "ageGroup" : 16,
            "productLabel" : 17,
            "fontFamily" : 18
                }
    } else {
        feedColumnsGoogle = {
            "ID" : 1,
            "metaTitle" : 2,
            "descriptionGoogle" : 3,
            "decimalPrice" : 4,
            "link" : 5,
            "imageLink" : 6,
            "additionalImageLink" : 7,
            "availability" : 8,
            "productTypeGoogle" : 9,
            "googleProductCategory": 10,
            "condition" : 11,
            "gtin" : 12,
            "mpn" : 13,
            "brand" : 14,
            "color" : 15,
            "size" : 16,
            "gender" : 17,
            "ageGroup" : 18, 
            "customLabel0" : 19,
            "customLabel1" : 20,
            "customLabel2" : 21,
            "customLabel3" : 22
        }
    }

    var feedParametersGoogle = {
            "colonSeparator" : Constants.COLON_SEPARATOR,
            "angleSeparator" : Constants.ANGLE_SEPARATOR,
            "pipeSeparator" : Constants.PIPE_SEPARATOR,
            "semiColonSeparator" : Constants.SEMICOLON_SEPARATOR,
            "skipMissingProductTypeSKUs" : false
    }

    var fileArgs = createDirectoryAndFile(targetFolder, fileName);
    exportFeed(feedColumnsGoogle, fileArgs, feedParametersGoogle);
}

function exportDataFeedWatch(args) {
    var targetFolder = args.targetFolder;
    var fileName = args.fileName;
    var feedColumnsDataFeedWatch = {
        "sku" : 1,
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
        "colonSeparator" : Constants.COLON_SEPARATOR,
        "angleSeparator" : Constants.ANGLE_SEPARATOR,
        "pipeSeparator" : Constants.PIPE_SEPARATOR,
        "semiColonSeparator" : Constants.SEMICOLON_SEPARATOR
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

                if(feedParameters.categories) {
                    var categoriesPath = buildCategoryPath(product.getOnlineCategories(), feedParameters);
                }

                writeCSVLine(productAttributes, categoriesPath, feedColumns, fileArgs);
                if (product.master) {
                    var isVariant = true;
                    var productVariants = getProductVariants(product.getVariants(), productAttributes, isVariant, feedParameters, feedColumns);
                    productVariants.forEach(function(product) {
                        writeCSVLine(product.product, categoriesPath, feedColumns, fileArgs);
                    });
                }
            } catch (e) {
                Logger.error('Error occurred while adding product into feed. Product {0}: \n Error: {1} \n Message: {2} \n', product , e.stack, e.message);
            }
                
        }
    } catch(e) {
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

    if(!empty(feedColumns['priceUSD'])) {
        csvFileHeader.push("price - USD");
    }

    if(!empty(feedColumns['priceGBP'])) {
        csvFileHeader.push("price - GBP");
    }

    if(!empty(feedColumns['priceCAD'])) {
        csvFileHeader.push("price - CAD");
    }

    if(!empty(feedColumns['priceEUR'])) {
        csvFileHeader.push("price - EUR");
    }

    if(!empty(feedColumns['priceAUD'])) {
        csvFileHeader.push("price - AUD");
    }

    if(!empty(feedColumns['caseDiameter'])) {
        csvFileHeader.push("case diameter");
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

    if(!empty(feedColumns['productName'])) {
        if(product.title) {
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
        if (product.jewelryStyle) {
            productDetails.push(product.jewelryStyle);
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

    if(!empty(feedColumns['priceUSD'])) {
        if (product.priceUSD) {
            productDetails.push(product.priceUSD)
        } else {
            productDetails.push("");
        }
    }

    if(!empty(feedColumns['priceGBP'])) {
        if (product.priceGBP) {
            productDetails.push(product.priceGBP)
        } else {
            productDetails.push("");
        }
    }

    if(!empty(feedColumns['priceCAD'])) {
        if (product.priceCAD) {
            productDetails.push(product.priceCAD)
        } else {
            productDetails.push("");
        }
    }

    if(!empty(feedColumns['priceEUR'])) {
        if (product.priceEUR) {
            productDetails.push(product.priceEUR)
        } else {
            productDetails.push("");
        }
    }

    if(!empty(feedColumns['priceAUD'])) {
        if (product.priceAUD) {
            productDetails.push(product.priceAUD)
        } else {
            productDetails.push("");
        }
    }

    if(!empty(feedColumns['caseDiameter'])) {
        if (product.priceAUD) {
            productDetails.push(product.caseDiameter)
        } else {
            productDetails.push("");
        }
    }
    

    fileArgs.csvStreamWriter.writeNext(productDetails);
    productDetails = [];
}

function getProductAttributes(product, feedParameters, feedColumns) { 
    var productPrice = product.getPriceModel().getPrice() ? product.getPriceModel().getPrice().value : "";
    var productDecimalPrice = product.getPriceModel().getPrice() ? (product.getPriceModel().getPrice().decimalValue ? product.getPriceModel().getPrice().decimalValue.toString() : "") : "";
    var productCurrencyCode = product.getPriceModel().getPrice() != null ? product.getPriceModel().getPrice().currencyCode : "";
    var productImages = getProductImageURL(product);
    var jewelryStyle = product.custom.jewelryStyle ? product.custom.jewelryStyle : "";
    var jewelryType = product.custom.jewelryType ? product.custom.jewelryType : "";
    var productAttributes = {
        ID: product.ID,
        title: product.name,
        metaTitle : product.pageTitle,
        imageurl: productImages.firstImageLink,
        additionalImageLink : productImages.additionalImageLink ? productImages.additionalImageLink : "",
        producturl: URLUtils.url('Product-Show', 'pid', product.ID).abs().toString(),
        description: product.getShortDescription(),
        decimalPrice : productDecimalPrice + " " + productCurrencyCode,
        label : product.custom.label ? product.custom.label : "",
        price:  productPrice + " " + productCurrencyCode,
        salePrice: getProductSalePrice(product),
        instock: product.onlineFlag,
        brand : product.brand ? product.brand : "",
        color : product.custom.color ? product.custom.color : "",
        dialStyle : product.custom.dialStyle ? product.custom.dialStyle : "",
        familyName : buildStringAttributes(product.custom.familyName, feedParameters),
        gtin : product.custom.gtins ? product.custom.gtins : "",
        jewelryType : jewelryType,
        masterProductID : product.ID,
        productType : false,
        longDescription : product.getLongDescription(),
        gender : product.custom.watchGender ? buildStringAttributes(product.custom.watchGender, feedParameters) : "",
        width : product.custom.width ? product.custom.width : "",
        isMasterProduct : product.master ? true : false,
        jewelryStyle : jewelryStyle,
        googleCategoryPath : Constants.GOOGLE_CATEGORY_PATH + jewelryStyle,
        categoryPath : Constants.GOOGLE_CATEGORY_PATH + jewelryType,
        isWristedImage : productImages.isWristedImage ? "Wrist-Shot" : "Non Wrist-Shot",
        smartGiftImageURL : productImages.firstImageLinkSmartGift,
        availability: product.availabilityModel.availabilityStatus,
        caseDiameter: product.custom.caseDiameter ? product.custom.caseDiameter : "",
        pageDescription: product.pageDescription
    };
    if (!empty(feedColumns['priceUSD'])) {
        productAttributes.priceUSD =  empty(commonUtils.isFixedPriceModelCurrency(Constants.COUNTRY_US)) ? commonUtils.getFXRates(Constants.CURRENCY_USD, Constants.COUNTRY_US, productPrice) : commonUtils.getProductPrice(product, Constants.CURRENCY_USD);
    }
    if (!empty(feedColumns['priceGBP'])) {
        productAttributes.priceGBP =  empty(commonUtils.isFixedPriceModelCurrency(Constants.COUNTRY_GB)) ? commonUtils.getFXRates(Constants.CURRENCY_GBP, Constants.COUNTRY_GB, productPrice) : commonUtils.getProductPrice(product, Constants.CURRENCY_GBP);
    }
    if (!empty(feedColumns['priceCAD'])) {    
        productAttributes.priceCAD = empty(commonUtils.isFixedPriceModelCurrency(Constants.COUNTRY_CA)) ? commonUtils.getFXRates(Constants.CURRENCY_CAD, Constants.COUNTRY_CA, productPrice) : commonUtils.getProductPrice(product, Constants.CURRENCY_CAD);
    }
    if (!empty(feedColumns['priceEUR'])) {
            productAttributes.priceEUR =  empty(commonUtils.isFixedPriceModelCurrency(Constants.COUNTRY_BE)) ? commonUtils.getFXRates(Constants.CURRENCY_EUR, Constants.COUNTRY_BE, productPrice) : commonUtils.getProductPrice(product, Constants.CURRENCY_EUR);
    }
    if (!empty(feedColumns['priceAUD'])) {
        productAttributes.priceAUD = empty(commonUtils.isFixedPriceModelCurrency(Constants.COUNTRY_AU)) ? commonUtils.getFXRates(Constants.CURRENCY_AUD, Constants.COUNTRY_AU, productPrice) : commonUtils.getProductPrice(product, Constants.CURRENCY_AUD);
    }
    return productAttributes;
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
        for (var i = 0; i < imageList.length; i++) {
            additionalImageLink = imageList[i].absURL.toString();
            if (!empty(additionalImageLink) && ((additionalImageLink.indexOf("wrist") > -1 || (additionalImageLink.indexOf("Wrist") > -1)))) {
                isWristedImage = additionalImageLink;
                break;
            }
       }

    return {firstImageLink: firstImageLink, additionalImageLink : additionalImageLink, isWristedImage : isWristedImage, firstImageLinkSmartGift : firstImageLinkSmartGift}
}

function getProductSalePrice(product) {
    var salePrice = '';
    var PromotionIt = PromotionMgr.activePromotions.getProductPromotions(product).iterator();
    var promotionalPrice = Money.NOT_AVAILABLE;
    while (PromotionIt.hasNext()) {
        var promo = PromotionIt.next();
        if (promo.getPromotionClass() != null && promo.getPromotionClass().equals(Promotion.PROMOTION_CLASS_PRODUCT)) {
            if (product.optionProduct) {
                promotionalPrice = promo.getPromotionalPrice(product, product.getOptionModel());
            } else {
                promotionalPrice = promo.getPromotionalPrice(product);
            }
        }
    }

    if (promotionalPrice.available) {
        salePrice = promotionalPrice.toNumberString();
    }
    return salePrice;
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
    attributeArray.forEach(function(item){
        if (attribute) {
            attribute = attribute + feedParameters.semiColonSeparator + item;
        } else {
            attribute = item;
        }
    })
    return attribute;
}

module.exports = {
        exportGoogleFeed : exportGoogleFeed,
        exportSmartGiftFeed : exportSmartGiftFeed,
        exportDataFeedWatch : exportDataFeedWatch
    };
