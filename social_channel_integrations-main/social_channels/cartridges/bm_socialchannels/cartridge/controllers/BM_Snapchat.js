'use strict';

/**
 * All the nodes for Snapchat BM extension
 * @module controllers/BM_Snapchat
 */
var ISML = require('dw/template/ISML');
var Logger = require('dw/system/Logger');
var Site = require('dw/system/Site');
var URLUtils = require('dw/web/URLUtils');
var Transaction = require('dw/system/Transaction');
var constants = require('int_snapchat/cartridge/scripts/SnapchatConstants');
var customObjectHelper = require('int_snapchat/cartridge/scripts/customObjectHelper');
var snapchatService = require('int_snapchat/cartridge/scripts/services/snapchatService');
var validationHelper = require('../scripts/utils/validationHelper');

/**
 * Renders the start page with error message
 * @param {string} template - template
 * @param {string} errorCode - error code
 * @param {dw.object.CustomObject} snapchatSettings - snapchat settings
 */
function renderStartError(template, errorCode, snapchatSettings) {
    ISML.renderTemplate(template, {
        error: !empty(errorCode) ? errorCode : 'get.org.list.call',
        acceptTerms: snapchatSettings.custom.acceptTerms
    });
}

/**
 * initialize snapchat org details
 * @param {dw.object.CustomObject} snapchatSettings - snapchat settings
 * @returns {void}
 */
function initOrgDetails(snapchatSettings) {
    var template = 'snapchat/onboarding';

    // get a list of all Snapchat organizations
    var orgListResponse = snapchatService.getOrgList(snapchatSettings);
    if (empty(orgListResponse) || orgListResponse.error) {
        renderStartError(template, orgListResponse.errorCode, snapchatSettings);
        return;
    }
    if (!orgListResponse.orgList.length) {
        renderStartError(template, 'get.org.list.zero', snapchatSettings);
        return;
    }

    var orgList = [];
    var adList = [];
    var catalogList = [];

    if (orgListResponse.orgList) {
        session.forms.snapchat.snapOrgId.setOptions(orgListResponse.orgList.iterator());
        orgList = orgListResponse.orgList.toArray();
    }

    if (orgList.length && orgList[0].value) {
        var orgId = orgList[0].value.split('|')[0];

        // get add accounts for the first org in the list
        var adAccResponse = snapchatService.getAdAccounts(snapchatSettings, orgId);
        if (adAccResponse && adAccResponse.adList) {
            session.forms.snapchat.snapAdAccountId.setOptions(adAccResponse.adList.iterator());
            adList = adAccResponse.adList.toArray();
        }

        // get catalogs for the first org in the list
        var catalogResponse = snapchatService.getCatalogs(snapchatSettings, orgId);
        if (catalogResponse && catalogResponse.catalogList) {
            session.forms.snapchat.snapCatalogId.setOptions(catalogResponse.catalogList.iterator());
            catalogList = catalogResponse.catalogList.toArray();
        }
    }

    // get pixel list for first active ad account in the list
    if (adList.length && adList[0].value) {
        var adAcctId = adList[0].value.split('|')[0];
        var pixelResponse = snapchatService.getPixelFromAdAccount(snapchatSettings, adAcctId);
        if (pixelResponse.pixelList) {
            session.forms.snapchat.snapPixelId.setOptions(pixelResponse.pixelList.iterator());
        }
    }

    // get product feed list for first active catalog in the list
    if (catalogList.length && catalogList[0].value) {
        var catalogId = catalogList[0].value.split('|')[0];
        var productFeedResponse = snapchatService.getProductFeeds(snapchatSettings, catalogId);
        if (productFeedResponse.productFeedList) {
            session.forms.snapchat.snapProductFeedId.setOptions(productFeedResponse.productFeedList.iterator());
        }
    }

    // Fill form fields from custom object
    customObjectHelper.fillFormFromCustomObject(snapchatSettings);

    ISML.renderTemplate(template, {
        snapchatSettings: snapchatSettings,
        externalData: customObjectHelper.getExternalData(snapchatSettings),
        acceptTerms: snapchatSettings.custom.acceptTerms
    });
}

/**
 * Get feed upload status
 * @param {Object} snapchatSettings - snapchat settings
 * @return {Object} feed upload details object
 */
