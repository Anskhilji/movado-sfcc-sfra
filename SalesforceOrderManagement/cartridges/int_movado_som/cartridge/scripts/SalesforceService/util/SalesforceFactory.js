'use strict';

/**
 *   Name: SalesforceFactory
 */

/* API Modules */
var Logger = require('dw/system/Logger');
const APIROOT = '/services/data/v52.0';

// Public

var SalesforceFactory = {
    // Service Actions
    ACTIONS: {
        AUTHORIZE: 'AUTHORIZE',
        COMPOSITE: 'COMPOSITE',
        REST: 'REST'
    },

    // Service IDs
    SERVICES: {
        login: 'salesforce.login',
        composite: 'salesforce.composite',
        rest: 'salesforce.rest'
    },

    ENDPOINTS: {
        COMMERCE: APIROOT + '/commerce',
        ORDERSUMMARY: APIROOT + '/sobjects/OrderSummary',
        FRAUDSTATUS: '/services/apexrest/ordersummaryupdatefraudstatus',
        FULFILLMENTORDER: APIROOT + '/sobjects/FulfillmentOrder',
        FULFILLMENTORDERLINEITEM: APIROOT + '/sobjects/FulfillmentOrderLineItem',
        FULFILLMENTSTATUSCHANGE: APIROOT + '/sobjects/Fulfillment_Status_Change__e',
        FULFILLMENTITEMCANCEL: APIROOT + '/sobjects/Item_Cancellation__e',
        SHIPMENT: APIROOT + '/sobjects/Shipment',
        CANCELLATIONEMAIL: '/services/apexrest/ordercancellationemail',
        SAPORDERREFUND: '/services/apexrest/saporderrefund',
        CUSTOMERORDERHISTORY: '/services/apexrest/orderhistory',
        OPERATIONLOG: APIROOT + '/sobjects/Operation_Log__c'
    },

    /**
     * @name getLogger
     * @desc returns the Salesforce  logger
     * @param {string} method name of the logger you want to use
     * @returns {dw.system.Logger} returns the logger
     */
    getLogger: function (method) {
        var categoryName = method !== null ? method : 'Salesforce_General';
        var fileName = 'Salesforce';
        return Logger.getLogger(fileName, categoryName);
    },

    /**
     * @name buildCreateSalesforceLoginRequestContainer
     * @returns {Object} requestDataContainer
     */
    buildCreateSalesforceLoginRequestContainer: function () {
        var requestDataContainer = {
            action: this.ACTIONS.AUTHORIZE,
            requestMethod: 'POST',
            params: {
                grant_type: 'password',
                client_id: '',
                client_secret: '',
                username: '',
                password: ''
            }
        };

        return requestDataContainer;
    },

    buildCreateSalesforceCompositeRequestContainer: function (allOrNone, compositeRequestData) {

        var requestDataContainer = {
            action: this.ACTIONS.COMPOSITE,
            requestMethod: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            requestData: {
                allOrNone: allOrNone,
                compositeRequest: compositeRequestData
            }
        };

        return requestDataContainer;
    },

    buildCreateSalesforceRestRequestContainer: function (restRequestData) {
        var requestDataContainer = {
            action: this.ACTIONS.REST,
            url: restRequestData.url,
            requestMethod: restRequestData.requestMethod || 'GET',
            headers: {
                'Content-Type': 'application/json'
            },
            requestData: restRequestData.requestData
        };

        return requestDataContainer;

    },

    buildFulfillmentOrderCompositeRequestData: function (order) {
        var requestData = [{
            method: 'PATCH',
            url: this.ENDPOINTS.FULFILLMENTORDER + order.PONumber,
            referenceId: 'FulfillmentOrder'
        }];

        return requestData;
    }

};

module.exports = SalesforceFactory;
