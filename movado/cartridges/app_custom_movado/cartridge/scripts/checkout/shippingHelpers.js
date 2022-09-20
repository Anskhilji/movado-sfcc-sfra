'use strict';

var baseShippingHelpers = module.superModule;
var collections = require('*/cartridge/scripts/util/collections');
var ShippingModel = require('*/cartridge/models/shipping');


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
    var iterator = shippingMethods.iterator();
    while (iterator.hasNext()) {
        var shippingMethod = iterator.next();
        var storePickupEnabled = shippingMethod.custom.storePickupEnabled ? shippingMethod.custom.storePickupEnabled : false;
        if (storePickupEnabled) {
            var shippingMethodId = shippingMethod.ID;
            shipment.setShippingMethod(shippingMethod);
            break;
        }
    }
}

baseShippingHelpers.getShippingModels = getShippingModels;
baseShippingHelpers.selectBOPISShippingMethod = selectBOPISShippingMethod;
module.exports = baseShippingHelpers;