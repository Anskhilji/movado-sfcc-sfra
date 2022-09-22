/**
Purpose: Loads product information needed by Listrak from DW Product object
*/

require('dw/system');
require('dw/catalog');
require('dw/util');
require('dw/web');
require('dw/content');

var ArrayList = require('dw/util/ArrayList');
var Promotion = require('dw/campaign/Promotion');
var PromotionMgr = require('dw/campaign/PromotionMgr');
var Logger = require('dw/system/Logger').getLogger('Listrak');
var Site = require('dw/system/Site');
var URLUtils = require('dw/web/URLUtils');

/**
 * Object that holds inflated product information.
 * */
function ltkProduct() {
    var viewtype = dw.system.Site.current.preferences.custom.Listrak_ProductImageViewType;

    this.sku = '';
    this.masterSku = '';
    this.variant = '';
    this.title = '';
    this.imageURL = '';
    this.linkURL = '';
    this.description = '';
    this.price = 0.00;
    this.brand = '';
    this.categories = [];
    this.QOH = 0;
    this.inStock = true;
    this.reviewProductID = '';
    this.SystemInStock = true;

    this.product = null;
    this.customViewType = dw.system.Site.current.preferences.custom.Listrak_ProductImageViewType;
    this.useAbsoluteImageURLs = dw.system.Site.current.preferences.custom.Listrak_UseAbsoluteImageURLs;
    this.useAbsoluteProductURLs = dw.system.Site.current.preferences.custom.Listrak_UseAbsoluteProductURLs;
    var catStartLevel = dw.system.Site.current.preferences.custom.Listrak_TopLevelCategory;
    this.categoryStartLevel = catStartLevel;
    this.additionalAttributes = dw.system.Site.current.preferences.custom.Listrak_Additional_Attributes;
    this.categoryLevelAttributes = Site.getCurrent().getCustomPreferenceValue('Listrak_CategoryLevelAttributes');
    this.additionalAttributeValues = new dw.util.HashMap();

    // Custom Start: Adding Product Sale information
    this.onSale = false;
    // Custom End:

    // Custom Start: Adding product catgory value
    this.categoryValue = '';

    // Custom Start: [MSS-1690 Adding Product Sale Price Information]
    this.salePrice = '';
    // Custom End:

    // Custom Start: [MSS-1696 Listrak - Create New Product Feed for MVMT - Add Gender]
    this.watchGender = '';
    // Custom End:

    // Custom Start: [MSS-1697 Add Collection URL, Strap Width, Case Diameter, Family Name to Listrak MVMT Product Feed]
    this.reviewURL = '';
    this.style = '';
    this.meta1 = '';
    this.size = '';
    this.meta4 = '';
    this.meta5 = '';
    // Custom End:
}

/* Method to load product URLs only. */
ltkProduct.prototype.LoadProductURLOnly = function (product) {
	// Sku
    this.sku = product.ID;

	// image url
    this.imageURL = this.getImageURL(this.getImage(product));

	// product url
    this.linkURL = this.getProductURL(product);

    // collection url
    if (this.categoryLevelAttributes) {
        var collectionCategoryObject = this.getCollectionCategory(product, this.getCollectionURL(product));
        this.reviewURL = collectionCategoryObject.reviewURL ? collectionCategoryObject.reviewURL : '';
    }
};

