$(document).ready(function() {
    var winWidth = $(window).width();
    var mediumBreakPoint= 767;

    function initializeCarousel(winWidth, isResize) {
        if ($('.primary-images .main-carousel img').parents('.slick-active.slick-center').length > 0) {
            if (!isResize) {
              $("#zoomProduct").modal("show");
            }
            if ($('.zoom-carousel.slick-slider:visible').length == 0) {
                setTimeout(function() {
                    $('.zoom-carousel.slick-slider').slick('refresh');
                    $('.zoom-carousel-slider.slick-slider').slick('refresh');
                    if (winWidth > mediumBreakPoint) {
                        zoom();
                    }
                }, 300);
            }
        }
    }

    $('.carousel-nav').slick({
        slidesToShow: 5,
        slidesToScroll: 1,
        asNavFor: '.primary-images .main-carousel',
        dots: false,
        centerMode: true,
        focusOnSelect: true,
    });
    $('.carousel-nav-redesign').slick({
        slidesToShow: 3,
        slidesToScroll: 1,
        asNavFor: '.primary-images .main-carousel',
        dots: true,
        arrows:false,
        focusOnSelect: true,
        infinite: true,
        responsive: [
            {
                breakpoint: 544,
                settings: {
                    dots: false,
                }
            },
        ]
    });
    
    $('.carousel-nav-set-product').slick({
        slidesToShow: 4,
        slidesToScroll: 1,
        asNavFor: '.primary-images .main-carousel',
        dots: false,
        arrows:false,
        focusOnSelect: true,
        infinite: true,
        responsive: [
            {
                breakpoint: 1200,
                settings: {
                    dots: false,
                    slidesToShow: 3,
                }
            },
            {
                breakpoint: 992,
                settings: {
                    dots: false,
                    slidesToShow: 2,
                }
            },
            {
                breakpoint: 545,
                settings: {
                    dots: false,
                }
            },
        ]
    });

    $('.zoom-carousel').slick({
        slidesToShow: 1,
        slidesToScroll: 1,
        dots: false,
        arrows:true,
        focusOnSelect: true,
        asNavFor: '.zoom-carousel-slider',
        swipe: false,
        responsive: [
            {
            breakpoint: 769,
            settings: {
                slidesToShow: 1,
                slidesToScroll: 1,
                arrows: false,
                dots:false,
                swipe: true,
            }
            },
        ]
    });

    $('.zoom-carousel-slider').slick({
        slidesToShow: 5,
        slidesToScroll: 1,
        asNavFor: '.zoom-carousel',
        dots: false,
        vertical: true,
        verticalSwiping: true,
        centerMode: true,
        focusOnSelect: true,
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

    function zoom() {
        $('.zoomit').zoom({
            onZoomIn:function(){
                $('.normal-zoom').addClass('opacity-0');
                $('.zoom-img').addClass('zoomed-img')
            },

            onZoomOut:function(){
                $('.normal-zoom').removeClass('opacity-0');
                $('.zoom-img').removeClass('zoomed-img')
            }
        });
    }   

    // Custom Start: MSS-1564 zoom carousel popup active on click after zoom icon on pdp
        $(window).on("resize", function () {
            var winWidth = $(window).width();
             initializeCarousel(winWidth, true);
        });

        $('.carousel-zoom-icon').click(function() {
            initializeCarousel(winWidth);
        });
    // Custom End: MSS-1564 zoom carousel popup active on click after zoom icon on pdp
});

// added active class & scroll down on reviews widget
$('.rating-box-redisgn .ratings').on('click', function () {
    $('html, body').animate({
        scrollTop: $('.pdp-bottom-rating').offset().top
    }, 10);
    $('html').css({'scroll-behavior':'smooth'});
});