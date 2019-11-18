'use strict';

$('.carousel-nav').slick({
    slidesToShow: 5,
    slidesToScroll: 1,
    asNavFor: '.primary-images .main-carousel',
    dots: false,
    centerMode: true,
    focusOnSelect: true,
});