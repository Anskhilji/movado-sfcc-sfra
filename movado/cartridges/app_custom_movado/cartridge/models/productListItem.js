'use strict';
var ImageModel = require('*/cartridge/models/product/productImages');
var priceFactory = require('*/cartridge/scripts/factories/price');
var PromotionMgr = require('dw/campaign/PromotionMgr');
var availability = require('*/cartridge/models/product/decorators/availability');
var readyToOrder = require('*/cartridge/models/product/decorators/readyToOrder');
var variationAttributes = require('*/cartridge/models/product/decorators/variationAttributes');

/**
 * returns an array of listItemobjects bundled into an array
 * @param {dw.customer.ProductListItem} listItem - productlist Item
 * @returns {Array} an array of listItms
 */
function getBundledListItems(listItem) {
    var bundledItems = [];
    listItem.product.bundledProducts.toArray().forEach(function (bundledItem) {
        var result = {
            pid: bundledItem.ID,
            name: bundledItem.name,
            imageObj: new ImageModel(bundledItem, { types: ['small'], quantity: 'single' })
        };
        if (!bundledItem.master) {
            variationAttributes(result, bundledItem.variationModel, {
                attributes: '*',
                endPoint: 'Variation'
            });
        }
        bundledItems.push(result);
    });
    return bundledItems || [];
}

/**
 * returns an array of options of a listItem
 * @param {dw.customer.ProductListItem} listItem - productlist Item
 * @returns {Array} an array of listItms options
 */
function getOptions(listItem) {
    var options = [];
    if (listItem.product.optionModel.options.length > 0) {
        var optionObj = listItem.product.optionModel.options;
        Object.keys(optionObj).forEach(function (key) {
            var selectedOption = listItem.product.optionModel.getSelectedOptionValue(optionObj[key]);
            var result = {
                displayName: optionObj[key].displayName,
                displayValue: selectedOption.displayValue,
                optionId: optionObj[key].ID,
                selectedValueId: selectedOption.ID
            };
            options.push(result);
        });
    }
    return options;
}

/**
 * returns an array of selected options that can be passed into cart
 * @param {Object[]} options - Array of options for a given product returned from getOptions function
 * @return {Object[]} an array of selected options
 */
function getSelectedOptions(productListItemObject, options) {
    if (options) {
        return options.map(function (option) {
            if (option.optionId === 'Engraved' && productListItemObject.custom.engravedText) {
                option.optionMessage = productListItemObject.custom.engravedText;
            } else if (option.optionId === 'Embossed' && productListItemObject.custom.embossedText) {
                option.optionMessage = productListItemObject.custom.embossedText;
            } else if (option.optionId === 'GiftWrapped' && productListItemObject.custom.giftWrappededText) {
                option.optionMessage = productListItemObject.custom.giftWrappededText;
            }
            return {
                optionId: option.optionId,
                selectedValueId: option.selectedValueId,
                optionMessage: option.optionMessage
            };
        });
    }
    return null;
}

/**
 * creates a plain object that contains product list item information
 * @param {dw.customer.ProductListItem} productListItemObject - productlist Item
 * @returns {Object} an object that contains information about the users address
 */
function createProductListItemObject(productListItemObject) {
    var result = {};
    var promotions;
    var DEFAULT_MAX_ORDER_QUANTITY = 9;

    if (productListItemObject && productListItemObject.product) {
        promotions = PromotionMgr.activeCustomerPromotions.getProductPromotions(productListItemObject.product);
        var options = getOptions(productListItemObject);

        result = {
            pid: productListItemObject.productID,
            UUID: productListItemObject.UUID,
            id: productListItemObject.ID,
            name: productListItemObject.product.name,
            minOrderQuantity: productListItemObject.product.minOrderQuantity.value || 1,
            maxOrderQuantity: DEFAULT_MAX_ORDER_QUANTITY,
            qty: productListItemObject.quantityValue,
            lastModified: productListItemObject.getLastModified().getTime(),
            creationDate: productListItemObject.getCreationDate().getTime(),
            publicItem: productListItemObject.public,
            imageObj: new ImageModel(productListItemObject.product, { types: ['tile150'], quantity: 'single' }),
            priceObj: priceFactory.getPrice(productListItemObject.product, null, true, promotions, productListItemObject.getProductOptionModel()),
            master: productListItemObject.product.master,
            bundle: productListItemObject.product.bundle,
            bundleItems: productListItemObject.product.bundle ? getBundledListItems(productListItemObject) : [],
            options: options,
            selectedOptions: getSelectedOptions(productListItemObject, options),
            productGtmArray: getProductGtmArray(productListItemObject),
            shopbagLabel: productListItemObject.product.custom.shopbagLabel || ''
        };
        readyToOrder(result, productListItemObject.product.variationModel);
        availability(result, productListItemObject.quantityValue, productListItemObject.product.minOrderQuantity.value, productListItemObject.product.availabilityModel);
        if (!productListItemObject.product.master) {
            variationAttributes(result, productListItemObject.product.variationModel, {
                attributes: '*',
                endPoint: 'Variation'
            });
        }
    } else {
        result = null;
    }
    return result;
}

/**
 * Address class that represents an productListItem
 * @param {dw.customer.ProductListItem} productListItemObject - Item in a product list
 * @constructor
 */
function productListItem(productListItemObject) {
    this.productListItem = createProductListItemObject(productListItemObject);
}

/**
 * Returns product array for GTM Add to cart CTA
 * @param productListItemObject
 * @returns productGTMArray
 */
function getProductGtmArray(productListItemObject) {
    // object for GTM
    var productGtmArray = [];
    productGtmArray.push({
        id: productListItemObject.product.ID,
        name: productListItemObject.product.name,
        brand: productListItemObject.product.brand,
        category: productListItemObject.product.variant && !!productListItemObject.product.masterProduct.primaryCategory ? productListItemObject.product.masterProduct.primaryCategory.ID
                : (productListItemObject.product.primaryCategory ? productListItemObject.product.primaryCategory.ID : ''),
        variant: getProductOptions(productListItemObject.product.optionModel.options),
        price: productListItemObject.product.priceModel.price.value
    });
    return productGtmArray[0];
}

/**
 *
 * @param productOptions
 * @returns productOption
 */
function getProductOptions(productOptions) {
    var collections = require('*/cartridge/scripts/util/collections');
    var prodOptionArray;
    if (productOptions.empty != true) {
        collections.forEach(productOptions, function (productOption) {
            if (prodOptionArray == undefined) {
                prodOptionArray = productOption.ID;
            } else {
                prodOptionArray += ',' + productOption.ID;
            }
        });
    }
    return prodOptionArray;
}


module.exports = productListItem;
