'use strict';

var base = require('../product/base');

// Minicart Product summary cart height
function setMiniCartProductSummaryHeight () {
    var $miniCartHeaderTitle = parseInt($('.mini-cart-data .popover .title-free-shipping').outerHeight(true));
    var $miniCartCountrySelector = parseInt($('.mini-cart-data .popover .cart-country-selector').outerHeight(true));
    var $miniCartHeaderHeight = $miniCartHeaderTitle + $miniCartCountrySelector;
    if ($('.mini-cart-header').is(':visible')) {
        $miniCartHeaderHeight = parseInt($('.mini-cart-data .popover .mini-cart-header').outerHeight(true)) + $miniCartHeaderTitle + $miniCartCountrySelector;
    }
    var $miniCartFooterHeight = isNaN(parseInt($('.mini-cart-data .minicart-footer').outerHeight(true))) ? 166 : parseInt($('.mini-cart-data .minicart-footer').outerHeight(true));
    $miniCartHeaderHeight = isNaN($miniCartHeaderHeight) ? 97 : $miniCartHeaderHeight;
    var $productSummaryHeight = $miniCartFooterHeight + $miniCartHeaderHeight;
    $('.mini-cart-data .product-summary').css('max-height', '');
    var screenSize = $(window).width();
    var mediumScreenSize = 992; // mobile break point

    // check screen size for mobile and desktop
    if (screenSize != null) {
        if (screenSize <= mediumScreenSize) {
            $('.mini-cart-data .product-summary').css('padding-bottom', $miniCartFooterHeight);
        } else {
            $('.mini-cart-data .product-summary').css('padding-bottom', $productSummaryHeight);
        }
    }
}

/**
 * appends params to a url
 * @param {string} url - Original url
 * @param {Object} params - Parameters to append
 * @returns {string} result url with appended parameters
 */
function appendToUrl($url, params) {
    var $newUrl = $url;
    $newUrl += ($newUrl.indexOf('?') !== -1 ? '&' : '?') + Object.keys(params).map(function (key) {
        return key + '=' + encodeURIComponent(params[key]);
    }).join('&');

    return $newUrl;
}

/**
 * Checks whether the basket is valid. if invalid displays error message and disables
 * checkout button
 * @param {Object} data - AJAX response from the server
 */
function validateBasket(data) {
    if (data.valid.error) {
        if (data.valid.message) {
            var $errorHtml = '<div class="alert card alert-dismissible valid-cart-error ' +
                'fade show" role="alert">' +
                '<button type="button" class="close" data-dismiss="alert" aria-label="Close">' +
                '<span aria-hidden="true">&times;</span>' +
                '</button>' + data.valid.message + '</div>';

            $('.cart-error').empty().append($errorHtml);
        } else {
            $('.cart').empty().append('<div class="row"> ' +
                '<div class="col-12 text-center"> ' +
                '<h1>' + data.resources.emptyCartMsg + '</h1> ' +
                '</div> ' +
                '</div>'
            );
            $('.number-of-items').empty().append(data.resources.numberOfItems);
            $('.minicart-quantity').empty().append(data.numItems);
            $('.minicart .popover').empty().removeClass('show');
        }

        $('.checkout-btn').addClass('disabled');
    } else {
        $('.checkout-btn').removeClass('disabled');
    }
}

/**
 * re-renders the order totals and the number of items in the cart
 * @param {Object} data - AJAX response from the server
 */
