'use strict';

var ShippingMethodBase = module.superModule;

var Site = require('dw/system/Site');

var shippingMethodHelper = require('*/cartridge/scripts/helpers/shippingMethodHelper'); 

/**
 * Plain JS object that represents a DW Script API dw.order.ShippingMethod object
 * @param {dw.order.ShippingMethod} shippingMethod - the default shipment of the current basket
 * @param {dw.order.Shipment} [shipment] - a Shipment
 */
function ShippingMethodModel(shippingMethod, shipment) {
    ShippingMethodBase.call(this, shippingMethod, shipment);
    if (shipment && Site.current.getCustomPreferenceValue('enableActualShippingEstimations')) {
        this.deliveryDate = shippingMethodHelper.getShippingDate(shippingMethod);
    }
}

module.exports = ShippingMethodModel;