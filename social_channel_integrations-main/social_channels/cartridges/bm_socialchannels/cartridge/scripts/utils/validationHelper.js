/**
 * Validation Helper for social commerce forms.
 * These functions use HTTP Client instead of the service framework
 * to reduce the installation steps
 */

'use strict';

var File = require('dw/io/File');
var HTTPClient = require('dw/net/HTTPClient');
var Logger = require('dw/system/Logger').getLogger('bm_socialchannels', 'validationHelper');
var Site = require('dw/system/Site');
var Status = require('dw/system/Status');
var StringUtils = require('dw/util/StringUtils');
var System = require('dw/system/System');
var URLAction = require('dw/web/URLAction');
var URLUtils = require('dw/web/URLUtils');

var TIMEOUT = 8000; // 8 seconds
var RETRY_LIMIT = 3;
var WEBDAV_PATH = '/on/demandware.servlet/webdav/Sites/';

/**
 * @description Filters out sensitive data from the log
 * @param {string} data - The data to be filtered
 * @returns {string} - The filtered data
 */
function filterLogData(data) {
    var serviceHelpers = require('*/cartridge/scripts/social/helpers/serviceHelpers');
    try {
        var logObj = JSON.parse(data);
        var result = serviceHelpers.iterate(logObj);
        return result ? JSON.stringify(result) : data;
    } catch (ex) {
        return data;
    }
}

/**
 * Logs the service response.
 * @param {Object} args - arguments
 * @param {dw.net.HTTPClient} args.httpClient http client
 * @param {string} args.endpoint service endpoint
 * @param {string} requestData request data (optional)
 */
function logServiceResponse({ httpClient, endpoint, requestData }) {
    var logMessage = '\n' + StringUtils.format('endpoint {0}', endpoint);
    if (requestData) {
        logMessage += '\n' + StringUtils.format('requestData {0}', filterLogData(requestData));
    }
    if (httpClient) {
        logMessage += '\n' + StringUtils.format('statusCode {0}', httpClient.statusCode);
        if (httpClient.text) {
            logMessage += '\n' + StringUtils.format('httpClient.text {0}', filterLogData(httpClient.text));
        }
        if (httpClient.errorText) {
            logMessage += '\n' + StringUtils.format('httpClient.text {0}', filterLogData(httpClient.errorText));
        }
    }
    Logger.info(logMessage);
}

/**
 * Validates org id format to be aligned with standard - f_ecom_zzcu_001
 * @param {string} orgId organization ID
 * @returns {boolean} validation pass(true) or fail
 */
function validateOrgId(orgId) {
    var regex = /^f_ecom_[a-zA-Z0-9]{4}_(stg|dev|s\d{2}|\d{1,3}|prd)$/;
    if (regex.test(orgId)) {
        return true;
    }
    return false;
}

/**
 * Validates short code format
 @param {string} shortCode - SCAPI short code
 * @returns {boolean} validation pass(true) or fail
 */
function validateShortCode(shortCode) {
    var regex = /^[a-zA-Z0-9]{8}$/;
    if (regex.test(shortCode)) {
        return true;
    }
    return false;
}

/**
 * Validates Account Manager credentials by trying to get an access token
 * @param {string} clientId - account manager client ID
 * @param {string} secret - account manager client secret
 * @returns {string|null} access token or null
 */
function validateAMCredentials(clientId, secret) {
    if (!clientId || !secret) {
        Logger.debug('validateAMCredentials: missing param: clientId {0}; secret {1}', clientId, secret);
        return null;
    }

    var httpClient = new HTTPClient();
    var retryCount = 0;

    while (retryCount < RETRY_LIMIT) {
        try {
            var endpoint = 'https://account.demandware.com/dwsso/oauth2/access_token?grant_type=client_credentials';
            httpClient.open('POST', endpoint);
            httpClient.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
            httpClient.setRequestHeader('Authorization', 'Basic ' + StringUtils.encodeBase64(clientId + ':' + secret));
            httpClient.setTimeout(TIMEOUT);

            // Send request
            httpClient.send();

            // Log request
            logServiceResponse({
                httpClient: httpClient,
                endpoint: endpoint
            });

            // Handle response and validate existence of access_token
            if (httpClient.statusCode === 200) {
                var svcResponse = JSON.parse(httpClient.text);
                if (svcResponse && svcResponse.access_token) {
                    return svcResponse.access_token;
                }
            }
            retryCount++;
        } catch (ex) {
            Logger.error(ex.toString() + ' in ' + ex.fileName + ':' + ex.lineNumber);
            retryCount++;
        }
    }

    return null;
}

