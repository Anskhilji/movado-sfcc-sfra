'use strict';
var movadoBase = require('movado/product/base');
var winWidth = $(window).width();
var mediumBreakPoint= 767;

/**
 *  CovertsPDP Primary Images to Slider
 */
function initializePDPMainSlider() {
    $('.primary-images .main-carousel').slick({
        slidesToShow: 1,
        slidesToScroll: 1,
        asNavFor: '.carousel-nav-redesign',
        dots: false,
        centerMode: true,
        centerPadding: '0px',
        arrows: true,
        focusOnSelect: true,
        fade: true,
        prevArrow:"<button class='slick-prev slick-arrow' aria-label='Previous' type='button' style=''>Previous</button>",
        nextArrow:"<button class='slick-next slick-arrow' aria-label='Next' type='button' style=''>Next</button>", 
        responsive: [
            {
                breakpoint: 768,
                settings: {
                slidesToShow: 1,
                slidesToScroll: 1,
                arrows: false
                }
            },
        ]
    });
}

/**
 *  CovertsPDP Zoom Model Primary Images to Carousel
 */
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
                    movadoBase.zoom();
                }
            }, 300);
        }
    }
}

$(window).resize(function(){
    $('.primary-images .main-carousel')[0].slick.refresh();
    $('.carousel-nav-redesign')[0].slick.refresh();
  });

$(document).ready(function() {
    // Custom Start: MSS-1564 zoom carousel popup active on click after zoom icon on pdp
    $(window).on("resize", function () {
        var winWidth = $(window).width();
        initializeCarousel(winWidth, true);
        initializePDPMainSlider();
    });

    $(window).on("click", function () {
        var winWidth = $(window).width();
        initializeCarousel(winWidth, true);
    });

// Custom End: MSS-1564 zoom carousel popup active on click after zoom icon on pdp
});

$('body').on('click', '.primary-images .main-carousel .slick-next,.primary-images .main-carousel-mcs img', function (e) {
    e.preventDefault();
    $('.main-carousel .slick-active').addClass('slick-center');
});

$('body').on('click', '.primary-images .main-carousel .slick-prev,.primary-images .main-carousel-mcs img', function (e) {
    e.preventDefault();
    $('.main-carousel .slick-active').addClass('slick-center');
});

$('body').on('click', '.primary-images .main-carousel-mcs img', function (e) {
    e.preventDefault();
    var $winWidth = $(window).width();
    var $mediumBreakPoint= 767;
    if ($(this).parents('.slick-active.slick-center').length > 0) {
        $('#zoomProduct').modal('show');
        if ($('.zoom-carousel.slick-slider:visible').length == 0) {
            setTimeout(function() {
                $('.zoom-carousel.slick-slider').slick('refresh');
                $('.zoom-carousel-nav .slick-slider').slick('refresh');
                movadoBase.slickHeight();
                if ($winWidth > $mediumBreakPoint) {
                    movadoBase.zoom();
                }
            }, 300);
        }
    }
});

$('body').on('click', '.carousel-indicator-image', function (e) {
    e.preventDefault();
    $('.main-carousel .slick-active').addClass('slick-center');
});

$(window).resize(function() {
    movadoBase.slickHeight();
});

