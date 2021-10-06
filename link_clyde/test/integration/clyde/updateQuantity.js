var assert = require('chai').assert;
var request = require('request-promise');
var config = require('../it.config');
var chai = require('chai');
var chaiSubset = require('chai-subset');
chai.use(chaiSubset);

describe('Update quantity for product variant', function () {
    this.timeout(45000);

    var variantPid1 = '793775370033';
    var qty1 = 2;
    var variantPid2 = '793775362380';
    var qty2 = 1;
    var variantPid3 = '029407331258M';
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

        var expectedUpdateRep = {
            'action': 'Cart-UpdateQuantity',
           'totals': {
                'subTotal': '$276.50',
                'totalShippingCost': '$9.99',
                'totalTax': '$14.33'
            },
            'shipments': [
                {
                    'shippingMethods': [
                        {
                           'ID': '001',
                            'displayName': 'Ground',
                            'shippingCost': '$9.99',
                            'selected': true
                        }
                    ],
                    'selectedShippingMethod': '001'
                }
            ],
            'items': [
                {
                    'id': variantPid1,
                    'productName': 'Striped Silk Tie - Turquoise',
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
                    'UUID': variantUuid1,
                    'quantity': expectQty1
                }
            ],
            'numItems': newTotal,
            'locale': 'en_US',
            'resources': {
                'numberOfItems': newTotal + ' Items',
                'emptyCartMsg': 'Your Shopping Cart is Empty'
            }
        };

        updateQuantity.method = 'GET';
        updateQuantity.url = config.baseUrl + '/Cart-UpdateQuantity?pid=' + variantPid2 + '&uuid=' + variantUuid2 + '&quantity=' + newQty2;

        return request(updateQuantity)
            .then(function (updateRsp) {
                assert.equal(updateRsp.statusCode, 200, 'Expected statusCode to be 200.');

                var bodyAsJson = JSON.parse(updateRsp.body);

                assert.containSubset(bodyAsJson, expectedUpdateRep, 'Actual response does not contain expectedUpdateRep.');
            });
    });
});