/**
 * Validates business manager user grant credentials by trying to get an access token
 * @param {string} bizMngrUser - business manager user
 * @param {string} bizMngrOcapiAccessKey - business manager OCAPI access key
 * @param {string} clientId - account manager client ID
 * @param {string} clientSecret - account manager client secret
 * @returns {string|null} access token or null
 */
function validateBizMngrUserGrant(bizMngrUser, bizMngrOcapiAccessKey, clientId, clientSecret) {
    if (!bizMngrUser || !bizMngrOcapiAccessKey || !clientId || !clientSecret) {
        Logger.debug('validateBizMngrUserGrant: missing param: bizMngrUser {0}; bizMngrOcapiAccessKey {1}; clientId {2}; clientSecret {2}', bizMngrUser, bizMngrOcapiAccessKey, clientId, clientSecret);
        return null;
    }

    var httpClient = new HTTPClient();
    var retryCount = 0;

    while (retryCount < RETRY_LIMIT) {
        try {
            var endpoint = 'https://' + System.getInstanceHostname() + '/dw/oauth2/access_token';
            httpClient.open('POST', endpoint);
            httpClient.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
            httpClient.setRequestHeader('Authorization', 'Basic ' + StringUtils.encodeBase64(bizMngrUser + ':' + bizMngrOcapiAccessKey + ':' + clientSecret));
            httpClient.setTimeout(TIMEOUT);

            var formData = [];
            var requestData = {
                grant_type: 'urn:demandware:params:oauth:grant-type:client-id:dwsid:dwsecuretoken',
                client_id: clientId
            };
            Object.keys(requestData).forEach(function (key) { // eslint-disable-line no-loop-func
                if (Object.hasOwnProperty.call(requestData, key)) {
                    formData.push(key + '=' + requestData[key]);
                }
            });

            // Send request
            httpClient.send(formData.join('&'));

            // Log request
            logServiceResponse({
                httpClient: httpClient,
                endpoint: endpoint,
                requestData: JSON.stringify(requestData)
            });

            // Handle response and validate existence of access_token
            if (httpClient.statusCode === 200) {
                var svcResponse = JSON.parse(httpClient.text);
                if (svcResponse && svcResponse.access_token) {
                    return svcResponse.access_token;
                }
            }
            retryCount++;
        } catch (ex) {
            Logger.error(ex.toString() + ' in ' + ex.fileName + ':' + ex.lineNumber);
            retryCount++;
        }
    }

    return null;
}

/**
 * Validates SLAS credentials by trying to get an access token
 * @param {string} clientId - account manager client ID
 * @param {string} secret - account manager client secret
 * @param {string} siteId - site ID
 * @param {string} shortCode - SCAPI short code
 * @param {string} orgId - SCAPI org ID
 * @returns {Object} validation pass(true) or fail
 */
function validatePrivateTSOBClient(clientId, secret, siteId, shortCode, orgId) {
    var error = 'invalid.scapiCredentials';
    if (!clientId || !secret || !shortCode || !orgId) {
        Logger.debug('validatePrivateTSOBClient: missing param: clientId {0}; secret {1}; shortCode {2}; orgId {2}', clientId, secret, shortCode, orgId);
        return { error: error };
    }

    // validate shortCode and orgId
    if (!validateOrgId(orgId)) {
        Logger.debug('validatePrivateTSOBClient: orgId is invalid: {0}', orgId);
        return { error: 'invalid.orgId' };
    }
    if (!validateShortCode(shortCode)) {
        Logger.debug('validatePrivateTSOBClient: shortCode is invalid: {0}', shortCode);
        return { error: 'invalid.shortCode' };
    }

    var httpClient = new HTTPClient();
    var retryCount = 0;

    while (retryCount < RETRY_LIMIT) {
        try {
            var endpoint = 'https://' + shortCode + '.api.commercecloud.salesforce.com/shopper/auth/v1/organizations/' + orgId + '/oauth2/trusted-system/token';
            httpClient.open('POST', endpoint);
            httpClient.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
            httpClient.setRequestHeader('Authorization', 'Basic ' + StringUtils.encodeBase64(clientId + ':' + secret));
            httpClient.setTimeout(TIMEOUT);

            var formData = [];
            var requestData = {
                grant_type: 'client_credentials',
                hint: 'ts_ext_on_behalf_of',
                login_id: 'guest',
                idp_origin: 'ecom',
                channel_id: siteId
            };
            Object.keys(requestData).forEach(function (key) { // eslint-disable-line no-loop-func
                if (Object.hasOwnProperty.call(requestData, key)) {
                    formData.push(key + '=' + requestData[key]);
                }
            });

            // Send request
            httpClient.send(formData.join('&'));

            // Log request
            logServiceResponse({
                httpClient: httpClient,
                endpoint: endpoint,
                requestData: JSON.stringify(requestData)
            });

            // Handle response and validate existence of access_token
            if (httpClient.statusCode === 200) {
                var response = JSON.parse(httpClient.text);
                if (response && response.access_token) {
                    return { error: false };
                }
            }
            retryCount++;
            if (httpClient.errorText) {
                var svcErrorMessage = JSON.parse(httpClient.errorText);
                if (svcErrorMessage && svcErrorMessage.message) {
                    return { error: require('dw/web/Resource').msgf('snapchat.error.' + error + '.svcError', 'snapchat', null, svcErrorMessage.message) };
                }
            }
        } catch (e) {
            Logger.error(e.toString() + ' in ' + e.fileName + ':' + e.lineNumber);
            retryCount++;
        }
    }
    return { error: error };
}

