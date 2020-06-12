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
var svgLeft = '<svg width="5px" height="8px" viewBox="0 0 9 13" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><g id="Symbols" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd"><g id="Press-Slider" transform="translate(-29.000000, -140.000000)" fill="#2B2B2B"><g id="left-arrow-white"><polygon transform="translate(33.454545, 147.000000) scale(-1, 1) translate(-33.454545, -147.000000) " points="30.6855037 140 29 141.633333 34.5380835 147 29 152.366667 30.6855037 154 37.9090909 147"></polygon></g></g></g></svg>';
var svgRight = '<svg width="5px" height="8px" viewBox="0 0 9 13" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><g id="Symbols" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd"><g id="Press-Slider" transform="translate(-1360.000000, -140.000000)" fill="#2B2B2B"><g id="right-arrow-white"><polygon points="1361.6855 140 1360 141.633333 1365.53808 147 1360 152.366667 1361.6855 154 1368.90909 147"></polygon></g></g></g></svg>';

$('.cs-bottom-carousel-wrapper .slick-arrow').empty();
$('.cs-bottom-carousel-wrapper .slick-prev').addClass('fa fa-chevron-left');
$('.cs-bottom-carousel-wrapper .slick-next').addClass('fa fa-chevron-right');
$('.strap-carousel .slick-prev, .strap-carousel .slick-next').text(Resources.SLICK_BUTTON_MORE_STYLE);
$('.strap-carousel .slick-prev').prepend(svgLeft);
$('.strap-carousel .slick-next').append(svgRight);
