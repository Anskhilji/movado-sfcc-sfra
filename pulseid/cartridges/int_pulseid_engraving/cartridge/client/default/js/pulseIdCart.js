'use strict';

$('body').on('click', '.remove-engraved', function () {
    var $engravingUUID = $(this).data('engraving-uuid');
    var $url = $(this).data('engraving-url');
    $.spinner().start();
    $.ajax({
        url: $url,
        type: 'post',
        dataType: 'json',
        data: {
            uuid: $engravingUUID
        },
        success: function (data) {
            $('.engraving-box-' + $engravingUUID).remove();
            updateCartTotals(data.basket);
        },
        error: function (err) {
            $.spinner().stop();
        },
        complete: function () {
            $.spinner().stop();
        }
    });

});

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

    if (data && data.approachingDiscountsTotal && data.conditionThresholdCurrencyValue && data.progressBarPromoMsg && data.progressBarpercentage) {
        
        var $promoProgressBarHtml = '<div class="progress-meter d-flex flex-column align-items-center">'+
        '<div class="progress-meter-free-shipping">'+ data.progressBarPromoMsg.replace('price', data.approachingDiscountsTotal) +'</div>'+
        '<div class="progress-meter-box">'+
        '<div class="progress-meter-box-bar bar-grey" style="width:'+ data.progressBarpercentage +'%"</div>'+
        '</div>'+
        '</div>';

        var $progressMeterMain = $('.progress-meter-container');
        $progressMeterMain.empty();
        $progressMeterMain.append($promoProgressBarHtml);
    } else {
        var $freeShippingIcon = $('.progress-meter-container').data('shipping-image');
        var $progressBarSuccessMsg = data.progressBarSuccessMsg;
        var $progressMeterMain = $('.progress-meter-container');

        if ($freeShippingIcon && $freeShippingIcon.length > 0 && $progressBarSuccessMsg) {
            var $applicablePromoMessageHtml = '<div class="got-free-shipping d-flex align-items-center justify-content-center">'+
            '<img src="'+ $freeShippingIcon +'" alt="'+ data.progressBarSuccessMsg +'">'+
            '<p>'+ data.progressBarSuccessMsg +'</p>'+
            '</div>';
        }

        $progressMeterMain.empty();
        $progressMeterMain.append($applicablePromoMessageHtml);
    }
    
    var $pickupFromStore = $('.cart-store-pickup').prop('checked');
    if ($pickupFromStore) {
        var $productIds = [];
        $('.quantity.custom-select').each(function () {
            if ($(this).prop('disabled')) {
                var $pid = $(this).data('pid');
                $productIds.push(parseInt($pid));
            }
        });
    }
    $('.delivery-date').empty().append(data.totals.deliveryDate);
    $('.number-of-items').empty().append(data.resources.numberOfItems);
    $('.shipping-cost').empty().append(data.totals.totalShippingCost);
    $('.tax-total').empty().append(data.totals.totalTax);
    $('.grand-total-sum, .cart-total').empty().append(data.totals.grandTotal);
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

        if ($pickupFromStore && $productIds.indexOf(parseInt(item.id)) > -1) {
            $('select[data-pid="' + item.id + '"]').attr('disabled', true);
        }

        if (item.options.length > 0) {
            item.options.forEach(function (option) {
                if (option && option.optionId == Resources.CLYDE_WARRANTY && option.price != '' && option.adjustedPrice != '' && option.price == option.adjustedPrice) {
                    $('.clyde-uuid-' + item.UUID + ' .clyde-option-price').text(option.price);
                } else if (option && option.optionId == Resources.CLYDE_WARRANTY && option.adjustedPrice != '') {
                    $('.clyde-uuid-' + item.UUID + ' .adjusted-clyde-price').text(option.adjustedPrice);
                }
            });
        }
    });
}