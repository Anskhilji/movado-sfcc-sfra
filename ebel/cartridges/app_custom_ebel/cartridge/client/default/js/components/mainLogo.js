'use strict';

$(window).scroll(function (event) {
    var scroll = $(window).scrollTop();
    var screenSize= $(window).width();
    var mediumScreenSize = 992;

    if (screenSize != null) {
        if (screenSize <= mediumScreenSize) {
            if (scroll != 0) {
                $('.logo-link > img').css("width", "9rem");
                $('.ebel-logo').css("height", "1.5rem");
            } else {
                $('.logo-link > img').css("width", "6.875rem");
                $('.ebel-logo').css("height", "");
            }
        } else {
            $('.header-container .middle .logo-link > img').css("width", "9rem");
            $('.checkout-logo .logo-link > img').css("width", "7.5rem");
            $('.ebel-logo').css("height", "");
            if (scroll != 0) {
                $('.header-container .middle .logo-link > img').css("width", "10rem");
                $('.checkout-logo .logo-link > img').css("width", "10rem");
            }
        }
    }

    if (scroll != 0) {
        $('.header-container > .middle, .checkout-logo').addClass('ebel-logo');
    } else {
        $('.header-container > .middle, .checkout-logo').removeClass('ebel-logo');
    }
});
