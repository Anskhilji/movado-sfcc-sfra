/**
 * Product Export Module Implementation
 * @module
 */
'use strict';
/* eslint-disable no-undef */
/* eslint-disable new-cap */

let searchFactory = {
    productSearchModel: require('~/cartridge/scripts/factories/products/clydeProductSearch')
};

let models = {
    product: require('~/cartridge/scripts/models/products/clydeProductModel'),
    clydeSitePreference: require('~/cartridge/scripts/utils/clydeSitePreferences')
};

/**
 * @class
 * @param {Object} params - initialization params
 * @param {Object} jobStepExecution - jobID
 * @param {Object} jobStartDateAndTime - job Starting Sate And Time
 *
 */
let ExportModel = function (params, jobStepExecution, jobStartDateAndTime) {
    var model = !empty(models.product) ? new models.product(params, jobStepExecution) : null;
    var searchModel = !empty(searchFactory.productSearchModel) ? new searchFactory.productSearchModel(params, jobStepExecution) : null;

    return {
        getNextItem: function () {
            return searchModel ? searchModel.getNext() : null;
        },
        getCounter: function () {
            return searchModel ? searchModel.getCounter() : 0;
        },
        getProcessed: function (item) {
            return model ? model.getPayload(item) : null;
        },
        getRequest: function (obj) {
            return model ? model.prepareRequest(obj) : null;
        },
        getSitePreference: function () {
            return models.clydeSitePreference.getSitePreferenceValue(params.sitePreferenceID);
        },
        setSitePreference: function () {
            return models.clydeSitePreference.setSitePreferenceValue(params.sitePreferenceID, jobStartDateAndTime);
        }
    };
};

module.exports = ExportModel;
