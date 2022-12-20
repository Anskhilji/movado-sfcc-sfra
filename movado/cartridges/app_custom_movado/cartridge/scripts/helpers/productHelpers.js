'use strict';
var collections = require('*/cartridge/scripts/util/collections');
var base = module.superModule;

/**
 * Provides a current option model by setting selected option values
 *
 * @param {dw.catalog.ProductOptionModel} optionModel - Product's option model
 * @param {SelectedOption[]} selectedOptions - Options selected in UI
 * @return {dw.catalog.ProductOptionModel} - Option model updated with selected options
 */
function getCurrentOptionModel(optionModel, selectedOptions) {
    var productOptions = optionModel.options;
    var selectedValue;
    var selectedValueId = '';

    if (selectedOptions && selectedOptions.length) {
        collections.forEach(productOptions, function (option) {
            // Custom Start: [MSS-1789] To Avoid Selected Value ID Error 
            var currentOption = selectedOptions.filter(function (selectedOption) {
                return selectedOption.optionId === option.ID;
            });
            if (currentOption && currentOption.length > 0 && 'selectedValueId' in currentOption[0]) {
                selectedValueId = currentOption[0].selectedValueId;
            }
            // Custom End
            selectedValue = optionModel.getOptionValue(option, selectedValueId);
            optionModel.setSelectedOptionValue(option, selectedValue);
        });
    }

    return optionModel;
}

/**
 * Normalize product and return Product variation model
 * @param  {dw.catalog.Product} product - Product instance returned from the API
 * @param  {Object} productVariables - variables passed in the query string to
 *                                     target product variation group
 * @return {dw.catalog.ProductVarationModel} Normalized variation model
 */
function getVariationModel(product, productVariables, productType) {
    var variationModel = productType == 'variant' ? product.masterProduct.variationModel : product.variationModel;
    if (!variationModel.master && !variationModel.selectedVariant) {
        variationModel = null;
    } else if (productVariables) {
        var variationAttrs = variationModel.productVariationAttributes;
        Object.keys(productVariables).forEach(function (attr) {
            if (attr && productVariables[attr].value) {
                var dwAttr = collections.find(variationAttrs,
                    function (item) { return item.ID === attr; });
                var dwAttrValue = collections.find(variationModel.getAllValues(dwAttr),
                    function (item) { return item.value === productVariables[attr].value; });
                if (dwAttr && dwAttrValue) {
                    variationModel.setSelectedAttributeValue(dwAttr.ID, dwAttrValue.ID);
                }
            }
        });
    }
    return variationModel;
}

/**
 * If a product is master and only have one variant for a given attribute - auto select it
 * @param {dw.catalog.Product} apiProduct - Product from the API
 * @param {Object} params - Parameters passed by querystring
 *
 * @returns {Object} - Object with selected parameters
 */
function normalizeSelectedAttributes(apiProduct, params) {
    if (!apiProduct.master) {
        return params.variables;
    }

    var variables = params.variables || {};
    if (apiProduct.variationModel) {
        collections.forEach(apiProduct.variationModel.productVariationAttributes, function (attribute) {
            var allValues = apiProduct.variationModel.getAllValues(attribute);
            if (allValues.length === 1) {
                variables[attribute.ID] = {
                    id: apiProduct.ID,
                    value: allValues.get(0).ID
                };
            }
        });
    }

    return Object.keys(variables) ? variables : null;
}

/**
 * Get information for model creation
 * @param {dw.catalog.Product} apiProduct - Product from the API
 * @param {Object} params - Parameters passed by querystring
 *
 * @returns {Object} - Config object
 */
function getConfig(apiProduct, params) {
    var variables = normalizeSelectedAttributes(apiProduct, params);
    var variationModel = getVariationModel(apiProduct, variables, base.getProductType(apiProduct));
    if (variationModel) {
        apiProduct = variationModel.selectedVariant || apiProduct; // eslint-disable-line
    }
    var PromotionMgr = require('dw/campaign/PromotionMgr');
    var promotions = PromotionMgr.activeCustomerPromotions.getProductPromotions(apiProduct);
    var optionsModel = base.getCurrentOptionModel(apiProduct.optionModel, params.options);
    var options = {
        variationModel: variationModel,
        options: params.options,
        optionModel: optionsModel,
        promotions: promotions,
        quantity: params.quantity,
        variables: variables,
        apiProduct: apiProduct,
        productType: base.getProductType(apiProduct)
    };

    return options;
}

base.getCurrentOptionModel = getCurrentOptionModel;
base.getVariationModel = getVariationModel;
base.getConfig = getConfig;
module.exports = base;