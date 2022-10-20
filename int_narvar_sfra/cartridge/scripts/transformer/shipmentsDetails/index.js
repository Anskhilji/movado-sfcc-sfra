/* eslint-disable no-nested-ternary */
'use strict';

const StringUtils = require('dw/util/StringUtils');
const Calendar = require('dw/util/Calendar');
const StoreMgr = require('dw/catalog/StoreMgr');

const util = require('../../utils/util');
const log = require('../../utils/log');
const custom = require('./custom');

/**
 * This is a description of the getShipDate function.
 * This is to return the ship date
 * @param {dw.order.Shipment} shipment - This is the demandware shipment
 * @returns {string} - This returns ship_date
 */
const getShipDate = function (shipment) {
    const creationDate = shipment.getCreationDate();
    return StringUtils.formatCalendar(new Calendar(creationDate), util.TRANSFORMER_CONFIGURATIONS.DATE_FORMAT);
};

/**
 * This is a description of the getShippedFrom function.
 * This is to return the shiped from
 * @param {dw.order.Shipment} shipment - This is the demandware shipment
 * @returns {Object} - This returns shipped_from
 */
const getShippedFrom = function (shipment) {
    const customObj = shipment.custom;
    if (!customObj) {
        return {};
    } else if (!customObj.fromStoreId) {
        return {};
    }

    const storeId = customObj.fromStoreId;
    const store = StoreMgr.getStore(storeId);
    if (!store) {
        return {};
    }

    return {
        company_name: store.name || store.ID,
        email: store.email,
        phone: store.phone,
        address: {
            street_1: store.address1,
            street_2: store.address2 || '',
            city: store.city,
            state: store.stateCode,
            zip: store.postalCode,
            country: store.countryCode.value || store.countryCode.displayValue
        }
    };
};

/**
 * This is a description of the getBaseShipmentsDetails function.
 * This function is used to get shipments details
 * @param {dw.order.Order} order - This is the demandware order
 * @returns {Array} - shipments: This will return array of shipments
 */
const getBaseShipmentsDetails = function (order) {
    let shipmentList = [];
    try {
        const shimpents = order.shipments.toArray();
        const email = order.customerEmail;
        const billingAddress = order.billingAddress;

        shimpents.forEach(function (shipment) {
            const trackingNumber = shipment.trackingNumber;
            if (trackingNumber) {
                const shippingAddress = (shipment.shippingAddress && shipment.shippingAddress.firstName) ? shipment.shippingAddress : billingAddress;
                const shipmentData = {
                    ship_method: (shipment.shippingMethod) ? shipment.shippingMethod.displayName : util.TRANSFORMER_CONFIGURATIONS.GIFT_CARD_SHIPPING_METHOD,
                    carrier: (shipment.shippingMethod.custom.narvarCarrrierCode) ?
                                shipment.shippingMethod.custom.narvarCarrrierCode :
                                    shipment.shippingMethod.ID ?
                                        shipment.shippingMethod.ID : '',
                    carrier_service: (shipment.shippingMethod.custom.narvarServiceCode) ?
                                        shipment.shippingMethod.custom.narvarServiceCode :
                                            shipment.shippingMethod.displayName ?
                                                shipment.shippingMethod.displayName : '',
                    // ship_source : 'DC-West',
                    shipped_from: getShippedFrom(shipment),
                    items_info: [],
                    shipped_to: {
                        first_name: shippingAddress.firstName,
                        last_name: shippingAddress.lastName,
                        phone: shippingAddress.phone,
                        email: email,
                        address: {
                            street_1: shippingAddress.address1,
                            street_2: (shippingAddress.address2) ? shippingAddress.address2 : '',
                            city: shippingAddress.city,
                            state: shippingAddress.stateCode,
                            zip: shippingAddress.postalCode,
                            country: shippingAddress.countryCode.value
                        }
                    },
                    ship_discount: (shipment.shippingTotalNetPrice.available) ? shipment.shippingTotalNetPrice.subtract(shipment.adjustedShippingTotalNetPrice).value : 0,
                    ship_total: (shipment.adjustedShippingTotalNetPrice.available) ? shipment.adjustedShippingTotalNetPrice.value : 0,
                    ship_tax: (shipment.adjustedShippingTotalTax.available) ? shipment.adjustedShippingTotalTax.value : 0,
                    ship_date: getShipDate(shipment),
                    tracking_number: trackingNumber
                };

                const productLineItems = shipment.productLineItems.toArray();
                productLineItems.forEach(function (productLineItem) {
                    const id = productLineItem.productID;
                    let itemInfo = {
                        item_id: id,
                        sku: id,
                        quantity: productLineItem.quantityValue
                    };
                    shipmentData.items_info.push(itemInfo);
                });

                const giftCertLineItems = shipment.giftCertificateLineItems.toArray();
                giftCertLineItems.forEach(function (giftCertLineItem) {
                    const id = giftCertLineItem.getGiftCertificateID() || util.TRANSFORMER_CONFIGURATIONS.GIFT_CARD_SKU;

                    let itemInfo = {
                        item_id: id,
                        sku: id,
                        quantity: 1
                    };
                    shipmentData.items_info.push(itemInfo);
                });

                shipmentList.push(shipmentData);
            }
        });

        shipmentList = custom.getCustomizedShipmentsDetails(shipmentList, order);
    } catch (error) {
        log.sendLog('error', 'shipmentsDetails:getBaseShipmentsDetails, Error while transforming shipments details:: ' + JSON.stringify(error));
    }

    return shipmentList;
};

module.exports = {
    getBaseShipmentsDetails: getBaseShipmentsDetails
};
