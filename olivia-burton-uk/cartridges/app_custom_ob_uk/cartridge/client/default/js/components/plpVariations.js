'use strict';
module.exports = function () {
    function handleVariantResponse(response, $productContainer, $pdpURL) {
        var $winWidth = $(window).width();
        var $mediumBreakPoint= 991;
        var $product = response.product;
        // Update primary images
        var primaryImageUrls = response.product.images;
        var $imageContainer = $productContainer.find('.image-container').find('img');

        if ($winWidth > $mediumBreakPoint) {
            $productContainer.find('.image-container .tile-picture-primary').find('source').attr('srcset', primaryImageUrls.tile640Xtile764[0].url);
            $imageContainer.attr('src', primaryImageUrls.tile640Xtile764[0].url);
            $productContainer.find('.image-container').find('a').attr('href', $pdpURL);
    
            // Update life style images
            if ($productContainer && primaryImageUrls && primaryImageUrls.tile640Xtile764[2] && primaryImageUrls.tile640Xtile764[2].url) {
                $productContainer.find('.image-container .tile-picture-hidden').find('source').attr('srcset', primaryImageUrls.tile640Xtile764[2].url);
                $imageContainer.attr('src', primaryImageUrls.tile640Xtile764[2].url);
            } else {
                $productContainer.find('.image-container .tile-picture-hidden').find('source').attr('srcset', primaryImageUrls.tile640Xtile764[0].url);
                $imageContainer.attr('src', primaryImageUrls.tile640Xtile764[0].url);
            }
        } else {
            $productContainer.find('.image-container .tile-picture-primary').find('source').attr('srcset', primaryImageUrls.tile512Xtile640[0].url);
            $imageContainer.attr('src', primaryImageUrls.tile512Xtile640[0].url);
            $productContainer.find('.image-container').find('a').attr('href', $pdpURL);
            // Update life style images
            if ($productContainer && primaryImageUrls && primaryImageUrls.tile512Xtile640[2] && primaryImageUrls.tile512Xtile640[2].url) {
                $productContainer.find('.image-container .tile-picture-hidden').find('source').attr('srcset', primaryImageUrls.tile512Xtile640[2].url);
                $imageContainer.attr('src', primaryImageUrls.tile512Xtile640[2].url);
            } else {
                $productContainer.find('.image-container .tile-picture-hidden').find('source').attr('srcset', primaryImageUrls.tile512Xtile640[0].url);
                $imageContainer.attr('src', primaryImageUrls.tile512Xtile640[0].url);
            }
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
        if ($productNameSelector) {
            $productNameSelector.text(response.product.productName);
            $productNameSelector.attr('href', $product.selectedProductUrl);
        }
        //Custom End

        var $productFamilyNameSelector = $productContainer.find('.product-family');
        if ($productFamilyNameSelector) {
            $productFamilyNameSelector.empty();
            $productFamilyNameSelector.append('<h3>' + response.product.collectionName + '</h3>');
            $productFamilyNameSelector.attr('href', $product.selectedProductUrl);
        }

        var $exclusiveBadges = $productContainer.find('.image-container .exclusive-badges');
        $exclusiveBadges.empty();

        var $imageBadgesLeft = $productContainer.find('.product-badge.left');
        $imageBadgesLeft.remove();

        var $imageBadgesRight = $productContainer.find('.product-badge.right');
        $imageBadgesRight.remove();

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
                        $exclusiveBadges.append('<div class="product-badge left"><span class="badge-text"><img src="' + imageBadge.imageUrl + '" alt="' + imageBadge.imageAlt + '"></span></div>');
                    } else {
                        $exclusiveBadges.append('<div class="product-badge right"><span class="badge-text"><img src="' + imageBadge.imageUrl + '" alt="' + imageBadge.imageAlt + '"></span></div>');
                    }
                });
            }
        }

        var $variationPid = response.product.id;
        var $isVariationQantityExist = response.product.quantities;
        var $addToCartSelector = $productContainer.find('.cta-add-to-cart button.add-to-cart-plp-redesign');
        var $cartButtonContainer = $productContainer.find('button.add-to-cart-plp-redesign');

        if (response.product.available) {
            $cartButtonContainer.text(window.Resources.ADD_TO_CART_LABEL);
        } else {
            $cartButtonContainer.text(window.Resources.OUT_OF_STOCK_LABEL);
        }

        $addToCartSelector.data('pid', $variationPid);

        if ($isVariationQantityExist) {
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
            $(document).on('click', '[data-attr="colorVar"] a.change-variation', function (e) {
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
                var $selectedValueUrl = $(this).data('swatch-url');
                var $pdpURL = $(this).data('pdp-url');

                $.ajax({
                    url: $selectedValueUrl,
                    method: 'GET',
                    success: function (data) {
                        handleVariantResponse(data, $productContainer, $pdpURL);
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