/* Method to load full product. */
ltkProduct.prototype.LoadProduct = function (product) {
    this.product = product;
	// Sku
    if (product.variant) {
        this.masterSku = product.masterProduct.ID;
        this.reviewProductID = product.masterProduct.ID.replace(new RegExp('^[9]*'), '');
    } else {
        this.reviewProductID = product.ID;
    }
    this.sku = product.ID;

	// Variant
    if (product.variant) { this.variant = 'V'; } else		{ this.variant = 'M'; }

	// product title
    this.title = product.name;

	// image url
    this.imageURL = this.getImageURL(this.getImage(product));

	// product url
    this.linkURL = this.getProductURL(product);

    this.description = product.shortDescription;
    this.price = this.getProductPrice(product);
    this.brand = product.brand;

	// load category and subscategory
    this.getCategory();

	// quantity on hand
    if (product.availabilityModel != null && product.availabilityModel.inventoryRecord != null) { this.QOH = product.availabilityModel.inventoryRecord.stockLevel; }

	// strict validation. Don't let QOH be negative.
    if (this.QOH != null) { this.QOH = this.QOH < 0 ? 0 : this.QOH; }

	// This will contain the DW in stock value.
    this.SystemInStock = product.availabilityModel.inStock;
	// instock flag. This is calculated to support strict validation.
    this.inStock = this.QOH !== 0;
    this.getAttributes(product);
     // Custom Start: Adding product sale info [MSS-1473]
     this.onSale = this.getSaleInfo(product);
     // Custom End:
 
     // Custom Start: Adding Catagory value [MSS-1473]
     this.categoryValue = this.getCategoriesValue(product);
     // Custom End

     // Custom Start: [MSS-1690 Adding Product Sale Price Information]
    this.salePrice = this.getSalePriceInfo(product);
    // Custom End:

    // Custom Start: [MSS-1696 Listrak - Create New Product Feed for MVMT - Add Gender]
    var productFeedValue = Site.getCurrent().getCustomPreferenceValue('Listrak_ProductFeedGenderAttribute');
    if (!empty(productFeedValue)) {
        this.watchGender = this.getGender(product);
    }
    // Custom End:

    // Custom Start: [MSS-1697 Add Collection URL, Strap Width, Case Diameter, Family Name to Listrak MVMT Product Feed]
    if (this.categoryLevelAttributes) {
        var collectionCategoryObject = this.getCollectionCategory(product, this.getCollectionURL(product));
        if (!empty(collectionCategoryObject)) {
            this.reviewURL = collectionCategoryObject.reviewURL ? collectionCategoryObject.reviewURL : '';
            this.meta4 = collectionCategoryObject.meta4 ? collectionCategoryObject.meta4 : '';
            this.meta5 = collectionCategoryObject.meta5 ? collectionCategoryObject.meta5 : '';
        }
        this.style = this.getFamilyName(product);
        this.meta1 = this.getStrapWidth(product);
        this.size = this.getCaseDiameter(product);
    }
    // Custom End:
};
// MOD 16.3 Extra Prod Attributes
ltkProduct.prototype.getAttributes = function (product) {
    var attrModel = product.getAttributeModel();
    var attrString = '';

    var self = this;
	// this.additionalAttributes.toArray().forEach(function (addAttr)
    var idx = 0;
    for (idx = 0; idx < this.additionalAttributes.length; idx++) {
        var pvm = product.getVariationModel();
  		var pvAttrs = pvm.getProductVariationAttributes();
  		var variationValues = '';
        var addAttr = this.additionalAttributes[idx];
		 pvAttrs.toArray().forEach(function (pvAttr) { // eslint-disable-line no-loop-func
	    	var pvAttrVal = pvm.getVariationValue(product, pvAttr);
	       	if (!empty(pvAttrVal) && pvAttrVal != null) {
	        	if (pvAttr.attributeID.toLowerCase() === addAttr.toLowerCase())	        	{
	        		// variationValues = "PVAttrVal Display Val: " + pvAttrVal.getDisplayValue() + " - AddAttr " + addAttr + " - PVAttr Dislay" + pvAttr.getDisplayName();
	        		variationValues = pvAttrVal.getDisplayValue();
	        		this.additionalAttributeValues.put(addAttr, variationValues);
	        	}	        	else {
	        		var attrDef = attrModel.getAttributeDefinition(addAttr);
	        		if (attrDef) {
	        			this.additionalAttributeValues.put(addAttr, attrModel.getDisplayValue(attrDef));
	        		}
	        	}
	       }
	  	});
    }
};

/* Helper method to retrieve the product image. */
ltkProduct.prototype.getImage = function (product) {
    var image;
	// Is there an image in a defined custom viewtype
    if (!empty(this.customViewType)) {
        image = product.getImage(this.customViewType, 0);
        if (!empty(image)) return image;
    }

	// check small viewtype
    image = product.getImage('small', 0);
    if (!empty(image)) return image;

	// check large viewtype
    image = product.getImage('large', 0);
    if (!empty(image)) return image;

	// image not found
    return null;
};

/* Helper method to retrieve the product image URL. */
ltkProduct.prototype.getImageURL = function (image) {
    var imageurl = '';

    if (!empty(image))	{
        if (empty(this.useAbsoluteImageURLs) || this.useAbsoluteImageURLs === true)			{ imageurl = image.httpURL; } else			{ imageurl = image.URL; }
    }	else		{ imageurl = ''; }

    return imageurl;
};