$(window).on('load resize scroll', function(e) {

    if ($(window).width() > 800) {

        var myTimeout;
        $('.search-results.plp-new-design .product .product-tile').mouseenter(function () {
            var that = this;

            myTimeout = setTimeout(function () {
            $(that).addClass('hovered-tile');
            $(that).find('.tile-btns').addClass('delay-point-five fadeIn fast animated');
            $(that).find('.tile-discription').addClass(' delay-point-five fadeIn fast animated');
                }, 200);
            }).mouseleave(function () {
                clearTimeout(myTimeout);
                $('.search-results.plp-new-design .product-tile').removeClass('hovered-tile');
                $('.tile-btns').removeClass('fadeIn delay-point-five fadeIn fast animated');
                $('.tile-discription').removeClass('delay-point-five fadeIn fast animated');
                $('.product-tile').css('min-height', 'auto');
            });

        $('.search-results.plp-new-design .product .product-tile .tile-body').focusin(function (event) {
            if (event.target == event.currentTarget) {
                var productTile=this.closest('.search-results.plp-new-design .product .product-tile');
                var thatHeight = $(productTile).height();

                myTimeout = setTimeout(function () {
                $(productTile).addClass('hovered-tile');
                $(productTile).find('.tile-btns').addClass('delay-point-five fadeIn fast animated');
                $(productTile).find('.tile-discription').addClass(' delay-point-five fadeIn fast animated');
                    }, 200);
            }
            }).focusout(function () {
                if (event.target == event.currentTarget || $(event.target).hasClass('add-to-cart')) {
                    clearTimeout(myTimeout);
                    $('.search-results.plp-new-design .product-tile').removeClass('hovered-tile');
                    $('.tile-btns').removeClass('fadeIn delay-point-five fadeIn fast animated');
                    $('.tile-discription').removeClass('delay-point-five fadeIn fast animated');
                    $('.product-tile').css('min-height', 'auto');
                }
            });
    } else {
        $('.search-results.plp-new-design .product .product-tile').mouseenter(function () {
            var that=this
            var thatHeight=$(this).height();

        myTimeout = setTimeout(function () {
            $('.search-results.plp-new-design .product-tile').removeClass('hovered-tile');
            $('.tile-btns').removeClass('fadeIn delay-point-five fadeIn fast animated');
            $('.tile-discription').removeClass('delay-point-five fadeIn fast animated');
            $('.product-tile').css('min-height', 'auto');
            }, 200);
        }).mouseleave(function () {
            clearTimeout(myTimeout);
            $('.search-results.plp-new-design .product-tile').removeClass('hovered-tile');
            $('.tile-btns').removeClass('fadeIn delay-point-five fadeIn fast animated');
            $('.tile-discription').removeClass('delay-point-five fadeIn fast animated');
            $('.product-tile').css('min-height', 'auto');
        });
    }
});

$(document).on('click','#product-tile-open-btn', function() {
    $("#product-tile-popup").addClass("show-popup-tile");
});

$(document).on('click','#close-popup', function() {
    $("#product-tile-popup").removeClass("show-popup-tile");
});

if ($(window).width() >= 769) {
    $(document).ready(function() {
        $(window).resize(function() {
        var productTitle = $(".homepagetile-wrapper-box").height() - 10;
            $('.main-container-inner img')({'height': productTitle});
        }).resize();
    });
}

/**
 * Process attribute values associated with an attribute that does not have image swatches
 *
 * @param {Object} attr - Attribute
 * @param {string} attr.id - Attribute ID
 * @param {Object[]} attr.values - Array of attribute value objects
 * @param {string} attr.values.value - Attribute coded value
 * @param {string} attr.values.url - URL to de/select an attribute value of the product
 * @param {boolean} attr.values.isSelectable - Flag as to whether an attribute value can be
 *     selected.  If there is no variant that corresponds to a specific combination of attribute
 *     values, an attribute may be disabled in the Product Detail Page
 * @param {jQuery} $productContainer - DOM container for a given product
 */
function processNonSwatchValues(attr, $productContainer) {
    var $attr = '[data-attr="' + attr.id + '"]';
    var $defaultOption = $productContainer.find($attr + ' .selects-non-' + attr.id + ' option:first');
    $defaultOption.attr('value', attr.resetUrl);

    attr.values.forEach(function (attrValue) {
        var $attrValue = $productContainer
            .find($attr + ' [data-attr-value="' + attrValue.value + '"]');
        $attrValue.attr('value', attrValue.url)
            .removeAttr('disabled');
    });
}

/**
 * Routes the handling of attribute processing depending on whether the attribute has image
 *     swatches or not
 *
 * @param {Object} attrs - Attribute
 * @param {string} attr.id - Attribute ID
 * @param {jQuery} $productContainer - DOM element for a given product
 */
