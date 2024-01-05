'use strict';

const Assert = require('chai').assert;
const Proxy = require('proxyquire').noCallThru().noPreserveCache();

var Collection = require('../../../../mocks/dw.util.Collection');

describe('instagramCollections', function () {
    const instagramCollections = Proxy('../../../../../social_channels/cartridges/int_instagram/cartridge/scripts/util/instagramCollections.js', {
        'dw/util/List':{},
        iterator: function() {
            return;
        }
    });

    it('It should execute filter', function () {
        var filter = new instagramCollections.filter(Collection, null, {});
        Assert.isObject(filter);
    });
});