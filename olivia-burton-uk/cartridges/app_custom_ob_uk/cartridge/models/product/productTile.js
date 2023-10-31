'use strict';

var baseProductTile = module.superModule;
var ATTRIBUTE_NAME = 'color';

var Logger = require('dw/system/Logger');
var ProductSearchModel = require('dw/catalog/ProductSearchModel');
var URLUtils = require('dw/web/URLUtils');

var Constants = require('*/cartridge/scripts/util/Constants');

var COLOR_WATCH = Constants.COLOR_WATCH;
var decorators = require('*/cartridge/models/product/decorators/index');
var priceFactory = require('*/cartridge/scripts/factories/price');
var productCustomHelpers = require('*/cartridge/scripts/helpers/productCustomHelpers');
var productHelper = require('*/cartridge/scripts/helpers/productHelpers');

/**
 * Get product search hit for a given product
 * @param {dw.catalog.Product} apiProduct - Product instance returned from the API
 * @returns {dw.catalog.ProductSearchHit} - product search hit for a given product
 */
function getProductSearchHit(apiProduct) {
    var searchModel = new ProductSearchModel();
    if (!empty(apiProduct)) {
        searchModel.setSearchPhrase(apiProduct.ID);
        searchModel.search();
    }

    if (searchModel.count === 0) {
        searchModel.setSearchPhrase(apiProduct.ID.replace(/-/g, ' '));
        searchModel.search();
    }

    var hit = searchModel.getProductSearchHit(apiProduct);
    if (!hit) {
        var searchHits = searchModel.getProductSearchHits();
        while (searchHits.hasNext()) {
            var tempHit = searchHits.next();
            if (tempHit.firstRepresentedProductID === apiProduct.ID) {
                hit = tempHit;
            } else if (!empty(apiProduct) && !empty(apiProduct.variants) && apiProduct.variants.length > 0 && tempHit.hitType == Constants.SLICING_GROUP || tempHit.hitType == Constants.VARIATION_GROUP) {
                allVariantProducts = apiProduct.variants.toArray();
                variantProduct = allVariantProducts.filter(function (data) { return data.ID === tempHit.firstRepresentedProductID });
                hit = variantProduct ? tempHit : null;
            }
        }
    }
    return hit;
}

/**
 * Decorate product with product tile information
 * @param {Object} product - Product Model to be decorated
 * @param {dw.catalog.Product} apiProduct - Product information returned by the script API
 * @param {string} productType - Product type information
 *
 * @returns {Object} - Decorated product model
 */
