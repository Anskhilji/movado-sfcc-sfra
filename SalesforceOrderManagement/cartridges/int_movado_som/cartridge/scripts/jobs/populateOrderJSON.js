'use strict';

var Transaction = require('dw/system/Transaction');
var Status = require('dw/system/Status');
var logger = require('dw/system/Logger').getLogger('SOM', '');
var collections = require('*/cartridge/scripts/util/collections');
var _ = require('*/cartridge/scripts/libs/underscore');

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
        countryCode: address.countryCode.value,
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
    var ret = {
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

    if (priceAdjustment.promotion) {
        ret.promoName = priceAdjustment.promotion.name;
    } else {
        ret.promoName = priceAdjustment.promotionID; // TODO: check order ingestion for mapping - SKU + ' - ' + promoName;
    }

    if (priceAdjustment.reasonCode && priceAdjustment.reasonCode.value) {
        // e.g., 'LOYALTY' for Swell/Yotpo points applications
        ret.reasonCode = priceAdjustment.reasonCode.value;
    } else {
        ret.reasonCode = '';
    }

    return ret;
}


/**
 * populateByOrderID Queries order object then runs populateByOrder
 * @param {Object} args the passed in arguments
 * @return {dw.system.Status} Status of the job
 */
function populateByOrderID(args) {
    var OrderMgr = require('dw/order/OrderMgr');
    if (args.OrderID == null) {
        return new Status(Status.ERROR, 'ERROR', 'Order ID parameter is required.');
    }
    var orderIDs = args.OrderID.split(',');

    Transaction.wrap(function () {
        orderIDs.forEach(function (orderID) {
            var order = OrderMgr.getOrder(orderID);
            if (order == null) {
                return new Status(Status.ERROR, 'ERROR', 'Order not found for ' + args.OrderID);
            }

            logger.debug('Starting: ' + order.orderNo);
            populateByOrder(order);

        });
    });

    return true;
}


/**
 * populateByOrder Adds custom attributes at the order and orderlineitem level to inform Salesforce Order Management of all order details
 * @param {Object} order the order object
 * @return {dw.system.Status} Status of the method
 */
function populateByOrder(order) {
    var addressJSON = {};
    var shippingPriceJSON = {};

    try {

        /**
         * Add pricebookID to Order
         */
        var pricebooks = collections.map(order.productLineItems, function (productLineItem) {
            return productLineItem.product.priceModel.priceInfo.priceBook.ID;
        });

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
                sabrixStateTotal: shipment.shippingLineItems[0].custom.sabrixStateTotal
            };

            // Add each shipping price adjustment
            shippingPriceJSON.priceAdjustments = [];
            collections.forEach(shipment.shippingLineItems[0].getShippingPriceAdjustments(), function (priceAdjustment) {
                shippingPriceJSON.priceAdjustments.push(getPriceAdjustmentObject(priceAdjustment));
            });

            order.custom.SOMShippingPriceAdjustments = JSON.stringify(shippingPriceJSON);
            order.custom.SOMAddressData = JSON.stringify(addressJSON);

            /**
             * Add each product's price adjustment(s)
             */
            collections.forEach(shipment.productLineItems, function (productLineItem) {
                var productPriceAdjustments = [];

                collections.forEach(productLineItem.priceAdjustments, function (priceAdjustment) {
                    productPriceAdjustments.push(getPriceAdjustmentObject(priceAdjustment));
                });

                productLineItem.custom.SOMProductPriceAdjustments = JSON.stringify(productPriceAdjustments);

                // Copy long ESW attribute names to shorter alternative
                productLineItem.custom.eswRetailerCurrencyItemPriceInfoBeforeDi = productLineItem.custom.eswRetailerCurrencyItemPriceInfoBeforeDiscount;
                productLineItem.custom.eswShopperCurrencyItemPriceInfoBeforeDis = productLineItem.custom.eswShopperCurrencyItemPriceInfoBeforeDiscount;
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

        // Set Pre-capture status for Adyen PayPal transactions
        var PaymentMgr = require('dw/order/PaymentMgr');
        var arrPi = order.getPaymentInstruments().toArray();

        for (var i = 0; i < arrPi.length; i++) {
            switch (arrPi[i].getPaymentTransaction().getPaymentProcessor().getID()) {
                case 'ADYEN_PAYPAL':
                    arrPi[i].getPaymentTransaction().setType(dw.order.PaymentTransaction.TYPE_CAPTURE);
                    break;
                case 'Adyen':
                    arrPi[i].getPaymentTransaction().setType(dw.order.PaymentTransaction.TYPE_CAPTURE);
                    arrPi[i].getPaymentTransaction().setTransactionID(order.custom.Adyen_pspReference);
                    break;
                default:
                    break;
            }
        }

    } catch (e) {
        logger.error(e);
        logger.fatal('CheckoutServices.js failure: ' + order.orderNo + ' - ' + e.toString());
        return new Status(Status.ERROR, 'ERROR', 'populateOrderJSON failed. Fatal log sent.');
    }
    return new Status(Status.OK, 'OK', 'populateOrderJSON finished successfully for order ' + order.orderNo);
}

module.exports = {
    populateByOrder: populateByOrder,
    populateByOrderID: populateByOrderID
};
