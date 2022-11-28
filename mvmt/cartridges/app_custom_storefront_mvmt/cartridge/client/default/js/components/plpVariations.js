'use strict';
module.exports = function () {
    function handleVariantResponse(response, $productContainer, pdpURL) {
        var $product = response.product;
        // Update primary images
        var primaryImageUrls = response.product.images;
        var $imageContainer = $productContainer.find('.image-container').find('img');
        var isPLPRedesign = ($('.mvmt-plp-redesign').length > 0);
        if (isPLPRedesign) {
            var $categoryRendringTemplate = $productContainer.find('.color-swatches').data('categroy-eyeware');
            var $lifeStyleImageContainer = $productContainer.find('.image-container .life-style-image');
            var isEnableSingleProductRow = $('.search-results').data('is-enable-single-product-row');
            var isNonWatchesTileEnable = $('.search-results').data('is-non-watches-tile-enable');
            if (!($productContainer.parents('.product-grid').length > 0) || (($productContainer.parents('.product-grid').length > 0) && ($('.product-grid').hasClass('recommendation')))) {
                $productContainer.find('.image-container').find('source').attr('srcset', primaryImageUrls.tile256[0].url);
                $imageContainer.attr('src', primaryImageUrls.tile256[0].url);
                $productContainer.find('.image-container').find('a').attr('href', pdpURL);
                // life style image handling
            } else if ($categoryRendringTemplate !== undefined && $categoryRendringTemplate !== '' && $categoryRendringTemplate == true) {
                $productContainer.find('.image-container').find('source').attr('srcset', primaryImageUrls.tile532X300[0].url).data('lazy', primaryImageUrls.tile532X300[0].url);
                $imageContainer.attr('src', primaryImageUrls.tile532X300[0].url).data('lazy', primaryImageUrls.tile532X300[0].url);
                $productContainer.find('.image-container').find('a').attr('href', pdpURL);
                // life style image handling
                if ($lifeStyleImageContainer.length > 0) {
                    $lifeStyleImageContainer.find('source').attr('srcset', primaryImageUrls.tile532X300[3].url).data('lazy', primaryImageUrls.tile532X300[3].url);
                    $lifeStyleImageContainer.find('img').attr('src', primaryImageUrls.tile532X300[3].url).data('lazy', primaryImageUrls.tile532X300[3].url);
                }
            } else {
                $productContainer.find('.image-container').find('a').attr('href', pdpURL);
                if (isEnableSingleProductRow && isNonWatchesTileEnable) {
                    $productContainer.find('.image-container').find('source').attr('srcset', primaryImageUrls.tile256[0].url).data('lazy', primaryImageUrls.tile256[0].url);
                } 
                else if (!isEnableSingleProductRow && !isNonWatchesTileEnable) {
                    $productContainer.find('.image-container').find('source').attr('srcset', primaryImageUrls.tile512X640[0].url).data('lazy', primaryImageUrls.tile512X640[0].url);
                }
                else if (!isEnableSingleProductRow) {
                    $productContainer.find('.image-container').find('source').attr('srcset', primaryImageUrls.tile256[0].url).data('lazy', primaryImageUrls.tile256[0].url);
                }
    
                if (isNonWatchesTileEnable && isEnableSingleProductRow) {
                    $productContainer.find('.image-container').find('source:nth-child(3)').attr('srcset', primaryImageUrls.tile256[0].url).data('lazy', primaryImageUrls.tile256[0].url);
                } 
                else if (!isEnableSingleProductRow && !isNonWatchesTileEnable) {
                    $productContainer.find('.image-container').find('source:nth-child(3)').attr('srcset', primaryImageUrls.tile300X375[0].url).data('lazy', primaryImageUrls.tile300X375[0].url);
                }
                else if (!isEnableSingleProductRow) {
                    $productContainer.find('.image-container').find('source:nth-child(3)').attr('srcset', primaryImageUrls.tile300X300[0].url).data('lazy', primaryImageUrls.tile300X300[0].url);
                } 
    
                if (isEnableSingleProductRow && isNonWatchesTileEnable) {
                    $imageContainer.attr('src', primaryImageUrls.tile256[0].url).data('lazy', primaryImageUrls.tile256[0].url);
                } 
                else if (!isEnableSingleProductRow && !isNonWatchesTileEnable) {
                    $imageContainer.attr('src', primaryImageUrls.tile512X640[0].url).data('lazy', primaryImageUrls.tile512X640[0].url);
                }
                else if (!isEnableSingleProductRow) {
                    $imageContainer.attr('src', primaryImageUrls.tile256[0].url).data('lazy', primaryImageUrls.tile256[0].url);
                } 
                // life style image handling
                if ($lifeStyleImageContainer.length > 0) {
                    if (isEnableSingleProductRow && isNonWatchesTileEnable) {
                        $lifeStyleImageContainer.find('source').attr('srcset', primaryImageUrls.tile256[3].url).data('lazy', primaryImageUrls.tile256[3].url);                        
                        $lifeStyleImageContainer.find('source:nth-child(3)').attr('srcset', primaryImageUrls.tile256[3].url).data('lazy', primaryImageUrls.tile256[3].url);
                        $lifeStyleImageContainer.find('img').attr('src', primaryImageUrls.tile256[3].url).data('lazy', primaryImageUrls.tile256[3].url); 
                    } else if (isNonWatchesTileEnable) {
                        $lifeStyleImageContainer.find('source').attr('srcset', primaryImageUrls.tile256[3].url).data('lazy', primaryImageUrls.tile256[3].url);                        
                        $lifeStyleImageContainer.find('source:nth-child(3)').attr('srcset', primaryImageUrls.tile300X300[3].url).data('lazy', primaryImageUrls.tile300X300[3].url);
                        $lifeStyleImageContainer.find('img').attr('src', primaryImageUrls.tile256[3].url).data('lazy', primaryImageUrls.tile256[3].url);
                    }
                    else {
                        $lifeStyleImageContainer.find('source').attr('srcset', primaryImageUrls.tile512X640[3].url).data('lazy', primaryImageUrls.tile512X640[3].url);
                        $lifeStyleImageContainer.find('source:nth-child(3)').attr('srcset', primaryImageUrls.tile300X375[3].url).data('lazy', primaryImageUrls.tile300X375[3].url);
                        $lifeStyleImageContainer.find('img').attr('src', primaryImageUrls.tile512X640[3].url).data('lazy', primaryImageUrls.tile512X640[3].url);
                    }
                }
            }
        } else {
            $productContainer.find('.image-container').find('source').attr('srcset', primaryImageUrls.pdp533[0].url);
            $imageContainer.attr('src', primaryImageUrls.pdp533[0].url);
            $productContainer.find('.image-container').find('a').attr('href', pdpURL);
        }

        // Update Family Name and Case Diameter
        if ($product.isWatchTile) {
            $('.collection-name-third').removeClass('collection-name');
            if (typeof response.product.collectionName !== 'undefined' && response.product.collectionName !== '' && response.product.collectionName !== null) {
                $productContainer.find('.product-brand-info .collection-name').text(response.product.collectionName);
            }

            if (typeof response.product.collectionName !== 'undefined' && response.product.collectionName !== '' && response.product.collectionName !== null) {
                var $collectionArray = response.product.collectionName.split(' ');
                if ($collectionArray.length == 2) {
                    var $collectionName = '<span>' + $collectionArray[0] + ' ' + $collectionArray[1] + '</span>';
                    $('.collection-name-third-dnone').addClass('d-none');
                    $('.collection-name-third').addClass('collection-name');
                    $productContainer.find('.ellipsis-format .collection-name').html($collectionName);

                    if (typeof response.product.caseDiameterRedesigned !== 'undefined' && response.product.caseDiameterRedesigned !== '' && response.product.caseDiameterRedesigned !== null) {
                        var $diameterArray = response.product.caseDiameterRedesigned.split(' ');
                        var $caseDiameter = '<span class=' + response.product.id + '>' + $diameterArray[2] + '</span>';
                        $('.suggestions-case-diameter').addClass('case-diameter');
                        $productContainer.find('.suggestions-case-diameter').html($caseDiameter);
                        $('.suggestions-case-diameter').removeClass('case-diameter');
                        if ($collectionArray.length == 1) {
                            $('.' + response.product.id).closest('.suggestions-case-diameter').removeClass('d-block');
                        }
                        if ($collectionArray.length == 2) {
                            $('.' + response.product.id).closest('.suggestions-case-diameter').addClass('d-block');
                        }
                        if ($collectionArray.length == 3) {
                            $('.' + response.product.id).closest('.suggestions-case-diameter').removeClass('d-block');
                        }
                        if ($collectionArray.length == 4 || $collectionArray.length > 4) {
                            $('.' + response.product.id).closest('.suggestions-case-diameter').removeClass('d-block');
                        }
                    }
                } else if ($collectionArray.length == 3) {
                    $('.collection-name-third').removeClass('collection-name');
                    var $collectionName = '<span>' + $collectionArray[0] + ' ' + $collectionArray[1] +'</span><br/>' + '<span>' + $collectionArray[2] + '</span>';
                    $('.collection-name-third-dnone').addClass('d-none');
                    $productContainer.find('.collection-name3,.ellipsis-format .collection-name').html($collectionName);
                    $('.collection-name-third').addClass('collection-name');

                    if (typeof response.product.caseDiameterRedesigned !== 'undefined' && response.product.caseDiameterRedesigned !== '' && response.product.caseDiameterRedesigned !== null) {
                        var $caseDiameter = '<span class=' + response.product.id + '>' + response.product.caseDiameterRedesigned + '</span>';
                        $productContainer.find('.suggestions-case-diameter').html($caseDiameter);

                        if ($collectionArray.length == 1) {
                            $('.' + response.product.id).closest('.suggestions-case-diameter').removeClass('d-block');
                        }
                        if ($collectionArray.length == 2) {
                            $('.' + response.product.id).closest('.suggestions-case-diameter').addClass('d-block');
                        }
                        if ($collectionArray.length == 3) {
                            $('.' + response.product.id).closest('.suggestions-case-diameter').removeClass('d-block');
                        }
                        if ($collectionArray.length == 4 || $collectionArray.length > 4) {
                            $('.' + response.product.id).closest('.suggestions-case-diameter').removeClass('d-block');
                        }

                    }
                } else if ($collectionArray.length > 3) {
                    $('.collection-name-third-dnone').addClass('d-none');
                    $('.collection-name-third').addClass('collection-name');
                    $productContainer.find('.ellipsis-format .collection-name').text(response.product.collectionName);

                    showShortText();
                    if (typeof response.product.caseDiameterRedesigned !== 'undefined' && response.product.caseDiameterRedesigned !== '' && response.product.caseDiameterRedesigned !== null) {
                        var $caseDiameter = '<span class=' + response.product.id + '>' + response.product.caseDiameterRedesigned + '</span>';
                        $productContainer.find('.suggestions-case-diameter').html($caseDiameter);

                        if ($collectionArray.length == 1) {
                            $('.' + response.product.id).closest('.suggestions-case-diameter').removeClass('d-block');
                        }
                        if ($collectionArray.length == 2) {
                            $('.' + response.product.id).closest('.suggestions-case-diameter').addClass('d-block');
                        }
                        if ($collectionArray.length == 3) {
                            $('.' + response.product.id).closest('.suggestions-case-diameter').removeClass('d-block');
                        }
                        if ($collectionArray.length == 4 || $collectionArray.length > 4) {
                            $('.' + response.product.id).closest('.suggestions-case-diameter').removeClass('d-block');
                        }
                    }
                } else {
                    if (typeof response.product.collectionName !== 'undefined' && response.product.collectionName !== '' && response.product.collectionName !== null) {
                        var $collectionName = '<span>' + response.product.collectionName + '</span>';
                        $('.collection-name-third-dnone').addClass('d-none');
                        $('.collection-name-third').addClass('collection-name');
                        $productContainer.find('.ellipsis-format .collection-name').html($collectionName);
                    }
                    if (typeof response.product.caseDiameterRedesigned !== 'undefined' && response.product.caseDiameterRedesigned !== '' && response.product.caseDiameterRedesigned !== null) {
                        var $caseDiameter = '<span class=' + response.product.id + '>' + response.product.caseDiameterRedesigned + '</span>';
                        $productContainer.find('.suggestions-case-diameter').html($caseDiameter);

                        if ($collectionArray.length == 1) {
                            $('.' + response.product.id).closest('.suggestions-case-diameter').removeClass('d-block');
                        }
                        if ($collectionArray.length == 2) {
                            $('.' + response.product.id).closest('.suggestions-case-diameter').addClass('d-block');
                        }
                        if ($collectionArray.length == 3) {
                            $('.' + response.product.id).closest('.suggestions-case-diameter').removeClass('d-block');
                        }
                        if ($collectionArray.length == 4 || $collectionArray.length > 4) {
                            $('.' + response.product.id).closest('.suggestions-case-diameter').removeClass('d-block');
                        }
                    }
                }
            }

            $('.desktop-search-icon').click(function() {
                var $collectionArray = response.product.collectionName.split(' ');
                if ($collectionArray.length == 1) {
                    $('.' + response.product.id).closest('.suggestions-case-diameter').removeClass('d-block');
                }
                if ($collectionArray.length == 2) {
                    $('.' + response.product.id).closest('.suggestions-case-diameter').addClass('d-block');
                }
                if ($collectionArray.length == 3) {
                    $('.' + response.product.id).closest('.suggestions-case-diameter').removeClass('d-block');
                }
                if ($collectionArray.length == 4) {
                    $('.' + response.product.id).closest('.suggestions-case-diameter').removeClass('d-block');
                }
            });

        } else {
            if ($('.search-modal-open').hasClass('color-or-family')) {
                $productContainer.find('.product-brand-info .collection-name').text(response.product.collectionName);
            } else {
                $productContainer.find('.product-brand-info .collection-name').text(response.product.productName);
            }
        }
        if (!isPLPRedesign && typeof response.product.caseDiameter !== 'undefined' && response.product.caseDiameter !== '' && response.product.caseDiameter !== null) {
            $productContainer.find('.product-brand-info .case-diameter').text(response.product.caseDiameter);
        } else if (typeof response.product.caseDiameterRedesigned !== 'undefined' && response.product.caseDiameterRedesigned !== '' && response.product.caseDiameterRedesigned !== null) {
            $productContainer.find('.product-brand-info .case-diameter').text(response.product.caseDiameterRedesigned);
        }

        if (typeof response.product.caseDiameterRedesigned !== 'undefined' && response.product.caseDiameterRedesigned !== '' && response.product.caseDiameterRedesigned !== null) {
            var $collectionArrayS = response.product.collectionName.split(' ');
            if ($collectionArrayS.length == 2) {
                var $diameterArrayS = response.product.caseDiameterRedesigned.split(' ');
                $productContainer.find('.suggestions-family-name').html('<span class=' + response.product.id + '>' + $diameterArrayS[2] + '</span>');
            } else {
                $productContainer.find('.suggestions-family-name').html('<span class=' + response.product.id + '>' + response.product.caseDiameterRedesigned + '</span>');
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
        //Custom Start  [MSS-1375] response.product.productName changed to response.product.color
        if (isPLPRedesign) {
            if ($product.isWatchTile) {
                $productNameSelector.text(response.product.productName);
            } else {
                $productNameSelector.text(response.product.color);
            }
        } else {
            if ($('.search-modal-open').hasClass('color-or-family')) {
                if ($product.isWatchTile) {
                    $productNameSelector.text(response.product.productName);
                } else {
                    $productNameSelector.text(response.product.color);
                }
            } else {
                $productNameSelector.text(response.product.productName);
            }
        }
        //Custom End
        $productNameSelector.attr('href', $product.selectedProductUrl);

        var variationPID = response.product.id;
        var isVariationQantityExist = response.product.quantities;
        var $addToCartSelector = $productContainer.find('.cta-add-to-cart button.add-to-cart');
        var $cartRecommendation = $addToCartSelector.data('cart-recommendation');
        if (response.product.available) {
            if (response.product.available) {
                var $cartButtonContainer = $productContainer.find('button.add-to-cart');
                if ($cartRecommendation) {
                    $cartButtonContainer.text(Resources.ADD_TO_CART_RECOMMENDATION_RAIL_LABEL);
                } else {
                    $cartButtonContainer.text(Resources.ADD_TO_CART_LABEL);
                }
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

    function showShortText() {
        $('.text-family-truncate-wrapper').each(function () {
            var $moretext = '...';
            var $content = $(this).html();
            var $collectionArray = $content.split(' ');

            if ($collectionArray.length > 3) {
                var $contentUpdated = '';
                for (var i = 0; i <= 3; i++) {
                    if (i == 3) {
                        $contentUpdated += $moretext + '</a>';
                    } else {
                        $contentUpdated += $collectionArray[i] + ' ';
                    }
                }

                var $updateContent = $contentUpdated.split(' ');
                var $html = '<span>' + $updateContent[0] + ' ' + $updateContent[1] + '</span><br/>';
                var $html2 = '<span>' + $updateContent[2] + $updateContent[3] + '</span>';
                $(this).html($html).append($html2);
            }
        });
    }

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
                $('.suggestions-case-diameter').removeClass('case-diameter');

                $.ajax({
                    url: selectedValueUrl,
                    method: 'GET',
                    success: function (data) {
                        handleVariantResponse(data, $productContainer, pdpURL);
                        setTimeout(function () {
                            $.spinner().stop();
                        }, 1500);
                        $('.suggestions-case-diameter').addClass('suggestions-family-name');
                        showShortText();

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