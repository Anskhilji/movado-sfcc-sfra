'use strict';
var movadoDetail = require('movado/product/detail');
var base = require('./base');

module.exports = {

    zooom : function() {
        function zoomfeature () {
            var t = ".main-mvmt-carousel .carousel-tile";
            $(t).trigger("zoom.destroy");
            var n = $(".main-mvmt-carousel .slick-active").find("img").attr("src");
            $(window).width() > 767 ? ($(t).trigger("zoom.destroy"), $(t).zoom({
                url: n,
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
            })) : (
            $(t).addClass("disabled"),
            $(t).trigger("zoom.destroy"),
            $(document).on("click", ".zoom-icon.zoom-in", (function(a) {
                $(t).hasClass("disabled") && ($(".zoom-icon.zoom-out").addClass("is-active"),
                $(t).removeClass("disabled"),
                $(t).zoom({
                    url: n,
                    magnify: 1.1,
                    on: "click",
                    target: $(".zoom-box"),
                    onZoomIn: function() {
                        $(".zoom-box").addClass("zoom-active");
                    },
                    onZoomOut: function() {
                        $(".zoom-box").removeClass("zoom-active")
                    }
                }))
            })),
            $(document).on("click", ".zoom-icon.zoom-out", (function(n) {
                $(".zoom-icon.zoom-out").hasClass("is-active") && ($(t).addClass("disabled"),
                $(".zoom-icon.zoom-out").removeClass("is-active"),
                $(t).trigger("zoom.destroy"))
            })));
        };

        zoomfeature();

        $(window).resize((function() {
            zoomfeature();
        }));
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

                $(window).on('scroll', function(e) {
                    if ($(window).scrollTop() > 300) {
                        $('.add-to-cart').addClass('mobileBtn');
                    }
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

    primarySlider: function () {
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
                // Custom End
                var applePayButton = $('.apple-pay-pdp', response.$productContainer);
                if (applePayButton.length !== 0) {
                    applePayButton.attr('sku', response.product.id);
                } else {
                    if ($('.apple-pay-pdp').length === 0) { // eslint-disable-line no-lonely-if
                        $('.cart-and-ipay').append('<isapplepay class="apple-pay-pdp btn"' +
                            'sku=' + response.product.id + '></isapplepay>');
                    }
                }
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

    updatePrice: function () {
        $('.upsell_input').on('click', function (){
            var upselprice = $(this).siblings('.upsell_wrapper-inner').find('.sales .value').data('value');
            var currentPrice = $('.product-price-mobile .sales .value').data('value');
            var updatedPrice;
            var updatedText;

            if ($(this).is(':checked')) {
                updatedPrice = parseInt(currentPrice) + parseInt(upselprice);
            } else {
                updatedPrice  = parseInt(currentPrice) - parseInt(upselprice);
            }

            $('.product-price-mobile .sales .value').each(function() {
                updatedText = $(this).text().replace(/([0-9]+[.,][0-9]+|[0-9]+)/g, updatedPrice);
                $(this).text(updatedText).data('value', updatedPrice);
            });
        });
    },
    base: base
};