function updateCartTotals(data) {
    $('.number-of-items').empty().append(data.resources.numberOfItems);
    $('.shipping-cost').empty().append(data.totals.totalShippingCost);
    $('.tax-total').empty().append(data.totals.totalTax);
    $('.grand-total, .cart-total').empty().append(data.totals.subTotaladjustedNetPrice);
    $('.sub-total').empty().append(data.totals.subTotal);
    /* Affirm block for refreshing promo message */
    var totalCalculated = data.totals.grandTotal.substr(1).toString().replace(/\,/g, '');
    $('.affirm-as-low-as').attr('data-amount', (totalCalculated * 100).toFixed());
    if ($('.affirm-as-low-as').length > 0) {
        if (Resources.AFFIRM_PAYMENT_METHOD_STATUS) {
            affirm.ui.refresh();
        }
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
    // Custom Start: Updated selector and rendered HTML as per MVMT site
        var savingPrice = item.priceTotal.formattedSavingPrice;
        var formattedSavingPrice = Number(savingPrice.replace(/[^0-9\.-]+/g,""));
        if (formattedSavingPrice > 0 ) {
            $('.line-item-total-price').children('.item-total-' + item.UUID + '.saving-price').children().remove();
            $('.line-item-total-price').children('.item-total-' + item.UUID + '.saving-price').prepend('<div class="savings">' + Resources.LABEL_SAVING_PRICE +
            item.priceTotal.formattedSavingPrice + '</div>');
        }
        if (item.price.list) {
            $('.item-total-' + item.UUID + ' .price .strike-through').remove();
            $('.item-total-' + item.UUID + ' .price').prepend('<span class="strike-through list">' +
                '<span class="value" content="' + item.priceTotal.nonAdjustedFormattedPrice + '">' +
                '<span class="sr-only">label.price.reduced.from</span>' +
                '<span class="eswListPrice">' + item.priceTotal.nonAdjustedFormattedPrice + '</span>' +
                '<span class="sr-only">label.price.to</span></span></span>');
        } else {
            $('.item-total-' + item.UUID + ' .price .strike-through').remove();
        }
        $('.item-total-' + item.UUID + ' .sales').empty().append(item.priceTotal.price);
    });
    // Custom End
}

/**
 * re-renders the order totals and the number of items in the cart
 * @param {Object} message - Error message to display
 */
function createErrorNotification(message) {
    var $errorHtml = '<div class="alert card alert-dismissible valid-cart-error ' +
        'fade show" role="alert">' +
        '<button type="button" class="close" data-dismiss="alert" aria-label="Close">' +
        '<span aria-hidden="true">&times;</span>' +
        '</button>' + message + '</div>';

    $('.cart-error').empty().append($errorHtml);
}

/**
 * re-renders the approaching discount messages
 * @param {Object} approachingDiscounts - updated approaching discounts for the cart
 */
function updateApproachingDiscounts(approachingDiscounts) {
    var $html = '';
    $('.approaching-discounts').empty();
    if (approachingDiscounts.length > 0) {
        approachingDiscounts.forEach(function (item) {
            $html += '<div class="single-approaching-discount text-center">'
                + item.discountMsg + '</div>';
        });
    }
    $('.approaching-discounts').append($html);
}

/**
 * Updates the availability of a product line item
 * @param {Object} data - AJAX response from the server
 * @param {string} uuid - The uuid of the product line item to update
 */
function updateAvailability(data, uuid) {
    var $lineItem;
    var $messages = '';

    for (var i = 0; i < data.items.length; i++) {
        if (data.items[i].UUID === uuid) {
            $lineItem = data.items[i];
            break;
        }
    }

    $('.availability-' + $lineItem.UUID).empty();

    if ($lineItem.availability) {
        if ($lineItem.availability.messages) {
            $lineItem.availability.messages.forEach(function (message) {
                $messages += '<p class="line-item-attributes">' + message + '</p>';
            });
        }

        if ($lineItem.availability.inStockDate) {
            $messages += '<p class="line-item-attributes line-item-instock-date">'
                + $lineItem.availability.inStockDate
                + '</p>';
        }
    }

    $('.availability-' + $lineItem.UUID).html($messages);
}


/**
 * This event binding function will handle the keyboard pressed keys on the basis of 
 * conditions and also it will replace the alphabets with empty string then update the 
 * quantity of the product.
 * @param e
 */
