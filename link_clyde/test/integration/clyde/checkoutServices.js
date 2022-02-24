var assert = require('chai').assert;
var request = require('request-promise');
var config = require('../it.config');
var chai = require('chai');
var chaiSubset = require('chai-subset');
chai.use(chaiSubset);

describe('checkout service', function () {
     var cookieJar = request.jar();

    it('checkout service', function () {
    this.timeout(10000);
        var myRequest = {
            url: '',
            method: 'POST',
            rejectUnauthorized: false,
            resolveWithFullResponse: true,
            jar: cookieJar,
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            }
        };
         before(function () {
        myRequest.url = config.baseUrl + '/CSRF-Generate';
        myRequest.form = {};
        return request(myRequest)
        .then(function (csrfResponse) {
            var csrfJsonResponse = JSON.parse(csrfResponse.body);
            myRequest.csrf.tokenName = csrfJsonResponse.csrf.tokenName;
            myRequest.csrf.token = csrfJsonResponse.csrf.token;
            return request(myRequest);
        })
        
        myRequest.url = config.baseUrl + '/CheckoutServices-PlaceOrder?' +
        myRequest.csrf.tokenName + '=' +
        myRequest.csrf.token;
        it(myRequest.url, function () {});
        myRequest.form = {
            orderNo : '00000011'
        };
        return request(myRequest, function (error, response) {
            assert.equal(response.statusCode, 200, 'Expected request statusCode to be 200');
            var bodyAsJson = JSON.parse(response.body);
            expect(bodyAsJson.action).to.be.equal('CheckoutServices-PlaceOrder');
            expect(bodyAsJson.error).to.be.equal(false);
        });
    });
});
});