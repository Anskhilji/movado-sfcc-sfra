'use strict';

var assert = require('chai').assert;
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();

describe('customObjectHelper', function () {

    var customObjectHelper = proxyquire('../../../../social_channels/cartridges/int_google/cartridge/scripts/customObjectHelper.js', {
        'dw/system/Transaction': {
            wrap: function (arg) { arg(); }
        },
        'dw/object/CustomObjectMgr': {
            getCustomObject: function(definition, objectId){ return objectId ? 'fetched': null; }
        },
       'int_google/cartridge/scripts/GoogleConstants': require('../../../../social_channels/cartridges/int_google/cartridge/scripts/GoogleConstants.js'),
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
    });

    it('It should clear correctly all fields', function () {
        var settings = {custom: {}};

        settings.custom.appId = 'valueTestId';
        settings.custom.appSecret = 'valueTestSecret';
        settings.custom.externalDataKey = 'valueTestData';
        settings.custom.externalBusinessId = 'valueTestBusinessId';
        settings.custom.shopperClientId = 'valueTestShopperId';
        settings.custom.shopperClientSecret = 'valueTestShopperClientId';
        settings.custom.externalData = 'valueTestExternalData';
        settings.custom.accessToken = 'valueTestAcessToken';
        settings.custom.refreshToken = 'valueTestRefreshToken';
        settings.custom.pixelCode = 'valueTestPixelCode';
        settings.custom.bcId = 'valueTestBcId';
        settings.custom.advertiserId = 'valueTestAdvertiseId';
        settings.custom.catalogId = 'valueTestCatalogId';
        settings.custom.enableAdvancedMatchingPhone = true;
        settings.custom.enableAdvancedMatchingEmail = true;
        settings.custom.catalogOverview = 'valueTestCatalogOverview';

        customObjectHelper.clearValues(settings);

        var clearSettings = true;

        for (let key in settings.custom) {

            const attrb = settings.custom[key];

            switch (typeof settings.custom[key]) {
                case 'string':
                    if(!attrb == ''){
                        clearSettings = false;
                    }
                    break;

                case 'boolean':
                    if(attrb){
                        clearSettings = false;
                    }
                    break;

                default:
                    clearSettings = false;
                    break;
                }

        }

        assert.isTrue(clearSettings);
    });

    it('It should fetch the existing value', function () {
        var customObject = customObjectHelper.getCustomObject();
        assert.equal(customObject, 'fetched');
    });

});