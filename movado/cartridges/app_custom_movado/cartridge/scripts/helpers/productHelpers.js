'use strict';
var PromotionMgr = require('dw/campaign/PromotionMgr');
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

base.getCurrentOptionModel = getCurrentOptionModel;
module.exports = base;