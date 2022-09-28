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
                updateBOPISShippingMethods(response.viewData, $pickupFromStore);
            }else{
                updateStorePickupProductAvailability(response.viewData);
                updateBOPISShippingMethods(response.viewData, $pickupFromStore);
            }
            $.spinner().stop();
        },
        error: function () {
            $.spinner().stop();
        }
    });
});

function updateBOPISShippingMethods(data, $pickupFromStore) {
    $('#shippingMethods').empty();
    var shipments = data.cartModel.shipments[0].shippingMethods;
    var html;
    shipments.forEach(function (shipment) {
        if (data.cartModel.shipments[0].selectedShippingMethod === shipment.ID) { 
            var selected = 'selected';
        }
        html += '<option '+ selected +' data-shipping-id='+ shipment.ID +'>'
        + (shipment.displayName ? shipment.displayName : '') + ' ' + (shipment.estimatedArrivalTime ? shipment.estimatedArrivalTime : '')
        + '</option>';
        $('#shippingMethods').empty().append(html);
    });

    var shippingTotal = data.cartModel.totals.totalShippingCost;
    if (data.cartModel.shipments[0].selectedShippingMethod !== null) {
        $('.shipping-cost').empty().append(shippingTotal);
    }
 
    if ($pickupFromStore) {
        $('#shippingMethods').attr('disabled', 'disabled');
    } else {
        $('#shippingMethods').removeAttr('disabled');
    }
}

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

    if ($pickupFromStore == true && $isAllItemsAvailable == true) {
        $('.paypal-btn').addClass('d-none');
        $('.more-ways-text').addClass('d-none');
        $('#shippingMethods').attr('disabled', 'disabled');
        setTimeout(function () {
            $('.gpay-button').addClass('d-none');
            $('.apple-pay-cart').addClass('d-none');
        }, 300);
    } else if ($pickupFromStore == true && $isAllItemsAvailable == false) {
        $('.paypal-btn').addClass('d-none');
        $('.more-ways-text').addClass('d-none');
        $('.checkout-btn').addClass('disabled');
        $('#shippingMethods').attr('disabled', 'disabled');
        setTimeout(function () {
            $('.gpay-button').addClass('d-none');
            $('.apple-pay-cart').addClass('d-none');
        }, 300);
    } else {
        $('.paypal-btn').removeClass('d-none');
        $('.more-ways-text').removeClass('d-none');
        $('#shippingMethods').removeAttr('disabled');
        setTimeout(function () {
            $('.gpay-button').removeClass('d-none');
            $('.apple-pay-cart').removeClass('d-none');
            $('.checkout-btn').removeClass('disabled');
            $('.paypal-btn').removeClass('disabled');
        }, 300); 
    }
}
