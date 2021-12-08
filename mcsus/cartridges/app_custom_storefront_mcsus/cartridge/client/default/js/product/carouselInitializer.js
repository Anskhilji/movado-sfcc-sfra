$(document).ready(function() {

    $('.carousel-nav').slick({
        slidesToShow: 5,
        slidesToScroll: 1,
        asNavFor: '.primary-images .main-carousel',
        dots: false,
        centerMode: true,
        focusOnSelect: true,
    });

    $('.zoom-carousel').slick({
        slidesToShow: 1,
        slidesToScroll: 1,
        dots: false,
        arrows:true,
        focusOnSelect: true,
        asNavFor: '.zoom-carousel-slider',
        responsive: [
            {
            breakpoint: 769,
            settings: {
                slidesToShow: 1,
                slidesToScroll: 1,
                arrows: false,
                dots:false,
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
            breakpoint: 768,
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
    $(window).on("load resize", function () {
        var winWidth = $(window).width();
        var mediumBreakPoint= 767;

        $('.carousel-zoom-icon').click(function() {
            if ($('.primary-images .main-carousel img').parents('.slick-active.slick-center').length > 0) {
                $('#zoomProduct').modal('show');
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
        });
        
    });
    // Custom End: MSS-1564 zoom carousel popup active on click after zoom icon on pdp
});