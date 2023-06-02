'use strict';

var Logger = require('dw/system/Logger');
var Site = require('dw/system/Site');

var constants = require('*/cartridge/scripts/helpers/constants');

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


// Converts numeric degrees to radians
function toRad(Value) {
    return Value * Math.PI / 180;
}

/**
 * Calculate the distance between current location and store
 * @param {number} lat1 - latitude of store location
 * @param {number} lon1 - longitude of current location
 * @param {number} lat2 - latitude of store location
 * @param {number} lon2 - longitude of current location
 * @returns {number} distance between current location and store
 */
function calculateRad(lat1, lon1, lat2, lon2, distanceUnit) {
    var earthRadius = distanceUnit == constants.DISTANCE_IN_MILES ? constants.EARTH_RADIUS_IN_MILES : constants.EARTH_RADIUS_IN_KM; // miles
    var latRadians = toRad(lat2 - lat1);
    var lonRadians = toRad(lon2 - lon1);
    var lat1 = toRad(lat1);
    var lat2 = toRad(lat2);

    var area = Math.sin(latRadians / 2) * Math.sin(latRadians / 2) +
        Math.sin(lonRadians / 2) * Math.sin(lonRadians / 2) * Math.cos(lat1) * Math.cos(lat2);
    var circumference = 2 * Math.atan2(Math.sqrt(area), Math.sqrt(1 - area));
    var radius = Math.round(earthRadius * circumference);
    return radius + ' ' + distanceUnit.toUpperCase();
}
module.exports = {
    setTestModeCredentials: setTestModeCredentials,
    calculateRad: calculateRad
};
