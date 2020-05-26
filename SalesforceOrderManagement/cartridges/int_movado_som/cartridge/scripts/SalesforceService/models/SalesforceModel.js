'use strict';

/* Modules */
var SalesforceFactory = require('*/cartridge/scripts/SalesforceService/util/SalesforceFactory');
var SalesforceService = require('*/cartridge/scripts/SalesforceService/service/SaleforceService');
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
    createSaleforceCompositeRequest: function (allOrNone, compositeRequestData) {
        var setAccessToken = SalesforceServicesUtils.getAccessToken();
        var createSalesforceCompositeResult;

        if (Object.hasOwnProperty.call(setAccessToken, 'token')) {
            var requestDataContainer = SalesforceFactory.buildCreateSalesforceComposteRequestContainer(allOrNone, compositeRequestData);
            createSalesforceCompositeResult = SalesforceCompositeService.call(requestDataContainer);
        }

        return createSalesforceCompositeResult;
    },
    createSaleforceRestRequest: function (restRequestData) {
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
