'use strict';

var cart = require('../cart/cart');

module.exports = function () {
    cart();

    $('.minicart').off('mouseenter focusin');

    /**
     * This function is override from movado and it is used to show miniCart on the click event.
     */
    $('body').off('click touchstart').on('click touchstart', '.minicart', function (event) {
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

    $('.minicart').on('click touchstart', '#close-mini-cart', function (event) {
        $('.minicart .popover').removeClass('show');
        $('.minicart .popover').empty();
        $('#overlay').removeClass('footer-form-overlay');
    });

    $('.minicart').off('mouseleave focusout').on('mouseleave focusout', function (event) {
        event.preventDefault();
    });

};
