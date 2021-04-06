'use strict';
var base = require('./base');

module.exports = {
    availability: base.availability,

    addToCart: base.addToCart,
    allowOnlyAlphaNumericInput: base.allowOnlyAlphaNumericInput,
    switchEmbossOrientation: base.switchEmbossOrientation,

    updateAttributesAndDetails: function () {
        $('body').on('product:statusUpdate', function (e, data) {
            var $productContainer = $('.product-detail[data-pid="' + data.id + '"]');

            $productContainer.find('.description-and-detail .product-attributes')
                .empty()
                .html(data.attributesHtml);

            if (data.shortDescription) {
                $productContainer.find('.description-and-detail .description')
                    .removeClass('hidden-xl-down');
                $productContainer.find('.description-and-detail .description .content')
                    .empty()
                    .html(data.shortDescription);
            } else {
                $productContainer.find('.description-and-detail .description')
                    .addClass('hidden-xl-down');
            }

            if (data.longDescription) {
                $productContainer.find('.description-and-detail .details')
                    .removeClass('hidden-xl-down');
                $productContainer.find('.description-and-detail .details .content')
                    .empty()
                    .html(data.longDescription);
            } else {
                $productContainer.find('.description-and-detail .details')
                    .addClass('hidden-xl-down');
            }
        });
    },

    showSpinner: function () {
        $('body').on('product:beforeAddToCart product:beforeAttributeSelect', function () {
            $.spinner().start();
        });
    },
    updateAttribute: function () {
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
        });
    },
    updateAddToCart: function () {
        $('body').on('product:updateAddToCart', function (e, response) {
            // update local add to cart (for sets)
            $('button.add-to-cart', response.$productContainer).attr('disabled',
                (!response.product.readyToOrder || !response.product.available));

            var enable = $('.product-availability').toArray().every(function (item) {
                return $(item).data('available') && $(item).data('ready-to-order');
            });
            $('button.add-to-cart-global').parent().toggleClass('d-none', !enable);

            if (response.product.readyToOrder) {
                var applePayButton = $('.apple-pay-pdp', response.$productContainer);
                if (applePayButton.length !== 0) {
                    applePayButton.attr('sku', response.product.id);
                } else {
                    if ($('.apple-pay-pdp').length === 0) { // eslint-disable-line no-lonely-if
                        $('.cart-and-ipay').append('<isapplepay class="apple-pay-pdp btn"' +
                            'sku=' + response.product.id + '></isapplepay>');
                    }
                }
            } else {
                $('.apple-pay-pdp').remove();
            }
        });
    },
    updateAvailability: function () {
        $('body').on('product:updateAvailability', function (e, response) {
            $('div.availability', response.$productContainer)
                .data('ready-to-order', response.product.readyToOrder)
                .data('available', response.product.available);

            $('.availability-msg', response.$productContainer)
                .empty().html(response.message);

            if ($('.global-availability').length) {
                var allAvailable = $('.product-availability').toArray()
                    .every(function (item) { return $(item).data('available'); });

                var allReady = $('.product-availability').toArray()
                    .every(function (item) { return $(item).data('ready-to-order'); });

                $('.global-availability')
                    .data('ready-to-order', allReady)
                    .data('available', allAvailable);

                $('.global-availability .availability-msg').empty()
                    .html(allReady ? response.message : response.resources.info_selectforstock);
            }
        });
    },
    linkedSlider: function () {
        $('.recomended-products').slick({
            slidesToShow: 3,
            slidesToScroll: 1,
            focusOnSelect: true,
            infinite: false,
            dots: false,
            arrows: true,
        });
    },
    updatePrice: function () {
        $(document).on('click', '.upsell-input', function() {
            var upselprice = $(this).siblings('.upsell-wrapper-inner').find('.sales .value').attr('content');
            var currentPrice = $('.prices .sales .value').attr('content');
            var updatedPrice;
            var updatedText;
            if ($(this).is(':checked')) {
                updatedPrice = parseFloat(currentPrice) + parseFloat(upselprice);
            } else {
                updatedPrice  = parseFloat(currentPrice) - parseFloat(upselprice);
            }

            if (updatedPrice && !isNaN(updatedPrice)) {
                $('.prices .sales .value').each(function() {
                    updatedText = $(this).text().replace(/(\d+.+|\d+)|(\d+[.,]\d+|\d+)/g, updatedPrice.toFixed(2));
                    $(this).text(updatedText).attr('content', updatedPrice);
                });
            }
            updateKlarnaPayment(updatedPrice);
        });
    },
    sizeChart: function () {
        var $sizeChart = $('.size-chart-collapsible');
        $('.size-chart a').on('click', function (e) {
            e.preventDefault();
            var url = $(this).attr('href');
            if ($sizeChart.is(':empty')) {
                $.ajax({
                    url: url,
                    type: 'get',
                    dataType: 'json',
                    success: function (data) {
                        $sizeChart.append(data.content);
                    }
                });
            }
            $sizeChart.toggleClass('active');
        });

        $('body').on('click touchstart', function (e) {
            if ($('.size-chart').has(e.target).length <= 0) {
                $sizeChart.removeClass('active');
            }
        });
    }
};
$( document ).ready(function() {
    refreshAffirmUI();
});
function updateKlarnaPayment(updatedPrice){
    $('klarna-placement').attr('data-purchase_amount', updatedPrice * 100);
            window.KlarnaOnsiteService = window.KlarnaOnsiteService || [];
            window.KlarnaOnsiteService.push({
            eventName: 'refresh-placements'
        });
}
function refreshAffirmUI() {
    if (Resources.AFFIRM_PAYMENT_METHOD_STATUS) {
        if (document.readyState === "complete") {
            affirm.ui.refresh();
        } else {
            setTimeout(function() {
                refreshAffirmUI();
            }, 200);
        }
    }
}
