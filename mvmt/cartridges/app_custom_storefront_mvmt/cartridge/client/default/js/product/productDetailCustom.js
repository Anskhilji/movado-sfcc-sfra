'use strict';

$(document).ready(function() {
    $('.linked-products').slick({
        slidesToShow: 3,
        slidesToScroll: 1,
        focusOnSelect: true,
        infinite: false,
        dots: false,
        arrows: true
    });
});