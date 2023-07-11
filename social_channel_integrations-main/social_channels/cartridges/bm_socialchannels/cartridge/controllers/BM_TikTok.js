'use strict';

/**
 * All the nodes for TikTok BM extension
 * @module controllers/BM_TikTok
 */

var Encoding = require('dw/crypto/Encoding');
var ISML = require('dw/template/ISML');
var Logger = require('dw/system/Logger');
var Mac = require('dw/crypto/Mac');
var Resource = require('dw/web/Resource');
var Site = require('dw/system/Site');
var StringUtils = require('dw/util/StringUtils');
var System = require('dw/system/System');
var Transaction = require('dw/system/Transaction');
var URLAction = require('dw/web/URLAction');
var URLUtils = require('dw/web/URLUtils');
var OauthFactory = require('int_tiktok/cartridge/scripts/util/OauthFactory');
var OauthService = require('int_tiktok/cartridge/scripts/services/OauthService');
var constants = require('int_tiktok/cartridge/scripts/TikTokConstants');
var customObjectHelper = require('int_tiktok/cartridge/scripts/customObjectHelper');
var tiktokService = require('int_tiktok/cartridge/scripts/services/tiktokService');

var breadcrumbs = [
    {
        htmlValue: Resource.msg('socialchannels.title', 'tiktok', null),
        url: URLUtils.url('SiteNavigationBar-ShowMenuitemOverview', 'CurrentMenuItemId', 'social_channels_customadminmenuextension').toString()
    },
    {
        htmlValue: Resource.msg('tiktok.title', 'tiktok', null),
        url: URLUtils.url('BM_TikTok-Start').toString()
    }
];

/**
 * verify if connected to TikTok Shop
 * @param {Object} extData - external data
 * @returns {boolean} true/false
 */
function isShopConnected(extData) {
    if (extData == null) {
        return false;
    }
    // retry upto 3 times, since it seems 90% of the time the first call fails
    for (let i = 0; i < constants.SERVICE_RETRTY_COUNT; i++) {
        Logger.info((i + 1) + 'try to check is connected to TikTok');
        if (tiktokService.checkConnectionStatus(extData)) {
            return true;
        }
    }

    Logger.error('could not verify if connected to TikTok');
    return false;
}

/**
 * Landing page for TikTok
 */
function start() {
    var tikTokSettings = customObjectHelper.getCustomObject();

    // If the customer already authenticated, we know the pixelCode, we can directly render the 'Manage' page  additional if they already completed the onboarding for TikTok Shop
    if (!empty(tikTokSettings.custom.pixelCode) || (!empty(tikTokSettings.custom.tikTokShopConnected) && tikTokSettings.custom.tikTokShopConnected == true)) {
        ISML.renderTemplate('tiktok/setup', {
            tikTokSettings: tikTokSettings,
            breadcrumbs: breadcrumbs,
            error: request.httpParameterMap.error.stringValue,
            success: request.httpParameterMap.success.stringValue
        });
        return;
    }

    if (isShopConnected(tikTokSettings.custom.externalData_base64)) {
        // check if TikTok shop onboarding completed
        Transaction.wrap(function () {
            tikTokSettings.custom.tikTokShopConnected = true;
        });
        ISML.renderTemplate('tiktok/setup', {
            tikTokSettings: tikTokSettings,
            breadcrumbs: breadcrumbs,
            error: request.httpParameterMap.error.stringValue,
            success: request.httpParameterMap.success.stringValue
        });
        return;
    }

    // get prior generated tenant ID
    var tenantId = tikTokSettings.custom.externalBusinessId;
    if (!tenantId) {
        tenantId = require('dw/util/UUIDUtils').createUUID();
    }

    var showSDK = request.httpParameterMap.showsdk.booleanValue;
    if (!showSDK) {
        // set form field values from custom object
        var form = customObjectHelper.fillFormFromCustomObject(tikTokSettings, tenantId, false);

        // clear form fields
        form.tiktokappid.value = '';
        form.tiktokappsecret.value = '';
        form.tiktokexternaldatakey.value = '';

        // Render the landing page so that the customer can authenticate through TikTok
        ISML.renderTemplate('tiktok/start', {
            acceptTerms: tikTokSettings.custom.acceptTerms,
            breadcrumbs: breadcrumbs,
            success: request.httpParameterMap.success.stringValue
        });
        return;
    }

    launch(); // eslint-disable-line no-use-before-define
}

