'use strict';
$('.linked-products').slick({
    slidesToShow: 3,
    slidesToScroll: 1,
    focusOnSelect: true,
    infinite: false,
    dots: false,
    arrows: true,
});

$(function() {
    var $header = $('header').height();
    var $productdetail = $('.product-detail').height();
    var $stickybar = $('.sticky-bar');
    $(window).scroll(function() {
        var $scroll = $(window).scrollTop();

        if ($scroll >= $productdetail) {
            $stickybar.css({
                top: $header +'px'
            });
        }else {
            $stickybar.css('top','-45px')
        }
    });
});

$('.carousel-pagination').slick({
    slidesToShow: 6,
    slidesToScroll: 1,
    asNavFor: '.primary-images .main-carousel',
    focusOnSelect: true,
    infinite: false,
    vertical: true,
    verticalSwiping: true,
    arrows: false,
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

