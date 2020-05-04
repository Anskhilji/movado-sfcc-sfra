'use strict';

var server = require('server');
server.extend(module.superModule);
var customAccountHelper = require('*/cartridge/scripts/helpers/customAccountHelpers');
var consentTracking = require('*/cartridge/scripts/middleware/consentTracking');
var Site = require('dw/system/Site');
var Transaction = require('dw/system/Transaction');
var URLUtils = require('dw/web/URLUtils');

server.replace('Login', server.middleware.https, csrfProtection.validateAjaxRequest, function (req, res, next) {
    var CustomerMgr = require('dw/customer/CustomerMgr');
    var Resource = require('dw/web/Resource');
    var Site = require('dw/system/Site');
    var Transaction = require('dw/system/Transaction');

    var accountHelpers = require('*/cartridge/scripts/helpers/accountHelpers');
    var emailHelpers = require('*/cartridge/scripts/helpers/emailHelpers');
    var hooksHelper = require('*/cartridge/scripts/helpers/hooks');

    var email = req.form.loginEmail;
    var password = req.form.loginPassword;
    var rememberMe = req.form.loginRememberMe
        ? (!!req.form.loginRememberMe)
        : false;
    var isMiniCart = empty(req.querystring.isMiniCart) ? false : req.querystring.isMiniCart;

    var customerLoginResult = Transaction.wrap(function () {
        var authenticateCustomerResult = CustomerMgr.authenticateCustomer(email, password);

        if (authenticateCustomerResult.status !== 'AUTH_OK') {
            var errorCodes = {
                ERROR_CUSTOMER_DISABLED: 'error.message.account.disabled',
                ERROR_CUSTOMER_LOCKED: 'error.message.account.locked',
                ERROR_CUSTOMER_NOT_FOUND: 'error.message.login.form',
                ERROR_PASSWORD_EXPIRED: 'error.message.password.expired',
                ERROR_PASSWORD_MISMATCH: 'error.message.password.mismatch',
                ERROR_UNKNOWN: 'error.message.error.unknown',
                default: 'error.message.login.form'
            };

            var errorMessageKey = errorCodes[authenticateCustomerResult.status] || errorCodes.default;
            var errorMessage = Resource.msg(errorMessageKey, 'login', null);

            return {
                error: true,
                errorMessage: errorMessage,
                status: authenticateCustomerResult.status,
                authenticatedCustomer: null
            };
        }

        return {
            error: false,
            errorMessage: null,
            status: authenticateCustomerResult.status,
            authenticatedCustomer: CustomerMgr.loginCustomer(authenticateCustomerResult, rememberMe)
        };
    });

    if (customerLoginResult.error) {
        if (customerLoginResult.status === 'ERROR_CUSTOMER_LOCKED') {
            var context = {
                customer: CustomerMgr.getCustomerByLogin(email) || null
            };

            var emailObj = {
                to: email,
                subject: Resource.msg('subject.account.locked.email', 'login', null),
                from: Site.current.getCustomPreferenceValue('customerServiceEmail') || 'no-reply@salesforce.com',
                type: emailHelpers.emailTypes.accountLocked
            };

            hooksHelper('app.customer.email', 'sendEmail', [emailObj, 'account/accountLockedEmail', context], function () {});
        }

        res.json({
            error: [customerLoginResult.errorMessage || Resource.msg('error.message.login.form', 'login', null)]
        });

        return next();
    }

    if (customerLoginResult.authenticatedCustomer) {
        res.setViewData({ authenticatedCustomer: customerLoginResult.authenticatedCustomer });
        if (isMiniCart) {
            res.json({
                success: true,
                redirectUrl: URLUtils.url('Checkout-Begin').toString()
            });
        } else {
            res.json({
                success: true,
                redirectUrl: accountHelpers.getLoginRedirectURL(req.querystring.rurl, req.session.privacyCache, false)
            });
        }
        req.session.privacyCache.set('args', null);
    } else {
        res.json({ error: [Resource.msg('error.message.login.form', 'login', null)] });
    }

    return next();
});

