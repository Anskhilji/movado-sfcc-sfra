'use strict';

var server = require('server');
server.extend(module.superModule);

var BasketMgr = require('dw/order/BasketMgr');
var OrderMgr = require('dw/order/OrderMgr');
var Logger = require('dw/system/Logger');
var Transaction = require('dw/system/Transaction');
var URLUtils = require('dw/web/URLUtils');

/* Script Modules */
var eswHelper = require('*/cartridge/scripts/helper/eswHelper').getEswHelper();
var populateOrderJSON = require('*/cartridge/scripts/jobs/populateOrderJSON');

server.prepend('NotifyV2', server.middleware.post, function (req, res, next) {
    var somLog = require('dw/system/Logger').getLogger('SOM', 'CheckoutServices');
    somLog.debug('Starting EShopWorld-NotifyV2 prepend route');

    var viewData = res.getViewData();

    if (eswHelper.getBasicAuthEnabled() && !request.httpHeaders.authorization.equals("Basic " + eswHelper.encodeBasicAuth())) {
        response.setStatus(401);
        somLog.error('ESW Order Confirmation Error: Basic Authentication Token did not match');
    } else {
        var obj = JSON.parse(req.body);

        var order = OrderMgr.queryOrder('orderNo={0}', obj.retailerCartId);
        if (order && order.status.value === 0) {

            somLog.debug(JSON.stringify(req));
            somLog.debug(JSON.stringify(viewData));

            somLog.debug('EShopWorld-NotifyV2 - Processing Order ' + order.orderNo);
            try {
                Transaction.wrap(function () {
                    populateOrderJSON.populateByOrder(order);
                    //populateOrderJSON.addDummyPaymentTransaction(order);
                });
            } catch (exSOM) {
                var _e = exSOM;
                somLog.error('SOM attribute process failed: ' + exSOM.message + ',exSOM: ' + JSON.stringify(exSOM));
            }
        }
    }

    next();
});

module.exports = server.exports();
