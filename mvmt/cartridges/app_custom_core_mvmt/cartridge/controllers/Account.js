'use strict';

var server = require('server');
server.extend(module.superModule);

var CustomerMgr = require('dw/customer/CustomerMgr');
var Logger = require('dw/system/Logger');
var Transaction = require('dw/system/Transaction');
var URLUtils = require('dw/web/URLUtils');
var Resource = require('dw/web/Resource');

var csrfProtection = require('*/cartridge/scripts/middleware/csrf');

server.get(
    'MvmtInsider',
    function (req, res, next) {
        res.render('account/mvmtInsider');

        next();
    }
);

server.append(
    'Login',
    function (req, res, next) {
        var accountLoginLocation = !empty(req.querystring) ? req.querystring.pageType : '';
        res.setViewData({
            accountLoginLocation: accountLoginLocation
        });

        next();
    }
);

server.append(
    'SubmitRegistration',
    function (req, res, next) {
        var accountLoginLocation = !empty(req.querystring) ? req.querystring.pageType : '';
        res.setViewData({
            accountLoginLocation: accountLoginLocation
        });
        next();
    }
);

server.prepend(
    'Login',
    server.middleware.https,
    csrfProtection.validateRequest,
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
            return next();
        } else {
            customer = CustomerMgr.getCustomerByLogin(email);
            legacyCustomer = customer.profile.custom.legacyCustomer;
            if (legacyCustomer) {
                session.custom.legecyCustomerEmail = email;
                res.json({
                    success: true,
                    redirectUrl:  URLUtils.url('Page-Show','cid', 'legacy-customer-reset-password').toString()
                });
                this.emit('route:Complete', req, res);
                return;
            }
           
        }
        return next();
    }
);

server.get('LegacyCustomerPasswordReset', server.middleware.https, function (req, res, next) {
    var accountHelpers = require('*/cartridge/scripts/helpers/accountHelpers');

    var email;
    var resettingCustomer;
    if (session.custom.legecyCustomerEmail) {
        email = session.custom.legecyCustomerEmail;
        resettingCustomer = CustomerMgr.getCustomerByLogin(email);
            if (resettingCustomer) {
                accountHelpers.sendPasswordResetEmail(email, resettingCustomer);
                try {
                    Transaction.wrap(function () {
                        resettingCustomer.profile.custom.legacyCustomer = false;
                    });
                } catch (error) {
                    Logger.getLogger('Account', 'Account-LegacyCustomerPasswordReset').error(error.toString());
                }
            }
            session.custom.legecyCustomerEmail = null;
            res.json({
                success: true,
                successMessage: Resource.msg('password.reset.email.send.text', 'common', null)
            });
    }  else {
        res.json({
            success: false,
            errorMessage: Resource.msg('session.expire.text', 'common', null)
        });
    }
    
    return next();
});

module.exports = server.exports();
