'use strict';

var base = require('../product/base');
var $applePayButtonLabel = window.Resources.APPLEPAY_BUTTON_LABEL;
var $googlePayButtonLabel = window.Resources.GOOGLEPAY_BUTTON_LABEL;

require('../utilities/spaceBelowBodyOnFixedButton');
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

$(
    function () {
        var deliveryTimeSelector = $('.delivery-time');
        var hours = deliveryTimeSelector.data('hours');
        var minutes = deliveryTimeSelector.data('minutes');
        var seconds = deliveryTimeSelector.data('seconds');
        var remainingDate = new Date();
        remainingDate.setHours(hours);
        remainingDate.setMinutes(minutes);
        remainingDate.setSeconds(seconds);
        var countDown = setInterval(function () {
            if (remainingDate.getHours() > 0 || remainingDate.getMinutes() > 0 || remainingDate.getSeconds() > 0) {
                var displayHours = remainingDate.getHours().toString().length < 2 ? '0' + remainingDate.getHours() : remainingDate.getHours();
                var displayMinutes = remainingDate.getMinutes().toString().length < 2 ? '0' + remainingDate.getMinutes() : remainingDate.getMinutes();
                var displaySeconds = remainingDate.getSeconds().toString().length < 2 ? '0' + remainingDate.getSeconds() : remainingDate.getSeconds();
                remainingDate.setSeconds(remainingDate.getSeconds() - 1);
                $('.time-update-control').text(
                        displayHours
                        + ' Hours, ' +
                        displayMinutes
                        + ' Minutes ' +
                        displaySeconds
                        + ' Seconds'
                );
            } else if (typeof hours != 'undefined' && typeof minutes != 'undefined' && typeof seconds != 'undefined') {
                clearInterval(countDown);
                window.location.reload(true);
            }
        }, 1000);
    }
);

$( document ).ready(function() {
    $('.cart-page .bonus-product-line-item.product-card-wrapper > div.card.bonus-product-button').siblings('.item-info').css('border-bottom','none').children('.col-12:last').hide();
    setTimeout(function() {
        $('.apple-pay-cart').attr('aria-label', $applePayButtonLabel);
        $('.gpay-button').attr('aria-label', $googlePayButtonLabel);
    }, 2000);
});

/**
 * Checks whether the basket is valid. if invalid displays error message and disables
 * checkout button
 * @param {Object} data - AJAX response from the server
 */
