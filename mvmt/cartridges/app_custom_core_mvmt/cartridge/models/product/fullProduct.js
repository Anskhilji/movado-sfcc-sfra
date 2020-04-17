'use strict';

var Site = require('dw/system/Site').getCurrent();
var baseFullProduct = module.superModule;

/**
 * Decorate product with full product information
 * @param {Object} product - Product Model to be decorated
 * @param {dw.catalog.Product} apiProduct - Product information returned by the script API
 * @param {Object} options - Options passed in from the factory
 * @property {dw.catalog.ProductVarationModel} options.variationModel - Variation model returned by the API
 * @property {Object} options.options - Options provided on the query string
 * @property {dw.catalog.ProductOptionModel} options.optionModel - Options model returned by the API
 * @property {dw.util.Collection} options.promotions - Active promotions for a given product
 * @property {number} options.quantity - Current selected quantity
 * @property {Object} options.variables - Variables passed in on the query string
 *
 * @returns {Object} - Decorated product model
 */
module.exports = function fullProduct(product, apiProduct, options) {
    baseFullProduct.call(this, product, apiProduct, options);
    var productCustomHelper = require('*/cartridge/scripts/helpers/productCustomHelper');
    var seeTheFitDescription = '';
    var seeTheFitHeading = '';
    var seeTheFitImageViewType = Site.getCustomPreferenceValue('seeTheFitImageViewType');
    var masterProduct = apiProduct.getVariationModel().getMaster();

    if (!empty(apiProduct.custom.shopStrapUrl)) {
        Object.defineProperty(product, 'shopStrapUrl', {
            enumerable: true,
            value: apiProduct.custom.shopStrapUrl
        });
    }

    if (!empty(masterProduct)) {
        seeTheFitHeading = masterProduct.name;
        seeTheFitDescription = masterProduct.shortDescription;
    } else {
        seeTheFitHeading = apiProduct.name;
        seeTheFitDescription = apiProduct.shortDescription;
    }

    Object.defineProperty(product, 'seeTheFitHeading', {
        enumerable: true,
        value: seeTheFitHeading
    });

    Object.defineProperty(product, 'seeTheFitDescription', {
        enumerable: true,
        value: seeTheFitDescription
    });

    if (!empty(seeTheFitImageViewType) && seeTheFitImageViewType.equalsIgnoreCase('size-guide')) {
        var seeTheFitPrimaryImg =  apiProduct.getImage(seeTheFitImageViewType, 0);
        if (!empty(seeTheFitPrimaryImg)) {
            Object.defineProperty(product, 'seeTheFitPrimaryImg', {
                enumerable: true,
                value: seeTheFitPrimaryImg
            });
        }
        var seeTheFitSecondaryImg =  apiProduct.getImage(seeTheFitImageViewType, 1);
        if (!empty(seeTheFitSecondaryImg)) {
            Object.defineProperty(product, 'seeTheFitSecondaryImg', {
                enumerable: true,
                value: seeTheFitSecondaryImg
            });
        }
    }

    var seeTheFitSpecs = productCustomHelper.getProductAttributes(apiProduct);
    if (!empty(seeTheFitSpecs)) {
        Object.defineProperty(product, 'seeTheFitSpecs', {
            enumerable: true,
            value: seeTheFitSpecs
        });
    }

    return product;
};
