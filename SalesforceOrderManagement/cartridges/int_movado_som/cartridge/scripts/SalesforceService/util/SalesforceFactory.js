'use strict';

/**
 *   Name: SalesforceFactory
 */

/* API Modules */
var Logger = require('dw/system/Logger');

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
        COMMERCE: '/services/data/v49.0/commerce',
        FULFILLMENTORDER: '/services/data/v49.0/sobjects/FulfillmentOrder',
        FULFILLMENTORDERLINEITEM: '/services/data/v49.0/sobjects/FulfillmentOrderLineItem',
        FULFILLMENTSTATUSCHANGE: '/services/data/v49.0/sobjects/Fulfillment_Status_Change__e',
        SHIPMENT: '/services/data/v49.0/sobjects/Shipment'
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
        var requestData = [
            {
                method: 'PATCH',
                url: this.ENDPOINTS.FULFILLMENTORDER + order.PONumber,
                referenceId: 'FulfillmentOrder'
            }
        ];

        return requestData;
    }
};

module.exports = SalesforceFactory;
