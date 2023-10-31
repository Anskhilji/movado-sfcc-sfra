'use strict';

/* global $, document, Clyde, ClydeSitePreferences */

var clydeWidget;

// v1 code to define Clyde
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

// this code is used in v2 to define Clyde
if (window.ClydeSitePreferences && productId) {
    if (typeof Clyde !== 'undefined') {
        if (Clyde.checkReady() === false) {
            Clyde.init({
                key: ClydeSitePreferences.CLYDE_API_KEY,
                defaultSelector: '#clyde-cta',
                skipGeoIp: ClydeSitePreferences.CLYDE_WIDGET_SKIP_GEO_LOCATION
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

clydeWidget = {
    getSelectedClydeContract: function (form) {
        try {
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
        } catch (e) {
            return form;
        }
        return form;
    },
    getClydeVariantChange: function (variantId) {
        if (Clyde && variantId) {
            try {
                var previousId = Clyde.getActiveProduct() ? Clyde.getActiveProduct().sku : null;
                // If there was no active variant, or the previous one is different from the new one
                if (previousId && previousId !== variantId) {
                    salePrice = $('.prices .sale-price-mvmt span').attr('content');
                    if (salePrice && ClydeSitePreferences.IS_PROMOTIONAL_PRICE) {
                        productData = { sku: variantId, price: salePrice };
                    } else {
                        listPrice = $('.prices .price-pdp-mvmt .strike-through span').attr('price-value');
                        if (listPrice) {
                            productData = { sku: variantId, price: listPrice };
                        } else {
                            productData = { sku: variantId, price: '' };
                        }
                    }
                    Clyde.setActiveProduct(productData);
                }
            } catch (e) {
                return;
            }
        }
    }
};

module.exports = clydeWidget;
