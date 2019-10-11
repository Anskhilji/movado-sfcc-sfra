'use strict';

var ProductMgr = require('dw/catalog/ProductMgr');
var Site = require('dw/system/Site');
var URLUtils = require('dw/web/URLUtils');

var getSmartGiftCardBasket = function(productID) {
    var isEnableSmartGift = Site.getCurrent().getCustomPreferenceValue('enableSmartGift');
    var productUrl = URLUtils.abs('Product-Show', 'pid', productID);
    var smartGift;
    if (isEnableSmartGift && productID) {
        var apiProduct = ProductMgr.getProduct(productID);
        var imageFile = apiProduct.getImage('large', 0);
        var imagePath = imageFile ? imageFile.absURL : '';
        var quantity = 0;
        var inventoryRecord =  apiProduct.getAvailabilityModel().getInventoryRecord();
        if (inventoryRecord) { 
            quantity = inventoryRecord.ATS.available ? inventoryRecord.ATS.value : 0;
        }
        smartGift = {
            skuCode: apiProduct.ID,
            skuUrl: productUrl,
            price: apiProduct.priceModel.price.value ? apiProduct.priceModel.price.value : 0,
            name: apiProduct.name,
            image: imagePath,
            quantity: quantity
        };
        return smartGift;
    }
}

exports.getSmartGiftCardBasket = getSmartGiftCardBasket;

