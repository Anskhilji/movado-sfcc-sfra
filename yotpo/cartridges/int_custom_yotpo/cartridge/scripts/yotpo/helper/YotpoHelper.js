var AuthenticationModel = require('int_yotpo/cartridge/scripts/yotpo/model/authentication/AuthenticationModel');
var CommonModel = require('int_yotpo/cartridge/scripts/yotpo/model/common/CommonModel.js');
var Constants = require('int_yotpo/cartridge/scripts/yotpo/utils/Constants');
var DeleteOrderServiceRegistry = require('~/cartridge/scripts/yotpo/serviceregistry/DeleteOrderServiceRegistry');
var Result = require('dw/svc/Result');
var YotpoLogger = require('int_yotpo/cartridge/scripts/yotpo/utils/YotpoLogger');
var yotpoIntegrationHelper = require('*/cartridge/scripts/common/integrationHelper.js');


/**
 * This function delete the order from Yotpo. It makes HTTP request and reads the response and logs it.
 * It returns error in case of some problem in order deletion.
 *
 * @param {Object} orderJSON: The order JSON in String format to be deleted from Yotpo.
 * @param {string} utokenAuthCode: The utokenAuthCode to connect to Yotpo.
 *
 * @returns {boolean} authenticationError: The flag to indicate if the error was due to Authentication failure.
 */
function deleteOrderFromYotpo (ordersJSON, appKey) {
    var authenticationError = false;
    var logLocation = 'YotpoHelper~deleteOrderFromYotpo';
    
    try {
        var yotpoURL = DeleteOrderServiceRegistry.yotpoDeleteOrdersSvc.getConfiguration().getCredential().getURL();
        
        if (empty(yotpoURL)) {
            YotpoLogger.logMessage('The URL is empty for int_yotpo.https.post.export.purchase.api service.', 'error', logLocation);
            throw Constants.EXPORT_ORDER_CONFIG_ERROR;
        }
        
        yotpoURL = yotpoURL.replace('[appKey]', appKey.toString());
        DeleteOrderServiceRegistry.yotpoDeleteOrdersSvc.setURL(yotpoURL);
        
        var result = DeleteOrderServiceRegistry.yotpoDeleteOrdersSvc.call(ordersJSON);
        if (result.status === Result.OK) {
            YotpoLogger.logMessage('Order deleted successfully.', 'debug', logLocation);
        } else if (result.status === Result.ERROR) {
            YotpoLogger.logMessage('The request to delete order failed authentication. Error code: ' + result + '\n Error Text is: ' + result.msg + ' ' + result.errorMessage.error, 'error', logLocation);
            authenticationError = true;
        } else {
            YotpoLogger.logMessage('Could not delete order from Yotpo - HTTP Status Code is: ' + result.error + '\n Error Text is: ' + result.errorMessage, 'error', logLocation);
            throw Constants.DELETE_ORDER_SERVICE_ERROR;
        }
        
    } catch (e) {
        YotpoLogger.logMessage('Error occured while trying to delete the record - ' + e, 'error', logLocation);
        throw Constants.DELETE_ORDER_SERVICE_ERROR;
    }
    return authenticationError;
}

/**
 * This is the main function called to delete order from yotpo.
 * 
 * @param {Object} order: The order to be deleted from Yotpo.
 */
function deleteOrder(order) {
    var YotpoUtils = require('*/cartridge/scripts/yotpo/utils/YotpoUtils');

    var authenticationError;
    var authenticationResult;
    var currentLocaleID;
    var ordersJSON;
    var utokenAuthCode;
    var yotpoAppKey;
    var yotpoConfiguration;
    var yotpoConfigurations;
    
    var logLocation = 'YotpoHelper~deleteOrder';
    if (!YotpoUtils.isCartridgeEnabled()) {
        return;
    }
    try {
        yotpoConfigurations = CommonModel.loadAllYotpoConfigurations();
    } catch (e) {
        return;
    }
    
    var ordersJSON = prepareJsonForOrderDelete(order, utokenAuthCode);
    for (var loopIndex = 0; loopIndex < yotpoConfigurations.size(); loopIndex++) {
        yotpoConfiguration = yotpoConfigurations[loopIndex];
        
        currentLocaleID = yotpoConfiguration.custom.localeID;
        utokenAuthCode = yotpoConfiguration.custom.utokenAuthCode;
        yotpoAppKey = yotpoConfiguration.custom.appKey;
        ordersJSON = prepareJsonForOrderDelete(order, utokenAuthCode);
        if (!empty(ordersJSON)) {

            try {
                authenticationError = deleteOrderFromYotpo(ordersJSON, yotpoAppKey);
            } catch (ex) {
                YotpoLogger.logMessage('Error occured while trying to delete the order against order number:'+ order.orderNo + '. Exception is: ' + ex, 'error', logLocation);
                authenticationError = null;
            }

            if (authenticationError) {
                authenticationResult = AuthenticationModel.authenticate(yotpoConfiguration);
                utokenAuthCode = authenticationResult.updatedUTokenAuthCode;
                updateUToken(currentLocaleID, utokenAuthCode);
                
                ordersJSON = updateUTokenInOrderJSON(utokenAuthCode, ordersJSON);
                
             // retry delete
                authenticationError = deleteOrderFromYotpo(ordersJSON, yotpoAppKey);
                
             // If the error persist then should terminate here
                if (authenticationError) {
                    throw Constants.DELETE_ORDER_RETRY_ERROR;
                }
            }
        }
    }
}

