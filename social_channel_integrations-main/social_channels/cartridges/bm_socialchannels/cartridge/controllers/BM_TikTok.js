'use strict';

/**
 * All the nodes for TikTok BM extension
 * @module controllers/BM_TikTok
 */

var Encoding = require('dw/crypto/Encoding');
var ISML = require('dw/template/ISML');
var Logger = require('dw/system/Logger').getLogger('bm_socialchannels', 'BM_TikTok');
var Mac = require('dw/crypto/Mac');
var Resource = require('dw/web/Resource');
var Site = require('dw/system/Site');
var StringUtils = require('dw/util/StringUtils');
var Transaction = require('dw/system/Transaction');
var URLAction = require('dw/web/URLAction');
var URLUtils = require('dw/web/URLUtils');
var constants = require('int_tiktok/cartridge/scripts/TikTokConstants');
var customObjectHelper = require('int_tiktok/cartridge/scripts/customObjectHelper');
var tiktokService = require('int_tiktok/cartridge/scripts/services/tiktokService');
var validationHelper = require('*/cartridge/scripts/utils/validationHelper');

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
 * determines if TikTik Shop onboarding has completed
 * @param {dw.object.CustomObject} tikTokSettings - TikTok settings
 * @param {boolean} callService if true, call TikTok API instead of using custom object value
 * @returns {boolean} true is TTS is connected
 */
function isTikTokShopConnected(tikTokSettings, callService) {
    if (!tikTokSettings) return false;
    if (callService) {
        return isShopConnected(tikTokSettings.custom.externalData_base64);
    }
    return !!tikTokSettings.custom.tikTokShopConnected;
}

/**
 * determines if TikTik Marketing onboarding has completed
 * @param {dw.object.CustomObject} tikTokSettings - TikTok settings
 * @returns {boolean} true is TT Marketing/Ads is connected
 */
function isTikTokMarketingConnected(tikTokSettings) {
    if (!tikTokSettings) return false;
    var hasAccessToken = !!tikTokSettings.custom.accessToken;
    var hasPixelCode = !!tikTokSettings.custom.pixelCode;
    return hasAccessToken && hasPixelCode;
}

/**
 * Landing page for TikTok
 */
function start() {
    var tikTokSettings = customObjectHelper.getCustomObject();

    var addFeature = !!request.httpParameterMap.feature.booleanValue;
    var showSDK = request.httpParameterMap.showsdk.booleanValue;

    if (!addFeature) {
        // If the customer already authenticated, we know the pixelCode, we can directly render the 'Manage' page  additional if they already completed the onboarding for TikTok Shop
        if (isTikTokMarketingConnected(tikTokSettings) || isTikTokShopConnected(tikTokSettings, false)) {
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
    }

    // get prior generated tenant ID
    var tenantId = tikTokSettings.custom.externalBusinessId;
    if (!tenantId) {
        tenantId = require('dw/util/UUIDUtils').createUUID();
    }

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
            addFeature: addFeature,
            error: request.httpParameterMap.error.stringValue,
            success: request.httpParameterMap.success.stringValue
        });
        return;
    }

    launch(); // eslint-disable-line no-use-before-define
}

/**
 * Extracts the base URL from a URL
 * @param {string} url - URL
 * @returns {string|null} base URL
 */
function extractBaseUrl(url) {
    if (!url) return null;
    var index = url.indexOf('/', url.indexOf('://') + 3);
    if (index > -1) {
        return url.substring(0, index);
    }
    return url;
}

/**
 * Returns the URL to the create order page
 * @param {string} action - the controller action  ('Home-Show', 'OrderCreate-Social')
 * @param {boolean} shouldExtractBaseUrl - if true, extracts the base URL from the URL
 * @returns {string|Object} create order URL or error object
 */
function getStorefrontUrl(action, shouldExtractBaseUrl) {
    var currentSite = Site.getCurrent();
    var siteId = currentSite.getID();
    var locale = currentSite.getDefaultLocale();

    // make a web service call to the site to get the URL to ensure aliases are correctly set
    var storefrontUrl = validationHelper.getStorefrontUrl(action, siteId, locale);

    if (!storefrontUrl) {
        storefrontUrl = URLUtils.https(new URLAction(action, siteId, locale)).toString();
    }

    if (shouldExtractBaseUrl) {
        return extractBaseUrl(storefrontUrl);
    }

    return storefrontUrl;
}