module.exports = function productTile(product, apiProduct, productType, params, productSetStockAvailabilityModel, factory) {
    var productSearchHit = getProductSearchHit(apiProduct);
    var productCustomHelper = require('*/cartridge/scripts/helpers/productCustomHelper');
    var yotpoReviewsCustomAttribute = productCustomHelper.getYotpoReviewsCustomAttribute(apiProduct);
    var ociPreOrderParameters = productCustomHelper.getOCIPreOrderParameters(apiProduct);

    var colorVariations;
    var defaultVariantImage;
    var defaultVariant;
    var selectedSwatch;
    var variationPdpURL;
    var variationParam = '';
    var variationParamValue = '';
    var otherVariantValues = '';
    var productId;
    var productVariants;

    var tile640Xtile764;
    var tile512Xtile640;
    var tile640;
    var defaultVariantLifeStyleImage512X640;
    var defaultVariantLifeStyleImage640X764;
    var defaultVariantLifeStyleImage640;

    if (!productSearchHit) {
        return null;
    }
    var options = productHelper.getConfig(apiProduct, { pid: product.id });

    decorators.price(product, apiProduct, options.promotions, false, options.optionModel);
    decorators.setIndividualProducts(product, apiProduct, factory);

    if (!params.base || params.base == true) {
        decorators.base(product, apiProduct, productType);
    }
    if (!params.ratings || params.ratings == true) {
        decorators.ratings(product);
    }
    if (!params.searchVariation || params.searchVariation == true) {
        decorators.searchVariationAttributes(product, productSearchHit);
    }
    if (!params.mgattributes || params.mgattributes == true) {
        decorators.mgattributes(product, apiProduct);
    }
    if (!params.images || params.images == true) {
        decorators.images(product, apiProduct, { types: ['tile533', 'tile256', 'tile217', 'tile640', 'tile520', 'tile300', 'tile150', 'tile512'], quantity: 'all' });
    }
    if (!params.promotions || params.promotions == true) {
        decorators.promotions(product, options.promotions);
    }
    if (!params.availability || params.availability == true) {
        decorators.availability(product, options.quantity, apiProduct.minOrderQuantity.value, apiProduct.availabilityModel, productSetStockAvailabilityModel);
    }

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
                    if (variant.custom.color == varAttr[key].id) {
                        defaultVariantImage = !empty(varAttr[key].largeImage) ? varAttr[key].largeImage.url : '';
                        variationPdpURL = !empty(varAttr[key].pdpURL) ? varAttr[key].pdpURL : '';
                        defaultVariant = variant;
                        selectedSwatch = varAttr[key];
                        tile640Xtile764 = !empty(varAttr[key].tile640Xtile764) ? varAttr[key].tile640Xtile764.url : '';
                        tile512Xtile640 = !empty(varAttr[key].tile512Xtile640) ? varAttr[key].tile512Xtile640.url : '';
                        tile640 = !empty(varAttr[key].tile640) ? varAttr[key].tile640.url : '';
                        defaultVariantLifeStyleImage512X640 = !empty(varAttr[key].lifeStyleImage512X640) ? varAttr[key].lifeStyleImage512X640.url : '';
                        defaultVariantLifeStyleImage640X764 = !empty(varAttr[key].lifeStyleImage640X764) ? varAttr[key].lifeStyleImage640X764.url : '';
                        defaultVariantLifeStyleImage640 = !empty(varAttr[key].lifeStyleImage640) ? varAttr[key].lifeStyleImage640.url : '';
                    }
                });
            } else {
                defaultVariantImage = !empty(varAttr[0].largeImage) ? varAttr[0].largeImage.url : '';
                variationPdpURL = !empty(varAttr[0].pdpURL) ? varAttr[0].pdpURL : '';
                defaultVariant = varAttr[0];
                selectedSwatch = varAttr[0];
                tile640Xtile764 = !empty(varAttr[key].tile640Xtile764) ? varAttr[key].tile640Xtile764.url : '';
                tile512Xtile640 = !empty(varAttr[key].tile512Xtile640) ? varAttr[key].tile512Xtile640.url : '';
                tile640 = !empty(varAttr[key].tile640) ? varAttr[key].tile640.url : '';
                defaultVariantLifeStyleImage512X640 = !empty(varAttr[key].lifeStyleImage512X640) ? varAttr[key].lifeStyleImage512X640.url : '';
                defaultVariantLifeStyleImage640X764 = !empty(varAttr[key].lifeStyleImage640X764) ? varAttr[key].lifeStyleImage640X764.url : '';
            }

            Object.defineProperty(product, 'defaultVariantLifeStyleImage512X640', {
                enumerable: true,
                value: defaultVariantLifeStyleImage512X640
            });

            Object.defineProperty(product, 'defaultVariantLifeStyleImage640X764', {
                enumerable: true,
                value: defaultVariantLifeStyleImage640X764
            });

            Object.defineProperty(product, 'defaultVariantLifeStyleImage640', {
                enumerable: true,
                value: defaultVariantLifeStyleImage640
            });

            Object.defineProperty(product, 'defaultVariantImageDIS', {
                enumerable: true,
                value: defaultVariantImage
            });

            Object.defineProperty(product, 'defaultVariantTile640X764', {
                enumerable: true,
                value: tile640Xtile764
            });

            Object.defineProperty(product, 'defaultVariantTile512X640', {
                enumerable: true,
                value: tile512Xtile640
            });

            Object.defineProperty(product, 'defaultVariantTile640', {
                enumerable: true,
                value: tile640
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

    var productCustomHelper = require('*/cartridge/scripts/helpers/productCustomHelper');
    var collectionName = productCustomHelper.getCollectionName(apiProduct);
    var saveMessage = productCustomHelper.getSaveMessage(apiProduct);
    Object.defineProperty(product, 'collectionName', {
        enumerable: true,
        value: collectionName
    });
    Object.defineProperty(product, 'saveMessage', {
        enumerable: true,
        value: saveMessage
    });
    /**
     * Custom Start: Redesign Changes
     */
    var isRedesignedBadge =  productCustomHelpers.isOnlyRedesignedBadge(product);
    Object.defineProperty(product, 'isRedesignedBadge', {
        enumerable: true,
        value: isRedesignedBadge
    });

    /**
     * Custom End:
     */

    if (!empty(yotpoReviewsCustomAttribute)) {
        Object.defineProperty(product, 'yotpoReviewsCustomAttribute', {
            enumerable: true,
            value: yotpoReviewsCustomAttribute
        });
    }

     if (!empty(ociPreOrderParameters)) {
        Object.defineProperty(product, 'ociPreOrderParameters', {
            enumerable: true,
            value: ociPreOrderParameters
        });
    }

    return product;
};