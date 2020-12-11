'use strict';

var server = require('server');
server.extend(module.superModule);

var CustomerMgr = require('dw/customer/CustomerMgr');
var Logger = require('dw/system/Logger');
var Transaction = require('dw/system/Transaction');
var URLUtils = require('dw/web/URLUtils');
var Resource = require('dw/web/Resource');
var Site = require('dw/system/Site');
var cache = require('*/cartridge/scripts/middleware/cache');

var csrfProtection = require('*/cartridge/scripts/middleware/csrf');
var userLoggedIn = require('*/cartridge/scripts/middleware/userLoggedIn');

server.get('MostRecentOrder', server.middleware.https, cache.applyInventorySensitiveCache, userLoggedIn.validateLoggedIn, function (req, res, next) {

    // Customer Email
    var emailAddress = req.currentCustomer.profile.email;
    var SalesforceModel = require('*/cartridge/scripts/SalesforceService/models/SalesforceModel');

    // Retrieve most recent order details
    var orderResult = SalesforceModel.getOrderRecentByCustomerEmail({
        emailAddress: emailAddress
	});

    var firstOrder;
    if (orderResult.object.orders && orderResult.object.orders.length > 0) {
        var ProductImageDIS = require('*/cartridge/scripts/helpers/ProductImageDIS');
        var formatCurrency = require('*/cartridge/scripts/util/formatting').formatCurrency;
        var ProductMgr = require('dw/catalog/ProductMgr');
        firstOrder = orderResult.object.orders[0];

		// Currency Format
        if (firstOrder.total) {
            firstOrder.total = formatCurrency(firstOrder.total, firstOrder.currencyISO);
        }

        var product = ProductMgr.getProduct(firstOrder.productCode);
        var firstImage = new ProductImageDIS(product, 'tile150');
        if (firstImage) {
            firstOrder.imageURL = firstImage.getURL();
            firstOrder.imageAlt = firstImage.getAlt();
            firstOrder.imageTitle = firstImage.getTitle();
        } else {
            firstOrder.imageURL = '';
            firstOrder.imageTitle = '';
            firstOrder.imageAlt = '';
        }

        if (firstOrder.status && firstOrder.status === 'Sent to SAP') {
            firstOrder.status = 'Processing';
        }
    }

    res.render('account/order/orderHistoryRecent', {
        order: firstOrder,
        accountlanding: true,
        breadcrumbs: [
            {
                htmlValue: Resource.msg('global.home', 'common', null),
                url: URLUtils.home().toString()
            }
        ]
    });
    next();
});

