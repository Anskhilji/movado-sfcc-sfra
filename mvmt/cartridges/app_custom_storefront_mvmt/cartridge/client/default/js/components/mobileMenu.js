'use strict';

function loadEswPrice() {
    var $eswPrice = $('.eswPrice wainclude');
    if ($eswPrice.length > 0) {
        $eswPrice.each(function (index, $eswPriceContainer) {
            $eswPriceContainer = $(this);
            $.get($eswPriceContainer.attr('url'), function (data, status) {
                $eswPriceContainer.replaceWith(data);
            });
        });
    }
}

module.exports = function () {
    $('.navbar-nav').on('click', '.back-menu', function (e) {
        e.preventDefault();
        $('.mvmt-menu-group .sub-dropdown').removeClass('show');
    });

    $('.navbar-nav').on('click', '.back-submenu', function (e) {
        e.preventDefault();
        $('.dropdown-item-mvmt').removeClass('show');
    });
    
    $('.close-menu').on('click', '.close-button', function (e) {
        e.preventDefault();
        $('.dropdown-item-mvmt').removeClass('show');
        $('.mvmt-menu-group .sub-dropdown').removeClass('show');
        $('.menu-toggleable-left').removeClass('in');
        $('#overlay').hide();
    });

    $('.mvmt-menu-group .dropdown' ).click(function() {
        $(this).addClass('show');
    });
    
    $('.menu-icon-mvmt-hamburger').click(function() {
        $('.third-level-men-menu').addClass('show');
    });
    
    $('.third-level-menu-tab .btn' ).click(function() {
        var tablink = $(this).data('tab');
        $('.tab-content-submenu').removeClass('show');
        $('.third-level-menu-tab .btn').removeClass('active');
        $(''+tablink+'').addClass('show');
        $(this).addClass('active');
    });
    
    $(window).on('resize load',function () {
        var height = $(window).height()-212;

        $('.mobile-menu .tab-content-submenu ul').height(height);
    });
    
    function handleVariantResponse(response, $productContainer, pdpURL) {

        // Update primary images
        var primaryImageUrls = response.product.images;
        $productContainer.find('.image-container').find('source').attr('srcset', primaryImageUrls.pdp533[0].url);
        $productContainer.find('.image-container').find('img').attr('src', primaryImageUrls.pdp533[0].url);
        $productContainer.find('.image-container').find('a').attr('href', pdpURL);
        //update price
        var $readyToOrder = response.product.readyToOrder;
        var $variationPriceSelector = $productContainer.find('.tile-body > .price');
        $variationPriceSelector.replaceWith(response.product.price.html);
        loadEswPrice();
        if ($readyToOrder) {
            $variationPriceSelector.removeClass('d-none');
        } else {
            $variationPriceSelector.addClass('d-none');
        }
        
        var $productNameSelector = $productContainer.find('.product-name');
        $productNameSelector.text(response.product.productName);
        
        var variationPID = response.product.id;
        var isVariationQantityExist = response.product.quantities;
        var $addToCartSelector = $productContainer.find('.cta-add-to-cart button.add-to-cart');;
        if (response.product.available) {
            if (response.product.available) {
                var $cartButtonContainer = $productContainer.find('button.add-to-cart');
                $cartButtonContainer.text(Resources.ADD_TO_CART_LABEL);
            }
        }
        
        $addToCartSelector.data( 'pid', variationPID );
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
                $availibilityContainer.removeClass('d-none').css('display' , 'inline');
                $addToCartSelector.text(Resources.OUT_OF_STOCK_LABEL);
                $addToCartSelector.addClass('out-of-stock-btn');
                $addToCartSelector.prop('disabled', true);
            }
        }
       
    }
    
    
    $( document ).ready(function () {
        updateColorVariation();
    });

    function updateColorVariation() {
        if (document.readyState === "complete") {
            $(document).on('click', '[data-attr="colorVar"] a', function (e) {
                e.preventDefault();

                if ($(this).attr('disabled')) {
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