/* Helper method to retrieve the product URL. */
ltkProduct.prototype.getProductURL = function (product) {
    var linkurl = '';

    if (!empty(product.ID))	{
        if (empty(this.useAbsoluteProductURLs) || this.useAbsoluteProductURLs === true)			{ linkurl = dw.web.URLUtils.http('Product-Show', 'pid', product.ID); } else			{ linkurl = dw.web.URLUtils.url('Product-Show', 'pid', product.ID); }
    }

    return linkurl;
};

/* Helper method to return the product price. */
ltkProduct.prototype.getProductPrice = function (product) {
    var price = null;

    var priceModel = product.getPriceModel();
    if (priceModel)	{
        price = priceModel.getMinPrice();
    }

    return price.toNumberString();
};

/* Helper method to return the product category. */
ltkProduct.prototype.getCategory = function () {
	// Category
    var category = this.product.primaryCategory;
    if (category == null)		{ category = this.product.classificationCategory; }
    if (category == null && !this.product.onlineCategories.empty)		{ category = this.product.onlineCategories[0]; }


	// Level = depth of the category that should be the Main Category
	// ie- If categories in Demandware look like this: Root, Store, Main, Sub, Sub2
	// then categoryStartLevel should be 3 so that Main becomes the Category and Sub becomes the subcategory
    if (this.categoryStartLevel <= 0) { this.categoryStartLevel = 2; } // if not set, use default of 2

    if (category != null)	{
        this.categories.push(category.displayName);
        while (category.parent != null) {
            this.categories.push(category.parent.displayName);
            category = category.parent;
        }
		// drop off the uppermost categories (root/hidden) based on setting
        for (var i = 1; i < this.categoryStartLevel; i++) {
            this.categories.pop();
        }
		// categories are in reverse order, so reverse for the productSync (category will be element 0, followed by subs)
        this.categories.reverse();
    }
};

// Custom Start: Get Product Sales Info [MSS-1473]
ltkProduct.prototype.getSaleInfo = function (product) {

    var PromotionIt = PromotionMgr.activePromotions.getProductPromotions(product).iterator();
    var onSale = false;
    while (PromotionIt.hasNext()) {
        var promo = PromotionIt.next();
        if (promo.getPromotionClass() != null && promo.getPromotionClass().equals(Promotion.PROMOTION_CLASS_PRODUCT) && !promo.basedOnCoupons) {
            onSale = true;
            break;
        }
    }
    return onSale;
}
// Custom End

// Custom Start: Get the product categories [MSS-1473]
ltkProduct.prototype.getCategoriesValue = function (product) {
    var categoriesIt = product.getOnlineCategories().iterator();
    var categoryList = new Array();
    var categoryArray = new ArrayList();
    try {
        while (categoriesIt.hasNext()) {
            var category = categoriesIt.next();
            categoryArray = new ArrayList();
            while (!empty(category)) {
                if ((!empty(category.displayName)) && category.ID !== 'root' && category.online) {
                    categoryArray.add(category.displayName);
                    category = category.parent;
                } else {
                    category = null;
                }
            }
            categoryArray.reverse();
            categoryList.push(categoryArray.join('>'));
        }
        return categoryArray ? categoryArray.join(',') : categoryArray;
    } catch (error) {
        Logger.error('Listrak Product Processing Failed for Product: {0}, Error: {1}', product.ID, error);
        return categoryArray;
    }
}
// Custom End

// Custom Start: [MSS-1690 Get Product Sale Price Information]
ltkProduct.prototype.getSalePriceInfo = function (product) {
    var Money = require('dw/value/Money');
    var PromotionItr = PromotionMgr.activePromotions.getProductPromotions(product).iterator();
    var promotionalPrice = Money.NOT_AVAILABLE;
    var currentPromotionalPrice = Money.NOT_AVAILABLE;
    var salePrice = '';

    while (PromotionItr.hasNext()) {
        var promo = PromotionItr.next();
        if (promo.getPromotionClass() != null && promo.getPromotionClass().equals(Promotion.PROMOTION_CLASS_PRODUCT) && !promo.basedOnCoupons) {
            if (product.optionProduct) {
                currentPromotionalPrice = promo.getPromotionalPrice(product, product.getOptionModel());
            } else {
                currentPromotionalPrice = promo.getPromotionalPrice(product);
            }
            if (promotionalPrice.value > currentPromotionalPrice.value && currentPromotionalPrice.value !== 0) {
                promotionalPrice = currentPromotionalPrice;
                break; // breaks loop
            } else if (promotionalPrice.value == 0) {
                if ((currentPromotionalPrice.value !== 0 && currentPromotionalPrice.value !== null)) {
                    promotionalPrice = currentPromotionalPrice;
                    break; // breaks loop
                }
            }
        }
    }

    if (promotionalPrice && promotionalPrice.available) {
        salePrice = promotionalPrice.decimalValue.toString();
    }

    return salePrice;
}
// Custom End:

// Custom Start: [MSS-1696 Listrak - Create New Product Feed for MVMT - Add Gender]
ltkProduct.prototype.getGender = function (product) {
    var gender = '';
    var productFeedJson = Site.getCurrent().getCustomPreferenceValue('Listrak_ProductFeedGenderAttribute');

    try {
        productFeedJson = JSON.parse(productFeedJson);
        var watchGenderAttr = product.custom.watchGender[0];
        if (!empty(watchGenderAttr)) {
            var watchGenderArr = watchGenderAttr.split(',');
        }
        if (!empty(productFeedJson) && !empty(watchGenderArr[0])) {
            gender = productFeedJson[watchGenderArr[0]];
        }

        return gender;
    } catch (error) {
        Logger.error('Listrak Product Processing Failed for Product: {0}, Error: {1}', product.ID, error);
        return gender;
    }
};
// Custom End

// Custom Start: [MSS-1697 Add Collection URL, Strap Width, Case Diameter, Family Name to Listrak MVMT Product Feed]
ltkProduct.prototype.getCollectionURL = function (product) {
    var collectionUrl = '';
    if (!empty(product.ID) && !empty(product.primaryCategory))	{
        collectionUrl = URLUtils.https('Search-Show', 'cgid', product.primaryCategory.ID);
    }

    return collectionUrl;
}

ltkProduct.prototype.getCollectionCategory = function (product, collectionUrl) {
    var collectionCategory = {};
    var meta4 = '';
    var meta5 = '';
    var metaCheck5 = '';
    var reviewURL = '';
    try {
        if (!empty(collectionUrl)) {
            reviewURL = collectionUrl;
            collectionCategory.reviewURL = reviewURL;
        }

        if (!empty(product) && product.variant === false) {
            if (!empty(product.primaryCategory)) {
                var productPrimaryCategory = product.primaryCategory;

                while (productPrimaryCategory.parent != null) {
                    metaCheck5 = productPrimaryCategory.displayName;
                    if (productPrimaryCategory.parent.topLevel === true) {
                        meta4 = productPrimaryCategory.parent.displayName;
                        break;
                    }
                    productPrimaryCategory = productPrimaryCategory.parent;
                }
            }

            if (!empty(product.primaryCategory) && (product.primaryCategory.parent.subCategories.empty === false)) {
                meta5 = metaCheck5;
            }
            collectionCategory.meta4 = meta4;
            collectionCategory.meta5 = meta5;
        } else if (!empty(product) && product.variant === true) {
            if (!empty(product.masterProduct) && !empty(product.masterProduct.primaryCategory)) {
                var masterPrimaryCategory = product.masterProduct.primaryCategory;
                while (masterPrimaryCategory.parent != null) {
                    metaCheck5 = masterPrimaryCategory.displayName;
                    if (masterPrimaryCategory.parent.topLevel === true) {
                        meta4 = masterPrimaryCategory.parent.displayName;
                        break;
                    }
                    masterPrimaryCategory = masterPrimaryCategory.parent;
                }
            }
            if (!empty(product.masterProduct) && !empty(product.masterProduct.primaryCategory) && (product.masterProduct.primaryCategory.parent.subCategories.empty === false)) {
                meta5 = metaCheck5;
            }
            collectionCategory.meta4 = meta4;
            collectionCategory.meta5 = meta5;
        }

        return collectionCategory;
    } catch (error) {
        Logger.error('Listrak Collection Category Processing Failed for Product: {0}, Error: {1}', product.ID, error);
        return collectionCategory;
    }
}

ltkProduct.prototype.getFamilyName = function (product) {
    var familyName = !empty(product.custom.familyName[0]) ? product.custom.familyName[0] : '';
    return familyName;
}

ltkProduct.prototype.getStrapWidth = function (product) {
    var strapWidth = !empty(product.custom.strapWidth) ? product.custom.strapWidth : '';
    return strapWidth;
}

ltkProduct.prototype.getCaseDiameter = function (product) {
    var caseDiameter = !empty(product.custom.caseDiameter) ? product.custom.caseDiameter : '';
    return caseDiameter;
}
// Custom End