/**
 * Returns the URL to the create order page
 * @param {string} hostNameAlias hostname alias from form
 * @param {boolean} exitInError should exit in error or fail gracefully?
 * @returns {string|Object} create order URL or error object
 */
function getCreateOrderUrl(hostNameAlias, exitInError) {
    var currentSite = Site.getCurrent();
    var siteId = currentSite.getID();
    var locale = currentSite.getDefaultLocale();
    var action = new URLAction('OrderCreate-Social', siteId, locale);
    if (hostNameAlias) {
        try {
            action = new URLAction('OrderCreate-Social', siteId, locale, hostNameAlias);
        } catch (e) {
            Logger.error(e.toString() + ' in ' + e.fileName + ':' + e.lineNumber);
            if (exitInError) {
                return { error: e.javaMessage || e.toString() };
            }
        }
    }
    return URLUtils.https(action).toString();
}

/**
 * extract domain from website URL
 * @param {string} url - the website URL
 * @returns {string} - the domain name
 */
function getDomain(url) {
    if (!url) return '';
    var matches = url.match(/^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:\/\n\?\=]+)/im);
    if (matches.length > 1) {
        return matches[1];
    }
    return '';
}

/**
 * Returns the credentials object from the form data
 * @param {dw.web.Form} form - the form
 * @returns {Object} credentials object
 */
function getCredentialsObjectFromFormData(form) {
    return {
        organization_id: form.orgid.value,
        sfcc_api_client_id: form.amclientid.value,
        sfcc_api_client_secret: form.amclientsecret.value,
        sfcc_bm_user: form.bmuser.value,
        sfcc_bm_access_key: form.bmaccesskey.value,
        shopper_api_client_id: form.shopperclientid.value,
        shopper_api_client_secret: form.shopperclientsecret.value,
        create_order_url: getCreateOrderUrl(form.hostNameAlias.value, false),
        website_url: form.website.value.replace(/\/$/, '')
    };
}

/**
 * base64 encode external data
 * @param {Object} externalData - the external data object
 * @param {Object} tikTokSettings - the tiktok settings object
 * @returns {string} - the encoded external data
 */
function encodeExternalData(externalData, tikTokSettings) {
    var timeStamp = new Date().getTime();
    var currentSite = Site.getCurrent();
    var hmacString = [
        'version=' + constants.EXTERNAL_DATA_VERSION,
        'timestamp=' + timeStamp,
        'locale=' + currentSite.getDefaultLocale().split('_')[0],
        'business_platform=' + constants.BUSINESS_PLATFORM,
        'external_business_id=' + tikTokSettings.custom.externalBusinessId
    ].join('&');
    var hmac = Encoding.toHex(new Mac(constants.EXTERNAL_DATA_HMAC_VERSION).digest(hmacString, tikTokSettings.custom.externalDataKey));
    externalData.timestamp = timeStamp;
    externalData.hmac = hmac;
    var base64 = StringUtils.encodeBase64(JSON.stringify(externalData));
    Transaction.wrap(function () {
        tikTokSettings.custom.externalData_base64 = base64;
    });
    return base64;
}

/**
 * Verifies the credentials
 * @param {string} template ISML template
 * @returns {boolean} true/false
 */
