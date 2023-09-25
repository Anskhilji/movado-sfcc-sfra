'use strict';

var base = require('../product/base');

// Minicart Product summary cart height
function setMiniCartProductSummaryHeight() {
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

function disableSaveGiftBoxButton() {
    if ($('.gift-box-product').is(':checked') || $('.gift-box-message').is(':checked')) {
        $('.add-gift-message').prop('disabled', false);
    } else {
        $('.add-gift-message').prop('disabled', true);
    }
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
 * This Method is used to update the progress meter
 * @param {Object} data - AJAX response from the server
 */
function updateProgressMeter(data) {
    if (data && data.approachingDiscountsTotal && data.conditionThresholdCurrencyValue && data.progressBarPromoMsg && data.progressBarpercentage) {
        var $promoProgressBarHtml = '<div class="progress-meter '+ (data.isOrderLevelPromotion ? 'progress-meter-order-text' : 'progress-meter-text') +' d-flex flex-column align-items-center">'+
            '<div class="progress-meter-free-shipping">'+ data.progressBarPromoMsg.replace('price', data.approachingDiscountsTotal) +'</div>'+
            '<div class="progress-meter-box">'+
            '<div class="progress-meter-box-bar bar-grey" style="width:'+ data.progressBarpercentage +'%"</div>'+
            '</div>'+
            '</div>';

        var $progressMeterMain = $('.progress-meter-container');
        $progressMeterMain.empty();
        $progressMeterMain.append($promoProgressBarHtml);
    } else if (data.numItems == 0) {
        var $progressMeterMain = $('.progress-meter-container');
        $progressMeterMain.empty();

    } else if (data && data.progressBarSuccessMsg && data.isPromoProgressBarEnabled) {
        var $isMiniCart = $('.progress-meter-container-minicart').data('mini-cart');
        var $promoImg;
        var $promoImgMiniCart;
        if (data.isOrderLevelPromotion) {
            $promoImg = data.orderLevelPromoImg;
            $promoImgMiniCart = data.orderLevelPromoImgMiniCart;
        } else {
            $promoImg = data.shippingLevelPromoImg;
            $promoImgMiniCart = data.shippingLevelPromoImgMiniCart;
        }
        var $progressBarSuccessMsg = data.progressBarSuccessMsg;
        var $progressMeterMain = $('.progress-meter-container');

        if ($promoImg && $progressBarSuccessMsg) {
            var $applicablePromoMessageHtml = '<div class="got-free-shipping '+ (data.isOrderLevelPromotion ? 'free-order-text' : 'free-shipping-text') +' d-flex align-items-center justify-content-center">'+
                '<img src="'+ $promoImg +'" alt="'+ data.progressBarSuccessMsg +'">'+
                '<p>'+ data.progressBarSuccessMsg +'</p>'+
                '</div>';
            $progressMeterMain.empty();
            $progressMeterMain.append($applicablePromoMessageHtml);
        }

        if ($promoImgMiniCart && $progressBarSuccessMsg && $isMiniCart) {
            var $progressMeterMiniCart = $('.progress-meter-container-minicart');
            var $applicablePromoMessageHtmlMiniCart = '<div class="got-free-shipping '+ (data.isOrderLevelPromotion ? 'free-order-text' : 'free-shipping-text') +' d-flex align-items-center justify-content-center">'+
                '<img src="'+ $promoImgMiniCart +'" alt="'+ data.progressBarSuccessMsg +'">'+
                '<p>'+ data.progressBarSuccessMsg +'</p>'+
                '</div>';

            $progressMeterMiniCart.empty();
            $progressMeterMiniCart.append($applicablePromoMessageHtmlMiniCart);
        }

    }
}

/**
 * re-renders the order totals and the number of items in the cart
 * @param {Object} data - AJAX response from the server
 */
function updateMiniCartTotals(data, $giftProduct, $uuid, $dataParentUUID) {
    if (data.numItems) {
        $('.minicart .minicart-quantity').text(data.numItems);
    }
    var $fullCart = $('.main-cart-block');
    var $miniCartSelector = $('.mini-cart-data .product-summary').length > 0 ? $('.mini-cart-data') : $fullCart;
    var $noOfItems = $miniCartSelector.find('.mini-cart-data .number-of-items'); 
    var $shippingCostSelector = $miniCartSelector.find('.shipping-cost');
    var $totalTaxSelector = $miniCartSelector.find('.tax-total');
    var $grandTotalSelector = $miniCartSelector.find('.grand-total, .cart-total, .minicart-footer .subtotal-payment-summary .grand-total-sum');
    var $subTotalSelector = $miniCartSelector.find('.sub-total');
    var $affirmPriceSelector = $miniCartSelector.find('.affirm-as-low-as');
    var $orderDiscountSelector = $miniCartSelector.find('.order-discount');

    updateProgressMeter(data);

    if ($noOfItems.length > 0) {
        $noOfItems.empty().append(data.resources.numberOfItems);
    }
    if ($shippingCostSelector.length > 0) {
        $shippingCostSelector.empty().append(data.totals.totalShippingCost);
    }
    if ($totalTaxSelector.length > 0) {
        $totalTaxSelector.empty().append(data.totals.totalTax);
    }
    if ($grandTotalSelector.length > 0) {
        $grandTotalSelector.each(function () {
            $(this).empty().append(data.totals.subTotaladjustedNetPrice);
        });
    }
    if ($subTotalSelector.length > 0) {
        $subTotalSelector.empty().append(data.totals.subTotal);
    }

    if ($fullCart.length > 0) {
        $fullCart.find('.grand-total-sum').empty().append(data.totals.grandTotal);
    }

    /* Affirm block for refreshing promo message */
    if ($affirmPriceSelector.length > 0) {
        var totalCalculated = data.totals.grandTotal.substr(1).toString().replace(/\,/g, '');

        $affirmPriceSelector.attr('data-amount', (totalCalculated * 100).toFixed());

        if (Resources.AFFIRM_PAYMENT_METHOD_STATUS) {
            affirm.ui.ready(function () {
                affirm.ui.refresh();
            });
        }
    }

    if (data.totals.orderLevelDiscountTotal.value > 0) {
        $orderDiscountSelector.removeClass('hide-order-discount');
        $miniCartSelector.find('.order-discount-total').empty().append('- ' + data.totals.orderLevelDiscountTotal.formatted);
    } else {
        $orderDiscountSelector.addClass('hide-order-discount');
    }

    if (data.totals.shippingLevelDiscountTotal.value > 0) {
        $miniCartSelector.find('.shipping-discount').removeClass('hide-shipping-discount');
        $miniCartSelector.find('.shipping-discount-total').empty().append('- ' +
            data.totals.shippingLevelDiscountTotal.formatted);
    } else {
        $miniCartSelector.find('.shipping-discount').addClass('hide-shipping-discount');
    }

    data.items.forEach(function (item) {
        // Custom Start: Updated selector and rendered HTML as per MVMT site
        if (item.price.list) {
            $miniCartSelector.find('.item-total-' + item.UUID + ' .product-line-item-details  .price .strike-through').remove();
            $miniCartSelector.find('.item-total-' + item.UUID + ' .product-line-item-details  .price').prepend('<span class="strike-through list">' +
                '<span class="value" content="' + item.priceTotal.nonAdjustedFormattedPrice + '">' +
                '<span class="sr-only">label.price.reduced.from</span>' +
                '<span class="eswListPrice">' + item.priceTotal.nonAdjustedFormattedPrice + '</span>' +
                '<span class="sr-only">label.price.to</span></span></span>');
        } else {
            $miniCartSelector.find('.item-total-' + item.UUID + ' .product-line-item-details  .price .strike-through').remove();
        }
        $miniCartSelector.find('.item-total-' + item.UUID + ' .product-line-item-details  .sales').empty().append(item.priceTotal.price);

        // Custom Start: Updated selector and rendered HTML as per full cart/shoping bag MVMT site
        if (item.price.list) {
            $fullCart.find('.item-total-' + item.UUID + ' .price .strike-through').remove();
            $fullCart.find('.item-total-' + item.UUID + ' .price').prepend('<span class="strike-through list">' +
                '<span class="value" content="' + item.priceTotal.nonAdjustedFormattedPrice + '">' +
                '<span class="sr-only">label.price.reduced.from</span>' +
                '<span class="eswListPrice">' + item.priceTotal.nonAdjustedFormattedPrice + '</span>' +
                '<span class="sr-only">label.price.to</span></span></span>');
        } else {
            $fullCart.find('.item-total-' + item.UUID + ' .price .strike-through').remove();
        }
        $fullCart.find('.item-total-' + item.UUID + ' .sales').empty().append(item.priceTotal.price);
        // Custom End
    
        
        if (item.giftPid !== undefined && item.giftPid !== '') {
            data.items.forEach(function (childitem) {
                if (childitem.id == item.giftPid) {
                    $('.sale-gift-price-mvmt-' + childitem.UUID).empty().append(childitem.priceTotal.price);
                    var giftLineItemContainer = $('.gift-lineitem-container-' + childitem.UUID + ' .strike-through.list');
                    giftLineItemContainer.find('.value').attr('content', childitem.priceTotal.nonAdjustedFormattedPrice);
                    giftLineItemContainer.find('.eswListPrice').text(childitem.priceTotal.nonAdjustedFormattedPrice);
                    if (childitem.price.list == null) {
                        giftLineItemContainer.remove();
                    }

                }
            });
        }
        if ($giftProduct !== undefined && $giftProduct == true && $uuid !== undefined) {
            $('.gift-lineitem-container-'+ $uuid).remove();
        }

        if (item.UUID == $dataParentUUID) {
            $('.gift-product-chlid-uuid-' + $uuid).text('Add');
        }
        if (item.customAttributes.itemLevelGiftMessage && item.customAttributes.itemLevelGiftMessage.msgLine1) {
            var $itemLevelGiftMessage = item.customAttributes.itemLevelGiftMessage.msgLine1;
        }
        if ($itemLevelGiftMessage !== undefined && $itemLevelGiftMessage !== '') {
            $('.gift-product-chlid-uuid-' + $uuid).text('Edit');
        }

    });
    // Custom End

    // Custom Start: remove gift product from cart
    if ($giftProduct !== undefined && $giftProduct == true) {
        $('.gift-lineitem-container-'+ $uuid).empty(); 
    }
    // Custom End
}


function updateCartTotals(data, $giftProduct, $uuid, $dataParentUUID) {
    if (typeof data.totals.deliveryTime != 'undefined' && typeof data.totals.deliveryTime.isExpress != 'undefined' && data.totals.deliveryTime.isExpress) {
        $('.delivery-time').removeClass('d-none');
    } else {
        $('.delivery-time').addClass('d-none');
    }
    
    updateProgressMeter(data);


    var $grandCartTotalSelector = $('.main-cart-block').find('.grand-total, .cart-total, .minicart-footer .subtotal-payment-summary .grand-total'); 
    $('.delivery-date').empty().append(data.totals.deliveryDate);
    $('.number-of-items').empty().append(data.resources.numberOfItems);
    $('.shipping-total-cost').empty().append(data.totals.totalShippingCost);
    $('.tax-total').empty().append(data.totals.totalTax);
    $('.sub-total').empty().append(data.totals.subTotal);
    $('.grand-total-sum, .cart-total').empty().append(data.totals.grandTotal);
    /* Affirm block for refreshing promo message */
    var totalCalculated = data.totals.grandTotal.substr(1).toString().replace(/\,/g, '');
    $('.affirm-as-low-as').attr('data-amount', (totalCalculated * 100).toFixed());
    if (Resources.AFFIRM_PAYMENT_METHOD_STATUS) {
        affirm.ui.ready(function () {
            affirm.ui.refresh();
        });
    }
    $('.minicart-quantity').empty().append(data.numItems);

    if ($grandCartTotalSelector.length > 0) {
        $grandCartTotalSelector.each(function () {
            $(this).empty().append(data.totals.subTotaladjustedNetPrice);
        });
    }
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

    if ($('.cart.cart-page').length > 0) {
        data.items.forEach(function (item) {
            // Custom Start: Updated selector and rendered HTML as per MVMT site
            if (item.price.list) {
                $('.card.product-info').find('.item-total-' + item.UUID + ' .price .price-pdp-mvmt .strike-through').remove();
                $('.card.product-info').find('.item-total-' + item.UUID + ' .price .price-pdp-mvmt').prepend('<span class="strike-through list">' +
                    '<span class="value" content="' + item.priceTotal.nonAdjustedFormattedPrice + '">' +
                    '<span class="sr-only">label.price.reduced.from</span>' +
                    '<span class="eswListPrice">' + item.priceTotal.nonAdjustedFormattedPrice + '</span>' +
                    '<span class="sr-only">label.price.to</span></span></span>');
            } else {
                $('.card.product-info').find('.item-total-' + item.UUID + ' .price .price-pdp-mvmt .strike-through').remove();
            }
            $('.card.product-info').find('.item-total-' + item.UUID + ' .price-pdp-mvmt .sales').empty().append(item.priceTotal.price);
            if (item.giftPid !== undefined && item.giftPid !== '') {
                data.items.forEach(function (childitem) {
                    if (childitem.id == item.giftPid) {
                        $('.sale-gift-price-mvmt').empty().append(childitem.priceTotal.price);
                    }
                });
            }
            if ($giftProduct !== undefined && $giftProduct == true && $uuid !== undefined) {
                $('.gift-product-remove-'+ $uuid).remove();
            }

            if (item.UUID == $dataParentUUID) {
                $('.gift-product-chlid-uuid-' + $uuid).text('Add');
            }
    
            if (item.customAttributes.itemLevelGiftMessage && item.customAttributes.itemLevelGiftMessage.msgLine1) {
                var $itemLevelGiftMessage = item.customAttributes.itemLevelGiftMessage.msgLine1;
            }
            if ($itemLevelGiftMessage !== undefined && $itemLevelGiftMessage !== '') {
                $('.gift-product-chlid-uuid-' + $uuid).text('Edit');
            }

        });
    } else {
        data.items.forEach(function (item) {
            $('.item-' + item.UUID).empty().append(item.renderedPromotions);
            $('.item-total-' + item.UUID).empty().append(item.priceTotal.renderedPrice);
        });
    }
    // Custom End

    // Custom Start: remove gift product from cart
    if ($giftProduct !== undefined && $giftProduct == true) {
        $('.gift-lineitem-container').empty();
        $('.gift-product-remove-'+ $uuid).empty();       
    }
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
            $html += '<div class="single-approaching-discount text-center">' +
                item.discountMsg + '</div>';
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
            $messages += '<p class="line-item-attributes line-item-instock-date">' +
                $lineItem.availability.inStockDate +
                '</p>';
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
function decreaseQuantity(quantitySelector, id) {
    var $quantity = parseInt($(quantitySelector).val());
    var $decreasedSelector = $('button.decreased-btn[data-pid="' + id + '"]');
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
function increaseQuantity(quantitySelector, id) {
    var $quantity = parseInt($(quantitySelector).val());
    var $decreasedSelector = $('button.decreased-btn[data-pid="' + id + '"]');
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
function updateCartQuantity(quantitySelector, isKeyEvent) {
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
            $('.coupons-and-promos').children('.coupons-and-promos-wrapper').empty().append(data.totals.discountsHtml);
            $('.minicart-footer .subtotal-total-discount').empty().append(data.totals.subTotal);
            var $miniCartSelector = $('.mini-cart-data .mini-cart-header');
            $miniCartSelector.length > 0 ? updateMiniCartTotals(data) : updateCartTotals(data);
            updateApproachingDiscounts(data.approachingDiscounts);
            updateAvailability(data, $uuid);
            validateBasket(data);
            $(quantitySelector).data('pre-select-qty', $quantity);
            checkoutBtnDisabledOnEswCountriesRestrictedProduct(data);
            $.spinner().stop();
            //Custom Start: [MSS-1451] Listrak SendSCA on Cart Quantity Update
            if (window.Resources.LISTRAK_ENABLED) {
                var ltkSendSCA = require('listrak_custom/ltkSendSCA');
                ltkSendSCA.renderSCA(data.SCACart, data.listrakCountryCode);
            }
            //Custom End
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

/**
 * handle add gift checkbox on cart load
 */
function handleAddGiftCheckbox() {
    $('.gift-check').each(function (i, element) {
        var $this = $(element);
        var $giftProduct = $this.closest('.product-gift-wrap');
        var $giftMessageText = $giftProduct.find('.gift-message-wrapper, .character-limit');
        if ($this.is(':checked')) {
            $giftMessageText.show();
        } else {
            $giftMessageText.hide();
        }
    });
}

/**
 * handle add mesaage text area when user starts entering keywords
 * @param {Object} $element - current text area element
 */
function enterGiftMessageHandler($element) {
    var $this = $element;
    var value = $this.val();
    var maxchars = Resources.CART_GIFT_MESSAGE_LIMIT;
    var currentLength = value.length;
    var charsRemaining = maxchars - currentLength;
    var currentCard = $this.closest('.product-gift-wrap');
    var addGiftButton = currentCard.find('.add-gift-message');
    currentCard.find('.characters-left').html(charsRemaining);
    if ($this.val() !== '') {
        addGiftButton.removeAttr('disabled').find('.apply-button').removeClass('d-none');
        addGiftButton.find('.saved-button').addClass('d-none');
    }
}

/**
 * Check out btn disabled if in the cart having esw countries restricted product
 * @param {data} - current ajax response
 */
function checkoutBtnDisabledOnEswCountriesRestrictedProduct(data) {
    var $isEswProductRestrictionsEnabled = $('.esw-product-restrictions-enabled').data('esw-product-restrictions-enabled');
    var items = (data?.basket?.items || data?.items) ?? [];

    for (var i = 0; i < items.length > 0; i++) {
        var item = items[i];

        if ($isEswProductRestrictionsEnabled && item.isProductNotRestrictedOnEswCountries && !item.isCurrentDomesticAllowedCountry) {
            $('.checkout-btn').addClass('disabled');
        }
    }
}

module.exports = function () {

    // Check if Is gift message is checked on cart load then show text area otherwise hide it.
    handleAddGiftCheckbox();

    $('body').on('click', '.gift-check', function () {
        $(this).closest('.product-gift-wrap').find('.gift-message-wrapper, .character-limit').toggle(this.checked);
        if (!this.checked) {
            var parentDiv = $(this).closest('.product-gift-wrap');
            parentDiv.find('.gift-text').val('');
            var giftButton = parentDiv.find('.add-gift-message');
            var endPointURL = giftButton.attr('href');
            var giftMessage = '';
            var prodUUID = giftButton.data('product-uuid');
            giftButton.parent().find('.gift-message-blank').hide();
            giftButton.parent().find('.gift-message-error').hide();
            $.spinner().start();

            $.ajax({
                url: endPointURL,
                method: 'POST',
                data: {
                    giftMessage: giftMessage,
                    productUUID: prodUUID
                },
                success: function (data) {
                    $.spinner().stop();

                    giftButton.prop('disabled', 'disabled').find('.saved-button').removeClass('d-none');
                    giftButton.find('.apply-button').addClass('d-none');
                },
                error: function (data) {
                    $.spinner().stop();
                }
            });
        }
    });

    $('body').on('keyup', '.gift-text', function () {
        enterGiftMessageHandler($(this));
    });

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

    $('body').on('click','.beam-widget-cart', function() {
        var URL = $('.beam-widget-minicart').val();
        var chairtyId = $(this).attr('selectednonprofitid');
    
        $.ajax({
            url: URL,
            method: 'post',
            data: {
                chairtyId: chairtyId
            },
    
            success: function (data) {
                if (data) {
                }
            },
    
            error: function (err) {
            }
        });
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
        var $dataParentUUID = $(this).data('parent-pid');
        var $gtmProdObj = $(this).data('gtm-cart');
        var $giftProduct = $(this).data('gift');
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
                    var $cartContainer = $header + $image + $description + $urls;
                    // Custom Start: To Update Product Quantity on MiniCart
                    $('.minicart-quantity').empty().append(data.basket.numItems);
                    // Custom End
                    $('.mini-cart-data .popover').empty();
                    var $miniCartSelector = $('.mini-cart-data .mini-cart-header');
                    $miniCartSelector.length > 0 ? updateMiniCartTotals(data.basket) : updateCartTotals(data.basket);
                    $('.mini-cart-data .popover').append($cartContainer);
                    var $cartIcon = $('.cart-icon');
                    var $cartCounter = $('.cart-counter');
                    if (typeof $cartIcon !== 'undefined' && ($cartIcon !== '' || $cartIcon.length > 0)) {
                        $cartIcon.removeClass('fill-cart-icon');
                        $cartCounter.removeClass('fill-cart-count');
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
                    $('.coupons-and-promos').children('.coupons-and-promos-wrapper').empty().append(data.basket.totals.discountsHtml);
                    var $miniCartSelector = $('.mini-cart-data .mini-cart-header');
                    $miniCartSelector.length > 0 ? updateMiniCartTotals(data.basket, $giftProduct, $uuid, $dataParentUUID) : updateCartTotals(data.basket, $giftProduct, $uuid, $dataParentUUID);
                    updateApproachingDiscounts(data.basket.approachingDiscounts);
                    $('body').trigger('setShippingMethodSelection', data.basket);
                    validateBasket(data.basket);
                    checkoutBtnDisabledOnEswCountriesRestrictedProduct(data);
                }
                if (data.cartAnalyticsTrackingData && typeof setAnalyticsTrackingByAJAX != 'undefined') {
                    setAnalyticsTrackingByAJAX.cartAnalyticsTrackingData = data.cartAnalyticsTrackingData;
                    window.dispatchEvent(setAnalyticsTrackingByAJAX);
                }
                //Custom Start: [MSS-1451] Listrak SendSCA on Quantity Remove
                if (window.Resources.LISTRAK_ENABLED) {
                    var ltkSendSCA = require('listrak_custom/ltkSendSCA');
                    ltkSendSCA.renderSCA(data.SCACart, data.listrakCountryCode);
                }
                //Custom End
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
        var $dataParentUUID = $(this).data('parent-pid');
        var $uuid = $(this).data('uuid');
        var $gtmProdObj = $(this).data('gtm-cart');
        var $giftProduct = $(this).data('gift');
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
                    var $emptyCartContent = $image + $description + $urls;
                    var $productDiv = `<div class="empty-mini-cart">` +
                        $emptyCartContent +
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
                    var $cartIcon = $('.cart-icon');
                    var $cartCounter = $('.cart-counter');
                    if (typeof $cartIcon !== 'undefined' && ($cartIcon !== '' || $cartIcon.length > 0)) {
                        $cartIcon.removeClass('fill-cart-icon');
                        $cartCounter.removeClass('fill-cart-count');
                    }
                    if (data.cartAnalyticsTrackingData && typeof setAnalyticsTrackingByAJAX != 'undefined') {
                        setAnalyticsTrackingByAJAX.cartAnalyticsTrackingData = data.cartAnalyticsTrackingData;
                        window.dispatchEvent(setAnalyticsTrackingByAJAX);
                    }
                    var $progressMeterMain = $('.progress-meter-container');
                    $progressMeterMain.remove();
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
                    $('.coupons-and-promos').children('.coupons-and-promos-wrapper').empty().append(data.basket.totals.discountsHtml);
                    var $miniCartSelector = $('.mini-cart-data .mini-cart-header');
                    $miniCartSelector.length > 0 ? updateMiniCartTotals(data.basket, $giftProduct, $dataParentUUID) : updateCartTotals(data.basket, $giftProduct, $uuid, $dataParentUUID);
                    updateApproachingDiscounts(data.basket.approachingDiscounts);
                    $('body').trigger('setShippingMethodSelection', data.basket);
                    validateBasket(data.basket);
                    checkoutBtnDisabledOnEswCountriesRestrictedProduct(data);
                }
                //Custom Start: [MSS-1451] Listrak SendSCA on Remove
                if (window.Resources.LISTRAK_ENABLED) {
                    var ltkSendSCA = require('listrak_custom/ltkSendSCA');
                    ltkSendSCA.renderSCA(data.SCACart, data.listrakCountryCode);
                }
                //Custom End
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

    $('body').on('change', '.shippingMethods', function () {
        var $url = $(this).attr('data-actionUrl');
        var $urlParams = {
            methodID: $(this).find(':selected').attr('data-shipping-id')
        };

        $('.totals').spinner().start();
        $.ajax({
            url: $url,
            type: 'post',
            dataType: 'json',
            data: $urlParams,
            success: function (data) {
                if (data.error) {
                    window.location.href = data.redirectUrl;
                } else {
                    $('.coupons-and-promos').empty().append(data.totals.discountsHtml);
                    updateCartTotals(data);
                    updateApproachingDiscounts(data.approachingDiscounts);
                    validateBasket(data);
                }
                $.spinner().stop();
            },
            error: function (err) {
                if (err.redirectUrl) {
                    window.location.href = err.redirectUrl;
                } else {
                    createErrorNotification(err.responseJSON.errorMessage);
                    $.spinner().stop();
                }
            }
        });
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
                    $('.coupons-and-promos').children('.coupons-and-promos-wrapper').empty().append(data.totals.discountsHtml);
                    var $miniCartSelector = $('.mini-cart-data .mini-cart-header');
                    $miniCartSelector.length > 0 ? updateMiniCartTotals(data) : updateCartTotals(data);
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
                    $('.coupons-and-promos').children('.coupons-and-promos-wrapper').empty().append(data.totals.discountsHtml);
                    var $miniCartSelector = $('.mini-cart-data .mini-cart-header');
                    $miniCartSelector.length > 0 ? updateMiniCartTotals(data) : updateCartTotals(data);
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
                if (data.couponLineItemsLength !== undefined && data.couponLineItemsLength !== '') {
                    data.couponLineItemsLength > 0 ? $('.promo-code-applied').text(data.couponLineItemsLength + " " + window.Resources.COUPON_LINE_ITEM_LENGTH) : $('.promo-code-applied').text('');
                }
                var $miniCartSelector = $('.mini-cart-data .mini-cart-header');
                $miniCartSelector.length > 0 ? updateMiniCartTotals(data) : updateCartTotals(data);
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


    $('body').on('click', '.gift-box-container-link', function (evt) {
        evt.preventDefault();
        $('#giftBoxModelPopUp').find('.modal-content').empty();
        var $endPointUrl = $(evt.target).closest('a').attr('href');
        var $itemLevelGiftMessage = $(this).data('gift-message');
        $.spinner().start();
        $.ajax({
            url: $endPointUrl,
            type: 'get',
            success: function (response) {
                $('#giftBoxModelPopUp').find('.modal-content').html(response.template);
                if ($itemLevelGiftMessage !== undefined && $itemLevelGiftMessage !== '') {
                    $('.gift-box-container-modal .gift-text').text($itemLevelGiftMessage);
                } else {
                    $('.gift-box-container-modal .gift-text').text('');
                }

                var giftBoxContainerModel = $('.gift-box-container-modal-body');
                function refreshGiftMessage() {
                    if(response.basketModel.items.length && giftBoxContainerModel) {
                            response.basketModel.items.forEach(function (item) {
                            if (item.UUID == response.ProductLineItemUUID) {
                                $('.gift-box-container-modal .gift-text').text(response.itemLevelGiftMessage);
                                if (response.itemLevelGiftMessage) {
                                    $('.gift-message-blank').hide();
                                    $('.gift-message-error').hide();
                                    $('.gift-message-box').removeClass('hide-box');
                                    $('.add-gift-message').removeAttr('disabled');
                                }
                            }
                        });
                    } else {
                        setTimeout(function() {
                            refreshGiftMessage();
                        }, 500);
                    }
                }
                
                refreshGiftMessage();
                $.spinner().stop();
            },
            
            error: function () {
                $.spinner().stop();
            },

            complete: function () {
                setTimeout(function() {
                   $('.gift-box-container-modal-body').removeClass('disable-gift-box-model');
                }, 2000);
            }
        });
    });

    $('body').on('click', '.add-gift-box-input', function () {
        $('.add-gift-box').removeAttr('disabled');
        $('.gift-box-none-button').removeClass('active');
        $('.add-gift-box-input').addClass('active');
        disableSaveGiftBoxButton();
    });


    base.selectAttribute();
    base.colorAttribute();
    base.removeBonusProduct();
    base.selectBonusProduct();
    base.enableBonusProductSelection();
    base.showMoreBonusProducts();
    base.addBonusProductsToCart();
};