'use strict';

var Status = require('dw/system/Status');
var ProductInventoryMgr = require('dw/catalog/ProductInventoryMgr');
var OrderUtilCode = require('~/cartridge/scripts/util/OrderUtilCode');
var orderCreateHelper = require('*/cartridge/scripts/util/OrderCreateHelper');
var socialCheckoutHelpers = require('int_social_checkout/cartridge/scripts/util/socialCheckoutHelpers');
var OciHelper = require('*/cartridge/scripts/oci/helpers/ociHelpers.js');

var ReponseCode = OrderUtilCode.RESPONSE_CODE;

/**
 * Check for existing external order on social channel before creating a new order.
 * @param {*} order order
 * @returns {Status} OK if the order does not exists or ERROR if the order already exists
 */
function beforePOST(order) {
    var responseStatus = ReponseCode.BEFORE_POST_SUCCESS;
    var customExtOrderID = order.c_externalOrderId;
    var channelType = socialCheckoutHelpers.getChannelType(order.channelType);
    var productItems = order.productItems;
    var shipmentItems = order.shipments;

    orderCreateHelper.setCurrencySession(order);

    // product validation
    if (productItems) {
        var validateProducts = orderCreateHelper.validateProducts(productItems);
        if (!validateProducts.success) {
            responseStatus = validateProducts.responseCode;
            return new Status(responseStatus.status, responseStatus.code, responseStatus.msg);
        }
    }

    // shipment validation
    if (shipmentItems) {
        var validateShipments = orderCreateHelper.validateShipments(shipmentItems);
        if (!validateShipments.success) {
            responseStatus = validateShipments.responseCode;
            return new Status(responseStatus.status, responseStatus.code, responseStatus.msg);
        }
    }

    // duplicate order validation
    if (!empty(customExtOrderID)) {
        var externalOrderExists = orderCreateHelper.orderExistsByChannel(customExtOrderID, channelType);

        if (externalOrderExists) {
            responseStatus = ReponseCode.ORDER_ALREADY_EXISTS_CHANNEL;
        }
    }

    return new Status(responseStatus.status, responseStatus.code, responseStatus.msg);
}

/**
 * Get the product availability call on oci and make product reservations if possible.
 * @param {*} order order
 * @returns {Status} OK if the order does not exists or ERROR if the order already exists
 */
function afterPOST(order) {
    var responseStatus = ReponseCode.AFTER_POST_SUCCESS;

    var inventoryIntegrationMode = ProductInventoryMgr.getInventoryIntegrationMode();

    if (inventoryIntegrationMode === ProductInventoryMgr.INTEGRATIONMODE_OCI_CACHE || inventoryIntegrationMode === ProductInventoryMgr.INTEGRATIONMODE_OCI) {
        var ociToken = OciHelper.getOCIAuthentication();
        if (!ociToken) {
            responseStatus = ReponseCode.OCI_RESERVATION_ERROR;
            return new Status(responseStatus.status, responseStatus.code, responseStatus.msg);
        }

        var productsAvailability = OciHelper.getProductAvailabilityOCI(order, ociToken);
        if (productsAvailability.error || !productsAvailability.allProductsAvailable) {
            responseStatus = ReponseCode.OCI_RESERVATION_UNAVAILABLE;
            return new Status(responseStatus.status, responseStatus.code, responseStatus.msg);
        }

        var resultReservation = OciHelper.makeProductsReservation(productsAvailability.requestReservation, ociToken);
        if (!resultReservation.ok) {
            responseStatus = ReponseCode.OCI_RESERVATION_ERROR;
            return new Status(responseStatus.status, responseStatus.code, responseStatus.msg);
        }
    }

    return new Status(responseStatus.status, responseStatus.code, responseStatus.msg);
}

module.exports = {
    beforePOST: beforePOST,
    afterPOST: afterPOST
};
