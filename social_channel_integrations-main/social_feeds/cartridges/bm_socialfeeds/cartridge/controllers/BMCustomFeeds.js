'use strict';

/**
 * @module controllers/BMCustomFeeds
 */

var boguard = require('bc_library/cartridge/scripts/boguard');
var ISML = require('dw/template/ISML');

/**
 * render product feed main page
 */
function start() {
    ISML.renderTemplate('feeds/productFeedMain.isml');
}

/**
 * render preview for specified object id (pid) and template id (feed)
 */
function preview() {
    var Site = require('dw/system/Site');
    request.setLocale(Site.getCurrent().defaultLocale);
    var feedPreview = require('~/cartridge/scripts/customobject/FeedPreviews');
    ISML.renderTemplate('data/preview.isml', { Preview: feedPreview.GeneratePreview() });
}

/**
 * render data for all sites
 */
function getAllSites() {
    var Site = require('dw/system/Site');
    var Response = require('bc_library/cartridge/scripts/util/Response');

    var allSites = Site.getAllSites();
    var sites = [];
    for (let i = 0; i < allSites.length; i++) {
        var availableSite = allSites[i];
        var site = {};
        site.id = availableSite.ID;
        site.name = availableSite.name;
        sites.push(site);
    }
    Response.renderJSON(sites);
}

exports.Start = boguard.ensure(['https', 'get'], start);
exports.Preview = boguard.ensure(['https', 'get'], preview);
exports.GetAllSites = boguard.ensure(['https', 'get'], getAllSites);
