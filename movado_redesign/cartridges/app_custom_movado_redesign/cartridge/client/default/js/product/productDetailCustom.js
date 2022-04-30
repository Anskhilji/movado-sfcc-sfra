'use strict';
var mediumWidth = 992;
var $zoomSlick = true;

function copyText() {
    var $text = $('.promotions .promo-icon .icon').text();
    $('.promotions .showtooltip').text($text);
}

copyText();

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
                $('.engraving-cancel').addClass('submitted');
                $('.engraving-cancel').attr('form', 'embossingForm');
                $('.engraving-cancel').attr('type', 'submit');
            }
        }, 300);
    });

    $('.pdp-v-one .debossing-form .popup-action-btns .save').on('click', function() {
        var a = $.trim($('.pdp-v-one .debossing-input.valid').val());
        setTimeout(function() {
            var debossingtext=$.trim($('.pdp-v-one .debossing-form .text-area .debossing-input.valid').val());
            console.log(debossingtext);
            if(debossingtext == undefined || debossingtext == "") {
                $('.pdp-v-one .debossing-text').text("");
            } else {
                $('.pdp-v-one .debossing-text').text(debossingtext);
                $('.pdp-v-one .debossing-form .text-on-watch span').text(debossingtext);
                $('.debossing-cancel').addClass('submitted');
                $('.debossing-cancel').attr('form', 'embossingForm');
                $('.debossing-cancel').attr('type', 'submit');
            }
        }, 100);
    });

    $('.pdp-v-one .debossing-cancel').on('click', function(e) {
        if ($('.pdp-v-one .debossing-text').text() === '') {
            e.stopPropagation();
            $('.pdp-v-one .debossing-input').val('');
            $(".prices-add-to-cart-actions").removeClass('extra-z-index');
            $('body, html').removeClass('no-overflow');
            $('body').removeClass('no-scroll');
            $('.popup-opened').hide();
            e.preventDefault();
            return;
        } else {
            $('.debossing-cancel').removeClass('submitted');
            $('.debossing-cancel').removeAttr('form');
            $('.debossing-cancel').removeAttr('type');
        }

        $('.pdp-v-one .debossing-text').text('');
        $('.pdp-v-one .debossing-form .text-on-watch span').text('');
        $('.pdp-v-one .debossing-input').val('');
        var targeted_popup_class = jQuery(this).attr('pd-popup-close');
        $('[pd-popup="' + targeted_popup_class + '"]').fadeOut(200).removeClass('popup-opened');
        $('body, html').removeClass('no-overflow');
        $('body').removeClass('no-scroll');
        $('.popup-opened').hide();
    });

    $('.pdp-v-one .engraving-cancel').on('click', function(e) {
        if ($('.pdp-v-one .engraved-text').text() === '') {
            e.stopPropagation();
            $('.pdp-v-one .engraving-input').val('');
            $(".prices-add-to-cart-actions").removeClass('extra-z-index');
            $('body, html').removeClass('no-overflow');
            $('body').removeClass('no-scroll');
            $('.popup-opened').hide();
            e.preventDefault();
            return;
        } else {
            $('.engraving-cancel').removeClass('submitted');
            $('.engraving-cancel').removeAttr('form');
            $('.engraving-cancel').removeAttr('type');
        }

        $('.pdp-v-one .engraved-text').text('');
        $('.pdp-v-one .engraving-form .text-on-watch pre').text('');
        $('.pdp-v-one .engraving-input').val('');
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

    $('.promotions button').bind('click', function(e) {
        e.stopPropagation();
        $(this).parents('.custom-tooltip').hide();
        $('.showtooltip').removeClass('active');
    });

    $('.promotions .showtooltip').on('click', function(e) {
        var $windowWidth = $(window).width();

        if ($windowWidth < mediumWidth) {
            $(this).addClass('active');
            $('.custom-tooltip').show();
        }
    });


    $('.promotions .detail-btn').hover(

        function () {
            var $windowWidth = $(window).width();

            if ($windowWidth > mediumWidth){
                $('.showtooltip').addClass('active');
                $('.custom-tooltip').show();
            }
        },

        function () {
            var $windowWidth = $(window).width();

            if ($windowWidth > mediumWidth){
                $('.showtooltip').removeClass('active');
                $('.custom-tooltip').hide();
            }
        }
    );


    $('.smartgiftpopup .close-smart-gift').bind('click', function(e) {
        e.stopPropagation();
        $(this).parents('.custom-tooltipsmart').hide();
        $('.showtooltipSmart').removeClass('active');
    });


    $('.smartgiftpopup .smartgift-btn-popup').on('click', function(e) {
        var $windowWidth = $(window).width();

        if ($windowWidth < mediumWidth) {
            $(this).addClass('active');
            $('.custom-tooltipsmart').show();
        }
    });


    $('.smartgiftpopup .smartgift-btn-popup').hover(

        function () {
            var $windowWidth = $(window).width();

            if ($windowWidth > mediumWidth){
                $('.showtooltipSmart').addClass('active');
                $('.custom-tooltipsmart').show();
            }
        },

        function () {
            var $windowWidth = $(window).width();

            if ($windowWidth > mediumWidth){
                $('.showtooltipSmart').removeClass('active');
                $('.custom-tooltipsmart').hide();
            }
        }
    );




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

    $(window).on("load resize", function () {
        var winWidth = $(window).width();
        var mediumBreakPoint= 767;

        $('.primary-images .main-carousel img').click(function() {
            if ($(this).parents('.slick-active.slick-center').length > 0) {
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
    ratingRedesign();
    
    // custom end: MSS-1772 pdp sticky ATC
    function loadCartButtonOnScroll() {
        if ($(window).width() < 544) {
            var cartWishListObserver = document.querySelector('.cart-wishlist-observer');
            var initialCoords = cartWishListObserver.getBoundingClientRect();
            
            window.addEventListener('scroll', function () {
                if (this.window.scrollY < initialCoords.top) {
                    $('.cart-sticky-wrapper-btn').addClass('d-none');
                    $('.cart-sticky-wrapper-btn').removeClass('d-block');
                    setTimeout(() => {
                        $('.cart-sticky-wrapper-btn').css('transform','translateY(150px)');
                    }, 500);
                } else {
                    $('.cart-sticky-wrapper-btn').addClass('d-block');
                    $('.cart-sticky-wrapper-btn').removeClass('d-none');
                    setTimeout(() => {
                        $('.cart-sticky-wrapper-btn').css('transform','translateY(0px)');
                    }, 500);
                }
            });
        }
    }

    function loadCartButtonTouchMove() {
        if ($(window).width() < 544) {
            var cartWishListObserver = document.querySelector('.cart-wishlist-observer');
            var initialCoords = cartWishListObserver.getBoundingClientRect();
            window.addEventListener('touchmove', function () {
                if (this.window.scrollY < initialCoords.top) {
                    $('.cart-sticky-wrapper-btn').addClass('d-none');
                    $('.cart-sticky-wrapper-btn').removeClass('d-block');
                    setTimeout(() => {
                        $('.cart-sticky-wrapper-btn').css('transform','translateY(150px)');
                    }, 500);
                } else {
                    $('.cart-sticky-wrapper-btn').addClass('d-block');
                    $('.cart-sticky-wrapper-btn').removeClass('d-none');
                    setTimeout(() => {
                        $('.cart-sticky-wrapper-btn').css('transform','translateY(0px)');
                    }, 500);
                }
            });
        }
    }
    loadCartButtonOnScroll();
    loadCartButtonTouchMove();
    // custom end: MSS-1772 pdp sticky ATC
});

function ratingRedesign() {
    if (document.readyState == "interactive") {
        if ($('.ratings').children().length == 0){
            $('.ratings').addClass('ratings-redesign');
        }
    }
}
