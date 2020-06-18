'use strict';

var server = require('server');
server.extend(module.superModule);

var Site = require('dw/system/Site');

server.append(
    'AddAddress',
    function (req, res, next) {
        // Custom Start: Get all esw supported countries
        var countries = Site.current.getCustomPreferenceValue('eswAllCountries');
        // Custom End
        res.setViewData({
            countries : countries
        });
        next();
    }
);

server.append(
    'EditAddress',
    function (req, res, next) {
        // Custom Start: Get all esw supported countries
        var countries = Site.current.getCustomPreferenceValue('eswAllCountries');
        // Custom End
        res.setViewData({
            countries : countries
        });
        next();
    }
);

module.exports = server.exports();