function getFeedUploadStatus(snapchatSettings) {
    var HashMap = require('dw/util/HashMap');
    var Template = require('dw/util/Template');

    var details = {
        success: false,
        feedUpload: null,
        feedUploadStatusBadgeClass: null,
        feedUploadDetailsHtml: null
    };
    if (empty(snapchatSettings.custom.feedUploadId)) return details;

    var feedUploadResponse = snapchatService.getFeedUpload(snapchatSettings, null);
    if (feedUploadResponse && !feedUploadResponse.error && Object.hasOwnProperty.call(feedUploadResponse, 'feedUpload')) {
        details.success = true;
        details.feedUpload = feedUploadResponse.feedUpload;
        details.feedUploadStatusBadgeClass = 'slds-theme_warning';
        var feedUploadStatus = feedUploadResponse.feedUpload.status;
        if (feedUploadStatus === constants.FEED_UPLOAD_STATUS.COMPLETE) {
            details.feedUploadStatusBadgeClass = 'slds-theme_success';
        } else if (feedUploadStatus === constants.FEED_UPLOAD_STATUS.ERRORED) {
            details.feedUploadStatusBadgeClass = 'slds-theme_error';
        }

        // create html for javascript call
        var context = new HashMap();
        var viewData = { feedUploadDetails: details };
        Object.keys(viewData).forEach(function (key) {
            context.put(key, viewData[key]);
        });
        var template = new Template('snapchat/productFeedUploadStatus');
        details.feedUploadDetailsHtml = template.render(context).text;
    }

    return details;
}

/**
 * initialize snapchat app connection
 * @param {dw.object.CustomObject} snapchatSettings - snapchat settings
 */
function initCall(snapchatSettings) {
    // init Snapchat Org Details
    if (empty(snapchatSettings.custom.externalBusinessId)) {
        initOrgDetails(snapchatSettings);
        return;
    }

    // update org info
    snapchatService.getOrgInfo(snapchatSettings);

    // update ad accounts
    snapchatService.getAdAccounts(snapchatSettings, '');

    // get pixels from ad account - service call requires advertiserId
    if (!empty(snapchatSettings.custom.advertiserId)) {
        snapchatService.getPixelFromAdAccount(snapchatSettings, '');
    }

    // get catalogs
    snapchatService.getCatalogs(snapchatSettings, '');

    // get product feed - service call requires catalogId
    if (!empty(snapchatSettings.custom.catalogId)) {
        snapchatService.getProductFeeds(snapchatSettings, '');
    }

    // get user's business profile
    var userInfo = '';
    var bpResponse = snapchatService.getBusinessProfile(snapchatSettings);
    if (bpResponse && Object.hasOwnProperty.call(bpResponse, 'result') && Object.hasOwnProperty.call(bpResponse.result, 'me')) {
        var me = bpResponse.result.me;
        userInfo = [me.display_name, me.email].filter(Boolean).join(' - ');
    }

    // get latest feed upload details
    var feedUploadDetails = {};
    if (!empty(snapchatSettings.custom.feedUploadId)) {
        feedUploadDetails = getFeedUploadStatus(snapchatSettings);
    }

    var externalData = customObjectHelper.getExternalData(snapchatSettings);
    ISML.renderTemplate('snapchat/setup', {
        snapchatSettings: snapchatSettings,
        externalData: externalData,
        orgId: snapchatSettings.custom.externalBusinessId || '',
        orgName: snapchatSettings.custom.bcId || '',
        advertiserId: snapchatSettings.custom.advertiserId || '',
        advertiserAccount: snapchatSettings.custom.advertiserAccount || '',
        pixelCode: snapchatSettings.custom.pixelCode || '',
        pixelName: externalData.pixelName || '',
        catalogId: snapchatSettings.custom.catalogId || '',
        catalogName: externalData.catalogName || '',
        productFeedId: snapchatSettings.custom.productFeedId || '',
        productFeedName: externalData.productFeedName || '',
        userInfo: userInfo,
        feedUploadDetails: feedUploadDetails
    });
}

/**
 * Launch Snapchat and start OAuth flow
 */
function launch() {
    var CSRFProtection = require('dw/web/CSRFProtection');
    var snapchatSettings = customObjectHelper.getCustomObject();

    var form = session.forms.snapchat;
    var appId = form.appId.value;
    var siteId = Site.getCurrent().ID;

    var valuesToSave = {
        custom: {
            appId: appId,
            appSecret: form.appSecret.value,
            maxNumberEvents: constants.MAX_TRACKING_EVENTS
        }
    };
    customObjectHelper.saveValues(snapchatSettings, valuesToSave);

    var csrfToken = CSRFProtection.generateToken();
    var state = request.getHttpHost() + ':' + csrfToken.replace(/=/g, '');
    request.session.privacy.snapchatSiteId = siteId;
    request.session.privacy.snapchatState = state;
    response.redirect(constants.ENDPOINTS.OAUTH_URL
        + '?client_id=' + appId
        + '&redirect_uri=' + constants.ENDPOINTS.OAUTH_REDIRECT_URL
        + '&response_type=code'
        + '&scope=snapchat-marketing-api'
        + '&state=' + state);
}

