'use strict';

var assert = require('chai').assert;
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();

var tikTokSettings = {
    custom:{
        appId: "appId",
        appSecret: "appSecret",
        accessToken: "xxx",
        externalBusinessId: 12345,
        bcId: 12345,
        advertiser_id: "advertiser_id",
        pixelCode: "xxxx-y",
        catalogId: "catalog01"
    }
};
var authCode = "authCode";

var callService = proxyquire('../../../../../social_channels/cartridges/int_tiktok/cartridge/scripts/services/tiktokService.js', {
           
    'dw/system/Logger': {
     debug: function (text) {
         return text;
     },
     error: function (text) {
         return text;
     },
     getLogger: function(){
         return {
             error: function (text) {
                 return text;
             },
             info: function(){}
         };
     }
 },

 'dw/system/Site': {},

 'dw/util/StringUtils': {},
 
 './serviceHelper.js':{
     'dw/svc/LocalServiceRegistry': {
         createService: function(service, data){
             return false
         }
     },
     getService: function(name){
         return {
            service: "TIKTOK", 
            call: function(){
                 return {
                     ok: true,
                     object:{
                         text:'{"code":0, "accessToken":"xxx", "bc_id":12345, "app_id": 54321, "app_secret": 78910, "pixel_id": "xxxx-x", "pixel_name": "pixel01", "catalogId": "catalog01", "approved": 5, "rejected": 3, "processing": 38, "feed_log_id": 73474, "request_id": 123456789, "data":{"connect_info":{"connect_status":{"connect":2}}}}'
                     }
                 }
                },
            getURL: function(){}
         }
     }
 },
 });

describe('Service TikTok - API Authentication', function () {
    it('It should authenticate and return the token', function () {
        var call = callService.getAuthToken(tikTokSettings, authCode);
        assert.equal(call.error, false);
        assert.equal(call.result.accessToken, "xxx");
    });

    it('It should get the TikTok Business Profile', function () {
        var call = callService.getBusinessProfile(tikTokSettings);
        assert.equal(call.error, false);
        assert.equal(call.result.bc_id, 12345);
    });

    it('It should create TikTok application', function () {
        var call = callService.createApplication("externalBusinessId", "redirectUrl");
        assert.equal(call.error, false);
        assert.equal(call.result.app_id, 54321);
        assert.equal(call.result.app_secret, 78910);
    });

    it('It should get the TikTok Pixel details', function () {
        var call = callService.getPixelDetails(tikTokSettings);
        assert.equal(call.error, false);
        assert.equal(call.result.pixel_id, "xxxx-x");
        assert.equal(call.result.pixel_name, "pixel01");
    });

    it('It should get the TikTok Catalog Overview', function () {
        var call = callService.getCatalogOverview(tikTokSettings);
        assert.equal(call.error, false);
        assert.equal(call.result.approved, 5); //Number of approved products in the catalog.
        assert.equal(call.result.rejected, 3); //Number of rejected products in the catalog.
        assert.equal(call.result.processing, 38); //Number of processing products in the catalog.
    });

    it('It should disconnect from TikTok', function () {
        var call = callService.disconnectFromTikTok(tikTokSettings);
        assert.isTrue(call); 
    });

    it('It should upload the given products to TikTok', function () {
        var call = callService.uploadProducts(tikTokSettings, tikTokSettings.custom.catalogId, {});
        assert.equal(call.error, false);
        assert.equal(call.result.feed_log_id, 73474); //Catalog handling log ID
    });

    it('It should send server side event to TikTok', function () {
        var call = callService.pixelTrack(tikTokSettings, "event", "eventID", "reqUrl", "referrerUrl", "ttclid", {}, "userAgent", "tikTokUserInfo");
        assert.isTrue(call);
    });

    it('It should send server side batch event to TikTok', function () {
        var call = callService.batchPixelTrack(tikTokSettings, {});
        assert.isTrue(call);
    });

    it('It should check connection status', function () {
        var call = callService.checkConnectionStatus("externalData_base64");
        assert.isTrue(call);
    });

    it('It should send business credentials', function () {
        var call = callService.sendBusinesCredentials("appId", "extBusinessId", "externalData", "clientId", "clientSecret","ccUser","ccAccessKey","ocapiVer", "siteId", "webdavPwd");
        assert.isTrue(call);
    });

    it('It should disconnect from TikTok Shop', function () {
        var call = callService.disconnectShop("extBusinessId", "externalData");
        assert.isTrue(call);
    });

    it('It should send feed notification', function () {
        var call = callService.notifyFeed(tikTokSettings, "instance", "feedURL", "feedType", "updateType");
        assert.isTrue(call);
    });

    it('It should delete products from TikTok', function () {
        var call = callService.deleteProducts(tikTokSettings, tikTokSettings.custom.catalogId, {});
        assert.equal(call.error, false);
        assert.equal(call.result.request_id, 123456789);
    });
});