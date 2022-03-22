/* global describe, it*/
'use strict';

/* eslint-disable no-undef */

var assert = require('chai').assert;
var proxyrequire = require('proxyquire').noCallThru().noPreserveCache();
var baseModel = require('../../../../../../mocks/models/clydeBaseModel.js');
var properties = require('../../../../../../mocks/factories/attributeFilters');

describe('ClydeProductModel', function () {
    var PrdModel = proxyrequire('../../../../../../../cartridges/bm_clyde/cartridge/scripts/models/products/clydeProductModel.js', {
        '~/cartridge/scripts/models/products/clydeBaseModel': baseModel,
        '~/cartridge/scripts/factories/products/attributeFilters': properties
    });
    it('should return payload for product export ', function () {
        var params = {
            isDryRun: false,
            deltaImport: true
        };
        var jobStepExecution = {
            jobExecution: {
                jobID: 'full'
            }
        };
        var product = {
            ID: 'SKU789',
            name: 'Clyde Couch',
            manufacturer: 'Clyde Couch Co.',
            barcode: 'couch99',
            shortDescription: 'Test shortDescription',
            price: 43.45,
            imageLink: 'clydeimagehosting.com/SKU789',
            image: 'large',
            attributes: {
                size: 'loveseat',
                color: 'purple'
            },
            priceBook : {
                lastModified: {
                    getTime: function () {
                        return '2021-08-1120T209920'
                    }
                }
            },
            lastModified: {
                getTime: function () {
                    return '2021-08-1120T209920'
                }
            },
            master: {
                ID: 'MasterTestId',
                name: 'Master Normal Product',
                manufacturer: 'Clyde Couch Co.',
                shortDescription: 'Test shortDescription',
                primary_category: 'primary',
                classification_category: 'classification',
                regular_category: ['regular']
            },
            getVariationModel: function () {
                return {
                    getMaster: function () {
                        return this.master ? master : null;
                    }
                };
            },
            getPriceModel: function () {
                return {
                    getPriceInfo: function () {
                        return this.priceBook;
                    }
                }
            }
        };
        var productModel = new PrdModel(params, jobStepExecution);
        var payload = productModel.getPayload(product);
        assert.isNull(payload);
    });
});