function updateAttrs(attrs, $productContainer) {
    // Currently, the only attribute type that has image swatches is Color.
    var attrsWithSwatches = ['color', 'colorWatch'];

    attrs.forEach(function (attr) {
        if (attrsWithSwatches.indexOf(attr.id) > -1) {
            movadoBase.processSwatchValues(attr, $productContainer);
        } else {
            processNonSwatchValues(attr, $productContainer);
        }
    });
}

/**
 * @typedef UpdatedOptionValue
 * @type Object
 * @property {string} id - Option value ID for look up
 * @property {string} url - Updated option value selection URL
 */

/**
 * @typedef OptionSelectionResponse
 * @type Object
 * @property {string} priceHtml - Updated price HTML code
 * @property {Object} options - Updated Options
 * @property {string} options.id - Option ID
 * @property {UpdatedOptionValue[]} options.values - Option values
 */

/**
 * MCS redesign sticky functionality on pdp
 */
$(document).ready(function () {
    var $addToCartBtn = $('.prices-add-to-cart-redesign .cta-add-to-cart');
    if ($addToCartBtn.length > 0) {
        var $divOffsetTop = $addToCartBtn.offset().top;
        if (!$('.prices-add-to-cart-redesign .cta-add-to-cart').isOnScreen()) { // if on load ATC button is not in viewPort show ATC at bottom
            if ($(window).scrollTop() > $divOffsetTop) {
                $('.top-sticky-card').removeClass('scroll-hidden').addClass('scroll-top');
                $('.bottom-sticky-card').addClass('scroll-hidden');
            } else {
                $('.top-sticky-card').addClass('scroll-hidden');
                $('.bottom-sticky-card').removeClass('scroll-hidden').addClass('scroll-bottom');
            }
        }
        $(window).scroll(function () {
            if ($(window).width() > 543) {
                var $scrollDistance = $(window).scrollTop();
                var $addToCatViewPort = $('.prices-add-to-cart-redesign .cta-add-to-cart').isOnScreen();

                if ($addToCatViewPort) { // check if  button is on screen
                    $('.bottom-sticky-card, .top-sticky-card').addClass('scroll-hidden'); // both bottom and top will hidde
                } else {
                    if ($scrollDistance > $divOffsetTop) { // top sticky will be active
                        $('.top-sticky-card').removeClass('scroll-hidden').addClass('scroll-top');
                        $('.bottom-sticky-card').addClass('scroll-hidden');
                    } else { // bottom sticky will be active
                        $('.bottom-sticky-card').removeClass('scroll-hidden').addClass('scroll-bottom');
                        $('.top-sticky-card').addClass('scroll-hidden');
                    }
                }
            } else { // mobile case
                $('.top-sticky-card').addClass('scroll-hidden') //top scroll button  will forever hide in mobile case
                $('.prices-add-to-cart-redesign .cta-add-to-cart').isOnScreen() ? $('.bottom-sticky-card').addClass('scroll-hidden') : $('.bottom-sticky-card').removeClass('scroll-hidden').addClass('scroll-bottom');
            }
        });
    }

});

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

/**
 * Parses JSON from Ajax call made whenever an attribute value is [de]selected
 * @param {Object} response - response from Ajax call
 * @param {Object} response.product - Product object
 * @param {string} response.product.id - Product ID
 * @param {Object[]} response.product.variationAttributes - Product attributes
 * @param {Object[]} response.product.images - Product images
 * @param {boolean} response.product.hasRequiredAttrsSelected - Flag as to whether all required
 *     attributes have been selected.  Used partially to
 *     determine whether the Add to Cart button can be enabled
 * @param {jQuery} $productContainer - DOM element for a given product.
 */
