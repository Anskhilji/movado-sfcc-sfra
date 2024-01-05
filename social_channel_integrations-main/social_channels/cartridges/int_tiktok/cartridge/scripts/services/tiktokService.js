'use strict';

// https://ads.tiktok.com/marketing_api/docs?id=1710953580908545
var Logger = require('dw/system/Logger').getLogger('TikTok', 'tiktokService');

var serviceHelper = require('./serviceHelper');
var constants = require('../TikTokConstants');

var CONTENT_TYPE = 'application/json';
var counter = 0;

/**
 * Parses the response and trigger the given {callback} in case of success or redirect ot the landing page in case of error
 * @param {Object} result The result of the response
 * @param {string} errorCode The error code from the response
 * @returns {boolean} True if the response was successful, false otherwise
 */
function parseResponse(result, errorCode) {
    if (!result.ok && result.error === '307') {
        return {
            error: false,
            result: '307 redirection'
        };
    }
    if (!result.ok) {
        Logger.error('Error occurred while {0}. Error Message: {1}', errorCode.replace('.', ' ', 'g'), result.errorMessage);
        return {
            error: true,
            errorCode: errorCode
        };
    }

    var resultText = JSON.parse(result.object.text);
    Logger.info(counter++ + ': result: ' + result.object.text + '\n');
    if (resultText.code === 0) {
        return {
            error: false,
            result: resultText
        };
    }
    Logger.error('Error occurred while {0}. Error Message: {1}', errorCode.replace('.', ' ', 'g'), resultText.message);
    return {
        error: true,
        errorCode: errorCode
    };
}

/**
 * Get the authorization token from the TikTok REST API
 *
 * @param {dw/object/CustomObject} tikTokSettings The TikTok settings custom object instance
 * @param {string} authCode The Auth code from the TikTok authentication flow
 * @returns {Object} an object containing the error if any happened
 */
function getAuthToken(tikTokSettings, authCode) {
    var service = serviceHelper.getService(constants.SERVICES.TIKTOK.BASE);
    var params = {
        method: 'POST',
        path: constants.ENDPOINTS.AUTH,
        headers: {
            'Content-Type': CONTENT_TYPE
        },
        body: {
            app_id: tikTokSettings.custom.appId,
            auth_code: authCode,
            secret: tikTokSettings.custom.appSecret
        }
    };
    var result = service.call(params);
    return parseResponse(result, 'oauth.call');
}

/**
 * Get the TikTok Business Profile
 * @param {dw/object/CustomObject} tikTokSettings The TikTok settings custom object instance
 * @returns {Object} an object containing the error if any happened
 */
function getBusinessProfile(tikTokSettings) {
    var service = serviceHelper.getService(constants.SERVICES.TIKTOK.BASE);
    var params = {
        method: 'GET',
        path: constants.ENDPOINTS.GET_BUSINESS_PROFILE,
        headers: {
            'Content-Type': CONTENT_TYPE,
            'Access-Token': tikTokSettings.custom.accessToken
        },
        params: {
            external_business_id: tikTokSettings.custom.externalBusinessId,
            business_platform: constants.BUSINESS_PLATFORM
        }
    };
    var result = service.call(params);
    return parseResponse(result, 'get.business.profile.call');
}

/**
 * Create TikTok application on behalf of the customer
 *
 * @param {dw/object/CustomObject} externalBusinessId The TikTok external Business ID
 * @param {string} redirectUrl The redirect URL that will be tied to the application
 * @returns {Object} an object containing the error if any happened
 */
function createApplication(externalBusinessId, redirectUrl) {
    var service = serviceHelper.getService(constants.SERVICES.TIKTOK.BASE);
    var params = {
        method: 'POST',
        path: constants.ENDPOINTS.CREATE_APPLICATION,
        headers: {
            'Content-Type': CONTENT_TYPE,
            'Access-Token': constants.STATIC_APP_ACCESS_TOKEN,
            Referer: service.getURL()
        },
        body: {
            business_platform: constants.BUSINESS_PLATFORM,
            smb_id: externalBusinessId,
            smb_name: externalBusinessId,
            redirect_url: redirectUrl
        }
    };
    var result = service.call(params);
    return parseResponse(result, 'create.application.call');
}

