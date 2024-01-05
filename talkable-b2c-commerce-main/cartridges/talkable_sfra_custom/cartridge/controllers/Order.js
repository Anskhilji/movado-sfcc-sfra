"use strict";

/* global empty */
var server = require("server");
server.extend(module.superModule);

server.append("Confirm", function (req, res, next) {
    var OrderMgr = require("dw/order/OrderMgr");
    var viewData = res.getViewData();
    var talkableHelper = require("*/cartridge/scripts/talkable/libTalkable");
    var talkable = new talkableHelper.TalkableHelper();
    viewData.isPostCheckoutEnabled = talkable.isPostCheckoutEnabled();
    viewData.talkableSiteId = talkable.getSiteId();
    if (!empty(viewData.order)) {
        viewData.recentOrder = OrderMgr.getOrder(viewData.order.orderNumber);
        viewData.talkableData = talkable.getPurchaseData(viewData.recentOrder);
    }
    return next();
});

module.exports = server.exports();
