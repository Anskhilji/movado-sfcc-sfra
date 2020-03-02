'use strict';

$(function() {
    //----- OPEN
    $('.pdp-v-one [pd-popup-open]').on('click', function(e) {
        e.stopPropagation();
        var targeted_popup_class = $(this).attr('pd-popup-open');
        $('[pd-popup="' + targeted_popup_class + '"]').fadeIn(100).addClass('popup-opened');
        $('.prices-add-to-cart-actions').addClass('extra-z-index');
        $('body, html').addClass('no-overflow');
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
                $('.cancel').addClass('submitted');
                $('.cancel').attr('form', 'embossingForm');
                $('.cancel').attr('type', 'submit');
            }
        }, 300);
    });

    $('.pdp-v-one .debossing-form .popup-action-btns .save').on('click', function() {
    	var a = $.trim($('.pdp-v-one .debossing-form .text-area .debossing-input.valid').val());
        setTimeout(function() { 
            var debossingtext=$.trim($('.pdp-v-one .debossing-form .text-area .debossing-input.valid').val());
            console.log(debossingtext);
            if(debossingtext == undefined || debossingtext == "") {
                $('.pdp-v-one .debossing-text').text("");
            } else {
                $('.pdp-v-one .debossing-text').text(debossingtext);
                $('.pdp-v-one .debossing-form .text-on-watch span').text(debossingtext);
                $('.cancel').addClass('submitted');
                $('.cancel').attr('form', 'embossingForm');
                $('.cancel').attr('type', 'submit');
            }
        }, 100);
    });

    $('.pdp-v-one .debossing-cancel').on('click', function(e) {
        if ($('.pdp-v-one .debossing-text').text() === '') {
            e.stopPropagation();
            $('.pdp-v-one .debossing-form .text-area .debossing-input').val('');
            $(".prices-add-to-cart-actions").removeClass('extra-z-index');
            $('body, html').removeClass('no-overflow');
            $('body').removeClass('no-scroll');
            $('.popup-opened').hide();
            e.preventDefault();
            return;
        } else {
            $('.cancel').removeClass('submitted');
            $('.cancel').removeAttr('form');
            $('.cancel').removeAttr('type');
        }

        $('.pdp-v-one .debossing-text').text('');
        $('.pdp-v-one .debossing-form .text-on-watch span').text('');
        $('.pdp-v-one .debossing-form .text-area .debossing-input').val('');
        var targeted_popup_class = jQuery(this).attr('pd-popup-close');
        $('[pd-popup="' + targeted_popup_class + '"]').fadeOut(200).removeClass('popup-opened');
        $('body, html').removeClass('no-overflow');
        $('body').removeClass('no-scroll');
        $('.popup-opened').hide();
    });

    $('.pdp-v-one .engraving-cancel').on('click', function(e) {
        if ($('.pdp-v-one .engraved-text').text() === '') {
            e.stopPropagation();
            $('.pdp-v-one .debossing-form .text-area .engraving-input').val('');
            $(".prices-add-to-cart-actions").removeClass('extra-z-index');
            $('body, html').removeClass('no-overflow');
            $('body').removeClass('no-scroll');
            $('.popup-opened').hide();
            e.preventDefault();
            return;
        } else {
            $('.cancel').removeClass('submitted');
            $('.cancel').removeAttr('form');
            $('.cancel').removeAttr('type');
        }

        $('.pdp-v-one .engraved-text').text('');
        $('.pdp-v-one .engraving-form .text-on-watch pre').text('');
        $('.pdp-v-one .debossing-form .text-area .engraving-input').val('');
        var targeted_popup_class = jQuery(this).attr('pd-popup-close');
        $('[pd-popup="' + targeted_popup_class + '"]').fadeOut(200).removeClass('popup-opened');
        $('body, html').removeClass('no-overflow');
        $('body').removeClass('no-scroll');
        $('.popup-opened').hide();
    });

    //----- CLOSE
    $('.pdp-v-one .close-option-popup').on('click', function(e) {
        e.stopPropagation();
        var targeted_popup_class = jQuery(this).attr('pd-popup-close');
        $('[pd-popup="' + targeted_popup_class + '"]').fadeOut(200).removeClass('popup-opened');
        $(".prices-add-to-cart-actions").removeClass('extra-z-index');
        $('body, html').removeClass('no-overflow');
        $('.popup-opened').hide();
        e.preventDefault();
        
    });

});

$(document).mouseup(function(e) {
    var container = $(".custom-options .popup .popup-inner");
    if (!container.is(e.target) && container.has(e.target).length === 0) {
        $(".custom-options .popup-opened").fadeOut(200);
        var targeted_popup_class = jQuery(this).attr('pd-popup-close');
        $('[pd-popup="' + targeted_popup_class + '"]').fadeOut(200).removeClass('popup-opened');
        $(".prices-add-to-cart-actions").removeClass('extra-z-index');
        $('body, html').removeClass('no-overflow');
        $('body').removeClass('no-scroll');
        e.preventDefault();
    }
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

  $(window).on("load resize", function() {
    if ($(window).width() > 786) {
        $('.primary-images .main-carousel img').click(function() {
            $('#zoomProduct').modal('show');
            $('.slick-slider').slick('refresh');
               setTimeout(function(){
               $('.slick-slider').resize();
               slickHeight();
            }, 100);
        });
    }
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