/**
 * This function will extract all order information and will prepare the JSON to be deleted from Yotpo.
 *
 * @param {Object} order: The order to process
 * @param {Object} utokenAuthCode: The utokenAuthCode
 *
 * @returns {Object} Object
 */
function prepareJsonForOrderDelete(order, utokenAuthCode) {
    var ordersListJSON = {
        utoken: utokenAuthCode,
        orders: ''
    }
    var singleOrderJSON = {
            order_id: order.getOrderNo(),
            skus: ''
    }
    var skus = [];
    
    var orderLineItems = order.getAllProductLineItems();
    var orderLineItemsIterator = orderLineItems.iterator();
    var productLineItem;
    while (orderLineItemsIterator.hasNext()) {
        productLineItem = orderLineItemsIterator.next();
        skus.push(productLineItem.productID);
    }
    singleOrderJSON.skus = skus;
    ordersListJSON.orders = [singleOrderJSON];
    ordersListJSON = JSON.stringify(ordersListJSON);
    
    return ordersListJSON;
}

/**
 * It updates the utoken retrieved from authentication request in Yotpo Configuration based on current locale ID.
 *
 * @param {string} localeID: The Locale ID currently in process.
 * @param {string} uTokenAuthCode: The access token retrieved from the authentication request to Yotpo.
 *
 * @returns {boolean} true
 */
function updateUToken(localeID, uTokenAuthCode) {
    var CustomObjectMgr = require('dw/object/CustomObjectMgr');
    var Transaction = require('dw/system/Transaction');

    var yotpoConfiguration = CustomObjectMgr.getCustomObject(Constants.YOTPO_CONFIGURATION_OBJECT, localeID);

    // save utokenAuthCode
    Transaction.wrap(function () {
        yotpoConfiguration.custom.utokenAuthCode = uTokenAuthCode;
    });

    return true;
}

/**
 * This function updates the utokenAuthCode in OrderJSON. The utokenAuthCode is retrieved
 * from authentication and should be updated in existing orderJSON to retry the order deletion.
 *
 * @param {string} utokenAuthCode: The u-token authentication code
 * @param {Object} orderJSON: The order JSON in String format to be exported to Yotpo.
 *
 * @returns {Object} updatedOrderJSON: The updated order JSON in string format
 */
function updateUTokenInOrderJSON(utokenAuthCode, orderJSON) {
    var orderJSONParsed = JSON.parse(orderJSON);
    orderJSONParsed.utoken = utokenAuthCode; // Update utoken
    var updatedOrderJSON = JSON.stringify(orderJSONParsed);

    return updatedOrderJSON;
}

/**
 * this function is use to push each child yotpo review in individual child.
 *
 * @param {Object} yotpoConfig - JSON object of yotpo configurations
 * @param {string} product - object
 *
 * @returns {Object}  individual Product Rating review
 */
function getIndividualRatingOrReviewsData(yotpoConfig, product) {
    if(product.individualProducts.length > 0) {
        var yotpoIndividualProductData = {};
        for(var i = 0; i < product.individualProducts.length; i++) {
            yotpoIndividualProductData = yotpoIntegrationHelper.getRatingsOrReviewsData(yotpoConfig, product.individualProducts[i].id);
            product.individualProducts[i].yotpoIndividualProductData = yotpoIndividualProductData;
            }
        }
}

module.exports = {
    deleteOrder: deleteOrder,
    getIndividualRatingOrReviewsData: getIndividualRatingOrReviewsData
};