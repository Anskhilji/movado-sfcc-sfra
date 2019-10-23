'use strict';

var ShippingMethodBase = module.superModule;

var Resource = require('dw/web/Resource');
var ShippingMgr = require('dw/order/ShippingMgr');

var formatCurrency = require('*/cartridge/scripts/util/formatting').formatCurrency;

/**
 * Returns shippingCost property for a specific Shipment / ShippingMethod pair
 * @param {dw.order.ShippingMethod} shippingMethod - the default shipment of the current basket
 * @param {dw.order.Shipment} shipment - a shipment of the current basket
 * @returns {string} String representation of Shipping Cost
 */
function getShippingCost(shippingMethod, shipment) {
    var shipmentShippingModel = ShippingMgr.getShipmentShippingModel(shipment);
    var shippingCost = shipmentShippingModel.getShippingCost(shippingMethod);
    this.shipingCostDecimalValue = shippingCost.getAmount().getDecimalValue();

    return formatCurrency(shippingCost.amount.value, shippingCost.amount.currencyCode);
}

function getIsFree(shippingMethod, shipment) {
    var freeShippingAmount = 0.00;
    var isFree =  this.shipingCostDecimalValue == freeShippingAmount || this.shipingCostDecimalValue == '-' ? true : false;
    var freeShippingLabel = Resource.msg('shipping.free.label.text','shipping',null);
    return {isFree : isFree, freeShippingLabel : freeShippingLabel};
}


/**
 * Plain JS object that represents a DW Script API dw.order.ShippingMethod object
 * @param {dw.order.ShippingMethod} shippingMethod - the default shipment of the current basket
 * @param {dw.order.Shipment} [shipment] - a Shipment
 */
function ShippingMethodModel(shippingMethod, shipment) {
    ShippingMethodBase.call(this, shippingMethod, shipment);
    if (shipment) {
        this.shippingCost = getShippingCost(shippingMethod, shipment);
        this.freeShippingContent = getIsFree(shippingMethod, shipment);
    }
}

module.exports = ShippingMethodModel;
