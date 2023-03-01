'use strict';
const { load } = require('cheerio');
var movadoDetail = require('movado/product/detail');
var base = require('./base');
var pdpVideoLoaded = false; 
module.exports = {

    zooom : function() {
        function zoomfeature () {
            var t = ".main-mvmt-carousel .carousel-tile";
            $(t).trigger("zoom.destroy");
            $(t).addClass("disabled");
            $(".zoom-icon.zoom-out").removeClass("is-active");
            var n = $(".main-mvmt-carousel .slick-current").find("img").attr("src");
            var $primaryImagesContainer = $('.primary-images');
            var $videoSlide = $primaryImagesContainer.find('.slick-slide.slick-current .slide-video');
            var $zoomButtons = $primaryImagesContainer.find('.quickview.js-zoom-image, .zoom-icon');
            var $imageSlide = $primaryImagesContainer.find('.slick-slide.slick-current .carousel-tile, .slick-slide.slick-current .normal-zoom');
            $(window).width() > 767 ? (
                $(t).trigger("zoom.destroy"), 
                $(t).zoom({
                    url: $(this).find('img').attr('src'),
                    magnify: 1.1,
                    on: "click",
                    target: $(".zoom-box"),
                    
                    onZoomIn: function() {
                        $(".zoom-box").addClass("zoom-active");
                        $(".zoom-out").addClass("active");
                    },
                    
                    onZoomOut: function() {
                        $(".zoom-box").removeClass("zoom-active");
                        $(".zoom-out").removeClass("active");
                    }
                })
            ) : (
                $(t).zoom({
                    url: $(this).find('img').attr('src'),
                    magnify: 1.1,
                    on: "click",
                    target: $(".zoom-box"),
                    onZoomIn: function() {
                        $(".zoom-box").addClass("zoom-active");
                        $(".zoom-out").addClass("active");
                    },
                    onZoomOut: function() {
                        $(".zoom-box").removeClass("zoom-active");
                        $(".zoom-out").removeClass("active");
                    }
                }),

                $(document).off("click", ".zoom-icon.zoom-in").on("click", ".zoom-icon.zoom-in", (function (a) {
                    $(".slick-dots").addClass('index-zoom-wrapper1');
                    $(".slick-dots").removeClass('index-wrapper-inner');
                    $(t).trigger('onZoomIn');
                    $('.primary-images').addClass('zoomed-images');
                    if ($videoSlide.length > 0) {
                        $zoomButtons.removeClass('d-none');
                        $imageSlide.css('pointer-events', '');
                        $primaryImagesContainer.find('.slick-slide.slick-current').css('cursor', '');
                    }
                    if ($(t).hasClass("disabled")) {
                        $(".zoom-icon.zoom-out").addClass("is-active");
                        $(t).removeClass("disabled");
                    }
                })),

                $(document).off("click", ".zoom-icon.zoom-out").on("click", ".zoom-icon.zoom-out", (function (a) {
                    $('.primary-images').removeClass('zoomed-images');
                    $(".slick-dots").addClass('index-wrapper-inner');
                    $(".slick-dots").removeClass('index-zoom-wrapper1');
                    if ($videoSlide.length > 0) {
                        $zoomButtons.addClass('d-none');
                        $imageSlide.css('pointer-events', 'none');
                        $primaryImagesContainer.find('.slick-slide.slick-current').css('cursor', 'default');
                    }
                    $(t).trigger('onZoomOut');
                    $(".zoom-icon.zoom-out").hasClass("is-active") && ( $(t).addClass("disabled"),
                    $(".zoom-icon.zoom-out").removeClass("is-active"))
                }))
            );
        };

        zoomfeature();

        $(window).on('resize', function(){
            zoomfeature();
        })
    },

    clickEvents: function () {

        $('.pdp-tabs-nav button').on('click', function(e) {
            var thistab = $(this).data('tab');
            $(this).addClass('active').siblings().removeClass('active');
            $('html, body').animate({
                scrollTop: $('.' + thistab + '').offset().top - 100
            }, 1000);
        });

        $('.pdp-mobile-accordian').on('click', function(e) {
            $(this).toggleClass('active').siblings().toggleClass('active');
        });

        $('.call-see-fit-popup').on('click', function(e) {
            $('.size-guide, #overlay').addClass('active');
            $('#overlay').addClass('size-guide-overlay');
        });

        $('.size-guide-close').on('click', function(e) {
            $('.size-guide, #overlay').removeClass('active');
            $('#overlay').removeClass('size-guide-overlay');
        });

        $('.modal-close').on('click', function(e) {
            $('.modal-background').fadeOut();
            $('html').removeClass('no-overflow');
            $('.polarized-modal, .polarized-modal-body,.modal-background').removeClass('opened');
        });

        $('.call-why-polarized-popup').on('click', function(e) {
            $('.modal-background').fadeIn();
            $('html').addClass('no-overflow');
            setTimeout(function(){ 
                $('.polarized-modal, .polarized-modal-body, .modal-background').addClass('opened');
             }, 300);
        });

        $('.polarized-modal').mouseup(function(e) {
            var container = $('.polarized-modal-body');

            if (!container.is(e.target) && container.has(e.target).length === 0) 
            {
                $('.modal-background').fadeOut();
                $('.polarized-modal, .polarized-modal-body, .modal-background').removeClass('opened');
                $('html').removeClass('no-overflow');
            }
        });

        // added active class & scroll down on reviews widget for mobile screen

        $('.rating-margin > .ratings').on('click', function(e) {
            var $pdpMobileAccordian = $('.accordian-mobile');
            var $pdpContentBody = $('.accordian-mobile-body');
            var $isAccordianAcive = $('.accordian-mobile').hasClass('active');
            var $isAccordianBodyActive = $('.accordian-mobile-body').hasClass('active');
            if($pdpMobileAccordian && $pdpContentBody) {
                if(!$isAccordianAcive && !$isAccordianBodyActive) {
                    $pdpMobileAccordian.addClass('active');
                    $pdpContentBody.addClass('active');
                    $('html, body').animate({
                        scrollTop: $($pdpMobileAccordian).offset().top
                    }, 10);
                }
            }
        });

        // added active class & scroll down on reviews widget
        $('.ratings > .yotpoBottomLine').on('click',function () {
            var $mainWidget = $('.main-widget > .yotpo-display-wrapper');
            $('html, body').animate({
            scrollTop: $($mainWidget).offset().top
            }, 10);
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
            autoplay: false,
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
        $('.linked-products-redesign').slick({
            slidesToShow: 2,
            slidesToScroll: 1,
            focusOnSelect: true,
            infinite: false,
            dots: true,
            arrows: true,
            responsive: [
                {
                    breakpoint: 768,
                    settings: {
                        arrows: false,
                    }
                }
            ]
        });
    },

    stickybar: function () {
        $(window).on('resize load', function(){
            var $header = $('.header-menu-wrapper .header-wrapper').height();
            var $productdetail = $('.product-detail').height();
            var $stickybar = $('.sticky-bar');
            $(window).scroll(function() {
                var $scroll = $(window).scrollTop();

                if ($scroll >= $productdetail) {
                    $stickybar.css('top', $header + 1 +'px');
                } else {
                    $stickybar.css('top','-45px');
                }
            });
        });

        function mobileCartButton () {
            var windowWidth = $(window).width();

                if (windowWidth < 768) {

                    $(window).on('scroll', function (e) {
                        if ($(window).scrollTop() > 300) {
                            $('.add-to-cart').addClass('mobileBtn');
                        }
                        var bottomNavigationHeader = $('.bottom-navigation-header').outerHeight() || 0;
                        if (!$('.bottom-navigation-header').is(':visible')) {
                            bottomNavigationHeader = 0;
                            $('.prices-add-to-cart-actions').css('margin-bottom', bottomNavigationHeader + 'px');
                        }
                        $('.add-cart-bottom-navigation').css('margin-bottom', bottomNavigationHeader + 'px');
                    });
            } else {
                $('.add-to-cart').removeClass('mobileBtn');
            }
        }

        mobileCartButton();

        $(window).resize((function() {
            mobileCartButton ();
        }));
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

    customeSlider: function () {
        $('.mvmt-pdp-carousel').slick({
            slidesToShow: 1,
            slidesToScroll: 1,
            dots: true,
            arrows:true,
            focusOnSelect: true,
            fade: true,
            prevArrow:"<button class='slick-prev slick-arrow' aria-label='Previous' type='button'></button>",
            nextArrow:"<button class='slick-next slick-arrow' aria-label='Next' type='button'></button>",
            responsive: [
                {
                    breakpoint: 768,
                    settings: {
                        arrows: true,
                        dots:false
                    }
                },
            ],
            customPaging: function (slick, index) {
                var thumb = $(slick.$slides[index]).find('.carousel-tile').attr('data-thumb');
                return '<button class="tab"> <img  src="'+ thumb +'" /> </button>';
            },
        });
    },

    primarySlider: function () {
        $('.primary-images .main-mvmt-carousel-alternate').slick({
            slidesToShow: 1,
            slidesToScroll: 1,
            dots: true,
            arrows:false,
            focusOnSelect: true,
            fade: true,
            prevArrow:"<button class='slick-prev slick-arrow' aria-label='Previous' type='button'><svg class='slick-arrow__icon' width='9' height='14' viewBox='0 0 9 14' xmlns='http://www.w3.org/2000/svg'><path d='M7.22359 0l1.6855 1.63333L3.37101 7l5.53808 5.36667L7.22359 14l-7.2236-7z' fill='#2B2B2B' fill-rule='evenodd'></path></svg></button>",
            nextArrow:"<button class='slick-next slick-arrow' aria-label='Next' type='button'><svg class='slick-arrow__icon' width='9' height='14' viewBox='0 0 9 14' xmlns='http://www.w3.org/2000/svg'><path d='M1.6855 0L0 1.63333 5.53808 7 0 12.36667 1.6855 14l7.22359-7z' fill='#2B2B2B' fill-rule='evenodd'></path></svg></button>",
            responsive: [
                {
                    breakpoint: 768,
                    settings: {
                        arrows: true,
                        dots:false
                    }
                },
            ],
            customPaging: function (slick, index) {
                var thumb = $(slick.$slides[index]).find('.carousel-tile').attr('data-thumb');
                return '<button class="tab"> <img  src="'+ thumb +'" /> </button>';
            },
        });
      
       
        $('.primary-images .main-mvmt-carousel').slick({
            slidesToShow: 1,
            slidesToScroll: 1,
            dots: true,
            arrows:false,
            focusOnSelect: true,
            fade: true,
            prevArrow:"<button class='slick-prev slick-arrow' aria-label='Previous' type='button'><svg class='slick-arrow__icon' width='9' height='14' viewBox='0 0 9 14' xmlns='http://www.w3.org/2000/svg'><path d='M7.22359 0l1.6855 1.63333L3.37101 7l5.53808 5.36667L7.22359 14l-7.2236-7z' fill='#2B2B2B' fill-rule='evenodd'></path></svg></button>",
            nextArrow:"<button class='slick-next slick-arrow' aria-label='Next' type='button'><svg class='slick-arrow__icon' width='9' height='14' viewBox='0 0 9 14' xmlns='http://www.w3.org/2000/svg'><path d='M1.6855 0L0 1.63333 5.53808 7 0 12.36667 1.6855 14l7.22359-7z' fill='#2B2B2B' fill-rule='evenodd'></path></svg></button>",
            responsive: [
                {
                    breakpoint: 768,
                    settings: {
                        arrows: true,
                        dots: true
                    }
                },
            ],
            customPaging: function (slick, index) {
                var thumb = $(slick.$slides[index]).find('.carousel-tile').attr('data-thumb');
                return '<button class="tab video-box"> <img  src="'+ thumb +'" /> </button>';
            },
        });

        $('.pdp-mvmt-pagination').slick({
            slidesToShow: 20,
            slidesToScroll: 1,
            asNavFor: '.primary-images .main-mvmt-carousel',
            dots: false,
            arrows: false,

        });
    },

    updateAddToCart: function () {
        $('body').off('product:updateAddToCart').on('product:updateAddToCart', function (e, response) {
            // update local add to cart (for sets)
            $('button.add-to-cart', response.$productContainer).attr('disabled',
                (!response.product.readyToOrder || !response.product.available));

            var enable = $('.product-availability').toArray().every(function (item) {
                return $(item).data('available') && $(item).data('ready-to-order');
            });

            $('button.add-to-cart-global').parent().toggleClass('d-none', !enable);
            // Custom Start: Enable Add to  Cart if product Ready To Order
            var $addToCartButton = $('button.add-to-cart');
            if (response.product.readyToOrder || response.product.available) {
                $addToCartButton.each(function(index, button) {
                    $(button).contents().first().replaceWith($addToCartButton.data('add-to-cart-text'));
                });
            }

            // Custom End
            if (response.product.readyToOrder) {
                // Custom Start: Enable Add to  Cart if product Ready To Order
                $('button.add-to-cart').attr('disabled', false);
                
                var currentCountry = response.product.currentCountry.toLowerCase();
                if (currentCountry && currentCountry === Resources.US_COUNTRY_CODE.toLowerCase()) {
                    var applePayButton = $('.apple-pay-pdp', response.$productContainer);
                    if (applePayButton.length !== 0) {
                        applePayButton.attr('sku', response.product.id);
                    } else {
                        if ($('.apple-pay-pdp').length === 0) { // eslint-disable-line no-lonely-if
                            $('.cart-and-ipay').append('<isapplepay class="apple-pay-pdp btn"' +
                                'sku=' + response.product.id + '></isapplepay>');
                        }
                    }
                } 
                // Custom End
            } else {
                $('.apple-pay-pdp').remove();
            }
        });
    },

    updateAvailability: function () {
        $('body').off('product:updateAvailability').on('product:updateAvailability', function (e, response) {
            $('div.availability', response.$productContainer)
                .data('ready-to-order', response.product.readyToOrder)
                .data('available', response.product.available);

            $('.availability-msg', response.$productContainer)
                .empty().html(response.message);

            if ($('.global-availability').length) {
                var allAvailable = $('.product-availability').toArray()
                    .every(function (item) { return $(item).data('available'); });

                var allReady = $('.product-availability').toArray()
                    .every(function (item) { return $(item).data('ready-to-order'); });

                $('.global-availability')
                    .data('ready-to-order', allReady)
                    .data('available', allAvailable);

                $('.global-availability .availability-msg').empty()
                    .html(allReady ? response.message : response.resources.info_selectforstock);
            }

            // Custom Start: Handle out of stock label on PDP

            var $availibilityContainer = $('.mvmt-avilability');
            if ($availibilityContainer) {
                
                $availibilityContainer.hide();
                if (!response.product.available) {
                    $availibilityContainer.show();
                }
            }

            // Custom End
        });
    },

    // Custom Start:
    updateCaseDiameter: function () {
        $( document ).ready(function() {
            var diameter = $('.watches-case-diameter').text();
            var index =  diameter.replace("-", "");
            $('.watches-case-diameter').text(index);
        });
    },
    // Custom End

    base: base
};

if (document.readyState == "interactive") {
    setTimeout(function () {
        var slickVideoIcon = $('.video').parent().parent().attr('aria-describedby');
        if (slickVideoIcon !== undefined) {
            $('#'+slickVideoIcon).parent().addClass('video-icon');
        }
    }, 1000);
}

function checkVideoStatus() {
    var $slideVideo = $('.slide-video');
    var firstVideoSlide = $slideVideo[0];
    if (firstVideoSlide && firstVideoSlide.readyState == '4') {
        $slideVideo.get(0).play();
        pdpVideoLoaded = true;
        var $primaryImagesContainer = $('.primary-images');
        var $videoSlide = $primaryImagesContainer.find('.slick-slide.slick-current .slide-video');
        var $zoomButtons = $primaryImagesContainer.find('.quickview.js-zoom-image, .zoom-icon');
        var $imageSlide = $primaryImagesContainer.find('.slick-slide.slick-current .carousel-tile, .slick-slide.slick-current .normal-zoom');

        if ($videoSlide.length > 0 && pdpVideoLoaded) {
            $zoomButtons.addClass('d-none');
            $imageSlide.css('pointer-events', 'none');
            $primaryImagesContainer.find('.slick-slide.slick-current').css('cursor', 'default');
        }
        $slideVideo.removeClass('d-none');

        clearInterval(videoStatusChecker);
    } else if (document.readyState == 'complete') {
        clearInterval(videoStatusChecker);
    }
}

var videoStatusChecker = setInterval(function () {
    checkVideoStatus();
}, 3000);

$(document).ready(function () {
    var $slideVideo = $('.slide-video');
    if ($slideVideo.length > 0) {
        if (document.documentMode && document.documentMode != 'undefined') {
            $slideVideo.addClass('slide-video-ie');
        }

        $('.primary-images .slick-arrow, .primary-images .slick-dots, .show-mobile-pdp .slick-dots').on('click', function (event) {
            var $primaryImagesContainer = $('.primary-images');
            var $videoSlide = $primaryImagesContainer.find('.slick-slide.slick-current .slide-video');
            var $zoomButtons = $primaryImagesContainer.find('.quickview.js-zoom-image, .zoom-icon');
            var $imageSlide = $primaryImagesContainer.find('.slick-slide.slick-current .carousel-tile, .slick-slide.slick-current .normal-zoom');
            if ($primaryImagesContainer.hasClass('zoomed-images')) {
                $zoomButtons.removeClass('d-none');
                $imageSlide.css('pointer-events', '');
                $primaryImagesContainer.find('.slick-slide.slick-current').css('cursor', '');
                return;
            } else if ($videoSlide.length > 0 && pdpVideoLoaded) {
                $zoomButtons.addClass('d-none');
                $imageSlide.css('pointer-events', 'none');
                $primaryImagesContainer.find('.slick-slide.slick-current').css('cursor', 'default');
            } else {
                $zoomButtons.removeClass('d-none');
                $imageSlide.css('pointer-events', '');
                $primaryImagesContainer.find('.slick-slide.slick-current').css('cursor', '');
            }
        });
    }
});

function stickySectionCheck() {
    $(document).ready(function(){
        var imageBox = $('.quadrant-pdp-wrapper').height();
        var detailBox = $('.product-side-details-wrapper').height();
        var SpecsBox = $('.Specs .mvmv-pdp-accordian.active').height();
        var reviewBox = $('.Reviews .mvmv-pdp-accordian.active').height();
        var fadeIn = $('.fadeIn .mvmv-pdp-accordian.active').height();
        var $quadrantpdpImage = $('.carousel-tile').height() / 2 + 60;        

        if ($(window).width() > 767) {
            if(detailBox > imageBox){
                $('.quadrant-pdp-wrapper').addClass('sticky-section');
                $('.page').css({'overflow':'visible'});
            } else{
                $('.product-side-details-wrapper').addClass('sticky-section');
                $('.page').css({'overflow':'visible'});
            }
        }
    
        $(window).scroll(function() {    
            var $scroll = $(window).scrollTop();
            var $recommendationHeight = $('.linked-product-container').height() + $quadrantpdpImage - 50;
            if ($scroll) {
                $('.product-side-details-wrapper').addClass('darkHeader');
                $('.product-side-details-wrapper.sticky-section').css('top','-' + $recommendationHeight+'px');
            } else {
                $('.product-side-details-wrapper').removeClass('darkHeader');
                $('.product-side-details-wrapper.sticky-section').attr('style', '');
            }
        });
    });
    
    
}
stickySectionCheck();

$('.mvmv-pdp-accordian').click(function() {
    stickySectionCheck();
});

if ($(window).width() > 768) {
    $('.show-mobile-pdp').remove();
}

if (document.readyState == 'interactive') {
    setTimeout(() => {
        var $reviewsAccordion = $('.review-box-mvmt').find('.text-m');
        if ($reviewsAccordion.length > 0) {
            $('.review-empty-box').hide(); 
            $('.reviews-here').show();
        } else {
            $('.review-empty-box').show();
            $('.reviews-here').hide();
        }
    }, 1000);
}
$('.zoom-in').click(function(){
    $('.main-mvmt-carousel-pdp-redesign').removeClass('show-arrow-box-mvmt');
});
$('.zoom-out').click(function(){
    $('.main-mvmt-carousel-pdp-redesign').addClass('show-arrow-box-mvmt');
});

// Mss-1485 MVMT - PDP Redesign - Desktop Zoom Modal  click to open image
var firstIndex = true;
$('.zoom-product-modal').click(function() {
    var imageIndex = parseFloat($(this).attr('data-image-index'));
    var primaryImageLength = parseFloat($('.mvmt-pdp-carousel').find('.normal-zoom').data('img-length'));
    if(imageIndex < primaryImageLength && primaryImageLength > 1 && firstIndex == true && imageIndex == 0) {

        $(`.mvmt-pdp-carousel [data-slick-index='${imageIndex + 1}']`).addClass('d-none');
        $('.mvmt-pdp-carousel .slick-dots').addClass('d-none');
        $('.mvmt-pdp-carousel .slick-list.draggable').addClass('border-bottom-0');
        $(`.mvmt-pdp-carousel .slick-dots [aria-controls='${$(`.mvmt-pdp-carousel [data-slick-index='${imageIndex + 1}']`).attr('id')}']`).trigger('click');

        setTimeout(() => {

            firstIndex == false;
            $(`.mvmt-pdp-carousel .slick-dots`).removeClass('d-none');
            $('.mvmt-pdp-carousel .slick-list.draggable').removeClass('border-bottom-0');
            $(`.mvmt-pdp-carousel .slick-dots [aria-controls='${$(`.mvmt-pdp-carousel [data-slick-index='${parseFloat($(this).attr('data-image-index'))}']`).attr('id')}']`).trigger('click');
            $('.mvmt-pdp-carousel .slick-slide').removeClass('d-none');

        }, 500);
    } else {
        firstIndex == false;
        $(`.mvmt-pdp-carousel .slick-dots`).removeClass('d-none');
        $('.mvmt-pdp-carousel .slick-list.draggable').removeClass('border-bottom-0');
        $(`.mvmt-pdp-carousel .slick-dots [aria-controls='${$(`.mvmt-pdp-carousel [data-slick-index='${parseFloat($(this).attr('data-image-index'))}']`).attr('id')}']`).trigger('click');
        $('.mvmt-pdp-carousel .slick-slide').removeClass('d-none');

    }
});

// Custom start: Listrak persistent popup
$(document).on('click','.listrak-popup', function(e) {
    e.preventDefault();
    e.stopPropagation();
    var isContainListrakPopup = e.target.closest('.listrak-popup');
    var targetEl = e.target;
    var isTargetContain = targetEl.classList.contains('close-icon-popup');
    if (isContainListrakPopup && !isTargetContain) {
        var listrakPersistenPopupUrl = document.querySelector('.listrak-persistent-url');
        var url = listrakPersistenPopupUrl.dataset.listrakUrl;
        $.ajax({
            url: url,
            method: 'GET',
            success: function (response) {
                if (response.success == true) {
                    var interval = setInterval(function() {
                        if (typeof _ltk != "undefined" && typeof _ltk.Popup != "undefined") {
                            _ltk.Popup.openManualByName(response.popupID);
                            clearInterval(interval);
                        }
                    }, 1000);
                }
            },
            error: function () {
                $.spinner().stop();
            }
        });
    }
});
$(document).on('click','.close-icon-popup', function(e) {
    e.preventDefault();
    e.stopPropagation();
    var isContainListrakPopup = e.target.closest('.listrak-popup');
    var targetEl = e.target;
    var isTargetContain = targetEl.classList.contains('close-icon-popup');
    if (isContainListrakPopup && isTargetContain) {
        sessionStorage.setItem("listrakPersistenPopup", "false");
        isContainListrakPopup.remove();
    }
});
window.onload = () => {
    var listrakPopup = document.querySelector('.listrak-popup');
    var listrakPopupSearchResult = document.querySelector('.listrak-popup-search-result');
    var listrakPopupProductDetail = document.querySelector('.listrak-popup-product-detail');
    var data = sessionStorage.getItem("listrakPersistenPopup");
    if (data == null) {
        var isListrakPopupContain = listrakPopup.classList.contains('listrak-persistent-popup');
    
        if (isListrakPopupContain) {
            listrakPopup.classList.remove('listrak-persistent-popup');
    }
    }
    if (listrakPopupSearchResult) {
        var mediumWidth = 992;
        var $windowWidth = $(window).width();
        if ($windowWidth < mediumWidth) {
            listrakPopup.classList.add('button-search-result');
        }
    }
    if (listrakPopupProductDetail) {
        var mediumWidth = 992;
        var $windowWidth = $(window).width();
        if ($windowWidth < mediumWidth) {
            listrakPopup.classList.add('button-product-detail');
        }
    }
};
// Custom End: Listrak persistent popup