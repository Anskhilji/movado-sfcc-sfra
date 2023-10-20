'use strict';

var ProductMgr = require('dw/catalog/ProductMgr');
var Site = require('dw/system/Site');
var URLUtils = require('dw/web/URLUtils');

const getSmartGiftCardBasket = function(productID) {
    const isEnableSmartGift = Site.getCurrent().getCustomPreferenceValue('enableSmartGift');
    const productUrl = URLUtils.abs('Product-Show', 'pid', productID);
    const smartGift;
    if (isEnableSmartGift && productID) {
        const apiProduct = ProductMgr.getProduct(productID);
        const imageFile = apiProduct.getImage('large', 0);
        const imagePath = imageFile ? imageFile.absURL : '';
        let quantity = 0;
        const inventoryRecord =  apiProduct.getAvailabilityModel().getInventoryRecord();
        if (inventoryRecord) { 
            quantity = inventoryRecord.ATS.available ? 1 : 0;
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

var sendSmartGiftDetails = function(trackingCode, orderID) {
    var Logger = require('dw/system/Logger');
    var OrderMgr = require('dw/order/OrderMgr');

    var collections = require('*/cartridge/scripts/util/collections');
    var smartGiftService = require('*/cartridge/scripts/smartGiftService/smartGiftService');

    var requestPayload;
    try {
        if (!empty(trackingCode) && !empty(orderID)) {
            var currentOrder = OrderMgr.getOrder(orderID);
            var productLineItems = currentOrder.getProductLineItems();
            var items = [];
            collections.forEach(productLineItems, function (pli) {
                var obj = {
                    skuCode: pli.productID,
                    paidAmount: pli.getNetPrice().value
                };
                items.push(obj);
            });
            requestPayload = {
                trackingCode: trackingCode,
                merchantOrderId: orderID,
                paidAmount: currentOrder.getTotalGrossPrice().value,
                items: items
            }
            smartGiftService.sendOrderDetails(requestPayload);
            session.custom.trackingCode = '';
        }
    } catch (e) {
        session.custom.trackingCode = '';
        Logger.error("Error occurred while trying to send order details to smart gift, order number is: {0} and error is: {1}", orderID, e);
    }
}

exports.getSmartGiftCardBasket = getSmartGiftCardBasket;
exports.sendSmartGiftDetails = sendSmartGiftDetails;