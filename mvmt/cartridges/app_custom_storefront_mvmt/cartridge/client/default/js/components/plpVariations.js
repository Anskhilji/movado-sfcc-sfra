'use strict';
module.exports = function () {
    function handleVariantResponse(response, $productContainer, pdpURL) {
        var $product = response.product;
        // Update primary images
        var primaryImageUrls = response.product.images;
        var $imageContainer = $productContainer.find('.image-container').find('img');
        $productContainer.find('.image-container').find('source: last-child').attr('srcset', primaryImageUrls.tile206[0].url);
        $productContainer.find('.image-container').find('source').attr('srcset', primaryImageUrls.tile512X640[0].url);
        $imageContainer.attr('src', primaryImageUrls.tile512X640[0].url);
        $productContainer.find('.image-container').find('a').attr('href', pdpURL);

        // Update Family Name and Case Diameter
        if (typeof response.product.collectionName !== 'undefined' && response.product.collectionName !== '' && response.product.collectionName !== null) {
            $productContainer.find('.product-brand-info .collection-name').text(response.product.collectionName);
        }
        if (typeof response.product.caseDiameter !== 'undefined' && response.product.caseDiameter !== '' && response.product.caseDiameter !== null) {
            $productContainer.find('.product-brand-info .case-diameter').text(response.product.caseDiameter);
        }


        //update product gtm data
        var $gtmClikObject = $imageContainer.data('gtm-product');
        if ($gtmClikObject) {
            $gtmClikObject.id = $product.id;
            $gtmClikObject.brand = $product.brand;
            $gtmClikObject.name = $product.productName;
            $gtmClikObject.price = $product.price.sales != null ? $product.price.sales.decimalPrice : ($product.price.list != null ? $product.price.list.decimalPrice : '0.0');
            $imageContainer.data('gtm-product', $gtmClikObject);
        }

        // Trigger collectionVariantToggle function
        if (response.product) {
            $('body').trigger('collectionVariantToggle', response.product);
        }

        //update price
        var $readyToOrder = response.product.readyToOrder;
        var $variationPriceSelector = $productContainer.find('.tile-body .price');
        if (response.product.price) {
            $variationPriceSelector.replaceWith(response.product.price.html);
        }
        if ($readyToOrder) {
            $variationPriceSelector.removeClass('d-none');
        } else {
            $variationPriceSelector.addClass('d-none');
        }

        var $productNameSelector = $productContainer.find('.product-name');
        //Custom Start  [MSS-1375] response.product.productName changed to response.product.color
        $productNameSelector.text(response.product.color);
        //Custom End
        $productNameSelector.attr('href', $product.selectedProductUrl);

        var variationPID = response.product.id;
        var isVariationQantityExist = response.product.quantities;
        var $addToCartSelector = $productContainer.find('.cta-add-to-cart button.add-to-cart');;
        if (response.product.available) {
            if (response.product.available) {
                var $cartButtonContainer = $productContainer.find('button.add-to-cart');
                $cartButtonContainer.text(Resources.ADD_TO_CART_LABEL);
            }
        }

        var $exclusiveBadges = $productContainer.find('.product-tag-content .exclusive-badges');
        $exclusiveBadges.empty();

        var $imageBadgesLeft = $productContainer.find('.product-badge.left');
        $imageBadgesLeft.empty();

        var $imageBadgesRight = $productContainer.find('.product-badge.right');
        $imageBadgesRight.empty();

        if (response.product.available) {
            var badges = response.badges;

            // Update text Badges
            if (badges.textBadges && badges.textBadges.length > 0) {
                badges.textBadges.forEach(function (badge) {
                    $exclusiveBadges.append('<span class="badge text-uppercase">' + badge.text + '</span>');
                });
            }

            // Update image Badges
            if (badges.imageBadges && badges.imageBadges.length > 0) {
                badges.imageBadges.forEach(function (imageBadge, idx) {
                    if (idx === 0) {
                        $imageBadgesLeft.append('<span class="badge-text"><img src="' + imageBadge.imageUrl + '" alt="' + imageBadge.imageAlt + '"></span>');
                    } else {
                        $imageBadgesRight.append('<span class="badge-text"><img src="' + imageBadge.imageUrl + '" alt="' + imageBadge.imageAlt + '"></span>');
                    }
                });
            }
        }

        $addToCartSelector.data('pid', variationPID);
        if (isVariationQantityExist) {
            $addToCartSelector.removeClass('out-of-stock-btn');
            $addToCartSelector.prop('disabled', false);
        } else {
            $addToCartSelector.addClass('out-of-stock-btn');
            $addToCartSelector.prop('disabled', true);
        }
        var $availibilityContainer = $productContainer.find('.mvmt-avilability');
        if ($availibilityContainer) {

            $availibilityContainer.hide();
            if (!response.product.available) {
                $availibilityContainer.show();
                $availibilityContainer.removeClass('d-none').css('display', 'inline');
                $addToCartSelector.text(Resources.OUT_OF_STOCK_LABEL);
                $addToCartSelector.addClass('out-of-stock-btn');
                $addToCartSelector.prop('disabled', true);
            }
        }

    }


    $(document).ready(function () {
        updateColorVariation();
    });

    function updateColorVariation() {
        if (document.readyState === "complete") {
            $(document).on('click', '[data-attr="colorVar"] a', function (e) {
                e.preventDefault();

                var swatchImageContainer = $(this).find('img.swatch-circle');
                if ($(this).attr('disabled') || $(swatchImageContainer).hasClass('is-active')) {
                    return;
                }

                $.spinner().start();
                var $productContainer = $(this).closest('.product-tile');
                if (!$productContainer.length) {
                    $productContainer = $(this).closest('.product-detail');
                }
                $productContainer.find('.color-swatches img.is-active').removeClass('is-active');
                $('.color-swatches img').removeClass('is-active');
                $(this).find('img.swatch-circle').addClass('is-active');
                var selectedValueUrl = $(this).data('swatch-url');
                var pdpURL = $(this).data('pdp-url');

                $.ajax({
                    url: selectedValueUrl,
                    method: 'GET',
                    success: function (data) {
                        handleVariantResponse(data, $productContainer, pdpURL);
                        setTimeout(function () {
                            $.spinner().stop();
                        }, 1500);

                    },
                    error: function () {
                        $.spinner().stop();
                    }
                });
            });
        } else {
            setTimeout(function () {
                updateColorVariation();
            }, 200);
        }
    }
};