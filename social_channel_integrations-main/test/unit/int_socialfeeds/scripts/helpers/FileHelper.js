'use strict';

var assert = require('chai').assert;
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();

var File = require('../../../../mocks/dw.io.File');

describe('FileHelpers', function () {
    
    var FileHelper = proxyquire('../../../../../social_feeds/cartridges/int_socialfeeds/cartridge/scripts/helpers/FileHelper.js', {
        'dw/io/File': File
    });

    it('Should generate correct file name', function () {
        var folderPath = "feeds/export/oci/test";
        var baseFilename = "oci-location-groups-full-export-"
        var filename = baseFilename + "_siteid_-_timestamp_.txt";
        var siteId = "testSite";

        var file = FileHelper.createFile(folderPath, filename, siteId);

        assert.isTrue(file.name.indexOf(baseFilename + siteId) > -1);
    });


});