$('.quantity-form > .quantity').bind('keyup', function (e) {
    this.value = this.value.replace(/[^\d].+/, '');

    var $keyCode = (e.$keyCode ? e.$keyCode : e.which);
    //for down key arrow
    if ($keyCode == 40) {
        decreaseQuantity(this);
    }

    //for up key arrow
    if ($keyCode == 38) {
        increaseQuantity(this);
    }

    if ($keyCode != 8 && $keyCode != 46) {
        if (($keyCode >= 48 && $keyCode <= 57) || ($keyCode >= 96 && $keyCode <= 105)) {
            updateCartQuantity(this, true);
        }
    }

    if ($keyCode < 48 || $keyCode > 57 || $keyCode < 96 || $keyCode > 105) {
        e.preventDefault();
    }
});

/**
 * DecreaseQuantity function is used to decrease the quantity of the selected product if 
 * quantity of the product is empty or null then this function will add the one quantity instead of 
 * empty or null. if selected product quantity is one then it will disable the decreaseQuantity button.
 * @param quantitySelector
 * @param id
 */
function decreaseQuantity (quantitySelector, id) {
    var $quantity = parseInt($(quantitySelector).val());
    var $decreasedSelector = $('button.decreased-btn[data-pid="'+ id +'"]');
    if (isNaN($quantity)) {
        $decreasedSelector.attr('disabled', true);
        $quantity = 1;
    }

    $quantity = ($quantity > 1) ? $quantity - 1 : $quantity;

    if ($quantity == 1) {
        $decreasedSelector.attr('disabled', true);
    } else {
        $decreasedSelector.attr('disabled', false);
    }
    $(quantitySelector).val($quantity);
    updateCartQuantity(quantitySelector, false);
}

/**
 * IncreaseQuantity function is used to increase the quantity of the selected product if 
 * quantity of the product is empty or null then this function will add the one quantity instead of 
 * empty or null. if selected product quantity is one then it will disable the decreaseQuantity button.
 * @param quantitySelector
 * @param id
 */
function increaseQuantity (quantitySelector, id) {
    var $quantity = parseInt($(quantitySelector).val());
    var $decreasedSelector = $('button.decreased-btn[data-pid="'+ id +'"]');
    if (isNaN($quantity)) {
        $(quantitySelector).val(1);
        $decreasedSelector.attr('disabled', true);
    }

    if ($quantity >= 1) {
        $decreasedSelector.attr('disabled', false);
        $quantity = $quantity + 1;
        $(quantitySelector).val($quantity);
    }
    updateCartQuantity(quantitySelector, false);
}

/**
 * updateCartQuantity function will update the quantity in the product and the cart.
 * quantitySelector param is used to get the selected product class and it data attributes.
 * @param quantitySelector
 * @param isKeyEvent is used to check the current event is fire from keys or mouse.
 */
function updateCartQuantity (quantitySelector, isKeyEvent) {
    var $preSelectQty = $(quantitySelector).data('pre-select-qty');
    var $quantity = isKeyEvent ? parseInt(quantitySelector.value) : parseInt($(quantitySelector).val());
    var $productID = $(quantitySelector).data('pid');
    var $url = $(quantitySelector).data('action');
    var $uuid = $(quantitySelector).data('uuid');

    if (isNaN($quantity) || $quantity == 0) {
        $quantity = 1;
        $(quantitySelector).val($quantity);
    }

    if ($quantity == 1 || $quantity == 0) {
        $('#decreased-' + $productID).attr('disabled', true);
    } else {
        $('#decreased-' + $productID).attr('disabled', false);
    }

    var $urlParams = {
        pid: $productID,
        quantity: $quantity,
        uuid: $uuid
    };

    $url = appendToUrl($url, $urlParams);
    $(quantitySelector).parents('.product-info, .align-items-center').spinner().start();

    $.ajax({
        url: $url,
        type: 'get',
        context: quantitySelector,
        dataType: 'json',
        success: function (data) {
            $('.quantity[data-uuid="' + $uuid + '"]').val($quantity);
            $('.coupons-and-promos').empty().append(data.totals.discountsHtml);
            $('.minicart-footer .subtotal-total-discount').empty().append(data.totals.subTotal);
            updateCartTotals(data);
            updateApproachingDiscounts(data.approachingDiscounts);
            updateAvailability(data, $uuid);
            validateBasket(data);
            $(quantitySelector).data('pre-select-qty', $quantity);
            $.spinner().stop();
        },
        error: function (err) {
            if (err.responseJSON.redirectUrl) {
                window.location.href = err.responseJSON.redirectUrl;
            } else {
                createErrorNotification(err.responseJSON.errorMessage);
                $(quantitySelector).val(parseInt($preSelectQty, 10));
                $.spinner().stop();
            }
        }
    });
}

