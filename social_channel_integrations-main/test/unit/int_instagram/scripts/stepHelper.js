'use strict';

const Assert = require('chai').assert;
const Proxy = require('proxyquire').noCallThru().noPreserveCache();

describe('stepHelper', function () {
    const stepHelper = Proxy('../../../../social_channels/cartridges/int_instagram/cartridge/scripts/stepHelper.js', {
        
    })

    it('It should execute isDisabled', function () {
        var isDisabled = new stepHelper.isDisabled();
        Assert.isObject(isDisabled);
    });

});