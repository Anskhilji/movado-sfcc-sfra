'use strict';

/**
 * This includes Api functions for Riskified.
 *
 * @module riskified/export/api/models/HistoricalModel
 */

/**
 * Creates a Order Model
 *
 * @param orders SeekableIterator of orders
 *
 * @return {Object} Object with array of orders
 */
function create(moduleName, orders) {
    var order,
        orderFromModel,
        orderParams,
        theErrors = [],
        theOrders = [],
        result = {};
    var RCUtilities = require('~/cartridge/scripts/riskified/util/RCUtilities');
    var OrderModel = require('./OrderModel');

    // create the array of orders
    while (orders.hasNext()) {
        order = orders.next();
        orderParams = RCUtilities.loadOrderParams(order, moduleName);
        try {
            // orderJSON = ExportDataComposer.prepareJSON(moduleName, order, orderParams, checkoutDeniedParams);
            orderFromModel = OrderModel.create(order, orderParams, null);
            theOrders.push(orderFromModel);
        } catch (e) {
            theErrors.push('<br/><b>ERROR ORDER : </b>' + order.orderNo);
        }
    }

    result.orders = theOrders;

    return result;
}

exports.create = create;
