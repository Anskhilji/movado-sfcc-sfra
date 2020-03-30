'use strict';
var movadoDetail = require('movado/product/detail');

module.exports = {

    clickEvents: function () {

        $('.pdp-tabs-nav button').on('click', function(e) {
            var thistab = $(this).data('tab');
            $('.'+thistab+'').addClass('active').siblings().removeClass('active');
            $(this).addClass('active').siblings().removeClass('active');

            if ($(window).width() < 786) {
                $('.pdp-mobile-accordian').removeClass('active');
                $(this).find('.pdp-mobile-accordian').addBack('active')
            }

            setTimeout(function(){
                $('.'+thistab+'').addClass('fadeIn').siblings().removeClass('fadeIn');
             }, 300);
        });

        $('.pdp-mobile-accordian').on('click', function(e) {
            $(this).toggleClass('active').siblings().slideToggle();
        });

        $('.call-see-fit-popup').on('click', function(e) {
            $('.size-guide, #overlay').addClass('active');
        });

        $('.size-guide-close').on('click', function(e) {
            $('.size-guide, #overlay').removeClass('active');
        });
    },

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
            prevArrow: '<button type="button" data-role="none" class="slick-prev slick-arrow" aria-label="Previous" tabindex="0" role="button"><i class="fa fa-chevron-left" aria-hidden="true"></i></button>',
            nextArrow: '<button type="button" data-role="none" class="slick-next slick-arrow" aria-label="Next" tabindex="0" role="button"><i class="fa fa-chevron-right" aria-hidden="true"></i></button>',
            responsive: [
                {
                    breakpoint: 768,
                    settings: {
                        slidesToShow: 2,
                    }
                },
                {
                    breakpoint: 544,
                    settings: {
                        slidesToShow: 1,
                    }
                },
            ]
        });
    },

    linkedSlider: function () {
        $('.linked-products').slick({
            slidesToShow: 3,
            slidesToScroll: 1,
            focusOnSelect: true,
            infinite: false,
            dots: false,
            arrows: true,
        });
    },

    stickybar: function () {
        $(function() {
            var $header = $('.header-menu-wrapper').height();
            var $productdetail = $('.product-detail').height();
            var $stickybar = $('.sticky-bar');
            $(window).scroll(function() {
                var $scroll = $(window).scrollTop();
                console.log('w')
                if ($scroll >= $productdetail) {
                    $stickybar.css('top', $header +'px');
                } else {
                    $stickybar.css('top','-45px');
                }
            });
        });
    },

    carouselPagination: function () {
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
    },

    zoomFeature: function () {
        $('.main-carousel .carousel-tile').zoom({
            onZoomIn:function(){
                $('.normal-zoom, .carousel-pagination').addClass('opacity-0');
                $('.zoom-img').addClass('zoomed-img');
                $('.main-carousel').addClass('pl-0');
                $('.zoom-out, .main-carousel .carousel-tile').addClass('active');
            },

            onZoomOut:function(){
                $('.normal-zoom, .carousel-pagination').removeClass('opacity-0');
                $('.zoom-img').removeClass('zoomed-img');
                $('.main-carousel').removeClass('pl-0');
                $('.zoom-out, .main-carousel .carousel-tile').removeClass('active');
            }
        });
    },

    primarySlider: function () {

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
    },
};
