'use strict';

$(document).ready(function() {
  slickHeight();
  $('.carousel-pagination').slick({
    slidesToShow: 6,
    slidesToScroll: 1,
    asNavFor: '.primary-images .main-carousel',
    focusOnSelect: true,
    infinite: false,
    vertical: true,
    verticalSwiping: true,
    arrows: true,
    responsive: [
      {
        breakpoint: 992,
        settings: {
          vertical: false,
          verticalSwiping: false,
        }
      },
    ]
});
  $('.primary-images .main-carousel').slick({
      slidesToShow: 1,
      slidesToScroll: 1,
      dots: false,
      arrows:false,
      focusOnSelect: true,
      asNavFor: '.carousel-pagination',
      responsive: [
        {
          breakpoint: 768,
          settings: {
            slidesToShow: 1,
            slidesToScroll: 1,
            arrows: false,
            dots:true
          }
        },
    ]
  });
});

