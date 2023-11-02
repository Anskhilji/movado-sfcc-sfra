'use strict';

/**
 * All the nodes for Instagram BM extension
 * @module controllers/BM_Instagram
 */

var ISML = require('dw/template/ISML');
var Resource = require('dw/web/Resource');
var Transaction = require('dw/system/Transaction');
var URLUtils = require('dw/web/URLUtils');

var constants = require('int_instagram/cartridge/scripts/InstagramConstants');
var instagramService = require('int_instagram/cartridge/scripts/services/instagramService');

var customObjectHelper = require('int_instagram/cartridge/scripts/customObjectHelper');

var breadcrumbs = [
    {
        htmlValue: Resource.msg('socialchannels.title', 'instagram', null),
        url: URLUtils.url('SiteNavigationBar-ShowMenuitemOverview', 'CurrentMenuItemId', 'social_channels_customadminmenuextension').toString()
    },
    {
        htmlValue: Resource.msg('instagram.title', 'instagram', null),
        url: URLUtils.url('BM_Instagram-Start').toString()
    }
];

/**
 * Check if customer is connected to Facebook and Instagram Shops
 * @param {Object} instagramSettings Instagram settings object
 * @returns {boolean} true/false
 */
function isShopConnected(instagramSettings) {
    return instagramSettings && !empty(instagramSettings.custom.accessToken);
}

/**
 * Accept terms for Instagram and save the flag in custom object
 */
function acceptTerms() {
    var instagramSettings = customObjectHelper.getSettings();

    Transaction.wrap(function () {
        instagramSettings.custom.acceptTerms = true;
    });

    response.redirect(URLUtils.https('BM_Instagram-Start', 'csrf_token', request.httpParameterMap.csrf_token.stringValue));
}

/**
 * Landing page for Instagram
 */
function start() {
    var connectionStatus = request.httpParameterMap.status.stringValue;
    var csrfToken = request.httpParameterMap.csrf_token.stringValue;
    var instagramSettings = customObjectHelper.getSettings();
    var instanceParams = customObjectHelper.getInstanceParams(instagramSettings);
    var isConnected = isShopConnected(instagramSettings);

    // if token could not be obtained, disconnect mbe
    if (isConnected && instagramService.getSystemUserToken(instagramSettings).error) {
        connectionStatus = 'instagram.connection.expired';
        customObjectHelper.clearSettings(instagramSettings);
        isConnected = false;
        instagramService.disconnectMBE(instagramSettings);
    }

    // set form field values from custom object
    customObjectHelper.fillFormFromCustomObject(instagramSettings);

    // render the landing page so that the customer can authenticate through Instagram
    ISML.renderTemplate('instagram/start', {
        acceptTerms: instagramSettings.custom.acceptTerms,
        apiVersion: constants.API_VERSION,
        breadcrumbs: breadcrumbs,
        csrf_token: csrfToken,
        mbe: {
            appId: instanceParams.appId,
            extras: instanceParams.extras,
            isConnected: isConnected,
            scope: constants.MBE.SCOPE,
            status: connectionStatus
        },
        page: {
            jobs: URLUtils.url('ViewApplication-BM', 'csrf_token', csrfToken) + '#/?job',
            scapiSettings: URLUtils.url('ViewCommerceApiSettings-Start', 'SelectedMenuItem', 'studio', 'CurrentMenuItemId', 'studio', 'csrf_token', csrfToken)
        }
    });
}

/**
 * Update the required parameters before launching MBE flow
 */
function update() {
    var state = { ok: true, error: false };

    try {
        var body = JSON.parse(request.httpParameterMap.requestBodyAsString);
        var instagramSettings = customObjectHelper.getSettings();

        if (!empty(body.orgid) && !empty(body.shortcode)) {
            Transaction.wrap(function () {
                instagramSettings.custom.appId = body.appid;
                instagramSettings.custom.externalBusinessId = body.externalbusinessid;
                instagramSettings.custom.orgId = body.orgid;
                instagramSettings.custom.shortCode = body.shortcode;
            });
        } else {
            throw new Error('Missing required parameters');
        }
    } catch (error) {
        state = { error: true, message: error.message };
        response.setStatus(400);
    }

    response.setContentType('application/json');
    response.writer.print(JSON.stringify(state));
}

/**
 * Callback for MBE flow
 */
function callback() {
    var accessToken = request.httpParameterMap.accessToken.value;

    if (empty(accessToken)) {
        response.redirect(URLUtils.https('BM_Instagram-Start', 'csrf_token', request.httpParameterMap.csrf_token.stringValue, 'status', 'instagram.connection.cancelled').toString());
    } else {
        var instagramSettings = customObjectHelper.getSettings();

        Transaction.wrap(function () {
            instagramSettings.custom.accessToken = accessToken;
            instagramSettings.custom.businessManagerId = null;
            instagramSettings.custom.commercePartnerIntegrationId = null;
        });

        var assetResponse = instagramService.getAssetIDs(instagramSettings);

        if (assetResponse.error || empty(assetResponse.result) || empty(assetResponse.result.data)) {
            customObjectHelper.clearSettings(instagramSettings);
            response.redirect(URLUtils.https('BM_Instagram-Start', 'csrf_token', request.httpParameterMap.csrf_token.stringValue, 'status', 'instagram.connection.expired').toString());
        } else {
            Transaction.wrap(function () {
                instagramSettings.custom.businessManagerId = assetResponse.result.data[0].business_manager_id;
                instagramSettings.custom.commercePartnerIntegrationId = assetResponse.result.data[0].commerce_partner_integration_id || '';
            });

            response.redirect(URLUtils.https('BM_Instagram-Start', 'csrf_token', request.httpParameterMap.csrf_token.stringValue, 'status', 'instagram.connection.success').toString());
        }
    }
}

/**
 * Disconnect MBE and clear access token
 */
function disconnect() {
    var instagramSettings = customObjectHelper.getSettings();

    instagramService.disconnectMBE(instagramSettings);
    customObjectHelper.clearSettings(instagramSettings);
    response.redirect(URLUtils.https('BM_Instagram-Start', 'csrf_token', request.httpParameterMap.csrf_token.stringValue, 'status', 'instagram.connection.disconnected').toString());
}

/**
 * Endpoints
 */
module.exports.AcceptTerms = acceptTerms;
module.exports.AcceptTerms.public = true;
module.exports.Start = start;
module.exports.Start.public = true;
module.exports.Update = update;
module.exports.Update.public = true;
module.exports.Callback = callback;
module.exports.Callback.public = true;
module.exports.Disconnect = disconnect;
module.exports.Disconnect.public = true;
