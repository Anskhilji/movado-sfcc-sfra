'use strict';

var assert = require('chai').assert;
var mockStoreHelper = require('../../../../../mocks/helpers/mockStoreHelper');
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();

describe('customStoreHelper', function () {
    describe('getStores', function () {

        var radiusOptions = [15, 30, 50, 100, 300];

        it('should return store model when search include postal_code, city or state as search parameter. NO latitude/longitude, or geolocation', function () {
        var url = '/on/demandware.store/Sites-MovadoUS-Site/default/Stores-FindStores';
        var radius = 15;
        var address = 'Boston';
        var countryCode='US';
        var geolocation = {
            latitude: 42.52,
            longitude: -71.13758
        };
        var googleServiceLat = 42.5273334;
        var googleServiceLng = -71.13758250000001;
        var showMap = true;
        var status = null;

        var expectedStoreModel = {
        stores: [
            {
                ID: 'Any ID',
                name: 'Downtown TV Shop',
                address1: '333 Washington St',
                address2: '',
                city: 'Boston',
                latitude: 42.5273334,
                longitude: -71.13758250000001,
                postalCode: '01803',
                phone: '333-333-3333',
                stateCode: 'MA',
                countryCode: 'US',
                storeHours: 'Mon - Sat: 10am - 9pm'
            }
        ],
        locations: '[{"name":"Downtown TV Shop","latitude":42.5273334,"longitude":-71.13758250000001,"infoWindowHtml":"someString"}]',
        searchKey: {
            lat: 42.5273334,
            long: -71.13758250000001
        },
        radius: radius,
        actionUrl: url,
        googleMapsApi: 'testKey',
        radiusOptions: radiusOptions,
        storesResultsHtml: 'someString'
        };

        var object =  proxyquire('../../../../../../cartridges/app_custom_movado/cartridge/scripts/helpers/customStoreHelper', {
                    '*/cartridge/models/stores' : mockStoreHelper.StoresModel,
                    'dw/web/Resource': mockStoreHelper.Resource,
                    'dw/catalog/StoreMgr' : mockStoreHelper.StoreMgr,
                    'dw/system/Site' : mockStoreHelper.Site,
                    'dw/web/URLUtils': mockStoreHelper.URLUtils
                });

        var storeObject = object.getStores(radius, googleServiceLat, googleServiceLng, geolocation, countryCode, showMap, url, status)
        assert.deepEqual(storeObject, expectedStoreModel);
        });

        it('should return store model when geolocation is used', function () {
        var url = '/on/demandware.store/Sites-MovadoUS-Site/default/Stores-FindStores';
        var radius = 15;
        var address = null;
        var countryCode='US';
        var geolocation = {
            latitude:42.52,
            longitude:-71.13758
        };
        var googleServiceLat = null;
        var googleServiceLng = null;
        var showMap = true;
        var status = null;

        var expectedStoreModel = {
            stores: [
                {
                    ID: 'Any ID',
                    name: 'Downtown TV Shop',
                    address1: '333 Washington St',
                    address2: '',
                    city: 'Boston',
                    latitude: 42.5273334,
                    longitude: -71.13758250000001,
                    postalCode: '01803',
                    phone: '333-333-3333',
                    stateCode: 'MA',
                    countryCode: 'US',
                    storeHours: 'Mon - Sat: 10am - 9pm'
                }
            ],
            locations: '[{"name":"Downtown TV Shop","latitude":42.5273334,"longitude":-71.13758250000001,"infoWindowHtml":"someString"}]',
            searchKey: {
                lat: 42.5273334,
                long: -71.13758250000001
            },
            radius: radius,
            actionUrl: url,
            googleMapsApi: 'testKey',
            radiusOptions: radiusOptions,
            storesResultsHtml: 'someString'
        };

        var object =  proxyquire('../../../../../../cartridges/app_custom_movado/cartridge/scripts/helpers/customStoreHelper', {
                        '*/cartridge/models/stores' : mockStoreHelper.StoresModel,
                        'dw/web/Resource': mockStoreHelper.Resource,
                        'dw/catalog/StoreMgr' : mockStoreHelper.StoreMgr,
                        'dw/system/Site' : mockStoreHelper.Site,
                        'dw/web/URLUtils': mockStoreHelper.URLUtils
                    });

            var storeObject = object.getStores(radius, googleServiceLat, googleServiceLng, geolocation, countryCode, showMap, url, status)
            assert.deepEqual(storeObject, expectedStoreModel);
        });

        it('should not return store model when country AND (state OR ZipCode) combination is wrong', function () {
            var url = '/on/demandware.store/Sites-MovadoUS-Site/default/Stores-FindStores';
            var radius = 15;
            var address = 'Gurgaon';
            var countryCode='US';
            var geolocation = {}
            var googleServiceLat = null;
            var googleServiceLng = null;
            var showMap = true;
            var status = 'ZERO_RESULTS';

            var expectedStoreModel = {
                stores: '',
                locations: [],
                radius: radius,
                actionUrl: url,
                googleMapsApi: 'testKey',
                radiusOptions: radiusOptions,
                storesResultsHtml: ''
            };

            var object = proxyquire('../../../../../../cartridges/app_custom_movado/cartridge/scripts/helpers/customStoreHelper', {
                        '*/cartridge/models/stores' : mockStoreHelper.StoresModel,
                        'dw/web/Resource': mockStoreHelper.Resource,
                        'dw/catalog/StoreMgr' : mockStoreHelper.StoreMgr,
                        'dw/system/Site' : mockStoreHelper.Site,
                        'dw/web/URLUtils': mockStoreHelper.URLUtils
            });

            var storeObject = object.getStores(radius, googleServiceLat, googleServiceLng, geolocation, countryCode, showMap, url, status)
            assert.deepEqual(storeObject, expectedStoreModel);
        });

 });
});

describe('createStoresResultsHtml', function () {
    it('should return the rendered HTML', function () {
        var stores = [
            {
                ID: 'storeId00001',
                name: 'Downtown TV Shop'
            },
            {
                ID: 'storeId00002',
                name: 'Uptown TV Shop'
            },
            {
                ID: 'storeId00001',
                name: 'Midtown TV Shop'
            }
        ];

        var renderedHtml = mockStoreHelper.createStoresResultsHtml(stores);
        assert.equal(renderedHtml, 'rendered html');
    });
});