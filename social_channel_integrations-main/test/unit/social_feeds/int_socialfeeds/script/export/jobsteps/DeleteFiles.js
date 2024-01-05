'use strict';


var assert = require('chai').assert;
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();

var Status = require('../../../../../../mocks/Status');

describe('Jobstep - Delete Files', function () {
    const job = proxyquire('../../../../../../mocks/DeleteFiles_jobstep.js', {
        'dw/system/Status': Status
    });
    

    it('It should delete file and files in subfolders', function () {
        var args = {OlderThanDays: 1, FileExtension: 'txt', DeleteFileInSubfolders: true, FolderPath: 'testJob'};
        var statusJob = job.execute(args);

        assert.isObject(statusJob);
    });
});