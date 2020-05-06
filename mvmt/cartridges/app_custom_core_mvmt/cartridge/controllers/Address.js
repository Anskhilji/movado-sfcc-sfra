'use strict';

var server = require('server');
server.extend(module.superModule);

var Site = require('dw/system/Site');

server.append(
    'AddAddress',
    function (req, res, next) {
        var countries = Site.current.getCustomPreferenceValue('eswAllCountries');
        res.setViewData({
            countries : countries
        });
        next();
    }
);

module.exports = server.exports();
