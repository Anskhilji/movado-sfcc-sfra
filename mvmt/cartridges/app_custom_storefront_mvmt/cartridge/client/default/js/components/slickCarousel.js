'use strict';

var $body = $('body');

// Initialize the carousel present on the page
var initCarousel = function ($container) {
    var $parent = $container || $body;
    $parent.find('.js-carousel').each(function () {
        var $carousel = $(this);
        var config = $carousel.data() && $carousel.data().carouselConfig || {};
        $carousel.parent().find('.prev-home').addClass(config.prevArrow ? config.prevArrow.replace('.','') : '');
        $carousel.parent().find('.next-home').addClass(config.nextArrow ? config.nextArrow.replace('.','') : '');
        $carousel.not('.slick-initialized').slick(config);
        $carousel.show();
        if ($carousel.hasClass('banner-carousel')) {
            $carousel.on('afterChange', function () {
                if ($carousel.slick('slickCurrentSlide') === 0) {
                    $carousel.slick('slickPause');
                }
            });
        }
    });
};

module.exports = {
    initCarousel: initCarousel
};