/**
 * extract domain from website URL
 * @param {string} url - the website URL
 * @returns {string} - the domain name
 */
function getDomain(url) {
    if (!url) return '';
    var matches = url.match(/^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:/\n?=]+)/im);
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
        create_order_url: getStorefrontUrl('OrderCreate-Social', false),
        website_url: getStorefrontUrl('Home-Show', true)
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
 * @param {Object} credentials - object created from getCredentialsObjectFromFormData function
 * @returns {boolean} true/false
 */
function verifyCredentials(template, credentials) {
    var Status = require('dw/system/Status');
    var form = session.forms.tiktok;
    if (!template) {
        template = 'tiktok/start'; // eslint-disable-line no-param-reassign
    }

    var currentSite = Site.getCurrent();
    var siteId = currentSite.getID();
    var verifyWebdav = !!currentSite.getCustomPreferenceValue('tiktokVerifyWebDav');
    var verifyBM = !!currentSite.getCustomPreferenceValue('tiktokVerifyBM');
    var addFeature = !!request.httpParameterMap.feature.booleanValue;

    var acctMngrClientId = form.amclientid.value;
    var acctMngrClientSecret = form.amclientsecret.value;
    var bizMngrUser = form.bmuser.value;
    var bizMngrAccessKey = form.bmaccesskey.value;
    var webDavClientId = form.shopperclientid.value;
    var webDavClientSecret = form.shopperclientsecret.value;

    var templateArgs = {
        error: null,
        acceptTerms: true,
        breadcrumbs: breadcrumbs,
        addFeature: addFeature
    };

    // validate WebDAV credentials for OCAPI
    if (verifyWebdav) {
        if (!webDavClientId || !webDavClientSecret) {
            Logger.warn('WebDAV credentials were not fully provided');
            templateArgs.error = 'invalid.webDavCredentials';
            ISML.renderTemplate(template, templateArgs);
            return false;
        }
        var clientCredentialsAccessToken = validationHelper.validateAMCredentials(webDavClientId, webDavClientSecret);
        if (!clientCredentialsAccessToken) {
            Logger.warn('Invalid WebDAV credentials');
            templateArgs.error = 'invalid.webDavCredentials';
            ISML.renderTemplate(template, templateArgs);
            return false;
        }

        Logger.info('WebDAV credentials validated successfully');
    }

    // validate BM access credentials
    if (verifyBM) {
        if (!acctMngrClientId || !acctMngrClientSecret || !bizMngrUser || !bizMngrAccessKey) {
            Logger.warn('Biz Mngr credentials were not fully provided');
            templateArgs.error = 'account.manager';
            ISML.renderTemplate(template, templateArgs);
            return false;
        }

        var bmUserGrantAccessToken = validationHelper.validateBizMngrUserGrant(bizMngrUser, bizMngrAccessKey, acctMngrClientId, acctMngrClientSecret);
        if (!bmUserGrantAccessToken) {
            // invalid Biz Mngr credentials
            Logger.warn('Invalid BM credentials');
            templateArgs.error = 'account.manager';
            ISML.renderTemplate(template, templateArgs);
            return false;
        }

        Logger.info('BM credentials validated successfully');

        // use the biz mngr user grant access token to make a request to the create order endpoint
        var createOrderUrlResult = validationHelper.validateCreateOrderUrl(credentials.create_order_url, bmUserGrantAccessToken);
        if (createOrderUrlResult && createOrderUrlResult.status === Status.ERROR) {
            Logger.warn('Could not make successful POST to: {0}', credentials.create_order_url);
            templateArgs.error = Resource.msgf('tiktok.error.post.request', 'tiktok', null, credentials.create_order_url, (createOrderUrlResult.msg || ''));
            ISML.renderTemplate(template, templateArgs);
            return false;
        }

        // use the biz mngr user grant access token to make a request to the OCAPI shop endpoint
        var ocapiShopPath = ['s', siteId, 'dw', 'shop', constants.OCAPI_VERSION].join('/');
        var ocapiEndpoint = [
            credentials.website_url,
            ocapiShopPath,
            'orders',
            'debug_order_no'
        ].join('/') + '?client_id=' + acctMngrClientId;
        var ocapiResult = validationHelper.validateOcapiEndpoint(ocapiEndpoint, bmUserGrantAccessToken);
        if (ocapiResult && ocapiResult.status === Status.ERROR) {
            Logger.warn('Could not make successful POST to: {0}', ocapiEndpoint);
            templateArgs.error = Resource.msgf('tiktok.error.post.request', 'tiktok', null, ocapiEndpoint, (ocapiResult.msg || ''));
            ISML.renderTemplate(template, templateArgs);
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
    var form = session.forms.tiktok;
    var credentials = getCredentialsObjectFromFormData(form);
    var template = 'tiktok/manageCredentials';
    var addFeature = !!request.httpParameterMap.feature.booleanValue;

    var templateArgs = {
        error: 'svc.credentials',
        acceptTerms: true,
        breadcrumbs: breadcrumbs,
        addFeature: addFeature
    };
    var tikTokSettings = customObjectHelper.getCustomObject();
    var externalData = customObjectHelper.getExternalData(tikTokSettings);

    // exit early if no external data is present
    if (!externalData || !Object.keys(externalData).length) {
        Logger.warn('updateCredentials - external data was not found');
        ISML.renderTemplate(template, templateArgs);
        return false;
    }

    // validate credentials
    if (!verifyCredentials(template, credentials)) {
        // render template is not needed here, will be rendered in verifyCredentials function
        return false;
    }

    // update external data object with form data
    externalData.extra.organization_id = credentials.organization_id;
    externalData.extra.sfcc_api_client_id = credentials.sfcc_api_client_id;
    externalData.extra.sfcc_bm_user = credentials.sfcc_bm_user;
    externalData.extra.shopper_api_client_id = credentials.shopper_api_client_id;
    externalData.extra.create_order_url = credentials.create_order_url;
    externalData.website_url = credentials.website_url;
    externalData.domain = getDomain(credentials.website_url);

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
    var svcResult = pushCredentials(tikTokSettings.custom.appId, tikTokSettings.custom.externalBusinessId, credentials, base64);
    if (!svcResult) {
        Logger.warn('updateCredentials - service call to TikTok failed');
        ISML.renderTemplate(template, templateArgs);
        return false;
    }
    return true;
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
    var tenantId = tikTokSettings.custom.externalBusinessId || null;
    if (!tenantId || (!isTikTokMarketingConnected(tikTokSettings) && !isTikTokShopConnected(tikTokSettings))) {
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
    var addFeature = !!request.httpParameterMap.feature.booleanValue;

    // only push/send credentials first time when connecting
    if (!isConnected) {
        var verifyWebdav = !!site.getCustomPreferenceValue('tiktokVerifyWebDav');
        var verifyBM = !!site.getCustomPreferenceValue('tiktokVerifyBM');
        if ((verifyWebdav || verifyBM) && !pushCredentials(tikTokSettings.custom.appId, tikTokSettings.custom.externalBusinessId, credentials, base64)) {
            ISML.renderTemplate('tiktok/start', {
                error: 'svc.credentials',
                acceptTerms: tikTokSettings.custom.acceptTerms,
                breadcrumbs: breadcrumbs,
                addFeature: addFeature
            });
            return;
        }
    }

    var approved = '';
    var processing = '';
    var rejected = '';
    if (!empty(tikTokSettings.custom.catalogOverview)) {
        var catalogOverview = JSON.parse(tikTokSettings.custom.catalogOverview);
        if (!empty(catalogOverview) && catalogOverview !== 'undefined') {
            approved = catalogOverview.approved;
            processing = catalogOverview.processing;
            rejected = catalogOverview.rejected;
        }
    }

    ISML.renderTemplate('tiktok/tiktoksdk', {
        isConnected: isConnected,
        base64: base64,
        pluginJS: site.getCustomPreferenceValue('tiktokPluginJS') || constants.PLUGIN_JS,
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
    var form = session.forms.tiktok;
    var credentials = getCredentialsObjectFromFormData(form);

    if (!verifyCredentials('tiktok/start', credentials)) {
        return;
    }

    var site = Site.getCurrent();
    var tikTokSettings = customObjectHelper.getCustomObject();
    var redirectUri = URLUtils.https('BM_TikTok-Callback').toString();
    var addFeature = !!request.httpParameterMap.feature.booleanValue;

    // Create the application and save the app details within the form so that it gets saved in the custom object afterward
    var createAppResponse = tiktokService.createApplication(form.tenantid.value, redirectUri);
    if (createAppResponse.error) {
        // try second time, it seems 90% of the time the first call fails
        createAppResponse = tiktokService.createApplication(form.tenantid.value, redirectUri);
        if (createAppResponse.error) {
            ISML.renderTemplate('tiktok/start', {
                error: createAppResponse.errorCode,
                acceptTerms: tikTokSettings.custom.acceptTerms,
                breadcrumbs: breadcrumbs,
                addFeature: addFeature
            });
            return;
        }
    }

    form.tiktokappid.value = createAppResponse.result.data.app_id;
    form.tiktokappsecret.value = createAppResponse.result.data.app_secret;
    form.tiktokexternaldatakey.value = createAppResponse.result.data.external_data_key;

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
            create_order_url: credentials.create_order_url
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
 * get service response data
 * @param {Object} svcResponse service response
 * @param {string} attribute the service attribute to return
 * @returns {string|null} service data or null
 */
function getServiceResultData(svcResponse, attribute) {
    if (!svcResponse) return null;
    return Object.hasOwnProperty.call(svcResponse, 'result')
        && Object.hasOwnProperty.call(svcResponse.result, 'data')
        && Object.hasOwnProperty.call(svcResponse.result.data, attribute)
        ? svcResponse.result.data[attribute] : null;
}

/**
 * Callback URL for tiktok.
 */
function callback() {
    var controllerName = 'BM_TikTok-Callback';
    var redirectUrl = URLUtils.https('BM_TikTok-Start');
    var tikTokSettings = customObjectHelper.getCustomObject();
    if (!tikTokSettings || empty(tikTokSettings.custom.acceptTerms)) {
        response.redirect(redirectUrl.toString());
        return;
    }

    var isTTSActive = isTikTokShopConnected(tikTokSettings, false);
    var isTTMActive = isTikTokMarketingConnected(tikTokSettings);
    var accessToken = tikTokSettings.custom.accessToken || null;
    var pixelCode = null;
    var bcId = null;
    var advertiserId = null;
    var catalogId = null;
    var enableAdvancedMatchingPhone = null;
    var enableAdvancedMatchingEmail = null;

    // check if TikTok shop onboarding completed
    if (isShopConnected(tikTokSettings.custom.externalData_base64)) {
        Transaction.wrap(function () {
            tikTokSettings.custom.tikTokShopConnected = true;
            isTTSActive = true;
        });
    }

    // Authenticating against the TikTok Marketing API
    var authCode = request.httpParameterMap.auth_code.value;
    if (!authCode) {
        Logger.warn('{0}: no authCode provided; TikTok Shop = {1}; TT Marketing = {2}', controllerName, isTTSActive, isTTMActive);
    }

    if (authCode) {
        var accessTokenResponse = tiktokService.getAuthToken(tikTokSettings, authCode);
        if (accessTokenResponse.error) {
            Logger.warn('{0}: error getting access token from auth code {1}; TikTok Shop = {2}; TT Marketing = {3}', controllerName, authCode, isTTSActive, isTTMActive);
            if (!isTTSActive && !isTTMActive) {
                customObjectHelper.clearValues(tikTokSettings);
            }
            redirectUrl.append('error', accessTokenResponse.errorCode);
            response.redirect(redirectUrl.toString());
            return;
        }
        accessToken = getServiceResultData(accessTokenResponse, 'access_token');
    }

    if (!accessToken) {
        Logger.warn('{0}: no access token present, exiting callback function! auth code {1}; TikTok Shop = {2}; TT Marketing = {3}', controllerName, authCode, isTTSActive, isTTMActive);
        redirectUrl.append('error', 'oauth.call');
        response.redirect(redirectUrl.toString());
        return;
    }

    Transaction.wrap(function () {
        tikTokSettings.custom.accessToken = accessToken;
    });

    // Get the Business Profile of the customer
    var getProfileResponse = tiktokService.getBusinessProfile(tikTokSettings);
    if (getProfileResponse.error) {
        Logger.warn('{0}: error calling getBusinessProfile; TikTok Shop = {1}; TT Marketing = {2}', controllerName, isTTSActive, isTTMActive);
        if (!isTTSActive && !isTTMActive) {
            customObjectHelper.clearValues(tikTokSettings);
        }
        redirectUrl.append('error', getProfileResponse.errorCode);
        response.redirect(redirectUrl.toString());
        return;
    }

    pixelCode = getServiceResultData(getProfileResponse, 'pixel_code');
    bcId = getServiceResultData(getProfileResponse, 'bc_id');
    advertiserId = getServiceResultData(getProfileResponse, 'adv_id');
    catalogId = getServiceResultData(getProfileResponse, 'catalog_id');

    Transaction.wrap(function () {
        if (pixelCode) tikTokSettings.custom.pixelCode = pixelCode;
        if (bcId) tikTokSettings.custom.bcId = bcId;
        if (advertiserId) tikTokSettings.custom.advertiserId = advertiserId;
        if (catalogId) tikTokSettings.custom.catalogId = catalogId;
    });

    if (advertiserId && pixelCode) {
        var getPixelResponse = tiktokService.getPixelDetails(tikTokSettings);
        if (getPixelResponse.error) {
            Logger.warn('{0}: error calling getPixelDetails; TikTok Shop = {1}; TT Marketing = {2}', controllerName, isTTSActive, isTTMActive);
            if (!isTTSActive && !isTTMActive) {
                customObjectHelper.clearValues(tikTokSettings);
            }
            redirectUrl.append('error', getPixelResponse.errorCode);
            response.redirect(redirectUrl.toString());
            return;
        }
        if (Object.hasOwnProperty.call(getPixelResponse, 'result')
            && Object.hasOwnProperty.call(getPixelResponse.result, 'data')
            && Object.hasOwnProperty.call(getPixelResponse.result.data, 'pixels')
            && getPixelResponse.result.data.pixels.length) {
            var pixel = getPixelResponse.result.data.pixels[0];
            if (Object.hasOwnProperty.call(pixel, 'advanced_matching_fields')) {
                enableAdvancedMatchingPhone = Object.hasOwnProperty.call(pixel.advanced_matching_fields, 'phone_number') ? pixel.advanced_matching_fields.phone_number : null;
                enableAdvancedMatchingEmail = Object.hasOwnProperty.call(pixel.advanced_matching_fields, 'phone_number') ? pixel.advanced_matching_fields.email : null;
            }
        }

        Transaction.wrap(function () {
            if (enableAdvancedMatchingPhone) tikTokSettings.custom.enableAdvancedMatchingPhone = enableAdvancedMatchingPhone;
            if (enableAdvancedMatchingEmail) tikTokSettings.custom.enableAdvancedMatchingPhone = enableAdvancedMatchingEmail;
        });
    }

    // Get the catalog overview
    if (bcId && catalogId) {
        var getCatalogOverview = tiktokService.getCatalogOverview(tikTokSettings);
        if (getCatalogOverview.error) {
            Logger.warn('{0}: error calling getCatalogOverview; TikTok Shop = {1}; TT Marketing = {2}', controllerName, isTTSActive, isTTMActive);
            if (!isTTSActive && !isTTMActive) {
                customObjectHelper.clearValues(tikTokSettings);
            }
            redirectUrl.append('error', getCatalogOverview.errorCode);
            response.redirect(redirectUrl.toString());
            return;
        }
        if (Object.hasOwnProperty.call(getCatalogOverview, 'result') && Object.hasOwnProperty.call(getCatalogOverview.result, 'data')) {
            Transaction.wrap(function () {
                tikTokSettings.custom.catalogOverview = JSON.stringify(getCatalogOverview.result.data);
            });
        }
    }

    // added redirect because reload window.opener.location.href not working for some browsers
    redirectUrl.append('success', 'setup');
    response.redirect(redirectUrl.toString());
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
    var addFeature = !!request.httpParameterMap.feature.booleanValue;

    if (isTikTokMarketingConnected(tikTokSettings)) {
        // Refresh the catalog overview
        var getCatalogOverview = tiktokService.getCatalogOverview(tikTokSettings);
        if (getCatalogOverview.error) {
            customObjectHelper.clearValues(tikTokSettings);
            ISML.renderTemplate('tiktok/start', {
                error: getCatalogOverview.errorCode,
                acceptTerms: tikTokSettings.custom.acceptTerms,
                breadcrumbs: breadcrumbs,
                addFeature: addFeature
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
