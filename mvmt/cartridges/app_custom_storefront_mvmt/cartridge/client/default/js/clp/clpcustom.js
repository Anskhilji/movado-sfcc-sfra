'use strict';
$(".js-smooth-scroll").click(function() {
    var $scrollTo = $(this).data('target');

    $('html, body').animate({
        scrollTop: $('.'+$scrollTo+'').offset().top - 100
    }, 500);
});