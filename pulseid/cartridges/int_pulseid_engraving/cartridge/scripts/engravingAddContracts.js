'use strict';

var Logger = require('dw/system/Logger');
var ProductMgr = require('dw/catalog/ProductMgr');

var pulseIdConstants = require('*/cartridge/scripts/utils/pulseIdConstants');

function getEngravingSelectedOptionProduct(productId) {
    var result = {
        optionProduct: '',
        engravedSKUID: '',
        optionValue: ''
    };

    try {
        if (!empty(productId)) {
            var product = ProductMgr.getProduct(productId);
            if (!empty(product)) {
                var optionModel = product.optionModel;
                var engravedOption = optionModel.getOption(pulseIdConstants.PULSEID_SERVICE_ID.ENGRAVED_OPTION_PRODUCT_ID);
                var optionValue = optionModel.getOptionValue(engravedOption, pulseIdConstants.PULSEID_SERVICE_ID.ENGRAVED_OPTION_PRODUCT_VALUE_ID);
                if (!empty(optionValue)) {
                    optionModel.setSelectedOptionValue(engravedOption, optionValue);
                    result.optionProduct = optionModel;
                    result.engravedSKUID = pulseIdConstants.PULSEID_SERVICE_ID.ENGRAVED_OPTION_PRODUCT_VALUE_ID;
                    result.optionValue = optionValue;
                    return result;
                }
            }
        }
    } catch (ex) {
        Logger.error('(engravingAddContracts~getEngravingSelectedOptionProduct) -> Error occured while trying to get option product and error is : {0} at line number {1}', ex, ex.lineNumber);
    }

    return result;
}

function addEngravingContractAttributes(engravedSKU, basket, productId, form) {
    var productLineItemItr = basket.getAllProductLineItems().iterator();

    while (productLineItemItr.hasNext()) {
        var productLineItem = productLineItemItr.next();

        if (productLineItem && productLineItem.productID === productId && !empty(engravedSKU)) {
            var optionLineItemsItr = productLineItem.getOptionProductLineItems().iterator();

            while (optionLineItemsItr.hasNext()) {
                var optionLineItem = optionLineItemsItr.next();

                if (optionLineItem && optionLineItem.optionValueID === engravedSKU) {
                    optionLineItem.setTaxClassID(pulseIdConstants.ENGRAVING_OPTION_PRODUCT_TAX_ID);
                    optionLineItem.setLineItemText(engravedSKU + ' ' + productLineItem.productName);
                    optionLineItem.custom.engraveMessageLine1 = !empty(form.engravingTextOne) ? form.engravingTextOne : '';
                    optionLineItem.custom.engraveMessageLine2 = !empty(form.engravingTextTwo) ? form.engravingTextTwo : '';
                    optionLineItem.custom.pulseIDPreviewURL = !empty(form.previewUrl) ? form.previewUrl : '';
                    optionLineItem.custom.pulseIDAssociatedProductId = !empty(form.pid) ? form.pid : '';
                }
            }
        }
    }
}

module.exports = {
    getEngravingSelectedOptionProduct: getEngravingSelectedOptionProduct,
    addEngravingContractAttributes: addEngravingContractAttributes
};