function verifyCredentials(template) {
    const CONSTANTS = OauthFactory.CONST_PARAMETERS;
    var form = session.forms.tiktok;
    if (!template) {
        template = 'tiktok/start'; // eslint-disable-line no-param-reassign
    }

    var requestDataContainer;
    var svcResponse;
    var tokenRes;
    var verifyWebdav = !!Site.getCurrent().getCustomPreferenceValue('tiktokVerifyWebDav');
    var verifyBM = !!Site.getCurrent().getCustomPreferenceValue('tiktokVerifyBM');

    // var acctMngrClientId = form.amclientid.value;
    // var acctMngrClientSecret = form.amclientsecret.value;
    var bizMngrUser = form.bmuser.value;
    var bizMngrAccessKey = form.bmaccesskey.value;
    var webDavClientId = form.shopperclientid.value;
    var webDavClientSecret = form.shopperclientsecret.value;
    var hostNameAlias = form.hostNameAlias.value;

    // validate hostname alias
    if (hostNameAlias) {
        var createOrderUrl = getCreateOrderUrl(hostNameAlias, true);
        if (typeof createOrderUrl === 'object' && Object.hasOwnProperty.call(createOrderUrl, 'error') && createOrderUrl.error) {
            Logger.info('error creating "create order url"');
            ISML.renderTemplate(template, {
                error: createOrderUrl.error,
                acceptTerms: true,
                breadcrumbs: breadcrumbs
            });
            return false;
        }
    }

    // validate WebDAV credentials for OCAPI
    if (verifyWebdav) {
        if (!webDavClientId || !webDavClientSecret) {
            Logger.info('WebDAV credentials were not fully provided');
            ISML.renderTemplate(template, {
                error: 'invalid.webDavCredentials',
                acceptTerms: true,
                breadcrumbs: breadcrumbs
            });
            return false;
        }
        requestDataContainer = OauthFactory.buildOCAPITokenRequestContainer(webDavClientId, webDavClientSecret);
        var scvOCAPI = OauthService.getOAuthAccessTokenService(requestDataContainer);
        scvOCAPI.URL = scvOCAPI.configuration.credential.URL + CONSTANTS.Q_MARK + CONSTANTS.GRANT_TYPE + CONSTANTS.EQL + requestDataContainer.grant_type;
        svcResponse = scvOCAPI.call(requestDataContainer);
        tokenRes = JSON.parse(svcResponse.object);
        if (tokenRes != null && tokenRes && tokenRes.access_token) {
            // credentials are valid
            Logger.info('OCAPI credentials validated successfully');
        } else {
            // invalid OCAPI credentials
            Logger.info('Invalid OCAPI credentials');
            ISML.renderTemplate(template, {
                error: 'invalid.webDavCredentials',
                acceptTerms: true,
                breadcrumbs: breadcrumbs
            });
            return false;
        }
    }

    // validate BM access credentials
    if (verifyBM) {
        if (!webDavClientId || !webDavClientSecret || !bizMngrUser || !bizMngrAccessKey) {
            Logger.info('Biz Mngr credentials were not fully provided');
            ISML.renderTemplate(template, {
                error: 'account.manager',
                acceptTerms: true,
                breadcrumbs: breadcrumbs
            });
            return false;
        }
        requestDataContainer = OauthFactory.buildBMTokenRequestContainer(webDavClientId, webDavClientSecret, bizMngrUser, bizMngrAccessKey);
        var instanceHostname = System.getInstanceHostname();
        var svcBM = OauthService.getOAuthAccessTokenService(requestDataContainer);
        svcBM.URL = CONSTANTS.HTTPS + CONSTANTS.COLON + CONSTANTS.FSLASH + CONSTANTS.FSLASH + instanceHostname + svcBM.configuration.credential.URL + CONSTANTS.Q_MARK + CONSTANTS.GRANT_TYPE + CONSTANTS.EQL + requestDataContainer.grant_type + CONSTANTS.AMP + CONSTANTS.CLIENT_ID + CONSTANTS.EQL + webDavClientId;

        svcResponse = svcBM.call(requestDataContainer);
        tokenRes = JSON.parse(svcResponse.object);
        if (tokenRes != null && tokenRes && tokenRes.access_token) {
            // credentials are valid
            Logger.info('BM credentials validated successfully');
        } else {
            // invalid Biz Mngr credentials
            Logger.info('Invalid BM credentials');
            ISML.renderTemplate(template, {
                error: 'account.manager',
                acceptTerms: true,
                breadcrumbs: breadcrumbs
            });
            return false;
        }
    }
    return true;
}

/**
 * send CC credentials
 * @param {string} appId - App ID
 * @param {string} extBusId - external business ID
 * @param {Object} credentials - credentials object
 * @param {string} edBase64 - base 64 encoded external data
 * @returns {boolean} - true if credentials are pushed successfully
 */
