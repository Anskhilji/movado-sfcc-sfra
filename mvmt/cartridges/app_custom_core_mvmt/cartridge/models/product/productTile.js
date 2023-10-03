'use strict';

var baseProductTile = module.superModule;
var ATTRIBUTE_NAME = 'color';

var Logger = require('dw/system/Logger');
var URLUtils = require('dw/web/URLUtils');

var Constants = require('*/cartridge/scripts/util/Constants');
var COLOR_WATCH = Constants.COLOR_WATCH;
var decorators = require('*/cartridge/models/product/decorators/index');
var priceFactory = require('*/cartridge/scripts/factories/price');
var productCustomHelpers = require('*/cartridge/scripts/helpers/productCustomHelpers');
var productHelper = require('*/cartridge/scripts/helpers/productHelpers');
var PromotionMgr = require('dw/campaign/PromotionMgr');

module.exports = function productTile(product, apiProduct, productType, params) {
    baseProductTile.call(this, product, apiProduct, productType, params);
    var eswCustomHelper = require('*/cartridge/scripts/helpers/eswCustomHelper');
    var productCustomHelper = require('*/cartridge/scripts/helpers/productCustomHelper');
    
    var colorVariations;
    var defaultVariantImage;
    var defulatVariantEyewearImage;
    var defaultVariant;
    var selectedSwatch;
    var variationPdpURL;
    var swatchesURL;
    var caseDiameter = productCustomHelper.getCaseDiameter(apiProduct);
    var caseDiameterRedesigned = productCustomHelper.getCaseDiameter(apiProduct, true);
    var isWatchTile = productCustomHelper.getIsWatchTile(apiProduct);
    var color = productCustomHelper.getColor(apiProduct);
    var promotions = PromotionMgr.activeCustomerPromotions.getProductPromotions(apiProduct);
    var promotionObj = productCustomHelper.getGtmPromotionObject(promotions);
    var currentCountry = productCustomHelper.getCurrentCountry();
    var isCurrentDomesticAllowedCountry = eswCustomHelper.isCurrentDomesticAllowedCountry();

    var variationParam = '';
    var variationParamValue = '';
    var otherVariantValues = '';
    var tileImage300X375;
    var tile512X640;
    var defaultVariantLifeStyleImage;
    var defaultVariantLifeStyleImage512x512;
    var defaultVariantLifeStyleImage300X375;
    var defaultVariantEyeWearLifeStyleImage;
    var tileImage300X300;
    var defaultVariantLifeStyleImage300X300;
    var productId;
    var productVariants;

    try {
        var options = productHelper.getConfig(apiProduct, { pid: product.id });
        decorators.variationsAttributes(product, options.variationModel, {
            attributes: '*',
            endPoint: 'Variation'
        });

        if (apiProduct.variationModel && apiProduct.variationModel.variants && apiProduct.variationModel.variants.length > 0) {
            productVariants = apiProduct.variationModel.variants.toArray();
        }

        if (product.variationsAttributes) {
            Object.keys(product.variationsAttributes).forEach(function (key) {
                if (product.variationsAttributes[key].id !== ATTRIBUTE_NAME && product.variationsAttributes[key].id !== COLOR_WATCH) {
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

                if ((product.variationsAttributes[key].id === ATTRIBUTE_NAME) || (product.variationsAttributes[key].id === COLOR_WATCH)) {
                    colorVariations = product.variationsAttributes[key];
                }

                if (!empty(colorVariations) && !empty(colorVariations.values)) {
                    if (colorVariations.id === ATTRIBUTE_NAME) {
                        Object.keys(colorVariations.values).forEach(function (key) {
                            productVariants.filter(function (variant) {
                                if (variant.custom.color == colorVariations.values[key].id) {
                                    productId = variant.ID;
                                    return;
                                }
                            });
                            if (colorVariations.values[key]) {
                                colorVariations.values[key].swatchesURL = URLUtils.url(
                                        'Product-Variation',
                                        'dwvar_' + productId + '_color',
                                        colorVariations.values[key].id,
                                        'pid',
                                        productId,
                                        'quantity',
                                        '1'
                                        ).toString();
    
                                colorVariations.values[key].pdpURL = URLUtils.url(
                                        'Product-Show',
                                        'pid',
                                        productId,
                                        'dwvar_' + productId + '_color',
                                        colorVariations.values[key].id
                                        ).toString();
    
                                if (!empty(variationParam) && !empty(variationParamValue)) {
                                    colorVariations.values[key].swatchesURL = URLUtils.url(
                                            'Product-Variation',
                                            'dwvar_' + productId + '_color',
                                            colorVariations.values[key].id,
                                            'dwvar_' + productId + '_' + variationParam,
                                            variationParamValue,
                                            'pid',
                                            productId,
                                            'quantity',
                                            '1'
                                            ).toString();
    
                                    colorVariations.values[key].pdpURL = URLUtils.url(
                                            'Product-Show',
                                            'pid',
                                            productId,
                                            'dwvar_' + productId + '_color',
                                            colorVariations.values[key].id,
                                            'dwvar_' + productId + '_' + variationParam,
                                            variationParamValue
                                            ).toString();
                                }
                            }
                        });
                    } else {
                        Object.keys(colorVariations.values).forEach(function (key) {
                            productVariants.filter(function (variant) {
                                var productColor = variant.custom.productName ? variant.custom.productName : apiProduct.variationModel.variants[apiProductKey].custom.color;
                                if (productColor == colorVariations.values[key].id) {
                                    productId = variant.ID;
                                    return;
                                }
                            });
                            if (colorVariations.values[key]) {
                                colorVariations.values[key].swatchesURL = URLUtils.url(
                                    'Product-Variation',
                                    'dwvar_' + productId + '_colorWatch',
                                    colorVariations.values[key].id,
                                    'pid',
                                    productId,
                                    'quantity',
                                    '1'
                                ).toString();

                                colorVariations.values[key].pdpURL = URLUtils.url(
                                    'Product-Show',
                                    'pid',
                                    productId,
                                    'dwvar_' + productId + '_colorWatch',
                                    colorVariations.values[key].id
                                ).toString();

                                if (!empty(variationParam) && !empty(variationParamValue)) {
                                    colorVariations.values[key].swatchesURL = URLUtils.url(
                                        'Product-Variation',
                                        'dwvar_' + productId + '_colorWatch',
                                        colorVariations.values[key].id,
                                        'dwvar_' + productId + '_' + variationParam,
                                        variationParamValue,
                                        'pid',
                                        productId,
                                        'quantity',
                                        '1'
                                    ).toString();

                                    colorVariations.values[key].pdpURL = URLUtils.url(
                                        'Product-Show',
                                        'pid',
                                        productId,
                                        'dwvar_' + productId + '_colorWatch',
                                        colorVariations.values[key].id,
                                        'dwvar_' + productId + '_' + variationParam,
                                        variationParamValue
                                    ).toString();
                                }
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
                    if (variant.custom.color == varAttr[key].id || variant.custom.productName == varAttr[key].id) {
                        defaultVariantImage = !empty(varAttr[key].largeImage) ? varAttr[key].largeImage.url : '';
                        defulatVariantEyewearImage = !empty(varAttr[key].eyeWearImage) ? varAttr[key].eyeWearImage.url : '';
                        variationPdpURL = !empty(varAttr[key].pdpURL) ? varAttr[key].pdpURL : '';
                        defaultVariant = variant;
                        selectedSwatch = varAttr[key];
                        tileImage300X375 = !empty(varAttr[key].tileImage300X375) ? varAttr[key].tileImage300X375.url : '';
                        tile512X640 = !empty(varAttr[key].tileImage512X640) ? varAttr[key].tileImage512X640.url : '';
                        defaultVariantLifeStyleImage = !empty(varAttr[key].lifeStyleImage) ? varAttr[key].lifeStyleImage.url : '';
                        defaultVariantLifeStyleImage300X375 = !empty(varAttr[key].lifeStyleImage300X375) ? varAttr[key].lifeStyleImage300X375.url : '';
                        defaultVariantEyeWearLifeStyleImage = !empty(varAttr[key].eyeWearLifeStyleImage) ? varAttr[key].eyeWearLifeStyleImage.url : '';
                        defaultVariantLifeStyleImage512x512 =  !empty(varAttr[key].lifeStyleImage512x512) ? varAttr[key].lifeStyleImage512x512.url : '';
                        tileImage300X300 = !empty(varAttr[key].tileImage300X300) ? varAttr[key].tileImage300X300.url : '';
                        defaultVariantLifeStyleImage300X300 = !empty(varAttr[key].lifeStyleImage300X300) ? varAttr[key].lifeStyleImage300X300.url : '';

                    }
                });
            } else {
                defulatVariantEyewearImage = !empty(varAttr[0].eyeWearImage) ? varAttr[0].eyeWearImage.url : '';
                defaultVariantImage = !empty(varAttr[0].largeImage) ? varAttr[0].largeImage.url : '';
                variationPdpURL = !empty(varAttr[0].pdpURL) ? varAttr[0].pdpURL : '';
                defaultVariant = varAttr[0];
                selectedSwatch = varAttr[0];
                tileImage300X375 = !empty(varAttr[0].tileImage300X375) ? varAttr[0].tileImage300X375.url : '';
                tile512X640 = !empty(varAttr[0].tileImage512X640) ? varAttr[0].tileImage512X640.url : '';
                defaultVariantLifeStyleImage = !empty(varAttr[0].lifeStyleImage) ? varAttr[0].lifeStyleImage.url : '';
                defaultVariantLifeStyleImage300X375 = !empty(varAttr[0].lifeStyleImage300X375) ? varAttr[0].lifeStyleImage300X375.url : '';
                defaultVariantEyeWearLifeStyleImage = !empty(varAttr[0].eyeWearLifeStyleImage) ? varAttr[0].eyeWearLifeStyleImage.url : '';
                tileImage300X300 = !empty(varAttr[0].tileImage300X300) ? varAttr[0].tileImage300X300.url : '';
                defaultVariantLifeStyleImage300X300 = !empty(varAttr[0].lifeStyleImage300X300) ? varAttr[0].lifeStyleImage300X300.url : '';
                defaultVariantLifeStyleImage512x512 =  !empty(varAttr[0].lifeStyleImage512x512) ? varAttr[0].lifeStyleImage512x512.url : '';

            }

            Object.defineProperty(product, 'defaultVariantLifeStyleImage', {
                enumerable: true,
                value: defaultVariantLifeStyleImage
            });
            
            Object.defineProperty(product, 'defaultVariantLifeStyleImage512x512', {
                enumerable: true,
                value: defaultVariantLifeStyleImage512x512
            });

            Object.defineProperty(product, 'defaultVariantEyeWearLifeStyleImage', {
                enumerable: true,
                value: defaultVariantEyeWearLifeStyleImage
            });

            Object.defineProperty(product, 'defaultVariantLifeStyleImage300X375', {
                enumerable: true,
                value: defaultVariantLifeStyleImage300X375
            });

            Object.defineProperty(product, 'defaultVariantLifeStyleImage300X300', {
                enumerable: true,
                value: defaultVariantLifeStyleImage300X300
            });

            Object.defineProperty(product, 'defaultVariantImageDIS', {
                enumerable: true,
                value: defaultVariantImage
            });

            Object.defineProperty(product, 'defulatVariantEyewearImage', {
                enumerable: true,
                value: defulatVariantEyewearImage
            });
            
            Object.defineProperty(product, 'defaultVariantTileImage300X375', {
                enumerable: true,
                value: tileImage300X375
            });

            Object.defineProperty(product, 'defaultVariantTileImage300X300', {
                enumerable: true,
                value: tileImage300X300
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
                var variantCaseDiameterRedesigned = '';
                var caseDiameter = !empty(variant.custom.caseDiameter) ? variant.custom.caseDiameter : '';
                var familyName = !empty(variant.custom.familyName) ? variant.custom.familyName[0] : '';
                var productName = !empty(variant.name) ? variant.name : '';
                var isWatchTile = productCustomHelper.getIsWatchTile(variant);
                if (isWatchTile && !empty(familyName) && !empty(caseDiameter)) {
                    variantCaseDiameter = Constants.FAMILY_NAME_AND_CASE_DIAMETER_SEPARATOR + caseDiameter + Constants.MM_UNIT;
                    variantCaseDiameterRedesigned = Constants.FAMILY_NAME_AND_CASE_DIAMETER_SEPARATOR_REDESIGN + caseDiameter + Constants.MM_UNIT;
                } else if (!isWatchTile && !empty(productName) && !empty(caseDiameter)) {
                    variantCaseDiameter = Constants.FAMILY_NAME_AND_CASE_DIAMETER_SEPARATOR + caseDiameter + Constants.MM_UNIT;
                    variantCaseDiameterRedesigned = Constants.FAMILY_NAME_AND_CASE_DIAMETER_SEPARATOR_REDESIGN + caseDiameter + Constants.MM_UNIT;
                } else if (!empty(caseDiameter)) {
                    variantCaseDiameter = caseDiameter + Constants.MM_UNIT;
                }
                
                Object.defineProperty(product, 'defaultVariantCaseDiameter', {
                    enumerable: true,
                    value: !empty(variantCaseDiameter) ? variantCaseDiameter : ''
                });

                Object.defineProperty(product, 'defaultVariantCaseDiameterRedesigned', {
                    enumerable: true,
                    value: !empty(variantCaseDiameterRedesigned) ? variantCaseDiameterRedesigned : ''
                });

                Object.defineProperty(product, 'defaultVariantPrice', {
                    enumerable: true,
                    value: priceFactory.getPrice(apiProduct.variationModel.defaultVariant, null, false, options.promotions, options.optionModel)
                });

                Object.defineProperty(product, 'defaultVariantID', {
                    enumerable: true,
                    value: apiProduct.variationModel.defaultVariant.ID ? apiProduct.variationModel.defaultVariant.ID : apiProduct.ID
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
    
    //custom start: [MSS-2351 - Prevent International Orders on a SKU Level to set default variant values in master]
    if (product.productType == 'master' && product.defaultVariant && product.defaultVariant.custom && product.defaultVariant.custom.productNotRestrictedOnEswCountries.length > 0) {
        isProductNotRestrictedOnEswCountries = productCustomHelper.productNotRestrictedOnEswCountries(currentCountry, product.defaultVariant, isCurrentDomesticAllowedCountry);
    } else {
        var isProductNotRestrictedOnEswCountries = productCustomHelper.productNotRestrictedOnEswCountries(currentCountry, apiProduct, isCurrentDomesticAllowedCountry);

        if (isProductNotRestrictedOnEswCountries && !isCurrentDomesticAllowedCountry) {
            var ContentMgr = require('dw/content/ContentMgr');

            var eswNotRestrictedCountriesProductMsg = ContentMgr.getContent('ca-esw-not-restricted-countries-product-msg');
            var eswNotRestrictedCountriesProductMsgBody = eswNotRestrictedCountriesProductMsg && eswNotRestrictedCountriesProductMsg.custom && eswNotRestrictedCountriesProductMsg.custom.body && !empty(eswNotRestrictedCountriesProductMsg.custom.body.markup) ? eswNotRestrictedCountriesProductMsg.custom.body : '';
        }
    }
    //custom end:
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

    if (!empty(caseDiameterRedesigned)) {
        Object.defineProperty(product, 'caseDiameterRedesigned', {
            enumerable: true,
            value: caseDiameterRedesigned
        });
    }

    if (!empty(isWatchTile)) {
        Object.defineProperty(product, 'isWatchTile', {
            enumerable: true,
            value: isWatchTile
        });
    }

    if (!empty(color)) {
        Object.defineProperty(product, 'color', {
            enumerable: true,
            value: color
        });
    }
    var saveMessage = productCustomHelper.getSaveMessage(apiProduct);
    Object.defineProperty(product, 'saveMessage', {
        enumerable: true,
        value: saveMessage
    });

    Object.defineProperty(product, 'isProductNotRestrictedOnEswCountries', {
        enumerable: true,
        value: isProductNotRestrictedOnEswCountries
    });

    if (isProductNotRestrictedOnEswCountries && !isCurrentDomesticAllowedCountry) {
        Object.defineProperty(product, 'eswNotRestrictedCountriesProductMsgBody', {
            enumerable: true,
            value: eswNotRestrictedCountriesProductMsgBody
        });
    }

    return product;
};
