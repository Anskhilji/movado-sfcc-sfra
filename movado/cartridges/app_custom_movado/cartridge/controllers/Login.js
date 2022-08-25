'use strict';

var server = require('server');
var WELCOMEMAT = 'welcomeMat';
var page = module.superModule;
server.extend(page);

var csrfProtection = require('*/cartridge/scripts/middleware/csrf');
var consentTracking = require('*/cartridge/scripts/middleware/consentTracking');
var Site = require('dw/system/Site');

server.append(
    'Show',
    consentTracking.consent,
    server.middleware.https,
    csrfProtection.generateToken,
    function (req, res, next) {
        var FolderSearch = require('*/cartridge/models/search/folderSearch');
        var pageMetaHelper = require('*/cartridge/scripts/helpers/pageMetaHelper');
        var searchCustomHelpers = require('*/cartridge/scripts/helpers/searchCustomHelper');
        var folderSearch = searchCustomHelpers.setupContentFolderSearch('root');
        
        var facebookOauthProvider = Site.getCurrent().getCustomPreferenceValue('facebookOauthProvider');
        var googleOauthProvider = Site.getCurrent().getCustomPreferenceValue('googleOauthProvider');
        
        var contentObj = {
        		pageTitle: folderSearch.folder.pageTitle,
        		pageDescription: folderSearch.folder.pageDescription,
        		pageKeywords: folderSearch.folder.pageKeywords };

        pageMetaHelper.setPageMetaData(req.pageMetaData, contentObj);

        var viewData = res.getViewData();
        
        var oAuthObject = {
        		facebookOauthProvider : facebookOauthProvider,
        		googleOauthProvider : googleOauthProvider
        }
        
        res.setViewData(oAuthObject);

        viewData.ecommerceFunctionalityEnabled = Site.getCurrent().preferences.custom.ecommerceFunctionalityEnabled;
        res.setViewData(viewData);

        next();
    }
);

server.replace('Logout', function (req, res, next) {
    var Cookie = require('dw/web/Cookie');
    var URLUtils = require('dw/web/URLUtils');
    var CustomerMgr = require('dw/customer/CustomerMgr');
    CustomerMgr.logoutCustomer(false);
    var welcomeMatCookie = new Cookie(WELCOMEMAT, false);
    response.addHttpCookie(welcomeMatCookie);
    res.redirect(URLUtils.url('Home-Show'));
    return next();
});

server.replace('OAuthReentry', server.middleware.https, function (req, res, next) {
    var URLUtils = require('dw/web/URLUtils');
    var oauthLoginFlowMgr = require('dw/customer/oauth/OAuthLoginFlowMgr');
    var CustomerMgr = require('dw/customer/CustomerMgr');
    var Transaction = require('dw/system/Transaction');
    var Resource = require('dw/web/Resource');
    var accountHelpers = require('*/cartridge/scripts/helpers/accountHelpers');
    var firstTimeUser = false;

    var destination = req.session.privacyCache.store.oauthLoginTargetEndPoint;

    var finalizeOAuthLoginResult = oauthLoginFlowMgr.finalizeOAuthLogin();
    if (!finalizeOAuthLoginResult) {
        res.redirect(URLUtils.url('Login-Show'));
        return next();
    }
    if (!finalizeOAuthLoginResult.accessTokenResponse || (finalizeOAuthLoginResult.accessTokenResponse && finalizeOAuthLoginResult.accessTokenResponse.errorStatus)) {
        res.render('/error', {
            message: Resource.msg('error.oauth.login.failure', 'login', null)
        });

        return next();
    }
    var response = finalizeOAuthLoginResult.userInfoResponse.userInfo;
    var oauthProviderID = finalizeOAuthLoginResult.accessTokenResponse.oauthProviderId;

    if (!oauthProviderID) {
        res.render('/error', {
            message: Resource.msg('error.oauth.login.failure', 'login', null)
        });

        return next();
    }

    if (!response) {
        res.render('/error', {
            message: Resource.msg('error.oauth.login.failure', 'login', null)
        });

        return next();
    }

    var externalProfile = JSON.parse(response);
    if (!externalProfile) {
        res.render('/error', {
            message: Resource.msg('error.oauth.login.failure', 'login', null)
        });

        return next();
    }

    var userID = externalProfile.id || externalProfile.uid;
    if (!userID) {
        res.render('/error', {
            message: Resource.msg('error.oauth.login.failure', 'login', null)
        });

        return next();
    }

    var authenticatedCustomerProfile = CustomerMgr.getExternallyAuthenticatedCustomerProfile(
        oauthProviderID,
        userID
    );

    if (!authenticatedCustomerProfile) {
        // Create new profile
        Transaction.wrap(function () {
            var newCustomer = CustomerMgr.createExternallyAuthenticatedCustomer(
                oauthProviderID,
                userID
            );

            authenticatedCustomerProfile = newCustomer.getProfile();
            var firstName;
            var lastName;
            var email;

            // Google comes with a 'name' property that holds first and last name.
            if (typeof externalProfile.name === 'object') {
                firstName = externalProfile.name.givenName;
                lastName = externalProfile.name.familyName;
            } else {
                // The other providers use one of these, GitHub has just a 'name'.
                firstName = externalProfile['first-name']
                    || externalProfile.first_name
                    || externalProfile.name;

                lastName = externalProfile['last-name']
                    || externalProfile.last_name
                    || externalProfile.name;
            }

            email = externalProfile['email-address'] || externalProfile.email;

            if (!email) {
                var emails = externalProfile.emails;

                if (emails && emails.length) {
                    email = externalProfile.emails[0].value;
                }
            }

            authenticatedCustomerProfile.setFirstName(firstName);
            authenticatedCustomerProfile.setLastName(lastName);
            authenticatedCustomerProfile.setEmail(email);
            authenticatedCustomerProfile.custom.customerCurrentCountry = req.geolocation.countryCode;

        });
        firstTimeUser = true;
    }

    var credentials = authenticatedCustomerProfile.getCredentials();
    if (credentials.isEnabled()) {
        Transaction.wrap(function () {
            CustomerMgr.loginExternallyAuthenticatedCustomer(oauthProviderID, userID, true);
            authenticatedCustomerProfile.custom.customerCurrentCountry = req.geolocation.countryCode;
            if(firstTimeUser){
                accountHelpers.sendCreateAccountEmail(authenticatedCustomerProfile);
            }
        });
    } else {
        res.render('/error', {
            message: Resource.msg('error.oauth.login.failure', 'login', null)
        });

        return next();
    }

    req.session.privacyCache.clear();
    res.redirect(URLUtils.url(destination));

    return next();
});

module.exports = server.exports();
