'use strict';
$(function () {
    updateStorePickupProductAvailability();
})
$(document).on('click', '.cart-store-pickup', function (event) {
    var url = $(this).data('url');
    var pickupFromStore = $(this).prop('checked');
    $.ajax({
        url: url,
        data: { pickupFromStore: pickupFromStore },
        method: 'POST',
        success: function (response) {
            if (response.pickupFromStore) {
                $('.pickup-store-cart-availability').removeClass('d-none');
                $('.default-product-availability').addClass('d-none');
                updateStorePickupProductAvailability();
            } else {
                $('.pickup-store-cart-availability').addClass('d-none');
                $('.default-product-availability').removeClass('d-none');
                $('.checkout-btn').removeClass('disabled');
                updateCartCSS (pickupFromStore);
            }
            $.spinner().stop();
        },
        error: function () {
            $.spinner().stop();
        }
    });
});

function updateCartCSS(pickupFromStore) {
    if (pickupFromStore) {
        $('.line-item-name').addClass('pickup-store-line-item-name');
        $('.total-amount').addClass('pickup-store-total-amount');
        $('.product-detail').addClass('pickup-store-product-detail');
        $('.product-info').addClass('pickup-store-product-info');
    } else {
        $('.line-item-name').removeClass('pickup-store-line-item-name');
        $('.total-amount').removeClass('pickup-store-total-amount');
        $('.product-detail').removeClass('pickup-store-product-detail');
        $('.product-info').removeClass('pickup-store-product-info');
    }
}

function updateStorePickupProductAvailability() {
    var pickupFromStore = $('.cart-store-pickup').prop('checked');
    $('.remove-product').each(function (index, removeProduct) {
        var storePickupAvailable = $(removeProduct).data('store-pickup-available');
        if (pickupFromStore && storePickupAvailable == false) {
            $('.checkout-btn').addClass('disabled');
            return;
        } else {
            $('.checkout-btn').removeClass('disabled');
        }
    });
    updateCartCSS(pickupFromStore);
}