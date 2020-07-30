'use strict';

var Logger = require('dw/system/Logger');
var Site = require('dw/system/Site');

 function setTestModeCredentials (service) {

    try {
        var credentialID = service.getConfiguration().getCredential().ID;
        if (service && credentialID) {
            service = service.setCredentialID(credentialID + '.test');
        }
    } catch (e) {
        Logger.error('TestMode: Error occurred while setting test credential and error is {0} in {1} : {2}', e.toString(), e.fileName, e.lineNumber);
    }
    return service;
};

module.exports = {
    setTestModeCredentials: setTestModeCredentials
};
