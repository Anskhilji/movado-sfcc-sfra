'use strict';

$('.product-tile-redesign .swatches').slick({
    infinite: true,
    speed: 300,
    slidesToShow: 5,
    slidesToScroll: 1,
    dots: false,
    arrows: true,
    autoplay: false,
    responsive: [
        {
            breakpoint: 544,
            settings: {
                slidesToShow: 3,
            }
        },
    ]
});