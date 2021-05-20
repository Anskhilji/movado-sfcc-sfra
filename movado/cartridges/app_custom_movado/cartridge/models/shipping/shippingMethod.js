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
    this.shippingCostValue = shippingMethodHelper.getShippingCostValue(shippingMethod, shipment);
    if (session.customer && shipment && Site.current.getCustomPreferenceValue('enableActualShippingEstimations')) {
        this.deliveryDate = shippingMethodHelper.getShippingDate(shippingMethod);   
    }
    if (shipment) {
        this.validShippingMethod = !empty(shippingMethod.custom.isHideFromCheckout) ? shippingMethod.custom.isHideFromCheckout: false;
    }
}

module.exports = ShippingMethodModel;