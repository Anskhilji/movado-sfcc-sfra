/**
 * List of callbacks which will be applied to exported Product object
 * to create key/value object
 *
 * @mixin
 */
'use strict';

/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */

let productPropertyFunctions = {
    /**
     * Function to return unique ID for payload, productID used as unique identifier
     * @param {dw.catalog.Product} product - product for export
     * @param {dw.catalog.ProductVariationModel} variationModel - product's variationModel
     * @param {dw.catalog.Product} masterProduct - product's Master product. Could be null
     * @returns {string} unique ID
     */
    id: function (product, variationModel, masterProduct) {
        return product.ID;
    },
    /**
     * Function to return product name
     * @param {dw.catalog.Product} product - product for export
     * @param {dw.catalog.ProductVariationModel} variationModel - product's variationModel
     * @param {dw.catalog.Product} masterProduct - product's Master product. Could be null
     * @returns {string} product name
     */
    title: function (product, variationModel, masterProduct) {
        let master = masterProduct || product;
        return master.name;
    },
    /**
     * Function to return product description. Used short description value
     * @param {dw.catalog.Product} product - product for export
     * @param {dw.catalog.ProductVariationModel} variationModel - product's variationModel
     * @param {dw.catalog.Product} masterProduct - product's Master product. Could be null
     * @returns {string} product description
     */
    description: function (product, variationModel, masterProduct) {
        let master = masterProduct || product;
        let shortDescription = master.getShortDescription().toString().replace(/<[^>]*>/g, '');
        return shortDescription;
    },
    /**
     * Function to return product's category name from Primary OR Classification OR first assigned category
     * @param {dw.catalog.Product} product - product for export
     * @param {dw.catalog.ProductVariationModel} variationModel - product's variationModel
     * @param {dw.catalog.Product} masterProduct - product's Master product. Could be null
     * @returns {string} category name
     */
    category: function (product, variationModel, masterProduct) {
        let master = masterProduct || product;
        let category = master.getPrimaryCategory() || master.getClassificationCategory() || master.getCategories().toArray().pop();
        return !empty(category) ? (category.displayName || category.ID) : '';
    },
    /**
     * Function to return product's manufacturer name
     * @param {dw.catalog.Product} product - product for export
     * @param {dw.catalog.ProductVariationModel} variationModel - product's variationModel
     * @param {dw.catalog.Product} masterProduct - product's Master product. Could be null
     * @returns {string} manufacturer name
     */
    manufacturer: function (product, variationModel, masterProduct) {
        let master = masterProduct || product;
        let manufacturer = master.getManufacturerName();
        return !empty(manufacturer) ? manufacturer : '';
    },
    /**
     * Function to return product's image url
     * @param {dw.catalog.Product} product - product for export
     * @returns {string} image url
     */
    image: function (product) {
        let img = product.getImage('large');
        let imgURL = img.getHttpsURL().toString();
        return imgURL;
    },
    /**
     * Function to return product variation's attribute values
     * @param {dw.catalog.Product} product - product for export
     * @param {dw.catalog.ProductVariationModel} variationModel - product's variationModel
     * @returns {Object} variation values
     */
    variationAttributes: function (product, variationModel) {
        let variations = [];
        let pvm = variationModel;
        let attrIter = pvm.productVariationAttributes.iterator();
        while (attrIter.hasNext()) {
            let attr = attrIter.next();
            let variantAttrValue = pvm.getVariationValue(product, attr);
            let pva = {
                id: attr.attributeID,
                value: variantAttrValue.displayValue
            };
            variations.push(pva);
        }
        return variations;
    },
    /**
     * Function to return product's price
     * @param {dw.catalog.Product} product - product for export
     * @returns {number} product price
     */
    price: function (product) {
        let priceModel = product.getPriceModel();
        let result = 0;

        if (!empty(priceModel)) {
            result = priceModel.getPrice().valueOrNull;
        }
        return result;
    }
};

module.exports = {
    productPropertyFunctions: productPropertyFunctions
};
