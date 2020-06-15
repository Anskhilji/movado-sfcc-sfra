'use strict';

var server = require('server');
server.extend(module.superModule);

var CustomerMgr = require('dw/customer/CustomerMgr');
var Logger = require('dw/system/Logger');
var Transaction = require('dw/system/Transaction');
var URLUtils = require('dw/web/URLUtils');

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
        var customer;
        var legacyCustomer = false;
        var email = req.form.loginEmail;
        var password = req.form.loginPassword;
        var authenticateCustomerResult;

        Transaction.wrap(function () {
            authenticateCustomerResult = CustomerMgr.authenticateCustomer(email, password);
        });
        
        if (authenticateCustomerResult.status !== 'AUTH_OK') {
            res.json({
                success: true,
                customer: '',
                legacyCustomer: false,
                relativeURL: URLUtils.url('Page-Show','cid', 'legacy-customer-reset-password').toString()
            });
        } else {
            customer = CustomerMgr.getCustomerByLogin(email);
            legacyCustomer = customer.profile.custom.legacyCustomer;
            session.custom.emailResetProfile = email;
            res.json({
                success: true,
                customer: customer,
                legacyCustomer: legacyCustomer,
                relativeURL: URLUtils.url('Page-Show','cid', 'legacy-customer-reset-password').toString()
            });
        }
        
        return next();
    }
);


server.get('PasswordResetEmail', server.middleware.https, function (req, res, next) {
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
                    Logger.getLogger('Account', 'Account-Reset').error(error.toString());
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
