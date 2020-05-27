'use strict';

var logger = require('dw/system/Logger').getLogger('SOM', '');

/**
 * populateByOrderID Queries order object then runs populateByOrder
 * @param {Object} args the passed in arguments
 * @return {dw.system.Status} Status of the job
 */
function populateByOrderID(args) {
    if (args.OrderID == null) {
        return new Status(Status.ERROR, 'ERROR', 'Order ID parameter is required.');
    }

    var OrderMgr = require('dw/order/OrderMgr');
    var order = OrderMgr.getOrder(args.OrderID);

    if (order == null) {
        return new Status(Status.ERROR, 'ERROR', 'Order not found for ' + args.OrderID);
    }
    populateByOrder(order);
}


/**
 * populateByOrder Adds custom attributes at the order and orderlineitem level to inform Salesforce Order Management of all order details
 * @param {Object} order the order object
 * @return {dw.system.Status} Status of the method
 */
function populateByOrder(order) {
    var Status = require('dw/system/Status');
    var Transaction = require('dw/system/Transaction');
    var collections = require('*/cartridge/scripts/util/collections');
    var addressJSON = {};
    var shippingPriceJSON = {};

    try {
        /**
         * Add pricebookID to Order
         */
        var pricebooks = collections.map(order.productLineItems, function (productLineItem) {
            return productLineItem.product.priceModel.priceInfo.priceBook.ID;
        });

        Transaction.wrap(function () {
            // Set the PriceBook ID
            order.custom.SFCCPriceBookId = pricebooks[0];

            // Add all billing address fields to an object to send to SOM
            addressJSON.billingAddress = getAddressObject(order.billingAddress);

            // Replace the billing address company name
            if (order.billingAddress.companyName && order.billingAddress.companyName !== '') {
                order.billingAddress.custom.SOMCompanyName = order.billingAddress.companyName;
                order.billingAddress.companyName = '';
            }

            addressJSON.shippingAddresses = [];
            collections.forEach(order.shipments, function (shipment) {
                // Add all shipping address fields from each shipment to object to send to SOM
                addressJSON.shippingAddresses.push(
                    getAddressObject(shipment.shippingAddress)
                );
                addressJSON.shippingAddresses[0].shipmentID = shipment.shipmentNo;

                // Replace the shipping address company name
                if (shipment.shippingAddress.companyName && shipment.shippingAddress.companyName !== '') {
                    shipment.shippingAddress.custom.SOMCompanyName = shipment.shippingAddress.companyName;
                    shipment.shippingAddress.companyName = '';
                }

                // Add the shipping price's sabrix tax fields
                shippingPriceJSON = {
                    taxTotal: shipment.shippingLineItems[0].tax.value,
                    sabrixAdditionalCityTotal: shipment.shippingLineItems[0].custom.sabrixAdditionalCityTotal,
                    sabrixAdditionalDistrictTotal: shipment.shippingLineItems[0].custom.sabrixAdditionalDistrictTotal,
                    sabrixCityTotal: shipment.shippingLineItems[0].custom.sabrixCityTotal,
                    sabrixCountyTotal: shipment.shippingLineItems[0].custom.sabrixCountyTotal,
                    sabrixDistrictTotal: shipment.shippingLineItems[0].custom.sabrixDistrictTotal,
                    sabrixStateTotal:
                        shipment.shippingLineItems[0].custom.sabrixStateTotal
                };
                // Add each shipping price adjustment
                shippingPriceJSON.priceAdjustments = [];
                collections.forEach(shipment.shippingLineItems[0].getShippingPriceAdjustments(), function (priceAdjustment) {
                    shippingPriceJSON.priceAdjustments.push(getPriceAdjustmentObject(priceAdjustment));
                }
                );

                order.custom.SOMShippingPriceAdjustments = JSON.stringify(shippingPriceJSON);
                order.custom.SOMAddressData = JSON.stringify(addressJSON);

                /**
                 * Add each product's price adjustment(s)
                 */
                collections.forEach(order.productLineItems, function (productLineItem) {
                    var productPriceAdjustments = [];

                    collections.forEach(productLineItem.priceAdjustments, function (priceAdjustment) {
                        productPriceAdjustments.push(getPriceAdjustmentObject(priceAdjustment));
                    });

                    productLineItem.custom.SOMProductPriceAdjustments = JSON.stringify(productPriceAdjustments);
                });

                /**
                 * Add each order price adjustment
                 */
                var orderPriceAdjustments = [];
                collections.forEach(order.priceAdjustments, function (priceAdjustment) {
                    orderPriceAdjustments.push(getPriceAdjustmentObject(priceAdjustment));
                });
                order.custom.SOMOrderPriceAdjustments = JSON.stringify(orderPriceAdjustments);
            });
        });
    } catch (e) {
        var _e = e;
        logger.error(e);
        logger.fatal('CheckoutServices.js failure: ' + order.orderNo + ' - ' + e.toString());
        return new Status(Status.ERROR, 'ERROR', 'populateOrderJSON failed. Fatal log sent.');
    }
    return new Status(Status.OK, 'OK', 'populateOrderJSON finished successfully for order ' + order.orderNo);
}

/**
 * getAddressObject returns an object with address data
 * @param {Object} address the address object
 * @return {Object} custom object for storing as json
 */
function getAddressObject(address) {
    return {
        address1: address.address1,
        address2: address.address2,
        city: address.city,
        companyName: address.companyName,
        countryCode: address.countryCode,
        fullName: address.fullName,
        firstName: address.firstName,
        lastName: address.lastName,
        phone: address.phone,
        postalCode: address.postalCode,
        stateCode: address.stateCode
    };
}

/**
 * getPriceAdjustmentObject returns an object with price adjustment data
 * @param {Object} priceAdjustment the price adjustment object
 * @return {Object} custom object for storing as json
 */
function getPriceAdjustmentObject(priceAdjustment) {
    return {
        name: priceAdjustment.promotionID,
        quantity: priceAdjustment.quantity,
        grossPrice: priceAdjustment.grossPrice.value,
        netPrice: priceAdjustment.netPrice.value,
        taxTotal: priceAdjustment.tax.value,
        sabrixCityTotal: priceAdjustment.custom.sabrixCityTotal,
        sabrixDistrictTotal: priceAdjustment.custom.sabrixDistrictTotal,
        sabrixCountyTotal: priceAdjustment.custom.sabrixCountyTotal,
        sabrixStateTotal: priceAdjustment.custom.sabrixStateTotal,
        sabrixAdditionalCityTotal: priceAdjustment.custom.sabrixAdditionalCityTotal,
        sabrixAdditionalDistrictTotal: priceAdjustment.custom.sabrixAdditionalDistrictTotal
    };
}

module.exports = {
    populateByOrder: populateByOrder,
    populateByOrderID: populateByOrderID
};
