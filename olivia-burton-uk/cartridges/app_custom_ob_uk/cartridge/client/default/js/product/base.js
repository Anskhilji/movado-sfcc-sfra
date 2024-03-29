'use strict';
if(Resources.IS_CLYDE_ENABLED) {
    var clydeWidget = require('link_clyde/getClydeWidget.js');
}

function initializePrimarySlider() {
    $('.primary-images .main-ob-carousel').slick({
        lazyLoad: 'ondemand',
        slidesToShow: 1,
        slidesToScroll: 1,
        dots: true,
        arrows:true,

        responsive: [{
            breakpoint: 768,
            settings: {
              slidesToShow: 1,
              slidesToScroll: 1,
              arrows: false
            }
          }],
        customPaging: function (slick, index) {
            var thumb = $(slick.$slides[index]).find('.carousel-tile').attr('data-thumb');
            return '<button class="tab"> <img  src="'+ thumb +'" /> </button>';
        },
    });
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
        pid = $($el).closest('.product-detail').data('pid');
    } else if ($($el).closest('.recomended-products') && $($el).closest('.recomended-products').data('recomendation') == true) {
        pid = $($el).data('pid');
    } else if ($($el).closest('.recomended-products-redesign ') && $($el).closest('.recomended-products-redesign ').data('recomendation') == true) {
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
 * Retrieves the value associated with the Quantity pull-down menu
 * @param {jquery} $el - DOM container for the relevant quantity
 * @return {string} - value found in the quantity input
 */
function getQuantitySelected($el) {
    return getQuantitySelector($el).val();
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
    var $selectedValueContainer = $productContainer.find('[data-selected-variation-attr="' + attr.id + '"]');
    $selectedValueContainer.empty();
    attr.values.forEach(function (attrValue) {
        var $attrValue = $productContainer.find('[data-attr="' + attr.id + '"] [data-attr-value="' +
            attrValue.value + '"]');
        var $swatchAnchor = $attrValue.parent();

        if (attrValue.selected) {
            $swatchAnchor.addClass('active');
            $swatchAnchor.parent().addClass('active');
            $selectedValueContainer.text(attrValue.displayValue);
        } else {
            $swatchAnchor.removeClass('active');
            $swatchAnchor.parent().removeClass('active');
        }

        if (attrValue.url) {
            $swatchAnchor.attr('href', attrValue.url);
        } else {
            $swatchAnchor.removeAttr('href');
        }

        // Disable if not selectable
        if (!attrValue.selectable) {
            $swatchAnchor.addClass('disabled');
        } else {
            $swatchAnchor.removeClass('disabled')
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
    var $selectedValueContainer = $productContainer.find('[data-selected-variation-attr="' + attr.id + '"]');
    $selectedValueContainer.empty();
    var $attr = '[data-attr="' + attr.id + '"]';
    var $defaultOption = $productContainer.find($attr + ' .select-' + attr.id + ' option:first');
    $defaultOption.attr('value', attr.resetUrl);

    attr.values.forEach(function (attrValue) {
        var $attrValue = $productContainer
            .find($attr + ' [data-attr-value="' + attrValue.value + '"]');
        $attrValue.attr('value', attrValue.url)
            .removeAttr('disabled');

        if (!attrValue.selectable) {
            $attrValue.addClass('disabled');
        } else {
            $attrValue.removeClass('disabled')
        }

        if (attrValue.selected) {
            $attrValue.addClass('active');
            $selectedValueContainer.text(attrValue.displayValue);
        } else {
            $attrValue.removeClass('active');
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
    var $availabilityValue = '';
    var $availabilityMessages = response.product.availability.messages;
    var $productATSValue = response.product.productATSValue;
    var $lowStockThreshold = window.Resources.LOW_STOCK_THRESHOLD;
    var $inStockText = window.Resources.LABEL_IN_STOCK;
    var $preOrderText = window.Resources.INFO_PRODUCT_AVAILABILITY_PREORDER;
    var $backOrderText = window.Resources.INFO_PRODUCT_AVAILABILITY_BACK_ORDER;
    var $lowStockMessage = window.Resources.LOW_STOCK_MESSAGE;

    if (!response.product.readyToOrder) {
        $availabilityValue = '<div>' + response.resources.info_selectforstock + '</div>';
    } else {
        if ($productATSValue && $lowStockThreshold && $productATSValue <= $lowStockThreshold) {
            $availabilityMessages.forEach(function (message) {
                if (message === $inStockText || message === $preOrderText || message === $backOrderText) {
                    $availabilityValue += '<div>' + $lowStockMessage + '</div>';
                } else {
                    $availabilityValue += '<div>' + message + '</div>';
                }
            });
        } else {
            $availabilityMessages.forEach(function (message) {
                $availabilityValue += '<div>' + message + '</div>';
            });
        }
    }

    $($productContainer).trigger('product:updateAvailability', {
        product: response.product,
        $productContainer: $productContainer,
        message: $availabilityValue,
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
        html += '<span class="promo-icon"><div class="callout pt-2" title="' + promotion.details + '">' + promotion.calloutMsg +
            '</div></span>';
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
        $productOptionContainer.find('input[name="orientation"]').attr('disabled', false).change();
        $productOptionContainer.find('.default-checked-radio-button').prop('checked', true).trigger('click').change();
    }

    $productOptionContainer.find("button").removeClass('submitted');
    $productOptionContainer.find('input[type="text"], textarea').removeAttr("readonly");
    $productOptionContainer.find('input[type="radio"]:eq(0)').prop('checked', true).change();
    $productOptionContainer.find('input[name="orientation"]').attr('disabled', false).change();
    $productOptionContainer.closest('form').validate().resetForm();
}

function handleOptionsMessageErrors(embossedMessageError, engravedMessageError, $productContainer, OptionsValidationError) {
    var optionForm;
    if (embossedMessageError) {
        optionForm = $productContainer.find('form[name="embossing"]');
        optionForm.removeClass('submitted');
        optionForm.find("button").removeClass('submitted');
        optionForm.find('input[type="text"], textarea').removeAttr("readonly");
        optionForm.find('input[type="radio"]').eq(0).prop('checked', true);
        optionForm.find('input[name="orientation"]').attr('disabled', false).change();
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
    if (!OptionsValidationError) {
        $('.popup-opened').hide();
    }
}

function initializeZoom() {
    var $zoomedImageContainer = $('.zoomedImage');
    if($zoomedImageContainer.length > 0) {
        var $zoomedImage = $zoomedImageContainer.find('img');
        var $primaryImageCarousel = $('.primary-images .js-carousel');
        /* eslint-disable  new-cap, no-undef */
        var pinchZoom = PinchZoom;
        var pz = pinchZoom && new pinchZoom.default($zoomedImageContainer[0]);
        /* eslint-enable */
    }

    $('body').on('click', '.js-zoom-image', function (evt) {
        evt.preventDefault();
        var $activeImage = $primaryImageCarousel.find('.slick-active img');
        var imageUrl = matchMedia('(max-width: 991px)').matches ? $activeImage.data('zoom-mobile-url') : $activeImage.data('zoom-desktop-url');
        if ($zoomedImage.attr('src') !== imageUrl) {
            $zoomedImage.attr('src', imageUrl);
        }
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

    //Update Product family name
    if (typeof response.product.collectionName !== 'undefined' && response.product.collectionName !== '' && response.product.collectionName !== null) {
        $productContainer.find('.family-name').text(response.product.collectionName);
    }

    //Update Product Title
    if (typeof response.product.productName !== 'undefined' && response.product.productName !== '' && response.product.productName !== null) {
        $productContainer.find('.product-name').text(response.product.productName);
    }

    //Update product pageDescription
    if (typeof response.product.pageDescription !== 'undefined' && response.product.pageDescription !== '' && response.product.pageDescription !== null) {
        $productContainer.find('.description .content').text(response.product.pageDescription);
    }

    //Update product long Description
    $('.product-detail-redesign .description-and-detail').find('.bottom-description .long-description-text').empty();
    if (typeof response.product.longDescription !== 'undefined' && response.product.longDescription !== '' && response.product.longDescription !== null) {
        $('.product-detail-redesign .description-and-detail').find('.bottom-description .long-description-text').text(response.product.longDescription);
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
    var $backInStockContanier = $('.listrak-back-in-stock-notification-container-main ');
    if ($backInStockContanier.length > 0) {
        $backInStockContanier.data('pid', response.product.id);
        if (response.product.isBackInStockEnabled) {
            $backInStockContanier.removeClass('d-none');
        } else {
            $backInStockContanier.addClass('d-none');
        }
    }

    /**
    * Custom End:
    */

    // Update variation id to google pay
    if (window.Resources.GOOGLE_PAY_ENABLED) {
        $('.google-pay-container').data('pid', response.product.id);
    }

    //update pdp Detailed Attributes
    var $detailsArray = response && response.product ? response.product.pdpDetailedAttributes : null;
    $('.product-attributes .details-img').find('img').attr('src', response.product && response.product.images && response.product.images.pdp533[2] && response.product.images.pdp533[2].url ? response.product.images.pdp533[2].url : response.product && response.product.images && response.product.images.pdp533[1] && response.product.images.pdp533[1].url ? response.product.images.pdp533[1].url : response.product && response.product.images && response.product.images.pdp533[0] && response.product.images.pdp533[0].url ? response.product.images.pdp533[0].url : '');
    $('.product-attributes .details-list').remove();
    if ($detailsArray) {
        var $maxCloumnItems = $detailsArray.length > 6 ? (response.product.pdpDetailedAttributes.length > 7 ? 6 : 5): 6;
        if ($maxCloumnItems > 0) {
            var $counter = 1;
            for (var i = 0; i < $detailsArray.length; i++) {
                if ($counter == 1) {
                    $('.product-attributes .details-list-height').append("<div class='details-list'>")
                }
                $('.product-attributes .details-list:last').append("<div class='attribute-detail'><span class='attribute-name'>"+ $detailsArray[i].displayName +"</span><h3 class='attribute-value'>"+ $detailsArray[i].value+"</h3></div>");
                if ($counter % $maxCloumnItems == 0 || $detailsArray.length == $counter) {
                    $('.product-attributes .details-list').append("</div>");
                    if ($detailsArray.length != $counter) {
                        $('.product-attributes .details-list-height').append("<div class='details-list'>");
                    }
                }
                $counter = $counter + 1;
            }
        }
    }

    // unslick Carousel
    $('.primary-images .main-ob-carousel').slick('unslick');

    var primaryImageUrls = response.product.images;
    $('.pdp-images-carousel-removal').remove();
    $('.zoom-modal').remove();
    $('.pdp-images-carousel-addition').prepend(response.pdpCarouselImages);

    // Update pricing
    if (!isChoiceOfBonusProducts) {
        var $priceSelector = $('.prices .price', $productContainer).length
            ? $('.prices .price', $productContainer)
            : $('.prices .price');
        $priceSelector.replaceWith(response.product.price.html);
    }

    // Update promotions
    $('.product-top-detail').find('.promotions').empty().html(getPromotionsHtml(response.product.promotions));

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
    initializePrimarySlider();
    initializeZoom();

    $(document).ready(function () {
        var $availabilityWrapper = $('.product-availability .availability-msg').text();
        var $cartWrapper = $('.cart-and-ipay');
        var $stickyWrapper = $('.cart-sticky-wrapper-btn .cart-and-ipay');

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

        $productContainer.find('input[type="text"], textarea, input[type="radio"]:checked').filter('[required]:visible')
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
                handleOptionsMessageErrors(data.validationErrorEmbossed, data.validationErrorEngraved, $productContainer, data.OptionsValidationError);
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
function handlePostCartAdd(response, addToCartRecommendationButton, currentRecommendedProduct, addToCartButtonText) {
    $('.minicart').trigger('count:update', response);
    var messageType = response.error ? 'text-danger' : 'text-success';

    if ($('#addToCartModal').hasClass('addToCartModal-wrapper')) {
        if(response.error == false) {
            $('#addToCartModal').addClass('add-to-cart-redesign')
            $('.recomendation-carousel-wrapper').removeClass('d-none');
            $('#addToCartModal').removeClass('addToCartError');
            if (!$('.recommendation-add-to-cart-error').hasClass('d-none')) {
                $('.recommendation-add-to-cart-error').addClass('d-none');
            }
        } else {
            $('#addToCartModal').addClass('addToCartError');
            $('#addToCartModal').removeClass('add-to-cart-redesign');
            $('.recomendation-carousel-wrapper').addClass('d-none');
            if (addToCartRecommendationButton === true && response.error == true) {
                $('#addToCartModal').addClass('add-to-cart-redesign')
                $('.recomendation-carousel-wrapper').removeClass('d-none');
                $('#addToCartModal').removeClass('addToCartError');
                $('#addToCartModal .recommendation-add-to-cart-error').html(response.message);
                $('#addToCartModal .recommendation-add-to-cart-error p').addClass(messageType);
                $('.recommendation-add-to-cart-error').removeClass('d-none');
            } else {
                $('#addToCartModal').addClass('addToCartError');
                $('#addToCartModal').removeClass('add-to-cart-redesign');
                $('.recomendation-carousel-wrapper').addClass('d-none');
                if (!$('.recommendation-add-to-cart-error').hasClass('d-none')) {
                    $('.recommendation-add-to-cart-error').addClass('d-none');
                }
            }
        }
    }

    var $modalContent = $('.add-to-cart-modal-content');
    var $carouselContent = $('.new-rec-carosel-modal');
    var $footerContent = $('.add-to-cart-modal-content-footer');
    var $popUpContent = $('#addToCartModal .modal-success-text');

    // show add to cart modal
    if (addToCartRecommendationButton !== true) {
        if (response.error === true || response.error.errorText) {
            if ($modalContent.length > 0) {
                $($popUpContent).html($modalContent);
                $($popUpContent).addClass('d-none');
            }
            $('#addToCartModal .modal-body').html(response.message);
            $('#addToCartModal .modal-body p').addClass(messageType);
        } else {
            if ($modalContent.length > 0) {
                var $popUpContent = $modalContent;
            }
            
            if ($modalContent.length > 0) {
                $('#addToCartModal .modal-body').html($modalContent);
            } else {
                $('#addToCartModal .modal-body').html($popUpContent);
            }
            
            $modalContent.removeClass('d-none');
            $footerContent.removeClass('d-none');
            $('.recomendation-carousel-wrapper').html($carouselContent);
            $('#addToCartModal .modal-footer').html($footerContent);
            $('#addToCartModal .modal-body p').addClass(messageType);
        }
    } else {
        $footerContent.removeClass('d-none');
    }

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
        var $priceTitle = 'Estimated Cart Total: ';
        var $addToBagText = window.Resources.BUTTON_ADD_TO_BAG ? window.Resources.BUTTON_ADD_TO_BAG : '';
        var $addedToCartText = window.Resources.BUTTON_ADDED_TO_CART ? window.Resources.BUTTON_ADDED_TO_CART : '';
        var $addedToBagText = window.Resources.BUTTON_ADDED_TO_BAG ? window.Resources.BUTTON_ADDED_TO_BAG : '';

        if ($('#addToCartModal').find('.total-price').length > 0 && response && response.cart && response.cart.totals && response.cart.totals.grandTotal) {
            $('#addToCartModal').find('.total-price').text($priceTitle + response.cart.totals.grandTotal);
        }
        if (addToCartRecommendationButton !== undefined && addToCartRecommendationButton === true) {
            if (response.error !== true && !response.error.errorText) {
                var $currentProduct = currentRecommendedProduct ? currentRecommendedProduct : '';
                var $productIds = [];

                $('#addToCartModal .add-to-cart-plp-redesign').each(function () {
                    var $pid = $(this).data('rec-pid');
                    $productIds.push($pid);
                });

                if ($productIds.indexOf($currentProduct) > -1) {
                    var $currentAddedProduct = $('#addToCartModal').find('[data-rec-pid="' + $currentProduct + '"]').closest('.add-to-cart-plp-redesign');
                    $currentAddedProduct.addClass('active');
                    var $currentAddedProductText = $currentAddedProduct.find('.updated-text');

                    if (addToCartButtonText === $addToBagText) {
                        $currentAddedProductText.text($addedToBagText);
                    } else {
                        $currentAddedProductText.text($addedToCartText);
                    }
                }
            }
        }
        $('.slick-slider').slick('refresh');
        $('#addToCartModal').modal('show');
    }
}

function slickSliderReinitialize() {
    var $slickCarouselSlider = $('.recomendation-carousel-wrapper .js-carousel');
    // Get the data value from the data-carousel-config attribute
    var $slickCarouselConfig = $slickCarouselSlider.data('carousel-config');

    // Unslick the slider to reset the configuration
    if ($slickCarouselSlider.hasClass('slick-initialized')) {
        $slickCarouselSlider.slick('unslick');
    }
    
    $slickCarouselSlider.addClass('d-none');
    
    setTimeout(() => {
        // Reinitialize the slider to reset the configuration
        $slickCarouselSlider.slick($slickCarouselConfig);
       $slickCarouselSlider.removeClass('d-none');
    }, 2000);
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

function updateCartTotals(data) {
    $('.number-of-items').empty().append(data.resources.numberOfItems);
    if(data.totals.isFree === true) {
        $('.shipping-cost').empty().append(data.totals.freeShippingLabel);
    } else {
        $('.shipping-cost').empty().append(data.totals.totalShippingCost);
    }


    if (data && data.approachingDiscountsTotal && data.conditionThresholdCurrencyValue && data.progressBarPromoMsg && data.progressBarpercentage) {
        
        var $promoProgressBarHtml = '<div class="progress-meter d-flex flex-column align-items-center">'+
        '<div class="progress-meter-free-shipping">'+ data.progressBarPromoMsg.replace('price', data.approachingDiscountsTotal) +'</div>'+
        '<div class="progress-meter-box">'+
        '<div class="progress-meter-box-bar bar-grey" style="width:'+ data.progressBarpercentage +'%"</div>'+
        '</div>'+
        '</div>';

        var $progressMeterMain = $('.progress-meter-container');
        $progressMeterMain.empty();
        $progressMeterMain.append($promoProgressBarHtml);
    } else {
        var $freeShippingIcon = $('.progress-meter-container').data('shipping-image');
        var $progressBarSuccessMsg = data.progressBarSuccessMsg;
        var $progressMeterMain = $('.progress-meter-container');

        if ($freeShippingIcon && $freeShippingIcon.length > 0 && $progressBarSuccessMsg) {
            var $applicablePromoMessageHtml = '<div class="got-free-shipping d-flex align-items-center justify-content-center">'+
            '<img src="'+ $freeShippingIcon +'" alt="'+ data.progressBarSuccessMsg +'">'+
            '<p>'+ data.progressBarSuccessMsg +'</p>'+
            '</div>';
        }

        $progressMeterMain.empty();
        $progressMeterMain.append($applicablePromoMessageHtml);
    }
    
    if (typeof data.totals.deliveryTime != 'undefined' &&  typeof data.totals.deliveryTime.isExpress != 'undefined' && data.totals.deliveryTime.isExpress) {
        $('.delivery-time').removeClass('d-none');
    } else {
        $('.delivery-time').addClass('d-none');
    }
    $('.delivery-date').empty().append(data.totals.deliveryDate);
    $('.tax-total').empty().append(data.totals.totalTax);
    $('.grand-total-sum, .cart-total').empty().append(data.totals.grandTotal);
    $('.sub-total').empty().append(data.totals.subTotal);
    /* Affirm block for refreshing promo message */
    var totalCalculated = data.totals.grandTotal.substr(1).toString().replace(/\,/g, '');
    $('.affirm-as-low-as').attr('data-amount', (totalCalculated * 100).toFixed());
    if (Resources.AFFIRM_PAYMENT_METHOD_STATUS) {
        affirm.ui.ready(function() {
            affirm.ui.refresh();
        });
    }
    $('.minicart-quantity').empty().append(data.numItems);

    if (data.totals.orderLevelDiscountTotal.value > 0) {
        $('.order-discount').removeClass('hide-order-discount');
        $('.order-discount-total').empty()
            .append('- ' + data.totals.orderLevelDiscountTotal.formatted);
    } else {
        $('.order-discount').addClass('hide-order-discount');
    }

    if (data.totals.shippingLevelDiscountTotal.value > 0) {
        $('.shipping-discount').addClass('hide-shipping-discount');
        $('.shipping-discount-total').empty().append('- ' + data.totals.shippingLevelDiscountTotal.formatted);
    } else {
        $('.shipping-discount').addClass('hide-shipping-discount');
    }

    data.items.forEach(function (item) {
        $('.item-' + item.UUID).empty().append(item.renderedPromotions);
        $('.item-total-' + item.UUID).empty().append(item.priceTotal.renderedPrice);
    });
}
var updateCartPage = function (data) {
    $('.cart-section-wrapper').html(data.cartPageHtml);
    if (Resources.AFFIRM_PAYMENT_METHOD_STATUS) {
        affirm.ui.ready(function () {
            affirm.ui.refresh();
        });
    }
};

var updateCartLineItems = function (data) {
    $('.product-list-block-ob').html(data.cartPageHtml);
    if (Resources.AFFIRM_PAYMENT_METHOD_STATUS) {
        affirm.ui.ready(function () {
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
        $(document).off('click', '.main-variation-attribute[data-attr="color"] a').on('click', '.main-variation-attribute[data-attr="color"] a', function (e) {
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

    selectAttribute: function () {
        var selector = '.set-item select[class*="select-"], .product-detail select[class*="select-"], .options-select, .product-option input[type="radio"], .select-variation-product';
        $(document).off('change', selector);
        $(document).off('click', selector).on('click', selector, function (e) {
            e.preventDefault();
            if ($(this).attr('disabled') || $(this).hasClass('active')) {
                return;
            }

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
                removeOption($(optionContainer).closest(".product-option"));
            }
        });

        $(document).off('click', 'form[name="embossing"] button, form[name="engraving"] button').on('click', 'form[name="embossing"] button, form[name="engraving"] button', function (e) {
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
                    $this.find('input[name="orientation"]').attr('disabled', true).change();
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
        $(document).off('click.addToCart').on('click.addToCart', 'button.add-to-cart, button.add-to-cart-global, button.add-to-cart-recomendations', function (e) {
            var addToCartUrl;
            var pid;
            var pidsObj;
            var setPids;
            var giftPid;
            var addToCartRecommendationButton = $(this).data('recommendation-atc');

            $('body').trigger('product:beforeAddToCart', this);

            if ($('.set-items').length && $(this).hasClass('add-to-cart-global')) {
                setPids = [];

                $('.product-detail').each(function () {
                    if (!$(this).hasClass('product-set-detail')) {
                        setPids.push({
                            pid: $(this).find('.product-id').text(),
                            qty: 1,
                            options: getOptions($(this))
                        });
                    }
                });
                pidsObj = JSON.stringify(setPids);
            }

            pid = getPidValue($(this));
            if ($('.gift-allowed-checkbox').is(":checked")) {
                giftPid = $('.gift-allowed-checkbox').val();
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
            * Custom Start: Add to cart form for Oliva Burton
            */
            if ($('.pdp-obuk')) {
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
            $productContainer.find('input[type="text"], textarea, input[type="radio"]:checked').filter('[required]')
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

            var personalize = $('.popup-tabs .personalize');
            if (personalize.length && personalize.length > 0) {
                var personalizationType = personalize.val();
                form.personalizationType = personalizationType; 
            }

            $(this).trigger('updateAddToCartFormData', form);
            if (addToCartUrl) {
                $.ajax({
                    url: addToCartUrl,
                    method: 'POST',
                    data: form,
                    success: function (data) {
                        updateCartPage(data);
                        handlePostCartAdd(data, addToCartRecommendationButton);
                        $('body').trigger('product:afterAddToCart', data);
                        if (window.Resources.LISTRAK_ENABLED) {
                            var ltkSendSCA = require('listrak_custom/ltkSendSCA');
                            ltkSendSCA.renderSCA(data.SCACart, data.listrakCountryCode);
                        }
                        
                        if ($('.recomendation-carousel-wrapper .js-carousel').length > 0 && addToCartRecommendationButton === undefined) {
                            slickSliderReinitialize();
                        }
                        $.spinner().stop();
                    },
                    error: function () {
                        $.spinner().stop();
                    }
                });
            }
        });
    },
    selectBonusProduct: function () {
        $(document).off('click', '.select-bonus-product').on('click', '.select-bonus-product', function () {
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
            }
    	});
    },
    allowOnlyAlphaNumericInput: function () {
        $(document).on('keypress', '.alpha-numeric-input', function (e) {
            var regex = new RegExp("^[a-zA-Z0-9*\/]+$");
            var str = String.fromCharCode(!e.charCode ? e.which : e.charCode);
            if (regex.test(str)) {
                return true;
            }
            e.preventDefault();
            return false;
        });
    },
    switchEmbossOrientation: function () {
        $(document).off('click', 'form[name="embossing"] input[name="orientation"]').on('click', 'form[name="embossing"] input[name="orientation"]', function (e) {
            var orientationRadioBtn = $(this);
            var input = $(orientationRadioBtn.data('input'));
            
            if ($(this).is(':checked')) {
                if(input.attr('maxlength') != orientationRadioBtn.data('characterlimit')) {
                    input.val('');
                }
                input.attr('maxlength', orientationRadioBtn.data('characterlimit'));
                input.attr('placeholder', orientationRadioBtn.data('placeholder'));
                input.attr('data-format-error', orientationRadioBtn.data('format-error'));
            }
        });
    },

    getPidValue: getPidValue,
    getQuantitySelected: getQuantitySelected,
    addToCartPLP: function () {
        $(document).on('click', '.add-to-cart-plp-redesign', function (e) {
            var addToCartUrl;
            var pid;
            var pidsObj;
            var setPids;
            var $this = $(this);
            var addToCartRecommendationButton = $this.data('recommendation-atc');
            $('body').trigger('product:beforeAddToCart', this);
            $.spinner().stop();
            $.spinner().start();
            var currentPage = $('.page[data-action]').data('action') || '';
            addToCartUrl = getAddToCartUrl();
            if ($this.data('product-set') == true) {
                setPids = [];
                $this.find('.product-sets').each(function () {
                    setPids.push({
                        pid: $(this).text(),
                        qty: 1,
                        options: getOptions($(this))
                    });
                });
                pidsObj = JSON.stringify(setPids);
                pid = getPidValue($(this));
            } else {
                pid = $(this).data('pid');
            }

            var form = {
                pid: pid,
                pidsObj: pidsObj,
                childProducts: getChildProducts(),
                quantity: 1,
                currentPage: currentPage
            };
            var $currentRecommendedProduct = $(this).data('rec-pid');
            var $addToCartButtonText = $(this).data('add-to-cart-text')
            if (addToCartUrl) {
                $.ajax({
                    url: addToCartUrl,
                    method: 'POST',
                    data: form,
                    success: function (data) {
                        updateCartLineItems(data);
                        updateCartTotals(data.cart);
                        handlePostCartAdd(data, addToCartRecommendationButton, $currentRecommendedProduct, $addToCartButtonText);
                        $('body').trigger('product:afterAddToCart', data);
                        if (window.Resources.LISTRAK_ENABLED) {
                            var ltkSendSCA = require('listrak_custom/ltkSendSCA');
                            ltkSendSCA.renderSCA(data.SCACart, data.listrakCountryCode);
                        }

                        if ($('.recomendation-carousel-wrapper .js-carousel').length > 0 && addToCartRecommendationButton === undefined) {
                            slickSliderReinitialize();
                        }
                        $.spinner().stop();
                    },
                    error: function () {
                        $.spinner().stop();
                    }
                });
            }
        });
    }
};
