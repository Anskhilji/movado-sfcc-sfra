'use strict';

var baseProductTile = module.superModule;
var ATTRIBUTE_NAME = 'color';
var priceFactory = require('*/cartridge/scripts/factories/price');
var productHelper = require('*/cartridge/scripts/helpers/productHelpers');

module.exports = function productTile(product, apiProduct, productType, params) {
    baseProductTile.call(this, product, apiProduct, productType, params);
    
    var colorVariations;
    var defaultVariantImage;
    var defaultVariant;
    
    
    if (product.variationAttributes) {
        Object.keys(product.variationAttributes).forEach(function (key) {
            if (product.variationAttributes[key].id == ATTRIBUTE_NAME) {
                colorVariations = product.variationAttributes[key];
            }
        });
    }
    
    if (colorVariations && colorVariations.values) {
        var varAttr = colorVariations.values;
        var variant = apiProduct.variationModel.defaultVariant;
        Object.keys(varAttr).forEach(function (key) {
            if (variant.custom.color == varAttr[key].id) {
                defaultVariantImage = varAttr[key].images.swatch[0].url;
                defaultVariant = variant;
            }
        });
        Object.defineProperty(product, 'defaultVariantImageDIS', {
            enumerable: true,
            value: defaultVariantImage
        });
        
        Object.defineProperty(product, 'defaultVariant', {
            enumerable: true,
            value: defaultVariant
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
    
    if (!empty(apiProduct)) {
        Object.defineProperty(product, 'apiProduct', {
            enumerable: true,
            value: apiProduct
        });
        
    }
    
    return product;
};
