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
    product: require('~/cartridge/scripts/models/products/clydeProductModel')
};
/**
 * @class
 * @param {Object} params - initialization params
 * @param {Object} jobStepExecution - jobID
 */
let ExportModel = function (params, jobStepExecution) {
    var model = !empty(models.product) ? new models.product(params, jobStepExecution) : null;
    var searchModel = !empty(searchFactory.productSearchModel) ? new searchFactory.productSearchModel(params, jobStepExecution) : null;

    return {
        getNextItem: function () {
            return searchModel ? searchModel.getNext() : undefined;
        },
        getProcessed: function (item) {
            return model ? model.getPayload(item) : undefined;
        },
        getRequest: function (obj) {
            return model ? model.prepareRequest(obj) : undefined;
        },
        saveCustomObject: function () {
            return model ? model.saveCO() : undefined;
        }
    };
};

module.exports = ExportModel;
