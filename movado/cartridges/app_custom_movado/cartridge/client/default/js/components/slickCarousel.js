'use strict';

var $body = $('body');

// Initialize the carousel present on the page
var initCarousel = function ($container) {
    var $parent = $container || $body;
    $parent.find('.js-carousel').each(function () {
        var $carousel = $(this);
        var test1 = $carousel.data();
        console.log(test1);
        var config = $carousel.data() && $carousel.data().carouselConfig || {};
        config = atob(config);
        config = JSON.parse(config);
        console.log(config);
        $carousel.slick(config);  
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
