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
$(document).ready(function () {
    refreshAffirmUI();
    hideYotpoReviews();

    if ($(window).width() < 544) {
        var $stickyAddToCartObserver = document.querySelector('.add-to-cart-observer');
        var $stickyAddToCart = document.querySelector('.prices-add-to-cart-actions');

        if ($stickyAddToCartObserver !== null && $stickyAddToCart !== null) {
            var $obsCallBack = function (entries, observer) {
                var [$entry] = entries;
                
                if (!$entry.isIntersecting) {
                    $stickyAddToCart.classList.remove('d-none');
                    $stickyAddToCart.classList.add('d-block');
                } else {
                    $stickyAddToCart.classList.add('d-none');
                    $stickyAddToCart.classList.remove('d-block');
                }
            };
           
            var $observer = new IntersectionObserver($obsCallBack, {
                root: null,
                threshold: 0.1
            });
            $observer.observe($stickyAddToCartObserver);
        }
    }
});

function refreshAffirmUI() {
    if (Resources.AFFIRM_PAYMENT_METHOD_STATUS) {
        if (document.readyState === "complete") {
            affirm.ui.ready(function() {
                affirm.ui.refresh();
            });
        } else {
            setTimeout(function () {
                refreshAffirmUI();
            }, 200);
        }
    }
};

function hideYotpoReviews() {
    if (document.readyState === 'complete') {
        var $yotpoMobileContainer = $('.ratings.d-none-mobile-rating');
        var $yotpoEmptyStarContainer = $yotpoMobileContainer.find('.yotpo-stars > .yotpo-icon-empty-star');
        var $yotpoEmptyStarContainerMobile = $('.ratings.ratings-mobile').find('.yotpo-stars > .yotpo-icon-empty-star');
        var $yotpoEmptyReviewContainer = $('.yotpo-stars-rating');

        if ($yotpoMobileContainer.find('.yotpo-stars').length > 0) {
            var $yotpoIconContainer = $yotpoMobileContainer.find('.yotpo-stars > .yotpo-icon-star');
            var $yotpoIconContainerMobile = $('.ratings.ratings-mobile').find('.yotpo-stars > .yotpo-icon-star');

            if ($yotpoIconContainer.length > 0 || $yotpoIconContainerMobile.length > 0) {
                $yotpoEmptyStarContainer.removeClass('d-none').addClass('d-block');
                $yotpoEmptyStarContainerMobile.removeClass('d-none').addClass('d-block');
                $yotpoEmptyReviewContainer.removeClass('d-none').addClass('d-block');
            } else {
                $yotpoEmptyStarContainer.removeClass('d-block').addClass('d-none');
                $yotpoEmptyStarContainerMobile.removeClass('d-block').addClass('d-none');
                $yotpoEmptyReviewContainer.removeClass('d-block').addClass('d-none');
            }
        } else {
            setTimeout(hideYotpoReviews, 5000);
        }
    } else {
        setTimeout(hideYotpoReviews, 5000);
    }
}
