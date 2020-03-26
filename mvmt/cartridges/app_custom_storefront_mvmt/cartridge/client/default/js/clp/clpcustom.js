'use strict';
$('.clp-banner .js-smooth-scroll').click(function() {
    var $scrollTo = $(this).data('target');

    $('html, body').animate({
        scrollTop: $('#'+$scrollTo+'').offset().top - 180
    }, 500);
});

$('.cat-min-nav-container .js-smooth-scroll').click(function() {
    var $scrollTo = $(this).data('target');

    $('html, body').animate({
        scrollTop: $('#'+$scrollTo+'').offset().top - 130
    }, 500);
});