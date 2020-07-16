'use strict';

var Site = require('dw/system/Site');

 function setTestModeCredentials (service) {

    var credentialID = service.getConfiguration().getCredential().ID;
    if (service && credentialID) {
        service = service.setCredentialID(credentialID + '.test');
    }
    
    return service;
};

module.exports = {
	setTestModeCredentials: setTestModeCredentials
};