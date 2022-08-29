'use strict';

var cart = require('../cart/cart');

/**
 * re-renders the order totals and the number of items in the cart
 * @param {Object} data - AJAX response from the server
 */
function updateCartTotals(data) {
    if (typeof data.totals.deliveryTime != 'undefined' &&  typeof data.totals.deliveryTime.isExpress != 'undefined' && data.totals.deliveryTime.isExpress) {
        $('.delivery-time').removeClass('d-none');
    } else {
        $('.delivery-time').addClass('d-none');
    }

    $('.delivery-date').empty().append(data.totals.deliveryDate);
    $('.number-of-items').empty().append(data.resources.numberOfItems);
    $('.shipping-cost').empty().append(data.totals.totalShippingCost);
    $('.tax-total').empty().append(data.totals.totalTax);
    $('.grand-total, .cart-total').empty().append(data.totals.grandTotal);
    $('.sub-total').empty().append(data.totals.subTotal);
    /* Affirm block for refreshing promo message */
    var totalCalculated = data.totals.grandTotal.substr(1).toString().replace(/\,/g, '');
    $('.affirm-as-low-as').attr('data-amount', (totalCalculated * 100).toFixed());
    if (Resources.AFFIRM_PAYMENT_METHOD_STATUS) {
        affirm.ui.ready(function() {
            affirm.ui.refresh();
        });
    }
    $('.minicart-quantity').empty().append(data.numItems);

    if (data.totals.orderLevelDiscountTotal.value > 0) {
        $('.order-discount').removeClass('hide-order-discount');
        $('.order-discount-total').empty()
            .append('- ' + data.totals.orderLevelDiscountTotal.formatted);
    } else {
        $('.order-discount').addClass('hide-order-discount');
    }

    if (data.totals.shippingLevelDiscountTotal.value > 0) {
        $('.shipping-discount').removeClass('hide-shipping-discount');
        $('.shipping-discount-total').empty().append('- ' +
            data.totals.shippingLevelDiscountTotal.formatted);
    } else {
        $('.shipping-discount').addClass('hide-shipping-discount');
    }

    data.items.forEach(function (item) {
        $('.item-' + item.UUID).empty().append(item.renderedPromotions);
        $('.item-total-' + item.UUID).empty().append(item.priceTotal.renderedPrice);
    });
}

/**
 * Updates the Mini-Cart quantity value after the customer has pressed the "Add to Cart" button
 * @param {string} response - ajax response from clicking the add to cart button
 */
function handlePostCartAdd(response) {
    $('.minicart').trigger('count:update', response);
    var messageType = response.error ? 'text-danger' : 'text-success';
    // show add to cart modal
    $('#addToCartModal .modal-body').html(response.message);
    $('#addToCartModal .modal-body p').addClass(messageType);
    if (typeof setAnalyticsTrackingByAJAX !== 'undefined') {
        if(response.cartAnalyticsTrackingData !== undefined) {
            setAnalyticsTrackingByAJAX.cartAnalyticsTrackingData = response.cartAnalyticsTrackingData;
            window.dispatchEvent(setAnalyticsTrackingByAJAX);
        }
        if(response.addCartGtmArray !== undefined){
        	 $('body').trigger('addToCart:success', JSON.stringify(response.addCartGtmArray));
        }
    }
    if (response.newBonusDiscountLineItem
        && Object.keys(response.newBonusDiscountLineItem).length !== 0) {
        chooseBonusProducts(response.newBonusDiscountLineItem);
    } else {
        $('#addToCartModal').modal('show');
        $('.slick-slider').slick('refresh');
    }
}

