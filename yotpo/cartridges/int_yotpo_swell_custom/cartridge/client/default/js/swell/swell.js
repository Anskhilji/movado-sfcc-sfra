'use strict';

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
    
    $('.delivery-date').empty().append(data.totals.deliveryDate);
    $('.number-of-items').empty().append(data.resources.numberOfItems);
    $('.shipping-cost').empty().append(data.totals.totalShippingCost);
    $('.tax-total').empty().append(data.totals.totalTax);
    $('.grand-total, .cart-total').empty().append(data.totals.grandTotal);
    $('.sub-total').empty().append(data.totals.subTotal);
    /* Affirm block for refreshing promo message */
    var totalCalculated = data.totals.grandTotal.substr(1).toString().replace(/\,/g, '');
    $('.affirm-as-low-as').attr('data-amount', (totalCalculated * 100).toFixed());
    if (Resources.AFFIRM_PAYMENT_METHOD_STATUS) {
        affirm.ui.ready(function(){
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
    // Custom Start: Updated selector and rendered HTML as per MVMT site
        if (item.price.list) {
            $('.item-total-' + item.UUID + ' .price .strike-through').remove();
            $('.item-total-' + item.UUID + ' .price').prepend('<span class="strike-through list">' +
                '<span class="value" content="' + item.priceTotal.nonAdjustedFormattedPrice + '">' +
                '<span class="sr-only">label.price.reduced.from</span>' +
                '<span class="eswListPrice">' + item.priceTotal.nonAdjustedFormattedPrice + '</span>' +
                '<span class="sr-only">label.price.to</span></span></span>');
        } else {
            $('.item-total-' + item.UUID + ' .price .strike-through').remove();
        }
        $('.item-total-' + item.UUID + ' .sales').empty().append(item.priceTotal.price);
    });
    // Custom End
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

$('.earn-more-btn').click(function() {
    $([document.documentElement, document.body]).animate({
        scrollTop: $('.swell-campaign-list-container').offset().top
    }, 1000);
});

$('.get-reward-btn').click(function() {
    $([document.documentElement, document.body]).animate({
        scrollTop: $('.swell-redemption-list-container').offset().top
    }, 1000);
})

$(document).on("swell:initialized", () => {
    if (typeof swellAPI !== 'undefined') {
        swellAPI.getActiveCampaigns().forEach(campaign => {
            $(".swell-campaign-list").append(
            $("<li>").addClass("campaign").append(
            $("<div>").append(
            $("<i>").addClass(`fa ${campaign.icon}`),
            $("<h5>", {text: campaign.title}),
            $("<p>", {text: campaign.rewardText})
        ).attr('id', `campaign-${campaign.id}`)
        ).addClass("swell-campaign-link")
        .attr(
        {
            "data-campaign-id": campaign.id,
            "data-display-mode": "modal"
        }
        )
        );
        });
    }
});

$(document).on("swell:initialized", () => {
    if (typeof swellAPI !== 'undefined') {
        swellAPI.getActiveRedemptionOptions().forEach(option => {
            if (option.discountType === "price_adjustment_fixed_amount") {
                $(".swell-redemption-option-list").append(
                    $("<div>").addClass("swell-static-redemption-option").append(
                        $("<div>").addClass("swell-redemption-link-inside").append(
                            $("<p>").addClass("swell-static-redemption-option-point-value").text(option.costText),
                            $("<h2>").addClass("swell-static-redemption-option-title").text(option.name)
                        )
                    ).addClass("swell-redemption-link").attr("data-redemption-option-id", option.id)
                )
            }
        })
    }
});

var onSuccess = function(redemption) {
    $('#error').addClass('d-none');
    fillAndSubmitCouponCodeForm(redemption.couponCode);
    applySwellDiscount(redemption.id);
};

var onError = function(err) {
    var $redemptionContainer = $('.swell-redemption');
    $redemptionContainer.spinner().stop();
    $('#error').removeClass('d-none');
};

// depending on your cart/checkout markup the selectors will need to be updated
var fillAndSubmitCouponCodeForm = function(couponCode) {
    // set the value for the coupon code input
    $("#coupon-code-input-element").val(couponCode);
};

/**
 * re-renders the redemption id on the mini cart and checkout
 * @param {Integer} id - AJAX response from the server
 */
var upadteSwellRedemptionId = function(id) {
    // set the value for the redemption id input
    $('.swell-remove-redeem-rewards').attr('data-redemption-id', id);
};

$(document).ready(function() {
    handleSwellPointContainer();
});

/**
 * re-renders the swell points and the redemption id on the mini cart and checkout
 * @param {Object} data - AJAX response from the server
 */
function updateSwellPointsContainer(data) {
    if (data && data.swellRedemption && data.swellRedemption.swellRedemptionID !== '') {
        var swellPointsContainar =
        '<div class="redeem-rewards-promos swell-promotion-information col-12">' +
        '<div class="promotion-price-adjustment">'+
        '<div class="promotion-adjustment">' + data.swellRedemption.swellRedemptionText +
        '<button type="button" class="float-right swell-remove-redeem-rewards" aria-label="Close" data-redemption-id=" '+ data.swellRedemption.swellRedemptionID +'">' +
        '<span aria-hidden="true">&times;</span>'+
        '</button>'+
        '</div>'+
        '<div class="coupon-applied">'+ Resources.LABEL_SWELL_POINTS_APPLIED +
        '</div>'+
        '</div>'+
        '</div>';
         $('.swell-redeem-rewards-promos').append(swellPointsContainar);
    }
}

function handleSwellPointContainer() {
    var $swellPoints = parseInt($('.swell-points-total').text());
    if (document.readyState === "complete" && $swellPoints) {
        var $swellPointsContainar = $('.swell-redemption-containar');
        if ($swellPoints > 250) {
            $swellPointsContainar.removeClass('d-none');
        } else {
            $swellPointsContainar.addClass('d-none');
        }
    } else {
        setTimeout(function() {
            handleSwellPointContainer();
        }, 200);
    }
}

$(document).on("swell:initialized", () => {
    if (typeof swellAPI !== 'undefined') {
        $("#swell-redemption-dropdown").empty();
        $("#swell-redemption-dropdown").append('<option>Please select an option</option>');
        swellAPI.getActiveRedemptionOptions().forEach(option => {
            if (option.discountType === "price_adjustment_fixed_amount") {
                $("#swell-redemption-dropdown").append(
                    $("<option>").val(option.id).text(`${option.name} = ${option.costText}`)
                )
            }
        });
    }
});

$(document).on('click', '#coupon-code-submit-btn', function (e) {
    e.preventDefault();
    var $redemptionContainer = $('.swell-redemption');
    $redemptionContainer.spinner().start();
    swellAPI.makeRedemption(
        { redemptionOptionId: $("#swell-redemption-dropdown option:selected").val(), delayPointDeduction: true },
        onSuccess,
        onError
    );
});

$('.mini-cart-data').on('click', '.swell-redemption-btn', function (e) {
    e.preventDefault();
    var $redemptionContainer = $('.swell-redemption');
    $redemptionContainer.spinner().start();
    swellAPI.makeRedemption(
        { redemptionOptionId: $("#swell-redemption-dropdown option:selected").val(), delayPointDeduction: true },
        onSuccess,
        onError
    );
});

$(document).on('click', '.swell-remove-redeem-rewards', function (e) {
    e.preventDefault();
    var $removeredemptionContainer = $('.coupons-and-promos');
    var pointRedemptionID = $(this).data('redemption-id');
    if (typeof swellAPI !== 'undefined' || swellAPI !== null) {
        $removeredemptionContainer.spinner().start();
        swellAPI.removePointRedemptionIdFromCart(pointRedemptionID, removeSwellDiscountFromCart());
    }
});

function removeSwellDiscountFromCart() {
    applySwellDiscount(null);
    $('.swell-promotion-price-adjustment').remove();
}

function applySwellDiscount(swellRedemptionId) {
    var $csrfInput = $('.swell-crf-token');
    var $redemptionContainer = $('.swell-redemption');
    var removeRedemptionContainer = $('.coupons-and-promos');
    var $swellDiscount = $('.swell-discount');
    var url = $swellDiscount.data('url') + '?' + $csrfInput.attr('name') + '=' + $csrfInput.attr('value') + '&swellRedemptionId' + '=' + swellRedemptionId;
    $.ajax({
        url: url,
        type: 'get',
        dataType: 'json',
        success: function (data) {
            if (data.error) {
                $('#error').empty().append(data.errorMessage);
            } else {
                $('.coupons-and-promos').empty().append(data.totals.discountsHtml);
                updateCartTotals(data);
                updateApproachingDiscounts(data.approachingDiscounts);
                validateBasket(data);
                updateSwellPointsContainer(data);
                if (data.swellRedemptionID !== '' & data.swellRedemptionID === null) {
                    upadteSwellRedemptionId(data.swellRedemptionID);
                } else {
                    upadteSwellRedemptionId(swellRedemptionId);
                }
            }
            $redemptionContainer.spinner().stop();
            removeRedemptionContainer.spinner().stop();
        },
        error: function (err) {
            $('#error').empty().append(err.responseText);
            removeRedemptionContainer.spinner().stop();
            $redemptionContainer.spinner().stop();
        }
  });
};
