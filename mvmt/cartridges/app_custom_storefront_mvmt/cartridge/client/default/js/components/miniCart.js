'use strict';

var cart = require('movado/cart/cart');

module.exports = function () {
    cart();

    $('.minicart').off('mouseenter focusin touchstart').on('click touchstart', '#close-mini-cart', function (event) {
        event.preventDefault();
        $('.minicart .popover').removeClass('show');
        $('.minicart .popover').empty();
        $('#overlay').removeClass('footer-form-overlay');
    });

    /**
     * This function is override from movado and it is used to show miniCart on the click event.
     * if miniCart is showed then it will used to hide the mini cart.
     */
    $('.minicart').off('mouseenter focusin touchstart').on('click touchstart', function (event) {
        event.preventDefault();
        if ($('.search:visible').length === 0) {
            return;
        }
        var url = $('.minicart').data('action-url');
        var count = parseInt($('.minicart .minicart-quantity').text());

        if (count !== 0 && $('.minicart .popover.show').length === 0) {
            $.get(url, function (data) {
                $('.minicart .popover').empty();
                $('.minicart .popover').append(data);
                $('#overlay').addClass('footer-form-overlay');
                $('.minicart .popover').addClass('show');
            });
        }
    });

    $('body').off('touchstart click').on('touchstart click', function (event) {
        event.preventDefault();
    });

    $('.minicart').off('mouseleave focusout').on('mouseleave focusout', function (event) {
        event.preventDefault();
    });

};
