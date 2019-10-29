'use strict';
var server = require('server');

server.get('GetEmail', server.middleware.https, function (req, res, next) {
    var trackingData = JSON.parse(req.querystring.trackingData);
    if (trackingData) {
        trackingData.email = (customer.isAuthenticated() && customer.getProfile()) ? customer.getProfile().getEmail() : '';
    }
    res.json({
        trackingData: trackingData
    });
    next();
});

module.exports = server.exports();