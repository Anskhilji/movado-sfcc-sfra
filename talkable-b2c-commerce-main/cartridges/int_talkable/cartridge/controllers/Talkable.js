"use strict";

/* global request customer empty */
var ISML = require("dw/template/ISML");
var Site = require("dw/system/Site");

/**
 * Renders the Dashboard Campaign SiteGenesis
 */
module.exports.Dashboard = function () {
    if (Site.current.getCustomPreferenceValue("talkableDashboard")) {
        ISML.renderTemplate("talkable/dashboard");
    } else {
        ISML.renderTemplate("error/notfound");
    }
};

/**
 * Renders the Dashboard Campaign for SFRA storefront
 */
module.exports.DashboardSfra = function () {
    if (Site.current.getCustomPreferenceValue("talkableDashboard")) {
        var Resource = require("dw/web/Resource");
        var URLUtils = require("dw/web/URLUtils");
        ISML.renderTemplate("account/dashboardSfra", {
            breadcrumbs: [
                {
                    htmlValue: Resource.msg("global.home", "common", null),
                    url: URLUtils.home().toString()
                },
                {
                    htmlValue: Resource.msg(
                        "page.title.myaccount",
                        "account",
                        null
                    ),
                    url: URLUtils.url("Account-Show").toString()
                }
            ]
        });
    } else {
        ISML.renderTemplate("error/notFound");
    }
};

/**
 * Renders the Standalone Campaign
 */
module.exports.Standalone = function () {
    var libTalkable = require("*/cartridge/scripts/talkable/libTalkable");
    if (
        Site.current.getCustomPreferenceValue("talkableStandalone")
        && libTalkable.TalkableEnabled()
    ) {
        ISML.renderTemplate("talkable/standalone");
    } else {
        ISML.renderTemplate("error/notfound");
    }
};
/**
 * Renders the Standalone Campaign for SFRA Sites
 */
module.exports.StandaloneSfra = function () {
    var libTalkable = require("*/cartridge/scripts/talkable/libTalkable");
    if (
        Site.current.getCustomPreferenceValue("talkableStandalone")
        && libTalkable.TalkableEnabled()
    ) {
        ISML.renderTemplate("talkable/standaloneSfra");
    } else {
        ISML.renderTemplate("error/notFound");
    }
};
/**
 * Renders HEAD Template
 */
module.exports.Head = function () {
    var libTalkable = require("*/cartridge/scripts/talkable/libTalkable");
    if (libTalkable.TalkableEnabled()) {
        var talkable = new libTalkable.TalkableHelper();
        var talkableSiteId = talkable.getSiteId();
        var isRegisterAffiliateEnabled = talkable.isRegisterAffiliateEnabled();
        var talkableData = talkable.getCustomerData(customer);

        ISML.renderTemplate("talkable/head", {
            talkableSiteId: talkableSiteId,
            isRegisterAffiliateEnabled: isRegisterAffiliateEnabled,
            talkableData: talkableData,
            talkable: talkable
        });
    }
};

/**
 * Renders Post Checkout Summary Template
 */
module.exports.PostCheckoutSummary = function () {
    var libTalkable = require("*/cartridge/scripts/talkable/libTalkable");
    if (libTalkable.TalkableEnabled()) {
        var OrderMgr = require("dw/order/OrderMgr");
        var orderNo = request.httpParameterMap.orderNo;
        var order = OrderMgr.getOrder(orderNo);
        var talkable = new libTalkable.TalkableHelper();
        var talkableSiteId = talkable.getSiteId();
        var isPostCheckoutEnabled = talkable.isPostCheckoutEnabled();
        if (!empty(order)) {
            var talkableData = talkable.getPurchaseData(order);
            ISML.renderTemplate("talkable/postCheckoutSummary", {
                talkableSiteId: talkableSiteId,
                isPostCheckoutEnabled: isPostCheckoutEnabled,
                talkableData: talkableData,
                Order: order
            });
        }
    }
};

module.exports.Dashboard.public = true;
module.exports.DashboardSfra.public = true;
module.exports.Standalone.public = true;
module.exports.Head.public = true;
module.exports.PostCheckoutSummary.public = true;
module.exports.StandaloneSfra.public = true;
