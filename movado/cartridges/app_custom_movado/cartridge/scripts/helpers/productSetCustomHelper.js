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
    var currentPromotionalPrice = Money.NOT_AVAILABLE;
    var salePrice = 0;
    var currentProductSetProduct;
    var formattedSalePrice;
    var currentProductSetProduct;
    var currencyCode;
    var currentProdcutSetProductPriceModel;
    var promoCalloutMsg;

	while (productSetProducts.hasNext()) {
        currentProductSetProduct = productSetProducts.next();
        currentProdcutSetProductPriceModel = currentProductSetProduct.priceModel;
        var PromotionItr = PromotionMgr.activePromotions.getProductPromotions(currentProductSetProduct).iterator();
        if (!empty(PromotionItr)) {
            for each(var promo in PromotionItr) {
                if (promo.getPromotionClass()!= null && promo.getPromotionClass().equals(Promotion.PROMOTION_CLASS_PRODUCT)) {
                    if (currentProductSetProduct.optionProduct) {
                        currentPromotionalPrice = promo.getPromotionalPrice(currentProductSetProduct, currentProductSetProduct.getOptionModel());
                        promoCalloutMsg = promo.calloutMsg ? promo.calloutMsg.markup : '';

                    } else {
                        currentPromotionalPrice = promo.getPromotionalPrice(currentProductSetProduct);
                        promoCalloutMsg = promo.calloutMsg ? promo.calloutMsg.markup : '';
                    }
                    break;
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