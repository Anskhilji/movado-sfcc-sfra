'use strict';

var assert = require('chai').assert;
var mockGoogleMapService = require('../../../../mocks/helpers/mockGoogleMapService');
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();

describe('googleMapService',() => {

    describe('getCoordinates',() => {

        it('should be able to get coordinates using local service registry',() => {
            var object =  proxyquire('../../../../../cartridges/app_custom_movado/cartridge/scripts/googleMapService', {
                'dw/svc/LocalServiceRegistry' : mockGoogleMapService.LocalServiceRegistry
            });

            var serviceCoordinates = object.getCoordinates();
            assert.equal(serviceCoordinates,"googleMapServiceCreated");
        }

        );

    }

    );
});