/**
 * Get the TikTok Pixel details
 *
 * @param {dw/object/CustomObject} tikTokSettings The TikTok settings custom object instance
 * @returns {Object} an object containing the error if any happened
 */
function getPixelDetails(tikTokSettings) {
    var service = serviceHelper.getService(constants.SERVICES.TIKTOK.BASE);
    var params = {
        method: 'GET',
        path: constants.ENDPOINTS.GET_PIXEL_LIST,
        headers: {
            'Content-Type': CONTENT_TYPE,
            'Access-Token': tikTokSettings.custom.accessToken
        },
        params: {
            advertiser_id: tikTokSettings.custom.advertiserId,
            code: tikTokSettings.custom.pixelCode
        }
    };
    var result = service.call(params);
    return parseResponse(result, 'get.pixel.detail.call');
}

/**
 * Get the TikTok Catalog Overview
 * @param {dw/object/CustomObject} tikTokSettings The TikTok settings custom object instance
 * @returns {Object} an object containing the error if any happened
 */
function getCatalogOverview(tikTokSettings) {
    var service = serviceHelper.getService(constants.SERVICES.TIKTOK.BUSINESS_API);
    var params = {
        method: 'GET',
        path: constants.ENDPOINTS.GET_CATALOG_OVERVIEW,
        headers: {
            'Content-Type': CONTENT_TYPE,
            'Access-Token': tikTokSettings.custom.accessToken
        },
        params: {
            bc_id: tikTokSettings.custom.bcId,
            catalog_id: tikTokSettings.custom.catalogId
        }
    };
    var result = service.call(params);
    return parseResponse(result, 'get.catalog.overview.call');
}

/**
 * Disconnect from TikTok
 * @param {dw/object/CustomObject} tikTokSettings The TikTok settings custom object instance
 * @returns {boolean} True if the disconnect process succeed, false otherwise
 */
function disconnectFromTikTok(tikTokSettings) {
    var service = serviceHelper.getService(constants.SERVICES.TIKTOK.BASE);
    var params = {
        method: 'POST',
        path: constants.ENDPOINTS.DISCONNECT,
        headers: {
            'Content-Type': CONTENT_TYPE,
            'Access-Token': tikTokSettings.custom.accessToken
        },
        body: {
            external_business_id: tikTokSettings.custom.externalBusinessId,
            business_platform: constants.BUSINESS_PLATFORM,
            is_setup_page: 0,
            app_id: tikTokSettings.custom.appId
        }
    };
    var result = service.call(params);
    if (result.error) {
        Logger.error('Error occurred while disconnecting from TikTok: ' + result.error);
        return false;
    }
    return true;
}

/**
 * Upload the given products to TikTok
 *
 * @param {dw/object/CustomObject} tikTokSettings The TikTok settings custom object instance
 * @param {string} catalogId The ID of the catalog to store in TikTok
 * @param {Array} products The array of formated products to send to TikTok
 *
 * @returns {boolean} True if the upload process succeed, false otherwise
 */
function uploadProducts(tikTokSettings, catalogId, products) {
    var service = serviceHelper.getService(constants.SERVICES.TIKTOK.BASE);
    var params = {
        method: 'POST',
        path: constants.ENDPOINTS.UPLOAD_PRODUCTS,
        headers: {
            'Content-Type': CONTENT_TYPE,
            'Access-Token': tikTokSettings.custom.accessToken
        },
        body: {
            bc_id: tikTokSettings.custom.bcId,
            catalog_id: catalogId,
            dpa_products: products
        }
    };
    var result = service.call(params);
    Logger.info(counter + ': ' + products.length + ' dpa_products \n');
    var response = parseResponse(result, 'upload.products.call');
    // https://ads.tiktok.com/marketing_api/docs?id=1709207085043713
    /*    if (!result.ok && result.error == '307') {
        var serviceRetry = serviceHelper.getService(constants.SERVICES.TIKTOK.BASE);
        var responseRetry = serviceRetry.call(params);
        response = parseResponse(responseRetry, 'upload.products.call');
    } */
    return response;
}

