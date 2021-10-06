var assert = require('chai').assert;
var request = require('request-promise');
var config = require('../it.config');
var chai = require('chai');
var chaiSubset = require('chai-subset');
chai.use(chaiSubset);

describe('Remove product variant from line item', function () {
    this.timeout(50000);

    var variantPid1 = '793775370033';
    var qty1 = 2;
    var variantPid2 = '793775362380';
    var qty2 = 1;
 
    var prodIdUuidMap = {};

    var cookieJar = request.jar();
    var removedItemResponse = {
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
        removedItemResponse.url = config.baseUrl + '/Cart-AddProduct';
        removedItemResponse.form = {
            pid: variantPid1,
            quantity: qty1
        };

        return request(removedItemResponse)
            .then(function () {
                cookieString = cookieJar.getCookieString(removedItemResponse.url);
            })

            // ----- adding product #2, a different variant of same product 1:
            .then(function () {
                removedItemResponse.url = config.baseUrl + '/Cart-AddProduct';
                removedItemResponse.form = {
                    pid: variantPid2,
                    quantity: qty2
                };

                var cookie = request.cookie(cookieString);
                cookieJar.setCookie(cookie, removedItemResponse.url);

                return request(removedItemResponse);
            })

            // ----- select a shipping method. Need shipping method so that shipping cost, sales tax,
            //       and grand total can be calculated.
            .then(function () {
                var shipMethodId = '001';   // 001 = Ground

                removedItemResponse.method = 'POST';
                removedItemResponse.url = config.baseUrl + '/Cart-SelectShippingMethod?methodID=' + shipMethodId;
                return request(removedItemResponse);
            })

            // ----- Get UUID for each product line items
            .then(function (response4) {
                var bodyAsJson = JSON.parse(response4.body);

                prodIdUuidMap[bodyAsJson.items[0].id] = bodyAsJson.items[0].UUID;
                prodIdUuidMap[bodyAsJson.items[1].id] = bodyAsJson.items[1].UUID;
            });
    });

    it('should remove line item', function () {
        // removing product variant on line item 2

        var variantUuid2 = prodIdUuidMap[variantPid2];
        var expectedItems = {
            'totals': {
                'subTotal': '$79.00',
                'totalShippingCost': '$5.99',
                'totalTax': '$4.25'
            },
            'shipments': [
                {
                    'shippingMethods': [
                        {
                            'ID': '001',
                            'displayName': 'Ground',
                            'shippingCost': '$5.99',
                            'selected': true
                        }
                    ],
                    'selectedShippingMethod': '001'
                }
            ],
            'items': [
                {
                    'productName': 'Striped Silk Tie - Turquoise',
                    "productType": "variant",
                    'price': {
                       "sales": {
                           "currency": "USD",
                           "decimalPrice": "39.50",
                           "formatted": '$39.50',
                           "value": 39.50
                   }
                    },
                    'variationAttributes': [
                        {
                            'displayName': 'Color',
                            'displayValue': 'Turquoise'
                        }
                    ],
                    'quantity': 2
                }
            ]

        };

        removedItemResponse.method = 'GET';
        removedItemResponse.url = config.baseUrl + '/Cart-RemoveProductLineItem?pid=' + variantPid2 + '&uuid=' + variantUuid2;

        return request(removedItemResponse)
            .then(function (removedItemResponse) {
                assert.equal(removedItemResponse.statusCode, 200, 'Expected statusCode to be 200.');

                var bodyAsJson = JSON.parse(removedItemResponse.body);
                assert.containSubset(bodyAsJson.basket, expectedItems, 'Actual response dose not contain expected expectedResponse.');
            });
    });
});