'use strict';
var mediumWidth = 992;
var $zoomSlick = true;
var $applePayButtonLabel = window.Resources.APPLEPAY_BUTTON_LABEL;
var $googlePayButtonLabel = window.Resources.GOOGLEPAY_BUTTON_LABEL;

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

  $(".swiss-made-list").slick({
      slidesToShow: 4,
      slidesToScroll: 1,
      dots: false,
      arrows: false,  
      responsive: [
          {
          breakpoint: 991,
          settings: {
              slidesToShow: 3,
              slidesToScroll: 1,
              arrows: false,
          },
          },
          {
          breakpoint: 767,
              settings: {
                  slidesToShow: 2,
                  slidesToScroll: 1,
                  arrows: false,
              },
          },
          {
          breakpoint: 544,
              settings: {
                  slidesToShow: 1,
                  slidesToScroll: 1,
                  arrows: false,
              },
          },
      ],
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
            if ($(this).parents('.slick-active.slick-center, .gallery-image .carousel-tile').length > 0) {
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
    if ($(window).width() < 544) {
        $(window).scroll(function () { // on every scroll
            var $cartWishListObserver = document.querySelector('.cart-wishlist-observer');
            var $initialCoords = $cartWishListObserver.getBoundingClientRect(); //return all x,y,Top values
            if (this.window.scrollY < $initialCoords.top) { //if we scroll up to button
                $('.cart-sticky-wrapper-btn').removeClass('scroll-bottom').addClass('scroll-hidden');
            } else {
                if (!$('.prices-add-to-cart-actions .cta-add-to-cart').isOnScreen()) { // if button is not on viewport
                    $('.cart-sticky-wrapper-btn').removeClass('scroll-hidden').addClass('scroll-bottom');
                }else{
                    $('.cart-sticky-wrapper-btn').addClass('scroll-hidden');
                }
            }
        });
    }

    $.fn.isOnScreen = function () {
        var $win = $(window);
        var $viewport = {
            top: $win.scrollTop(),
            left: $win.scrollLeft()
        };
        $viewport.right = $viewport.left + $win.width();
        $viewport.bottom = $viewport.top + $win.height();
        var $bounds = this.offset();
        $bounds.right = $bounds.left + this.outerWidth();
        $bounds.bottom = $bounds.top + this.outerHeight();
        return (!($viewport.right < $bounds.left || $viewport.left > $bounds.right || $viewport.bottom < $bounds.top || $viewport.top > $bounds.bottom));
    };

    // custom end: MSS-1772 pdp sticky ATC
    
    // custom start: remove or add clyde top and bottom border if clyde widgets exist

    var $isClydeSitePrefrence = document.querySelector('.clyde-site-prefrence');

    if ($isClydeSitePrefrence) {
        var $isClydeEnabled = $isClydeSitePrefrence.dataset.clydeEnable;
        var $isClydeWidgetEnabled = $isClydeSitePrefrence.dataset.clydeWidget;

        if ($isClydeEnabled == 'true' && $isClydeWidgetEnabled == 'true') {
            var $clydeWidget = document.querySelector('.clyde-widget');

            function refreshClydeWidgets() {
                if(document.readyState === 'complete' && $clydeWidget) {
                    var $clydeTopBorder = document.querySelector('.clyde-top-border');
                    var $clydeBottomBorder = document.querySelector('.clyde-bottom-border');
                    var $iframe = document.getElementById('clyde-widget-product-page-frame');
                    var $isContain = $iframe.classList.contains('clyde-fade-in');

                    if ($isContain) {
                        $clydeTopBorder.classList.remove('d-none');
                        $clydeBottomBorder.classList.remove('d-none');
                    } else {
                        $clydeTopBorder.classList.add('d-none');
                        $clydeBottomBorder.classList.add('d-none');
                    }
                } else {
                    setTimeout(refreshClydeWidgets, 500);
                }
            }
            setTimeout(refreshClydeWidgets, 500);
        }
    }

    // custom end: remove or add clyde top and bottom border if clyde widgets exist

});

function ratingRedesign() {
    if (document.readyState == "interactive") {
        if ($('.ratings').children().length == 0){
            $('.ratings').addClass('ratings-redesign');
        }
    }
}

// Custom Start: [MSS-2079] Hide Star Ratings and Write a Review Section when 0 Reviews on a Product
function removeRatings() {
    var $ratings = $('.ratings');
    var $wrapper = $('.yotpo-display-wrapper')
    var $noReviews = $('.yotpo-no-reviews');
    var $yotpoWrapper = $('.yotpo.bottomLine');
    var $reviewsSection = $('#yotpo-reviews-top-div');
    var $yotpoAccordian = $('.yotpo-accordion-section');
    
    if ($noReviews.length > 0) {
        $ratings.css('opacity', 0);
        $wrapper.css('display', 'none');
        $reviewsSection.css('display', 'none');
        $noReviews.hide();
        $yotpoWrapper.hide();
        $reviewsSection.hide();
        $yotpoAccordian.hide();
    } else {
        setTimeout(function () {
            removeRatings();
        }, 100);
    }
}

setTimeout(function () {
    removeRatings();
}, 100);
// Custom End

$(document).ready(function () {
    var $productWrapper = $('.product-availability .availability-msg-text').text();
    var $availability = $('.product-availability .availability-msg').text();
    var $availabilityWrapper = $availability.replace(/\s/g, '');
    var $cartWrapper = $('.cart-and-ipay');
    var $stickyWrapper = $('.cart-sticky-wrapper-btn .cart-and-ipay');
    if ($productWrapper !== '' || $productWrapper !== undefined || $productWrapper !== null) {
        if (($productWrapper === 'out of stock') || ($productWrapper === 'Out of Stock') || ($availabilityWrapper === 'SelectStylesforAvailability')) {
            if ($stickyWrapper) {
                $stickyWrapper.addClass('d-none');
            }    
            if (!($cartWrapper.hasClass('d-none'))) {
                $cartWrapper.addClass('d-none');
            }
        }
    }
    
    showMoreDescription();

    setTimeout(function() {
        $('.apple-pay-pdp').attr('aria-label', $applePayButtonLabel);
        $('.gpay-button').attr('aria-label', $googlePayButtonLabel);
    }, 2000);
});

// Custom Start: [MSS-2360 To Show/Hide More Short Description on PDP]
function showMoreDescription() {
    var $lessText = ' show less';
    var $moreText = ' Read More';
    var $showChar = 250;

    $('.product-aruliden-sec .product-description p').each(function() {
        var $content = $(this).html();

        if ($content.length > $showChar) {
            var firstPeriodIndex = $content.indexOf('.', $showChar);

            if (firstPeriodIndex !== -1) {
                var $firstLine = $content.substring(0, firstPeriodIndex + 1);
                
                if ($firstLine.localeCompare($content) === -1) {
                    var $html = '<span class="first-line">' + $firstLine + '</span>' +
                                '<span style="display:none" class="morecontent-wrapper"><span>' + $content + '</span></span>' +
                                '<div><a href="#" class="morelink-wrapper" style="text-decoration: underline; display: inline-block">' + $moreText + '</a></div>';
            
                    $(this).html($html);
                }
            }
        }
    });

    $('.morelink-wrapper').on('click',function() {
        if($(this).hasClass('less')) {
            $(this).removeClass('less');
            $(this).html($moreText);
            $('.morelink-wrapper').css('margin-left','4px');
            $('.morecontent-wrapper').css('display','none');
            $('.first-line').css('display', 'inline');
        } else {
            $(this).addClass('less');
            $(this).html($lessText);
            $('.morelink-wrapper').css('margin-left','4px');
            $('.morecontent-wrapper').css('display','inline');
            $('.first-line').css('display', 'none');
        }
        return false;
    });
}

$('.back-in-stock-notification-container-main .back-in-stock-notification-email').focus(function () {
    $('.back-in-stock-notification-container-main').addClass('input-blur');
}).blur(function () {
    if ($(this).val().length == 0) {
        $('.back-in-stock-notification-container-main').removeClass('input-blur');
    }
});