/**
 * send server side event to TikTok
 *
 * @param {dw/object/CustomObject} tikTokSettings The TikTok settings custom object instance
 * @param {string} tEvent TikTok tracking event
 * @param {string} tEventID Any string or hashed ID that can identify a unique event.
 * @param {string} reqUrl The complete URL of the request which was received at the server.
 * @param {string} referrerUrl The referer URL
 * @param {string} ttclid The value of ttclid used to match website visitor events with TikTok ads
 * @param {Object} titokProperties The Basket/Order content
 * @param {Object} userAgent The user agent
 * @param {Object} tikTokUserInfo The user information from the tikTok API
 * @returns {boolean} True if the upload process succeed, false otherwise
 */
function pixelTrack(tikTokSettings, tEvent, tEventID, reqUrl, referrerUrl, ttclid, titokProperties, userAgent, tikTokUserInfo) {
    var service = serviceHelper.getService(constants.SERVICES.TIKTOK.TRACKING);
    var userData;

    if (tikTokUserInfo != null) {
        var userInfo = tikTokUserInfo.split('|');
        userData = {
            external_id: userInfo[2],
            phone_number: userInfo[1],
            email: userInfo[0]
        };
    } else {
        userData = {
            external_id: '',
            phone_number: '',
            email: ''
        };
    }
    var params = {
        method: 'POST',
        path: constants.ENDPOINTS.PIXEL_TRACK,
        headers: {
            'Content-Type': CONTENT_TYPE,
            'Access-Token': tikTokSettings.custom.accessToken
        },
        body: {
            pixel_code: tikTokSettings.custom.pixelCode,
            event: tEvent,
            event_id: tEventID,
            context: {
                ad: {
                    callback: ttclid
                },
                page: {
                    url: reqUrl,
                    referrer: referrerUrl
                },
                user: userData,
                ip: request.httpRemoteAddress ? request.httpRemoteAddress : '',
                user_agent: userAgent
            },
            properties: titokProperties
        }
    };

    var result = service.call(params);
    // Logger.info(counter + ': ' + products.length + ' dpa_products \n');
    if (result.error) {
        Logger.error('Error occurred while disconnecting from TikTok: ' + result.error);
        return false;
    }
    return true;
}

/**
 * send server side batch event to TikTok
 *
 * @param {dw/object/CustomObject} tikTokSettings The TikTok settings custom object instance
 * @param {Object} batchData pixel batch data
 * @returns {boolean} True if the upload process succeed, false otherwise
 */
function batchPixelTrack(tikTokSettings, batchData) {
    var service = serviceHelper.getService(constants.SERVICES.TIKTOK.TRACKING);
    var params = {
        method: 'POST',
        path: constants.ENDPOINTS.PIXEL_TRACK_BATCH,
        headers: {
            'Content-Type': CONTENT_TYPE,
            'Access-Token': tikTokSettings.custom.accessToken
        },
        body: {
            pixel_code: tikTokSettings.custom.pixelCode,
            batch: batchData
        }
    };

    var result = service.call(params);
    Logger.info('params ==> ' + params);
    if (result.ok !== true && result.errorMessage != null) {
        Logger.error('Error occurred calling TikTok batch API : ' + result);
        return false;
    }
    return true;
}

/**
 * send business credentials
 * @param {Object} extlDataB64 base64 encoded external data
 * @returns {boolean} True if the upload process succeed, false otherwise
 */
