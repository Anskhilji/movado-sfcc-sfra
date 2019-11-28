'use strict';

$(function() {
    //----- OPEN
    $('.pdp-v-one [pd-popup-open]').on('click', function(e) {
        var targeted_popup_class = $(this).attr('pd-popup-open');
        $('[pd-popup="' + targeted_popup_class + '"]').fadeIn(100);
        $('.prices-add-to-cart-actions').addClass('extra-z-index');
        e.preventDefault();
    });

    //----- CLOSE
    $('.pdp-v-one [pd-popup-close]').on('click', function(e) {
        var targeted_popup_class = jQuery(this).attr('pd-popup-close');
        $('[pd-popup="' + targeted_popup_class + '"]').fadeOut(200);
        $(".prices-add-to-cart-actions").removeClass('extra-z-index');
        e.preventDefault();
    });

    $('.pdp-v-one .engraving-form .popup-action-btns .save').on('click', function() {
        setTimeout(function() { 
            var getText=$.trim($('.pdp-v-one .engraving-form .text-area .engraving-input.valid').val());
            var showText = getText.replace("/<br\s*\/?>/mg","\n");

            if(showText == undefined || showText == "") {
                $('.pdp-v-one .engraved-text').text("");
            } else {
                $('.pdp-v-one .engraved-text').text(showText);
                $('.pdp-v-one .engraving-form .text-on-watch pre').text(showText);
            }
        }, 300);
    });

    $('.pdp-v-one .debossing-form .popup-action-btns .save').on('click', function() {
    	var a = $.trim($('.pdp-v-one .debossing-form .text-area .debossing-input.valid').val());
    	console.log(a);
        setTimeout(function() { 
            var debossingtext=$.trim($('.pdp-v-one .debossing-form .text-area .debossing-input.valid').val());
            console.log(debossingtext);
            if(debossingtext == undefined || debossingtext == "") {
                $('.pdp-v-one .debossing-text').text("");
            } else {
                $('.pdp-v-one .debossing-text').text(debossingtext);
                $('.pdp-v-one .debossing-form .text-on-watch span').text(debossingtext);
            }
        }, 300);
    });
});

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

  $('.primary-images .slick-slider img').click(function() {
      $('#zoomProduct').modal('show');

      setTimeout(function(){
          $('.slick-slider').resize();
          slickHeight();
      }, 100);
  });
});

setTimeout(function(){
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
}, 100);

