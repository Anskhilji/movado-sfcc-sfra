'use strict';
if(Resources.IS_CLYDE_ENABLED) {
    var clydeWidget = require('link_clyde/getClydeWidget.js');
}

/**
 * Retrieves the relevant pid value
 * @param {jquery} $el - DOM container for a given add to cart button
 * @return {string} - value to be used when adding product to cart
 */
function getPidValue($el) {
    var pid;

    if ($('#quickViewModal').hasClass('show') && !$('.product-set').length) {
        pid = $($el).closest('.modal-content').find('.product-quickview').data('pid');
    } else if ($('.product-set-detail').length || $('.product-set').length) {
        pid = $($el).closest('.product-detail').find('.product-id').text();
    } else if($($el).parents('.product-tile').length) { // Custom Start: Added this extra condition for mvmt tile
        pid = $($el).data('pid');
    } else {
        pid = $('.product-detail:not(".bundle-item")').data('pid');
    }

    return pid;
}

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
        asNavFor: '.carousel-nav',
        dots: false,
        arrows:true,
        focusOnSelect: true,
        fade: true,
        prevArrow:"<button class='slick-prev slick-arrow' aria-label='Previous' type='button' style=''>Previous</button>",
        nextArrow:"<button class='slick-next slick-arrow' aria-label='Next' type='button' style=''>Next</button>", 
    });
}

