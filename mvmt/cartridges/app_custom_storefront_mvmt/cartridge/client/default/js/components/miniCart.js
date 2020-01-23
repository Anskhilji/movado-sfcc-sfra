'use strict';

var cart = require('../cart/cart');

module.exports = function () {
    cart();

    $('.minicart').off('mouseenter focusin');

    /**
    * This function is override from movado and it is used to show miniCart on the click event.
    */
    $('body').off('click touchstart').on('click touchstart', '.minicart', function (event) {
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

    /**
    * This function is used to close the miniCart on the click event.
    */
    $('.minicart').on('click touchstart', '#close-mini-cart', function (event) {
        $('.minicart .popover').removeClass('show');
        $('.minicart .popover').empty();
        $('#overlay').removeClass('footer-form-overlay');
    });

    /**
    * This function is override from movado and it is used to prevent others event.
    */
    $('.minicart').off('mouseleave focusout').on('mouseleave focusout', function (event) {
        event.preventDefault();
    });

};
