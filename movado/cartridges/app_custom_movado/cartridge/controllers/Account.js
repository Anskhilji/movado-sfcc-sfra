'use strict';

var server = require('server');
server.extend(module.superModule);
var csrfProtection = require('*/cartridge/scripts/middleware/csrf');
var customAccountHelper = require('*/cartridge/scripts/helpers/customAccountHelpers');
var userLoggedIn = require('*/cartridge/scripts/middleware/userLoggedIn');
var consentTracking = require('*/cartridge/scripts/middleware/consentTracking');
var Site = require('dw/system/Site');
var URLUtils = require('dw/web/URLUtils');
var Resource = require('dw/web/Resource');
var cache = require('*/cartridge/scripts/middleware/cache');
var Transaction = require('dw/system/Transaction');
 
server.get('MostRecentOrder', server.middleware.https, cache.applyInventorySensitiveCache, userLoggedIn.validateLoggedIn, function (req, res, next) {

    // Customer Email
    var emailAddress = req.currentCustomer.profile.email;
    var SalesforceModel = require('*/cartridge/scripts/SalesforceService/models/SalesforceModel');

    // Retrieve most recent order details
    var orderResult = SalesforceModel.getOrderRecentByCustomerEmail({
        emailAddress: emailAddress,
        salesChannel: Site.getCurrent().getID()
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
            firstOrder.status = Resource.msg('label.order.defaultOrderStatus', 'confirmation', null);
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

server.replace(
    'Show',
    server.middleware.https,
    userLoggedIn.validateLoggedIn,
    consentTracking.consent,
    function (req, res, next) {
        var CustomerMgr = require('dw/customer/CustomerMgr');
        var Resource = require('dw/web/Resource');
        var URLUtils = require('dw/web/URLUtils');
        var Site = require('dw/system/Site');
        var reportingUrlsHelper = require('*/cartridge/scripts/reportingUrls');
        var customAccountHelpers = require('*/cartridge/scripts/helpers/customAccountHelpers');
        var showMyWatchesList = require('*/cartridge/models/myWatches/getProductListItems');
        var reportingURLs;
        var fetchWatchList;
        var userTracking;

        // Get reporting event Account Open url
        if (req.querystring.registration && req.querystring.registration === 'submitted') {
            reportingURLs = reportingUrlsHelper.getAccountOpenReportingURLs(
                CustomerMgr.registeredCustomerCount
            );
        }

        var accountModel = customAccountHelpers.getModel(req); // updated part for preferred address
        
        if(Site.current.getCustomPreferenceValue('analyticsTrackingEnabled')) {
            userTracking = {email: accountModel.profile.email};
        }

        // fetching already existing product list
        fetchWatchList = new showMyWatchesList(req.currentCustomer.raw);

        res.render('account/accountDashboard', {
            account: accountModel,
            accountlanding: true,
            breadcrumbs: [
                {
                    htmlValue: Resource.msg('global.home', 'common', null),
                    url: URLUtils.home().toString()
                }
            ],
            reportingURLs: reportingURLs,
            fetchWatchList: fetchWatchList,
            userTracking: JSON.stringify(userTracking)
        });
        next();
    }
);


// Function will be called when a new customer is being created
server.replace('SubmitRegistration', server.middleware.https, csrfProtection.validateAjaxRequest, function (req, res, next) {
    var CustomerMgr = require('dw/customer/CustomerMgr');
    var Resource = require('dw/web/Resource');
    var URLUtils = require('dw/web/URLUtils');

    var EmailSubscriptionHelper = require('int_custom_marketing_cloud/cartridge/scripts/helper/EmailSubscriptionHelper');
    var formErrors = require('*/cartridge/scripts/formErrors');
    var registrationForm = null;
    var registrationFormObj = null;
    var redirectUrl = null;
    var accountHelpers = require('*/cartridge/scripts/helpers/accountHelpers');
    var isYotpoSwellLoyaltyEnabled = !empty(Site.getCurrent().preferences.custom.yotpoSwellLoyaltyEnabled) ? Site.getCurrent().preferences.custom.yotpoSwellLoyaltyEnabled : false;
    var isAccountSignupVerificationEnabled = !empty(Site.current.preferences.custom.isAccountSignupVerificationEnabled) ? Site.current.preferences.custom.isAccountSignupVerificationEnabled : false;

    // setting variables for the BeforeComplete function
    registrationForm = server.forms.getForm('profile');
    redirectUrl = accountHelpers.getLoginRedirectURL(req.querystring.rurl, req.session.privacyCache, true);
    if (registrationForm.customer.email.value.toLowerCase() !== registrationForm.customer.emailconfirm.value.toLowerCase()) {
        registrationForm.customer.email.valid = false;
        registrationForm.customer.emailconfirm.valid = false;
        registrationForm.customer.emailconfirm.error =
            Resource.msg('error.message.mismatch.email', 'forms', null);
        registrationForm.valid = false;
    }

        // Custom Start: [Added Honeypot Logic]
		if (isAccountSignupVerificationEnabled) {
		    if ((!empty(registrationForm.customer.hpemail.htmlValue)) ||
		        (!empty(registrationForm.customer.hpemailconfirm.htmlValue))) {
	     		    registrationForm.valid = false;
			} else {
				registrationForm.valid = true;
			}
	    }
	    // Custom End

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
        birthmonthNumber: registrationForm.customer.birthmonth.selectedOption,
        phone: registrationForm.customer.phone.value,
        email: registrationForm.customer.email.value,
        emailConfirm: registrationForm.customer.emailconfirm.value,
        password: registrationForm.login.password.value,
        passwordConfirm: registrationForm.login.passwordconfirm.value,
        addToEmailList: registrationForm.customer.addtoemaillist.value,
        validForm: registrationForm.valid,
        form: registrationForm
    };
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

                            var newsletterSignupProssesed;
                            if (registrationForm.addToEmailList) {
                                var requestParams = {
                                    email: registrationForm.email
                                }
                                if (Site.current.preferences.custom.Listrak_Cartridge_Enabled) {
                                    var ltkApi = require('*/cartridge/scripts/api/ListrakAPI');
                                    var ltkConstants = require('*/cartridge/scripts/utils/ListrakConstants');
                                    requestParams.source = ltkConstants.Source.Create_Account;
                                    requestParams.event = ltkConstants.Event.Create_Account;
                                    requestParams.subscribe = ltkConstants.Subscribe.Create_Account;
                                    requestParams.firstName= registrationForm.firstName;
                                    requestParams.lastName= registrationForm.lastName;
                                    requestParams.birthDate= registrationForm.birthdate;
                                    requestParams.birthMonth= registrationForm.birthmonthNumber;
                                    ltkApi.sendSubscriberToListrak(requestParams);
                                } else {
                                    var SFMCApi = require('int_custom_marketing_cloud/cartridge/scripts/api/SFMCApi');
                                    SFMCApi.sendSubscriberToSFMC(requestParams);
                                }
                                newsletterSignupProssesed = EmailSubscriptionHelper.emailSubscriptionResponse(true);
                            } else {
                                newsletterSignupProssesed = EmailSubscriptionHelper.emailSubscriptionResponse(false);
                            }

                            newCustomerProfile.firstName = registrationForm.firstName;
                            newCustomerProfile.lastName = registrationForm.lastName;
                            newCustomerProfile.email = registrationForm.email;
                            newCustomerProfile.phoneHome = registrationForm.phone;
                            newCustomerProfile.custom.birthdate = registrationForm.birthdate;
                            newCustomerProfile.custom.birthmonth = registrationForm.birthmonth;
                            if (newsletterSignupProssesed.success) {
                                newCustomerProfile.custom.addtoemaillist = newsletterSignupProssesed.optOutFlag || registrationForm.addToEmailList;
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
                        registrationForm.form.customer.emailconfirm.valid = false;
                        registrationForm.form.customer.email.error = Resource.msg('error.message.username.invalid', 'forms', null);
                    }
                }
            }

            delete registrationForm.password;
            delete registrationForm.passwordConfirm;
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
            // Custom Start: Yotpo Swell Integration 
            if (isYotpoSwellLoyaltyEnabled) {
                var viewData = res.getViewData();
                if (viewData.success) {
                    var email = registrationForm.email;
                    var customerAPI = CustomerMgr.getCustomerByLogin(email);
                    if (customerAPI) {
                        var SwellExporter = require('int_yotpo/cartridge/scripts/yotpo/swell/export/SwellExporter');
                        SwellExporter.exportCustomer({
                            customerNo: customerAPI.profile.customerNo
                        });
                    }
                }
            }
            // Custom End: Yotpo Swell Integration 
        });
    } else {
        res.json({
            fields: formErrors.getFormErrors(registrationForm)
        });
    }
    return next();
});

