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

            // Additionally handle PayPal transaction conversion
            try {
                addDummyPaymentTransaction(order);
            } catch (exSOM) {
                //var _e = exSOM;
                logger.error('SOM attribute process failed: ' + exSOM.message);
            }
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

        // !!!!!!!!!!!!!!!!!!!!!! DEBUG !!!!!!!!!!
        // Add authTime and Adyen_merchantSig to the transaction
        //collections.forEach(order.getPaymentInstruments(), function (pi) {
            //pi.getPaymentTransaction().custom.authTime = '05:21:52.054';
            //pi.getPaymentTransaction().custom.Adyen_merchantSig = 'Test2_PaymentTransactionSignature';
        //});
        // !!!!!!!!!!!!!!!!!!!!!! DEBUG !!!!!!!!!! 

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
    } catch (e) {
        //var _e = e;
        logger.error(e);
        logger.fatal('CheckoutServices.js failure: ' + order.orderNo + ' - ' + e.toString());
        return new Status(Status.ERROR, 'ERROR', 'populateOrderJSON failed. Fatal log sent.');
    }
    return new Status(Status.OK, 'OK', 'populateOrderJSON finished successfully for order ' + order.orderNo);
}

/**
 * addDummyPaymentTransaction converts a PayPal or other Adyen custom payment type to CREDIT_CARD.  This is necessary for the order ingestion process as of May 2020
 * @param {Object} order the entire order object
 * @return {Boolean} success/failure
 */
function addDummyPaymentTransaction(order) {
    var PaymentMgr = require('dw/order/PaymentMgr');
    var Calendar = require('dw/util/Calendar');
    var StringUtils = require('dw/util/StringUtils');
    var success = true;

    // Make sure we don't already have a CREDIT_CARD or ESW_PAYMENT or AMAZON_PAY payment method
    var arrPi = order.getPaymentInstruments().toArray();

    var amazonPayment = _.find(arrPi, function (r) {
        return r.paymentMethod.toUpperCase() === 'AMAZON_PAY';
    });
    if (amazonPayment) return true;

    var eswPayment = _.find(arrPi, function (r) {
        return r.paymentMethod.toUpperCase() === 'ESW_PAYMENT';
    });
    if (eswPayment) {
        // Tell SOM this is a pre-captured amount, not an authorization
        eswPayment.getPaymentTransaction().setType(dw.order.PaymentTransaction.TYPE_CAPTURE);
        return true;
    }

    var ccPayment = _.find(arrPi, function (r) {
        return r.paymentMethod.toUpperCase() === 'CREDIT_CARD';
    });


    if (!ccPayment) {
        collections.forEach(order.getPaymentInstruments(), function (pi) {
            if (pi.getPaymentTransaction().getPaymentProcessor()) {
                switch (pi.getPaymentTransaction().getPaymentProcessor().getID()) {
                    case 'Adyen':
                    case 'ADYEN_PAYPAL':
                        /*
                          PAYPAL
                        */
                        // pi.custom.adyenPaymentMethod = 'paypal_ecs';
                        if (!('adyenPaymentMethod' in pi.custom) || pi.custom.adyenPaymentMethod === '') {
                            logger.error('adyenPaymentMethod does not exist or not set');
                        }
                        var customMethod = pi.custom.adyenPaymentMethod.toUpperCase();
                        if (customMethod === 'PAYPAL' || customMethod === 'PAYPAL_ECS') {
                            // Create a new payment transaction that the Order Ingestion process supports
                            var newPi = order.createPaymentInstrument('CREDIT_CARD', pi.paymentTransaction.amount);
                            if (newPi) {
                                var paymentProcessor = PaymentMgr.getPaymentMethod('CREDIT_CARD').getPaymentProcessor();
                                newPi.getPaymentTransaction().setTransactionID(order.custom.Adyen_pspReference);
                                newPi.setCreditCardExpirationYear(Number(StringUtils.formatCalendar(new Calendar(), 'yyyy')));
                                newPi.setCreditCardExpirationMonth(Number(StringUtils.formatCalendar(new Calendar(), 'MM')));
                                newPi.getPaymentTransaction().setPaymentProcessor(paymentProcessor);
                                newPi.getPaymentTransaction().setAmount(pi.getPaymentTransaction().getAmount());
                                newPi.getPaymentTransaction().setType(dw.order.PaymentTransaction.TYPE_CAPTURE);
                                newPi.setCreditCardType('Maestro');
                                newPi.custom.adyenPaymentMethod = customMethod;

                                order.custom.Adyen_paymentMethod = 'paypal';

                                // !!!!!!!!!!!!!!!!!!!!!! DEBUG !!!!!!!!!!
                                // Add authTime and Adyen_merchantSig to the transaction
                                //newPi.getPaymentTransaction().custom.authTime = '05:21:52.054';
                                //newPi.getPaymentTransaction().custom.Adyen_merchantSig = 'Test2_PaymentTransactionSignature';
                                // !!!!!!!!!!!!!!!!!!!!!! DEBUG !!!!!!!!!!
                            }

                            // remove the outdated payment instrument
                            try {
                                order.removePaymentInstrument(pi);
                            } catch (exRemove) {
                                //var _e = exRemove;
                                logger.error('Replacing Adyen PayPal payment method: ' + exRemove.message);
                            }
                        }
                        break;
                    default:
                        break;
                }
            }
        });
    } else {
        // Only arrive here for cc orders. Update the custom payment method if necessary
        collections.forEach(order.getPaymentInstruments(), function (pi) {
            if (pi.getPaymentMethod()) {
                switch (pi.getPaymentMethod()) {
                    case 'CREDIT_CARD':
                    case 'ADYEN_PAYPAL':
                        var customMethod = '';
                        if ('adyenPaymentMethod' in pi.custom) {
                            customMethod = pi.custom.adyenPaymentMethod.toUpperCase();
                        }

                        if (customMethod === 'PAYPAL' || customMethod === 'PAYPAL_ECS') {
                            pi.setCreditCardType('Maestro');
                            pi.getPaymentTransaction().setTransactionID(order.custom.Adyen_pspReference);

                            if (!pi.getPaymentTransaction().paymentProcessor || pi.getPaymentTransaction().getPaymentProcessor().getID() !== 'CREDIT_CARD') {
                                var paymentProcessor = PaymentMgr.getPaymentMethod('CREDIT_CARD').getPaymentProcessor();
                                pi.setCreditCardExpirationYear(Number(StringUtils.formatCalendar(new Calendar(), 'yyyy')));
                                pi.setCreditCardExpirationMonth(Number(StringUtils.formatCalendar(new Calendar(), 'MM')));
                                pi.getPaymentTransaction().setPaymentProcessor(paymentProcessor);
                                pi.getPaymentTransaction().setType(dw.order.PaymentTransaction.TYPE_CAPTURE);
                                pi.custom.adyenPaymentMethod = customMethod;
                            }
                        }
                        break;
                    case 'AMAZON_PAY':
                        break;
                    default:
                        break;
                }
            }
        });
    }

    return success;
}

module.exports = {
    populateByOrder: populateByOrder,
    populateByOrderID: populateByOrderID,
    addDummyPaymentTransaction: addDummyPaymentTransaction
};
