'use strict';

var server = require('server');
var StoreMgr = require('dw/catalog/StoreMgr');
server.extend(module.superModule);

server.post('Order', function (req, res, next) {
    var chairtyId = req.form.chairtyId;
    var orderId = req.form.orderId;
    // save this object into order custom obj
    return next();
});

module.exports = server.exports();