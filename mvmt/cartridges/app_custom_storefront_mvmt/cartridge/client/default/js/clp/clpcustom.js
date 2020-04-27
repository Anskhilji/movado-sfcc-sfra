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

$('.cs-bottom-carousel-wrapper .slick-arrow').empty();
$('.cs-bottom-carousel-wrapper .slick-prev').addClass('fa fa-chevron-left');
$('.cs-bottom-carousel-wrapper .slick-next').addClass('fa fa-chevron-right');
