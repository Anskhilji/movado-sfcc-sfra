'use strict';

var fullProductBase = module.superModule;
var productCustomHelper = require('*/cartridge/scripts/helpers/productCustomHelper');
var productCustomHelpers = require('*/cartridge/scripts/helpers/productCustomHelpers');

module.exports = function fullProduct(product, apiProduct, options) {
    fullProductBase.call(this, product, apiProduct, options);
    var pdpVariationUrls = productCustomHelper.getPdpVariationUrls(product, apiProduct);

    Object.defineProperty(product, 'whyBuyMe', {
        enumerable: true,
        value: apiProduct.custom.WhyBuyMe
    });

    /**
     * Custom Start: Redesign Changes
     */
    var isRedesignedBadge =  productCustomHelpers.isOnlyRedesignedBadge(product);
    Object.defineProperty(product, 'isRedesignedBadge', {
        enumerable: true,
        value: isRedesignedBadge
    });

    /**
     * Custom End:
     */

    if (!empty(pdpVariationUrls)) {
        Object.defineProperty(product, 'pdpVariationsUrl', {
            enumerable: true,
            value: pdpVariationUrls
        });
    }

    return product;
};