/**
 *  CovertsPDP Primary Images to indicators
 */
 function initializeSlickDots() {
    $('.carousel-nav').slick({
        slidesToShow: 5,
        slidesToScroll: 1,
        asNavFor: '.primary-images .main-carousel',
        dots: true,
        arrows:true,
        centerMode: true,
        focusOnSelect: true,
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
}

$('body').on('click', '.primary-images .main-carousel .slick-next', function (e) {
    e.preventDefault();
    $('.main-carousel .slick-active').addClass('slick-center');
});

$('body').on('click', '.primary-images .main-carousel .slick-prev', function (e) {
    e.preventDefault();
    $('.main-carousel .slick-active').addClass('slick-center');
});

$('body').on('click', '.primary-images .main-carousel-movado img', function (e) {
    e.preventDefault();
    var $winWidth = $(window).width();
    var $mediumBreakPoint= 767;
    if ($(this).parents('.slick-active.slick-center').length > 0) {   
        $('#zoomProduct').modal('show');
        if ($('.zoom-carousel.slick-slider:visible').length == 0) {
            setTimeout(function() {
                $('.zoom-carousel.slick-slider').slick('refresh');
                $('.zoom-carousel-nav .slick-slider').slick('refresh');
                slickHeight();
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

function slickHeight() {
    var $winWidth = $(window).width();
    var $mediumBreakPoint= 767;
    if ($winWidth > $mediumBreakPoint) {
        var $sliderHeight = $('.zoom-modal .slick-slider').height();
        $('.zoom-carousel-slider.carousel-nav-variation-redesing').css('height', $sliderHeight - 60);
    }
}

$( window ).resize(function() {
    slickHeight();
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
            $('.main-container-inner img').css({'height': productTitle});
        }).resize();
    });
}

/**
 * Retrieves the value associated with the Quantity pull-down menu
 * @param {jquery} $el - DOM container for the relevant quantity
 * @return {string} - value found in the quantity input
 */
function getQuantitySelected($el) {
    if ($($el).parents('.product-tile').length) { // Custom Start: Added this extra condition for mvmt tile
        return 1;
    } else {
        return getQuantitySelector($el).val();
    }
}

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

        // Disable if not selectable
        $attrValue.removeClass('selectable unselectable');

        $attrValue.addClass(attrValue.selectable ? 'selectable' : 'unselectable');
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
    var $defaultOption = $productContainer.find($attr + ' .select-' + attr.id + ' option:first');
    $defaultOption.attr('value', attr.resetUrl);

    attr.values.forEach(function (attrValue) {
        var $attrValue = $productContainer
            .find($attr + ' [data-attr-value="' + attrValue.value + '"]');
        $attrValue.attr('value', attrValue.url)
            .removeAttr('disabled');

        if (!attrValue.selectable) {
            $attrValue.attr('disabled', true);
        }
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
    var attrsWithSwatches = ['color'];

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
        html += '<div class="callout promo-msg" title="' + promotion.details + '">' + promotion.calloutMsg +
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

/**
 * remove Embossing and Engraving option
 *
 * @param {jQuery} $productContainer - DOM element for current product
 */
function removeOption($productOptionContainer) {
    if ($productOptionContainer.is("form")) {
        $productOptionContainer.removeClass('submitted');
    } else {
        $productOptionContainer.find('input[type="text"], textarea').val("");
        $productOptionContainer.find("form").removeClass('submitted');
    }

    $productOptionContainer.find("button").removeClass('submitted');
    $productOptionContainer.find('input[type="text"], textarea').removeAttr("readonly");
    $productOptionContainer.find('input[type="radio"]:eq(0)').prop('checked', true).change();
    $productOptionContainer.closest('form').validate().resetForm();
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
 * MCS redesign sticky functionality on pdp
 */
 $(document).ready(function () {
     var $divOffsetTop = $('.prices-add-to-cart-redesign .cta-add-to-cart').offset().top;
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
                 $('.bottom-sticky-card, .top-sticky-card').addClass('scroll-hidden');// both bottom and top will hidde
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
            $('.top-sticky-card').addClass('scroll-hidden')//top scroll button  will forever hide in mobile case
             $('.prices-add-to-cart-redesign .cta-add-to-cart').isOnScreen() ? $('.bottom-sticky-card').addClass('scroll-hidden') : $('.bottom-sticky-card').removeClass('scroll-hidden').addClass('scroll-bottom');
         }
     });
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
        $productContainer.find('.product-description .content').text(response.product.pageDescription);
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

    /**
    * Custom Start: Add logic to handle back in stock notifiaction content for variations
    */
    var $backInStockContanier = $('.back-in-stock-notification-container');
    if ($backInStockContanier.length > 0) {
        var $ctaAddToCart = $('.cta-add-to-cart');
        $backInStockContanier.data('pid', response.product.id);
        if (response.product.isBackInStockEnabled) {
            $backInStockContanier.removeClass('d-none');
            $ctaAddToCart.addClass('d-none');
        } else {
            $backInStockContanier.addClass('d-none');
            $ctaAddToCart.removeClass('d-none');
        }
    }

    /**
    * Custom End:
    */

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
            $('.product-attributes .content').append("<div class='row mb-3'><div class='col-4'><span class='attribute-name'>"
            + $detailsArray[i].displayName + "</span></div><div class='col-8'><span class='attribute-value'>"
            + $detailsArray[i].value + "</span></div></div>");
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
    $('.primary-images .carousel-nav').slick('unslick');
    $('.zoom-carousel').slick('unslick');
    $('.zoom-carousel-slider').slick('unslick');

    // Update primary images
    var $primaryImageUrls = response.product.images;
    $primaryImageUrls.pdp600.forEach(function (imageUrl, idx) {
        $productContainer.find('.primary-images .cs-carousel-wrapper').find('img').eq(idx)
            .attr('src', imageUrl.url);
        $productContainer.find('.primary-images .cs-carousel-wrapper').find('picture source:nth-child(1)').eq(idx)
            .attr('srcset', imageUrl.url);
        $productContainer.find('.primary-images .cs-carousel-wrapper').find('picture source:nth-child(2)').eq(idx)
            .attr('srcset', imageUrl.url);
    });

    // Update primary images indicators
    var $primaryImageindiCatorsUrls = response.product.images;
    $primaryImageindiCatorsUrls.tile150.forEach(function (imageUrl, idx) {
        $productContainer.find('.primary-images .carousel-nav').find('img').eq(idx)
            .attr('src', imageUrl.url);
        $productContainer.find('.primary-images .carousel-nav').find('picture source:nth-child(1)').eq(idx)
            .attr('srcset', imageUrl.url);
        $productContainer.find('.primary-images .carousel-nav').find('picture source:nth-child(2)').eq(idx)
            .attr('srcset', imageUrl.url);
    });

    // Update model primary images
    var $ZoomCarousel = $('.zoom-carousel');
    $ZoomCarousel.empty();
    var $primaryImageZoomUrls = response.product.images;
    $primaryImageZoomUrls.zoom1660.forEach(function (imageUrl) {
        $ZoomCarousel.append('<div class="carousel-tile zoomit" data-thumb="' + imageUrl.url + '"><picture><source media="(min-width: 992px)" srcset="' + imageUrl.url + '"><source media="(max-width: 991px)" srcset="' + imageUrl.url + '"><img class="normal-zoom" src="' + imageUrl.url + '" alt="Coronada Ceramic" itemprop="image" data-zoom-mobile-url="' + imageUrl.url + '" data-zoom-desktop-url="' + imageUrl.url + '"></picture></div>');
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

    // Update pricing
    if (!isChoiceOfBonusProducts) {
        var $priceSelector = $('.prices .price', $productContainer).length
            ? $('.prices .price', $productContainer)
            : $('.prices .price');
        $priceSelector.replaceWith(response.product.price.html);
    }

    // Update promotions
    $('div[data-pid="'+$productContainer.data('pid')+'"]').find('.promotions').empty().html(getPromotionsHtml(response.product.promotions));

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
                updateOptions(data.product.options, $productContainer);
                updateQuantities(data.product.quantities, $productContainer);
                handleOptionsMessageErrors(data.validationErrorEmbossed, data.validationErrorEngraved, $productContainer);
                var listrakTracking = require('movado/listrakActivityTracking.js');
                listrakTracking.listrackProductTracking();
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

/**
 * Retrieves url to use when adding a product to the cart
 *
 * @return {string} - The provided URL to use when adding a product to the cart
 */
function getAddToCartUrl() {
    return $('.add-to-cart-url').val();
}

/**
 * Parses the html for a modal window
 * @param {string} html - representing the body and footer of the modal window
 *
 * @return {Object} - Object with properties body and footer.
 */
function parseHtml(html) {
    var $html = $('<div>').append($.parseHTML(html));

    var body = $html.find('.bonus-product-wrapper');
    var footer = $html.find('.modal-footer').children();

    return { body: body, footer: footer };
}

/**
 * Retrieves url to use when adding a product to the cart
 *
 * @param {Object} data - data object used to fill in dynamic portions of the html
 */
function chooseBonusProducts(data) {
    $('.modal-body').spinner().start();

    if ($('#chooseBonusProductModal').length !== 0) {
        $('#chooseBonusProductModal').remove();
    }
    var bonusUrl;
    if (data.bonusChoiceRuleBased) {
        bonusUrl = data.showProductsUrlRuleBased;
    } else {
        bonusUrl = data.showProductsUrlListBased;
    }

    var htmlString = '<!-- Modal -->'
        + '<div class="modal fade" id="chooseBonusProductModal" role="dialog">'
        + '<div class="modal-dialog choose-bonus-product-dialog" '
        + 'data-total-qty="' + data.maxBonusItems + '"'
        + 'data-UUID="' + data.uuid + '"'
        + 'data-pliUUID="' + data.pliUUID + '"'
        + 'data-addToCartUrl="' + data.addToCartUrl + '"'
        + 'data-pageStart="0"'
        + 'data-pageSize="' + data.pageSize + '"'
        + 'data-moreURL="' + data.showProductsUrlRuleBased + '"'
        + 'data-bonusChoiceRuleBased="' + data.bonusChoiceRuleBased + '">'
        + '<!-- Modal content-->'
        + '<div class="modal-content">'
        + '<div class="modal-header">'
        + '<span class="">' + data.labels.selectprods + '</span>'
        +'<button type="button" class="close pull-right" data-dismiss="modal" aria-label="Close">'
        +'<span class="text-uppercase close-icon">Close</span>'
        +'</button>'
        + '</div>'
        + '<div class="modal-body"></div>'
        + '<div class="modal-footer"></div>'
        + '</div>'
        + '</div>'
        + '</div>';
    $('body').append(htmlString);
    $('.modal-body').spinner().start();

    $.ajax({
        url: bonusUrl,
        method: 'GET',
        dataType: 'html',
        success: function (html) {
            var parsedHtml = parseHtml(html);
            $('#chooseBonusProductModal .modal-body').empty();
            $('#chooseBonusProductModal .modal-body').html(parsedHtml.body);
            $('#chooseBonusProductModal .modal-footer').html(parsedHtml.footer);
            $('#chooseBonusProductModal').modal('show');
            $.spinner().stop();
        },
        error: function () {
            $.spinner().stop();
        }
    });
}



/**
 * Updates the Mini-Cart quantity value after the customer has pressed the "Add to Cart" button
 * @param {string} response - ajax response from clicking the add to cart button
 */
function handlePostCartAdd(response) {
    $('.minicart').trigger('count:update', response);
    var messageType = response.error ? 'text-danger' : 'text-success';
    // show add to cart modal
    $('#addToCartModal .modal-body').html(response.message);
    $('#addToCartModal .modal-body p').addClass(messageType);
    if (typeof setAnalyticsTrackingByAJAX !== 'undefined') {
        if(response.cartAnalyticsTrackingData !== undefined) {
            setAnalyticsTrackingByAJAX.cartAnalyticsTrackingData = response.cartAnalyticsTrackingData;
            window.dispatchEvent(setAnalyticsTrackingByAJAX);
        }
        if(response.addCartGtmArray !== undefined){
        	 $('body').trigger('addToCart:success', JSON.stringify(response.addCartGtmArray));
        }	
    }
    if (response.newBonusDiscountLineItem
        && Object.keys(response.newBonusDiscountLineItem).length !== 0) {
        chooseBonusProducts(response.newBonusDiscountLineItem);
    } else {
        $('#addToCartModal').modal('show');
        $('.slick-slider').slick('refresh');
    }
}

/**
 * Retrieves the bundle product item ID's for the Controller to replace bundle master product
 * items with their selected variants
 *
 * @return {string[]} - List of selected bundle product item ID's
 */
function getChildProducts() {
    var childProducts = [];
    $('.bundle-item').each(function () {
        childProducts.push({
            pid: $(this).find('.product-id').text(),
            quantity: parseInt($(this).find('label.quantity').data('quantity'), 10)
        });
    });

    return childProducts.length ? JSON.stringify(childProducts) : [];
}

/**
 * Retrieve product options
 *
 * @param {jQuery} $productContainer - DOM element for current product
 * @return {string} - Product options and their selected values
 */
function getOptions($productContainer) {
    var options = $productContainer
        .find('.product-option')
        .map(function () {
            var $elOption = $(this).find('.options-select, input[type="radio"]:checked');
            var urlValue = $elOption.val();
            var selectedValueId;
            if ($elOption.is("input")) {
                selectedValueId = $elOption.data('value-id');
            } else {
                selectedValueId = $elOption.find('option[value="' + urlValue + '"]')
                .data('value-id');
            }
            return {
                optionId: $(this).data('option-id'),
                selectedValueId: selectedValueId
            };
        }).toArray();

    return JSON.stringify(options);
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

var updateCartPage = function(data) {
  $('.cart-section-wrapper').html(data.cartPageHtml);
  if (Resources.AFFIRM_PAYMENT_METHOD_STATUS) {
        affirm.ui.ready(function() {
            affirm.ui.refresh();
        });
   } 
};

module.exports = {
    attributeSelect: attributeSelect,
    methods: {
        editBonusProducts: function (data) {
            chooseBonusProducts(data);
        }
    },
    colorAttribute: function () {
        $(document).on('click', '[data-attr="color"] a', function (e) {
            e.preventDefault();

            if ($(this).attr('disabled')) {
                return;
            }
            var $productContainer = $(this).closest('.set-item');
            if (!$productContainer.length) {
                $productContainer = $(this).closest('.product-detail');
            }

            attributeSelect(e.currentTarget.href, $productContainer);
        });
    },

    selectAttribute: function () {
        var selector = '.set-item select[class*="select-"], .product-detail select[class*="select-"], .options-select, .product-option input[type="radio"]';
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
    },

    setOptionsAttribute: function() {
        $(document).off('click', '.togglePersonalizationOpt');
        $(document).off('submit', 'form[name="embossing"], form[name="engraving"]');
        $(document).on('click', '.togglePersonalizationOpt', function (e) {
            var target = e.currentTarget || e.target;
            var optionContainer = $(target).parent();
            optionContainer.toggleClass('active');
            $(optionContainer).find('.attribute-text').toggle();
            if (!optionContainer.hasClass('active')) {
                removeOption($(optionContainer).closest(".product-detail"));
            }
        });

        $(document).on('click', 'form[name="embossing"] button, form[name="engraving"] button', function (e) {
            e.preventDefault();
            var $this = $(this).closest("form");
            validateOptions($this);
            var isOptionsValid = $this.valid();


            if (isOptionsValid) {

                if($this.hasClass('submitted')) {
                    removeOption($this);
                } else {
                    $this.addClass('submitted');
                    $(this).addClass('submitted');
                    $this.find('input[type="text"], textarea').attr("readonly", true);
                    $this.find('input[type="radio"]').eq(1).prop('checked', true).change();
                }
            }

        });
    },

    availability: function () {
        $(document).on('change', '.quantity-select', function (e) {
            e.preventDefault();

            var $productContainer = $(this).closest('.product-detail');
            if (!$productContainer.length) {
                $productContainer = $(this).closest('.modal-content').find('.product-quickview');
            }

            if ($('.bundle-items', $productContainer).length === 0) {
                attributeSelect($(e.currentTarget).find('option:selected').data('url'),
                    $productContainer);
            }
        });
    },

    addToCart: function () {
        $(document).off('click.addToCart').on('click.addToCart', 'button.add-to-cart, button.add-to-cart-global', function (e) {
            var addToCartUrl;
            var pid;
            var pidsObj;
            var setPids;
            var giftPid;

            $('body').trigger('product:beforeAddToCart', this);

            if ($('.set-items').length && $(this).hasClass('add-to-cart-global')) {
                setPids = [];

                $('.product-detail').each(function () {
                    if (!$(this).hasClass('product-set-detail')) {
                        setPids.push({
                            pid: $(this).find('.product-id').text(),
                            qty: $(this).find('.quantity-select').val(),
                            options: getOptions($(this))
                        });
                    }
                });
                pidsObj = JSON.stringify(setPids);
            }

            if ($(this).closest('.product-detail') && $(this).closest('.product-detail').data('isplp') == true) {
                pid = $(this).data('pid');
                if ($('.gift-allowed-checkbox').is(":checked")) {
                    giftPid = $('.gift-allowed-checkbox').val();
                }
            } else {
            	pid = getPidValue($(this));
                if ($('.gift-allowed-checkbox').is(":checked")) {
                    giftPid = $('.gift-allowed-checkbox').val();
                }
            }

            var $productContainer = $(this).closest('.product-detail');
            if (!$productContainer.length) {
                $productContainer = $(this).closest('.quick-view-dialog').find('.product-detail');
            }

            addToCartUrl = getAddToCartUrl();

            var form = {
                pid: pid,
                pidsObj: pidsObj,
                childProducts: getChildProducts(),
                quantity: getQuantitySelected($(this)),
                giftPid: giftPid ? giftPid : ''
            };

            /**
             * Custom Start: Add to cart form for MVMT
             */
            if ($('.pdp-mvmt')) {
                form = {
                    pid: pid,
                    pidsObj: pidsObj,
                    childProducts: getChildProducts(),
                    quantity: 1,
                    giftPid: giftPid ? giftPid : ''
                };
            }
            /**
             *  Custom End
             */

            /**
             * Custom Start: Clyde Integration
             */
            if (window.Resources && window.Resources.IS_CLYDE_ENABLED) {
                form = clydeWidget.getSelectedClydeContract(form);
            }
            /**
             * Custom end:
             */
            $productContainer.find('input[type="text"], textarea').filter('[required]')
            .each(function() {
                if($(this).val() && $(this).closest("form.submitted").length) {
                    Object.assign(form, {
                        [$(this).data('name')]: $(this).val()
                    });
                }
            });

            if (!$('.bundle-item').length) {
                form.options = getOptions($productContainer);
            }
            form.currentPage = $('.page[data-action]').data('action') || '';
            $(this).trigger('updateAddToCartFormData', form);
            if (addToCartUrl) {
                $.ajax({
                    url: addToCartUrl,
                    method: 'POST',
                    data: form,
                    success: function (data) {
                        updateCartPage(data);
                        handlePostCartAdd(data);
                        $('body').trigger('product:afterAddToCart', data);
                        $.spinner().stop();
                        //Custom Start: [MSS-1451] Listrak SendSCA on AddToCart
                        if (window.Resources.LISTRAK_ENABLED) {
                            var ltkSendSCA = require('listrak_custom/ltkSendSCA');
                            ltkSendSCA.renderSCA(data.SCACart, data.listrakCountryCode);
                        }
                        //Custom End
                        $(window).resize(); // This is used to fix zoom feature after add to cart
                    },
                    error: function () {
                        $.spinner().stop();
                    }
                });
            }
        });
    },
    selectBonusProduct: function () {
        $(document).on('click', '.select-bonus-product', function () {
            var $choiceOfBonusProduct = $(this).parents('.choice-of-bonus-product');
            var pid = $(this).data('pid');
            var maxPids = $('.choose-bonus-product-dialog').data('total-qty');
            var submittedQty = parseInt($(this).parents('.choice-of-bonus-product').find('.bonus-quantity-select').val(), 10);
            if(isNaN(submittedQty)) {
            	submittedQty = 1;
            }
            var totalQty = 0;
            $.each($('#chooseBonusProductModal .selected-bonus-products .selected-pid'), function () {
                totalQty += $(this).data('qty');
            });
            totalQty += submittedQty;
            var optionID = $(this).parents('.choice-of-bonus-product').find('.product-option').data('option-id');
            var valueId = $(this).parents('.choice-of-bonus-product').find('.options-select option:selected').data('valueId');
            if (totalQty <= maxPids) {
                var selectedBonusProductHtml = ''
                + '<div class="selected-pid row" '
                + 'data-pid="' + pid + '"'
                + 'data-qty="' + submittedQty + '"'
                + 'data-optionID="' + (optionID || '') + '"'
                + 'data-option-selected-value="' + (valueId || '') + '"'
                + '>'
                + '<div class="col-sm-11 col-9 bonus-product-name" >'
                + $choiceOfBonusProduct.find('.product-name').html()
                + '</div>'
                + '<div class="col-1"><i class="fa fa-times" aria-hidden="true"></i></div>'
                + '</div>'
                ;
                $('#chooseBonusProductModal .selected-bonus-products').append(selectedBonusProductHtml);
                $('.pre-cart-products').html(totalQty);
                $('.selected-bonus-products .bonus-summary').removeClass('alert-danger');
            } else {
                $('.selected-bonus-products .bonus-summary').addClass('alert-danger');
            }
        });
    },
    removeBonusProduct: function () {
        $(document).on('click', '.selected-pid', function () {
            $(this).remove();
            var $selected = $('#chooseBonusProductModal .selected-bonus-products .selected-pid');
            var count = 0;
            if ($selected.length) {
                $selected.each(function () {
                    count += parseInt($(this).data('qty'), 10);
                });
            }

            $('.pre-cart-products').html(count);
            $('.selected-bonus-products .bonus-summary').removeClass('alert-danger');
        });
    },
    enableBonusProductSelection: function () {
        $('body').on('bonusproduct:updateSelectButton', function (e, response) {
            $('button.select-bonus-product', response.$productContainer).attr('disabled',
                (!response.product.readyToOrder || !response.product.available));
            var pid = response.product.id;
            $('button.select-bonus-product').data('pid', pid);
        });
    },
    showMoreBonusProducts: function () {
        $(document).on('click', '.show-more-bonus-products', function () {
            var url = $(this).data('url');
            $('.modal-content').spinner().start();
            $.ajax({
                url: url,
                method: 'GET',
                success: function (html) {
                    var parsedHtml = parseHtml(html);
                    $('.modal-body').append(parsedHtml.body);
                    $('.show-more-bonus-products:first').remove();
                    $('.modal-content').spinner().stop();
                },
                error: function () {
                    $('.modal-content').spinner().stop();
                }
            });
        });
    },
    addBonusProductsToCart: function () {
        $(document).on('click', '.add-bonus-products', function () {
            var $readyToOrderBonusProducts = $('.choose-bonus-product-dialog .selected-pid');
            var queryString = '?pids=';
            var url = $('.choose-bonus-product-dialog').data('addtocarturl');
            var pidsObject = {
                bonusProducts: []
            };

            $.each($readyToOrderBonusProducts, function () {
                var qtyOption =
                    parseInt($(this)
                        .data('qty'), 10);

                var option = null;
                if (qtyOption > 0) {
                    if ($(this).data('optionid') && $(this).data('option-selected-value')) {
                        option = {};
                        option.optionId = $(this).data('optionid');
                        option.productId = $(this).data('pid');
                        option.selectedValueId = $(this).data('option-selected-value');
                    }
                    pidsObject.bonusProducts.push({
                        pid: $(this).data('pid'),
                        qty: qtyOption,
                        options: [option]
                    });
                    pidsObject.totalQty = parseInt($('.pre-cart-products').html(), 10);
                }
            });
            queryString += JSON.stringify(pidsObject);
            queryString = queryString + '&uuid=' + $('.choose-bonus-product-dialog').data('uuid');
            queryString = queryString + '&pliuuid=' + $('.choose-bonus-product-dialog').data('pliuuid');
            $.spinner().start();
            $.ajax({
                url: url + queryString,
                method: 'POST',
                success: function (data) {
                    $.spinner().stop();
                    if (data.error) {
                        $('.error-choice-of-bonus-products')
                        .html(data.errorMessage);
                    } else {
                        $('.configure-bonus-product-attributes').html(data);
                        $('.bonus-products-step2').removeClass('hidden-xl-down');
                        $('#chooseBonusProductModal').modal('hide');

                        if ($('.add-to-cart-messages').length === 0) {
                            $('body').append(
                            '<div class="add-to-cart-messages"></div>'
                         );
                        }
                        $('.minicart-quantity').html(data.totalQty);
                        setTimeout(function () {
                            $('.add-to-basket-alert').remove();
                            if ($('.cart-page').length) {
                                location.reload();
                            }
                        }, 3000);
                    }
                },
                error: function () {
                    $.spinner().stop();
                }
            });
        });
    },
    showAddToCartModalAfterBonusProductModal: function () {
    	$(document).on('hidden.bs.modal','#chooseBonusProductModal', function () {
            if($.trim($('#addToCartModal .modal-body').html())) {
            	$('#addToCartModal').modal('show');
            	$('.slick-slider').slick('refresh');
            }
    	});
    },

    getPidValue: getPidValue,
    getQuantitySelected: getQuantitySelected
};