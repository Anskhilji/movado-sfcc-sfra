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
            arrows: true,
            autoplay: true,
            responsive: [
                {
                    breakpoint: 4000,
                    settings: {
                        slidesToShow: 10,
                    }
                },
            ]
        });
    },
};
