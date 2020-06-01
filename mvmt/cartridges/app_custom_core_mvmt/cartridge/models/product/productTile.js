'use strict';

var baseProductTile = module.superModule;
var ATTRIBUTE_NAME = 'color';

var Logger = require('dw/system/Logger');

var priceFactory = require('*/cartridge/scripts/factories/price');
var productHelper = require('*/cartridge/scripts/helpers/productHelpers');

module.exports = function productTile(product, apiProduct, productType, params) {
    baseProductTile.call(this, product, apiProduct, productType, params);
    
    var colorVariations;
    var defaultVariantImage;
    var defaultVariant;
    var selectedSwatch;
    var variationPdpURL;
    
    try {
        if (product.variationAttributes) {
            Object.keys(product.variationAttributes).forEach(function (key) {
                if (product.variationAttributes[key].id == ATTRIBUTE_NAME) {
                    colorVariations = product.variationAttributes[key];
                }
            });
        }
        
        if (!empty(colorVariations) && !empty(colorVariations.values)) {
            var varAttr = colorVariations.values;
            var variant = apiProduct.variationModel.defaultVariant;
            if (!empty(variant) && !empty(variant.custom)) {
                Object.keys(varAttr).forEach(function (key) {
                    if (variant.custom.color == varAttr[key].id) {
                        defaultVariantImage = varAttr[key].images.large[0].url;
                        variationPdpURL = varAttr[key].pdpURL;
                        defaultVariant = variant;
                        selectedSwatch = varAttr[key];
                    }
                });
            } else {
                defaultVariantImage = varAttr[0].images.large[0].url;
                variationPdpURL = varAttr[0].pdpURL;
                defaultVariant = varAttr[0];
                selectedSwatch = varAttr[0];
            }
            
            Object.defineProperty(product, 'defaultVariantImageDIS', {
                enumerable: true,
                value: defaultVariantImage
            });
            
            Object.defineProperty(product, 'variationPdpURL', {
                enumerable: true,
                value: variationPdpURL
            });
            
            Object.defineProperty(product, 'defaultVariant', {
                enumerable: true,
                value: defaultVariant
            });
            
            Object.defineProperty(product, 'selectedSwatch', {
                enumerable: true,
                value: selectedSwatch
            });
            
            Object.defineProperty(product, 'colorVariationsValues', {
                enumerable: true,
                value: colorVariations
            });
            
            if (apiProduct.variationModel && apiProduct.variationModel.defaultVariant) {
                var options = productHelper.getConfig(apiProduct.variationModel.defaultVariant, { pid: product.id });
                Object.defineProperty(product, 'defaultVariantAvailabilityStatus', {
                    enumerable: true,
                    value: apiProduct.variationModel.defaultVariant.getAvailabilityModel().availabilityStatus
                });
                
                Object.defineProperty(product, 'defaultVariantPrice', {
                    enumerable: true,
                    value: priceFactory.getPrice(apiProduct.variationModel.defaultVariant, null, false, options.promotions, options.optionModel)
                });
            }
            
        }
    } catch (e) {
        Logger.error('Variation exception: {0} in {1} : {2}', e.toString(), e.fileName, e.lineNumber);
    }
    
    if (!empty(apiProduct)) {
        Object.defineProperty(product, 'apiProduct', {
            enumerable: true,
            value: apiProduct
        });
        
    }
    
    return product;
};
