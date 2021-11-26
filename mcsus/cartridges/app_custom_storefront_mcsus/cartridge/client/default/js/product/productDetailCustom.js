function slickHeight() {
    var winWidth = $(window).width();
    var mediumBreakPoint= 767;
    if (winWidth > mediumBreakPoint) {
        var sliderHeight = $('.zoom-modal .slick-slider').height();
        $('.zoom-carousel-slider').css('height', sliderHeight - 60);
    }
}

$( window ).resize(function() {
    slickHeight();
});

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

  $('.zoom-carousel-slider').slick({
      slidesToShow: 6,
      slidesToScroll: 1,
      asNavFor: '.zoom-carousel',
      focusOnSelect: true,
      infinite: false,
      vertical: true,
      verticalSwiping: true,
      arrows: true
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

        $('.test').click(function() {
            if ($('.primary-images .main-carousel img').parents('.slick-active.slick-center').length > 0) {
                $('#zoomProduct').modal('show');
                if ($('.zoom-carousel.slick-slider:visible').length == 0) {
                    setTimeout(function() {
                        $('.zoom-carousel.slick-slider').slick('refresh');
                        $('.zoom-carousel-nav .slick-slider').slick('refresh');
                        slickHeight();
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