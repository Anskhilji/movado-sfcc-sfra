'use strict';

(function () {
    var debounce = require('lodash/debounce');

    var spaceBelowBodyOnFixedButton = function () {
        var isXS = matchMedia('screen and (max-width: 543.08px)').matches;
        var $body = $('body');
        var $addToCartButton = $('.prices-add-to-cart-actions');
        var $checkoutButton = $('.checkout-button-wrapper');
        var $redesignCheckoutButton = $('.sticky-container-redesign').height();
        var fixedButtonHeight = $addToCartButton.length ? $addToCartButton.height() : $checkoutButton.height();
        fixedButtonHeight = $redesignCheckoutButton ? $redesignCheckoutButton : fixedButtonHeight; 
        if (isXS && fixedButtonHeight) {
            $body.css('margin-bottom', fixedButtonHeight);
        } else {
            $body.removeAttr('style');
        }
    };

    // On Page Load
    spaceBelowBodyOnFixedButton();

    // On screen resize and orinentation change
    $(window).on('resize orientationchange', debounce(function () {
        spaceBelowBodyOnFixedButton();
    }, 300));
}());
