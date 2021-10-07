/* global describe, it*/
'use strict';

/* eslint-disable no-undef */

var assert = require('chai').assert;
var proxyrequire = require('proxyquire').noCallThru().noPreserveCache();
var CustomObjectMock = require('../../../../../../mocks/utils/clydeCustomObject.js');
var baseModel = require('../../../../../../mocks/models/clydeBaseModel.js');
var properties = require('../../../../../../mocks/factories/attributeFilters');

describe('ClydeProductModel', function () {
    var PrdModel = proxyrequire('../../../../../../../cartridges/bc_clyde/cartridge/scripts/models/products/clydeProductModel.js', {
        '~/cartridge/scripts/models/products/clydeBaseModel': baseModel,
        '~/cartridge/scripts/utils/clydeCustomObject': CustomObjectMock,
        '~/cartridge/scripts/factories/products/attributeFilters': properties
    });
    it('should return payload for product export ', function () {
        var params = {
            isDryRun: false
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
            }
        };
        var productModel = new PrdModel(params, jobStepExecution);
        var payload = productModel.getPayload(product);
        assert.isObject(payload);
    });
});
