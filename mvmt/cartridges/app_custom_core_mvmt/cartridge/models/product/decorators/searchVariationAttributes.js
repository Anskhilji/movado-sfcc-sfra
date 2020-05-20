'use strict';

var ATTRIBUTE_NAME = 'color';
var collections = require('*/cartridge/scripts/util/collections');
var URLUtils = require('dw/web/URLUtils');

module.exports = function (object, hit) {
    Object.defineProperty(object, 'variationAttributes', {
        enumerable: true,
        value: (function () {
            var colors = hit.getRepresentedVariationValues(ATTRIBUTE_NAME);

            return [{
                attributeId: 'color',
                id: 'color',
                swatchable: true,
                values: collections.map(colors, function (color) {
                    var apiImage = color.getImage('swatch', 0);
                    if (!apiImage) {
                        return {};
                    }
                    return {
                        id: color.ID,
                        description: color.description,
                        displayValue: color.displayValue,
                        value: color.value,
                        selectable: true,
                        selected: true,
                        images: {
                            swatch: [{
                                alt: apiImage.alt,
                                url: apiImage.URL.toString(),
                                title: apiImage.title
                            }]
                        },
                        url: URLUtils.url(
                            'Product-Variation',
                            'dwvar_' + hit.productID + '_color',
                            color.value,
                            'pid',
                            hit.productID,
                            'quantity',
                            '1'
                            ).toString()
                    };
                })
            }];
        }())
    });
};
