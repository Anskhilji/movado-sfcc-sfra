'use strict';

var fullProductBase = module.superModule;

module.exports = function fullProduct(product, apiProduct, options) { 
    fullProductBase.call(this, product, apiProduct, options);

    Object.defineProperty(product, 'whyBuyMe', {
        enumerable: true,
        value: apiProduct.custom.WhyBuyMe
    });

    return product;
};
