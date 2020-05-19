'use strict';

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
    
    
    //stttaaaarttt
    
    
    function handleVariantResponse(response, $productContainer) {
        var isChoiceOfBonusProducts =
            $productContainer.parents('.choose-bonus-product-dialog').length > 0;
        var isVaraint;
//        if (response.product.variationAttributes) {
//            updateAttrs(response.product.variationAttributes, $productContainer);
//            isVaraint = response.product.productType === 'variant';
//            if (isChoiceOfBonusProducts && isVaraint) {
//                $productContainer.parent('.bonus-product-item')
//                    .data('pid', response.product.id);
//
//                $productContainer.parent('.bonus-product-item')
//                    .data('ready-to-order', response.product.readyToOrder);
//            }
//        }

        // Update primary images
        var primaryImageUrls = response.product.images;
        $productContainer.find('.image-container').find('source').attr('srcset', primaryImageUrls.pdp533[0].url);
        //update price
        var $readyToOrder = response.product.readyToOrder;
        var $variationPriceSelector = $productContainer.find('.tile-body > .price');
        $variationPriceSelector.replaceWith(response.product.price.html);
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
        if (!variationPID) {
            return;
        }
        $addToCartSelector.data( 'pid', variationPID );
        if (isVariationQantityExist) {
            $addToCartSelector.removeClass('out-of-stock-btn');
            $addToCartSelector.prop('disabled', false);
        } else {
            $addToCartSelector.addClass('out-of-stock-btn');
            $addToCartSelector.prop('disabled', true);
        }
       
    }
    
    
    var $mvmtBase = require('mvmt/product/base');
    $('[data-attr="colorr"] a').off('click').on('click', function (e) {
        e.preventDefault();

        if ($(this).attr('disabled')) {
            return;
        }

        $.spinner().start();
        var $productContainer = $(this).closest('.product-tile');
        if (!$productContainer.length) {
            $productContainer = $(this).closest('.product-detail');
        }


        var selectedValueUrl = new URL(e.currentTarget.href);
        
        $.ajax({
            url: selectedValueUrl,
//            url: 'https://dev05-na02-movado.demandware.net/on/demandware.store/Sites-MVMTUS-Site/default/Product-Variation?dwvar_0607430_color=blue&pid=0607430&quantity=1',
            method: 'GET',
            success: function (data) {
                handleVariantResponse(data, $productContainer);
                setTimeout(function () {
                    $.spinner().stop();
                  }, 1500);
                
            },
            error: function () {
                $.spinner().stop();
            }
        });
        
        
        // eNDDDDDDDDD
    });
};


