function create(order) {

    var shipmentTitle,
        orderShipmentIt,
        shipment,
        shipments = [];

    var regex = "([\"\'\\\/])";
    var regExp = new RegExp(regex, 'gi');

    var RCUtilities = require('*/cartridge/scripts/riskified/util/RCUtilities');

    orderShipmentIt = order.getShipments().iterator();

    while (orderShipmentIt.hasNext()) {
        shipment = orderShipmentIt.next();

        if (shipment.shippingMethod != null) {
            shipmentTitle = shipment.shippingMethod.displayName;
        } else {
            shipmentTitle = shipment.shippingMethodID;
        }

        /**
         * Custom Start: Add logic to updated shipmentTitle in case of BOPIS
         */
        var Constants = require("*/cartridge/scripts/riskified/utils/Constants");
        if (!empty(shipment.shippingMethod) && shipment.shippingMethod.custom.storePickupEnabled) {
            shipmentTitle = Constants.STORE_PICKUP;
        }
        /**
         * Custom End:
         */

        shipments.push({
            code: RCUtilities.escape(shipment.shippingMethodID, regExp, '', true),
            price: shipment.adjustedShippingTotalPrice.decimalValue.toString(),
            title: RCUtilities.escape(shipmentTitle, regExp, '', true)
        });
    }

    return shipments;
}

exports.create = create;
