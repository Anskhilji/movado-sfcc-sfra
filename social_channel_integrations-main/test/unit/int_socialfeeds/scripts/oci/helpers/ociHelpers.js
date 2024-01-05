'use strict';

var assert = require('chai').assert;
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();

var token = 'token';

var order = {
    productLineItems: {
        toArray: function(){return [{productID: 'id1', productName: 'product1', quantity: {getValue: gv => 1}}]}
    }
}

var locationMock = [{"id": "inventory_m","records": [{"sku": "id1","atf": 100.0,"ato": 100.0,"reserved": 0,"safetyStockCount": 0.0,"effectiveDate": "2023-12-31T14:23:35Z","futures": [],"onHand": 100.0}]}]

var ociHelpers = proxyquire('../../../../../../social_feeds/cartridges/int_socialfeeds/cartridge/scripts/oci/helpers/ociHelpers.js', {
    'dw/system/Site': {current: {getCustomPreferenceValue: function(){return 'refArch-inventory-oci'}}},
    '../util/helpers': {getConfigCO: function(){return {custom:{LocationIds:'location1'}}}, getAccessToken: f => token, getOrgId: f=> 'orgId'},
    '../services/ServiceMgr': {
        getReservationService: function(){return{call: function(){return {result: 'reserved'}}}},
        getAvailabilityService: function(){return{call: function(){return {ok: true, object: {groups:[], locations:locationMock}, result: 'availabilityObject'}}}}
    },
    'dw/util/UUIDUtils': {createUUID:f => 'd195bb36-3c5c-11ee-be56-0242ac120002'}
});

describe('OCI Service', function () {
    it('It should make products reservations on OCI', function () {
        var requestReservation = {};
        var call = ociHelpers.makeProductsReservation(requestReservation, token);
        assert.equal(call.result, "reserved");
    });

    it('It should get the product availability', function () {
        var call = ociHelpers.getProductAvailabilityOCI(order, token);
        assert.isTrue(call.allProductsAvailable);
        assert.isArray(call.requestReservation.locations);
        assert.equal(call.requestReservation.locations[0].id, "inventory_m");
        assert.equal(call.requestReservation.locations[0].reservations[0].sku, "id1");
        assert.equal(call.requestReservation.locations[0].reservations[0].quantity, 1);
    });

    it('It should returns an access token to use with the OCI integration calls', function () {
        var result = ociHelpers.getOCIAuthentication();
        assert.equal(result, token);
    });
});