/**
 * Configure onboarding details
 */
function submitOnboarding() {
    var template = 'snapchat/onboarding';
    var snapchatSettings = customObjectHelper.getCustomObject();
    var currentSite = Site.getCurrent();
    var siteId = currentSite.getID();

    var form = session.forms.snapchat;

    // validate the WebDAV username and access key
    if (!validationHelper.validateWebDAVHttpCredentials(form.bizMngrUsername.value, form.bizMngrAccessKeyWebdav.value, 'IMPEX/src/feeds/export')) {
        ISML.renderTemplate(template, {
            error: 'invalid.webDavCredentials'
        });
        return;
    }

    // validate SCAPI Credentials
    var validatePrivateTSOBClientResult = validationHelper.validatePrivateTSOBClient(
        form.shopperClientId.value,
        form.shopperClientSecret.value,
        siteId,
        form.shortCode.value,
        form.orgId.value);
    if (validatePrivateTSOBClientResult.error) {
        ISML.renderTemplate(template, {
            error: validatePrivateTSOBClientResult.error
        });
        return;
    }

    // form data prior to redirect
    var externalData = {
        orgId: form.orgId.value,
        shortCode: form.shortCode.value,
        catalogName: form.catalogName.value,
        catalogCurrencyCode: form.catalogCurrencyCode.value || currentSite.getDefaultCurrency(),
        productFeedName: form.productFeedName.value
    };
    var valuesToSave = {
        custom: {
            bizMngrUsername: form.bizMngrUsername.value,
            bizMngrAccessKeyWebdav: form.bizMngrAccessKeyWebdav.value,
            shopperClientId: form.shopperClientId.value,
            shopperClientSecret: form.shopperClientSecret.value
        }
    };

    var orgDetails = {
        snapOrgId: {
            value: 'externalBusinessId',
            label: 'bcId'
        },
        snapAdAccountId: {
            value: 'advertiserId',
            label: 'advertiserAccount'
        },
        snapPixelId: {
            value: 'pixelCode',
            label: 'externalData.pixelName'
        },
        snapCatalogId: {
            value: 'catalogId',
            label: 'externalData.catalogName'
        },
        snapProductFeedId: {
            value: 'productFeedId',
            label: 'externalData.productFeedName'
        }
    };

    Object.keys(orgDetails).forEach((key) => {
        if (Object.hasOwnProperty.call(form, key) && !empty(form[key].value)) {
            var formValue = form[key].value;
            var formValueArr = formValue.split('|');
            valuesToSave.custom[orgDetails[key].value] = formValueArr[0];
            if (formValueArr.length > 1) {
                if (orgDetails[key].label.indexOf('externalData.') > -1) {
                    externalData[orgDetails[key].label.split('.')[1]] = formValueArr[1];
                } else {
                    valuesToSave.custom[orgDetails[key].label] = formValueArr[1];
                }
            }
        }
    });

    valuesToSave.custom.externalData = JSON.stringify(externalData);
    customObjectHelper.saveValues(snapchatSettings, valuesToSave);

    // attempt to create catalog and product feed
    if (empty(snapchatSettings.custom.catalogId)) {
        snapchatService.createCatalogFeed(snapchatSettings);
    }
    initCall(snapchatSettings);
}

/**
 * Landing page for Snapchat
 */
function start() {
    var snapchatSettings = customObjectHelper.getCustomObject();
    var oauthFlow = request.httpParameterMap.oauth.booleanValue;
    var onboardingFlow = request.httpParameterMap.onboarding.booleanValue;

    if (oauthFlow) {
        launch();
    } else if (onboardingFlow) {
        submitOnboarding();
    } else if (snapchatSettings
        && snapchatSettings.custom.appId
        && snapchatSettings.custom.appSecret
        && snapchatSettings.custom.accessToken
        && snapchatSettings.custom.refreshToken
        && snapchatSettings.custom.acceptTerms) {
        // If the OAuthApp is already configured we can send BM user to manage Snapchat account area
        initCall(snapchatSettings);
    } else {
        // Fill form fields from custom object
        customObjectHelper.fillFormFromCustomObject(snapchatSettings);

        // Render the landing page so that the customer can authenticate through Snapchat
        ISML.renderTemplate('snapchat/start', {
            acceptTerms: snapchatSettings.custom.acceptTerms,
            error: request.httpParameterMap.error.stringValue,
            success: request.httpParameterMap.success.stringValue
        });
    }
}

