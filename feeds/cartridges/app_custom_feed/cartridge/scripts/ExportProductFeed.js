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
            "imageLink": 8,
            "availability" : 9,
            "color" : 10,
            "size" : 11,
            "width" :12,
            "googleProductCategory" : 13,
            "rating" : 14,
            "gender" : 15,
            "isMasterProduct" : 16
    }
    var feedParametersSmartGift = {
            "colonSeparator" : Constants.COLON_SEPARATOR,
            "angleSeparator" : Constants.ANGLE_SEPARATOR,
            "pipeSeparator" : Constants.PIPE_SEPARATOR,
            "semiColonSeparator" : Constants.SEMICOLON_SEPARATOR
    }
    var fileArgs = createDirectoryAndFile(targetFolder, fileName);
    exportFeed(feedColumnsSmartGift, fileArgs, feedParametersSmartGift);
}

function exportGoogleFeed(args) {
    var targetFolder = args.targetFolder;
    var fileName = args.fileName;
    var feedColumnsGoogle = {
            "ID" : 1,
            "title" : 2,
            "description" : 3,
            "price" : 4,
            "link" : 5,
            "imageLink" : 6,
            "additionalImageLink" : 7,
            "availability" : 8,
            "productType" : 9,
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
    
    var feedParametersGoogle = {
            "colonSeparator" : Constants.COLON_SEPARATOR,
            "angleSeparator" : Constants.ANGLE_SEPARATOR,
            "pipeSeparator" : Constants.PIPE_SEPARATOR,
            "semiColonSeparator" : Constants.SEMICOLON_SEPARATOR,
            "singleCategory" : "singleCategory"
    }
    var fileArgs = createDirectoryAndFile(targetFolder, fileName);
    exportFeed(feedColumnsGoogle, fileArgs, feedParametersGoogle);
}

function exportFeed(feedColumns, fileArgs, feedParameters) {
    var logLocation = 'ExportProductFeed~generateProductFeed';
    try {
        fileArgs.csvStreamWriter.writeNext(buildCsvHeader(feedColumns));
        var productSearchHitsItr = getProductSearchHitIt();
        while (productSearchHitsItr.hasNext()) {
            var product = productSearchHitsItr.next().product;
            
            if (product.variant) {
                continue;
            }
            var productAttributes = getProductAttributes(product, feedParameters);
            var categoriesPath = buildCategoryPath(product.getOnlineCategories(), feedParameters, productAttributes);
            writeCSVLine(productAttributes, categoriesPath, feedColumns, fileArgs);
            if (product.master) {
                var isVariant = true;
                var productVariants = getProductVariants(product.getVariants(), productAttributes, isVariant, feedParameters);
                productVariants.forEach(function(product) {
                    writeCSVLine(product.product, categoriesPath, feedColumns, fileArgs);
                });
            }
            break;
        }
    } catch(e) {
        Logger.error('Error occurred while generating csv file for product feed:' + e);
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
    
    if (!empty(feedColumns['masterProductID'])) {
        csvFileHeader.push("item_group_id");
    }
    
    if (!empty(feedColumns['isMasterProduct'])) {
        csvFileHeader.push("is_master_product");
    }
    if (!empty(feedColumns['title'])) {
        csvFileHeader.push("title");
    }
    
    if (!empty(feedColumns['description'])) {
        csvFileHeader.push("description");
    }
    
    if (!empty(feedColumns['price'])) {
        csvFileHeader.push("price");
    }
    
    if (!empty(feedColumns['link'])) {
        csvFileHeader.push("link");
    }
    
    if (!empty(feedColumns['imageLink'])) {
        csvFileHeader.push("image_link");
    }
    
    if (!empty(feedColumns['additionImageLink'])) {
        csvFileHeader.push("additional_image_link");
    }
    
    if (!empty(feedColumns['availability'])) {
        csvFileHeader.push("availability");
    }
    
    if (!empty(feedColumns['productType'])) {
        csvFileHeader.push("product_type");
    }
    
    if (!empty(feedColumns['googleProductCategory'])) {
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
        
    if (!empty(feedColumns['description'])) {
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

    if (!empty(feedColumns['additionImageLink'])) {
        productDetails.push("");
    }

    if (!empty(feedColumns['availability'])) {
        productDetails.push("in stock");
    }

    if (!empty(feedColumns['productType'])) {
        if (product.jewelryType) {
            productDetails.push(product.jewelryType);
        } else {
            productDetails.push("");
        }
    }

    if (!empty(feedColumns['googleProductCategory'])) {
        if (categoriesPath) {
            productDetails.push(categoriesPath);
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
        productDetails.push("");
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
        if (categoriesPath) {
            productDetails.push(categoriesPath);
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
        productDetails.push("");
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
    
    fileArgs.csvStreamWriter.writeNext(productDetails);
    productDetails = [];
}

function getProductAttributes(product, feedParameters) {
    var productPrice = product.getPriceModel().getPrice();
    var productCurrencyCode = product.getPriceModel().getPrice() != null ? product.getPriceModel().getPrice().currencyCode : "";
    var productAttributes = {
            ID: product.ID,
            title: product.name,
            imageurl: getProductImageURL(product),
            producturl: URLUtils.url('Product-Show', 'pid', product.ID).abs().toString(),
            description: product.getShortDescription(),
            price:  productPrice + " " + productCurrencyCode,
            salePrice: getProductSalePrice(product),
            instock: product.onlineFlag,
            brand : product.brand ? product.brand : "",
            color : product.custom.color ? buildStringAttributes(product.custom.color, feedParameters) : "",
            dialStyle : product.custom.dialStyle ? product.custom.dialStyle : "",
            familyName : buildStringAttributes(product.custom.familyName, feedParameters),
            gtin : product.custom.gtins ? product.custom.gtins : "",
            jewelryType : product.custom.jewelryType ? product.custom.jewelryType : "",
            masterProductID : product.ID,
            productType : false,
            longDescription : product.getLongDescription(),
            gender : product.custom.watchGender ? buildStringAttributes(product.custom.watchGender, feedParameters) : "",
            width : product.custom.width ? product.custom.width : "",
            isMasterProduct : product.master ? true : false,
            googleCategoyrPath : "Apparel & Accessories>Jewelry >" + product.custom.jewelryStyle
            };
    return productAttributes;
}

function getProductVariants(products, masterProductAttributes, isVariant, feedParameters) {
    var variants = new Array();
    if (products.length !== 0) {
        var productIt = products.iterator();
        while (productIt.hasNext()) {
            var product = productIt.next();
            var variantJSON = {};
            variantJSON.product = getProductAttributes(product, feedParameters);
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
    var images = product.getImages('large');
    var imagesIt = images.iterator();
    return imagesIt.hasNext() ? imagesIt.next().absURL.toString() : null;
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

function buildCategoryPath(categories, feedParameters, productAttributes) {
    var categoriesIt = categories.iterator();
    var categoryList = new Array();
    var replacedCategoryList = [];
    if (feedParameters.singleCategory) {
        replacedCategoryList.push(productAttributes.googleCategoyrPath);
    } else {
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
            replacedCategoryList = categoryList.join(',').replace(/,/g, feedParameters.pipeSeparator).split();
        }
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
        exportSmartGiftFeed : exportSmartGiftFeed
    };
