var assert = require('chai').assert;
var request = require('request-promise');
var config = require('../it.config');
var chai = require('chai');
var chaiSubset = require('chai-subset');
chai.use(chaiSubset);

describe('Add product to cart', function () {
    var cookieJar = request.jar();

    it('should verify that product is added to the cart', function () {
    this.timeout(10000);
        var qty1 = 1;
        var variantPid = '701644329402M';
        var addToCartRequest = {
            url: '',
            method: 'POST',
            rejectUnauthorized: false,
            resolveWithFullResponse: true,
            jar: cookieJar,
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            }
        };

        addToCartRequest.url = config.baseUrl + '/Cart-AddProduct';
        addToCartRequest.form = {
            pid: variantPid,
            quantity: qty1,
            options: []
        };
        return request(addToCartRequest)
            .then(function (response) {
                var bodyAsJson = JSON.parse(response.body);
                assert.property(bodyAsJson, 'cart');
                assert.property(bodyAsJson.cart, 'items');
                assert.equal(bodyAsJson.cart.items.length, 1);
                assert.equal(bodyAsJson.cart.items[0].id, '701644329402M');
            });
    });
});