// New File added from MSS-1671 v2Cartridge

'use strict';

 /* eslint-disable */
/* global $, document, Clyde, ClydeSitePreferences */

var updateMiniCart = true;
module.exports = function () {
    $('.minicart').on('count:update', function (event, count) {
        if (count && $.isNumeric(count.quantityTotal)) {
            $('.minicart .minicart-quantity').text(count.quantityTotal);
            $('.minicart .minicart-link').attr({
                'aria-label': count.minicartCountOfItems,
                title: count.minicartCountOfItems
            });
        }
    });

    $('.minicart').on('mouseenter focusin touchstart', function () {
        if ($('.search:visible').length === 0) {
            return;
        }
        var url = $('.minicart').data('action-url');
        var count = parseInt($('.minicart .minicart-quantity').text(), 10);

        if (count !== 0 && $('.minicart .popover.show').length === 0) {
            if (!updateMiniCart) {
                $('.minicart .popover').addClass('show');
                return;
            }

            $('.minicart .popover').addClass('show');
            $('.minicart .popover').spinner().start();
            $.get(url, function (data) {
                $('.minicart .popover').empty();
                $('.minicart .popover').append(data);
                updateMiniCart = false;
                $.spinner().stop();
            });
        }
    });
    $('body').on('touchstart click', function (e) {
        if ($('.minicart').has(e.target).length <= 0) {
            $('.minicart .popover').removeClass('show');
        }
    });
    $('.minicart').on('mouseleave focusout', function (event) {
        if ((event.type === 'focusout' && $('.minicart').has(event.target).length > 0)
            || (event.type === 'mouseleave' && $(event.target).is('.minicart .quantity'))
            || $('body').hasClass('modal-open')) {
            event.stopPropagation();
            return;
        }
        $('.minicart .popover').removeClass('show');
    });
    $('body').on('change', '.minicart .quantity', function (event) {
        if ($(this).parents('.bonus-product-line-item').length && $('.cart-page').length) {
            location.reload();
        }
    });
    $('body').on('product:afterAddToCart', function () {
        updateMiniCart = true;
    });
    $('body').on('cart:update', function (event, data) {
        updateMiniCart = true;
        var $clydePriceContainer = $('.clyde-option-price');
        if ($clydePriceContainer.length > 0) {
            var items = data.items;
            if (items) {
                for (var i = 0; i < items.length; i++) {
                    if (items[i].options.length > 0) {
                        var optionItems = items[i].options;
                        for (var j = 0; j < optionItems.length; j++) {
                            var option = optionItems[j];
                            var $clydeUUIDContainer = $('.clyde-option-price[data-uuid="'+ items[i].UUID +'"]');
                            if ($clydeUUIDContainer.data('option-id') === option.optionId) {
                                if ($clydeUUIDContainer.data('value-id') === option.selectedValueId) {
                                    if ($clydeUUIDContainer.data('uuid') === items[i].UUID) {
                                        $clydeUUIDContainer.empty().html(option.price);
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        return false;
    });
};
