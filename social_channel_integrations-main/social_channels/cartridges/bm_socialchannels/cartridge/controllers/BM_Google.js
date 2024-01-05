'use strict';

/**
 * All the nodes for Google BM extension
 * @module controllers/BM_Google
 */

var ISML = require('dw/template/ISML');
var Logger = require('dw/system/Logger');
var Site = require('dw/system/Site');
var Transaction = require('dw/system/Transaction');
var constants = require('int_google/cartridge/scripts/GoogleConstants');
var customObjectHelper = require('int_google/cartridge/scripts/customObjectHelper');
var googleService = require('int_google/cartridge/scripts/services/googleService');
var validationHelper = require('../scripts/utils/validationHelper');

/**
 * Force disconnect the current user from the current site.
 */
function forceDisconnect() {
    var googleSettings = customObjectHelper.getCustomObject();
    customObjectHelper.removeCustomObject(googleSettings);
    response.redirect(require('dw/web/URLUtils').https('BM_Google-Start', 'csrf_token', request.httpParameterMap.csrf_token.stringValue));
}

/**
 * Launch google and show the manage page
 */
function launch() {
    var SEPARATOR = ':';

    var form = session.forms.google;
    var googleSettings = customObjectHelper.getCustomObject();
    var siteId = Site.getCurrent().ID;
    var orgId = form.orgid.value;

    if (!validationHelper.validateOrgId(orgId)) {
        ISML.renderTemplate('google/start', {
            error: 'invalid.orgid',
            acceptTerms: googleSettings.custom.acceptTerms
        });
        return;
    }

    var realmId = orgId.substr(7, 4);
    var instanceType = orgId.substring(12);
    if (['prd', 'stg'].indexOf(instanceType) === -1) {
        instanceType = 'dev';
    }

    var appId = realmId + SEPARATOR + instanceType + SEPARATOR + siteId;

    // validate the AM Credentials
    if (!validationHelper.validateAMCredentials(form.amclientid.value, form.amclientsecret.value)) {
        ISML.renderTemplate('google/start', {
            error: 'invalid.amcredentials',
            acceptTerms: googleSettings.custom.acceptTerms
        });
        return;
    }

    // Create the connection and save the app details within the form so that it gets saved in the custom object afterward
    var response = googleService.createConnection(appId, form);
    if (response.error) {
        ISML.renderTemplate('google/start', {
            error: response.errorCode,
            acceptTerms: googleSettings.custom.acceptTerms
        });
        return;
    }
    var externalData = {
        amclientid: form.amclientid.value,
        orgId: form.orgid.value,
        email: form.email.value
    };

    Transaction.wrap(function () {
        googleSettings.custom.externalData = JSON.stringify(externalData);
        googleSettings.custom.appId = appId;
        googleSettings.custom.gmcid = form.gmcid.value;
        var maxEventObjectAttrDef = googleSettings.describe().getCustomAttributeDefinition('maxNumberEvents');
        if (maxEventObjectAttrDef) {
            googleSettings.custom.maxNumberEvents = constants.MAX_TRACKING_EVENTS;
        }
    });

    ISML.renderTemplate('google/setup', {
        googleSettings: googleSettings
    });
}

/**
 * Landing page for google
 */
function start() {
    var googleSettings = customObjectHelper.getCustomObject();
    var externalData = customObjectHelper.getExternalData(googleSettings);
    var merchantCenterUrl = constants.GOOGLE_MERCHANT_CENTER_URL;
    if (!empty(googleSettings.custom.gmcid)) {
        merchantCenterUrl += '?a=' + googleSettings.custom.gmcid;
    }

    // If the customer already authenticated, we know the gmcid, we can directly render the 'Manage' page
    if (!empty(googleSettings.custom.appId)) {
        var response = googleService.getConnection(googleSettings.custom.appId);
        if (response.error) {
            if (response.errorCode === '404') {
                Logger.error('Google Connection not found for appid:' + googleSettings.custom.appId);
            }
            Logger.error('Unexpected error in get connection. Reseting the connection');
            forceDisconnect();
            return;
        }

        if (response.result && response.result.state === constants.STATES.LIVE) {
            ISML.renderTemplate('google/manage', {
                googleSettings: googleSettings,
                externalData: externalData,
                merchantCenterUrl: merchantCenterUrl,
                error: request.httpParameterMap.error.stringValue
            });
            return;
        }

        ISML.renderTemplate('google/setup', {
            googleSettings: googleSettings,
            error: request.httpParameterMap.error.stringValue
        });
        return;
    }

    var formSubmitted = request.httpParameterMap.launch.booleanValue;
    if (!formSubmitted) {
        // Clear form
        var form = session.forms.google;
        form.clearFormElement();
        form.name.value = '';
        form.email.value = '';
        form.phone.value = '';
        form.amclientid.value = '';
        form.amclientsecret.value = '';
        form.gmcid.value = '';
        form.orgid.value = '';

        // Render the landing page so that the customer can authenticate through google
        ISML.renderTemplate('google/start', {
            acceptTerms: googleSettings.custom.acceptTerms,
            success: request.httpParameterMap.success.stringValue
        });
        return;
    }

    launch();
}

/**
 * Accept terms for google and save the flag in custom object
 */
function acceptTerms() {
    var googleSettings = customObjectHelper.getCustomObject();
    Transaction.wrap(function () {
        googleSettings.custom.acceptTerms = true;
    });

    response.redirect(require('dw/web/URLUtils').https('BM_Google-Start', 'csrf_token', request.httpParameterMap.csrf_token.stringValue));
}

/**
 * Disconnect the Google account
 */
function disconnect() {
    var googleSettings = customObjectHelper.getCustomObject();

    if (!empty(googleSettings.custom.appId)) {
        var res = googleService.deleteConnection(googleSettings.custom.appId);
        if (!res.error) {
            customObjectHelper.removeCustomObject(googleSettings);
            response.redirect(require('dw/web/URLUtils').https('BM_Google-Start', 'csrf_token', request.httpParameterMap.csrf_token.stringValue));
        } else {
            ISML.renderTemplate('google/setup', {
                googleSettings: googleSettings,
                error: res.errorCode
            });
        }
    } else {
        forceDisconnect();
    }
}

/**
 * Endpoints
 */
module.exports.Start = start;
module.exports.Start.public = true;
module.exports.AcceptTerms = acceptTerms;
module.exports.AcceptTerms.public = true;
module.exports.Disconnect = disconnect;
module.exports.Disconnect.public = true;
