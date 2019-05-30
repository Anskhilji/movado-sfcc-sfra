'use strict';

var ImageModel = require('*/cartridge/models/product/productImages');

module.exports = function (object, product, config) {
    Object.defineProperty(object, 'emailImage', {
        enumerable: true,
        value: new ImageModel(product, config)
    });
};
