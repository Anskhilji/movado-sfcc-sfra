'use strict';

var server = require('server');
server.extend(module.superModule);

server.get(
    'MvmtInsider',
    function (req, res, next) {
        res.render('account/mvmtInsider');

        next();
    }
);
module.exports = server.exports();
