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
    var eswCustomHelper = require('*/cartridge/scripts/helpers/eswCustomHelper');
    var productCustomHelper = require('*/cartridge/scripts/helpers/productCustomHelper');
    var seeTheFitPopup  = productCustomHelper.getProductAttributes(apiProduct);
    var detailAndSpecAttributes = productCustomHelper.getPdpDetailAndSpecsAttributes(apiProduct);
    var pdpCollectionContentAssetID = productCustomHelper.getPdpCollectionContentAssetID(apiProduct);
    var currentCountry = productCustomHelper.getCurrentCountry();
    var color = productCustomHelper.getColor(apiProduct, product);
    var caseDiameter = productCustomHelper.getCaseDiameter(apiProduct);
    var caseDiameterRedesigned = productCustomHelper.getCaseDiameter(apiProduct, true);
    var isCategory = productCustomHelper.getProductCategory(apiProduct, product);
    var isWatchTile = productCustomHelper.getIsWatchTile(apiProduct);
    var isCurrentDomesticAllowedCountry = eswCustomHelper.isCurrentDomesticAllowedCountry();
    var isProductNotRestrictedOnEswCountries = productCustomHelper.productNotRestrictedOnEswCountries(currentCountry, apiProduct, isCurrentDomesticAllowedCountry);

    if (isProductNotRestrictedOnEswCountries && !isCurrentDomesticAllowedCountry) {
        var ContentMgr = require('dw/content/ContentMgr');

        var eswNotRestrictedCountriesProductMsg = ContentMgr.getContent('ca-esw-not-restricted-countries-product-msg');
        var eswNotRestrictedCountriesProductMsgBody = eswNotRestrictedCountriesProductMsg && eswNotRestrictedCountriesProductMsg.custom && eswNotRestrictedCountriesProductMsg.custom.body && !empty(eswNotRestrictedCountriesProductMsg.custom.body.markup) ? eswNotRestrictedCountriesProductMsg.custom.body.markup : '';
    }
    var masterProductID;

    if (!empty(apiProduct)) {
        if (apiProduct.master) {
            masterProductID = apiProduct.ID;
        } else {
            if ((!empty(apiProduct.variationModel.master)) && (!empty(apiProduct.variationModel.master.ID))) {
                masterProductID = apiProduct.variationModel.master.ID;
            } else {
                masterProductID = '';
            }
        }
    }

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

    if (!empty(isWatchTile)) {
        Object.defineProperty(product, 'isWatchTile', {
            enumerable: true,
            value: isWatchTile
        });
    }

    if (!empty(isCategory)) {
        Object.defineProperty(product, 'isCategory', {
            enumerable: true,
            value: isCategory
        });
    }

    if (!empty(masterProductID)) {
        Object.defineProperty(product, 'masterProductID', {
            enumerable: true,
            value: masterProductID
        });
    }

    if (!empty(product)) {
        Object.defineProperty(product, 'posterFrame', {
            enumerable: true,
            value: product.images.posterFrame[0] ? product.images.posterFrame[0] : ''
        });
    }

    Object.defineProperty(product, 'isProductNotRestrictedOnEswCountries', {
        enumerable: true,
        value: isProductNotRestrictedOnEswCountries
    });

    if (isProductNotRestrictedOnEswCountries && !isCurrentDomesticAllowedCountry) {
        Object.defineProperty(product, 'eswNotRestrictedCountriesProductMsgBody', {
            enumerable: true,
            value: eswNotRestrictedCountriesProductMsgBody
        });
    }

    return product;
};
