'use strict';

var server = require('server');
server.extend(module.superModule);

server.get('KlarnaBanner', server.middleware.https, function (req, res, next) {
    var klarnaProductPrice = req.querystring.klarnaProductPrice;

    res.render('klarna/klarnaPromotionMessage', {
        klarnaProductPrice: klarnaProductPrice
    });
    return next();
});

module.exports = server.exports();
