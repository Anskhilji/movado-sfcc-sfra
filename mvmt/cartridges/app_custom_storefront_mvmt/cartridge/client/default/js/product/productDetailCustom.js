'use strict';

$(document).ready(function() {
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
            breakpoint: 544,
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

$('.main-carousel .carousel-tile').zoom({
    onZoomIn:function(){
        $('.normal-zoom, .carousel-pagination').addClass('opacity-0');
        $('.zoom-img').addClass('zoomed-img');
        $('.main-carousel').addClass('p-0');
        $('.zoom-out, .main-carousel .carousel-tile').addClass('active');
    },

    onZoomOut:function(){
        $('.normal-zoom, .carousel-pagination').removeClass('opacity-0');
        $('.zoom-img').removeClass('zoomed-img');
        $('.main-carousel').removeClass('pl-0');
        $('.zoom-out, .main-carousel .carousel-tile').removeClass('active');
    }
});

