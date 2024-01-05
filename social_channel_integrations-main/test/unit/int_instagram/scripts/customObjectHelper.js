'use strict';

const Assert = require('chai').assert;
const Proxy = require('proxyquire').noCallThru().noPreserveCache();

describe('customObjectHelper', function () {

    const customObjectHelper = Proxy('../../../../social_channels/cartridges/int_instagram/cartridge/scripts/customObjectHelper.js', {
        'dw/object/CustomObjectMgr': {
            getCustomObject: function() {
                return;
            }
        },
        'dw/system/Logger': {
            warn: function() {
                return;
            }
        },
        'dw/system/Site': {
            getCurrent: function(){
                return {
                    getDefaultCurrency: function() {
                        return 'USD';
                    },
                    getID: function() {
                        return 'RefArch';
                    },
                    getTimezone: function() {
                        return 'America/Los_Angeles';
                    }
                }  
            }
        },
        'dw/system/Transaction': {},
        'dw/system/System': {
            getInstanceType: function() {
                return 0;
            },
            getInstanceHostname: function() {
                return 'zzeu-000.dx.commercecloud.salesforce.com';
            }
        },
        'dw/web/URLUtils': {
            https: function(route) {
                return route;
            }
        },
        'int_instagram/cartridge/scripts/InstagramConstants': require('../../../../social_channels/cartridges/int_instagram/cartridge/scripts/InstagramConstants')
    });

    it('It should execute getSettings', function () {
        var getSettings = new customObjectHelper.getSettings({});
        Assert.isObject(getSettings);
    });
});