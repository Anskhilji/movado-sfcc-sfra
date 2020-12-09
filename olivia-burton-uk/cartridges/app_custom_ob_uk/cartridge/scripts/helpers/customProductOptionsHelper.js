'use strict';

var Transaction = require('dw/system/Transaction');
var collections = require('*/cartridge/scripts/util/collections');
var Site = require('dw/system/Site').getCurrent();
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
                            if(orientation) {
                                pli.custom.isHorizontal = orientation;
                            }
                        } else if (option.optionID == ENGRAVED && engravedMessage) {
                            if(font) {
                                pli.custom.fontName = font;
                            }
                        }
                    });
                });
            }
        }
	 });
}

function getCurrentCountry() {
    var eswHelper = require('*/cartridge/scripts/helper/eswHelper').getEswHelper();
    var isEswEnabled = !empty(Site.current.getCustomPreferenceValue('eswEshopworldModuleEnabled')) ? Site.current.getCustomPreferenceValue('eswEshopworldModuleEnabled') : false;
    var availableCountry = 'US';
    if (isEswEnabled) { 
        availableCountry = eswHelper.getAvailableCountry();
        if (availableCountry == null || empty(availableCountry)) {
            availableCountry = 'US';
        }
    }

    return availableCountry;
}

module.exports = {
    updateOptionLineItem: updateOptionLineItem,
    getCurrentCountry: getCurrentCountry
};
