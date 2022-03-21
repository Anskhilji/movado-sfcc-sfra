var assert = require('chai').assert;
var request = require('request-promise');
var config = require('../it.config');
var chai = require('chai');
var chaiSubset = require('chai-subset');
chai.use(chaiSubset);

describe('AddContract to cart', function () {
    var cookieJar = request.jar();

    var updateQuantity = {
        url: '',
        method: 'POST',
        rejectUnauthorized: false,
        resolveWithFullResponse: true,
        jar: cookieJar,
        headers: {
            'X-Requested-With': 'XMLHttpRequest'
        }
    };

    var cookieString;

    before(function () {
        // ----- adding product #1:
        updateQuantity.url = config.baseUrl + '/Cart-AddProduct';
        updateQuantity.form = {
            pid: '701644329402M',
            quantity: 1
        };

        return request(updateQuantity)
            .then(function () {
                cookieString = cookieJar.getCookieString(updateQuantity.url);
            })

    });

    it('should verify that contract is add to cart', function () {
    this.timeout(10000);
        var qty1 = 1;
        var variantPid = '701644329402M';
        var clydeContractSKU = 'TEST3Y500';
        var addToCartRequest = {
            url: '',
            method: 'GET',
            rejectUnauthorized: false,
            resolveWithFullResponse: true,
            jar: cookieJar,
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            }
        };

        addToCartRequest.url = config.baseUrl + '/Clyde-AddContract?pid=' + variantPid + '&clydeContractSku=' + clydeContractSKU;
        return request(addToCartRequest)
            .then(function (response) {
                var bodyAsJson = JSON.parse(response.body);
                assert.equal(bodyAsJson.error, false);
            });
    });
});