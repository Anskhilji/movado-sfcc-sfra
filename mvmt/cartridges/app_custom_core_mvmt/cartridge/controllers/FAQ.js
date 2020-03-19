'use strict';

var server = require('server');
var cache = require('*/cartridge/scripts/middleware/cache');
var csrfProtection = require('*/cartridge/scripts/middleware/csrf');

server.get('Show', cache.applyDefaultCache, csrfProtection.generateToken, function (req, res, next) {
    var contactUsForm = server.forms.getForm('contactus');
    contactUsForm.clear();
    res.render('faq-page', {
        contactUsForm: contactUsForm
    });
    next();
});

module.exports = server.exports();