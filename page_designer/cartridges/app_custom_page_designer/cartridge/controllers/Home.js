'use strict';

var server = require('server');
var page = module.superModule;
server.extend(page);

var cache = require('*/cartridge/scripts/middleware/cache');
var consentTracking = require('*/cartridge/scripts/middleware/consentTracking');
var pageMetaData = require('*/cartridge/scripts/middleware/pageMetaData');
var Site = require('dw/system/Site');
var PageMgr = require('dw/experience/PageMgr');

server.prepend('Show', consentTracking.consent, cache.applyDefaultCache, function (req, res, next) {
    var enablePageDesignerHomePage = Site.getCurrent().getCustomPreferenceValue('enablePageDesignerHomePage');
    var pageDesignerHomePageID = Site.getCurrent().getCustomPreferenceValue('pageDesignerHomePage');
    if (enablePageDesignerHomePage && !empty(pageDesignerHomePageID)) {
        var homePage = PageMgr.getPage(pageDesignerHomePageID);

        if (homePage && homePage.visible) {
            response.writer.print(PageMgr.renderPage(homePage.ID, ''));
        } else {
            next();
        }
    } else {
        next();
    }

}, pageMetaData.computedPageMetaData);

module.exports = server.exports();