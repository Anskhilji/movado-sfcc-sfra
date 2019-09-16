'use strict';

var server = require('server');
server.extend(module.superModule);

/**
 * Extends CheckoutServices-PlaceOrder controller to send order data to Yotpo for Swell Loyalty
 */
server.append('PlaceOrder', function (req, res, next) {
    var viewData = res.getViewData();

    if (viewData.orderID) {
        var orderNo = viewData.orderID;
        var SwellExporter = require('int_yotpo/cartridge/scripts/yotpo/swell/export/SwellExporter');
        SwellExporter.exportOrder({
            orderNo: orderNo,
            orderState: 'created'
        });
    }

    return next();
});

module.exports = server.exports();
