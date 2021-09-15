'use strict';

$(window).scroll(function (event) {
    var scroll = $(window).scrollTop();
    var screenSize= $(window).width();
    var mediumScreenSize = 992;

    if (screenSize != null) {
        if (screenSize <= mediumScreenSize) {
            if (scroll != 0) {
                $('.logo-link img').css("width", "10rem");
            } else {
                $('.logo-link img').css("width", "8rem");
                $('.concord-logo').css("height", "");
            }
        } else {
            $('.header-container .middle .logo-link img').css("width", "10rem");
            $('.checkout-logo .logo-link img').css("width", "9rem");
            $('.concord-logo').css("height", "");
        }
    }

    if (scroll != 0) {
        $('.header-container .middle, .checkout-logo').addClass('concord-logo');
    } else {
        $('.header-container .middle, .checkout-logo').removeClass('concord-logo');
    }
});
