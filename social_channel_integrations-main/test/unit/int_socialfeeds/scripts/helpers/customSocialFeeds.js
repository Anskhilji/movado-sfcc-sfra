'use string'

var assert = require('chai').assert;
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var dataSocialFeed = {CustomObjectIds: 'google-shopping'}
var dataGoogle = {
    id: 'social-google',
    socialCategory: 'SocialChannelGoogle'
};

var callService = proxyquire('../../../../../social_feeds/cartridges/int_socialfeeds/cartridge/scripts/helpers/customSocialFeeds.js', {
    'dw/system/Site': {
        getCurrent: function(){
            return{ getAllowedLocales: function(){
                return ['en_US', 'de_DE']
            }}  
        }
    },
    'dw/object/CustomObjectMgr': {
        getCustomObject: function(){
            return {
                custom: dataGoogle
            }
        }  
    },
    'dw/system/Request': {},
    'dw/system/Session': {},
    'dw/util/Currency': {
        getCurrency: function(currency){}
    },
    '*/cartridge/config/countries.json': [
        {
            "id": "en_GB",
            "currencyCode": "GBP"
        }, {
            "id": "ja_JP",
            "currencyCode": "JPY"
        }]
});

describe('Social Feeds - CustomSocialFeeds', function () {
    it('It should return locales for social category', function () {
        var call = callService.getLocalesForSocialCategory(dataSocialFeed);
        assert.equal(call[0], 'en_US');
        assert.equal(call[1], 'de_DE');
    });
});