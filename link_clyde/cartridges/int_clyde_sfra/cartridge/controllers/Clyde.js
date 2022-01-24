'use strict';

var server = require('server');

server.get('AddContract', function (req, res, next) {
    var addClydeContract = require('*/cartridge/scripts/clydeAddContracts');
    var BasketMgr = require('dw/order/BasketMgr');
    var Resource = require('dw/web/Resource');

    var currentBasket = BasketMgr.getCurrentBasket();
    var queryString = req.querystring;
    var pid = queryString.pid;
    var clydeSku = queryString.clydeContractSku;

    var result = {
        error: false,
        message: ''
    };

    if (!empty(pid) && !(empty(clydeSku))) {
        var contractResult = addClydeContract.setClydeCartContracts(pid, clydeSku, currentBasket);
        res.json(contractResult);
    } else {
        result.error = true;
        result.message = Resource.msg('error.cannot.update.product', 'cart', null);
        res.json(result);
    }
    next();
});

module.exports = server.exports();