module.exports = function () {
    cart();

    $('.minicart').on('count:update', function (event, count) {
        if (count && $.isNumeric(count.quantityTotal)) {
            $('.minicart .minicart-quantity').text(count.quantityTotal);
        }
    });

    $('.minicart').on('mouseenter focusin touchstart', function () {
        if ($('.search:visible').length === 0) {
            return;
        }
        var url = $('.minicart').data('action-url');
        var count = parseInt($('.minicart .minicart-quantity').text(), 10);

        if (count !== 0 && $('.minicart .popover.show').length === 0) {
            $('.minicart .popover').addClass('show');
            $('.minicart .popover').spinner().start();
            $.get(url, function (data) {
                $('.minicart .popover').empty();
                $('.minicart .popover').append(data);
                $.spinner().stop();
            });
        }
    });
    $('body').on('touchstart click', function (e) {
        if ($('.minicart').has(e.target).length <= 0) {
            $('.minicart .popover').empty();
            $('.minicart .popover').removeClass('show');
        }
    });
    $('.minicart').on('mouseleave focusout', function (event) {
        if ((event.type === 'focusout' && $('.minicart').has(event.target).length > 0)
            || (event.type === 'mouseleave' && $(event.target).is('.minicart .quantity'))
            || $('body').hasClass('modal-open')) {
            event.stopPropagation();
            return;
        }
        $('.minicart .popover').empty();
        $('.minicart .popover').removeClass('show');
    });
    $('body').on('change', '.minicart .quantity', function () {
        if ($(this).parents('.bonus-product-line-item').length && $('.cart-page').length) {
            location.reload();
        }
    });
    $('body').off('click', '.product-card-wrapper .gift-allowed-checkbox').on('click', '.product-card-wrapper .gift-allowed-checkbox', function(e) {
        e.preventDefault();
        $.spinner().start();
        var $this = $(this);
        var url = $this.data('add-to-cart-url');
        var parentPid = $this.data('parent-pid');
        var pid = $this.val();
        var isCartPage = $(this).data('requested-page');
        var form = {
            pid: pid,
            quantity: 1,
            isGiftItem: true,
            isCartPage: isCartPage,
            parentPid: parentPid,
            };

            if (url) {
                $.ajax({
                    url: url,
                    method: 'POST',
                    data: form,
                    success: function (data) {
                    if (isCartPage) {
                        $('.main-cart-block .product-list-block').empty();
                        $('.main-cart-block .product-list-block').append(data.giftProductCardHtml);
                    } else {
                        $('.mini-cart-data .product-summary').empty();
                        $('.mini-cart-data .product-summary').append(data.giftProductCardHtml);
                    }
                        updateCartTotals(data.cart);
                        handlePostCartAdd(data);
                        //Custom Start: [MSS-1451] Listrak SendSCA on AddToCart
                        if (window.Resources.LISTRAK_ENABLED) {
                            var ltkSendSCA = require('listrak_custom/ltkSendSCA');
                            ltkSendSCA.renderSCA(data.SCACart, data.listrakCountryCode);
                        }

                        var pid = $this.data('pid');
                        $('.giftbox-mini-' + pid).hide();
                        $('.giftbox-mini-' + pid).next('label').hide();
                        $.spinner().stop();
                        //Custom End
                    },
                    error: function () {
                        $.spinner().stop();
                    },
                    complete: function () {
                        $('body').trigger('miniCart:recommendations');
                    }
                });
            }
    });

    $('body').off('click', '.product-card-wrapper .gift-allowed-checkbox').on('click', '.product-card-wrapper .gift-disallowed-checkbox', function(e) {
        e.preventDefault();
        $.spinner().start();
        var $this = $(this);
        var url = $this.data('add-to-cart-url');
        var parentPid = $this.data('parent-pid');
        var pid = $this.val();
        var isCartPage = $(this).data('requested-page');
        var form = {
            pid: pid,
            quantity: 1,
            isGiftItem: true,
            isCartPage: isCartPage,
            parentPid: parentPid
            };

            if (url) {
                $.ajax({
                    url: url,
                    method: 'POST',
                    data: form,
                    success: function (data) {
                    if (isCartPage) {
                        $('.main-cart-block .product-list-block').empty();
                        $('.main-cart-block .product-list-block').append(data.giftProductCardHtml);
                    } else {
                        $('.mini-cart-data .product-summary').empty();
                        $('.mini-cart-data .product-summary').append(data.giftProductCardHtml);
                    }
                        updateCartTotals(data.cart);
                        handlePostCartAdd(data);
                        //Custom Start: [MSS-1451] Listrak SendSCA on AddToCart
                        if (window.Resources.LISTRAK_ENABLED) {
                            var ltkSendSCA = require('listrak_custom/ltkSendSCA');
                            ltkSendSCA.renderSCA(data.SCACart, data.listrakCountryCode);
                        }

                        var pid = $this.data('pid');
                        $('.giftbox-mini-' + pid).hide();
                        $('.giftbox-mini-' + pid).next('label').hide();
                        $.spinner().stop();
                        //Custom End
                    },
                    error: function () {
                        $.spinner().stop();
                    },
                    complete: function () {
                        $('body').trigger('miniCart:recommendations');
                    }
                });
            }
    });
};