/**
 * Accept terms for Snapchat and save the flag in custom object
 */
function acceptTerms() {
    var snapchatSettings = customObjectHelper.getCustomObject();
    Transaction.wrap(function () {
        snapchatSettings.custom.acceptTerms = true;
    });

    response.redirect(URLUtils.https('BM_Snapchat-Start', 'csrf_token', request.httpParameterMap.csrf_token.stringValue));
}

/**
 * Callback URL for Snapchat.
 */
function callback() {
    var snapchatSettings = customObjectHelper.getCustomObject();
    var authCode = request.httpParameterMap.code.value;
    var state = request.httpParameterMap.state.value;
    var errorMessage = request.httpParameterMap.error.value;
    var escapedState = (state ? state.replace(/=/g, '') : null);

    if (errorMessage || !authCode || !state || escapedState !== request.session.privacy.snapchatState || Site.getCurrent().ID !== request.session.privacy.snapchatSiteId) {
        request.session.privacy.snapchatState = null;
        request.session.privacy.snapchatSiteId = null;
        response.redirect(URLUtils.https('BM_Snapchat-Start', 'error', 'oauth.access_token.call', 'csrf_token', request.httpParameterMap.csrf_token.stringValue));
        return;
    }

    // Authenticating against the Snapchat API
    var accessTokenResponse = snapchatService.getAuthToken(snapchatSettings.custom.appId, snapchatSettings.custom.appSecret, authCode);
    if (accessTokenResponse.error) {
        request.session.privacy.snapchatState = null;
        request.session.privacy.snapchatSiteId = null;
        response.redirect(URLUtils.https('BM_Snapchat-Start', 'error', accessTokenResponse.errorCode, 'csrf_token', request.httpParameterMap.csrf_token.stringValue));
        return;
    }

    initCall(snapchatSettings);
}

/**
 * Manage Snapchat Business Account page
 */
function manage() {
    var snapchatSettings = customObjectHelper.getCustomObject();
    response.redirect('https://business.snapchat.com/' + snapchatSettings.custom.externalBusinessId + '/settings/business-details');
}

/**
 * Manage Snapchat Catalog page
 */
function manageCatalog() {
    var snapchatSettings = customObjectHelper.getCustomObject();
    response.redirect('https://business.snapchat.com/' + snapchatSettings.custom.externalBusinessId + '/catalogs');
}

/**
 * Disconnect from Snapchat + delete Pixel from Einstein + Remove custom object holding settings
 */
function disconnect() {
    var snapchatSettings = customObjectHelper.getCustomObject();
    if (snapchatService.disconnectFromSnapchat(snapchatSettings)) {
        customObjectHelper.removeCustomObject(snapchatSettings);
        response.redirect(URLUtils.https('BM_Snapchat-Start', 'csrf_token', request.httpParameterMap.csrf_token.stringValue));
        return;
    }
    ISML.renderTemplate('snapchat/setup', {
        error: 'disconnect',
        snapchatSettings: snapchatSettings
    });
}

/** call snapchat Catalog API and Product API to create the product feed */
function createCatalogFeed() {
    var snapchatSettings = customObjectHelper.getCustomObject();

    var redirectUrl = URLUtils.https('BM_Snapchat-Start', 'csrf_token', request.httpParameterMap.csrf_token.stringValue);
    var createCatalogResult = snapchatService.createCatalogFeed(snapchatSettings);
    if (!createCatalogResult || createCatalogResult.error) {
        redirectUrl.append('error', createCatalogResult.error);
    }
    response.redirect(redirectUrl);
}

/**
 * get org details for the specified Snapchat Org Id
 */
function getOrgDetails() {
    var viewData = {
        errors: [],
        orgId: null,
        adAccounts: [],
        catalogs: []
    };
    var reqBody = null;
    try {
        reqBody = JSON.parse(request.httpParameterMap.requestBodyAsString);
    } catch (e) {
        Logger.error(e.toString() + ' in ' + e.fileName + ':' + e.lineNumber);
    }

    if (reqBody && reqBody.orgId) {
        var snapchatSettings = customObjectHelper.getCustomObject();
        viewData.orgId = reqBody.orgId.split('|')[0];

        // get ad accounts for org
        var adAccResponse = snapchatService.getAdAccounts(snapchatSettings, viewData.orgId);
        if (!empty(adAccResponse)) {
            if (adAccResponse.errorCode) {
                viewData.errors.push(adAccResponse.errorCode);
            }
            if (adAccResponse.adList && adAccResponse.adList.length) {
                viewData.adAccounts = adAccResponse.adList.toArray();
            }
        }

        // get catalogs for org
        var catalogResponse = snapchatService.getCatalogs(snapchatSettings, viewData.orgId);
        if (!empty(catalogResponse)) {
            if (catalogResponse.errorCode) {
                viewData.errors.push(catalogResponse.errorCode);
            }
            if (catalogResponse.catalogList && catalogResponse.catalogList.length) {
                viewData.catalogs = catalogResponse.catalogList.toArray();
            }
        }
    }
    response.setContentType('application/json');
    response.writer.print(JSON.stringify(viewData, null, 2));
}

