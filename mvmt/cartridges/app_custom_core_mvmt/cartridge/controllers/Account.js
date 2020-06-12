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

server.post(
    'LegacyCustomer',
    function (req, res, next) {
        var CustomerMgr = require('dw/customer/CustomerMgr');
        var URLUtils = require('dw/web/URLUtils');

        var email = req.form.loginEmail;
        var customer = CustomerMgr.getCustomerByLogin(email);
        res.setViewData({ legacyCustomer: 'fasle' });
        session.custom.emailResetProfile = 'muhammad.aurangzaib@innovadeltech.com';
        res.json({
            success: true,
            customer: customer,
            legacyCustomer: false,
            relativeURL: URLUtils.url('Page-Show','cid', 'legacy-customer-reset-password').toString()
        });

        return next();
    }
);


server.post('PasswordResetEmail', server.middleware.https, function (req, res, next) {
    var CustomerMgr = require('dw/customer/CustomerMgr');
    var Resource = require('dw/web/Resource');
    var URLUtils = require('dw/web/URLUtils');
    var accountHelpers = require('*/cartridge/scripts/helpers/accountHelpers');

    var email;
    var resettingCustomer;
    if (session.custom.emailResetProfile) {
        email = session.custom.emailResetProfile;
        resettingCustomer = CustomerMgr.getCustomerByLogin(email);
            if (resettingCustomer) {
                accountHelpers.sendPasswordResetEmail(email, resettingCustomer);
            }
            session.custom.emailResetProfile = null;
    }  
    
    next();
});

module.exports = server.exports();
