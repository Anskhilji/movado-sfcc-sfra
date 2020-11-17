'use strict'

var processInclude = require('base/util');
processInclude(require('mvmt/product/base'));

$(document).ready(function() {
    slickCarousel();
});

function slickCarousel() {
    if (document.readyState === 'complete') {
        var carouselConfigs;
        $('.carousel-component').each(function() {
            carouselConfigs = $(this).parents('.cs-carousel-wrapper').data('carousel-config');
            $(this).slick(carouselConfigs);
            $(this).show();
            $(window).trigger('resize');
        });
    } else {
        setTimeout(() => {
            slickCarousel();
        }, 500);
    }
}