'use strict';

/* global $, document, Clyde, ClydeSitePreferences */

var clydeWidget;
if (document.querySelector('.product-number span')) {
    var productId = document.querySelector('.product-number span').innerHTML || '';

    if (Clyde.checkReady() === false) {
        Clyde.init({
            key: ClydeSitePreferences.CLYDE_API_KEY,
            defaultSelector: '#clyde-cta',
            type: ClydeSitePreferences.CLYDE_WIDGET_TYPE,
            environment: ClydeSitePreferences.CLYDE_WIDGET_ENVIRONMENT,
            skipGeoIp: true
        }, function () {
            Clyde.setActiveProduct(productId);
        }
        );
    }
}


clydeWidget = {
    getSelectedClydeContract: function (form) {
        var clydeContract = Clyde.getSelectedContract();
        if (clydeContract) {
            if (document.getElementById('clydeContractSku')) {
                form.find('#clydeContractSku').attr('value', clydeContract.sku);
                form.find('#clydeContractPrice').attr('value', clydeContract.recommendedPrice);
            } else {
                var clydeForm = form;
                clydeForm.clydeContractSku = clydeContract.sku;
                clydeForm.clydeContractPrice = clydeContract.recommendedPrice;
                return clydeForm;
            }
        }
        return form;
    },
    getClydeVariantChange: function (variantId) {
        if (Clyde && variantId) {
            var previousId = Clyde.getActiveProduct() ? Clyde.getActiveProduct().sku : null;
            // If there was no active variant, or the previous one is different from the new one
            if (previousId && previousId !== variantId) {
                Clyde.setActiveProduct(variantId);
            }
        }
    }
};

module.exports = clydeWidget;