function pushCredentials(appId, extBusId, credentials, edBase64) {
    var isSendCredentials = false;
    if (credentials && Object.hasOwnProperty.call(credentials, 'sfcc_bm_user') && Object.hasOwnProperty.call(credentials, 'sfcc_bm_access_key') && Object.hasOwnProperty.call(credentials, 'shopper_api_client_secret')) {
        // retry upto 3 times, since it seems 90% of the time the first call fails
        for (let i = 0; i < constants.SERVICE_RETRTY_COUNT; i++) {
            Logger.info((i + 1) + 'try to pushCredentials to TikTok');
            isSendCredentials = tiktokService.sendBusinessCredentials(appId,
                extBusId,
                edBase64,
                credentials.sfcc_api_client_id,
                credentials.sfcc_api_client_secret,
                credentials.sfcc_bm_user,
                credentials.sfcc_bm_access_key,
                constants.OCAPI_VERSION,
                Site.getCurrent().getID(),
                credentials.shopper_api_client_secret,
                credentials.create_order_url,
                credentials.website_url);
            if (!isSendCredentials) {
                Logger.error('ERROR pushing credentials to TikTok ');
            } else {
                Logger.info('credentials pushed to TikTok');
                return isSendCredentials;
            }
        }
        Logger.error('ERROR unable to push credentials to TikTok');
    } else {
        Logger.error('ERROR missing values for credentials');
    }
    return isSendCredentials;
}

/**
 * Sends the updated credentials to TikTok
 * @returns {boolean} true if credentials were successfully passed to TikTok
 */
function updateCredentials() {
    if (!verifyCredentials('tiktok/manageCredentials')) {
        return false;
    }

    var tikTokSettings = customObjectHelper.getCustomObject();
    var form = session.forms.tiktok;

    var credentials = getCredentialsObjectFromFormData(form);
    var externalData = customObjectHelper.getExternalData(tikTokSettings);

    // update external data object with form data
    externalData.extra.organization_id = credentials.organization_id;
    externalData.extra.sfcc_api_client_id = credentials.sfcc_api_client_id;
    externalData.extra.sfcc_bm_user = credentials.sfcc_bm_user;
    externalData.extra.shopper_api_client_id = credentials.shopper_api_client_id;
    externalData.extra.hostname_alias = form.hostNameAlias.value || '';
    externalData.website_url = credentials.website_url;
    externalData.domain = getDomain(credentials.website_url);
    externalData.create_order_url = credentials.create_order_url;

    Transaction.wrap(function () {
        tikTokSettings.custom.shopperClientId = credentials.shopper_api_client_id;
        tikTokSettings.custom.shopperClientSecret = credentials.shopper_api_client_secret;
        tikTokSettings.custom.externalData = JSON.stringify(externalData);
        var maxEventObjectAttrDef = tikTokSettings.describe().getCustomAttributeDefinition('maxNumberEvents');
        if (maxEventObjectAttrDef) {
            tikTokSettings.custom.maxNumberEvents = constants.MAX_TRACKING_EVENTS;
        }
    });

    // call TikTok update credentials service
    var base64 = encodeExternalData(externalData, tikTokSettings);
    return pushCredentials(tikTokSettings.custom.appId, tikTokSettings.custom.externalBusinessId, credentials, base64);
}

/**
 * page used to update credentials and send to TikTok
 */
function manageCredentials() {
    var tikTokSettings = customObjectHelper.getCustomObject();
    breadcrumbs.push({
        htmlValue: Resource.msg('tiktok.manage.credentials.title', 'tiktok', null),
        url: URLUtils.url('BM_TikTok-ManageCredentials').toString()
    });

    // if the customer has not on-boarded, redirect them to the start page.
    var pixelCode = tikTokSettings.custom.pixelCode || null;
    var tikTokShopConnected = !!tikTokSettings.custom.tikTokShopConnected;
    var tenantId = tikTokSettings.custom.externalBusinessId || null;
    if (!tenantId || (!pixelCode && !tikTokShopConnected)) {
        response.redirect(URLUtils.https('BM_TikTok-Start'));
        return;
    }

    var formSubmitted = request.httpParameterMap.manageCredentials.booleanValue;
    if (!formSubmitted) {
        // set form field values from custom object
        customObjectHelper.fillFormFromCustomObject(tikTokSettings, tenantId, false);

        // Render the credentials page so that the customer can update through TikTok
        ISML.renderTemplate('tiktok/manageCredentials', {
            breadcrumbs: breadcrumbs
        });
        return;
    }

    var result = updateCredentials();
    if (!result) {
        ISML.renderTemplate('tiktok/manageCredentials', {
            error: 'svc.credentials',
            breadcrumbs: breadcrumbs
        });
        return;
    }

    response.redirect(URLUtils.https('BM_TikTok-Start', 'success', 'credentials'));
}