function handleVariantResponse(response, $productContainer) {
    var isChoiceOfBonusProducts =
        $productContainer.parents('.choose-bonus-product-dialog').length > 0;
    var isVaraint;
    if (response.product.variationAttributes) {
        updateAttrs(response.product.variationAttributes, $productContainer);
        isVaraint = response.product.productType === 'variant';
        if (isChoiceOfBonusProducts && isVaraint) {
            $productContainer.parent('.bonus-product-item')
                .data('pid', response.product.id);

            $productContainer.parent('.bonus-product-item')
                .data('ready-to-order', response.product.readyToOrder);
        }
    }

    if (!(response && response.product && response.product.isGiftBoxAllowed)) {
        $('.gift-box-wrapper').css('visibility', 'hidden');
        if($('.product-side-details .gift-allowed-checkbox').is(':checked')) {
            $('.product-side-details .gift-allowed-checkbox').prop('checked', false);
        }
    } else {
        if ($(window).width() >= 768) {
            if($('.gift-box-wrapper').attr('style')) {
                $('.gift-box-wrapper').removeAttr('style');
            }
            $('.gift-box-wrapper.d-desktop-show').show();
        } else {
            if($('.gift-box-wrapper').attr('style')) {
                $('.gift-box-wrapper').removeAttr('style');
            }
            $('.gift-box-wrapper.d-mobile-show').show();
        }
        if($('.product-side-details .gift-allowed-checkbox').is(':checked')) {
            $('.product-side-details .gift-allowed-checkbox').prop('checked', false);
        }
    }

    //Update Product Title
    if (typeof response.product.productName !== 'undefined' && response.product.productName !== '' && response.product.productName !== null) {
        $productContainer.find('.product-name').text(response.product.productName);
    }

    //Update product pageDescription
    if (typeof response.product.pageDescription !== 'undefined' && response.product.pageDescription !== '' && response.product.pageDescription !== null) {
        $productContainer.find('.description-redesign .content').text(response.product.pageDescription);
        $productContainer.find('.bottom-detail-mobile').text(response.product.pageDescription);
    }

    //update wishlist icon
    $('.add-to-wish-list').removeClass('added-to-wishlist');
    var $exclusiveBadges = $('.exclusive-badges');
    var $imageBadges = $('.primary-images .product-badges');
    $exclusiveBadges.empty();
    $imageBadges.empty();

   // Update text Badges
   if (response.product.available) {
        var $badges = response.badges;
        if ($badges.textBadges && $badges.textBadges.length > 0) {
            $badges.textBadges.forEach(function (badge) {
                $exclusiveBadges.append('<span class="badge text-uppercase">' + badge.text + '</span>');
            });
        }

        // Update image Badges
        if ($badges.imageBadges && $badges.imageBadges.length > 0) {
            $badges.imageBadges.forEach(function (imageBadge, idx) {
                if (idx === 0) {
                    $imageBadges.append('<div class="badge-left"><img src="' + imageBadge.imageUrl + '" alt="' + imageBadge.imageAlt + '"></div>');
                } else {
                    $imageBadges.append('<div class="badge-right"><img src="' + imageBadge.imageUrl + '" alt="' + imageBadge.imageAlt + '"></div>');
                }
            });
        }
    }

    // Update variation id to google pay
    if (window.Resources.GOOGLE_PAY_ENABLED) {
        $('.google-pay-container').data('pid', response.product.id);
    }

    // Update Product Long Description & Higlight Attributes
    if (response.product.longDescription !== 'undefined' && response.product.longDescription !== '' && response.product.longDescription !== null) {
        $('.product-bottom-detail').html(response.product.longDescription);
    } else {
        $('.product-bottom-detail').html(response.product.shortDescription);
    }

    // Update Product Higlight Attributes
    if (response.product.productDetailAttribute1 !== 'undefined' && response.product.productDetailAttribute1 !== '' && response.product.productDetailAttribute1 !== null) {
        $('.product-detail-attribute-1').html(response.product.productDetailAttribute1);
    }
    if (response.product.productDetailAttribute2 !== 'undefined' && response.product.productDetailAttribute2 !== '' && response.product.productDetailAttribute2 !== null) {
        $('.product-detail-attribute-2').html(response.product.productDetailAttribute2);
    }
    if (response.product.productDetailAttribute3 !== 'undefined' && response.product.productDetailAttribute3 !== '' && response.product.productDetailAttribute3 !== null) {
        $('.product-detail-attribute-3').html(response.product.productDetailAttribute3);
    }

    //update pdp Detailed Attributes
    var $detailsArray = response && response.product ? response.product.pdpDetailedAttributes : null ;
    $('.product-attributes .content').empty();
    if ($detailsArray && $detailsArray.length > 0) {
        for (var i = 0; i < $detailsArray.length; i++) {
            $('.product-attributes .content').append("<div class='attribute'><div class='attribute-badge'><img src=" + $detailsArray[i].image + "></div><div class='attribute-detail'><span class='attribute-name'>"
            + $detailsArray[i].displayName + "</span><span class='attribute-value'>" + $detailsArray[i].value + "</span></div></div>");
        }
    }

    //Update Smart Gift URL
    var $smartGiftUrl = $('.smart-gift-btn a').attr('href');
    if ($smartGiftUrl !== '' && $smartGiftUrl !== undefined) {
        var $smartGiftUrlParts = $smartGiftUrl.split('/');
        if ($smartGiftUrlParts.length > 0) {
            var $smartGiftBaseUrl = $smartGiftUrlParts[0]+'/'+$smartGiftUrlParts[1]+'/'+$smartGiftUrlParts[2]+'/'+$smartGiftUrlParts[3]+'/'+$smartGiftUrlParts[4];
            var $updatedQueryString = response.product.id;
            var $updatedSmartGiftUri = $smartGiftBaseUrl + '/' + $updatedQueryString;
            $('.smart-gift-btn a').attr("href", $updatedSmartGiftUri);
        }
    }

    //Update Drop a Hint URL
    var $dropHintUrl = $('.drop-hint').attr('href');
    if ($dropHintUrl !== '' && $dropHintUrl !== undefined) {
        var $dropHintUrlParts = $dropHintUrl.split('=');
        if ($dropHintUrlParts.length > 0) {
            var $dropHintBaseUrl = $dropHintUrlParts[0];
            var $updatedProductId = response.product.id;
            var $dropHintUpdatedUri = $dropHintBaseUrl + '=' + $updatedProductId;
            $('.drop-hint').attr("href", $dropHintUpdatedUri);
        }
    }

    // unslick Carousel
    $('.primary-images .main-carousel').slick('unslick');
    $('.zoom-carousel').slick('unslick');
    $('.zoom-carousel-slider').slick('unslick');

    // Update primary images
    var $primaryImageUrls = response.product.images;
    $primaryImageUrls.pdp700.forEach(function (imageUrl, idx) {
        $productContainer.find('.primary-images .cs-carousel-wrapper').find('img').eq(idx)
            .attr('src', imageUrl.url);
        $productContainer.find('.primary-images .cs-carousel-wrapper').find('picture source:nth-child(1)').eq(idx)
            .attr('srcset', imageUrl.url);
        $productContainer.find('.primary-images .cs-carousel-wrapper').find('picture source:nth-child(2)').eq(idx)
            .attr('srcset', imageUrl.url);
    });

    // Update primary images indicators
    var $primaryImageindiCatorsUrls = response.product.images;
    $primaryImageindiCatorsUrls.tile126.forEach(function (imageUrl, idx) {
        $productContainer.find('.primary-images .carousel-nav-redesign').find('img').eq(idx)
            .attr('src', imageUrl.url);
        $productContainer.find('.primary-images .carousel-nav-redesign').find('picture source:nth-child(1)').eq(idx)
            .attr('srcset', imageUrl.url);
        $productContainer.find('.primary-images .carousel-nav-redesign').find('picture source:nth-child(2)').eq(idx)
            .attr('srcset', imageUrl.url);
    });

    // Update model primary images
    var $ZoomCarousel = $('.zoom-carousel');
    $ZoomCarousel.empty();
    var $primaryImageZoomUrls = response.product.images;
    $primaryImageZoomUrls.zoom1660.forEach(function (imageUrl) {
        $ZoomCarousel.append('<div class="carousel-tile zoomit" data-thumb="' + imageUrl.url + '" style="width: 100%; display: inline-block; position: relative; overflow: hidden;"><img class="normal-zoom" src="' + imageUrl.url + '" alt="Coronada Ceramic" itemprop="image" data-zoom-mobile-url="' + imageUrl.url + '" data-zoom-desktop-url="' + imageUrl.url + '"><img src="' + imageUrl.url + '" class="zoom-img" style="position: absolute; top: 0px; left: 0px; opacity: 0; width: 1660px; height: 1660px; border: none; max-width: none; max-height: none;"><img src="' + imageUrl.url + '" class="zoom-img" style="position: absolute; top: 0px; left: 0px; opacity: 0; width: 1660px; height: 1660px; border: none; max-width: none; max-height: none;"></div>');
    });

    // Update model primary images indicators
    var primaryImageZoomIndicatorsUrls = response.product.images;
    primaryImageZoomIndicatorsUrls.tile150.forEach(function (imageUrl, idx) {
        $productContainer.find('.zoom-carousel-nav').find('img').eq(idx)
            .attr('src', imageUrl.url);
        $productContainer.find('.zoom-carousel-nav').find('picture source:nth-child(1)').eq(idx)
            .attr('srcset', imageUrl.url);
        $productContainer.find('.zoom-carousel-nav').find('picture source:nth-child(2)').eq(idx)
            .attr('srcset', imageUrl.url);
    });

    // Update sticky images
    var $topStickyContainer = $('.top-sticky-card');
    var $bottomStickyContainer = $('.bottom-sticky-card');
    var $stickyImageUrls = response.product.images;
    $stickyImageUrls.tile150.forEach(function (imageUrl, idx) {
        $topStickyContainer.find('.sticky-container-redesign .sticky-prod-img').find('img').eq(idx)
            .attr('src', imageUrl.url);
        $topStickyContainer.find('.sticky-container-redesign .sticky-prod-img').find('picture source:nth-child(1)').eq(idx)
            .attr('srcset', imageUrl.url);
        $topStickyContainer.find('.sticky-container-redesign .sticky-prod-img').find('picture source:nth-child(2)').eq(idx)
            .attr('srcset', imageUrl.url);
        $bottomStickyContainer.find('.sticky-container-redesign .sticky-prod-img').find('img').eq(idx)
            .attr('src', imageUrl.url);
        $bottomStickyContainer.find('.sticky-container-redesign .sticky-prod-img').find('picture source:nth-child(1)').eq(idx)
            .attr('srcset', imageUrl.url);
        $bottomStickyContainer.find('.sticky-container-redesign .sticky-prod-img').find('picture source:nth-child(2)').eq(idx)
            .attr('srcset', imageUrl.url);
    });


    // Update pricing
    if (!isChoiceOfBonusProducts) {
        var $priceSelector = $('.prices .price', $productContainer).length ? $('.prices .price', $productContainer) : $('.prices .price');
        $priceSelector.replaceWith(response.product.price.html);
    }

    var $barSalePriceSelector = $('.sticky-container-redesign .price');
    var $mobilePrice = $('.product-price-mobile .price, .add-to-cart-price-holder .price');

    if (response.product.price) {
        $mobilePrice.replaceWith(response.product.price.html);
        $barSalePriceSelector.replaceWith(response.product.price.html);
    }

    // Update promotions
    $('div[data-pid="'+$productContainer.data('pid')+'"]').find('.promotions').empty().html(movadoBase.getPromotionsHtml(response.product.promotions));

    movadoBase.updateAvailability(response, $productContainer);

    if (isChoiceOfBonusProducts) {
        var $selectButton = $productContainer.find('.select-bonus-product');
        $selectButton.trigger('bonusproduct:updateSelectButton', {
            product: response.product, $productContainer: $productContainer
        });
    } else {
        // Enable "Add to Cart" button if all required attributes have been selected
        $('button.add-to-cart, button.add-to-cart-global, button.update-cart-product-global').trigger('product:updateAddToCart', {
            product: response.product, $productContainer: $productContainer
        }).trigger('product:statusUpdate', response.product);
    }

    // Update attributes
    $productContainer.find('.main-attributes').empty()
        .html(movadoBase.getAttributesHtml(response.product.attributes));

    // intialize carousel
        initializePDPMainSlider();
        movadoBase.initializeZoomSlickDots();
        movadoBase.initializeZoomModelCarousel();
        $('.main-carousel .slick-active').addClass('slick-center');

    $(document).ready(function () {
        var $availabilityWrapper = $('.product-availability .availability-msg').text();
        var $cartWrapper = $('.cart-and-ipay');
        var $stickyWrapper = $('.sticky-prodct-cart-redesign .cart-and-ipay');

        if ($availabilityWrapper !== '' || $availabilityWrapper !== undefined || $availabilityWrapper !== null) {
            if (($availabilityWrapper === 'out of stock') || ($availabilityWrapper === 'Out of Stock') || ($availabilityWrapper === 'Select Styles for Availability')) {
                $cartWrapper.addClass('d-none');
                $stickyWrapper.addClass('d-none');
            } else {
                $cartWrapper.removeClass('d-none');
                $stickyWrapper.removeClass('d-none');
            }
        }
    });
}

