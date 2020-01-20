'use strict';

var cart = require('movado/cart/cart');

module.exports = function () {
    cart();

    /**
     * This function is override from movado and it is used to show miniCart on the click event.
     * if miniCart is showed then it will used to hide the mini cart.
     */
    $('.minicart').off('mouseenter focusin touchstart').on('click touchstart', function () {
        event.preventDefault();
        if ($('.search:visible').length === 0) {
            return;
        }
        var url = $('.minicart').data('action-url');
        var count = parseInt($('.minicart .minicart-quantity').text(), 10);

        if (count !== 0 && $('.minicart .popover.show').length === 0) {
            $('.minicart .popover').addClass('show');
            $('.minicart .popover').spinner().start();
            $.get(url, function (data) {
                $('.minicart .popover').empty();
                $('.minicart .popover').append(data);
                $.spinner().stop();
            });
        } else {
            $('.minicart .popover').empty();
            $('.minicart .popover').removeClass('show');
        }
    });

    $('.minicart').off('mouseleave focusout').on('mouseleave focusout', function (event) {
            event.preventDefault();
    });

};