function validateBasket(data) {
    var $checkoutBtn = $('.checkout-btn');
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
            var $miniCartQuantity = $('.minicart-quantity');
            var $showMiniCartCounter = $('.minicart-quantity').data('counter');
            if($showMiniCartCounter != 'undefined' && $showMiniCartCounter == false) {
                $miniCartQuantity.empty();
                $miniCartQuantity.removeClass('d-block').addClass('d-none');
            } else {
                $miniCartQuantity.empty().append(data.numItems);
            }
            $('.minicart .popover').empty().removeClass('show');
        }

        $checkoutBtn.addClass('disabled');
    } else {
        if (!$checkoutBtn.hasClass('disabled')) {
            $checkoutBtn.removeClass('disabled');
        }
    }
}

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
    var $miniCartQuantity = $('.minicart-quantity');
    var $showMiniCartCounter = $('.minicart-quantity').data('counter');
    if($showMiniCartCounter != 'undefined' && $showMiniCartCounter == false) {
        $miniCartQuantity.empty();
        $miniCartQuantity.removeClass('d-block').addClass('d-none');
    } else {
        $miniCartQuantity.empty().append(data.numItems);
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

    data.items.forEach(function (item) {
        $('.item-' + item.UUID).empty().append(item.renderedPromotions);
        $('.item-total-' + item.UUID).empty().append(item.priceTotal.renderedPrice);

        if ($pickupFromStore && $productIds.indexOf(parseInt(item.id)) > -1) {
            $('select[data-pid="' + item.id + '"]').attr('disabled', true);
        }

        if (item && item.options && item.options.length > 0) {
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
    var lineItemAvailability;
    var lineItemMessage;

    for (var i = 0; i < data.items.length; i++) {
        if (data.items[i].UUID === uuid) {
            lineItem = data.items[i];
            break;
        }
    }

    lineItemAvailability = $('.availability-' + lineItem.UUID);
    lineItemMessage = lineItemAvailability.find('.line-item-attributes');
    
    if (!(lineItemMessage.hasClass('low-stock-availability'))) {
        lineItemAvailability.empty();

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
        lineItemAvailability.html(messages);
    }
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
 * Finds an element in the array that matches search parameter
 * @param {array} array - array of items to search
 * @param {function} match - function that takes an element and returns a boolean indicating if the match is made
 * @returns {Object|null} - returns an element of the array that matched the query.
 */
function findItem(array, match) {
    for (var i = 0, l = array.length; i < l; i++) {
        if (match.call(this, array[i])) {
            return array[i];
        }
    }
    return null;
}

/**
 * Updates details of a product line item
 * @param {Object} data - AJAX response from the server
 * @param {string} uuid - The uuid of the product line item to update
 */
function updateProductDetails(data, uuid) {
    var lineItem = findItem(data.cartModel.items, function (item) {
        return item.UUID === uuid;
    });

    if (lineItem.variationAttributes) {
        var colorAttr = findItem(lineItem.variationAttributes, function (attr) {
            return attr.attributeId === 'color';
        });

        if (colorAttr) {
            var colorSelector = '.Color-' + uuid;
            var newColor = 'Color: ' + colorAttr.displayValue;
            $(colorSelector).text(newColor);
        }

        var sizeAttr = findItem(lineItem.variationAttributes, function (attr) {
            return attr.attributeId === 'size';
        });

        if (sizeAttr) {
            var sizeSelector = '.Size-' + uuid;
            var newSize = 'Size: ' + sizeAttr.displayValue;
            $(sizeSelector).text(newSize);
        }

        var imageSelector = '.card.product-info.uuid-' + uuid + ' .item-image > img';
        $(imageSelector).attr('src', lineItem.images.small[0].url);
        $(imageSelector).attr('alt', lineItem.images.small[0].alt);
        $(imageSelector).attr('title', lineItem.images.small[0].title);
    }

    var qtySelector = '.quantity[data-uuid="' + uuid + '"]';
    $(qtySelector).val(lineItem.quantity);
    $(qtySelector).data('pid', data.newProductId);

    $('.remove-product[data-uuid="' + uuid + '"]').data('pid', data.newProductId);

    var priceSelector = '.line-item-price-' + uuid + ' .sales .value';
    $(priceSelector).text(lineItem.price.sales.formatted);
    $(priceSelector).attr('content', lineItem.price.sales.decimalPrice);

    if (lineItem.price.list) {
        var listPriceSelector = '.line-item-price-' + uuid + ' .list .value';
        $(listPriceSelector).text(lineItem.price.list.formatted);
        $(listPriceSelector).attr('content', lineItem.price.list.decimalPrice);
    }
}

/**
 * Generates the modal window on the first call.
 *
 */
function getModalHtmlElement() {
    if ($('#editProductModal').length !== 0) {
        $('#editProductModal').remove();
    }
    var htmlString = '<!-- Modal -->'
        + '<div class="modal fade" id="editProductModal" role="dialog">'
        + '<div class="modal-dialog quick-view-dialog">'
        + '<!-- Modal content-->'
        + '<div class="modal-content">'
        + '<div class="modal-header">'
        + '    <button type="button" class="close pull-right" data-dismiss="modal">'
        + '        &times;'
        + '    </button>'
        + '</div>'
        + '<div class="modal-body"></div>'
        + '<div class="modal-footer"></div>'
        + '</div>'
        + '</div>'
        + '</div>';
    $('body').append(htmlString);
}

/**
 * Parses the html for a modal window
 * @param {string} html - representing the body and footer of the modal window
 *
 * @return {Object} - Object with properties body and footer.
 */
function parseHtml(html) {
    var $html = $('<div>').append($.parseHTML(html));

    var body = $html.find('.product-quickview');
    var footer = $html.find('.modal-footer').children();

    return { body: body, footer: footer };
}

/**
 * replaces the content in the modal window for product variation to be edited.
 * @param {string} editProductUrl - url to be used to retrieve a new product model
 */
function fillModalElement(editProductUrl) {
    $('.modal-body').spinner().start();
    $.ajax({
        url: editProductUrl,
        method: 'GET',
        dataType: 'html',
        success: function (html) {
            var parsedHtml = parseHtml(html);

            $('#editProductModal .modal-body').empty();
            $('#editProductModal .modal-body').html(parsedHtml.body);
            $('#editProductModal .modal-footer').html(parsedHtml.footer);
            $('#editProductModal').modal('show');
            $.spinner().stop();
        },
        error: function () {
            $.spinner().stop();
        }
    });
}

/**
 * replace content of modal
 * @param {string} actionUrl - url to be used to remove product
 * @param {string} productID - pid
 * @param {string} productName - product name
 * @param {string} uuid - uuid
 */
function confirmDelete(actionUrl, productID, productName, uuid, gtmProdObj, pickupStoreAvailable) {
    var $deleteConfirmBtn = $('.cart-delete-confirmation-btn');
    var $productToRemoveSpan = $('.product-to-remove');
    $deleteConfirmBtn.data('pid', productID);
    $deleteConfirmBtn.data('action', actionUrl);
    $deleteConfirmBtn.data('uuid', uuid);
    $deleteConfirmBtn.data('store-pickup-available', pickupStoreAvailable);
    $('.gtm-cart').attr('data-gtm-cart', JSON.stringify(gtmProdObj));

    $productToRemoveSpan.empty().append(productName);
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
    var $applePayButton = $('.apple-pay-cart');
    $applePayButton.attr('disabled', true);
    currentCard.find('.characters-left').html(charsRemaining);
    currentCard.find('.gift-message-apply').val(false);

    if ($this.val() !== '') {
        addGiftButton.removeAttr('disabled').find('.apply-button').removeClass('d-none');
        addGiftButton.find('.saved-button').addClass('d-none');
    }
}
function displayMessageAndRemoveFromCart(data) {
    $.spinner().stop();
    var status = data.success ? 'alert-success' : 'alert-danger';

    if ($('.add-to-wishlist-messages').length === 0) {
        $('body').append('<div class="add-to-wishlist-messages "></div>');
    }
    $('.add-to-wishlist-messages')
      .append('<div class="add-to-wishlist-alert text-center ' + status + '">' + data.msg + '</div>');

    setTimeout(function () {
        $('.add-to-wishlist-messages').remove();
    }, 1500);
    var $targetElement = $('a[data-pid="' + data.pid + '"]').closest('.product-info').find('.remove-product');
    var itemToMove = {
        actionUrl: $targetElement.data('action'),
        productID: $targetElement.data('pid'),
        productName: $targetElement.data('name'),
        uuid: $targetElement.data('uuid')
    };
    $('body').trigger('afterRemoveFromCart', itemToMove);
    setTimeout(function () {
        $('.cart.cart-page #removeProductModal').modal();
    }, 2000);
}

function updateStorePickupProductAvailability() {
    $('.remove-product').each(function (index, removeProduct) {
        var $storePickupAvailable = $(removeProduct).data('store-pickup-available');
        if ($storePickupAvailable == false) {
            $('.checkout-btn').addClass('disabled');
            $('.apple-pay-cart').attr('disabled', true);

            return;
        } else {
            $('.checkout-btn').removeClass('disabled');
            $('.apple-pay-cart').attr('disabled', false);
            $('.pickup-store-error').remove();
        }
    });
}

module.exports = function () {
    // Check if Is gift message is checked on cart load then show text area otherwise hide it.
    handleAddGiftCheckbox();

    $('body').on('click', '.remove-product', function (e) {
        e.preventDefault();

        var actionUrl = $(this).data('action');
        var productID = $(this).data('pid');
        var productName = $(this).data('name');
        var uuid = $(this).data('uuid');
        var gtmProdObj = $(this).data('gtm-cart');
        var pickupStoreAvailable = $(this).data('store-pickup-available');
        confirmDelete(actionUrl, productID, productName, uuid, gtmProdObj, pickupStoreAvailable);
    });

    $('body').on('afterRemoveFromCart', function (e, data) {
        e.preventDefault();
        confirmDelete(data.actionUrl, data.productID, data.productName, data.uuid, data.pickupStoreAvailable);
    });

    $('.optional-promo').click(function (e) {
        e.preventDefault();
        $('.promo-code-form').toggle();
    });

    $('body').on('click', '.cart-delete-confirmation-btn', function (e) {
        e.preventDefault();

        var productID = $(this).data('pid');
        var url = $(this).data('action');
        var uuid = $(this).data('uuid');
        var pickupStoreAvailable = $(this).data('store-pickup-available');
        var urlParams = {
            pid: productID,
            uuid: uuid
        };

        url = appendToUrl(url, urlParams);

        $('body > .modal-backdrop').remove();

        $.spinner().start();
        $.ajax({
            url: url,
            type: 'get',
            dataType: 'json',
            success: function (data) {
                if (typeof isklarnaPromoEnabled != 'undefined' && isklarnaPromoEnabled && data.isKlarnaCartPromoEnabled) {
                    $('klarna-placement').attr("data-purchase_amount", data.basket.totals.klarnaGrandTotal);
                    window.KlarnaOnsiteService = window.KlarnaOnsiteService || [];
                    window.KlarnaOnsiteService.push({
                        eventName: 'refresh-placements'
                    });
                }
                if (data.basket.items.length === 0) {
                    $('.cart').empty().append(data.emptyCartDom);
                    $('.number-of-items').empty().append(data.basket.resources.numberOfItems);
                    var $miniCartQuantity = $('.minicart-quantity');
                    var $showMiniCartCounter = $('.minicart-quantity').data('counter');
                    if($showMiniCartCounter != 'undefined' && $showMiniCartCounter == false) {
                        $miniCartQuantity.empty();
                        $miniCartQuantity.removeClass('d-block').addClass('d-none');
                    } else {
                        $miniCartQuantity.empty().append(data.basket.numItems);
                    }
                    $('.minicart .popover').empty().removeClass('show');
                    $('body').removeClass('modal-open');
                    $('html').removeClass('veiled');
                    $('.estimate-price-wrapper').hide();
                    $('.cart-error').empty();
                    $('.cart-store-pickup').prop('checked', false);
                    $('.progress-meter-container').hide();
                    $('.cart-recommendation-wrapper').empty();
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

                if(data.cartAnalyticsTrackingData && typeof setAnalyticsTrackingByAJAX != 'undefined') {
                    setAnalyticsTrackingByAJAX.cartAnalyticsTrackingData = data.cartAnalyticsTrackingData;
                    window.dispatchEvent(setAnalyticsTrackingByAJAX);
                }

                if(pickupStoreAvailable != null && pickupStoreAvailable != undefined) {
                    updateStorePickupProductAvailability();
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

    $('body').on('change', '.quantity-form > .quantity', function () {
        var preSelectQty = $(this).data('pre-select-qty');
        var quantity = $(this).val();
        var productID = $(this).data('pid');
        var url = $(this).data('action');
        var uuid = $(this).data('uuid');

        var urlParams = {
            pid: productID,
            quantity: quantity,
            uuid: uuid
        };
        url = appendToUrl(url, urlParams);

        $(this).parents('.card').spinner().start();

        $.ajax({
            url: url,
            type: 'get',
            context: this,
            dataType: 'json',
            success: function (data) {
                $('.quantity[data-uuid="' + uuid + '"]').val(quantity);
                $('.coupons-and-promos').empty().append(data.totals.discountsHtml);
                updateCartTotals(data);
                updateApproachingDiscounts(data.approachingDiscounts);
                updateAvailability(data, uuid);
                validateBasket(data);
                $(this).data('pre-select-qty', quantity);
                $.spinner().stop();
                if ($(this).parents('.product-info').hasClass('bonus-product-line-item') && $('.cart-page').length) {
                    location.reload();
                }
            },
            error: function (err) {
                if (err.responseJSON.redirectUrl) {
                    window.location.href = err.responseJSON.redirectUrl;
                } else {
                    createErrorNotification(err.responseJSON.errorMessage);
                    $(this).val(parseInt(preSelectQty, 10));
                    $.spinner().stop();
                }
            }
        });
    });

    $('body').on('change', '.shippingMethods', function () {
        var url = $(this).attr('data-actionUrl');
        var urlParams = {
            methodID: $(this).find(':selected').attr('data-shipping-id')
        };
        // url = appendToUrl(url, urlParams);

        $('.totals').spinner().start();
        $.ajax({
            url: url,
            type: 'post',
            dataType: 'json',
            data: urlParams,
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

    $('body').on('submit', '.promo-code-form', function (e) {
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

    $('body').on('click', '.coupons-and-promos .remove-coupon', function (e) {
        e.preventDefault();

        var couponCode = $(this).data('code');
        var uuid = $(this).data('uuid');
        var $deleteConfirmBtn = $('.delete-coupon-confirmation-btn');
        var $productToRemoveSpan = $('.coupon-to-remove');

        $deleteConfirmBtn.data('uuid', uuid);
        $deleteConfirmBtn.data('code', couponCode);

        $productToRemoveSpan.empty().append(couponCode);
    });

    $('body').on('click', '#removeCouponModal .delete-coupon-confirmation-btn', function (e) {
        e.preventDefault();

        var url = $(this).data('action');
        var uuid = $(this).data('uuid');
        var couponCode = $(this).data('code');
        var urlParams = {
            code: couponCode,
            uuid: uuid
        };

        url = appendToUrl(url, urlParams);

        $('body > .modal-backdrop').remove();

        $.spinner().start();
        $.ajax({
            url: url,
            type: 'get',
            dataType: 'json',
            success: function (data) {
                $('.coupon-uuid-' + uuid).remove();
                if (data.couponLineItemsLength !== undefined && data.couponLineItemsLength !== '') {
                    data.couponLineItemsLength > 0 ? $('.promo-code-applied').text(data.couponLineItemsLength + " " + window.Resources.COUPON_LINE_ITEM_LENGTH) : $('.promo-code-applied').text('');
                }
                updateCartTotals(data);
                updateApproachingDiscounts(data.approachingDiscounts);
                $('.promotion-information').parent().empty().append(data.totals.discountsHtml);
                validateBasket(data);
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
    $('body').on('click', '.cart-page .bonus-product-button', function () {
        $.spinner().start();
        $.ajax({
            url: $(this).data('url'),
            method: 'GET',
            dataType: 'json',
            success: function (data) {
                base.methods.editBonusProducts(data);
                $.spinner().stop();
            },
            error: function () {
                $.spinner().stop();
            }
        });
    });
    $('body').on('click', '.cart-page .product-edit .edit, .cart-page .bundle-edit .edit', function (e) {
        e.preventDefault();

        var editProductUrl = $(this).attr('href');
        getModalHtmlElement();
        fillModalElement(editProductUrl);
    });

    $('body').on('product:updateAddToCart', function (e, response) {
        // update global add to cart (single products, bundles)
        var dialog = $(response.$productContainer)
            .closest('.quick-view-dialog');

        $('.update-cart-product-global', dialog).parent().toggleClass('d-none',
            !$('.global-availability', dialog).data('ready-to-order')
            || !$('.global-availability', dialog).data('available')
        );
    });

    $('body').on('product:updateAvailability', function (e, response) {
        // bundle individual products
        $('.product-availability', response.$productContainer)
            .data('ready-to-order', response.product.readyToOrder)
            .data('available', response.product.available)
            .find('.availability-msg')
            .empty()
            .html(response.message);


        var dialog = $(response.$productContainer)
            .closest('.quick-view-dialog');

        if ($('.product-availability', dialog).length) {
            // bundle all products
            var allAvailable = $('.product-availability', dialog).toArray()
                .every(function (item) { return $(item).data('available'); });

            var allReady = $('.product-availability', dialog).toArray()
                .every(function (item) { return $(item).data('ready-to-order'); });

            $('.global-availability', dialog)
                .data('ready-to-order', allReady)
                .data('available', allAvailable);

            $('.global-availability .availability-msg', dialog).empty()
                .html(allReady ? response.message : response.resources.info_selectforstock);
        } else {
            // single product
            $('.global-availability', dialog)
                .data('ready-to-order', response.product.readyToOrder)
                .data('available', response.product.available)
                .find('.availability-msg')
                .empty()
                .html(response.message);
        }
    });

    $('body').on('product:afterAttributeSelect', function (e, response) {
        if ($('.modal.show .product-quickview .bundle-items').length) {
            $('.modal.show').find(response.container).data('pid', response.data.product.id);
            $('.modal.show').find(response.container).find('.product-id').text(response.data.product.id);
        } else {
            $('.modal.show .product-quickview').data('pid', response.data.product.id);
        }
    });

    $('body').on('change', '.quantity-select', function () {
        var selectedQuantity = $(this).val();
        $('.modal.show .update-cart-url').data('selected-quantity', selectedQuantity);
    });

    $('body').on('click', '.update-cart-product-global', function (e) {
        e.preventDefault();

        var updateProductUrl = $(this).closest('.cart-and-ipay').find('.update-cart-url').val();
        var selectedQuantity = $(this).closest('.cart-and-ipay').find('.update-cart-url').data('selected-quantity');
        var uuid = $(this).closest('.cart-and-ipay').find('.update-cart-url').data('uuid');

        var form = {
            uuid: uuid,
            pid: base.getPidValue($(this)),
            quantity: selectedQuantity
        };

        $(this).parents('.card').spinner().start();
        if (updateProductUrl) {
            $.ajax({
                url: updateProductUrl,
                type: 'post',
                context: this,
                data: form,
                dataType: 'json',
                success: function (data) {
                    $('#editProductModal').remove();
                    $('.modal-backdrop').remove();
                    $('body').removeClass('modal-open');

                    $('.coupons-and-promos').empty().append(data.cartModel.totals.discountsHtml);
                    updateCartTotals(data.cartModel);
                    updateApproachingDiscounts(data.cartModel.approachingDiscounts);
                    updateAvailability(data.cartModel, uuid);
                    updateProductDetails(data, uuid);

                    if (data.uuidToBeDeleted) {
                        $('.uuid-' + data.uuidToBeDeleted).remove();
                    }

                    validateBasket(data.cartModel);

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
        }
    });

	// changes to add/remove gift wrapping option
    $('.add-gift-wrap').on('change', function (e) {
        e.preventDefault();
        var endPointUrl = $(this).attr('href');
        var selectOption = $(this).val();
        var optionUUID = $(this).attr('data-option-uuid');
        var uuid = $(this).attr('data-product-uuid');
        $.spinner().start();
        $.ajax({
            url: endPointUrl,
            method: 'POST',
            data: {
                uuid: optionUUID,
                selectedOptionID: selectOption
            },
            success: function (data) {
                var optionSelectValues = data.lineItemOptions[uuid].selectOptionValue;
                updateCartTotals(data);
                updateApproachingDiscounts(data.approachingDiscounts);
                validateBasket(data);
                $.spinner().stop();
            },
            error: function () { $.spinner().stop(); }
        });
    });

    $('body').on('click', '.add-gift-message', function (e) {
        e.preventDefault();
        var $this = $(this);
        var endPointURL = $this.attr('href');
        var giftMessage = $this.parent().find('.gift-text').val();
        var prodUUID = $this.data('product-uuid');
        $this.find('.gift-message-apply').val(true);
        var $applePayButton = $('.apple-pay-cart');
        var $applyButtton = $('.add-gift-message');
        var $giftMessageArray = [];

        $applyButtton.each(function () {
            var $giftMessageApply = $(this).find('.gift-message-apply').val();
            $giftMessageArray.push($giftMessageApply);
        });

        if ($giftMessageArray && $giftMessageArray.indexOf('false') > -1) {
            $applePayButton.attr('disabled', true);
        } else {
            $applePayButton.attr('disabled', false);
        }

        $this.parent().find('.gift-message-blank').hide();
        $this.parent().find('.gift-message-error').hide();
        if (!giftMessage) {
            $this.parent().find('.gift-message-blank').show();
            return false;
        }

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
                if (data.result.error) {
                    $this.parent().find('.gift-message-error').show();
                    return false;
                }
                $this.prop('disabled', 'disabled').find('.saved-button').removeClass('d-none');
                $this.parent().find('.gift-message-error').hide();
                $this.find('.apply-button').addClass('d-none');
            },
            error: function (data) {
            	$.spinner().stop();
            }
        });
    });

    $('body').on('click', '.gift-check', function () {
        $(this).closest('.product-gift-wrap').find('.gift-message-wrapper, .character-limit').toggle(this.checked);
        var $applePayButton = $('.apple-pay-cart');

        if (!this.checked) {
            var parentDiv = $(this).closest('.product-gift-wrap');
            parentDiv.find('.gift-text').val('');
            var giftButton = parentDiv.find('.add-gift-message');
            var endPointURL = giftButton.attr('href');
            var giftMessage = '';
            var prodUUID = giftButton.data('product-uuid');
            $applePayButton.attr('disabled', false);
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

                    var $applyButtton = $('.add-gift-message');
                    var $giftMessageArray = [];

                    $applyButtton.each(function () {
                        var $giftMessageApply = $(this).find('.gift-message-apply').val();
                        $giftMessageArray.push($giftMessageApply);
                    });

                    if ($giftMessageArray && $giftMessageArray.indexOf('false') > -1) {
                        $applePayButton.attr('disabled', true);
                    } else {
                        $applePayButton.attr('disabled', false);
                    }
                },
                error: function (data) { $.spinner().stop(); }
            });
        }
    });

    $('body').on('keyup', '.gift-text', function () {
        enterGiftMessageHandler($(this));
    });
    $('body').on('click', '.product-move .move', function (e) {
        e.preventDefault();
        var url = $(this).attr('href');
        var pid = $(this).data('pid');
        var optionId = $(this).closest('.product-info').find('.lineItem-options-values').data('option-id');
        var optionVal = $(this).closest('.product-info').find('.lineItem-options-values').data('value-id');
        var gtmEventData = $(this).data('gtm-tracking');
        optionId = optionId || null;
        optionVal = optionVal || null;
        if (!url || !pid) {
            return;
        }

        $.spinner().start();
        $.ajax({
            url: url,
            type: 'post',
            dataType: 'json',
            data: {
                pid: pid,
                optionId: optionId,
                optionVal: optionVal
            },
            success: function (data) {
                displayMessageAndRemoveFromCart(data);
                if (data.success) {
                	$('body').trigger('addWishlistCart:success', gtmEventData);
                }
            },
            error: function (err) {
                displayMessageAndRemoveFromCart(err);
            }
        });
    });

    $('body').on('click', '.checkout-btn, .paypal-btn', function (e) {
        var $applyButtton = $('.add-gift-message');
        var $errorMsg = Resources.GIFT_MESSAGE_CART_ERROR;
        var $giftMessageArray = [];

        $applyButtton.each(function () {
            var $giftMessageApply = $(this).find('.gift-message-apply').val();
            $giftMessageArray.push($giftMessageApply);
        });

        if ($giftMessageArray && $giftMessageArray.indexOf('false') > -1) {
            var $errorHtml = '<div class="alert card alert-dismissible gift-cart-error ' +
            'fade show" role="alert">' +
            '<button type="button" class="close" data-dismiss="alert" aria-label="Close">' +
            '<span aria-hidden="true">&times;</span>' +
            '</button>' + $errorMsg + '</div>';

            if ($errorMsg) {
                $('.cart-error').empty().append($errorHtml);
            }
            e.stopPropagation();
            e.preventDefault();
        }
    });

    base.selectAttribute();
    base.setOptionsAttribute();
    base.colorAttribute();
    base.removeBonusProduct();
    base.enableBonusProductSelection();
    base.showMoreBonusProducts();
    base.addBonusProductsToCart();
    base.showAddToCartModalAfterBonusProductModal();
};
