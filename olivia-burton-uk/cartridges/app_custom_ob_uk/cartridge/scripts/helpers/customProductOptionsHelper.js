'use strict';

var Transaction = require('dw/system/Transaction');
var collections = require('*/cartridge/scripts/util/collections');
var EMBOSSED = 'Embossed';
var ENGRAVED = 'Engraved';
var NEWLINE = '\n';

/**
 * Code to populate personalization message in the ProductLineItem
 * @param basket
 * @param productId
 * @param result
 * @param text
 * @param persoonalizationtype
 * @returns
 */
function updateOptionLineItem(lineItemCtnr, productUUID, embossedMessage, engravedMessage, orientation, font) {
    collections.forEach(lineItemCtnr.productLineItems, function (pli) {
        if (pli.UUID == productUUID) {
            if (pli.optionProductLineItems) {
                collections.forEach(pli.optionProductLineItems, function (option) {
                    Transaction.wrap(function () {
                        if (option.optionID == EMBOSSED && embossedMessage) {
                            if(orientation == 'true') {
                                pli.custom.isHorizontal = true;
                            }
                        } else if (option.optionID == ENGRAVED && engravedMessage) {
                            pli.custom.fontName = font;
                        }
                    });
                });
            }
        }
	 });
}

module.exports = {
    updateOptionLineItem: updateOptionLineItem,
};
