/* eslint-disable no-mixed-spaces-and-tabs */
'use strict';

var localServiceRegistry = require('dw/svc/LocalServiceRegistry');

/**
 * Google MAP Geocode API to fetch the longitude and latitude of the city/state/zip.
 * @returns {string} Google Service Context.
 */
function getCoordinates() {
    var responseText = null;
    var googleMapService = localServiceRegistry.createService('GoogleMapService',
        {
            createRequest: function (svc, params) {
            },
            parseResponse: function (svc, response) {
                if (response.text != null) {
                    responseText = response.text;
                } else {
                    responseText = response.errorText;
                }
                return JSON.parse(responseText);
            }
        }
	);
    return googleMapService;
}

module.exports.getCoordinates = getCoordinates;
