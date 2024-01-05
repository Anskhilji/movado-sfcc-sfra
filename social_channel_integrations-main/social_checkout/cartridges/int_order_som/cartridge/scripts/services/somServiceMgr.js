'use strict';

/**
 * SOM Services Manager
 */

var LocalServiceRegistry = require('dw/svc/LocalServiceRegistry');
var rest = require('~/cartridge/scripts/services/somServiceDefinitions');

var somPreferences = require('~/cartridge/config/somPreferences');
var SOM_SERVICE_ID = somPreferences.somServiceID;

/**
 * Returns the service related to the given {serviceID} initialized with the given {definition}
 * @param {string} serviceID - service id
 * @param {Object} definition - definition object
 *
 * @returns {dw/svc/Service} service instance
 */
function getService(serviceID, definition) {
    return LocalServiceRegistry.createService(serviceID, definition);
}

module.exports = {
    restEndpoints: rest.endpoints,

    /**
     * Returns a new instance of the SOM REST Service initialized with the {composite} definitions
     * @returns {dw/svc/Service} service instance
     */
    restComposite: function () {
        return getService(SOM_SERVICE_ID, rest.definitions.composite);
    },
    restApi: function (url) {
        return getService(SOM_SERVICE_ID, rest.definitions.api(url));
    }
};
