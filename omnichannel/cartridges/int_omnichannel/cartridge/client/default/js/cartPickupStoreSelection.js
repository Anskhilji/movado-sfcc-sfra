'use strict';
$(function () {
    updateStorePickupProductAvailability();
})
$(document).on('click', '.cart-store-pickup', function (event) {
    var $url = $(this).data('url');
    var $pickupFromStore = $(this).prop('checked');
    $.ajax({
        url: $url,
        data: {
            pickupFromStore: $pickupFromStore
        },
        method: 'POST',
        success: function (response) {
            if ($pickupFromStore) {
                var $isAllItemsAvailable = response.viewData.isAllItemsAvailable ? true : false;
                $('.remove-product').attr({'data-store-pickup-available': $isAllItemsAvailable})
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
        var $pickUpStoreAvailableIcon = $('.pickup-store-inventory-seperator .availabe-icon' + item.id);
        var $pickUpStoreAvailableText = $('.pickup-store-inventory-seperator .availabe-msg' + item.id);
        var $pickUpStoreUnavailableIcon = $('.pickup-store-inventory-seperator .unavailable-icon' + item.id);
        var $pickUpStoreUnavailableText = $('.pickup-store-inventory-seperator .unavailable-msg' + item.id);
        if (item.storePickupAvailable) {
            $pickUpStoreAvailableIcon.removeClass('d-none');
            $pickUpStoreAvailableText.removeClass('d-none');
            $pickUpStoreUnavailableIcon.addClass('d-none');
            $pickUpStoreUnavailableText.addClass('d-none');
        } else {
            $pickUpStoreUnavailableIcon.removeClass('d-none');
            $pickUpStoreUnavailableText.removeClass('d-none');
            $pickUpStoreAvailableIcon.addClass('d-none');
            $pickUpStoreAvailableText.addClass('d-none');
        }
    });
}

function updateStorePickupProductAvailability(data) {
    var $allItems = $('.remove-product').data('store-pickup-available');
    var $isAllItemsAvailable;
    var  $pickupFromStore = $('.cart-store-pickup').prop('checked');
    if (data != undefined && data.isAllItemsAvailable != undefined) {
        $isAllItemsAvailable = $pickupFromStore ? data.isAllItemsAvailable : $pickupFromStore;
    } else {
        $isAllItemsAvailable = $allItems;
    }
    if ($isAllItemsAvailable == false && $pickupFromStore == true) {
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