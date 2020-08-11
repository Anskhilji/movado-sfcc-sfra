'use strict';

var baseProductTile = module.superModule;
var ATTRIBUTE_NAME = 'color';

var Logger = require('dw/system/Logger');
var URLUtils = require('dw/web/URLUtils');

var decorators = require('*/cartridge/models/product/decorators/index');
var priceFactory = require('*/cartridge/scripts/factories/price');
var productHelper = require('*/cartridge/scripts/helpers/productHelpers');
var PromotionMgr = require('dw/campaign/PromotionMgr');

module.exports = function productTile(product, apiProduct, productType, params) {
    baseProductTile.call(this, product, apiProduct, productType, params);
    var productCustomHelper = require('*/cartridge/scripts/helpers/productCustomHelper');
    
    var colorVariations;
    var defaultVariantImage;
    var defaultVariant;
    var selectedSwatch;
    var variationPdpURL;
    var swatchesURL;
    var eswPrice = productCustomHelper.getESWPrice(product);
    var promotions = PromotionMgr.activeCustomerPromotions.getProductPromotions(apiProduct);
    var promotionObj = productCustomHelper.getGtmPromotionObject(promotions);
    
    try {
        var options = productHelper.getConfig(apiProduct, { pid: product.id });
        decorators.variationsAttributes(product, options.variationModel, {
            attributes: '*',
            endPoint: 'Variation'
        });
        
        if (product.variationsAttributes) {
            Object.keys(product.variationsAttributes).forEach(function (key) {
                if (product.variationsAttributes[key].id == ATTRIBUTE_NAME) {
                    colorVariations = product.variationsAttributes[key];
                    if (!empty(colorVariations) && !empty(colorVariations.values)) {
                        Object.keys(colorVariations.values).forEach(function (key) {
                            if (colorVariations.values[key]) {
                                colorVariations.values[key].swatchesURL = URLUtils.url(
                                        'Product-Variation',
                                        'dwvar_' + product.id + '_color',
                                        colorVariations.values[key].id,
                                        'pid',
                                        product.id,
                                        'quantity',
                                        '1'
                                        ).toString();
                                colorVariations.values[key].pdpURL = URLUtils.url(
                                        'Product-Show',
                                        'pid',
                                        product.id,
                                        'dwvar_' + product.id + '_color',
                                        colorVariations.values[key].id
                                        ).toString();
                            }
                        });
                    }
                }
            });
        }

        if (!empty(colorVariations) && !empty(colorVariations.values)) {
            var varAttr = colorVariations.values;
            var variant = apiProduct.variationModel.defaultVariant;
            if (!empty(variant) && !empty(variant.custom)) {
                Object.keys(varAttr).forEach(function (key) {
                    if (variant.custom.color == varAttr[key].id) {
                        defaultVariantImage = !empty(varAttr[key].largeImage) ? varAttr[key].largeImage.url : '';
                        variationPdpURL = !empty(varAttr[key].pdpURL) ? varAttr[key].pdpURL : '';
                        defaultVariant = variant;
                        selectedSwatch = varAttr[key];
                    }
                });
            } else {
                defaultVariantImage = !empty(varAttr[0].largeImage) ? varAttr[0].largeImage.url : '';
                variationPdpURL = !empty(varAttr[0].pdpURL) ? varAttr[0].pdpURL : '';
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

    if (!empty(eswPrice)) {
        Object.defineProperty(product, 'eswPrice', {
            enumerable: true,
            value: eswPrice
        });
    }

    if (!empty(promotionObj)) {
        Object.defineProperty(product, 'promotionObj', {
            enumerable: true,
            value: promotionObj
        });
    } 
    
    return product;
};