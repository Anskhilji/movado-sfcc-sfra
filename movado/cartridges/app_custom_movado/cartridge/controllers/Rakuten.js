'use strict';

var server = require('server');

server.get('Request', function(res, req, next){
    res.setStatusCode(200);
    next();
});


module.exports = server.exports();