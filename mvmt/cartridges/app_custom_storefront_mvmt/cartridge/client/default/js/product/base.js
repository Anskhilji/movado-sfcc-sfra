'use strict';

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
        html += '<div class="row" >' + promotion.details + 
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

$('#strapguide').on('click', function (e) {
    $('#strapguid').modal();
});

/**
 * Add zoom in functionality in PDP Primary images
 */
function zoomfeature () {
    var t = '.main-mvmt-carousel .carousel-tile';
    $(t).trigger('zoom.destroy');
    var n = $('.main-mvmt-carousel .slick-active').find('img').attr('src');
    $(window).width() > 767 ? ($(t).trigger('zoom.destroy'), $(t).zoom({
        url: n,
        magnify: 1.1,
        on: 'click',
        target: $('.zoom-box'),
        onZoomIn: function() {
            $('.zoom-box').addClass('zoom-active');
            $('.zoom-out').addClass('active');
        },
        onZoomOut: function() {
            $('.zoom-box').removeClass('zoom-active');
            $('.zoom-out').removeClass('active');
        }
    })) : (
    $(t).addClass('disabled'),
    $(t).trigger('zoom.destroy'),
    $(document).on('click', '.zoom-icon.zoom-in', (function(a) {
        $(t).hasClass('disabled') && ($('.zoom-icon.zoom-out').addClass('is-active'),
        $(t).removeClass('disabled'),
        $(t).zoom({
            url: n,
            magnify: 1.1,
            on: 'click',
            target: $('.zoom-box'),
            onZoomIn: function() {
                $('.zoom-box').addClass('zoom-active');
            },
            onZoomOut: function() {
                $('.zoom-box').removeClass('zoom-active')
            }
        }))
    })),
    $(document).on('click', '.zoom-icon.zoom-out, .zoom-check', (function(n) {
        $('.zoom-icon.zoom-out').hasClass('is-active') && ($(t).addClass('disabled'),
        $('.zoom-icon.zoom-out').removeClass('is-active'),
        $(t).trigger('zoom.destroy'))
    })));

}


/**
 *  CovertsPDP Primary Images to Slider
 */
function initializePDPMainSlider() {
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
            var thumb = $(slick.$slides[index]).find('.carousel-tile').data('thumb');
            return '<button class="tab"> <img  src="'+ thumb +'" /> </button>';
        },
    });
}

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

    //  Remove Zoom and slick slider
    $('.main-mvmt-carousel .carousel-tile').trigger('zoom.destroy'); 
    $('.primary-images .main-mvmt-carousel').slick('unslick');
    // Update primary images
    var primaryImageUrls = response.product.images;
    primaryImageUrls.zoom1660.forEach(function (imageUrl, idx) {
        $productContainer.find('.primary-images .cs-carousel-wrapper').find('img').eq(idx)
            .attr('src', imageUrl.url);
        $productContainer.find('.primary-images .cs-carousel-wrapper').find('.carousel-tile').eq(idx)
            .attr('data-thumb', imageUrl.url);
        $productContainer.find('.primary-images .cs-carousel-wrapper').find('picture source').eq(idx)
            .attr('srcset', imageUrl.url);
    });
    // Attach Slider and Zoom
    zoomfeature(); 
    initializePDPMainSlider();

    // Update pricing
    if (!isChoiceOfBonusProducts) {
        var $priceSelector = $('.prices .price', $productContainer).length
            ? $('.prices .price', $productContainer)
            : $('.prices .price');
        $priceSelector.replaceWith(response.product.price.html);
        // Custom Start
        var $readyToOrder = response.product.readyToOrder;
        var $barSalePriceSelector = $('.sticky-bar-price .price');
        var $mobilePrice = $('.product-price-mobile .price, .add-to-cart-price-holder');
        $mobilePrice.replaceWith(response.product.price.html);
        $barSalePriceSelector.replaceWith(response.product.price.html);
        if ($readyToOrder) {
            $mobilePrice.removeClass('d-none');
            $barSalePriceSelector.removeClass('d-none');
        } else {
            $mobilePrice.addClass('d-none');
            $barSalePriceSelector.addClass('d-none');
        }
        var $productNameSelector = $('.product-name');
        $productNameSelector.text(response.product.productName);
        var $selectedVariation = $('.current-selected-variation');
        var $variationAttributes = response.product.variationAttributes;
        
        for (var i = 0; i < $variationAttributes.length; i++) {
            $variationAttributes[i].values.forEach(function (item) {
                if (item.selected === true) {
                    $selectedVariation.text(item.displayValue);
                }
            });
        }
        
        $selectedVariation.removeClass('current-selected-variation');
        var $variationProductURL = '/on/demandware.store/Sites-MVMTUS-Site/default/Product-Variation?pid=' + response.product.id;
        
        $.ajax({
            url: $variationProductURL,
            method: 'GET',
            success: function (data) {
                var $linkedProductList = $('.linked-product-list');
                $linkedProductList.replaceWith(data.linkedProductTemplate);
                $('.linked-products').slick({
                    slidesToShow: 3,
                    slidesToScroll: 1,
                    focusOnSelect: true,
                    infinite: false,
                    dots: false,
                    arrows: true,
                });
            },
            error: function () {
            }
        });
        // Custom End
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
 * updates the product view when a product attribute is selected or deselected or when
 *         changing quantity
 * @param {string} selectedValueUrl - the Url for the selected variation value
 * @param {jQuery} $productContainer - DOM element for current product
 */
function attributeSelect(selectedValueUrl, $productContainer) {
    if (selectedValueUrl) {

        selectedValueUrl = new URL(selectedValueUrl);

        $productContainer.find('input[type="text"], textarea').filter('[required]:visible')
        .each( function() {
            if ($(this).val() && $(this).closest("form.submitted").length) {
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
  affirm.ui.refresh();
};


var selector = '.set-item select[class*="select-"], .product-detail select[class*="select-"], .options-select, .product-option input[type="radio"], .select-variation-product';
$(document).off('change', selector);
$(document).off('click').on('click', selector, function (e) {
    e.preventDefault();
    var selectedVariation = ('span.selected-variation');
    $(this).siblings().removeClass('active');
    if ( $(this).hasClass('color-variation') ) {
        $(selector).removeClass('active');
        $(selectedVariation).empty();
    }
    $(this).parents('.attribute').find(selectedVariation).addClass('current-selected-variation');
    $(this).addClass('active');
    var value = $(e.currentTarget).is('input[type="radio"]') ? $(e.currentTarget).data('value-url') : e.currentTarget.value;

    var $productContainer = $(this).closest('.set-item');
    if (!$productContainer.length) {
        $productContainer = $(this).closest('.product-detail');
    }
    attributeSelect(value, $productContainer);
});

