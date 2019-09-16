'use strict';

var server = require('server');
server.extend(module.superModule);

/**
 * Extends Order-Confirm controller to send data to yotpo conversion tracking,
 */
server.append('Confirm', function (req, res, next) {
    var OrderMgr = require('dw/order/OrderMgr');

    try {
        var viewData = res.getViewData();
        var order = OrderMgr.getOrder(req.querystring.ID);
        var YotpoIntegrationHelper = require('../scripts/common/integrationHelper.js');

        viewData.yotpoConversionTrackingData = YotpoIntegrationHelper.getConversionTrackingData(req, order, viewData.locale);
        res.setViewData(viewData);
    } catch (ex) {
        var YotpoLogger = require('/int_yotpo/cartridge/scripts/yotpo/utils/YotpoLogger');
        YotpoLogger.logMessage('Something went wrong while retrieving order tracking data, Exception code is: ' + ex, 'error', 'Yotpo~Order-Confirm');
    }

    next();
});

module.exports = server.exports();
