'use strict';

var fullProductBase = module.superModule;
var productCustomHelpers = require('*/cartridge/scripts/helpers/productCustomHelpers');

module.exports = function fullProduct(product, apiProduct, options) {
    fullProductBase.call(this, product, apiProduct, options);

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

    return product;
};
