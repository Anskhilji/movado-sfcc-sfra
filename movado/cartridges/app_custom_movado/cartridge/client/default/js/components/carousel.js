'use strict';

(function ($, $window) {
    // Initialize the carousel present on the page
    $('.js-carousel').each(function () {
        var $carousel = $(this);
        var config = $carousel.data() && $carousel.data().carouselConfig || {};
        $carousel.slick(config);
        $carousel.show();
        if ($carousel.hasClass('banner-carousel')) {
            $carousel.on('afterChange', function (event, slick, currentSlide, nextSlide) {
                var item_length = $('.js-carousel > div').length - 1;
                if ($carousel.slick('slickCurrentSlide') === 0) {
                    $carousel.slick('slickPause');
                }
            });
        }
    });
}(jQuery, $(window)));
