'use strict';

$(window).scroll(function (event) {
    var scroll = $(window).scrollTop();
    var screenSize= $(window).width();
    var mediumScreenSize = 992;

    if (screenSize != null) {
        if (screenSize <= mediumScreenSize) {
            if (scroll != 0) {
                $('.logo-link > img').css("width", "10rem");
                $('.ebel-logo').css("height", "1.5rem");
            } else {
                $('.logo-link > img').css("width", "8rem");
                $('.ebel-logo').css("height", "");
            }
        } else {
            $('.logo-link > img').css("width", "10rem");
            $('.ebel-logo').css("height", "");
        }
    }

    if (scroll != 0) {
        $('.logo-link > img').addClass('ebel-logo');
    } else {
        $('.logo-link > img').removeClass('ebel-logo');
    }
});
