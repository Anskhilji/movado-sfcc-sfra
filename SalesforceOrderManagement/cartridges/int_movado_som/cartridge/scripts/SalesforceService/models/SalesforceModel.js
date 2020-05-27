'use strict';

/* Modules */
var SalesforceFactory = require('*/cartridge/scripts/SalesforceService/util/SalesforceFactory');
var SalesforceService = require('*/cartridge/scripts/SalesforceService/service/SalesforceService');
var SalesforceServicesUtils = require('*/cartridge/scripts/SalesforceService/util/SalesforceServiceUtils');

/* Services */
var SalesforceLoginService = SalesforceService.getSalesforceLoginService();
var SalesforceCompositeService = SalesforceService.getSalesforceCompositeService();
var SalesforceRestService = SalesforceService.getSalesforceRestService();

var SalesforceModel = ({

    /**
     * @name createSalesforce
     * @desc
     * @return {dw.svc.Result} Service result
     */
    createSalesforceLogin: function () {
        var requestDataContainer = SalesforceFactory.buildCreateSalesforceLoginRequestContainer();
        var createSalesforceLoginResult = SalesforceLoginService.call(requestDataContainer);

        return createSalesforceLoginResult;
    },
    createSalesforceCompositeRequest: function (allOrNone, compositeRequestData) {
        var setAccessToken = SalesforceServicesUtils.getAccessToken();
        var createSalesforceCompositeResult;

        if (Object.hasOwnProperty.call(setAccessToken, 'token')) {
            var requestDataContainer = SalesforceFactory.buildCreateSalesforceComposteRequestContainer(allOrNone, compositeRequestData);
            createSalesforceCompositeResult = SalesforceCompositeService.call(requestDataContainer);
        }

        return createSalesforceCompositeResult;
    },
    createSalesforceRestRequest: function (restRequestData) {
        var setAccessToken = SalesforceServicesUtils.getAccessToken();
        var createSalesforceCompositeResult;

        if (Object.hasOwnProperty.call(setAccessToken, 'token')) {
            var requestDataContainer = SalesforceFactory.buildCreateSalesforceRestRequestContainer(restRequestData);
            createSalesforceCompositeResult = SalesforceRestService.call(requestDataContainer);
        }

        return createSalesforceCompositeResult;
    }
});

module.exports = SalesforceModel;