server.replace('SubmitRegistration', server.middleware.https, csrfProtection.validateAjaxRequest, function (req, res, next) {
    var CustomerMgr = require('dw/customer/CustomerMgr');
    var Resource = require('dw/web/Resource');
    var URLUtils = require('dw/web/URLUtils');

    var SFMCApi = require('int_custom_marketing_cloud/cartridge/scripts/api/SFMCApi');
    var EmailSubscriptionHelper = require('int_custom_marketing_cloud/cartridge/scripts/helper/EmailSubscriptionHelper');
    var formErrors = require('*/cartridge/scripts/formErrors');
    var registrationForm = null;
    var registrationFormObj = null;
    var redirectUrl = null;
    var isMiniCart = empty(req.querystring.isMiniCart) ? false : req.querystring.isMiniCart;
    var accountHelpers = require('*/cartridge/scripts/helpers/accountHelpers');

    // setting variables for the BeforeComplete function
    if (isMiniCart) {
        registrationForm = server.forms.getForm('miniCartRegistrationForm');
        redirectUrl = URLUtils.url('Checkout-Begin').toString();
        if (registrationForm.login.password.valid) {
            if (!CustomerMgr.isAcceptablePassword(registrationForm.login.password.value)) {
                registrationForm.login.password.valid = false;
                registrationForm.login.password.error = Resource.msg('login.password.description', 'common', null);
                registrationForm.valid = false;
            }
        }
        registrationFormObj = {
            firstName: registrationForm.customer.firstname.value,
            lastName: registrationForm.customer.lastname.value,
            email: registrationForm.customer.email.value,
            password: registrationForm.login.password.value,
            validForm: registrationForm.valid,
            form: registrationForm
        };
    } else {
        registrationForm = server.forms.getForm('profile');
        redirectUrl = accountHelpers.getLoginRedirectURL(req.querystring.rurl, req.session.privacyCache, true);
        if (registrationForm.customer.email.value.toLowerCase() !== registrationForm.customer.emailconfirm.value.toLowerCase()) {
            registrationForm.customer.email.valid = false;
            registrationForm.customer.emailconfirm.valid = false;
            registrationForm.customer.emailconfirm.error =
                Resource.msg('error.message.mismatch.email', 'forms', null);
            registrationForm.valid = false;
        }

        if (registrationForm.login.password.value !== registrationForm.login.passwordconfirm.value) {
            registrationForm.login.password.valid = false;
            registrationForm.login.passwordconfirm.valid = false;
            registrationForm.login.passwordconfirm.error =
                Resource.msg('error.message.mismatch.password', 'forms', null);
            registrationForm.valid = false;
        }
        if (registrationForm.login.password.valid) {
            if (!CustomerMgr.isAcceptablePassword(registrationForm.login.password.value)) {
                registrationForm.login.password.valid = false;
                registrationForm.login.passwordconfirm.valid = false;
                registrationForm.login.passwordconfirm.error =
                    Resource.msg('error.message.password.constraints.not.matched', 'forms', null);
                registrationForm.valid = false;
            }
        }
        if (!customAccountHelper.isValidatebirthDay(registrationForm.customer.birthdate.value, registrationForm.customer.birthmonth.selectedOption)) {
            registrationForm.customer.birthdate.valid = false;
            registrationForm.customer.birthdate.error = Resource.msg('error.message.invalid.birthdate', 'forms', null);
            registrationForm.valid = false;
        }
        registrationFormObj = {
            firstName: registrationForm.customer.firstname.value,
            lastName: registrationForm.customer.lastname.value,
            birthdate: registrationForm.customer.birthdate.value,
            birthmonth: registrationForm.customer.birthmonth.value,
            phone: registrationForm.customer.phone.value,
            email: registrationForm.customer.email.value,
            emailConfirm: registrationForm.customer.emailconfirm.value,
            password: registrationForm.login.password.value,
            passwordConfirm: registrationForm.login.passwordconfirm.value,
            addToEmailList: registrationForm.customer.addtoemaillist.value,
            validForm: registrationForm.valid,
            form: registrationForm
        };
    }

    if (registrationForm.valid) {
        res.setViewData(registrationFormObj);

        this.on('route:BeforeComplete', function (req, res) { // eslint-disable-line no-shadow
            var Transaction = require('dw/system/Transaction');
            var accountHelpers = require('*/cartridge/scripts/helpers/accountHelpers');
            var authenticatedCustomer;
            var serverError;

            // getting variables for the BeforeComplete function
            var registrationForm = res.getViewData(); // eslint-disable-line

            if (registrationForm.validForm) {
                var login = registrationForm.email;
                var password = registrationForm.password;

                // attempt to create a new user and log that user in.
                try {
                    Transaction.wrap(function () {
                        var error = {};
                        var newCustomer = CustomerMgr.createCustomer(login, password);

                        var authenticateCustomerResult = CustomerMgr.authenticateCustomer(login, password);
                        if (authenticateCustomerResult.status !== 'AUTH_OK') {
                            error = { authError: true, status: authenticateCustomerResult.status };
                            throw error;
                        }

                        authenticatedCustomer = CustomerMgr.loginCustomer(authenticateCustomerResult, false);

                        if (!authenticatedCustomer) {
                            error = { authError: true, status: authenticateCustomerResult.status };
                            throw error;
                        } else {
                            // assign values to the profile
                            var newCustomerProfile = newCustomer.getProfile();

                            if (!isMiniCart) {
                                var newsletterSignupProssesed;
                                if (registrationForm.addToEmailList) {
                                    var requestParams = {
                                        email: registrationForm.email
                                    }
                                    SFMCApi.sendSubscriberToSFMC(requestParams);
                                    newsletterSignupProssesed = EmailSubscriptionHelper.emailSubscriptionResponse(true);
                                } else {
                                    newsletterSignupProssesed = EmailSubscriptionHelper.emailSubscriptionResponse(false);
                                }
                            }

                            newCustomerProfile.firstName = registrationForm.firstName;
                            newCustomerProfile.lastName = registrationForm.lastName;
                            newCustomerProfile.email = registrationForm.email;
                            if (!isMiniCart) {
                                newCustomerProfile.phoneHome = registrationForm.phone;
                                newCustomerProfile.custom.birthdate = registrationForm.birthdate;
                                newCustomerProfile.custom.birthmonth = registrationForm.birthmonth;
                                if (newsletterSignupProssesed.success) {
                                    newCustomerProfile.custom.addtoemaillist = newsletterSignupProssesed.optOutFlag || registrationForm.addToEmailList;
                                }
                            }
                        }
                    });
                } catch (e) {
                    if (e.authError) {
                        serverError = true;
                    } else {
                        registrationForm.validForm = false;
                        registrationForm.form.customer.email.valid = false;
                        registrationForm.form.customer.email.error = Resource.msg('error.message.username.invalid', 'forms', null);
                        if (!isMiniCart) {
                            registrationForm.form.customer.emailconfirm.valid = false;
                            registrationForm.form.customer.email.error = Resource.msg('error.message.username.invalid', 'forms', null);
                        }
                    }
                }
            }

            delete registrationForm.password;
            if (!isMiniCart) {
                delete registrationForm.passwordConfirm;
            }
            formErrors.removeFormValues(registrationForm.form);

            if (serverError) {
                res.setStatusCode(500);
                res.json({
                    success: false,
                    errorMessage: Resource.msg('error.message.unable.to.create.account', 'login', null)
                });

                return;
            }

            if (registrationForm.validForm) {
                // send a registration email
                accountHelpers.sendCreateAccountEmail(authenticatedCustomer.profile);

                res.setViewData({ authenticatedCustomer: authenticatedCustomer });
                res.json({
                    success: true,
                    redirectUrl: redirectUrl
                });

                req.session.privacyCache.set('args', null);
            } else {
                res.json({
                    fields: formErrors.getFormErrors(registrationForm)
                });
            }
        });
    } else {
        res.json({
            fields: formErrors.getFormErrors(registrationForm)
        });
    }
    return next();
});


server.get(
    'MvmtInsider',
    function (req, res, next) {
        res.render('account/mvmtInsider');

        next();
    }
);
module.exports = server.exports();
