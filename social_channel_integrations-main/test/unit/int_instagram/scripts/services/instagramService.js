'use strict';

const Assert = require('chai').assert;
const Proxy = require('proxyquire').noCallThru().noPreserveCache();

var serviceHelper = require('../../../../mocks/serviceHelper');

describe('instagramService', function () {
    const instagramService = Proxy('../../../../../social_channels/cartridges/int_instagram/cartridge/scripts/services/instagramService', {
        'dw/system/Logger': {
            getLogger: function() {
                return {
                    info: function() {
                
                    }
                }
            },
            
        },
        'dw/system/Site': {

        },
        'dw/util/StringUtils': {

        },
        './serviceHelper': new serviceHelper(),  
    });

    it('It should get assets', function () {
        var getAssetIDs = instagramService.getAssetIDs({
            custom: {
                accessToken: '',
                externalBusinessId: ''
            }
        }, '', '')
        Assert.strictEqual(getAssetIDs.error, false);
    });

    it('It should get user access token', function () {
        var getSystemUserToken = instagramService.getSystemUserToken({
            custom: {
                accessToken: '',
                appId: '',
                businessManagerId: '',
                externalBusinessId: ''
            }
        }, '', '')
        Assert.strictEqual(getSystemUserToken.error, false);
    });

    it('It should disconnect MBE', function () {
        var disconnectMBE = instagramService.disconnectMBE({
            custom: {
                accessToken: '',
                externalBusinessId: ''
            }
        }, '', '')
        Assert.strictEqual(disconnectMBE.error, false);
    });
});