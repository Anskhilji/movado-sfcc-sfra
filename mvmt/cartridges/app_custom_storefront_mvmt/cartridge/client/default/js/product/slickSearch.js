'use strict';

$('.product-tile-redesign .swatches').slick({
    infinite: true,
    speed: 300,
    slidesToShow: 5,
    slidesToScroll: 1,
    dots: false,
    arrows: true,
    autoplay: false,
    prevArrow: '<button type="button" data-role="none" class="slick-prev slick-arrow" aria-label="Previous" tabindex="0" role="button"><i class="fa fa-chevron-left" aria-hidden="true"></i></button>',
    nextArrow: '<button type="button" data-role="none" class="slick-next slick-arrow" aria-label="Next" tabindex="0" role="button"><i class="fa fa-chevron-right" aria-hidden="true"></i></button>',
    responsive: [
        {
            breakpoint: 544,
            settings: {
                slidesToShow: 3,
            }
        },
    ]
});
