/**
Purpose: Loads product information needed by Listrak from DW Product object
*/
var Site = require('dw/system/Site');
var URLUtils = require('dw/web/URLUtils');
/**
 * Object that holds inflated product information.
 * */
function ltkProduct() {
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

    this.product = null;

	// Load settings needed for loading product information
    this.customViewType = Site.getCurrent().getCustomPreferenceValue('Listrak_ProductImageViewType');
    this.UseAbsoluteImageURLs = Site.getCurrent().getCustomPreferenceValue('Listrak_UseAbsoluteImageURLs');
    this.UseAbsoluteProductURLs = Site.getCurrent().getCustomPreferenceValue('Listrak_UseAbsoluteProductURLs');
    var catStartLevel = Site.getCurrent().getCustomPreferenceValue('Listrak_TopLevelCategory');
    this.categoryStartLevel = catStartLevel;
}

/* Method to load product URLs only. */
ltkProduct.prototype.LoadProductURLOnly = function (product) {
	// Sku
    this.sku = product.ID;

	// image url
    this.imageURL = this.getImageURL(this.getImage(product));

	// product url
    this.linkURL = this.getProductURL(product);
};

/* Method to load full product. */
ltkProduct.prototype.LoadProduct = function (product) {
    this.product = product;
	// Sku
    if (product.variant) {
		// this.sku = '{' + product.masterProduct.ID + '}' + product.ID;
        this.masterSku = product.masterProduct.ID;
        this.reviewProductID = product.masterProduct.ID.replace(new RegExp('^[9]*'), '');
    } else {
		// this.sku = '{' + product.ID + '}';
        this.reviewProductID = product.ID;
    }
    this.sku = product.ID;

	// Variant
    if (product.variant)		{ this.variant = 'V'; } else		{ this.variant = 'M'; }

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

	// instock flag
    this.inStock = product.availabilityModel.inStock;
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
        if (empty(this.useAbsoluteProductURLs) || this.useAbsoluteProductURLs === true)			{ linkurl = URLUtils.http('Product-Show', 'pid', product.ID); } else			{ linkurl = URLUtils.url('Product-Show', 'pid', product.ID); }
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
    if (category == null && !this.product.onlineCategories.empty) { category = this.product.onlineCategories[0]; }

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

exports.ltkProduct = ltkProduct;
