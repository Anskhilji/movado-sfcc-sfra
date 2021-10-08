/**
 * @class ClydeCustomObect
 * This class create interface to work with SFCC custom objects
 */
'use strict';

/* eslint-disable no-undef */

const CustomObjectMgr = require('dw/object/CustomObjectMgr');
const Transaction = require('dw/system/Transaction');
const Site = require('dw/system/Site');

let log = require('dw/system/Logger').getLogger('CLYDE', 'ClydeCustomObject');

/**
 * @class
 * @param {string} type - name of custom object
 * @param {string} name - name of key
 */
let customObjectAPI = function (type, name) {
    /**
     * Private variable to store custom object
     * @private
     */
    let jobCustomObject = null;
    /**
     * Private variable to store custom object
     * @private
     */
    let coName = name;
    /**
     * Create Custom object based on value from constuctor
     * @private
     * @returns {dw.object.CustomObject} instance of Custom Object
     */
    function createCO() {
        return Transaction.wrap(function () {
            let CO = null;
            try {
                CO = CustomObjectMgr.createCustomObject(type, coName);
                CO.custom.clydeLastRunTime = Site.getCurrent().getCalendar().getTime();
            } catch (e) {
                log.error(e.toString());
            }
            return CO;
        });
    }
    /**
     * Private function for internal use
     * @private
     * @returns {dw.object.CustomObject} instance of Custom Object
     */
    function getCO() {
        jobCustomObject = CustomObjectMgr.getCustomObject(type, coName);
        if (empty(jobCustomObject)) {
            jobCustomObject = createCO();
        }
        return jobCustomObject;
    }
    /**
     * Save system date and time to custom object.
     * In case instance of Custom Object is not save into jobCustomObject
     * will create new Custom object
     * @private
     * @returns {void}
     */
    function saveCO() {
        if (empty(jobCustomObject)) {
            jobCustomObject = createCO();
        }
        Transaction.wrap(function () {
            try {
                if (!empty(jobCustomObject)) {
                    jobCustomObject.custom.clydeLastRunTime = Site.getCurrent().getCalendar().getTime();
                }
            } catch (e) {
                log.error(e.toString());
            }
        });
    }
    return {
        getCO: getCO,
        saveCO: saveCO,
        getTime: function () {
            return !empty(jobCustomObject) ? jobCustomObject.custom.clydeLastRunTime : null;
        }
    };
};

module.exports = customObjectAPI;
