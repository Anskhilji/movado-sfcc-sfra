'use strict';

var server = require('server');
server.extend(module.superModule);

server.append(
    'Send',
    function (req, res, next) {
        var contactUsForm = server.forms.getForm('contactus');
        if (contactUsForm.valid) {
            contactUsForm.clear();
        }
        next();
    }
);

module.exports = server.exports();