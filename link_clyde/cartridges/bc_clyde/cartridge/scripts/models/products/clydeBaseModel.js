/**
 * Base Export Module Implementation
 * @module
 */
'use strict';

/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
/* eslint-disable no-param-reassign */

let logger = require('dw/system/Logger').getLogger('CLYDE', 'ClydeBaseModel');
let productProperty = require('~/cartridge/scripts/factories/products/attributeFilters');
/**
 * @class
 * @param {Object} params - initialization params
 * @param {Object} jobStepExecution - jobID
 */
let BaseModel = function (params, jobStepExecution) {
    this.initialize(params, jobStepExecution);
    this.productPropertyFunctions = productProperty.productPropertyFunctions;
};

BaseModel.prototype = {
    /**
    * Function that initialize inner object properties
    * @param {Object} params - product for verification
    * @param {Object} jobStepExecution - jobID
    */
    initialize: function (params, jobStepExecution) {
        try {
            let jobID = 'jobID' in jobStepExecution.jobExecution ? jobStepExecution.jobExecution.jobID : '';
            this.isFullExport = jobID.toLowerCase().indexOf('delta') === -1;
            this.jobCustomObjectWrapper.getCO();
        } catch (e) {
            logger.error(e.toString());
        }
    },
    /**
     * Function that generates payload for passed object
     * @param {Object} item - prepared object with function mixins and objects what will be passed to these mixins
     * @param {Object} result - result object
     * @returns {Object} key and generated value from mixins
     *
     */
    describeModel: function (item, result) {
        return Object.keys(item.functions).reduce(function (res, current) {
            try {
                if (typeof item.functions[current] === 'function') {
                    res[current] = item.functions[current].apply(null, item.object);
                } else {
                    logger.error('Key {0} - is not a function. Skipping attribute', current);
                }
            } catch (e) {
                logger.error('Key {0}. Errors: {1}', current, e.toString());
            }
            return res;
        }, result);
    },
    /**
     * Function that create payload based on passed object
     * @param {Object} item - prepared object with function mixins and objects what will be passed to these mixins
     * @param {Object} result - result object
     * @returns {Object} payload based on input object
     */
    fullExport: function () {
        var self = this;
        return self.describeItem.apply(self, arguments).reduce(function (result, current) {
            return self.describeModel(current, result);
        }, {});
    },
    /**
     * Function that check if object could be exported
     * @param {dw.catalog.Product} record - object from what mixins will be created
     * @returns {boolean} true if passed object is ready for export either result will be false
     */
    isReadyToExport: function (record) {
        let productPriceInfo = record.getPriceModel().getPriceInfo();
        let priceBookLastModified;
        if (!empty(productPriceInfo)) {
            priceBookLastModified = productPriceInfo.priceBook.lastModified.getTime();
        }
        if (record.lastModified.getTime() > this.jobCustomObjectWrapper.getTime().getTime()) {
            this.newProduct = record.creationDate.getTime() > this.jobCustomObjectWrapper.getTime().getTime();
        }
        return record.lastModified.getTime() > this.jobCustomObjectWrapper.getTime().getTime() || priceBookLastModified > this.jobCustomObjectWrapper.getTime().getTime();
    },
    /**
     * Function that generates payload based on module parameters
     * @param {dw.catalog.Product} product - object from what mixins will be created
     * @returns {Object} final payload or null if object doesn't ready for export
     */
    getPayload: function (product) {
        var returnValue = null;
        if (this.isFullExport) {
            returnValue = this.fullExport(product);
        } else {
            returnValue = this.deltaExport(product);
        }
        return returnValue;
    },
    /**
     * Function that save custom object
     */
    saveCO: function () {
        this.jobCustomObjectWrapper.saveCO();
    },
    /**
     * Function to prepare product request
     * @param {Object} returnValue - ready to export products
     * @returns {Object} final request to be send to clyde
     */
    prepareRequest: function (returnValue) {
        if (empty(returnValue)) {
            return null;
        }
        let request;
        let productRequest;
        if (!this.isFullExport) {
            const clydeHelper = require('~/cartridge/scripts/clydeHelper');
            if (!this.newProduct) {
                request = {
                    data: {
                        type: 'product',
                        attributes: {
                            description: returnValue.description,
                            price: returnValue.price
                        }
                    }
                };
                productRequest = {
                    request: request,
                    serviceMethod: clydeHelper.METHOD.PRODUCTS + '/' + returnValue.id,
                    httpMethod: clydeHelper.HTTP_METHOD.PUT
                };
            } else {
                request = {
                    data: {
                        type: 'product',
                        attributes: this.getAttributeValue(returnValue)
                    }
                };
                productRequest = {
                    request: request,
                    serviceMethod: clydeHelper.METHOD.PRODUCTS,
                    httpMethod: clydeHelper.HTTP_METHOD.POST
                };
            }
        } else if (Array.isArray(returnValue)) {
            productRequest = {
                data: {
                    type: 'products',
                    attributes: {
                        products: returnValue
                    }
                }
            };
        } else {
            productRequest = this.getAttributeValue(returnValue);
        }
        return productRequest;
    },
    /**
     * Function to return attribute part of the request
     * @param {Object} returnValue - ready to export products
     * @returns {Object} JSON body for attributes
     */
    getAttributeValue: function (returnValue) {
        return {
            name: returnValue.title,
            type: returnValue.category,
            sku: returnValue.id,
            description: returnValue.description,
            manufacturer: returnValue.manufacturer,
            price: returnValue.price,
            imageLink: returnValue.image,
            attributes: {
                size: !empty(returnValue.variationAttributes[1]) ? returnValue.variationAttributes[1].value : '',
                color: !empty(returnValue.variationAttributes[0]) ? returnValue.variationAttributes[0].value : ''
            }
        };
    }
};

module.exports = BaseModel;