module.exports = function () {

    /**
     * This is new click event function on the decreased quantity button.
     * It will get the decreased-btn data attribute and builds the quantitySelector 
     * class and it will call the decreaseQuantity function.
     */
    $('html').off('click', '.decreased-btn, .decreased-qty-btn').on('click', '.decreased-btn, .decreased-qty-btn', function (e) {
        e.preventDefault();
        var $pid = $(this).data('pid');
        var $quantitySelector = '.' + $(this).data('pid');
        decreaseQuantity($quantitySelector, $pid);
    });

    /**
     * This is new click event function on the increased quantity button.
     * It will get the increased-btn data attribute and builds the quantitySelector 
     * class and it will call the increaseQuantity function.
     */
    $('html').off('click', '.increased-btn, .increased-qty-btn').on('click', '.increased-btn, .increased-qty-btn', function (e) {
        e.preventDefault();
        var $pid = $(this).data('pid');
        var $quantitySelector = '.' + $(this).data('pid');
        increaseQuantity($quantitySelector, $pid);
    });

    /**
     * This is override click event function on the remove button from mini-cart.
     * It is used to remove the product from the cart and if product is 
     * successfully removed then it will add the new classes with div's according to
     * the mvmt design.
     */
    $('body').off('click', '.remove-product-from-mini-cart').on('click', '.remove-product-from-mini-cart', function (e) {
        var $actionUrl = $(this).data('action');
        var $productID = $(this).data('pid');
        var $productName = $(this).data('name');
        var $uuid = $(this).data('uuid');
        var $gtmProdObj = $(this).data('gtm-cart');
        var $urlParams = {
            pid: $productID,
            uuid: $uuid
        };

        var $url = appendToUrl($actionUrl, $urlParams);
        $('.gtm-cart').attr('data-gtm-cart', JSON.stringify($gtmProdObj));

        $.spinner().start();
        $.ajax({
            url: $url,
            type: 'get',
            dataType: 'json',
            success: function (data) {
                if (data.basket.items.length === 0) {
                    var $svg = `<svg width="17" height="15" viewBox="0 0 17 15" xmlns="http://www.w3.org/2000/svg">
                    <path d="M4.751 14.928c.746 0 1.352-.59 1.352-1.315 0-.726-.606-1.316-1.352-1.316-.745 0-1.352.59-1.352 1.316 0 .725.607 1.315 1.352 1.315zM13.2 14.928h.1c.358-.03.686-.184.924-.455.239-.26.348-.6.328-.957-.05-.716-.696-1.267-1.441-1.219-.746.049-1.302.687-1.253 1.403a1.34 1.34 0 0 0 1.342 1.228zM.596 1.853h1.71l2.435 8.568c.07.252.309.426.577.426h7.485a.598.598 0 0 0 .546-.348l2.724-6.093a.573.573 0 0 0-.05-.551.596.596 0 0 0-.497-.262h-8.27a.59.59 0 0 0-.596.58c0 .32.268.58.596.58h7.356l-2.207 4.933h-6.64L3.33 1.118a.594.594 0 0 0-.577-.426H.596a.59.59 0 0 0-.596.58c0 .32.268.58.596.58z"></path>
                    </svg>`;
                    var $header = `<div class="row hidden-md-down">
                    <div class="mini-cart-header">
                    <div class="cart-img" aria-hidden="true">
                    ${$svg}
                    </div>
                    <h4>
                    ${window.Resources.MINI_CART_HEADER_MESSAGE}
                    </h4>
                    <button class="close-cart-img" id="close-mini-cart" type="button">
                    <img src="${data.crossImage}"/>
                    </button>
                    </div>
                    </div>`;
                    var $image = `<div class="empty-mini-cart-image justify-content-center row">
                    <div class="content-asset">
                    ${data.emptyMiniContentAssetImage}
                    </div>
                    </div>`;
                    var $description = `<div class="empty-mini-cart-descriptions justify-content-center row text-center">
                    <div class="content-asset">
                    ${data.emptyMiniContentAssetDescription}
                    </div>
                    </div>`;
                    var $urls = `<div class="empty-mini-cart-urls justify-content-center row text-center">
                    <div class="content-asset">
                    ${data.emptyMiniContentAssetUrls}
                    </div>
                    </div>`;
                    var $cartContainer =  $header + $image + $description + $urls;
                    $('.mini-cart-data .popover').empty();
                    updateCartTotals(data.basket);
                    $('.mini-cart-data .popover').append($cartContainer);
                } else {
                    if (data.toBeDeletedUUIDs && data.toBeDeletedUUIDs.length > 0) {
                        for (var i = 0; i < data.toBeDeletedUUIDs.length; i++) {
                            $('.uuid-' + data.toBeDeletedUUIDs[i]).remove();
                        }
                    }
                    $('.uuid-' + $uuid).remove();
                    if (!data.basket.hasBonusProduct) {
                        $('.bonus-product').remove();
                    }
                    $('.coupons-and-promos').empty().append(data.basket.totals.discountsHtml);
                    updateCartTotals(data.basket);
                    updateApproachingDiscounts(data.basket.approachingDiscounts);
                    $('body').trigger('setShippingMethodSelection', data.basket);
                    validateBasket(data.basket);
                }
                if(data.cartAnalyticsTrackingData && typeof setAnalyticsTrackingByAJAX != 'undefined') {
                    setAnalyticsTrackingByAJAX.cartAnalyticsTrackingData = data.cartAnalyticsTrackingData;
                    window.dispatchEvent(setAnalyticsTrackingByAJAX);
                }
                $.spinner().stop();
            },
            error: function (err) {
                if (err.responseJSON.redirectUrl) {
                    window.location.href = err.responseJSON.redirectUrl;
                } else {
                    createErrorNotification(err.responseJSON.errorMessage);
                    $.spinner().stop();
                }
            }
        });
    });

    /**
     * This is override click event function on the remove button.
     * It is used to remove the product from the cart and if product is 
     * successfully removed then it will add the new classes with div's according to
     * the mvmt design.
     */
    $('body').off('click', '.remove-product').on('click', '.remove-product', function (e) {
        var $actionUrl = $(this).data('action');
        var $productID = $(this).data('pid');
        var $productName = $(this).data('name');
        var $uuid = $(this).data('uuid');
        var $gtmProdObj = $(this).data('gtm-cart');
        var $urlParams = {
            pid: $productID,
            uuid: $uuid
        };

        var $url = appendToUrl($actionUrl, $urlParams);
        $('.gtm-cart').attr('data-gtm-cart', JSON.stringify($gtmProdObj));

        $.spinner().start();
        $.ajax({
            url: $url,
            type: 'get',
            dataType: 'json',
            success: function (data) {
                if (data.basket.items.length === 0) {
                    var $image = `<div class="empty-mini-cart-image justify-content-center row">
                    <div class="content-asset">
                    ${data.emptyMiniContentAssetImage}
                    </div>
                    </div>`;
                    var $description = `<div class="empty-mini-cart-descriptions justify-content-center row text-center">
                    <div class="content-asset">
                    ${data.emptyMiniContentAssetDescription}
                    </div>
                    </div>`;
                    var $urls = `<div class="empty-mini-cart-urls justify-content-center row text-center">
                    <div class="content-asset">
                    ${data.emptyMiniContentAssetUrls}
                    </div>
                    </div>`;
                    var $emptyCartContent =  $image + $description + $urls;
                    var $productDiv = `<div class="empty-mini-cart">`
                    +$emptyCartContent+
                    `</div>`;
                    $('.product-list-block').append($productDiv);
                    $('.checkout-btn').addClass('disabled');
                    $('.dw-apple-pay-button, .apple-pay-cart').addClass('d-none');
                    $('.grand-total-section .grand-total').empty().text(data.basket.totals.grandTotal);
                    $('.cart-header-wrapper').remove();
                    $('.promo-box').remove();
                    //$('.cart-order-outer-box + br').remove();
                    //$('.cart-order-outer-box').remove();
                    $('.product-info + .row').remove();
                    $('.product-info').remove();
                    //$('.cart-page > .row').append(htmlString);
                    $('.number-of-items').empty().append(data.basket.resources.numberOfItems);
                    $('.minicart-quantity').empty().append(data.basket.numItems);
                    $('.minicart .popover').empty();
                    $('.minicart .popover').removeClass('show');
                    $('body').removeClass('modal-open');
                    $('html').removeClass('veiled');
                    if(data.cartAnalyticsTrackingData && typeof setAnalyticsTrackingByAJAX != 'undefined') {
                        setAnalyticsTrackingByAJAX.cartAnalyticsTrackingData = data.cartAnalyticsTrackingData;
                        window.dispatchEvent(setAnalyticsTrackingByAJAX);
                    } 
                } else {
                    if (data.toBeDeletedUUIDs && data.toBeDeletedUUIDs.length > 0) {
                        for (var i = 0; i < data.toBeDeletedUUIDs.length; i++) {
                            $('.uuid-' + data.toBeDeletedUUIDs[i]).remove();
                        }
                    }
                    $('.uuid-' + $uuid).remove();
                    if (!data.basket.hasBonusProduct) {
                        $('.bonus-product').remove();
                    }
                    $('.coupons-and-promos').empty().append(data.basket.totals.discountsHtml);
                    updateCartTotals(data.basket);
                    updateApproachingDiscounts(data.basket.approachingDiscounts);
                    $('body').trigger('setShippingMethodSelection', data.basket);
                    validateBasket(data.basket);
                }
                $.spinner().stop();
            },
            error: function (err) {
                if (err.responseJSON.redirectUrl) {
                    window.location.href = err.responseJSON.redirectUrl;
                } else {
                    createErrorNotification(err.responseJSON.errorMessage);
                    $.spinner().stop();
                }
            }
        });
    });

    /**
     * This is override change event function on the quantity input field.
     * It is used to update the quantity of the product in the cart. It will call 
     * the updateCartQuantity function that will handle the quantity update 
     * functionality.
     */
    $('body').off('change', '.quantity-form > .quantity').on('change', '.quantity-form .quantity', function (e) {
        e.preventDefault();
        updateCartQuantity(this, false);
    });

    $('body').off('submit', '.minicart-promo-code-form').on('submit', '.minicart-promo-code-form', function (e) {
        e.preventDefault();
        $('.minicart-promo-code-form').spinner().start();
        $('.coupon-missing-error').hide();
        $('.coupon-error-message').empty();
        if (!$('.coupon-code-field').val()) {
            $('.minicart-promo-code-form .form-control').addClass('is-invalid');
            $('.coupon-missing-error').show();
            $('.minicart-promo-code-form').spinner().stop();
            return false;
        }
        var $form = $('.minicart-promo-code-form');
        $('.minicart-promo-code-form .form-control').removeClass('is-invalid');
        $('.coupon-error-message').empty();

        $.ajax({
            url: $form.attr('action'),
            type: 'GET',
            dataType: 'json',
            data: $form.serialize(),
            success: function (data) {
                if (data.error) {
                    $('.minicart-promo-code-form .form-control').addClass('is-invalid');
                    $('.coupon-error-message').empty().append(data.errorMessage);
                } else {
                    $('.coupons-and-promos').empty().append(data.totals.discountsHtml);
                    updateCartTotals(data);
                    updateApproachingDiscounts(data.approachingDiscounts);
                    validateBasket(data);
                }
                $('.coupon-code-field').val('');
                $('.minicart-promo-code-form').spinner().stop();
                setMiniCartProductSummaryHeight();
            },
            error: function (err) {
                if (err.responseJSON.redirectUrl) {
                    window.location.href = err.responseJSON.redirectUrl;
                } else {
                    createErrorNotification(err.errorMessage);
                    $('.minicart-promo-code-form').spinner().stop();
                }
                setMiniCartProductSummaryHeight();
            }
        });
        return false;
    });

    /**
     * This method is used to call on cart page when we add promo code.
     */
    $('body').off('submit', '.promo-code-form').on('submit', '.promo-code-form', function (e) {
        e.preventDefault();
        $.spinner().start();
        $('.coupon-missing-error').hide();
        $('.coupon-error-message').empty();
        if (!$('.coupon-code-field').val()) {
            $('.promo-code-form .form-control').addClass('is-invalid');
            $('.coupon-missing-error').show();
            $.spinner().stop();
            return false;
        }
        var $form = $('.promo-code-form');
        $('.promo-code-form .form-control').removeClass('is-invalid');
        $('.coupon-error-message').empty();

        $.ajax({
            url: $form.attr('action'),
            type: 'GET',
            dataType: 'json',
            data: $form.serialize(),
            success: function (data) {
                if (data.error) {
                    $('.promo-code-form .form-control').addClass('is-invalid');
                    $('.coupon-error-message').empty().append(data.errorMessage);
                } else {
                    $('.coupons-and-promos').empty().append(data.totals.discountsHtml);
                    updateCartTotals(data);
                    updateApproachingDiscounts(data.approachingDiscounts);
                    validateBasket(data);
                }
                $('.coupon-code-field').val('');
                $.spinner().stop();
            },
            error: function (err) {
                if (err.responseJSON.redirectUrl) {
                    window.location.href = err.responseJSON.redirectUrl;
                } else {
                    createErrorNotification(err.errorMessage);
                    $.spinner().stop();
                }
            }
        });
        return false;
    });

    /**
     * This is override click event function of coupon code that will directly remove the coupon code without
     * showing the popup of confirmation it basically used on the minicart and cart page.
     */
    $('body').off('click', '.coupons-and-promos .remove-coupon').on('click', '.coupons-and-promos .remove-coupon', function (e) {
        e.preventDefault();

        var couponCode = $(this).data('code');
        var uuid = $(this).data('uuid');
        var url = $(this).data('action');
        var urlParams = {
            code: couponCode,
            uuid: uuid
        };

        url = appendToUrl(url, urlParams);
        $('body > .modal-backdrop').remove();

        $('.coupon-price-adjustment').spinner().start();
        $.ajax({
            url: url,
            type: 'get',
            dataType: 'json',
            success: function (data) {
                $('.coupon-uuid-' + uuid).remove();
                updateCartTotals(data);
                updateApproachingDiscounts(data.approachingDiscounts);
                $('.promotion-information').parent().empty().append(data.totals.discountsHtml);
                validateBasket(data);
                $('.coupon-price-adjustment').spinner().stop();
                setMiniCartProductSummaryHeight();
            },
            error: function (err) {
                if (err.responseJSON.redirectUrl) {
                    window.location.href = err.responseJSON.redirectUrl;
                } else {
                    createErrorNotification(err.responseJSON.errorMessage);
                    $('.coupon-price-adjustment').spinner().stop();
                }
                setMiniCartProductSummaryHeight();
            }
        });
    });

    base.selectAttribute();
    base.colorAttribute();
    base.removeBonusProduct();
    base.selectBonusProduct();
    base.enableBonusProductSelection();
    base.showMoreBonusProducts();
    base.addBonusProductsToCart();
};