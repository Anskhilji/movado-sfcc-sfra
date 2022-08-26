var assert = require('chai').assert;
var request = require('request-promise');
var config = require('../it.config');
var chai = require('chai');
var chaiSubset = require('chai-subset');
chai.use(chaiSubset);

describe('Update quantity for product variant', function () {
    this.timeout(45000);

    var variantPid1 = '701644329402M';
    var qty1 = 2;
    var variantPid2 = '701644329396M';
    var qty2 = 1;
    var variantPid3 = '701644329419M';
    var qty3 = 3;

    var prodIdUuidMap = {};

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
            pid: variantPid1,
            quantity: qty1
        };

        return request(updateQuantity)
            .then(function () {
                cookieString = cookieJar.getCookieString(updateQuantity.url);
            })

            // ----- adding product #2, a different variant of same product 1:
            .then(function () {
                updateQuantity.url = config.baseUrl + '/Cart-AddProduct';
                updateQuantity.form = {
                    pid: variantPid2,
                    quantity: qty2
                };

                var cookie = request.cookie(cookieString);
                cookieJar.setCookie(cookie, updateQuantity.url);

                return request(updateQuantity);
            })

            // ----- select a shipping method. Need to have shipping method so that shipping cost, sales tax,
            //       and grand total can be calculated
            .then(function () {
                var shipMethodId = '001';   // 001 = Ground

                updateQuantity.method = 'POST';
                updateQuantity.url = config.baseUrl + '/Cart-SelectShippingMethod?methodID=' + shipMethodId;
                return request(updateQuantity);
            })

            // ----- Get UUID for each product line items
            .then(function (response4) {
                var bodyAsJson = JSON.parse(response4.body);

                prodIdUuidMap[bodyAsJson.items[0].id] = bodyAsJson.items[0].UUID;
                prodIdUuidMap[bodyAsJson.items[1].id] = bodyAsJson.items[1].UUID;
            });
    });

    it('should update line item quantity', function () {
        // updating quantity of poduct variant 2

        var newQty2 = 5;
        var newTotal = 7;
        var expectQty1 = 2;

        var variantUuid1 = prodIdUuidMap[variantPid1];
        var variantUuid2 = prodIdUuidMap[variantPid2];

        updateQuantity.method = 'GET';
        updateQuantity.url = config.baseUrl + '/Cart-UpdateQuantity?pid=' + variantPid2 + '&uuid=' + variantUuid2 + '&quantity=' + newQty2;

        return request(updateQuantity)
            .then(function (updateRsp) {
                assert.equal(updateRsp.statusCode, 200, 'Expected statusCode to be 200.');

                var bodyAsJson = JSON.parse(updateRsp.body);
                assert.equal(bodyAsJson.valid.error, false);
                assert.equal(bodyAsJson.message, null);
            });
    });
});