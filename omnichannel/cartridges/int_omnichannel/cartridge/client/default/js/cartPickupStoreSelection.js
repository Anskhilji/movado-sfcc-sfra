'use strict';
$(function () {
    checkAllLineItem();
});

$(document).on('click', '.remove-btn.remove-product, .cart-store-pickup', function (event) {
    checkAllLineItem();
});

function checkAllLineItem() {
    var $url = $('.cart-store-pickup').data('url');
    var $pickupFromStore = $('.cart-store-pickup').prop('checked');
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
                if (response.viewData !== '' && response.viewData !== undefined) {
                    updateBOPISShippingMethods(response.viewData, $pickupFromStore);
                }

                if (response.viewData !== '' && response.viewData !== undefined) {
                    updateQuantityForBopis(response.viewData, $pickupFromStore);
                }           
            } else {
                updateStorePickupProductAvailability(response.viewData);
                
                if (response.viewData !== '' && response.viewData !== undefined) {
                    updateBOPISShippingMethods(response.viewData, $pickupFromStore);
                }

                if (response.viewData !== '' && response.viewData !== undefined) {
                    updateQuantityForBopis(response.viewData, $pickupFromStore);
                }
            }
            $.spinner().stop();
        },
        error: function () {
            $.spinner().stop();
        }
    });
}

function updateQuantityForBopis(data, $pickupFromStore) {
    var $lineItemsInventory = data.lineItemsInventory;
    var $cartItems = data.cartModel.items;
    var $maxQuantityLimit = 10;
    var $lineItemID;
    var $lineItemQty;
    var $html = '';

    if ($pickupFromStore) {
        if ($lineItemsInventory !== undefined && $lineItemsInventory !== '') {
            $cartItems.forEach(function (cartItem) {
                $lineItemID = cartItem.id;
                $lineItemQty = cartItem.quantity;
                var $quantity = $('.quantity-form .quantity'+$lineItemID);
                $html = '';
            
                $lineItemsInventory.forEach(function (lineItemInventory) {
                    if (lineItemInventory.sku === $lineItemID) { 
                        var $lineItemATO = lineItemInventory.ato;

                        if ($lineItemATO > 0) {
                            for (var i = 1; i <= $lineItemATO; i++) {
                                var $currentATO = i;
                                $quantity.empty();

                                if ($currentATO === $lineItemQty) {
                                    var selected = 'selected';
                                    $html += '<option '+ selected +' >' + ($currentATO) + '</option>';
                                    $quantity.empty().append($html);
                                } else {
                                    $html += '<option>' + ($currentATO) + '</option>';
                                    $quantity.empty().append($html);
                                }
                                
                                if ($currentATO == $maxQuantityLimit) {
                                    break;
                                }
                            }
                        } else {
                            $quantity.attr('disabled', 'disabled');
                        }   
                    }
                });
            });
        }
    } else {
        $cartItems.forEach(function (cartItem) {
            var $lineItemID = cartItem.id;
            var $lineItemQty = cartItem.quantity;
            var $quantity = $('.quantity-form .quantity'+$lineItemID);
            var $html = '';
    
            for (var i = 1; i <= $maxQuantityLimit; i++) {
                var $currentATO = i;
                $quantity.empty();

                if ($currentATO === $lineItemQty) {
                    var selected = 'selected';
                    $html += '<option '+ selected +' >' + ($currentATO) + '</option>';
                    $quantity.empty().append($html);
                } else {
                    $html += '<option>' + ($currentATO) + '</option>';
                    $quantity.empty().append($html);
                }
            }
            $quantity.removeAttr('disabled', 'disabled'); 
        });
    }
}

function updateBOPISShippingMethods(data, $pickupFromStore) {
    $('#shippingMethods').empty();
    var shipments = data && data.cartModel && data.cartModel.shipments && data.cartModel.shipments.length > 0 ? data.cartModel.shipments[0].shippingMethods : '';
    var html;
    if (shipments !== undefined && shipments !== '') {
        shipments.forEach(function (shipment) {
            if (data.cartModel.shipments[0].selectedShippingMethod === shipment.ID) { 
                var selected = 'selected';
            }
            html += '<option '+ selected +' data-shipping-id='+ shipment.ID +'>'
            + (shipment.displayName ? shipment.displayName : '') + ' ' + (shipment.estimatedArrivalTime ? shipment.estimatedArrivalTime : '')
            + '</option>';
            $('#shippingMethods').empty().append(html);
        });
    }

    var shippingTotal = data && data.cartModel && data.cartModel.totals && data.cartModel.totals.totalShippingCost ? data.cartModel.totals.totalShippingCost : '';
    if (shippingTotal !== undefined && shippingTotal !== '') {
        if (data.cartModel.shipments[0].selectedShippingMethod !== undefined) {
            $('.shipping-cost').empty().append(shippingTotal);
        }
    }

    var grandTotal = data && data.cartModel && data.cartModel.totals && data.cartModel.totals.grandTotal ? data.cartModel.totals.grandTotal : '';
    if (grandTotal !== undefined && grandTotal !== '') {
        $('.grand-total-sum').empty().append(grandTotal);
    }
    
    var discountHMTL = data && data.cartModel && data.cartModel.totals && data.cartModel.totals.discountsHtml ? data.cartModel.totals.discountsHtml : '';
    $('.coupons-and-promos').empty().append(discountHMTL);

    if (data && data.cartModel && data.cartModel.totals.orderLevelDiscountTotal && data.cartModel.totals.orderLevelDiscountTotal.value > 0) {
        $('.order-discount').removeClass('hide-order-discount');
        $('.order-discount-total').empty()
            .append('- ' + data.cartModel.totals.orderLevelDiscountTotal.formatted);
    } else {
        $('.order-discount').addClass('hide-order-discount');
    }
 
    if ($pickupFromStore) {
        $('#shippingMethods').attr('disabled', 'disabled');
    } else {
        $('#shippingMethods').removeAttr('disabled');
    }
}

function handleAvailabilityOnStore(data) {
    if (data && data.items) {
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
        $('.pickup-store-error').addClass('d-none');
        $('.product-gift-wrap').addClass('d-none');
        setTimeout(function () {
            $('.gpay-button').addClass('d-none');
            $('.apple-pay-cart').addClass('d-none');
        }, 300);
    } else if ($pickupFromStore == true && $isAllItemsAvailable == false) {
        $('.paypal-btn').addClass('d-none');
        $('.more-ways-text').addClass('d-none');
        $('.checkout-btn').addClass('disabled');
        $('#shippingMethods').attr('disabled', 'disabled');
        $('.pickup-store-error').removeClass('d-none');
        $('.product-gift-wrap').addClass('d-none');
        setTimeout(function () {
            $('.gpay-button').addClass('d-none');
            $('.apple-pay-cart').addClass('d-none');
        }, 300);
    } else {
        $('.pickup-store-error').addClass('d-none');
        $('.paypal-btn').removeClass('d-none');
        $('.more-ways-text').removeClass('d-none');
        $('#shippingMethods').removeAttr('disabled');
        $('.product-gift-wrap').removeClass('d-none');
        setTimeout(function () {
            $('.gpay-button').removeClass('d-none');
            $('.apple-pay-cart').removeClass('d-none');
            $('.checkout-btn').removeClass('disabled');
            $('.paypal-btn').removeClass('disabled');
        }, 300); 
    }
}
