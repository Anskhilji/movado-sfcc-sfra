'use strict';

var movadoBase = require('movado/product/base');

/**
 * appends params to a url
 * @param {string} url - Original url
 * @param {Object} params - Parameters to append
 * @returns {string} result url with appended parameters
 */
function appendToUrl(url, params) {
    var newUrl = url;
    newUrl += (newUrl.indexOf('?') !== -1 ? '&' : '?') + Object.keys(params).map(function (key) {
        return key + '=' + encodeURIComponent(params[key]);
    }).join('&');

    return newUrl;
}

/**
 * Checks whether the basket is valid. if invalid displays error message and disables
 * checkout button
 * @param {Object} data - AJAX response from the server
 */
function validateBasket(data) {
    if (data.valid.error) {
        if (data.valid.message) {
            var errorHtml = '<div class="alert card alert-dismissible valid-cart-error ' +
                'fade show" role="alert">' +
                '<button type="button" class="close" data-dismiss="alert" aria-label="Close">' +
                '<span aria-hidden="true">&times;</span>' +
                '</button>' + data.valid.message + '</div>';

            $('.cart-error').empty().append(errorHtml);
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
    $('.grand-total, .cart-total').empty().append(data.totals.grandTotal);
    $('.sub-total').empty().append(data.totals.subTotal);
    /* Affirm block for refreshing promo message */
    var totalCalculated = data.totals.grandTotal.substr(1).toString().replace(/\,/g, '');
    $('.affirm-as-low-as').attr('data-amount', (totalCalculated * 100).toFixed());
    affirm.ui.refresh();
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
 * re-renders the order totals and the number of items in the cart
 * @param {Object} message - Error message to display
 */
function createErrorNotification(message) {
    var errorHtml = '<div class="alert card alert-dismissible valid-cart-error ' +
        'fade show" role="alert">' +
        '<button type="button" class="close" data-dismiss="alert" aria-label="Close">' +
        '<span aria-hidden="true">&times;</span>' +
        '</button>' + message + '</div>';

    $('.cart-error').empty().append(errorHtml);
}

/**
 * re-renders the approaching discount messages
 * @param {Object} approachingDiscounts - updated approaching discounts for the cart
 */
function updateApproachingDiscounts(approachingDiscounts) {
    var html = '';
    $('.approaching-discounts').empty();
    if (approachingDiscounts.length > 0) {
        approachingDiscounts.forEach(function (item) {
            html += '<div class="single-approaching-discount text-center">'
                + item.discountMsg + '</div>';
        });
    }
    $('.approaching-discounts').append(html);
}

/**
 * Updates the availability of a product line item
 * @param {Object} data - AJAX response from the server
 * @param {string} uuid - The uuid of the product line item to update
 */
function updateAvailability(data, uuid) {
    var lineItem;
    var messages = '';

    for (var i = 0; i < data.items.length; i++) {
        if (data.items[i].UUID === uuid) {
            lineItem = data.items[i];
            break;
        }
    }

    $('.availability-' + lineItem.UUID).empty();

    if (lineItem.availability) {
        if (lineItem.availability.messages) {
            lineItem.availability.messages.forEach(function (message) {
                messages += '<p class="line-item-attributes">' + message + '</p>';
            });
        }

        if (lineItem.availability.inStockDate) {
            messages += '<p class="line-item-attributes line-item-instock-date">'
                + lineItem.availability.inStockDate
                + '</p>';
        }
    }

    $('.availability-' + lineItem.UUID).html(messages);
}


/**
 * This event binding function will handle the keyboard pressed keys on the basis of 
 * conditions and also it will replace the alphabets with empty string then update the 
 * quantity of the product.
 * @param e
 */
$('.quantity-form > .quantity').bind('keyup', function (e) {
    this.value = this.value.replace(/[^\d].+/, '');

    var keyCode = (e.keyCode ? e.keyCode : e.which);
    //for down key arrow
    if (keyCode == 40) {
        decreaseQuantity(this);
    }

    //for up key arrow
    if (keyCode == 38) {
        increaseQuantity(this);
    }

    if (keyCode != 8 && keyCode != 46) {
        if ((keyCode >= 48 && keyCode <= 57) || (keyCode >= 96 && keyCode <= 105)) {
            updateCartQuantity(this, true);
        }
    }

    if (keyCode < 48 || keyCode > 57 || keyCode < 96 || keyCode > 105) {
        event.preventDefault();
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
    var quantity = parseInt($(quantitySelector).val());
    if (isNaN(quantity)) {
        $('#decreased-' + id).attr('disabled', true);
        quantity = 1;
    }

    quantity = (quantity > 1) ? quantity - 1 : quantity;

    if (quantity == 1) {
        $('#decreased-' + id).attr('disabled', true);
    } else {
        $('#decreased-' + id).attr('disabled', false);
    }
    $(quantitySelector).val(quantity);
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
    var quantity = parseInt($(quantitySelector).val());
    if (isNaN(quantity)) {
        $(quantitySelector).val(1);
        $('#decreased-' + id).attr('disabled', true);
    }

    if (quantity >= 1) {
        $('#decreased-' + id).attr('disabled', false);
        quantity = quantity + 1;
        $(quantitySelector).val(quantity);
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
    var preSelectQty = $(quantitySelector).data('pre-select-qty');
    var quantity = isKeyEvent ? parseInt(quantitySelector.value) : parseInt($(quantitySelector).val());
    var productID = $(quantitySelector).data('pid');
    var url = $(quantitySelector).data('action');
    var uuid = $(quantitySelector).data('uuid');

    if (isNaN(quantity) || quantity == 0) {
        quantity = 1;
        $(quantitySelector).val(quantity);
    }

    if (quantity == 1 || quantity == 0) {
        $('#decreased-' + productID).attr('disabled', true);
    } else {
        $('#decreased-' + productID).attr('disabled', false);
    }

    var urlParams = {
        pid: productID,
        quantity: quantity,
        uuid: uuid
    };

    url = appendToUrl(url, urlParams);
    $(quantitySelector).parents('.card').spinner().start();

    $.ajax({
        url: url,
        type: 'get',
        context: quantitySelector,
        dataType: 'json',
        success: function (data) {
            $('.quantity[data-uuid="' + uuid + '"]').val(quantity);
            $('.coupons-and-promos').empty().append(data.totals.discountsHtml);
            updateCartTotals(data);
            updateApproachingDiscounts(data.approachingDiscounts);
            updateAvailability(data, uuid);
            validateBasket(data);
            $(quantitySelector).data('pre-select-qty', quantity);
            $.spinner().stop();
            if ($(quantitySelector).parents('.product-info').hasClass('bonus-product-line-item') && $('.cart-page').length) {
                location.reload();
            }
        },
        error: function (err) {
            if (err.responseJSON.redirectUrl) {
                window.location.href = err.responseJSON.redirectUrl;
            } else {
                createErrorNotification(err.responseJSON.errorMessage);
                $(quantitySelector).val(parseInt(preSelectQty, 10));
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
    $(document).on('click', '.decreased-btn', function (e) {
        e.preventDefault();
        var pid = $(this).data('pid');
        var quantitySelector = '.' + $(this).data('pid');
        decreaseQuantity(quantitySelector, pid);
    });

    /**
     * This is new click event function on the increased quantity button.
     * It will get the increased-btn data attribute and builds the quantitySelector 
     * class and it will call the increaseQuantity function.
     */
    $(document).on('click', '.increased-btn', function (e) {
        e.preventDefault();
        var pid = $(this).data('pid');
        var quantitySelector = '.' + $(this).data('pid');
        increaseQuantity(quantitySelector, pid);
    });

    /**
     * This is override click event function on the remove button.
     * It is used to remove the product from the cart and if product is 
     * successfully removed then it will add the new classes with div's according to
     * the mvmt design.
     */
    $('body').off('click', '.remove-product').on('click', '.remove-product', function (e) {
        e.preventDefault();

        var actionUrl = $(this).data('action');
        var productID = $(this).data('pid');
        var productName = $(this).data('name');
        var uuid = $(this).data('uuid');
        var gtmProdObj = $(this).data('gtm-cart');
        var urlParams = {
            pid: productID,
            uuid: uuid
        };

        var url = appendToUrl(actionUrl, urlParams);
        $('.gtm-cart').attr('data-gtm-cart', JSON.stringify(gtmProdObj));

        $.spinner().start();
        $.ajax({
            url: url,
            type: 'get',
            dataType: 'json',
            success: function (data) {
                if (data.basket.items.length === 0) {
                    $('.cart-order-outer-box + br').remove();
                    $('.cart-order-outer-box').remove();
                    $('.product-info + .row').remove();
                    $('.product-info').remove();
                    $('.cart-page > .row').append('<div class="container my-5 cart-empty order-1"><div class="row justify-content-center"><div class="col-12 text-center"><h1 class="empty-cart-header empty-cart-msg"> ' + window.Resources.CART_EMPTY_MESSAGE + '</h1></div><div><a href= "' + data.homePageURL + '" class="btn btn-primary btn-block continue-shopping" role="button">' + window.Resources.CONTINUE_SHOPPING + '</a></div></div></div>');
                    $('.number-of-items').empty().append(data.basket.resources.numberOfItems);
                    $('.minicart-quantity').empty().append(data.basket.numItems);
                    $('.minicart .popover').empty();
                    $('.minicart .popover').removeClass('show');
                    $('body').removeClass('modal-open');
                    $('html').removeClass('veiled');
                } else {
                    if (data.toBeDeletedUUIDs && data.toBeDeletedUUIDs.length > 0) {
                        for (var i = 0; i < data.toBeDeletedUUIDs.length; i++) {
                            $('.uuid-' + data.toBeDeletedUUIDs[i]).remove();
                        }
                    }
                    $('.uuid-' + uuid).remove();
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
    $('body').off('change', '.quantity-form > .quantity').on('change', '.quantity-form > .quantity', function () {
        e.preventDefault();
        updateCartQuantity(this, false);
    });
};
