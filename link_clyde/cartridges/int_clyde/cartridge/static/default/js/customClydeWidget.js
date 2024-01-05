// New File added from MSS-1671 v2Cartridge

'use strict';
/* eslint-disable no-unused-vars */
/* global $, document, Clyde, ClydeSitePreferences */

var elem = document.querySelector('.product-number span');
var productId = elem ? elem.textContent : null;
var salePrice;
var listPrice;
var productData;
if (document.querySelector('.product-number span')) {
    productId = document.querySelector('.product-number span').innerHTML || '';
} else {
    var cartValue = document.querySelector('.prices-add-to-cart-actions .add-to-cart');
    var clydeCta = document.querySelector('#clyde-cta');
    if (clydeCta && cartValue) {
        productId = cartValue.dataset.pid;
    }
}

if (window.ClydeSitePreferences && productId) {
    if (typeof Clyde !== 'undefined') {
        if (Clyde.checkReady() === false) {
            Clyde.init({
                key: ClydeSitePreferences.CLYDE_API_KEY,
                defaultSelector: '#clyde-cta',
                skipGeoIp: ClydeSitePreferences.CLYDE_SKIP_GEO_IP
            }, function () {
                var clydeWidgetHandler = Clyde.getSettings();
                if (clydeWidgetHandler.productPage === true) {
                    // Custom start: Add code for product price with sku:
                    salePrice = $('.prices .sale-price-mvmt span').attr('content');
                    if (salePrice && ClydeSitePreferences.IS_PROMOTIONAL_PRICE) {
                        productData = { sku: productId, price: salePrice };
                    } else {
                        listPrice = $('.prices .price-pdp-mvmt .strike-through span').attr('price-value');
                        if (listPrice) {
                            productData = { sku: productId, price: listPrice };
                        } else {
                            productData = { sku: productId, price: '' };
                        }
                    }
                    // Custom End
                    Clyde.setActiveProduct(productData);
                }
            });
        }
    }
}
/**
 * @description Get the selected contract on the product detail page
 * @param {Element} form The form element that contains the contract sku and price data
 * @returns {Object} form object.
 */
var getSelectedClydeContract = function (form) {
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
    } else if (document.getElementById('clydeContractSku')) {
        // Reset the values
        form.find('#clydeContractSku').attr('value', '');
        form.find('#clydeContractPrice').attr('value', '');
    }

    return form;
};
/**
 * @description show Clyde widget for the variant change.
 */
var getClydeVariantChange = function () {
    var variantId = document.querySelector('.product-number span').innerHTML;
    if (Clyde && variantId) {
        var previousId = Clyde.getActiveProduct() ? Clyde.getActiveProduct().sku : null;
        // If there was no active variant, or the previous one is different from the new one
        if (previousId && previousId !== variantId) {
            Clyde.setActiveProduct(variantId);
        }
    }
};
