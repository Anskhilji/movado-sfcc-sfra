'use strict';

/**
* Description of the Controller and the logic it provides
*
* @module  controllers/int_eum
*/

/* Script Modules */

var server = require('server');

var Site = require('dw/system/Site');

server.get('IncludeHeader', function (req, res, next) {
    var eumEnabled = Site.getCurrent().getCustomPreferenceValue("EUMEnabled");
    var eumID = Site.getCurrent().getCustomPreferenceValue("EUMID");
    var eumVersion = Site.getCurrent().getCustomPreferenceValue("EUMVersion");
    var eumURL = '//cdn.appdynamics.com/adrum/adrum-' + eumVersion + '.js';
    var context = null;
    if (eumEnabled == true && !empty(eumID) && !empty(eumVersion)) {
        context = {eumID : eumID, eumURL: eumURL};
    }
    res.render('headerScript', context);
    next();
});

server.get('IncludePage', function (req, res, next) {
    var eumEnabled = Site.getCurrent().getCustomPreferenceValue("EUMEnabled");
    var eumID = Site.getCurrent().getCustomPreferenceValue("EUMID");
    var eumVersion = Site.getCurrent().getCustomPreferenceValue("EUMVersion");
    var queryString = req.querystring;
    var pageName = null;
    if (eumEnabled == true && !empty(eumID) && !empty(eumVersion) && !empty(queryString.pageData)) {
        pageName = queryString.pageData;
    }
    res.render('pageScript', {userPageName : pageName});
    next();
});

module.exports = server.exports();