// Function will be called when an existing customer save changes on there profile
server.replace('SaveProfile', server.middleware.https, csrfProtection.validateAjaxRequest,
	    function (req, res, next) {
	        var Transaction = require('dw/system/Transaction');
	        var CustomerMgr = require('dw/customer/CustomerMgr');
	        var Resource = require('dw/web/Resource');
	        var URLUtils = require('dw/web/URLUtils');
	        var accountHelpers = require('*/cartridge/scripts/helpers/accountHelpers');
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

server.replace('EditProfile',
	    server.middleware.https,
	    csrfProtection.generateToken,
	    userLoggedIn.validateLoggedIn,
	    consentTracking.consent,
	    function (req, res, next) {
	        var Resource = require('dw/web/Resource');
	        var URLUtils = require('dw/web/URLUtils');
	        var AccountModel = require('*/cartridge/models/account');

	        var accountModel = new AccountModel(req.currentCustomer);
	        var profileForm = server.forms.getForm('profile');
	        profileForm.clear();
	        profileForm.customer.firstname.value = accountModel.profile.firstName;
	        profileForm.customer.lastname.value = accountModel.profile.lastName;
	        profileForm.customer.phone.value = accountModel.profile.phone;
	        profileForm.customer.email.value = accountModel.profile.email;
	        profileForm.customer.birthdate.value = accountModel.birthdate;
	        profileForm.customer.birthmonth.value = accountModel.birthmonth;
	        res.render('account/profile', {
	            profileForm: profileForm,
	            breadcrumbs: [
	                {
	                    htmlValue: Resource.msg('global.home', 'common', null),
	                    url: URLUtils.home().toString()
	                },
	                {
	                    htmlValue: Resource.msg('page.title.myaccount', 'account', null),
	                    url: URLUtils.url('Account-Show').toString()
	                }
	            ]
	        });
	        next();
	    }
	);

server.append(
    'SavePassword',
    server.middleware.https,
    csrfProtection.validateAjaxRequest,
    function (req, res, next) {
        var Site = require('dw/system/Site');
        var URLUtils = require('dw/web/URLUtils');
        var CustomerMgr = require('dw/customer/CustomerMgr');
        var Resource = require('dw/web/Resource');
        var emailHelpers = require('*/cartridge/scripts/helpers/emailHelpers');
        var profileForm = server.forms.getForm('profile');
        
        var isMarketingCloudEnabled = !empty(Site.current.getCustomPreferenceValue('marketingCloudModuleEnabled')) ? Site.current.getCustomPreferenceValue('marketingCloudModuleEnabled') : false;

        if (profileForm.valid) {
            this.on('route:Complete', function (req, res) { // eslint-disable-line no-shadow
                var viewData = res.getViewData();
                if (viewData.success) {
                    var customer = CustomerMgr.getCustomerByCustomerNumber(
                req.currentCustomer.profile.customerNo
            );
                    var email = customer.profile.email;
                    var ContentMgr = require('dw/content/ContentMgr');
                    var apiContent = ContentMgr.getContent('email-content-password-edit-body');
                    var emailHeaderContent = ContentMgr.getContent('email-header');
                    var emailFooterContent = ContentMgr.getContent('email-footer');
                    var emailMarketingContent = ContentMgr.getContent('email-password-changed-marketing');
                    var url;
                    // Custom Start: Adding Marketing Cloud cartridge integration
                    if (isMarketingCloudEnabled) {
                        url = URLUtils.https('Account-EditPassword');
                    } else {
                        url = URLUtils.https('Search-Show', 'cgid', 'shop-all-watches');
                    }
                    var objectForEmail = {
                        firstName: customer.profile.firstName,
                        lastName: customer.profile.lastName,
			  url: url,
			  dear: Resource.msg('msg.passwordemail.dear', 'login', null),
			  passwordChangedTitle: Resource.msg('passwordchangedemail.subject', 'account', null),
			  emailHeader: (emailHeaderContent && emailHeaderContent.custom && emailHeaderContent.custom.body ? emailHeaderContent.custom.body : ''),
                        emailFooter: (emailFooterContent && emailFooterContent.custom && emailFooterContent.custom.body ? emailFooterContent.custom.body : ''),
			  apiContentBody: (apiContent && apiContent.custom && apiContent.custom.body ? apiContent.custom.body : ''),
			  emailMarketingContent: (emailMarketingContent && emailMarketingContent.custom && emailMarketingContent.custom.body ? emailMarketingContent.custom.body : ''),
			  shopNow: Resource.msg('email.shop.now', 'account', null),
                        resettingCustomer: customer
                    };

                    var emailObj = {
                        to: email,
                        subject: Resource.msg('subject.profile.resetpassword.email', 'login', null),
                        from: Site.current.getCustomPreferenceValue('customerServiceEmail') || 'no-reply@salesforce.com',
                        type: emailHelpers.emailTypes.passwordChanged
                    };

                    emailHelpers.sendEmail(emailObj, 'account/password/passwordChangedEmail', objectForEmail);
                }
            });
        }
        return next();
    }
);

server.get('LoggedInStatus',
server.middleware.https,
function (req, res, next) {
    res.json({
        loggedIn: req.currentCustomer.raw.authenticated,
        restrictAnonymousUsersOnSalesSites: Site.getCurrent().preferences.custom.restrictAnonymousUsersOnSalesSites
    });
    next();
});

server.replace('SaveNewPassword', server.middleware.https, function (req, res, next) {
    var Transaction = require('dw/system/Transaction');
    var Resource = require('dw/web/Resource');

    var passwordForm = server.forms.getForm('newPasswords');
    var token = req.querystring.token;

    if (passwordForm.newpassword.value !== passwordForm.newpasswordconfirm.value) {
        passwordForm.valid = false;
        passwordForm.newpassword.valid = false;
        passwordForm.newpasswordconfirm.valid = false;
        passwordForm.newpasswordconfirm.error =
      Resource.msg('error.message.mismatch.newpassword', 'forms', null);
    }

    if (passwordForm.valid) {
        var result = {
            newPassword: passwordForm.newpassword.value,
            newPasswordConfirm: passwordForm.newpasswordconfirm.value,
            token: token,
            passwordForm: passwordForm
        };
        res.setViewData(result);
        this.on('route:BeforeComplete', function (req, res) { // eslint-disable-line no-shadow
            var CustomerMgr = require('dw/customer/CustomerMgr');
            var URLUtils = require('dw/web/URLUtils');
            var Site = require('dw/system/Site');
            var emailHelpers = require('*/cartridge/scripts/helpers/emailHelpers');
            var formInfo = res.getViewData();
            var status;
            var resettingCustomer;
            Transaction.wrap(function () {
                resettingCustomer = CustomerMgr.getCustomerByToken(formInfo.token);
                status = resettingCustomer.profile.credentials.setPasswordWithToken(
            formInfo.token,
            formInfo.newPassword
        );
            });
            if (status.error) {
                passwordForm.newpassword.valid = false;
                passwordForm.newpasswordconfirm.valid = false;
                passwordForm.newpasswordconfirm.error =
          Resource.msg('error.message.resetpassword.invalidformentry', 'forms', null);
                res.render('account/password/newPassword', {
                    passwordForm: passwordForm,
                    token: token
                });
            } else {
                var email = resettingCustomer.profile.email;
                var url = URLUtils.https('Search-Show', 'cgid', 'shop-all-watches');
                var ContentMgr = require('dw/content/ContentMgr');
                var apiContent = ContentMgr.getContent('email-content-password-edit-body');
                var emailHeaderContent = ContentMgr.getContent('email-header');
                var emailFooterContent = ContentMgr.getContent('email-footer');
                var emailMarketingContent = ContentMgr.getContent('email-password-changed-marketing');

                var objectForEmail = {
                    firstName: resettingCustomer.profile.firstName,
                    lastName: resettingCustomer.profile.lastName,
		  url: url,
		  passwordChangedTitle: Resource.msg('passwordchangedemail.subject', 'account', null),
		  dear: Resource.msg('msg.passwordemail.dear', 'login', null),
		  emailHeader: (emailHeaderContent && emailHeaderContent.custom && emailHeaderContent.custom.body ? emailHeaderContent.custom.body : ''),
		  emailFooter: (emailFooterContent && emailFooterContent.custom && emailFooterContent.custom.body ? emailFooterContent.custom.body : ''),
		  apiContentBody: (apiContent && apiContent.custom && apiContent.custom.body ? apiContent.custom.body : ''),
		  emailMarketingContent: (emailMarketingContent && emailMarketingContent.custom && emailMarketingContent.custom.body ? emailMarketingContent.custom.body : ''),
		  shopNow: Resource.msg('email.shop.now', 'account', null),
                    resettingCustomer: resettingCustomer
                };

                var emailObj = {
                    to: email,
                    subject: Resource.msg('subject.profile.resetpassword.email', 'login', null),
                    from: Site.current.getCustomPreferenceValue('customerServiceEmail') || 'no-reply@salesforce.com',
                    type: emailHelpers.emailTypes.passwordChanged
                };

                emailHelpers.sendEmail(emailObj, 'account/password/passwordChangedEmail', objectForEmail);
                res.redirect(URLUtils.url('Login-Show'));
            }
        });
    } else {
        res.render('account/password/newPassword', { passwordForm: passwordForm, token: token });
    }
    next();
});


server.get(
		'ShowWatchlist',
		server.middleware.https,
		userLoggedIn.validateLoggedIn,
		consentTracking.consent,
		function (req, res, next) {
    var Resource = require('dw/web/Resource');
	        var URLUtils = require('dw/web/URLUtils');
    var showMyWatchesList = require('*/cartridge/models/myWatches/getProductListItems');
	        // fetching already existing product list
	        fetchWatchList = new showMyWatchesList(req.currentCustomer.raw);

	        res.render('account/myWatches/watchListPage', {
	        	fetchWatchList: fetchWatchList,
	            accountlanding: false,
	            breadcrumbs: [
	                {
	                    htmlValue: Resource.msg('global.home', 'common', null),
	                    url: URLUtils.home().toString()
	                },
	                {
	                    htmlValue: Resource.msg('page.title.myaccount', 'account', null),
	                    url: URLUtils.url('Account-Show').toString()
	                }
	            ]
	        });
	        next();
}
);

server.get(
		'RegisterWatch',
		server.middleware.https,
		csrfProtection.generateToken,
		userLoggedIn.validateLoggedIn,
		consentTracking.consent,
		function (req, res, next) {
    var Resource = require('dw/web/Resource');
	        var URLUtils = require('dw/web/URLUtils');

	        var catalogMgr = require('dw/catalog/CatalogMgr');
	        var collectionCategoryId = Site.getCurrent().getCustomPreferenceValue('myWatchesCategoryId');
	        var collectionCategory = catalogMgr.getCategory(collectionCategoryId);
	        var collectionCategorySubCategories = collectionCategory.getSubCategories();

    var myWatchesForm = server.forms.getForm('mywatches');

    myWatchesForm.clear();
    res.render('account/myWatches/registerWatchesFormPage', {
        myWatchesForm: myWatchesForm,
        collectionCategorySubCategories: collectionCategorySubCategories,
        breadcrumbs: [
	                {
	                    htmlValue: Resource.msg('global.home', 'common', null),
	                    url: URLUtils.home().toString()
	                },
	                {
	                    htmlValue: Resource.msg('page.title.myaccount', 'account', null),
	                    url: URLUtils.url('Account-Show').toString()
	                },
	                {
	                    htmlValue: Resource.msg('page.title.showwatchlist', 'account', null),
	                    url: URLUtils.url('Account-ShowWatchlist').toString()
	                }
	            ]
	        });
    next();
}
);

server.post(
		'SaveMyWatch',
		server.middleware.https,
		csrfProtection.validateAjaxRequest,
		function (req, res, next) {
    var URLUtils = require('dw/web/URLUtils');
    var formErrors = require('*/cartridge/scripts/formErrors');
    var productListHelpers = require('*/cartridge/scripts/helpers/productListHelpers');

    var modelNo;
    var collection;
    var customer = req.currentCustomer.raw;
    var myWatchesForm = server.forms.getForm('mywatches');
    modelNo = myWatchesForm.mywatches.modelNo.htmlValue;
    collection = req.form.collection;
    var fieldErrors = formErrors.getFormErrors(myWatchesForm);
    var serverErrors = Object.keys(fieldErrors).length ? {} : productListHelpers.validateAndSaveProduct(modelNo, customer);

    if (Object.keys(fieldErrors).length || Object.keys(serverErrors.serverErrors).length) {
        res.json({
	                form: myWatchesForm,
	                fieldErrors: [fieldErrors],
	                serverErrors: [serverErrors],
	                error: [true]
	            });
    }

    res.json({
        success: true,
        redirectUrl: URLUtils.url('Account-ShowWatchlist').toString()
    });
    next();
}
);

server.prepend('Header', server.middleware.include, function (req, res, next) {
    var viewData = res.getViewData();
    viewData = {
        ecommerceFunctionalityEnabled: Site.getCurrent().preferences.custom.ecommerceFunctionalityEnabled
    }
    res.setViewData(viewData);
    next();
});

module.exports = server.exports();
