'use strict';

var baseShippingHelpers = module.superModule;
var collections = require('*/cartridge/scripts/util/collections');
var ShippingModel = require('*/cartridge/models/shipping');
var ShippingMgr = require('dw/order/ShippingMgr');
var ShippingMethodModel = require('*/cartridge/models/shipping/shippingMethod');


// Public (class) static model functions

/**
 * Plain JS object that represents a DW Script API dw.order.ShippingMethod object
 * @param {dw.order.Basket} currentBasket - the target Basket object
 * @param {Object} customer - the associated Customer Model object
 * @param {string} containerView - view of the shipping models (order or basket)
 * @param {boolean} defaultShipment - default shipment flag
 * @returns {dw.util.ArrayList} an array of ShippingModels
 */
function getShippingModels(currentBasket, customer, containerView, defaultShipment) {
    var shipments = currentBasket ? currentBasket.getShipments() : null;

    if (!shipments) return [];

    return collections.map(shipments, function (shipment) {
        return new ShippingModel(shipment, null, customer, containerView, defaultShipment);
    });
}

function selectBOPISShippingMethod(shippingMethods, shipment) {
    var shippingMethod;
    var storePickupEnabled;
    var iterator = shippingMethods.iterator();
    while (iterator.hasNext()) {
        shippingMethod = iterator.next();
        storePickupEnabled = shippingMethod.custom.storePickupEnabled ? shippingMethod.custom.storePickupEnabled : false;
        if (storePickupEnabled) {
            var shippingMethodId = shippingMethod.ID;
            shipment.setShippingMethod(shippingMethod);
            break;
        }
    }
}

/**
 * Plain JS object that represents a DW Script API dw.order.ShippingMethod object
 * @param {dw.order.Shipment} shipment - the target Shipment
 * @param {Object} [address] - optional address object
 * @returns {dw.util.Collection} an array of ShippingModels
 */
 function getApplicableShippingMethods(shipment, address) {
    if (!shipment) return null;

    var shipmentShippingModel = ShippingMgr.getShipmentShippingModel(shipment);

    var shippingMethods;
    if (address) {
        shippingMethods = shipmentShippingModel.getApplicableShippingMethods(address);
    } else {
        shippingMethods = shipmentShippingModel.getApplicableShippingMethods();
    }

    // Filter out whatever the method associated with in store pickup
    var filteredMethods = [];
    collections.forEach(shippingMethods, function (shippingMethod) {
        if (session.privacy.pickupFromStore) {
            if (shippingMethod.custom.storePickupEnabled) {
                filteredMethods.push(new ShippingMethodModel(shippingMethod, shipment));
            }
        } else {
            if (!shippingMethod.custom.storePickupEnabled) {
                filteredMethods.push(new ShippingMethodModel(shippingMethod, shipment));
            }
        }
    });

    return filteredMethods;
}

baseShippingHelpers.getShippingModels = getShippingModels;
baseShippingHelpers.selectBOPISShippingMethod = selectBOPISShippingMethod;
baseShippingHelpers.getApplicableShippingMethods = getApplicableShippingMethods;
module.exports = baseShippingHelpers;