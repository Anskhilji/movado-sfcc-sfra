'use strict';

var assert = require('chai').assert;
var mocksearchRefinement = require('../../../../../mocks/helpers/mocksearchRefinement');
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();

describe('searchRefinement',() => {

    describe('get',() => {

        it('First test case',() => {


            var refinementDefinition = {
                attributeID : "rndomattributre"
            };

            var object =  proxyquire('../../../../../../cartridges/app_custom_movado/cartridge/scripts/factories/searchRefinements', {
                'dw/system/Site' : mocksearchRefinement.Site,
                '*/cartridge/scripts/util/collections':{}
            });

            var get = object.get(productSearch, refinementDefinition, refinementValues);

        });

        it('First test case',() => {


        });

        it('First test case',() => {


        });



    });






});
