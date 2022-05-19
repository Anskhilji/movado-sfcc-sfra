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
    while(productSetProducts.hasNext()) {
        currentProductSetProduct = productSetProducts.next();
        currentProdcutSetProductPriceModel = currentProductSetProduct.priceModel;
        if (currentProdcutSetProductPriceModel.price.available) {
            currencyCode = currentProdcutSetProductPriceModel.price.currencyCode;
            basePrice += currentProdcutSetProductPriceModel.price.decimalValue; 
        }
    }
    formattedBasePrice = new Money(basePrice, currencyCode).toFormattedString();
    return formattedBasePrice;
}


module.exports = {
    getProductSetBasePrice: getProductSetBasePrice,
    getProductSetSalePrice: getProductSetSalePrice
};