/**
 * Validates WebDAV access key credentials by BASIC auth
 * @param {string} username - webdav username
 * @param {string} accessKey - webdav password/access key
 * @param {string} webDavPath - webdav path (IMPEX/src/feeds/export)
 * @returns {boolean} validation pass(true) or fail
 */
function validateWebDAVHttpCredentials(username, accessKey, webDavPath) {
    if (!username || !accessKey) {
        return false;
    }

    var httpClient = new HTTPClient();
    var dirPath = webDavPath || File.IMPEX;
    var endpoint = StringUtils.format(
        '{0}://{1}{2}',
        'https',
        System.getInstanceHostname(),
        WEBDAV_PATH + dirPath
    );

    // make sure the directory exists
    var dir = new File(dirPath);
    if (!dir.exists() && !dir.mkdirs()) {
        Logger.error('Directory could not be created {0}', dirPath);
        return false;
    }

    var retryCount = 0;
    while (retryCount < RETRY_LIMIT) {
        try {
            httpClient.open('GET', endpoint);
            httpClient.setRequestHeader('Authorization', 'Basic ' + StringUtils.encodeBase64(username + ':' + accessKey));
            httpClient.setTimeout(TIMEOUT);

            // Send request
            httpClient.send();

            // Log request
            logServiceResponse({
                httpClient: httpClient,
                endpoint: endpoint
            });

            // Handle response
            if (httpClient.statusCode === 200) {
                return true;
            }
            retryCount++;
        } catch (e) {
            Logger.error(e.toString() + ' in ' + e.fileName + ':' + e.lineNumber);
            retryCount++;
        }
    }
    return false;
}

/**
 * build create order URL by making a request to the storefront
 * @param {string} action - the controller action
 * @param {string} siteId - the site id
 * @param {string} locale - the locale
 * @returns {string|null} create order URL or error object
 */
function getStorefrontUrl(action, siteId, locale) {
    var currentSite = Site.getCurrent();
    action = action || 'Home-Show'; // eslint-disable-line no-param-reassign
    siteId = siteId || currentSite.getID(); // eslint-disable-line no-param-reassign
    locale = locale || currentSite.getDefaultLocale(); // eslint-disable-line no-param-reassign
    var endpoint = URLUtils.https(new URLAction('SocialHelpers-GetStorefrontUrl', siteId, locale)).append('action', action).toString();

    var httpClient = new HTTPClient();
    var retryCount = 0;
    var headers;
    var redirectLocation;

    while (retryCount < RETRY_LIMIT) {
        try {
            httpClient.open('POST', endpoint);
            httpClient.setTimeout(TIMEOUT);

            // Send request
            httpClient.send();

            // Log request
            logServiceResponse({
                httpClient: httpClient,
                endpoint: endpoint
            });

            // Handle response
            if (httpClient.statusCode === 200) {
                var svcResponse = JSON.parse(httpClient.text);
                if (svcResponse && svcResponse.storefrontUrl) {
                    return svcResponse.storefrontUrl;
                }
                retryCount++;
            } else if (httpClient.statusCode === 301) {
                // check headers for redirect location
                headers = httpClient.responseHeaders;
                redirectLocation = headers.get('location');
                if (redirectLocation && redirectLocation.length && redirectLocation[0]) {
                    endpoint = redirectLocation[0];
                } else {
                    retryCount++;
                }
            } else {
                retryCount++;
            }
        } catch (ex) {
            Logger.error(ex.toString() + ' in ' + ex.fileName + ':' + ex.lineNumber);
            retryCount++;
        }
    }

    return null;
}

