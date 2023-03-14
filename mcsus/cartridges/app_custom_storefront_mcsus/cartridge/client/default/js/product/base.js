'use strict';
var movadoBase = require('movado/product/base');
var winWidth = $(window).width();
var mediumBreakPoint= 767;

/**
 * Retrieve contextual quantity selector
 * @param {jquery} $el - DOM container for the relevant quantity
 * @return {jquery} - quantity selector DOM container
 */
function getQuantitySelector($el) {
    return $el && $('.set-items').length
        ? $($el).closest('.product-detail').find('.quantity-select')
        : $('.quantity-select');
}

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
function initializeZoomModelCarousel() {
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
}

/**
 *  CovertsPDP Zoom Model Primary Images to Indicators
 */
function initializeZoomSlickDots() {
    $('.zoom-carousel').slick({
        slidesToShow: 1,
        slidesToScroll: 1,
        dots: false,
        arrows: true,
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
}

/**
 *  CovertsPDP Primary Images to indicators
 */
 function initializeSlickDots() {
    $('.carousel-nav-redesign').slick({
        slidesToShow: 3,
        slidesToScroll: 1,
        asNavFor: '.primary-images .main-carousel',
        dots: false,
        arrows: false,
        focusOnSelect: true,
        infinite: false,
        responsive: [
            {
                breakpoint: 544,
                settings: {
                    dots: false
                }
            },
        ]
    });
}

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

/**
 *  CovertsPDP Zoom Model Primary Images to Carousel
 */
function initializeCarousel(winWidth, isResize) {
    if ($('.primary-images .main-carousel img').parents('.slick-active.slick-center').length > 0) {
        if (!isResize) {
          $('#zoomProduct').modal('show');
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

$(window).resize(function () {
    $('.primary-images .main-carousel')[0].slick.refresh();
    $('.carousel-nav-redesign')[0].slick.refresh();
});

$(document).ready(function () {
    // Custom Start: MSS-1564 zoom carousel popup active on click after zoom icon on pdp
    $(window).on('resize', function () {
        var winWidth = $(window).width();
        initializeCarousel(winWidth, true);
    });

    $('.carousel-zoom-icon').click(function () {
        initializeCarousel(winWidth);
    });

    $(window).on('click', function () {
        var winWidth = $(window).width();
        initializeCarousel(winWidth, true);
    });

// Custom End: MSS-1564 zoom carousel popup active on click after zoom icon on pdp
});

$('body').on('click', '.primary-images .main-carousel .slick-next,.primary-images .pdp-carousel img', function (e) {
    e.preventDefault();
    $('.main-carousel .slick-active').addClass('slick-center');
});

$('body').on('click', '.primary-images .main-carousel .slick-prev,.primary-images .pdp-carousel img', function (e) {
    e.preventDefault();
    $('.main-carousel .slick-active').addClass('slick-center');
});

$('body').on('click', '.primary-images .pdp-carousel img', function (e) {
    e.preventDefault();
    var $winWidth = $(window).width();
    var $mediumBreakPoint= 767;
    if ($(this).parents('.slick-active.slick-center').length > 0) {
        $('#zoomProduct').modal('show');
        if ($('.zoom-carousel.slick-slider:visible').length == 0) {
            setTimeout(function() {
                $('.zoom-carousel.slick-slider').slick('refresh');
                $('.zoom-carousel-slider.slick-slider').slick('refresh');
                if ($winWidth > $mediumBreakPoint) {
                    zoom();
                }
            }, 300);
        }
    }
});

$('body').on('click', '.carousel-indicator-image', function (e) {
    e.preventDefault();
    $('.main-carousel .slick-active').addClass('slick-center');
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

$(document).on('click', '#product-tile-open-btn', function() {
    $('#product-tile-popup').addClass('show-popup-tile');
});

$(document).on('click', '#close-popup', function() {
    $('#product-tile-popup').removeClass('show-popup-tile');
});

/**
 * Process the attribute values for an attribute that has image swatches
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
function processSwatchValues(attr, $productContainer) {
    attr.values.forEach(function (attrValue) {
        var $attrValue = $productContainer.find('[data-attr="' + attr.id + '"] [data-attr-value="' +
            attrValue.value + '"]');
        var $swatchAnchor = $attrValue.parent();

        if (attrValue.selected) {
            $attrValue.addClass('selected');
        } else {
            $attrValue.removeClass('selected');
        }

        if (attrValue.url) {
            $swatchAnchor.attr('href', attrValue.url);
        } else {
            $swatchAnchor.removeAttr('href');
        }
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
            processSwatchValues(attr, $productContainer);
        } else {
            processNonSwatchValues(attr, $productContainer);
        }
    });
}

/**
 * Updates the availability status in the Product Detail Page
 *
 * @param {Object} response - Ajax response object after an
 *                            attribute value has been [de]selected
 * @param {jQuery} $productContainer - DOM element for a given product
 */
function updateAvailability(response, $productContainer) {
    var availabilityValue = '';
    var availabilityMessages = response.product.availability.messages;
    if (!response.product.readyToOrder) {
        availabilityValue = '<div>' + response.resources.info_selectforstock + '</div>';
    } else {
        availabilityMessages.forEach(function (message) {
            availabilityValue += '<div>' + message + '</div>';
        });
    }

    $($productContainer).trigger('product:updateAvailability', {
        product: response.product,
        $productContainer: $productContainer,
        message: availabilityValue,
        resources: response.resources
    });
}

/**
 * Generates html for promotions section
 *
 * @param {array} promotions - list of promotions
 * @return {string} - Compiled HTML
 */
function getPromotionsHtml(promotions) {
    if (!promotions) {
        return '';
    }

    var html = '';

    promotions.forEach(function (promotion) {
        html += '<div class="callout" title="' + promotion.details + '">' + promotion.calloutMsg +
            '</div>';
    });

    return html;
}

/**
 * Generates html for product attributes section
 *
 * @param {array} attributes - list of attributes
 * @return {string} - Compiled HTML
 */
function getAttributesHtml(attributes) {
    if (!attributes) {
        return '';
    }

    var html = '';

    attributes.forEach(function (attributeGroup) {
        if (attributeGroup.ID === 'mainAttributes') {
            attributeGroup.attributes.forEach(function (attribute) {
                html += '<div class="attribute-values">' + attribute.label + ': '
                    + attribute.value + '</div>';
            });
        }
    });

    return html;
}

/**
 * @typedef OptionSelectionResponse
 * @type Object
 * @property {string} priceHtml - Updated price HTML code
 * @property {Object} options - Updated Options
 * @property {string} options.id - Option ID
 * @property {UpdatedOptionValue[]} options.values - Option values
 */

/**
 * Updates DOM using post-option selection Ajax response
 *
 * @param {OptionSelectionResponse} options - Ajax response options from selecting a product option
 * @param {jQuery} $productContainer - DOM element for current product
 */
 function updateOptions(options, $productContainer) {
    options.forEach(function (option) {
        var $optionEl = $productContainer.find('.product-option[data-option-id*="' + option.id
            + '"]');
        option.values.forEach(function (value) {
            var valueEl = $optionEl.find('option[data-value-id*="' + value.id + '"], input[data-value-id*="' + value.id + '"]');
            valueEl.is('input[type="radio"]') ? valueEl.data('value-url', value.url) : valueEl.val(value.url);
        });
    });
}

function handleOptionsMessageErrors(embossedMessageError, engravedMessageError, $productContainer) {
    var optionForm;
    if (embossedMessageError) {
        optionForm = $productContainer.find('form[name="embossing"]');
        optionForm.removeClass('submitted');
        optionForm.find("button").removeClass('submitted');
        optionForm.find('input[type="text"], textarea').removeAttr("readonly");
        optionForm.find('input[type="radio"]').eq(0).prop('checked', true);
        validateOptions(optionForm).showErrors({
            "option-message": embossedMessageError
        });
    }

    if (engravedMessageError) {
        optionForm = $productContainer.find('form[name="engraving"]');
        optionForm.removeClass('submitted');
        optionForm.find("button").removeClass('submitted');
        optionForm.find('input[type="text"], textarea').removeAttr("readonly");
        optionForm.find('input[type="radio"]').eq(0).prop('checked', true);
        validateOptions(optionForm).showErrors({
            "option-message": engravedMessageError
        });
    }
}

/**
 * Retrieve product options
 *
 * @param {jQuery} $productContainer - DOM element for current product
 * @return {boolean} - return if all product options are valid
 */
 function validateOptions($el) {

    var optionForm = $el.is("form") ? $el : $el.find('form[name="embossing"], form[name="engraving"]');

    if (!optionForm.length) return true;

    if (optionForm.find('textarea[required]').length) {
        return optionForm.validate({
            rules: {
                'option-message': {
                    productOptionMessage: true
                }
            },
            messages: {
                'option-message': {
                    required: optionForm.find('textarea[required]').data('required-error'),
                    maxlength: optionForm.find('textarea[required]').data('format-error'),
                    productOptionMessage: optionForm.find('textarea[required]').data('format-error')
                }
            }
        });
    } else {
        return optionForm.validate({
            rules: {
                'option-message': {
                    required: true
                }
            },
            messages: {
                'option-message': {
                    required: optionForm.find('input[required]').data('required-error'),
                    maxlength: optionForm.find('input[required]').data('format-error')
                }
            }
        });
    }
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

    // unslick Carousel
    $('.primary-images .main-carousel').slick('unslick');
    $('.primary-images .carousel-nav-redesign').slick('unslick');
    $('.zoom-carousel').slick('unslick');
    $('.zoom-carousel-slider').slick('unslick');

    // update pdp primary and thumbnail images
    var primaryImageUrls = response.product.images;
    $('.pdp-images-removal').remove();
    $('.zoom-modal').remove();
    $('.pdp-images-addition').prepend(response.pdpCarouselImages);

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

    // Updating promo messages
    if (response && response.product && response.product.promotions) {
        var $promotions = $('.promotions');
        var $promotionsCallOut = $('.promotions .callout');
        $promotionsCallOut.remove();
        var $productPromotions = response.product.promotions;
        $productPromotions.forEach(function(promotion) {
            $promotions.append('<div class="callout" title="' + promotion.details + '">' + promotion.calloutMsg + '</div>');
        });
    }

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
    $('div[data-pid="'+$productContainer.data('pid')+'"]').find('.promotions .callout').remove();
    $('div[data-pid="'+$productContainer.data('pid')+'"]').find('.promotions').append(getPromotionsHtml(response.product.promotions));

    updateAvailability(response, $productContainer);

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
        .html(getAttributesHtml(response.product.attributes));

    // intialize carousel
        initializePDPMainSlider();
        initializeSlickDots();
        initializeZoomSlickDots();
        initializeZoomModelCarousel();
        $('.main-carousel .slick-active').addClass('slick-center');

    $(document).ready(function () {
        var $availabilityWrapper = $('.product-availability .availability-msg').text();
        var $cartWrapper = $('.cart-and-ipay');
        var $stickyWrapper = $('.sticky-prodct-cart-redesign .cart-and-ipay');
        var $stickyApplePay = $('.sticky-prodct-cart-redesign .apple-pay-pdp');
        var $smartGiftPDP = $('.prices-add-to-cart-redesign .smart-gift-box-new-mcs');
        var $addToCartSection = $('.prices-add-to-cart-redesign');

        if ($availabilityWrapper !== '' || $availabilityWrapper !== undefined || $availabilityWrapper !== null) {
            if (($availabilityWrapper === 'out of stock') || ($availabilityWrapper === 'Out of Stock') || ($availabilityWrapper === 'Select Styles for Availability')) {
                $cartWrapper.addClass('d-none');
                $stickyWrapper.addClass('d-none');
                $stickyApplePay.addClass('d-none');
                $smartGiftPDP.addClass('d-none');
                $addToCartSection.addClass('d-none');
            } else {
                $cartWrapper.removeClass('d-none');
                $stickyWrapper.removeClass('d-none');
                $stickyApplePay.addClass('d-none');
                $smartGiftPDP.removeClass('d-none');
                $addToCartSection.removeClass('d-none');
            }
        }
    });

    // ATC button text upadate when the product is pre-order/back-order
    var $addToCartSelector = $('button.add-to-cart');
    if (response.product.availability && response.product.availability.inStockDate !== null && response.product.availability.messages.length > 0 && response.product.availability.messages[0] === window.Resources.INFO_PRODUCT_AVAILABILITY_PREORDER || response.product.availability.messages[0] === window.Resources.INFO_PRODUCT_AVAILABILITY_BACK_ORDER) {
        $addToCartSelector.each(function (index, button) {
            $(button).contents().first().replaceWith($addToCartSelector.textContent = window.Resources.BUTTON_PREORDER_NOW);
        });
    } else {
        $addToCartSelector.each(function (index, button) {
            $(button).contents().first().replaceWith($addToCartSelector.textContent = window.Resources.BUTTON_ADD_TO_CART);
        });
    }
}

/**
 * Updates the quantity DOM elements post Ajax call
 * @param {UpdatedQuantity[]} quantities -
 * @param {jQuery} $productContainer - DOM container for a given product
 */
 function updateQuantities(quantities, $productContainer) {
    if (!($productContainer.parent('.bonus-product-item').length > 0)) {
        var optionsHtml = quantities.map(function (quantity) {
            var selected = quantity.selected ? ' selected ' : '';
            return '<option value="' + quantity.value + '"  data-url="' + quantity.url + '"' +
                selected + '>' + quantity.value + '</option>';
        }).join('');
        getQuantitySelector($productContainer).empty().html(optionsHtml);
    }
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
            if($(this).val() && $(this).closest('form.submitted').length) {
                selectedValueUrl.searchParams.append($(this).data('name'), $(this).val());
                selectedValueUrl.searchParams.append($(this).closest('form').find('input[type="hidden"]').attr('name'), $(this).closest('form').find('input[type="hidden"]').val());
            }
        });

        $('body').trigger('product:beforeAttributeSelect',
            { url: selectedValueUrl, container: $productContainer });

        $.ajax({
            url: selectedValueUrl,
            method: 'GET',
            success: function (data) {
                handleVariantResponse(data, $productContainer);
                updateOptions(data.product.options, $productContainer);
                updateQuantities(data.product.quantities, $productContainer);
                handleOptionsMessageErrors(data.validationErrorEmbossed, data.validationErrorEngraved, $productContainer);

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