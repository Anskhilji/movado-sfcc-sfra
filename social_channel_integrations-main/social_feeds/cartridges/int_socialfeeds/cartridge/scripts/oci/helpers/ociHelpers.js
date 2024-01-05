'use strict';

var Site = require('dw/system/Site');
var Helper = require('../util/helpers');
var ServiceMgr = require('../services/ServiceMgr');
var UUIDUtils = require('dw/util/UUIDUtils');

/**
 * @description Returns an access token to use with the OCI integration calls
 * @returns {*} Returns undefined if empty string or exception encountered
 */
function getOCIAuthentication() {
    var OCIReservationsCustomObjectId = Site.current.getCustomPreferenceValue('OCIReservationsCustomObjectId');
    var co = Helper.getConfigCO(OCIReservationsCustomObjectId);

    var token = Helper.getAccessToken({
        OrgId: Helper.getOrgId(co)
    });

    if (!token) {
        return null;
    }

    return token;
}

/**
 * @description adds an array with all product IDs related to the order in the body object
 * @param {Object} order - the order model
 * @param {Object} body - the object containing the information that will be sent in the request to the service
 */
function getLineItemIds(order, body) {
    var lineItemsIds = order.productLineItems.toArray().map(li => li.productID);
    body.skus = lineItemsIds;
}

/**
 * @description adds an array with all locations and group locations, in separate arrays, configured for the site in the form of an array in the body object
 * @param {Object} body - the object containing the information that will be sent in the request to the service
 */
function getLocationsAndLocationGroups(body) {
    var OCIReservationsCustomObjectId = Site.current.getCustomPreferenceValue('OCIReservationsCustomObjectId');
    var co = Helper.getConfigCO(OCIReservationsCustomObjectId);

    if (co.custom.LocationIds) {
        body.locations = co.custom.LocationIds && co.custom.LocationIds.split(',');
    }

    if (co.custom.LocationGroupIds) {
        body.groups = co.custom.LocationGroupIds && co.custom.LocationGroupIds.split(',');
    }
}

/**
 * @description Utilizes other functions to decorate the 'body' object with the necessary information
 * @param {Object} order - the order model
 * @param {Object} body - the object containing the information that will be sent in the request to the service
 */
function getBodyAvailabilityCall(order, body) {
    getLineItemIds(order, body);
    getLocationsAndLocationGroups(body);
}

/**
 * @description Returns which location or location group has the desired product's stock availability
 * @param {string} locationType - The type of inventory for which availability will be checked.
 * @param {Object} lineItem - the productLineItem model
 * @param {Object} availabilityResult - Object that holds the product availability for each location/group location
 * @returns {*} Returns undefined if empty string or exception encountered
 */
function getProductAvailabilityByType(locationType, lineItem, availabilityResult) {
    if (locationType in availabilityResult) {
        for (var i = 0; i < availabilityResult[locationType].length; i++) {
            var productRecord = availabilityResult[locationType][i].records.find(record => record.sku === lineItem.productID);
            if (productRecord) {
                if (lineItem.quantity.getValue() <= productRecord.ato) {
                    return {
                        type: locationType,
                        id: availabilityResult[locationType][i].id,
                        reservation: {
                            sku: lineItem.productID,
                            quantity: lineItem.quantity.getValue()
                        }
                    };
                }
            }
        }
        return null;
    }
    return null;
}

/**
 * @description Returns which location or location group has the desired product's stock availability
 * @param {Object} lineItem - the productLineItem model
 * @param {Object} availabilityResult - Object that holds the product availability for each location/group location
 * @returns {*} Returns undefined if empty string or exception encountered
 */
function getProductAvailability(lineItem, availabilityResult) {
    var result = getProductAvailabilityByType('groups', lineItem, availabilityResult);
    if (result) {
        return result;
    }

    result = getProductAvailabilityByType('locations', lineItem, availabilityResult);
    return result;
}

/**
 * @description Groups all available products by type and their corresponding inventory IDs for which reservation orders can be placed
 * @param {Array} inventories - Array containing all stock information without any consolidation by inventory ID
 * @returns {*} Returns array with values grouped by inventory ID.
 */
function organizeRecordsByInventoryID(inventories) {
    var inventoryIds = [];
    var recordsByInventoryID = [];

    inventories.forEach(group => !inventoryIds.includes(group.id) ? inventoryIds.push(group.id) : null);

    inventoryIds.forEach((inventoryId) => {
        var inventory = {
            id: inventoryId,
            reservations: []
        };

        var inventoryReservations = inventories.filter(group => inventoryId === group.id);
        inventoryReservations.forEach(ir => inventory.reservations.push(ir.reservation));
        recordsByInventoryID.push(inventory);
    });

    return recordsByInventoryID;
}

/**
 * @description consolidates data for making the reservation call
 * @param {*} order - the order model
 * @param {*} availabilityResult - Object that holds the product availability for each location/group location
 * @returns {Object} Returns consolidated data for making the reservation call. In case any product is not available, it will return which product's availability check failed
 */
function getReservationRequest(order, availabilityResult) {
    var allProductsAvailable = true;
    var groups = [];
    var locations = [];
    var unavailableProducts = [];
    var requestReservation = {};

    order.productLineItems.toArray().forEach((li) => {
        var productAvailability = getProductAvailability(li, availabilityResult);
        if (!productAvailability) {
            unavailableProducts.push({
                id: li.productID,
                name: li.productName,
                quantity: li.quantity.getValue()
            });
            allProductsAvailable = false;
        } else {
            productAvailability.type === 'groups' ? groups.push(productAvailability) : locations.push(productAvailability); // eslint-disable-line
        }
    });

    if (!allProductsAvailable) {
        return {
            allProductsAvailable: allProductsAvailable,
            unavailableProducts: unavailableProducts
        };
    }

    if (groups.length > 0) {
        requestReservation.groups = organizeRecordsByInventoryID(groups);
    }

    if (locations.length > 0) {
        requestReservation.locations = organizeRecordsByInventoryID(locations);
    }

    requestReservation.externalRefId = UUIDUtils.createUUID();

    return {
        allProductsAvailable: allProductsAvailable,
        requestReservation: requestReservation
    };
}

/**
 * @description make the product availability call on oci
 * @param {*} order - the order model
 * @param {string} token Access token
 * @returns {Object} Returns the response of the request, and if the request fails, it returns the generated error
 */
function getProductAvailabilityOCI(order, token) {
    var bodyAvailabilityCall = {};
    getBodyAvailabilityCall(order, bodyAvailabilityCall);

    var availabilityService = ServiceMgr.getAvailabilityService();
    var availabilityResult = availabilityService.call({
        token: token,
        body: bodyAvailabilityCall
    });

    if (!availabilityResult.ok) {
        return { error: true };
    }

    var reservationRequest = getReservationRequest(order, availabilityResult.object);

    return reservationRequest;
}

/**
 * @description Make products reservations on OCI
 * @param {*} requestReservation The request body that will be executed to make an OCI reservation
 * @param {string} token Access token
 * @returns {Object} Returns the response of the request, and if the request fails, it returns the generated error
 */
function makeProductsReservation(requestReservation, token) {
    var reservationService = ServiceMgr.getReservationService();
    var reservationServiceResult = reservationService.call({
        token: token,
        body: requestReservation
    });

    return reservationServiceResult;
}

module.exports = {
    getOCIAuthentication: getOCIAuthentication,
    getProductAvailabilityOCI: getProductAvailabilityOCI,
    makeProductsReservation: makeProductsReservation
};