/**
 * Validate create order URL by making a request to the storefront
 * @param {string} endpoint create order URL
 * @param {string} accessToken access token
 * @returns {Object} result object
 */
function validateCreateOrderUrl(endpoint, accessToken) {
    var OrderUtilCode = require('int_social_checkout/cartridge/scripts/util/OrderUtilCode');
    var httpClient = new HTTPClient();
    var retryCount = 0;
    var result = { status: Status.ERROR, code: '', msg: '' };
    var exitInErrorCodes = [301, 302, 401, 403];

    while (retryCount < RETRY_LIMIT) {
        try {
            httpClient.open('POST', endpoint);
            httpClient.setRequestHeader('Authorization', 'Bearer ' + accessToken);
            httpClient.setTimeout(TIMEOUT);

            // Send request
            var requestData = JSON.stringify({ debug: true });
            httpClient.send(requestData);

            // Log request
            logServiceResponse({
                httpClient: httpClient,
                endpoint: endpoint,
                requestData: requestData
            });

            // Handle response
            if (httpClient.statusCode === 200) {
                var svcResponse = JSON.parse(httpClient.text);
                if (svcResponse && svcResponse.msg === OrderUtilCode.RESPONSE_CODE.DEBUG_SUCCESS.msg) {
                    return svcResponse;
                }
                retryCount++;
            } else {
                retryCount++;
                result.code = httpClient.statusCode;
                result.msg = result.code + ': ' + (httpClient.errorText || httpClient.text || httpClient.statusMessage);
                // if we have a redirect or auth error, exit in error, no need to keep trying
                if (exitInErrorCodes.indexOf(httpClient.statusCode) > -1) {
                    return result;
                }
            }
        } catch (ex) {
            retryCount++;
            Logger.error(ex.toString() + ' in ' + ex.fileName + ':' + ex.lineNumber);
            result.code = 'EXCEPTION';
            result.msg = ex.toString();
        }
    }

    return result;
}

/**
 * Validate OCAPI endpoint by making a request
 * @param {string} endpoint OCAPI endpoint
 * @param {string} accessToken access token
 * @returns {Object} result object
 */
function validateOcapiEndpoint(endpoint, accessToken) {
    var httpClient = new HTTPClient();
    var retryCount = 0;
    var result = { status: Status.ERROR, code: '', msg: '' };
    var exitInErrorCodes = [301, 302, 401, 403];
    var svcResponse;

    while (retryCount < RETRY_LIMIT) {
        try {
            httpClient.open('GET', endpoint);
            httpClient.setRequestHeader('Authorization', 'Bearer ' + accessToken);
            httpClient.setTimeout(TIMEOUT);

            // Send request
            httpClient.send();

            // Log request
            logServiceResponse({
                httpClient: httpClient,
                endpoint: endpoint
            });

            // Handle response
            if (httpClient.statusCode === 200) {
                result.status = Status.OK;
                return result;
            }
            if (httpClient.statusCode === 404) {
                svcResponse = JSON.parse(httpClient.errorText);
                if (svcResponse && Object.hasOwnProperty.call(svcResponse, 'fault') && Object.hasOwnProperty.call(svcResponse.fault, 'type') && svcResponse.fault.type === 'OrderNotFoundException') {
                    result.status = Status.OK;
                    return result;
                }
                retryCount++;
            } else {
                retryCount++;
                result.code = httpClient.statusCode;
                result.msg = result.code + ': ' + (httpClient.errorText || httpClient.text || httpClient.statusMessage);
                // if we have a redirect or auth error, exit in error, no need to keep trying
                if (exitInErrorCodes.indexOf(httpClient.statusCode) > -1) {
                    return result;
                }
            }
        } catch (ex) {
            retryCount++;
            Logger.error(ex.toString() + ' in ' + ex.fileName + ':' + ex.lineNumber);
            result.code = 'EXCEPTION';
            result.msg = ex.toString();
        }
    }

    return result;
}

module.exports = {
    getStorefrontUrl: getStorefrontUrl,
    validateAMCredentials: validateAMCredentials,
    validateBizMngrUserGrant: validateBizMngrUserGrant,
    validateCreateOrderUrl: validateCreateOrderUrl,
    validateOcapiEndpoint: validateOcapiEndpoint,
    validateOrgId: validateOrgId,
    validatePrivateTSOBClient: validatePrivateTSOBClient,
    validateWebDAVHttpCredentials: validateWebDAVHttpCredentials
};