/**
 * @typespec UpdatedQuantity
 * @type Object
 * @property {boolean} selected - Whether the quantity has been selected
 * @property {string} value - The number of products to purchase
 * @property {string} url - Compiled URL that specifies variation attributes, product ID, options,
 *     etc.
 */

/**
 * updates the product view when a product attribute is selected or deselected or when
 *         changing quantity
 * @param {string} selectedValueUrl - the Url for the selected variation value
 * @param {jQuery} $productContainer - DOM element for current product
 */
function attributeSelect(selectedValueUrl, $productContainer) {
    if (selectedValueUrl) {

        selectedValueUrl = new URL(selectedValueUrl);

        $productContainer.find('input[type="text"], textarea').filter('[required]:visible')
        .each(function() {
            if($(this).val() && $(this).closest("form.submitted").length) {
                selectedValueUrl.searchParams.append($(this).data('name'), $(this).val());
                selectedValueUrl.searchParams.append($(this).closest("form").find('input[type="hidden"]').attr("name"), $(this).closest("form").find('input[type="hidden"]').val());
            }
        });

        $('body').trigger('product:beforeAttributeSelect',
            { url: selectedValueUrl, container: $productContainer });

        $.ajax({
            url: selectedValueUrl,
            method: 'GET',
            success: function (data) {
                handleVariantResponse(data, $productContainer);
                movadoBase.updateOptions(data.product.options, $productContainer);
                movadoBase.updateQuantities(data.product.quantities, $productContainer);
                movadoBase.handleOptionsMessageErrors(data.validationErrorEmbossed, data.validationErrorEngraved, $productContainer);

                var listrakTracking = require('movado/listrakActivityTracking.js');
                listrakTracking.listrackProductTracking(data.product.id);

                $('body').trigger('product:afterAttributeSelect',
                    { data: data, container: $productContainer });
                $.spinner().stop();
            },
            error: function () {
                $.spinner().stop();
            }
        });
    }
}

