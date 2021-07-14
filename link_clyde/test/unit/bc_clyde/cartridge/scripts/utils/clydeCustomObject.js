/* global describe, it*/
'use strict';
var assert = require('chai').assert;

global.empty = function (obj) {
    if (obj === null || obj === undefined || obj === '' || (typeof (obj) !== 'function' && obj.length !== undefined && obj.length === 0)) {
        return true;
    }
    return false;
};

describe('ClydeCustomObject', function () {
    it('should return Custom Object for Product', function () {
        var CustomObject = require('../../../../../mocks/utils/clydeCustomObject.js');
        var co = new CustomObject('ClydeJobConfigs', 'ProductExportFull');
        var testCo = co.getCO();

        assert.isObject(testCo);
        assert.isDefined(testCo.custom);
    });
});