/**
 * Render the SDK
 * @param {Object} tikTokSettings - TikTok custom object settings
 * @param {Object} externalData - external data from custom object
 * @param {boolean} isConnected - is connected to TikTok?
 * @param {Object} credentials - credentials object
 */
function renderSDK(tikTokSettings, externalData, isConnected, credentials) {
    var site = Site.getCurrent();
    var base64 = encodeExternalData(externalData, tikTokSettings);

    // only push/send credentials first time when connecting
    if (!isConnected) {
        var verifyWebdav = !!Site.getCurrent().getCustomPreferenceValue('tiktokVerifyWebDav');
        var verifyBM = !!Site.getCurrent().getCustomPreferenceValue('tiktokVerifyBM');
        if ((verifyWebdav || verifyBM) && !pushCredentials(tikTokSettings.custom.appId, tikTokSettings.custom.externalBusinessId, credentials, base64)) {
            ISML.renderTemplate('tiktok/start', {
                error: 'svc.credentials',
                acceptTerms: tikTokSettings.custom.acceptTerms,
                breadcrumbs: breadcrumbs
            });
            return;
        }
    }

    var approved = '';
    var processing = '';
    var rejected = '';
    if (!empty(tikTokSettings.custom.catalogOverview)) {
        var catalogOverview = JSON.parse(tikTokSettings.custom.catalogOverview);
        if (!empty(catalogOverview) && catalogOverview != 'undefined') {
            approved = catalogOverview.approved;
            processing = catalogOverview.processing;
            rejected = catalogOverview.rejected;
        }
    }

    var jsPluginV = site.getCustomPreferenceValue('tiktokPluginJS');
    if (jsPluginV == null) {
        jsPluginV = 'https://sf16-scmcdn-va.ibytedtos.com/obj/static-us/tiktok-business-plugin/tbp_external_platform-v2.3.10.js';
    }
    ISML.renderTemplate('tiktok/tiktoksdk', {
        isConnected: isConnected,
        base64: base64,
        pluginJS: jsPluginV,
        breadcrumbs: breadcrumbs,
        tikTokSettings: {
            externalBusinessId: tikTokSettings.custom.externalBusinessId || '',
            bcId: tikTokSettings.custom.bcId || '',
            advertiserId: tikTokSettings.custom.advertiserId || '',
            pixelCode: tikTokSettings.custom.pixelCode || '',
            enableAdvancedMatchingEmail: tikTokSettings.custom.enableAdvancedMatchingEmail || '',
            enableAdvancedMatchingPhone: tikTokSettings.custom.enableAdvancedMatchingPhone || '',
            catalogId: tikTokSettings.custom.catalogId || '',
            catalogOverview: {
                approved: approved,
                processing: processing,
                rejected: rejected
            }
        }
    });
}

/**
 * Launch TikTok and get auth token
 */
