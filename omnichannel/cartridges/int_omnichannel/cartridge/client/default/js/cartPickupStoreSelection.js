'use strict';
$(function () {
    updateStorePickupProductAvailability();
})
$(document).on('click', '.cart-store-pickup', function (event) {
    var url = $(this).data('url');
    var pickupFromStore = $(this).prop('checked');
    $.ajax({
        url: url,
        data: {
            pickupFromStore: pickupFromStore
        },
        method: 'POST',
        success: function (response) {
            if (pickupFromStore) {
                var isAllItemsAvailable = response.viewData.isAllItemsAvailable ? true : false;
                $('.remove-product').attr({'data-store-pickup-available': isAllItemsAvailable})
                updateStorePickupProductAvailability(response.viewData);
                handleAvailabilityOnStore(response.viewData);
            }else{
                updateStorePickupProductAvailability(response.viewData);
            }
            $.spinner().stop();
        },
        error: function () {
            $.spinner().stop();
        }
    });
});

function handleAvailabilityOnStore(data) {
    data.items.forEach(function (item) {
        if (item.storePickupAvailable) {
            $('.pickup-store-inventory-seperator .availabe-icon' + item.id).removeClass('d-none');
            $('.pickup-store-inventory-seperator .availabe-msg' + item.id).removeClass('d-none');
            $('.pickup-store-inventory-seperator .unavailable-icon' + item.id).addClass('d-none');
            $('.pickup-store-inventory-seperator .unavailable-msg' + item.id).addClass('d-none');
        } else {
            $('.pickup-store-inventory-seperator .unavailable-icon' + item.id).removeClass('d-none');
            $('.pickup-store-inventory-seperator .unavailable-msg' + item.id).removeClass('d-none');
            $('.pickup-store-inventory-seperator .availabe-msg' + item.id).addClass('d-none');
            $('.pickup-store-inventory-seperator .availabe-icon' + item.id).addClass('d-none');
        }
    });
}

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
        $('.pickup-store-error').addClass('d-none');
    }
}

function updateStorePickupProductAvailability(data) {
    var allItems = $('.remove-product').data('store-pickup-available');
    var isAllItemsAvailable;
    var  pickupFromStore = $('.cart-store-pickup').prop('checked');
    if (data != undefined && data.isAllItemsAvailable != undefined) {
        isAllItemsAvailable = pickupFromStore ? data.isAllItemsAvailable : pickupFromStore;
    } else {
        isAllItemsAvailable = allItems;
    }
    if (isAllItemsAvailable == false && pickupFromStore == true) {
        $('.checkout-btn').addClass('disabled');
        setTimeout(function () {
            $('.apple-pay-cart').attr('disabled', true);
        }, 300);
        $('.pickup-store-error').removeClass('d-none');
        return;
    } else {
        $('.checkout-btn').removeClass('disabled');
        $('.apple-pay-cart').attr('disabled', false);
        $('.pickup-store-error').addClass('d-none');
    }
}