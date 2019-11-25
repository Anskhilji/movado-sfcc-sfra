var Status = require('dw/system/Status');
var ProductMgr = require('dw/catalog/ProductMgr');
var Site = require('dw/system/Site');
var StringUtils = require('dw/util/StringUtils');
var Calendar = require('dw/util/Calendar');
var STATUS = {
	    FILE_EXIST: 'FILE_ALREADY_EXISTS',
	    NO_DATA: 'NO_DATA_TO_EXPORT'
};
var TIME_FORMAT = 'yyyyMMddHHmmss';

/**
 * PI Catalog export
 *
 * @param {array} options
 */
var piCatalog = function piCatalog(args, options) {
    var collections = require('*/cartridge/scripts/util/collections');
    var siteProducts = ProductMgr.queryAllSiteProducts().asList();

    try {
        if (siteProducts.length >= 0) {
            var File = require('dw/io/File');
            var FileWriter = require('dw/io/FileWriter');
            var FileHelper = require('*/cartridge/scripts/file/FileHelper');
            if (args.Filename) {
                var filePrefix = args.Filename;
            }
            else {
                var filePrefix = 'export_PI_catalog';
            }
            var targetFolder = args.TargetFolder;

				// create  target Folder folder if it doesn't exist
            new File([File.IMPEX, targetFolder].join(File.SEPARATOR));

				// Initializations
            FileHelper.createDirectory(File.IMPEX + '/' + targetFolder);
		        var filename = filePrefix + '_' + StringUtils.formatCalendar(new Calendar(), TIME_FORMAT) + '.txt';
		    	var writer = new FileWriter(new File(File.IMPEX + '/' + targetFolder + '/' + filename), 'UTF-8');

		    	var piAttributeMapping = Site.current.getCustomPreferenceValue('piCatalogAttributes');

		    	writer.writeLine(piAttributeMapping);

		    		collections.forEach(siteProducts, function (item) {
		    			if (item.getOnlineFlag()) {
		    				var skuID = getSkuID(item);
		    				var productName = getProductName(item);
		    				var productType = getProductType(item);
		    				var productLink = getProductLink(item);
		    				var imageLink = getImageLink(item);
		    				var regularPrice = getRegularPrice(item);
		    				var onlineAvailability = getOnlineAvailability(item);
		    				var productDescription = getProductDescription(item);
		    				var brandName = getBrandName(item);
		    				var color = getColor(item);
		    				var material = getMaterial(item);
		    				var keywords = getKeywords(item);

		    				var singleProductData = skuID + '|' + productName + '|' + productType + '|' + productLink + '|'
							+ imageLink + '|' + regularPrice + '|' + onlineAvailability + '|' + productDescription
							+ '|' + brandName + '|' + color + '|' + material + '|' + keywords;

		    				// writing data in file
		    				writer.writeLine(singleProductData);
		    			}
		    		});
        }
		 }		catch (e) {
        throw 'Exception: ' + e.message;
    }		finally {
			// Closing stream writer
        writer.close();
    }
};

/**
* Fetches the Sku ID of a product
* @param product.
* @returns Sku ID
*/
function getSkuID(product) {
    return product.getID();
}

/**
* Fetches the product name of a product
* @param product.
* @returns product Name
*/
function getProductName(product) {
    return product.getName() != null ? product.getName() : '';
}

/**
* Fetches the category assignments of a product
* @param product.
* @returns all category assignments separated by ~
*/
function getProductType(product) {
    var productType = concatCategoryAssignments(product.getCategoryAssignments());
    return productType != null ? productType : '';
}

/**
* Storefront PDP page URL of a product
* @param product.
* @returns product link
*/
function getProductLink(product) {
    var URLUtils = require('dw/web/URLUtils');
    var productLink = URLUtils.url('Product-Show', 'pid', product.getID());
    return (Site.getCurrent().getCustomPreferenceValue(
			'piCatalogProductLinkDomain') + productLink) != null ? (Site
			.getCurrent()
			.getCustomPreferenceValue('piCatalogProductLinkDomain') + productLink)
			: '';
}

/**
* Fetches the thumbnail image link  of a product
* @param product.
* @returns image link
*/
function getImageLink(product) {

	if (!empty(product.getImages('large').get(0)) && Site.getCurrent().getCustomPreferenceValue('piCatalogThumbnailImageParamsJSON') != null) {
		return getFinalUrlAsString(product.getImages('large').get(0).getHttpsImageURL(JSON.parse(Site.getCurrent().getCustomPreferenceValue('piCatalogThumbnailImageParamsJSON'))));
    }

    return '';
}

/**
* Fetches the regular price of a product
* @param product.
* @returns regular price
*/
function getRegularPrice(product) {
    var priceModel = product.getPriceModel();
    return priceModel.price != null ? priceModel.price : '';
}

/**
* Fetches the online availability of a product
* @param product.
* @returns boolean- true or false
*/
function getOnlineAvailability(product) {
    var defaultQuantity = 1;
    var availabilityModel = product.getAvailabilityModel();
    var availaibilityLevel = availabilityModel.getAvailabilityLevels(defaultQuantity);
    return (product.onlineFlag) && (availaibilityLevel.notAvailable.value === 0);
}

/**
* Fetches the product description of a product
* @param product.
* @returns product description
*/
function getProductDescription(product) {
    return product.shortDescription != null ? product.shortDescription : '';
}

/**
* Fetches the brand name of a product
* @param product.
* @returns brand Name
*/
function getBrandName(product) {
    return product.brand != null ? product.brand : '';
}

/**
* Fetches the list of colors for a product
* @param product.
* @returns string of colors separated by ~ sign
*/
function getColor(product) {
    return product.custom.color != null ? product.custom.color : '';
}

/**
* Fetches the material of a product
* @param product.
* @returns product Name
*/
function getMaterial(product) {
    return product.custom.material != null ? product.custom.material : '';
}

/**
* Fetches the Page Keywords of a product
* @param product.
* @returns list of Page Keywords separated by ~ sign
*/
function getKeywords(product) {
    var pageKeywords = product.pageKeywords;
    if (pageKeywords != null)		{ return (pageKeywords.replace(/,/g, '~')); }
    return '';
}

/**
* Concatenate a list into ~ separated String
* @param product.
* @returns String separated by ~
*/
function concatCategoryAssignments(categoryList) {
    var contatenatedString;
    for (var i = 0; i < categoryList.length; i++) {
        var catergoryString = categoryList[i];
        if (i == 0 && catergoryString != null && catergoryString.category != null) {
            contatenatedString = catergoryString.category.displayName;
        }		else if (catergoryString != null && catergoryString.category != null) {
            contatenatedString += '~' + catergoryString.category.displayName;
        }
    }
    return contatenatedString;
}

/**
 * If a URL replacement is used it would return the final URL, otherwise the given URL object
 */
function getFinalUrlAsString(imageURL) {
    // In case the site preference is set, update the instance used as image source
    let current = imageURL.toString();
    let replacement = Site.current.getCustomPreferenceValue('disImageSourceEnvironment');
    if (replacement && replacement.value) {
        return current.replace(/(^.*_)[a-zA-Z0-9]{3}(\/on\/demandware.*$)/, '$1' + replacement.value + '$2');
    }
    return current;
}

exports.piCatalog = piCatalog;
