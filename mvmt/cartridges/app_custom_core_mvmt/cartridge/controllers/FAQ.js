'use strict';

var server = require('server');
var cache = require('*/cartridge/scripts/middleware/cache');
var csrfProtection = require('*/cartridge/scripts/middleware/csrf');

server.get('Show', cache.applyDefaultCache, csrfProtection.generateToken, function (req, res, next) {
    var activetab = req.querystring.activetab;
    var contactUsForm = server.forms.getForm('contactus');
    res.render('faq-page', {
        activetab : activetab,
        contactUsForm: contactUsForm
    });
    next();
});

module.exports = server.exports();