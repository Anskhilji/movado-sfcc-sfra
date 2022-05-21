'use strict';

function getProductSetBasePrice(productID) {
    var Money = require('dw/value/Money');
    var ProductMgr = require('dw/catalog/ProductMgr');
    var productSet = ProductMgr.getProduct(productID);
    var productSetProducts = productSet.productSetProducts.iterator();
    var currentProductSetProduct;
    var currentProdcutSetProductPriceModel;
    var basePrice = 0;
    var currencyCode;
    var formattedBasePrice;

    while (productSetProducts.hasNext()) {
        currentProductSetProduct = productSetProducts.next();
        currentProdcutSetProductPriceModel = currentProductSetProduct.priceModel;
        if (currentProdcutSetProductPriceModel.price.available) {
            currencyCode = currentProdcutSetProductPriceModel.price.currencyCode;
            basePrice += currentProdcutSetProductPriceModel.price.decimalValue; 
        }
    }

    formattedBasePrice = new Money(basePrice, currencyCode).toFormattedString();
    return {
        basePrice: basePrice,
        formattedBasePrice: formattedBasePrice
    }
}

function getProductSetSalePrice(productID) {
    var Money = require('dw/value/Money');
    var ProductMgr = require('dw/catalog/ProductMgr');
    var productSet = ProductMgr.getProduct(productID);
    var Promotion = require('dw/campaign/Promotion');
    var PromotionMgr = require('dw/campaign/PromotionMgr');
    var productSetProducts = productSet.productSetProducts.iterator();
    var currentProductSetProduct;
    var salePrice = 0;
    var currentPromotionalPrice = 0;
    var formattedSalePrice;
    var currentProductSetProduct;
    var currencyCode;
    var currentProdcutSetProductPriceModel;
    var promotionalPrice = 0;
    var storefrontPromo;
    var promoCalloutMsg;

	while (productSetProducts.hasNext()) {
        currentProductSetProduct = productSetProducts.next();
        currentProdcutSetProductPriceModel = currentProductSetProduct.priceModel;
        var PromotionItr = PromotionMgr.activePromotions.getProductPromotions(currentProductSetProduct).iterator();
            while (PromotionItr.hasNext()) {
                var promo = PromotionItr.next();
                if (promo.getPromotionClass() != null && promo.getPromotionClass().equals(Promotion.PROMOTION_CLASS_PRODUCT) && !promo.basedOnCoupons) {
                    if (currentProductSetProduct.optionProduct) {
                        currentPromotionalPrice = promo.getPromotionalPrice(currentProductSetProduct, currentProductSetProduct.getOptionModel());
                        promoCalloutMsg = promo.calloutMsg.markup
                    } else {
                        currentPromotionalPrice = promo.getPromotionalPrice(currentProductSetProduct);
                        promoCalloutMsg = promo.calloutMsg.markup
                    }
                    if (promotionalPrice.value > currentPromotionalPrice.value && currentPromotionalPrice.value !== 0) {
                        promotionalPrice = currentPromotionalPrice;
                        storefrontPromo = promo;
                        // promoCalloutMsg = promo.calloutMsg.markup;
                    } else if (promotionalPrice.value == 0) {
                        if ((currentPromotionalPrice.value !== 0 && currentPromotionalPrice.value !== null)) {
                            promotionalPrice = currentPromotionalPrice;
                            storefrontPromo = promo;
                            // promoCalloutMsg = promo.calloutMsg.markup;
                        }
                    }
                }
            }

        if (currentPromotionalPrice && currentPromotionalPrice.available && currentProdcutSetProductPriceModel.price.available) {
            currencyCode = currentProdcutSetProductPriceModel.price.currencyCode;
            salePrice += currentPromotionalPrice.decimalValue;
        }
	}

    formattedSalePrice = new Money(salePrice, currencyCode).toFormattedString();
    return {
        salePrice: salePrice,
        formattedSalePrice: formattedSalePrice,
        promoCalloutMsg: promoCalloutMsg
    }
}

module.exports = {
    getProductSetBasePrice: getProductSetBasePrice,
    getProductSetSalePrice: getProductSetSalePrice
};