function launch() {
    if (!verifyCredentials('tiktok/start')) {
        return;
    }

    var site = Site.getCurrent();
    var tikTokSettings = customObjectHelper.getCustomObject();
    var form = session.forms.tiktok;
    var redirectUri = URLUtils.https('BM_TikTok-Callback').toString();

    // Create the application and save the app details within the form so that it gets saved in the custom object afterward
    var createAppResponse = tiktokService.createApplication(form.tenantid.value, redirectUri);
    if (createAppResponse.error) {
        // try second time, it seems 90% of the time the first call fails
        createAppResponse = tiktokService.createApplication(form.tenantid.value, redirectUri);
        if (createAppResponse.error) {
            ISML.renderTemplate('tiktok/start', {
                error: createAppResponse.errorCode,
                acceptTerms: tikTokSettings.custom.acceptTerms,
                breadcrumbs: breadcrumbs
            });
            return;
        }
    }

    form.tiktokappid.value = createAppResponse.result.data.app_id;
    form.tiktokappsecret.value = createAppResponse.result.data.app_secret;
    form.tiktokexternaldatakey.value = createAppResponse.result.data.external_data_key;

    var credentials = getCredentialsObjectFromFormData(form);

    var externalData = {
        version: constants.EXTERNAL_DATA_VERSION,
        business_platform: constants.BUSINESS_PLATFORM,
        external_business_id: form.tenantid.value,
        app_id: form.tiktokappid.value,
        extra: {
            organization_id: form.orgid.value,
            sfcc_api_client_id: form.amclientid.value,
            sfcc_bm_user: form.bmuser.value,
            shopper_api_client_id: form.shopperclientid.value,
            hostname_alias: form.hostNameAlias.value || ''
        },
        industry_id: form.industryid.value,
        timezone: site.getTimezone(),
        country_region: form.countrycode.value,
        store_name: site.getID(),
        phone_number: form.countrycallingcode.value + form.phone.value,
        email: form.email.value,
        currency: site.getDefaultCurrency(),
        locale: site.getDefaultLocale().split('_')[0],
        website_url: credentials.website_url,
        domain: getDomain(credentials.website_url),
        redirect_uri: redirectUri,
        create_order_url: credentials.create_order_url,
        close_method: 'redirect_inside_tiktok'
    };

    Transaction.wrap(function () {
        tikTokSettings.custom.appId = form.tiktokappid.value;
        tikTokSettings.custom.appSecret = form.tiktokappsecret.value;
        tikTokSettings.custom.externalDataKey = form.tiktokexternaldatakey.value;
        tikTokSettings.custom.externalBusinessId = form.tenantid.value;
        tikTokSettings.custom.shopperClientId = form.shopperclientid.value;
        tikTokSettings.custom.shopperClientSecret = form.shopperclientsecret.value;
        tikTokSettings.custom.externalData = JSON.stringify(externalData);
        var maxEventObjectAttrDef = tikTokSettings.describe().getCustomAttributeDefinition('maxNumberEvents');
        if (maxEventObjectAttrDef) {
            tikTokSettings.custom.maxNumberEvents = constants.MAX_TRACKING_EVENTS;
        }
    });
    renderSDK(tikTokSettings, externalData, false, credentials);
}

/**
 * Accept terms for TikTok and save the flag in custom object
 */
function acceptTerms() {
    var tikTokSettings = customObjectHelper.getCustomObject();
    Transaction.wrap(function () {
        tikTokSettings.custom.acceptTerms = true;
    });

    response.redirect(URLUtils.https('BM_TikTok-Start', 'csrf_token', request.httpParameterMap.csrf_token.stringValue));
}

/**
 * Callback URL for tiktok.
 */
function callback() {
    var tikTokSettings = customObjectHelper.getCustomObject();

    // check if TikTok shop onboarding completed
    if (isShopConnected(tikTokSettings.custom.externalData_base64)) {
        Transaction.wrap(function () {
            tikTokSettings.custom.tikTokShopConnected = true;
        });
    } else {
        // Authenticating against the TikTok API
        var authCode = request.httpParameterMap.auth_code.value;
        var accessTokenResponse = tiktokService.getAuthToken(tikTokSettings, authCode);
        if (accessTokenResponse.error) {
            customObjectHelper.clearValues(tikTokSettings);
            ISML.renderTemplate('tiktok/start', {
                error: accessTokenResponse.errorCode,
                acceptTerms: tikTokSettings.custom.acceptTerms,
                breadcrumbs: breadcrumbs
            });
            return;
        }

        Transaction.wrap(function () {
            tikTokSettings.custom.accessToken = accessTokenResponse.result.data.access_token;
        });

        // Get the Business Profile of the customer
        var getProfileResponse = tiktokService.getBusinessProfile(tikTokSettings);
        if (getProfileResponse.error) {
            customObjectHelper.clearValues(tikTokSettings);
            ISML.renderTemplate('tiktok/start', {
                error: getProfileResponse.errorCode,
                acceptTerms: tikTokSettings.custom.acceptTerms,
                breadcrumbs: breadcrumbs
            });
            return;
        }
        Transaction.wrap(function () {
            tikTokSettings.custom.pixelCode = getProfileResponse.result.data.pixel_code;
            tikTokSettings.custom.bcId = getProfileResponse.result.data.bc_id;
            tikTokSettings.custom.advertiserId = getProfileResponse.result.data.adv_id;
            tikTokSettings.custom.catalogId = getProfileResponse.result.data.catalog_id;
        });

        // Get the Pixel details of the customer's app
        var getPixelResponse = tiktokService.getPixelDetails(tikTokSettings);
        if (getPixelResponse.error) {
            customObjectHelper.clearValues(tikTokSettings);
            ISML.renderTemplate('tiktok/start', {
                error: getPixelResponse.errorCode,
                acceptTerms: tikTokSettings.custom.acceptTerms,
                breadcrumbs: breadcrumbs
            });
            return;
        }
        Transaction.wrap(function () {
            tikTokSettings.custom.enableAdvancedMatchingPhone = getPixelResponse.result.data.pixels[0].advanced_matching_fields.phone_number;
            tikTokSettings.custom.enableAdvancedMatchingEmail = getPixelResponse.result.data.pixels[0].advanced_matching_fields.email;
        });

        // Get the catalog overview
        var getCatalogOverview = tiktokService.getCatalogOverview(tikTokSettings);
        if (getCatalogOverview.error) {
            customObjectHelper.clearValues(tikTokSettings);
            ISML.renderTemplate('tiktok/start', {
                error: getCatalogOverview.errorCode,
                acceptTerms: tikTokSettings.custom.acceptTerms,
                breadcrumbs: breadcrumbs
            });
            return;
        }
        Transaction.wrap(function () {
            tikTokSettings.custom.catalogOverview = JSON.stringify(getCatalogOverview.result.data);
        });
    }

    // added redirect cuz reload window.opener.location.href not working for some browsers
    response.redirect(URLUtils.https('BM_TikTok-Start', 'csrf_token', request.httpParameterMap.csrf_token.stringValue, 'success', 'setup').toString());
}