/**
 * get pixels for the ad account
 */
function getAdAccountPixels() {
    var viewData = {
        errors: [],
        adAccountId: null,
        pixels: []
    };
    var reqBody = null;
    try {
        reqBody = JSON.parse(request.httpParameterMap.requestBodyAsString);
    } catch (e) {
        Logger.error(e.toString() + ' in ' + e.fileName + ':' + e.lineNumber);
    }

    if (reqBody && reqBody.adAccountId) {
        var snapchatSettings = customObjectHelper.getCustomObject();
        viewData.adAccountId = reqBody.adAccountId.split('|')[0];

        var pixelResponse = snapchatService.getPixelFromAdAccount(snapchatSettings, viewData.adAccountId);
        if (!empty(pixelResponse)) {
            if (pixelResponse.errorCode) {
                viewData.errors.push(pixelResponse.errorCode);
            }
            if (pixelResponse.pixelList && pixelResponse.pixelList.length) {
                viewData.pixels = pixelResponse.pixelList.toArray();
            }
        }
    }
    response.setContentType('application/json');
    response.writer.print(JSON.stringify(viewData, null, 2));
}

/**
 * get product feeds for the catalog id
 */
function getCatalogProductFeeds() {
    var viewData = {
        errors: [],
        catalogId: null,
        productFeeds: []
    };
    var reqBody = null;
    try {
        reqBody = JSON.parse(request.httpParameterMap.requestBodyAsString);
    } catch (e) {
        Logger.error(e.toString() + ' in ' + e.fileName + ':' + e.lineNumber);
    }

    if (reqBody && reqBody.catalogId) {
        var snapchatSettings = customObjectHelper.getCustomObject();
        viewData.catalogId = reqBody.catalogId.split('|')[0];

        var productFeedResponse = snapchatService.getProductFeeds(snapchatSettings, viewData.catalogId);
        if (!empty(productFeedResponse)) {
            if (productFeedResponse.errorCode) {
                viewData.errors.push(productFeedResponse.errorCode);
            }
            if (productFeedResponse.productFeedList && productFeedResponse.productFeedList.length) {
                viewData.productFeeds = productFeedResponse.productFeedList.toArray();
            }
        }
    }
    response.setContentType('application/json');
    response.writer.print(JSON.stringify(viewData, null, 2));
}

/**
 * get product feeds upload status for product feed upload ID
 */
function getProductFeedUploadStatus() {
    var viewData = {
        success: false,
        productFeedUploadId: null,
        feedUploadDetails: {}
    };

    var snapchatSettings = customObjectHelper.getCustomObject();
    if (!empty(snapchatSettings.custom.feedUploadId)) {
        viewData.productFeedUploadId = snapchatSettings.custom.feedUploadId;
        var feedUploadDetails = getFeedUploadStatus(snapchatSettings);
        viewData.success = feedUploadDetails.success;
        viewData.feedUploadDetails = feedUploadDetails;
    }

    response.setContentType('application/json');
    response.writer.print(JSON.stringify(viewData, null, 2));
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
module.exports.Manage = manage;
module.exports.Manage.public = true;
module.exports.ManageCatalog = manageCatalog;
module.exports.ManageCatalog.public = true;
module.exports.CreateCatalogFeed = createCatalogFeed;
module.exports.CreateCatalogFeed.public = true;
module.exports.Disconnect = disconnect;
module.exports.Disconnect.public = true;
module.exports.GetOrgDetails = getOrgDetails;
module.exports.GetOrgDetails.public = true;
module.exports.GetAdAccountPixels = getAdAccountPixels;
module.exports.GetAdAccountPixels.public = true;
module.exports.GetCatalogProductFeeds = getCatalogProductFeeds;
module.exports.GetCatalogProductFeeds.public = true;
module.exports.GetProductFeedUploadStatus = getProductFeedUploadStatus;
module.exports.GetProductFeedUploadStatus.public = true;
