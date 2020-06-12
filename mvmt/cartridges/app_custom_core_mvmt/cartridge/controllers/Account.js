'use strict';

var server = require('server');
server.extend(module.superModule);

var Transaction = require('dw/system/Transaction');

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
        var legacyCustomer = customer.profile.custom.legacyCustomer;
        res.setViewData({ legacyCustomer: 'fasle' });
        session.custom.emailResetProfile = 'muhammad.aurangzaib@innovadeltech.com';
        res.json({
            success: true,
            customer: customer,
            legacyCustomer: legacyCustomer,
            relativeURL: URLUtils.url('Page-Show','cid', 'legacy-customer-reset-password').toString()
        });

        return next();
    }
);


server.get('PasswordResetEmail', server.middleware.https, function (req, res, next) {
    var CustomerMgr = require('dw/customer/CustomerMgr');
    var Resource = require('dw/web/Resource');
    var URLUtils = require('dw/web/URLUtils');
    var accountHelpers = require('*/cartridge/scripts/helpers/accountHelpers');
    

    var email;
    var resettingCustomer;
    if (session.custom.emailResetProfile) {
        email = session.custom.emailResetProfile;
        var customertest = CustomerMgr.getCustomerByLogin(email);
        resettingCustomer = CustomerMgr.getCustomerByLogin(email);
            if (resettingCustomer) {
                accountHelpers.sendPasswordResetEmail(email, resettingCustomer);
                try {
                    Transaction.wrap(function () {
                        resettingCustomer.profile.custom.legacyCustomer = false;
                    });
                } catch (error) {
                    // Logger.error(error.toString());
                }
            }
            session.custom.emailResetProfile = null;
    }  
    
    res.json({
        success: true
    });

    return next();
});

module.exports = server.exports();
