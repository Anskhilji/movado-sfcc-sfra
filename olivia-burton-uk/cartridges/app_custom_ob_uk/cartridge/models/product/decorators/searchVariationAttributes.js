'use strict';

var searchVariationAttributes = module.superModule;

var ATTRIBUTE_NAME = 'color';
var collections = require('*/cartridge/scripts/util/collections');
var ImageModel = require('*/cartridge/models/product/productImages');
var Logger = require('dw/system/Logger')
var URLUtils = require('dw/web/URLUtils');

module.exports = function (object, hit) {
    try {
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
                        var apiLargeImage = new ImageModel(color, { types: ['tile533', 'tile256', 'tile217', 'tile150'], quantity: 'single' });
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
                                }],
                                large: [{
                                    alt: !empty(apiLargeImage.tile256[0]) ? apiLargeImage.tile256[0].alt : '',
                                    url: !empty(apiLargeImage.tile256[0]) ? apiLargeImage.tile256[0].url.toString() : '',
                                    title: !empty(apiLargeImage.tile256[0]) ? apiLargeImage.tile256[0].title : ''
                                }]
                            },
                            pdpURL: URLUtils.url(
                                    'Product-Show',
                                    'pid',
                                    hit.productID,
                                    'dwvar_' + hit.productID + '_color',
                                    color.value
                                    ).toString(),
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
    } catch (e) {
        Logger.error('searchVariationAttributes: Error occured while defining the property variationAttributes and error is: {0} in {1} : {2}', e.toString(), e.fileName, e.lineNumber);
    }
};
