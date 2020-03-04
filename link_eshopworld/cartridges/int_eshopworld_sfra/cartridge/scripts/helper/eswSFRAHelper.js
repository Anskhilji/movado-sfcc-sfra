/**
 * Helper script to get all ESW site preferences
 **/

var eswHelper = require('*/cartridge/scripts/helper/eswHelper').getEswHelper();

var getEswHelper = {
    getEShopWorldModuleEnabled: function () {
        return eswHelper.getEShopWorldModuleEnabled();
    },
    /*
     * Function is used to get override country from given country and currency
     */
    getOverrideCountry: function (selectedCountry, selectedCurrency) {
        return eswHelper.getOverrideCountry(selectedCountry, selectedCurrency);
    },
    /*
     * Function to perform fxrate calculations, apply adjustments, duty and tax and returns money object
     */
    getMoneyObject: function (price, noAdjustment, formatted, noRounding) {
        return eswHelper.getMoneyObject(price, noAdjustment, formatted, noRounding);
    },
    /*
     * This function is used to get total of cart or productlineitems based on input
     */
    getSubtotalObject: function (cart, isCart, listPrice) {
        return eswHelper.getSubtotalObject(cart, isCart, listPrice);
    },
    /*
     * This function is used to get Unit price cost for given lineitem
     */
    getUnitPriceCost: function (lineItem) {
        return eswHelper.getUnitPriceCost(lineItem);
    }
};
module.exports = getEswHelper;
