'use strict';

var server = require('server');
server.extend(module.superModule);
var csrfProtection = require('*/cartridge/scripts/middleware/csrf');
var customAccountHelper = require('*/cartridge/scripts/helpers/customAccountHelpers');
var Site = require('dw/system/Site');
var Transaction = require('dw/system/Transaction');

// Function will be called when a new customer is being created
server.replace('SubmitRegistration', server.middleware.https, csrfProtection.validateAjaxRequest,
	function (req, res, next) {
		var CustomerMgr = require('dw/customer/CustomerMgr');
		var Resource = require('dw/web/Resource');

		var EmailSubscriptionHelper = require('int_custom_marketing_cloud/cartridge/scripts/helper/EmailSubscriptionHelper');
		var formErrors = require('*/cartridge/scripts/formErrors');

		var registrationForm = server.forms.getForm('profile');
		var isAccountSignupVerificationEnabled = !empty(Site.current.preferences.custom.isAccountSignupVerificationEnabled) ? Site.current.preferences.custom.isAccountSignupVerificationEnabled : false;
		// Custom: Start [added the registration limit on this controller]
		var blockRegistrationOnSalesSites = Site.current.preferences.custom.blockRegistrationOnSalesSites;

		if (blockRegistrationOnSalesSites) {
			res.json({
				success: false,
				errorMessage: Resource.msg('error.message.unable.to.create.account', 'login', null)
			});

			return next();
		}
		// Custom: End

		// form validation
		if (registrationForm.customer.email.value.toLowerCase()
			!== registrationForm.customer.emailconfirm.value.toLowerCase()
		) {
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

		if (registrationForm.login.password.value
			!== registrationForm.login.passwordconfirm.value
		) {
			registrationForm.login.password.valid = false;
			registrationForm.login.passwordconfirm.valid = false;
			registrationForm.login.passwordconfirm.error =
				Resource.msg('error.message.mismatch.password', 'forms', null);
			registrationForm.valid = false;
		}

		if (!CustomerMgr.isAcceptablePassword(registrationForm.login.password.value)) {
			registrationForm.login.password.valid = false;
			registrationForm.login.passwordconfirm.valid = false;
			registrationForm.login.passwordconfirm.error =
				Resource.msg('error.message.password.constraints.not.matched', 'forms', null);
			registrationForm.valid = false;
		}

		if (!customAccountHelper.isValidatebirthDay(registrationForm.customer.birthdate.value, registrationForm.customer.birthmonth.selectedOption)) {
			registrationForm.customer.birthdate.valid = false;
			registrationForm.customer.birthdate.error =
				Resource.msg('error.message.invalid.birthdate', 'forms', null);
			registrationForm.valid = false;
		}

		// setting variables for the BeforeComplete function
		var registrationFormObj = {
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
								newCustomerProfile.phoneHome = registrationForm.phone;
								newCustomerProfile.email = registrationForm.email;
								newCustomerProfile.custom.birthdate = registrationForm.birthdate;
								newCustomerProfile.custom.birthmonth = registrationForm.birthmonth;
								newCustomerProfile.custom.customerCurrentCountry = req.geolocation.countryCode;
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
							registrationForm.form.customer.emailconfirm.valid = false;
							registrationForm.form.customer.email.error =
								Resource.msg('error.message.username.invalid', 'forms', null);
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
						redirectUrl: accountHelpers.getLoginRedirectURL(req.querystring.rurl, req.session.privacyCache, true)
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
	}
);

module.exports = server.exports();
