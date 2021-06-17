
'use strict';

var storeHelpers = require('*/cartridge/scripts/helpers/customStoreHelper');
var googleService = require('*/cartridge/scripts/googleMapService');

var ZERO_RESULTS = 'ZERO_RESULTS';

function getStores (radius, geolocation, zipCode){
    var stores = null;
    var status = null;
    var showMap = false;
    var queryCountryCode = 'undefiend';
    if (zipCode) {
        //Custom Start: Updated the regex of the zipCode
        zipCode = zipCode.replace(/[\s,]+/g, '+').trim();
        //Custom End
    }

    if (zipCode && queryCountryCode) {
        var params = {
            countryCodeFromRequest: queryCountryCode,
            address: zipCode
        };

        var googleServiceObject = googleService.getCoordinates();
        googleServiceObject.setURL(googleServiceObject.getURL() + '&address=' + params.address);
        var googleServiceResultObj = googleServiceObject.call(params);

        //Custom Start: Initialize the status variable
        status = googleServiceResultObj.object.status;
        //Custom End

        if (googleServiceResultObj.status === 'OK' && googleServiceResultObj.object.status !== ZERO_RESULTS) {
            var googleServiceResult = googleServiceResultObj.object.results[0];

            if (googleServiceResult) {
                stores = storeHelpers.getStores(radius,
                    googleServiceResult.geometry.location.lat,
                    googleServiceResult.geometry.location.lng,
                    geolocation,
                    queryCountryCode,
                    showMap,
                    null,
                    status);
            }
        } else if (googleServiceResultObj && (googleServiceResultObj.status !== 'OK' || googleServiceResultObj.object.status === ZERO_RESULTS)) {
            status = googleServiceResultObj.object.status;
            stores = storeHelpers.getStores(radius, null, null, null, null, showMap, null, googleServiceResultObj.object.status);
        } else {
            stores = storeHelpers.getStores(radius, null, null, geolocation, null, showMap, null, status);
        }
    } else {
        stores = storeHelpers.getStores(radius, null, null, geolocation, null, showMap, null, status);
    }
    return stores;
}

module.exports = {
    getStores: getStores,
};