function checkConnectionStatus(extlDataB64) {
    var service = serviceHelper.getService(constants.SERVICES.TIKTOK.BUSINESS_API);
    var params = {
        method: 'GET',
        path: constants.ENDPOINTS.SHOP_CONNECTION_STATUS + '?external_data=' + extlDataB64,
        headers: {
            'x-debug-refreshconfig': 1,
            'Content-Type': CONTENT_TYPE

        }
    };

    var result = service.call(params);
    if (result.ok !== true && result.errorMessage != null) {
        Logger.error('Error occurred calling checkConnectionStatus : ' + result);
        return false;
    }

    var resultText = JSON.parse(result.object.text);
    if (Object.hasOwnProperty.call(resultText, 'data')
        && Object.hasOwnProperty.call(resultText.data, 'connect_info')
        && Object.hasOwnProperty.call(resultText.data.connect_info, 'connect_status')
        && Object.hasOwnProperty.call(resultText.data.connect_info.connect_status, 'connect')
        && resultText.data.connect_info.connect_status.connect === 2) {
        return true;
    }

    return false;
}

/**
 * send business credentials
 * @param {string} appId The app id
 * @param {string} extBusinessId The external business id
 * @param {string} externalData base64 encoded external data
 * @param {string} clientId The client id
 * @param {string} clientSecret The client secret
 * @param {string} ccUser The business manager user
 * @param {string} ccAccessKey The business manager access key
 * @param {string} ocapiVer The ocapi version
 * @param {string} siteId The site id
 * @param {string} webdavPwd The webdav password
 * @param {string} createOrderUrl The create order URL
 * @param {string} websiteUrl The website URL
 * @returns {boolean} True if the service call was successful, false otherwise
 */
function sendBusinessCredentials(appId,
    extBusinessId,
    externalData,
    clientId,
    clientSecret,
    ccUser,
    ccAccessKey,
    ocapiVer,
    siteId,
    webdavPwd,
    createOrderUrl,
    websiteUrl) {
    var service = serviceHelper.getService(constants.SERVICES.TIKTOK.BUSINESS_API);
    var params = {
        method: 'POST',
        path: constants.ENDPOINTS.BUSINESS_CREDENTIALS + '?external_data=' + externalData,
        headers: {
            'x-debug-refreshconfig': 1,
            'Content-Type': CONTENT_TYPE

        },
        body: {
            external_business_id: extBusinessId,
            app_id: appId,
            business_platform: constants.BUSINESS_PLATFORM,
            client_id: clientId,
            client_secret: clientSecret,
            commerce_cloud_username: ccUser,
            commerce_cloud_password: ccAccessKey,
            ocapi_version: ocapiVer,
            site_id: siteId,
            webdav_password: webdavPwd,
            create_order_url: createOrderUrl,
            website_url: websiteUrl
        }
    };

    var result = service.call(params);
    Logger.info('params ==> ' + params);
    if (result.ok !== true && result.errorMessage != null) {
        Logger.error('Error occurred calling TikTok sendBusinessCredentials : ' + result);
        return false;
    }
    var resultText = JSON.parse(result.object.text);
    if (Object.hasOwnProperty.call(resultText, 'code')) {
        if (resultText.code !== 0) {
            return false;
        }
        return true;
    }
    return false;
}

/**
 * disconnect from TikTok Shop
 * @param {string} extBusinessId The TikTok Shop external business ID
 * @param {string} externalData The external data
 * @returns {boolean} True if the upload process succeed, false otherwise
 */
function disconnectShop(extBusinessId, externalData) {
    var service = serviceHelper.getService(constants.SERVICES.TIKTOK.BUSINESS_API);
    var params = {
        method: 'POST',
        path: constants.ENDPOINTS.DISCONNECT_SHOP + '?external_data=' + externalData,
        headers: {
            'Content-Type': CONTENT_TYPE
        },
        body: {
            biz_type: 3,
            outer_shop_id: extBusinessId
        }
    };

    var result = service.call(params);
    Logger.info('params ==> ' + params);
    if (result.ok !== true && result.errorMessage != null) {
        Logger.error('Error occurred calling notify TikTok feed file : ' + result);
        return false;
    }
    return true;
}

