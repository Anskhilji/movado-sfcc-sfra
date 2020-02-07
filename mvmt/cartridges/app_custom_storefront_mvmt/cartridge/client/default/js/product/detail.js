'use strict';
var movadoDetail = require('movado/product/detail');

module.exports = {

    gallerySlider: function () {
        $('.gallery-slider').slick({
            dots: true,
            infinite: true,
            speed: 300,
            slidesToShow: 4,
            slidesToScroll: 1,
            dots: false,
            arrows: true,
            autoplay: true,
            responsive: [
                {
                    breakpoint: 768,
                    settings: {
                        slidesToShow: 2,
                    }
                },
            ]
        });
    },
};
