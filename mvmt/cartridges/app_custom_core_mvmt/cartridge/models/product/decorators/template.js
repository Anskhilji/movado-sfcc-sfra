'use strict';

module.exports = function (object, apiProduct) {
    var productTemplate;
    if (!empty(apiProduct.custom.renderingTemplate)) {
        productTemplate = 'product/' + apiProduct.custom.renderingTemplate;
    } else {
        productTemplate = apiProduct.template;
    }
    Object.defineProperty(object, 'template', {
        enumerable: true,
        value: productTemplate
    });
};
