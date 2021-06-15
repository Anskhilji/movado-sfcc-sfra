/**
 * error page
 *
 * @module  controllers/Home
 */

'use strict';

var server = require('server');
var page = module.superModule;
server.extend(page);

var cache = require('*/cartridge/scripts/middleware/cache');
var consentTracking = require('*/cartridge/scripts/middleware/consentTracking');
var pageMetaData = require('*/cartridge/scripts/middleware/pageMetaData');
var Site = require('dw/system/Site');
var URLUtils = require('dw/web/URLUtils');

var relativeURL = "/home";

server.append('Show', consentTracking.consent, cache.applyDefaultCache, function (req, res, next) {
    var ContentMgr = require('dw/content/ContentMgr');
    var FolderSearch = require('*/cartridge/models/search/folderSearch');
    var pageMetaHelper = require('*/cartridge/scripts/helpers/pageMetaHelper');
    var searchCustomHelpers = require('*/cartridge/scripts/helpers/searchCustomHelper');
    var viewData = res.getViewData();
    var content = ContentMgr.getContent('ca-home-hreflang');

    var folderSearch = searchCustomHelpers.setupContentFolderSearch('root');
    var contentObj = {
    		pageTitle: folderSearch.folder.pageTitle,
    		pageDescription: folderSearch.folder.pageDescription,
    		pageKeywords: folderSearch.folder.pageKeywords };

    pageMetaHelper.setPageMetaData(req.pageMetaData, contentObj);
    viewData.content = content && content.custom && content.custom.body ? content.custom.body : '';
    viewData.relativeURL = relativeURL;
    //Custom Start[MSS-1410 Checkout and Shipping changes for PickupInStore Logic] Delete session value if exists
    if(session.privacy.pickupFromStore) delete session.privacy.pickupFromStore;
    //Custom End
    res.setViewData(viewData);
    return next();
}, pageMetaData.computedPageMetaData);


// replacing ErrorNotFound route to pick data from contentslot
server.replace('ErrorNotFound', function (req, res, next) {
    var ContentMgr = require('dw/content/ContentMgr');
    var ContentModel = require('*/cartridge/models/content');
	res.setStatusCode(410);
    var result = { content404Page: '' };

    var apiContent = ContentMgr.getContent('ca-404page');
    if (apiContent) {
        var content = new ContentModel(apiContent, 'components/content/contentAssetInc');
        result.content404Page = content;
    }
    res.render('error/notFound', result);
    next();
});

server.get('SetUserEmail', function (req, res, next) {

    var userTracking;
	if(Site.current.getCustomPreferenceValue('analyticsTrackingEnabled')) {
        if (customer.isAuthenticated() && customer.getProfile()) {
            userTracking = JSON.stringify({email: customer.getProfile().getEmail()});
        }
    }
    res.json({
        userTracking: userTracking
    });
    next();
});

module.exports = server.exports();

