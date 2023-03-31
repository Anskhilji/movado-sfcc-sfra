'use strict';
var base = require('./base');
var clydeWidget = require('link_clyde/getClydeWidget.js');


/**
* @description Get clyde widget on variant change
* @param {Object} response - response object
*/
function getClydeVariantChange(response) {
    clydeWidget.getClydeVariantChange(response.data.product.id);
}

module.exports = {
    availability: base.availability,

    addToCart: base.addToCart,

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

            //Custom Start: Adding ESW Code Logic
            if (typeof data.eswModuleEnabled !== undefined) {
                if (data.eswModuleEnabled) {
                    // Remote Include call For List Price
                    var $eswListPriceSelector = $('.eswListPrice', response.container).length ? $('.eswListPrice', response.container) : $('.eswListPrice');
                    eswConvertPrice($eswListPriceSelector); // eslint-disable-line no-undef
                    // Remote Include call For Sales Price
                    var $eswPriceSelector = $('.eswPrice', response.container).length ? $('.eswPrice', response.container) : $('.eswPrice');
                    eswConvertPrice($eswPriceSelector); // eslint-disable-line no-undef
                }
            }
            //Custom End
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
                if(window.Resources.IS_CLYDE_ENABLED) {
                    getClydeVariantChange(response);
                }
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
                // Custom Start: Enable Add to  Cart if product Ready To Order
                $('button.add-to-cart').attr('disabled', false);
                // Custom End
                var applePayButton = $('.apple-pay-pdp', response.$productContainer);
                if (applePayButton.length !== 0) {
                    applePayButton.attr('sku', response.product.id);
                } else {
                    if ($('.apple-pay-pdp').length === 0) { // eslint-disable-line no-lonely-if
                        $('.cart-and-ipay .cta-add-to-cart').append('<isapplepay class="apple-pay-pdp btn"' +
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

    if (window.ApplePaySession) {
        $('.google-pay-wrapper').removeClass('mt-2');
    }
});

// added active class & scroll down on reviews widget
$('.ratings > .yotpoBottomLine').on('click',function () {
    var $mainWidget = $('.main-widget > .yotpo-display-wrapper');
    $('html, body').animate({
        scrollTop: $($mainWidget).offset().top
    }, 10);
});

// Custom start: Listrak persistent popup
$(document).on('click','.listrak-popup', function(e) {
    e.preventDefault();
    e.stopPropagation();
    var isContainListrakPopup = e.target.closest('.listrak-popup');
    var targetEl = e.target;
    var isTargetContain = targetEl.classList.contains('close-icon-popup');
    if (isContainListrakPopup && !isTargetContain) {
        var listrakPersistenPopupUrl = document.querySelector('.listrak-persistent-url');
        var url = listrakPersistenPopupUrl.dataset.listrakUrl;
        $.ajax({
            url: url,
            method: 'GET',
            success: function (response) {
                if (response.success == true) {
                    var interval = setInterval(function() {
                        if (typeof _ltk != "undefined" && typeof _ltk.Popup != "undefined") {
                            _ltk.Popup.openManualByName(response.popupID);
                            clearInterval(interval);
                        }
                    }, 1000);
                }
            },
            error: function () {
                $.spinner().stop();
            }
        });
    }
});

$(document).on('click','.close-icon-popup', function(e) {
    e.preventDefault();
    e.stopPropagation();
    var isContainListrakPopup = e.target.closest('.listrak-popup');
    var targetEl = e.target;
    var isTargetContain = targetEl.classList.contains('close-icon-popup');
    if (isContainListrakPopup && isTargetContain) {
        sessionStorage.setItem("listrakPersistenPopup", "false");
        isContainListrakPopup.remove();
    }
});

$(window).on('load', function () {
    var listrakPopup = document.querySelector('.listrak-popup');
    var listrakPopupSearchResult = document.querySelector('.listrak-popup-search-result');
    var listrakPopupProductDetail = document.querySelector('.listrak-popup-product-detail');
    var data = sessionStorage.getItem("listrakPersistenPopup");
    if (data == null && listrakPopup != null) {
        var isListrakPopupContain = listrakPopup.classList.contains('listrak-persistent-popup');
    
        if (isListrakPopupContain) {
            listrakPopup.classList.remove('listrak-persistent-popup');
        }
    }
    if (listrakPopupSearchResult) {
        var mediumWidth = 992;
        var $windowWidth = $(window).width();
        if ($windowWidth < mediumWidth) {
            listrakPopup.classList.add('button-search-result');
        }
    }
    if (listrakPopupProductDetail) {
        var mediumWidth = 992;
        var $windowWidth = $(window).width();
        if ($windowWidth < mediumWidth) {
            listrakPopup.classList.add('button-product-detail');
        }
    }
});
// Custom End: Listrak persistent popup


function refreshAffirmUI() {
    if (Resources.AFFIRM_PAYMENT_METHOD_STATUS) {
        if (document.readyState === "complete") {
            affirm.ui.ready(function() {
                affirm.ui.refresh();
            });
        } else {
            setTimeout(function() {
                refreshAffirmUI();
            }, 200);
        }
    }
}