/**
 * Disconnect from TikTok + delete Pixel from Einstein + Remove custom object holding settings
 */
function disconnect() {
    var tikTokSettings = customObjectHelper.getCustomObject();
    var redirectUrl = URLUtils.https('BM_TikTok-Start', 'csrf_token', request.httpParameterMap.csrf_token.stringValue, 'success', 'disconnect');

    if (tikTokSettings.custom.tikTokShopConnected) {
        tiktokService.disconnectShop(tikTokSettings.custom.externalBusinessId, tikTokSettings.custom.externalData_base64);
        customObjectHelper.removeCustomObject(tikTokSettings);
        response.redirect(redirectUrl);
        return;
    }

    if (tiktokService.disconnectFromTikTok(tikTokSettings)) {
        customObjectHelper.removeCustomObject(tikTokSettings);
        response.redirect(redirectUrl);
        return;
    }

    ISML.renderTemplate('tiktok/setup', {
        tikTokSettings: tikTokSettings,
        error: 'disconnect',
        breadcrumbs: breadcrumbs
    });
}

/**
 * Manage tiktok page
 */
function manage() {
    var tikTokSettings = customObjectHelper.getCustomObject();
    if ((empty(tikTokSettings.custom.tikTokShopConnected) || tikTokSettings.custom.tikTokShopConnected == false)) {
        // Refresh the catalog overview
        var getCatalogOverview = tiktokService.getCatalogOverview(tikTokSettings);
        if (getCatalogOverview.error) {
            customObjectHelper.clearValues(tikTokSettings);
            ISML.renderTemplate('tiktok/start', {
                error: getCatalogOverview.errorCode,
                acceptTerms: tikTokSettings.custom.acceptTerms,
                breadcrumbs: breadcrumbs
            });
            return;
        }
        Transaction.wrap(function () {
            tikTokSettings.custom.catalogOverview = JSON.stringify(getCatalogOverview.result.data);
        });
    }
    renderSDK(tikTokSettings, JSON.parse(tikTokSettings.custom.externalData), true, null);
}

/**
 * Endpoints
 */
module.exports.Start = start;
module.exports.Start.public = true;
module.exports.AcceptTerms = acceptTerms;
module.exports.AcceptTerms.public = true;
module.exports.Callback = callback;
module.exports.Callback.public = true;
module.exports.Disconnect = disconnect;
module.exports.Disconnect.public = true;
module.exports.Manage = manage;
module.exports.Manage.public = true;
module.exports.ManageCredentials = manageCredentials;
module.exports.ManageCredentials.public = true;
