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
            this.isFullExport = /productfull/i.test(jobID);
            this.sitePreferenceID = params.get('sitePreferenceID').valueOf();
            this.newExport = params.get('newExport').valueOf();
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
        var productPriceInfo = record.getPriceModel().getPriceInfo();
        var priceBookLastModified = null;
        var lastJobSyceTime = require('*/cartridge/scripts/utils/clydeSitePreferences').getSitePreferenceValue(this.sitePreferenceID);

        if (!empty(productPriceInfo)) {
            priceBookLastModified = productPriceInfo.priceBook.lastModified.getTime();
        }

        if (this.newExport) {
            this.newProduct = true;
            var productCreationDate = record.getCreationDate();
            return lastJobSyceTime <= productCreationDate;
        } else { // eslint-disable-line
            this.newProduct = false;
        }

        return record.lastModified.getTime() > lastJobSyceTime || priceBookLastModified > lastJobSyceTime;
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
        let obj = {
            name: returnValue.title,
            type: returnValue.category,
            sku: returnValue.id,
            description: returnValue.description,
            manufacturer: returnValue.manufacturer,
            price: returnValue.price,
            imageLink: returnValue.image
        };

        if (returnValue.hasOwnProperty('variationAttributes')) {  // eslint-disable-line no-prototype-builtins
            obj.attributes = {
                size: returnValue.variationAttributes.hasOwnProperty('size') ? returnValue.variationAttributes.size : '', // eslint-disable-line no-prototype-builtins
                color: returnValue.variationAttributes.hasOwnProperty('color') ? returnValue.variationAttributes.color : '' // eslint-disable-line no-prototype-builtins
            };
        }

        return obj;
    }
};

module.exports = BaseModel;