server.get(
    'MvmtInsider',
    server.middleware.https,
    userLoggedIn.validateLoggedIn,
    function (req, res, next) {
        res.render('account/mvmtInsider', {
			isMvmtInsider: true
		});

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
        var Bytes = require('dw/util/Bytes');
        var Encoding = require('dw/crypto/Encoding');
        var viewData = res.viewData;
        var accountLoginLocation = !empty(req.querystring) ? req.querystring.pageType : '';
        res.setViewData({
            accountLoginLocation: accountLoginLocation
        });
        if (viewData.addToEmailList) { 
            var userHashedEmail = Encoding.toHex(new Bytes(viewData.email, 'UTF-8'));
            var emailObj = [];
            emailObj.push({
                userEmail: viewData.email,
                userHashedEmail: userHashedEmail,
                submitLocation: 'Create Account'
            });
            res.json({
                emailObj: JSON.stringify(emailObj)
            });
        }

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
		
        customer = CustomerMgr.getCustomerByLogin(email);
        legacyCustomer = !empty(customer.profile.custom.legacyCustomer) ? customer.profile.custom.legacyCustomer : false;
        if (legacyCustomer) {
            if (authenticateCustomerResult.status == 'AUTH_OK') {
                Transaction.wrap(function () {
                    customer.profile.custom.legacyCustomer = false;
                });
            } else {
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

server.replace('SaveProfile', server.middleware.https, csrfProtection.validateAjaxRequest,
	    function (req, res, next) {
	        var Transaction = require('dw/system/Transaction');
	        var CustomerMgr = require('dw/customer/CustomerMgr');
	        var Resource = require('dw/web/Resource');
	        var URLUtils = require('dw/web/URLUtils');
            var accountHelpers = require('*/cartridge/scripts/helpers/accountHelpers');
            var customAccountHelper = require('*/cartridge/scripts/helpers/customAccountHelpers');
            var isYotpoSwellLoyaltyEnabled = !empty(Site.getCurrent().preferences.custom.yotpoSwellLoyaltyEnabled) ? Site.getCurrent().preferences.custom.yotpoSwellLoyaltyEnabled : false;

	        var formErrors = require('*/cartridge/scripts/formErrors');

	        var profileForm = server.forms.getForm('profile');

	        // form validation
	        if (profileForm.customer.email.value.toLowerCase()
	            !== profileForm.customer.emailconfirm.value.toLowerCase()) {
	            profileForm.valid = false;
	            profileForm.customer.email.valid = false;
	            profileForm.customer.emailconfirm.valid = false;
	            profileForm.customer.emailconfirm.error =
	                Resource.msg('error.message.mismatch.email', 'forms', null);
	        }

	        if (!customAccountHelper.isValidatebirthDay(profileForm.customer.birthdate.value, profileForm.customer.birthmonth.selectedOption)) {
	        	profileForm.customer.birthdate.valid = false;
	        	profileForm.customer.birthdate.error =
		                Resource.msg('error.message.invalid.birthdate', 'forms', null);
	        	profileForm.valid = false;
	        }

	        if (!profileForm.login.password.value.equals(profileForm.login.passwordconfirm.value)) {
	        	profileForm.login.passwordconfirm.valid = false;
	        	profileForm.login.passwordconfirm.error =
                    Resource.msg('error.message.currentpasswordnomatch', 'forms', null);
	        	profileForm.valid = false;
	        }

	        var result = {
	            firstName: profileForm.customer.firstname.value,
	            lastName: profileForm.customer.lastname.value,
	            birthdate: profileForm.customer.birthdate.value,
	            birthmonth: profileForm.customer.birthmonth.value,
	            phone: profileForm.customer.phone.value,
	            email: profileForm.customer.email.value,
	            confirmEmail: profileForm.customer.emailconfirm.value,
	            password: profileForm.login.password.value,
	            passwordConfirm: profileForm.login.passwordconfirm.value,
	            profileForm: profileForm
	        };
	        if (profileForm.valid) {
	            res.setViewData(result);
	            this.on('route:BeforeComplete', function (req, res) { // eslint-disable-line no-shadow
	                var formInfo = res.getViewData();
	                var customer = CustomerMgr.getCustomerByCustomerNumber(
	                    req.currentCustomer.profile.customerNo
	                );
	                var profile = customer.getProfile();
	                var customerLogin;
	                var status;

	                Transaction.wrap(function () {
	                    status = profile.credentials.setPassword(
	                            formInfo.password,
	                            formInfo.password,
	                            true
	                    );

	                    if (status.error) {
	                        formInfo.profileForm.login.password.valid = false;
	                        formInfo.profileForm.login.password.error =
	                            Resource.msg('error.message.currentpasswordnomatch', 'forms', null);
	                    } else {
	                        customerLogin = profile.credentials.setLogin(
	                                formInfo.email,
	                                formInfo.password
	                        );
	                    }
	                });

	                delete formInfo.password;
	                delete formInfo.confirmEmail;

	                if (customerLogin) {
	                    Transaction.wrap(function () {
	                          // signup customer email for marketing mails

	                       	  profile.setFirstName(formInfo.firstName);
	                       	  profile.setLastName(formInfo.lastName);
	                       	  profile.setEmail(formInfo.email);
	                       	  profile.setPhoneHome(formInfo.phone);
	                       	  profile.custom.birthdate = formInfo.birthdate;
	                       	  profile.custom.birthmonth = formInfo.birthmonth;
	                    });

	                    delete formInfo.profileForm;
                        delete formInfo.email;
                        //Custom Start: send account edited email
                        accountHelpers.sendAccountEditedEmail(customer.profile);
                        //Custom End

	                    res.json({
	                        success: true,
	                        redirectUrl: URLUtils.url('Account-Show').toString()
	                    });
	                } else {
	                    if (!status.error) {
	                        formInfo.profileForm.customer.email.valid = false;
	                        formInfo.profileForm.customer.email.error =
	                            Resource.msg('error.message.username.invalid', 'forms', null);
	                    }

	                    delete formInfo.profileForm;
	                    delete formInfo.email;

	                    res.json({
	                        success: false,
	                        fields: formErrors.getFormErrors(profileForm)
	                    });
	                }
	             // Custom Start: Yotpo Swell Integration 
	                if (isYotpoSwellLoyaltyEnabled) {
	                    var viewData = res.getViewData();
	                    if (viewData.success) {
	                        var SwellExporter = require('int_yotpo/cartridge/scripts/yotpo/swell/export/SwellExporter');
	                        SwellExporter.exportCustomer({
	                            customerNo: req.currentCustomer.profile.customerNo
	                        });
	                    }
	                }
	                // Custom End: Yotpo Swell Integration 
	            });
	        } else {
	            res.json({
	                success: false,
	                fields: formErrors.getFormErrors(profileForm)
	            });
	        }
	        return next();
	    }
	);

module.exports = server.exports();
