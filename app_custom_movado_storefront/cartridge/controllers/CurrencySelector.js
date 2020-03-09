'use strict';

var server = require('server');
var cache = require('*/cartridge/scripts/middleware/cache');

var redirectionHelper = require('*/cartridge/scripts/customCurrencySelector');

server.get('Select', cache.applyDefaultCache, function (req, res, next) {
    var params = req.querystring;
    redirectionHelper.getSelectedCurrency(req.querystring.currency, req.querystring.country);
});

server.get('SetLocaleCustom', cache.applyDefaultCache, function (req, res, next) {
    var params = req.querystring;
    var url = redirectionHelper.setSelectedLocale(req.querystring.localeid);
    res.json({url: url});
    
    return next();
});

module.exports = server.exports();