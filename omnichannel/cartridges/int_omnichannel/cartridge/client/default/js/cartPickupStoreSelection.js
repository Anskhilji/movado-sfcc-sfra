'use strict';
$(function () {
    updateStorePickupProductAvailability();
})
$(document).on('click', '.remove-btn.remove-product, .cart-store-pickup', function (event) {
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
    var $allItems = false;
    $('.remove-product').each(function(){
        $allItems=$(this).data('store-pickup-available');
        if($allItems == false){
         return   $allItems = false;
        }else{
            $allItems = true;
        }
    });
    var $isAllItemsAvailable;
    var  $pickupFromStore = $('.cart-store-pickup').prop('checked');
    if (data != undefined && data.isAllItemsAvailable != undefined) {
        $isAllItemsAvailable = $pickupFromStore ? data.isAllItemsAvailable : $pickupFromStore;
    } else {
        $isAllItemsAvailable = $allItems;
    }

    if ($pickupFromStore == true) {
        $('.paypal-btn').addClass('d-none');
        $('.more-ways-text').addClass('d-none');
        $('.checkout-btn').addClass('disabled');
        setTimeout(function () {
            $('.gpay-button').addClass('d-none');
            $('.apple-pay-cart').addClass('d-none');
        }, 300);
    } else {
        $('.checkout-btn').removeClass('disabled');
        $('.paypal-btn').removeClass('d-none');
        $('.more-ways-text').removeClass('d-none');

        setTimeout(function () {
            $('.gpay-button').removeClass('d-none');
            $('.apple-pay-cart').removeClass('d-none');
        }, 300); 
    }
}
