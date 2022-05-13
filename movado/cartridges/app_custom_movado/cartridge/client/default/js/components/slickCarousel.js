'use strict';

var $body = $('body');

// Initialize the carousel present on the page
var initCarousel = function ($container) {
    var $parent = $container || $body;
    $parent.find('.js-carousel').each(function () {
        var $carousel = $(this);
        var $config = $carousel.data() && $carousel.data().carouselConfig || false;
        if ($config && ($config != undefined || $config != '')) {
            $carousel.slick($config);
            $carousel.show();
            if ($carousel.hasClass('banner-carousel')) {
                $carousel.on('afterChange', function () {
                    if ($carousel.slick('slickCurrentSlide') === 0) {
                        $carousel.slick('slickPause');
                    }
                });
            }
        }
    });
};

$('.accordion-ob-box .pdp-accordion-ob-header').on('click', function(){
    $('.accordion-ob-box .js-carousel.cs-carousel').slick('refresh');
});

module.exports = {
    initCarousel: initCarousel
};
