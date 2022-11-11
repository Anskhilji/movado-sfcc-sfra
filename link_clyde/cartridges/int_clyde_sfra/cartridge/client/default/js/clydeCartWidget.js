// New File added from MSS-1671 v2Cartridge

'use strict';

/* global $, document, Clyde, ClydeSitePreferences */

/**
 * re-renders the order totals and the number of items in the cart
 * @param {Object} message - Error message to display
 */
function createErrorNotification(message) {
    var errorHtml = '<div class="alert alert-danger alert-dismissible valid-cart-error ' +
        'fade show" role="alert">' +
        '<button type="button" class="close" data-dismiss="alert" aria-label="Close">' +
        '<span aria-hidden="true">&times;</span>' +
        '</button>' + message + '</div>';

    $('.cart-error').append(errorHtml);
}

/**
 * Function used to add product into cart
 */
function addProductToCart() {
    var actionURL = $('.clyde-cart-widget-action').data('action-url');
    if (Clyde.getActiveProduct().contracts && Clyde.getActiveProduct().contracts.length > 0) {
        var product = Clyde.getActiveProduct().sku;
        var selectedContract = Clyde.getSelectedContract().sku;
        var data = {
            pid: product,
            clydeContractSku: selectedContract
        };

        $.ajax({
            url: actionURL,
            type: 'get',
            data: data,
            success: function (response) {
                if (response.error) {
                    createErrorNotification(response.message);
                } else {
                    location.reload();
                }
            },
            error: function () {
                location.reload();
            }
        });
    }
}

/**
 * function use to display contract
 */
function displayContract() {
    var salePrice;
    var listPrice;
    var productData;
    Clyde.init({
        key: ClydeSitePreferences.CLYDE_API_KEY,
        skipGeoIp: ClydeSitePreferences.CLYDE_SKIP_GEO_IP
    }, function () {
        var clydeWidgetHandler = Clyde.getSettings();
        if (clydeWidgetHandler.cart === true) {
            var clydeCartWidget = document.getElementsByClassName('clyde-cart-widget');
            for (var i = 0; i < clydeCartWidget.length; i++) {
                var productId = clydeCartWidget[i].getAttribute('data-product-id');
                var container = '#' + clydeCartWidget[i].id;
                // Custom start: Add code for product price with sku:
                salePrice = $('.line-item-total-price .price .line-item-total-price-amount').text();
                if (salePrice) {
                    salePrice = salePrice.split('$')[1];
                    salePrice = salePrice.replace(/^\s+|\s+$/gm, '');
                    productData = { sku: productId, price: salePrice };
                } else {
                    listPrice = $('.line-item-total-price .price .original-price').text();
                    if (listPrice) {
                        listPrice = listPrice.split('$')[1];
                        listPrice = listPrice.replace(/^\s+|\s+$/gm, '');
                        productData = { sku: productId, price: listPrice };
                    } else {
                        productData = { sku: productId, price: '' };
                    }
                }
                // Custom End
                Clyde.appendToSelectorWithSku(productData, container, addProductToCart);
            }
        }
    });
}

if (document.readyState === 'complete' && Clyde.checkReady() === true) {
    displayContract();
} else {
    setTimeout(displayContract, 1000);
}
