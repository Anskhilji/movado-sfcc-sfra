'use strict';


/**
 *
 * @param productIds
 * @returns wishlistGtmObj
 */
function getProductVariants(itemOptions) {
	// var collections = require('*/cartridge/scripts/util/collections');
    var productOptions = '';
    for (var i = 0; i < itemOptions.length; i++) {
        var options = itemOptions[i].optionId;
        if (productOptions == '') {
            productOptions = options;
        } else {
            productOptions = productOptions + ',' + options;
        }
    }

    return productOptions;
}

module.exports = {
    getProductVariants: getProductVariants
};