movadoBase.colorAttribute = function () {
    $(document).off('click', '.main-variation-attribute-mcs[data-attr="color"] a, [data-attr="colorWatch"] a').on('click', '.main-variation-attribute-mcs[data-attr="color"] a, [data-attr="colorWatch"] a', function (e) {
        e.preventDefault();

        if ($(this).attr('disabled') || $(this).hasClass('active')) {
            return;
        } else {
            $('.product-size-options.color-variation.active').removeClass('active');
            $(this).addClass('active');
        }
        var $productContainer = $(this).closest('.set-item');
        if (!$productContainer.length) {
            $productContainer = $(this).closest('.product-detail');
        }

        attributeSelect(e.currentTarget.href, $productContainer);
    });
},

movadoBase.selectAttribute = function () {
    var selector = '.set-item select[class*="selects-non-"], .product-detail select[class*="selects-non-"], .options-select, .product-option input[type="radio"]';
    $(document).off('change', selector);
    $(document).on('change', selector, function (e) {
        e.preventDefault();

        var value = $(e.currentTarget).is('input[type="radio"]') ? $(e.currentTarget).data('value-url') : e.currentTarget.value;

        var $productContainer = $(this).closest('.set-item');
        if (!$productContainer.length) {
            $productContainer = $(this).closest('.product-detail');
        }
        attributeSelect(value, $productContainer);
    });
}

module.exports = movadoBase;