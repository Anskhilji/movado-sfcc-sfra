'use strict';

/* global $, document, Clyde, ClydeSitePreferences */

var clydeWidget;

// v1 code to define Clyde
var elem = document.querySelector('.product-number span');
var productId = elem ? elem.textContent : null;
if (document.querySelector('.product-number span')) {
    productId = document.querySelector('.product-number span').innerHTML || '';

} else {
    var cartValue = document.querySelector('.add-to-cart');
    if (cartValue) {
        productId = cartValue.dataset.pid;
    }
}

// this code is used in v2 to define Clyde 
if (window.ClydeSitePreferences && !Clyde.checkReady() && productId) {
    Clyde.init({
        key: ClydeSitePreferences.CLYDE_API_KEY,
        defaultSelector: '#clyde-cta',
        skipGeoIp: ClydeSitePreferences.CLYDE_SKIP_GEO_IP
    }, function () {
        var clydeWidgetHandler = Clyde.getSettings();
        if (clydeWidgetHandler.productPage === true) {
            Clyde.setActiveProduct(productId);
        }
    });
}

// this code is V1 code for define Clyde but its not working so we comment

// if (typeof Clyde !== 'undefined' && productId) {
//     if (Clyde.checkReady() === false) {
//         Clyde.init({
//             key: ClydeSitePreferences.CLYDE_API_KEY,
//             defaultSelector: '#clyde-cta',
//             type: ClydeSitePreferences.CLYDE_WIDGET_TYPE,
//             environment: ClydeSitePreferences.CLYDE_WIDGET_ENVIRONMENT,
//             skipGeoIp: ClydeSitePreferences.CLYDE_WIDGET_SKIP_GEO_LOCATION
//         }, function () {
//             Clyde.setActiveProduct(productId);
//         }
//         );
//     }
// }


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
