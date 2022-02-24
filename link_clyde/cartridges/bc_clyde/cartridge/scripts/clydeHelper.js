'use strict';

const Logger = require('dw/system/Logger');
const log = Logger.getLogger('CLYDE');
const CustomObjectMgr = require('dw/object/CustomObjectMgr');
const Transaction = require('dw/system/Transaction');
const Calendar = require('dw/util/Calendar');
const StringUtils = require('dw/util/StringUtils');

const DATE_FORMAT = 'yyyy-MM-dd\'T\'HH:mm:ss';
/*
 * helper library for Clyde cartridge
 * use as require('bc_clyde/cartridge/scripts/clydeHelper');
 */

const clydeHelper = {

    METHOD: {
        PRODUCTS: 'products',
        BULKPRODUCTS: 'products/bulk',
        ORDERS: 'orders',
        CONTRACTS: 'contracts'
    },
    HTTP_METHOD: {
        GET: 'GET',
        POST: 'POST',
        DELETE: 'DELETE',
        PUT: 'PUT'
    },
    /*
     * Service Interface for Clyde APIs
     * @param {string} httpMethod - http method  used to make API calls.
     * @param {string} serviceMethod - service method used to make API calls.
     * @param {string} serviceMethod - service method  used to make API calls.
     * @param {object} request -  request object used to send to API.
     * @returns {serviceResult} service result from API..
     */
    clydeServiceCall: function (httpMethod, serviceMethod, request) {
        var service = require('~/cartridge/scripts/services/serviceInit');
        var serviceResult;
        try {
            serviceResult = service.call({
                httpMethod: httpMethod,
                method: serviceMethod,
                request: request ? JSON.stringify(request) : null
            });

            if (serviceResult !== null && serviceResult.ok) {
                return serviceResult.object ? serviceResult.object.statusCode : serviceResult.msg;
            }
        } catch (e) {
            log.error('Exception occurred for service {0}, Error: {1} ', serviceMethod, e);
            return e;
        }
        log.error('Error on {0} method; Error {1} ', serviceMethod, serviceResult);
        return serviceResult;
    },
    /**
     * GetClydeCustomObject to get current customObject
     * @param {CustomObject} clydeCustomObj - CustomObject.
     * @param {CustomObject} key - CustomObject.
     * @returns {CustomObject} return the current customObject.
     */
    getClydeCustomObject: function (clydeCustomObj, key) {
        var currentCustomObj;
        if (clydeCustomObj || key) {
            try {
                currentCustomObj = CustomObjectMgr.getCustomObject(clydeCustomObj, key);
                if (!currentCustomObj) {
                    Logger.info('orderHepler.getClydeCustomObject: no custom object found with ID = {0}, but created new one.', key);
                    Transaction.begin();
                    currentCustomObj = CustomObjectMgr.createCustomObject(clydeCustomObj, key);
                    Transaction.commit();
                }
            } catch (ex) {
                Logger.error('Error on getting getClydeCustomObject: ' + ex.message);
            }
        }
        return currentCustomObj;
    },
    /**
    * Convert the given date mysql format date 'yyyy-MM-dd\'T\'HH:mm:ss'
    * @param {Date} inputDate - source date which need to be converted.
    * @returns {Date} return the formatted date.
    * Ex: Convert the date from "Mon Nov 11 2019 13:06:44 GMT-0000" to "2019-11-11T07:51:28"
    */
    getFormattedDate: function (inputDate) {
        let targetDate;
        if (inputDate) {
            targetDate = new Calendar(inputDate);
        }
        return StringUtils.formatCalendar(targetDate, DATE_FORMAT);
    },
    /**
     * Method to get the past date for the given days (since date)
     * @param {number} days - Number of days for which behind date need to be find.
     * @returns {Date} return the from date.
     */
    getDateForDays: function (days) {
        var cal;
        const queryDateFormat = DATE_FORMAT;
        if (days) {
            cal = new Calendar();
            cal.add(Calendar.DATE, -1 * days);
        }

        return StringUtils.formatCalendar(cal, queryDateFormat);
    }
};

module.exports = clydeHelper;
