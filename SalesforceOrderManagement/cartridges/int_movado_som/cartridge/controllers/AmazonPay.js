'use strict';

var server = require('server');
server.extend(module.superModule);

var BasketMgr = require('dw/order/BasketMgr');
var Logger = require('dw/system/Logger');
var Transaction = require('dw/system/Transaction');
var URLUtils = require('dw/web/URLUtils');

server.append('SubmitPayment', server.middleware.post, function (req, res, next) {
    var somLog = require('dw/system/Logger').getLogger('SOM', 'CheckoutServices');
    somLog.debug('Stating');

    var populateOrderJSON = require('*/cartridge/scripts/jobs/populateOrderJSON');

    var viewData = res.getViewData();
    var order = null;

    somLog.debug(JSON.stringify(req));
    somLog.debug(JSON.stringify(viewData));

    somLog.debug('AmazonPay-Result - Processing Order ' + order.orderNo);
    try {
        Transaction.wrap(function () {
            populateOrderJSON.populateByOrder(order);
            populateOrderJSON.addDummyPaymentTransaction(order);
        });
    } catch (exSOM) {
        var _e = exSOM;
        somLog.error('SOM attribute process failed: ' + exSOM.message + ',exSOM: ' + JSON.stringify(exSOM));
    }

    next();
});

module.exports = server.exports();
