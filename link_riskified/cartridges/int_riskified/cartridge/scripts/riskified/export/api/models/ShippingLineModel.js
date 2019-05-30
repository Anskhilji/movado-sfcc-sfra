function create(order) {

    var shipmentTitle,
        orderShipmentIt,
        shipment,
        shipments = [];

    var regex = "([\"\'\\\/])";
    var regExp = new RegExp(regex, 'gi');

    var RCUtilities = require('~/cartridge/scripts/riskified/util/RCUtilities');

    orderShipmentIt = order.getShipments().iterator();

    while (orderShipmentIt.hasNext()) {
        shipment = orderShipmentIt.next();

        if (shipment.shippingMethod != null) {
            shipmentTitle = shipment.shippingMethod.displayName;
        } else {
            shipmentTitle = shipment.shippingMethodID;
        }

        shipments.push({
            code  : RCUtilities.escape(shipment.shippingMethodID, regExp, '', true),
            price : shipment.adjustedShippingTotalPrice.decimalValue.toString(),
            title : RCUtilities.escape(shipmentTitle, regExp, '', true)
        });
    }

    return shipments;
}

exports.create = create;
