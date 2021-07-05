'use strict';

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
    var seeTheFitPopup  = productCustomHelper.getProductAttributes(apiProduct);
    var detailAndSpecAttributes = productCustomHelper.getPdpDetailAndSpecsAttributes(apiProduct);
    var pdpCollectionContentAssetID = productCustomHelper.getPdpCollectionContentAssetID(apiProduct);
    var currentCountry = productCustomHelper.getCurrentCountry();
    var color = productCustomHelper.getColor(apiProduct, product);
    var caseDiameter = productCustomHelper.getCaseDiameter(apiProduct);
    var caseDiameterRedesigned = productCustomHelper.getCaseDiameterRedesigned(apiProduct);
    var pdpContentAssetHTML = productCustomHelper.getPDPContentAssetHTML (apiProduct);


    if (!empty(currentCountry)) {
        Object.defineProperty(product, 'currentCountry', {
            enumerable: true,
            value: currentCountry
        });
    }
    
    if (!empty(pdpCollectionContentAssetID)) {
        Object.defineProperty(product, 'pdpCollectionContentAssetID', {
            enumerable: true,
            value: pdpCollectionContentAssetID
        });
    }

    if (!empty(detailAndSpecAttributes)) {
        Object.defineProperty(product, 'pdpDetailAttributes', {
            enumerable: true,
            value: detailAndSpecAttributes.pdpDetailAttributes
        });
    }

    if (!empty(detailAndSpecAttributes)) {
        Object.defineProperty(product, 'pdpSpecAttributes', {
            enumerable: true,
            value: detailAndSpecAttributes.pdpSpecAttributes
        });
    }

    if (!empty(apiProduct.custom.shopStrapUrl)) {
        Object.defineProperty(product, 'shopStrapUrl', {
            enumerable: true,
            value: apiProduct.custom.shopStrapUrl
        });
    }

    if (!empty(seeTheFitPopup.seeTheFitHeading)) {
        Object.defineProperty(product, 'seeTheFitHeading', {
            enumerable: true,
            value: seeTheFitPopup.seeTheFitHeading
        });
    }

    if (!empty(seeTheFitPopup.seeTheFitDescription)) {
        Object.defineProperty(product, 'seeTheFitDescription', {
            enumerable: true,
            value: seeTheFitPopup.seeTheFitDescription
        });
    }

    if (!empty(seeTheFitPopup.seeTheFitPrimaryImg)) {
        Object.defineProperty(product, 'seeTheFitPrimaryImg', {
            enumerable: true,
            value: seeTheFitPopup.seeTheFitPrimaryImg
        });
    }
    if (!empty(seeTheFitPopup.seeTheFitSecondaryImg)) {
        Object.defineProperty(product, 'seeTheFitSecondaryImg', {
            enumerable: true,
            value: seeTheFitPopup.seeTheFitSecondaryImg
        });
    }


    if (!empty(seeTheFitPopup.seeTheFitSpecs)) {
        Object.defineProperty(product, 'seeTheFitSpecs', {
            enumerable: true,
            value: seeTheFitPopup.seeTheFitSpecs
        });
    }


    if (pdpContentAssetHTML) {
        Object.defineProperty(product, 'pdpContentAssetHTML', {
            enumerable: true,
            value: pdpContentAssetHTML
        });
    }

    if (!empty(caseDiameter)) {
        Object.defineProperty(product, 'caseDiameter', {
        enumerable: true,
        value: caseDiameter
        });
    }

    if (!empty(caseDiameter)) {
        Object.defineProperty(product, 'caseDiameter', {
        enumerable: true,
        value: caseDiameter
        });
    }

    if (!empty(caseDiameterRedesigned)) {
        Object.defineProperty(product, 'caseDiameterRedesigned', {
        enumerable: true,
        value: caseDiameterRedesigned
        });
    }

    if (!empty(color)) {
        Object.defineProperty(product, 'color', {
        enumerable: true,
        value: color
        });
    }

    return product;
};
