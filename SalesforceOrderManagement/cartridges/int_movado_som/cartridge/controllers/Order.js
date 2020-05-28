'use strict';

var Logger = require('dw/system/Logger').getLogger('SOM', '');
var server = require('server');
server.extend(module.superModule);

server.append('Confirm', function (req, res, next) {
    Logger.debug('Starting Order-Confirm in int_movado_som');

    var Transaction = require('dw/system/Transaction');
    var OrderMgr = require('dw/order/OrderMgr');
    var viewData = res.getViewData();
    var order = OrderMgr.getOrder(viewData.order.orderNumber);
    var populateOrderJSON = require('*/cartridge/scripts/jobs/populateOrderJSON');

    if (order) {
        Logger.debug('CheckoutServices - Order ' + order.orderNo);
        Transaction.wrap(function () {
            populateOrderJSON.populateByOrder(order);
        });
    } else {
        Logger.debug('CheckoutServices - no order found. ' + JSON.stringify(viewData));
    }
    next();
});


module.exports = server.exports();
