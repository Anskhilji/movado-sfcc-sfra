'use strict';

var server = require('server');
server.extend(module.superModule);
var ltkSendOrder = require('~/cartridge/controllers/ltkSendOrder.js');

server.append('PlaceOrder', server.middleware.https, function (req, res, next) {
    if (dw.system.Site.current.preferences.custom.Listrak_Cartridge_Enabled)	{
        var OrderMgr = require('dw/order/OrderMgr');
        var viewData = res.getViewData();
        var order = OrderMgr.getOrder(viewData.orderID);

        session.privacy.SendOrder = true;
        session.privacy.OrderNumber = order.orderNo;

        ltkSendOrder.SendPost();
    }
    next();
});


module.exports = server.exports();
