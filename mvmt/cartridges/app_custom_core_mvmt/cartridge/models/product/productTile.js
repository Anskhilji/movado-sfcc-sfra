'use strict';

var baseProductTile = module.superModule;
var ATTRIBUTE_NAME = 'color';

var Logger = require('dw/system/Logger');
var URLUtils = require('dw/web/URLUtils');

var Constants = require('*/cartridge/scripts/util/Constants');
var decorators = require('*/cartridge/models/product/decorators/index');
var priceFactory = require('*/cartridge/scripts/factories/price');
var productCustomHelpers = require('*/cartridge/scripts/helpers/productCustomHelpers');
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
    var caseDiameter = productCustomHelper.getCaseDiameter(apiProduct);
    var color = productCustomHelper.getColor(apiProduct);
    var promotions = PromotionMgr.activeCustomerPromotions.getProductPromotions(apiProduct);
    var promotionObj = productCustomHelper.getGtmPromotionObject(promotions);
    var variationParam = '';
    var variationParamValue = '';
    var otherVariantValues = '';
    var tileImage206;
    var tile512X640;

    try {
        var options = productHelper.getConfig(apiProduct, { pid: product.id });
        decorators.variationsAttributes(product, options.variationModel, {
            attributes: '*',
            endPoint: 'Variation'
        });

        if (product.variationsAttributes) {
            Object.keys(product.variationsAttributes).forEach(function (key) {
                if (product.variationsAttributes[key].id !== ATTRIBUTE_NAME) {
                    defaultVariant = apiProduct.variationModel.defaultVariant;
                    otherVariantValues = product.variationsAttributes[key].values;
                    if (!empty(defaultVariant) && !empty(defaultVariant.custom)) {
                        Object.keys(otherVariantValues).forEach(function (value) {
                            if (defaultVariant.custom[product.variationsAttributes[key].id] === otherVariantValues[value].id) {
                                variationParam = product.variationsAttributes[key].id;
                                variationParamValue = otherVariantValues[value].id;
                            }
                        });
                    } else {
                        variationParam = product.variationsAttributes[key].id;
                        variationParamValue = product.variationsAttributes[key].values[0].id;
                    }
                }

                if (product.variationsAttributes[key].id === ATTRIBUTE_NAME) {
                    colorVariations = product.variationsAttributes[key];
                }

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

                            if (!empty(variationParam) && !empty(variationParamValue)) {
                                colorVariations.values[key].swatchesURL = URLUtils.url(
                                        'Product-Variation',
                                        'dwvar_' + product.id + '_color',
                                        colorVariations.values[key].id,
                                        'dwvar_' + product.id + '_' + variationParam,
                                        variationParamValue,
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
                                        colorVariations.values[key].id,
                                        'dwvar_' + product.id + '_' + variationParam,
                                        variationParamValue
                                        ).toString();
                            }
                        }
                    });
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
                        tileImage206 = !empty(varAttr[key].tileImage206) ? varAttr[key].tileImage206.url : '';
                        tile512X640 = !empty(varAttr[key].tileImage512X640) ? varAttr[key].tileImage512X640.url : '';

                    }
                });
            } else {
                defaultVariantImage = !empty(varAttr[0].largeImage) ? varAttr[0].largeImage.url : '';
                variationPdpURL = !empty(varAttr[0].pdpURL) ? varAttr[0].pdpURL : '';
                defaultVariant = varAttr[0];
                selectedSwatch = varAttr[0];
                tileImage206 = !empty(varAttr[0].tileImage206) ? varAttr[0].tileImage206.url : '';
                tile512X640 = !empty(varAttr[0].tileImage512X640) ? varAttr[0].tileImage512X640.url : '';
            }
            
            Object.defineProperty(product, 'defaultVariantImageDIS', {
                enumerable: true,
                value: defaultVariantImage
            });
            
            Object.defineProperty(product, 'defaultVariantTileImage206', {
                enumerable: true,
                value: tileImage206
            });

            Object.defineProperty(product, 'defaultVariantTile512X640', {
                enumerable: true,
                value: tile512X640
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

                Object.defineProperty(product, 'defaultVariantCollectionName', {
                    enumerable: true,
                    value: !empty(defaultVariant.custom.familyName) ? defaultVariant.custom.familyName[0] : ''
                });
                
                var variant = apiProduct.variationModel.defaultVariant;
                var variantCaseDiameter = '';
                var caseDiameter = !empty(variant.custom.caseDiameter) ? variant.custom.caseDiameter : '';
                var familyName = !empty(variant.custom.familyName) ? variant.custom.familyName[0] : '';
                if (!empty(familyName) && !empty(caseDiameter)) {
                    variantCaseDiameter = Constants.FAMILY_NAME_AND_CASE_DIAMETER_SEPARATOR + caseDiameter + Constants.MM_UNIT;
                } else if (!empty(caseDiameter)) {
                    variantCaseDiameter = caseDiameter + Constants.MM_UNIT;
                }
                
                Object.defineProperty(product, 'defaultVariantCaseDiameter', {
                    enumerable: true,
                    value: !empty(variantCaseDiameter) ? variantCaseDiameter : ''
                });
                
                Object.defineProperty(product, 'defaultVariantPrice', {
                    enumerable: true,
                    value: priceFactory.getPrice(apiProduct.variationModel.defaultVariant, null, false, options.promotions, options.optionModel)
                });

                Object.defineProperty(product, 'defaultVariantBadges', {
                    enumerable: true,
                    value: productCustomHelpers.getBadges(apiProduct.variationModel.defaultVariant)
                });
                Object.defineProperty(product, 'defaultVariantColor', {
                    enumerable: true,
                    value: apiProduct.variationModel.defaultVariant.custom.color || ''
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

    if (!empty(promotionObj)) {
        Object.defineProperty(product, 'promotionObj', {
            enumerable: true,
            value: promotionObj
        });
    } 

    if (!empty(caseDiameter)) {
        Object.defineProperty(product, 'caseDiameter', {
            enumerable: true,
            value: caseDiameter
        });
    }

    if (!empty(color)) {
        Object.defineProperty(product, 'color', {
            enumerable: true,
            value: color
        });
    }
    var productCustomHelper = require('*/cartridge/scripts/helpers/productCustomHelper');
    var saveMessage = productCustomHelper.getSaveMessage(apiProduct);
    Object.defineProperty(product, 'saveMessage', {
        enumerable: true,
        value: saveMessage
    });
    
    return product;
};
