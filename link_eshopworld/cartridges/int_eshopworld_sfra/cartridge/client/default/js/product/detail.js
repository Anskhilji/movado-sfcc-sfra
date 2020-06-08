'use strict';

var baseDetail = require('base/product/detail');

baseDetail.updateAttribute = function () {
    $('body').on('product:afterAttributeSelect', function (e, response) {
        if ($('.product-detail>.bundle-items').length) {
            response.container.data('pid', response.data.product.id);
            response.container.find('.product-id').text(response.data.product.id);
        } else if ($('.product-set-detail').eq(0)) {
            response.container.data('pid', response.data.product.id);
            response.container.find('.product-id').text(response.data.product.id);
        } else {
            $('.product-id').text(response.data.product.id);
            $('.product-detail:not(".bundle-item")').data('pid', response.data.product.id);
        }

        if (response.data.product.isProductRestricted) {
            response.container.find('button.add-to-cart').addClass('d-none');
            response.container.find('.price').addClass('d-none');
            response.container.find('.product-not-available-msg').removeClass('d-none');
        } else {
            response.container.find('button.add-to-cart').removeClass('d-none');
            response.container.find('.price').removeClass('d-none');
            response.container.find('.product-not-available-msg').addClass('d-none');
        }

        // Remote Include call For List Price
        var $eswListPriceSelector = $('.eswListPrice', response.container).length ? $('.eswListPrice', response.container) : $('.eswListPrice');
        eswConvertPrice($eswListPriceSelector); // eslint-disable-line no-undef

        // Remote Include call For Sales Price
        var $eswPriceSelector = $('.eswPrice', response.container).length ? $('.eswPrice', response.container) : $('.eswPrice');
        eswConvertPrice($eswPriceSelector); // eslint-disable-line no-undef
    });
};

module.exports = baseDetail;
