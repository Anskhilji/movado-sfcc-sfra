'use strict';

/**
 * re-renders the order totals and the number of items in the cart
 * @param {Object} data - AJAX response from the server
 */
 function updateCartTotals(data) {
    var $noOfItems = $('.number-of-items');
    var $shippingCostSelector = $('.shipping-cost');
    var $totalTaxSelector = $('.tax-total');
    var $grandTotalSelector = $('.grand-total, .cart-total, .minicart-footer .subtotal-payment-summary .grand-total'); 
    var $subTotalSelector = $('.sub-total');
    var $affirmPriceSelector = $('.affirm-as-low-as');
    var $orderDiscountSelector = $('.order-discount'); 

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

    /* Affirm block for refreshing promo message */
    if ($affirmPriceSelector.length > 0) {
        var totalCalculated = data.totals.grandTotal.substr(1).toString().replace(/\,/g, '');

        $affirmPriceSelector.attr('data-amount', (totalCalculated * 100).toFixed());

        if (Resources.AFFIRM_PAYMENT_METHOD_STATUS) {
            affirm.ui.refresh();
        }
    }

    if (data.totals.orderLevelDiscountTotal.value > 0) {
        $orderDiscountSelector.removeClass('hide-order-discount');
        $('.order-discount-total').empty().append('- ' + data.totals.orderLevelDiscountTotal.formatted);
    } else {
        $orderDiscountSelector.addClass('hide-order-discount');
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
 * Updates the Mini-Cart quantity value after the customer has pressed the "Add to Cart" button
 * @param {string} response - ajax response from clicking the add to cart button
 */
 function handlePostCartAdd(response) { 
    $('.minicart').trigger('count:update', response);
    if (typeof setMarketingProductsByAJAX !== 'undefined' && response.marketingProductData !== undefined) {
        setMarketingProductsByAJAX.cartMarketingData = response.marketingProductData;
        if (response.addToCartPerSession == true) {
            setMarketingProductsByAJAX.addToCartPerSession = true;
        } else {
            setMarketingProductsByAJAX.addToCartPerSession = false;
        }
        window.dispatchEvent(setMarketingProductsByAJAX);
    }
    if (typeof setAnalyticsTrackingByAJAX !== 'undefined') {
        if(response.cartAnalyticsTrackingData !== undefined) {
            setAnalyticsTrackingByAJAX.cartAnalyticsTrackingData = response.cartAnalyticsTrackingData;
            window.dispatchEvent(setAnalyticsTrackingByAJAX);
        }
        if(response.addCartGtmArray !== undefined){
            $('body').trigger('addToCart:success', JSON.stringify(response.addCartGtmArray));
        }   
    }
}

$(document).ready(function (params) {
        
    
    $('body').on('miniCart:recommendations', function () {
        $('.cart-recommendations').each(function (event) {
            var $this = $(this);
            if (!$this.is(':empty')) {
                return;
            }
            var url = $this.data('url');
            $.get(url, function (response) {
                $this.html(response.recommendedProductTemplate);
            });
        });
    });

    $('body').on('click', '.mini-cart-show-recommendations', function() {
        var $this = $(this);
        $this.addClass('d-none');
        $this.siblings('.mini-cart-hide-recommendations').removeClass('d-none');
        var $recommendationContainer = $this.siblings('.mini-cart-recommendations')
        $recommendationContainer.removeClass('d-none');
        if (!$recommendationContainer.hasClass('slick-slider')) {
            $recommendationContainer.slick({
                speed: 300,
                slidesToShow: 1,
                slidesToScroll: 1,      
                arrows: true
            }); 
        }
    });

    $('body').on('click', '.mini-cart-hide-recommendations', function() { 
        var $this = $(this);
        $this.addClass('d-none');
        $this.siblings('.mini-cart-recommendations').addClass('d-none');
        $this.siblings('.mini-cart-show-recommendations').removeClass('d-none');  
    });
    
    $('body').on('click', '.mini-cart-add-to-cart', function (e) {   
        e.preventDefault();
        $.spinner().start();
        var $this = $(this);
        var url = $this.data('url');
        var pid = $this.data('pid');
        var form = {
            pid: pid,
            quantity: 1,
            isCartRecommendation: true
            };

        $.ajax({
            url: url,
            data: form,
            method: "POST",
            success: function (response) {
                if (response.error) {
                    $.spinner().stop();
                    return;
                }
                var $quantitySelector = $('.quantity-select[data-pid="' + pid + '"]');
                if ($quantitySelector.length > 0) { 
                    var $quantity = parseInt($quantitySelector.val());
                    $quantity = $quantity + 1;
                    $quantitySelector.val($quantity);
                } else {
                    $('.mini-cart-data .product-summary').append(response.recommendedProductCardHtml);
                }
                updateCartTotals(response.cart); 
                handlePostCartAdd(response); 
                $.spinner().stop();
            },
            error: function() {
                $.spinner().stop();
            },
            complete: function () {
                $('body').trigger('miniCart:recommendations');
            }
        });
    });
});