'use strict';

var server = require('server');
var csrfProtection = require('*/cartridge/scripts/middleware/csrf');
var consentTracking = require('*/cartridge/scripts/middleware/consentTracking');
server.extend(module.superModule);

var URLUtils = require('dw/web/URLUtils');

server.replace('Header', server.middleware.include, function (req, res, next) {
    var template = req.querystring.mobile ? 'account/mobileHeader' : 'account/header';
    res.render(template, { name:
        req.currentCustomer.profile ? req.currentCustomer.profile.firstName : null
    });
    next();
});

server.post(
        'SubmitAccountRegistrationFromMiniCart', server.middleware.https,
        csrfProtection.validateAjaxRequest,
        function (req, res, next) {
        var CustomerMgr = require('dw/customer/CustomerMgr');
        var Resource = require('dw/web/Resource');

        var formErrors = require('*/cartridge/scripts/formErrors');
        var miniCartRegistrationForm = server.forms.getForm('miniCartRegistrationForm');
        var firstName = miniCartRegistrationForm.customer.firstname.value;
        var secondName = miniCartRegistrationForm.customer.lastname.value;
        var email = miniCartRegistrationForm.customer.email.value;
        var password = miniCartRegistrationForm.customer.password.value;

        if ((empty(email) && empty(password)) && miniCartRegistrationForm.valid) {
            res.json({
                redirectUrl: URLUtils.url('Checkout-Begin').toString()
            });
        } else {
            var fieldErrors = formErrors.getFormErrors(miniCartRegistrationForm);

            if (Object.keys(fieldErrors).length || Object.keys(serverErrors.serverErrors).length) {
                res.json({
                    form: miniCartRegistrationForm,
                    fieldErrors: [fieldErrors],
                    error: [true]
                });
            }
        }
    return next();
});

module.exports = server.exports();