/**
 * send feed notification
 * @param {Object} tikTokSettings The TikTok settings
 * @param {string} instance The instance
 * @param {string} feedURL The feed URL
 * @param {string} feedType The feed type
 * @param {string} updateType The update type
 * @returns {boolean} True if the upload process succeed, false otherwise
 */
function notifyFeed(tikTokSettings, instance, feedURL, feedType, updateType) {
    var service;
    var params = {
        method: 'POST',
        path: constants.ENDPOINTS.FEED_NOTIFICATION,
        headers: {
            'Content-Type': CONTENT_TYPE
        },
        body: {
            business_platform: 'SALESFORCE',
            external_business_id: tikTokSettings.custom.externalBusinessId,
            params: {
                url: feedURL,
                feed_type: feedType,
                update_type: updateType
            }
        }
    };

    // retry variables
    var retryLimit = 3;
    var retryCount = 0;
    var success = false;
    var result;

    while (!success && retryCount < retryLimit) {
        try {
            Logger.info('retryCount: ' + (retryCount + 1) + ' |request:' + JSON.stringify(params));
            service = serviceHelper.getService(constants.SERVICES.TIKTOK.ORDER_FEED);
            result = service.call(params);
            if (result.ok !== true) {
                if (result.errorMessage != null) {
                    Logger.info('retryCount: ' + (retryCount + 1) + ' |Error occurred calling notify service: ' + result.errorMessage);
                }
            } else if (result.object && result.object.text) {
                var response = JSON.parse(result.object.text);
                if (response && response.code !== 0) {
                    Logger.info('retryCount: ' + (retryCount + 1) + ' |Error in notify service response: ' + result.object.text);
                } else {
                    Logger.info('retryCount: ' + (retryCount + 1) + ' |notify service response: ' + result.object.text);
                    success = true;
                }
            }
            retryCount++;
        } catch (ex) {
            retryCount++;
            if (retryCount >= retryLimit) {
                // If we've reached the maximum retry limit, return not success
                return success;
            }
        }
    }
    return success;
}

/**
 * Delete the given products from TikTok
 *
 * @param {dw/object/CustomObject} tikTokSettings The TikTok settings custom object instance
 * @param {string} catalogId The ID of the catalog to store in TikTok
 * @param {Array} products The array of formated products to send to TikTok
 *
 * @returns {boolean} True if the upload process succeed, false otherwise
 */
function deleteProducts(tikTokSettings, catalogId, products) {
    var service = serviceHelper.getService(constants.SERVICES.TIKTOK.BASE);
    var params = {
        method: 'POST',
        path: constants.ENDPOINTS.REMOVE_PRODUCTS,
        headers: {
            'Content-Type': CONTENT_TYPE,
            'Access-Token': tikTokSettings.custom.accessToken
        },
        body: {
            bc_id: tikTokSettings.custom.bcId,
            catalog_id: catalogId,
            sku_ids: products
        }
    };

    var result = service.call(params);
    var response = parseResponse(result, 'delete.products.call');
    return response;
}

module.exports = {
    getAuthToken: getAuthToken,
    getBusinessProfile: getBusinessProfile,
    getPixelDetails: getPixelDetails,
    getCatalogOverview: getCatalogOverview,
    disconnectFromTikTok: disconnectFromTikTok,
    createApplication: createApplication,
    deleteProducts: deleteProducts,
    uploadProducts: uploadProducts,
    pixelTrack: pixelTrack,
    notifyFeed: notifyFeed,
    batchPixelTrack: batchPixelTrack,
    sendBusinesCredentials: sendBusinessCredentials,
    sendBusinessCredentials: sendBusinessCredentials,
    checkConnectionStatus: checkConnectionStatus,
    disconnectShop: disconnectShop
};
