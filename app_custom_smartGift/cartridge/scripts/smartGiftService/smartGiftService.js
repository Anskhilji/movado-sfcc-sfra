'use strict';

var LocalServiceRegistry = require('dw/svc/LocalServiceRegistry');
var Logger = require('dw/system/Logger').getLogger('Smartgift');
var ProductMgr = require('dw/catalog/ProductMgr');
var Site = require('dw/system/Site');
var LOG_LOCATION = 'app_custom_smartGift~smartGiftService.js';

/**
* Create and configure service.
*
* @param {string} serviceID - The service ID
* @param {Object} serviceConfig - The service configuration object
* @returns {Service} - The configured service
*/

function getServiceConfiguration(requestMethod) {
    var sitePref = Site.getCurrent().preferences.custom;
      var serviceConfigObject = {
        clientID: sitePref.clientID,
        secretID: sitePref.secretID,
        requestMethod: requestMethod
      }; 
    return serviceConfigObject;
}

function getService(serviceID, serviceConfig) {
    var smartGiftService = LocalServiceRegistry.createService(serviceID, serviceConfig);
    return smartGiftService;
}
/**
 * Service configurations
 *
 * @returns {Object} serviceConfig - The service configuration
 */
function getSmartGiftServiceConfigs(serviceConfigObject) {
    var serviceConfig = {
        createRequest: function (svc, args) {
            var requestJSONString = JSON.stringify(args);
            svc.addHeader('Content-Type', 'application/json');
            svc.addHeader('x-smartgift-client-id', serviceConfigObject.clientID);
            svc.addHeader('x-smartgift-client-secret', serviceConfigObject.secretID);
            svc.setRequestMethod(serviceConfigObject.requestMethod);
            return requestJSONString;
        },
        parseResponse: function (svc, client) {
            return JSON.parse(client.text);
        }
    };
    return serviceConfig;
}

var getSmartGiftCardBasket = function(product, productUrl) {
    var isEnableSmartGift = Site.getCurrent().getCustomPreferenceValue('enableSmartGift');
    var smartGift;
    if (isEnableSmartGift && product) {
        var apiProduct = ProductMgr.getProduct(product.ID);
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
            price: product.priceModel.price.value ? product.priceModel.price.value : 0,
            name: apiProduct.name,
            image: imagePath,
            quantity: quantity
        };
        return smartGift;
    }
}

var sendOrderDetails = function(requestPayload) {
    var serviceConfigObject = getServiceConfiguration('PUT');
    var smartGiftService = getService('smartgift.api.orders.service', getSmartGiftServiceConfigs(serviceConfigObject));
    var url = smartGiftService.getConfiguration().getCredential().URL;
    url = url.toString() + 'complete';
    smartGiftService.setURL(url);
    try {
        var serviceResponse = smartGiftService.call(requestPayload);
        if (!serviceResponse.isOk()) {
            Logger.error(LOG_LOCATION + ' Smartgift: Send Cart Details Service Call. Error code : {0} Error => ResponseStatus: {1} ', serviceResponse.getError().toString(), serviceResponse.getStatus());
        }
    } catch (e) {
        Logger.fatal('Smartgift: {0} in {1} : {2}', e.toString(), e.fileName, e.lineNumber);
    }
}

var getCartDetails = function (trackingCode) {
    var requestPayload = {error: false};
    var serviceConfigObject = getServiceConfiguration('GET');
    var giftService = getService('smartgift.api.orders.service', getSmartGiftServiceConfigs(serviceConfigObject));
    var url = giftService.getConfiguration().getCredential().URL;
    url = url.toString() + 'tc/' + trackingCode;
    giftService.setURL(url);
    try {
        var serviceResponse = giftService.call(trackingCode);
        if (!serviceResponse.isOk()) {
            Logger.error(LOG_LOCATION + ' Smartgift: Get Cart Details Service Call. Error code : {0} Error => ResponseStatus: {1} ', serviceResponse.getError().toString(), serviceResponse.getStatus());
            requestPayload.error = true;
        } else {
            requestPayload.responseObject = serviceResponse.object;
        }
    } catch (e) {
        Logger.fatal('Smartgift: {0} in {1} : {2}', e.toString(), e.fileName, e.lineNumber);
        requestPayload.error = true;
    }
    return requestPayload;
}

exports.sendOrderDetails = sendOrderDetails;
exports.getCartDetails = getCartDetails;
exports.getSmartGiftCardBasket = getSmartGiftCardBasket;

