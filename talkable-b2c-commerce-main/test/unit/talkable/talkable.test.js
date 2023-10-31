/* eslint-disable no-plusplus */
/* eslint-disable no-undef */

"use strict";

var assert = require("assert");
var proxyquire = require("proxyquire").noCallThru();

var stubs = {
    SiteStub: {
        current: {
            getCustomPreferenceValue: function (customPreferenceValueId) {
                if (customPreferenceValueId === "talkableSiteId"
                    || customPreferenceValueId === "talkableDashboard"
                    || customPreferenceValueId === "talkableStandalone"
                    || customPreferenceValueId === "talkablePostCheckout"
                    || customPreferenceValueId === "talkableFloatingWidget"
                    || customPreferenceValueId === "dummypreference"
                    || customPreferenceValueId === "talkableEnabled") {
                    return customPreferenceValueId;
                }

                return false;
            }
        }
    },
    ResourceStub: {
        msg: function () {
            var stringHolder = "";
            for (var i = 0; i < arguments.length; i++) {
                stringHolder += arguments[i];
            }
            return stringHolder;
        }
    },
    URLUtilsStub: {
        http: function () {
            var stringHolder = "";
            for (var i = 0; i < arguments.length; i++) {
                stringHolder += arguments[i];
            }

            return {
                toString: function () {
                    return stringHolder;
                }
            };
        }
    }
};

function empty(param) {
    if (typeof param === "object" && param instanceof Array === false) {
        var size = 0;
        var key;

        // eslint-disable-next-line no-restricted-syntax
        for (key in param) {
            // eslint-disable-next-line no-prototype-builtins
            if (param.hasOwnProperty(key)) size++;
        }

        if (size > 0) {
            return false;
        }
    } else if (param instanceof Array) {
        if (param.length > 0) {
            return false;
        }
    }
    return !(param !== null && param !== undefined && param !== "");
}

global.empty = empty;

describe("libTalkable scripts test", function () {
    var libTalkablePath = "../../../cartridges/int_talkable/cartridge/scripts/talkable/libTalkable";
    var libTalkable = proxyquire(libTalkablePath, {
        "dw/system/Site": stubs.SiteStub,
        "dw/web/Resource": stubs.ResourceStub,
        "dw/web/URLUtils": stubs.URLUtilsStub
    });
    var talkableHelper = libTalkable.TalkableHelper();

    describe("getSiteId", function () {
        it("should return site id", function () {
            var siteId = talkableHelper.getSiteId();
            assert.equal(siteId, "talkableSiteId");
        });
    });

    describe("isRegisterAffiliateEnabled", function () {
        it("should return if the register affiliate is enabled", function () {
            global.request = {
                httpPath: "https://dummydomainname.com/talkable-dashboard/?somePage=asd"
            };
            var isRegisterAffiliateEnabled = talkableHelper.isRegisterAffiliateEnabled();
            assert.equal(isRegisterAffiliateEnabled[0], "talkable-dashboard");
        });
    });

    describe("isDashboardEnabled", function () {
        it("should return if the dashboard campaign is enabled", function () {
            global.request = {
                httpPath: "https://dummydomainname.com/Talkable-Dashboard/?somePage=asd"
            };
            var isDashboardEnabled = talkableHelper.isDashboardEnabled();
            assert.equal(isDashboardEnabled[0], "Talkable-Dashboard");
        });
    });

    describe("isStandaloneEnabled", function () {
        it("should return if the standalone campaign is enabled", function () {
            global.request = {
                httpPath: "https://dummydomainname.com/talkable-standalone/?somePage=asd"
            };
            var isStandaloneEnabled = talkableHelper.isStandaloneEnabled();
            assert.equal(isStandaloneEnabled[0], "talkable-standalone");
        });
    });

    describe("isPostCheckoutEnabled", function () {
        it("should return if the standalone campaign is enabled", function () {
            var isPostCheckoutEnabled = talkableHelper.isPostCheckoutEnabled();
            assert.equal(isPostCheckoutEnabled, true);
        });
    });

    describe("isFloatingWidgetEnabled", function () {
        it("should return if the standalone campaign is enabled", function () {
            global.request = {
                httpPath: "https://dummydomainname.com/coSumMaRy/?somePage=asd"
            };
            var isFloatingWidgetEnabled = talkableHelper.isFloatingWidgetEnabled();
            assert.equal(isFloatingWidgetEnabled, false);
        });
    });

    describe("getCustomerData", function () {
        it("should return the customer data", function () {
            var customer = {
                authenticated: true,
                profile: {
                    email: "customer@talkable.com",
                    firstName: "john",
                    lastName: "doe",
                    customerNo: "dummy_id"
                }
            };
            var customerData = talkableHelper.getCustomerData(customer);
            var data = {
                email: "customer@talkable.com", first_name: "john", last_name: "doe", customer_id: "dummy_id"
            };
            assert.equal(customerData, JSON.stringify(data));
        });
    });

    describe("isEnabled", function () {
        it("should return if the provided custom pref is enabled", function () {
            var isEnabled = talkableHelper.isEnabled("dummypreference");
            assert.equal(isEnabled, true);
        });
    });

    describe("getFullAddress", function () {
        it("should return the full address", function () {
            var shippingAddress = {
                address1: "Alsancak Konak",
                address2: "Kibris Sehitleri Avenue",
                city: "Izmir",
                stateCode: "AEG",
                postalCode: "35150",
                countryCode: {
                    displayValue: "TR"
                }
            };
            var getFullAddress = talkableHelper.getFullAddress(shippingAddress);
            assert.equal(getFullAddress, "Alsancak Konak, Kibris Sehitleri Avenue, Izmir, AEG, 35150, country.TRformsTR");
        });
    });

    describe("TalkableEnabled", function () {
        it("should return if talkable is enabled or not", function () {
            var talkableEnabled = libTalkable.TalkableEnabled();
            assert.equal(talkableEnabled, "talkableEnabled");
        });
    });

    describe("getPurchaseData", function () {
        it("should return the purchase data", function () {
            var order = {
                customerEmail: "customerEmail@talkable.com",
                billingAddress: { firstName: "john", lastName: "doe" },
                customerNo: "123",
                creationDate: {
                    toISOString: function () {
                        return "10/11/1938";
                    }
                },
                orderNo: 12345534,
                giftCertificateTotalPrice: 21341562354,
                getAdjustedMerchandizeTotalPrice: function (params) {
                    if (params === false) {
                        return {
                            add: function (value) {
                                return {
                                    decimalValue: {
                                        toString: function () {
                                            return "decimalStringValue: " + value;
                                        }
                                    }
                                };
                            }
                        };
                    }
                    return false;
                },
                shipments: {
                    count: 3,
                    values: [
                        {
                            shippingAddress: { value: "dummyshippingAddress", postalCode: "35150" },
                            custom: {
                                shipmentType: "type1"
                            }
                        },
                        {
                            shippingAddress: { value: "dummyshippingAddress1", postalCode: "35151" },
                            custom: {
                                shipmentType: "type2"
                            }
                        },
                        {
                            shippingAddress: { value: "dummyshippingAddress2", postalCode: "35152" },
                            custom: {
                                shipmentType: "type3"
                            }
                        }
                    ],
                    iterator: function () {
                        return this;
                    },
                    next: function () {
                        return this.values[this.count];
                    },
                    hasNext: function () {
                        if (this.count > 0) {
                            this.count--;
                            return true;
                        }
                        return false;
                    }
                },
                couponLineItems: {
                    count: 3,
                    values: [
                        { couponCode: "dummyCode" },
                        { couponCode: "dummyCode1" },
                        { couponCode: "dummyCode2" }
                    ],
                    iterator: function () {
                        return this;
                    },
                    next: function () {
                        return this.values[this.count];
                    },
                    hasNext: function () {
                        if (this.count > 0) {
                            this.count--;
                            return true;
                        }
                        return false;
                    }
                },
                productLineItems: {
                    count: 3,
                    values: [
                        {
                            product: {
                                getImage: function (params) {
                                    if (params === "large") {
                                        return {
                                            absURL: {
                                                toString: function () {
                                                    return "largeAbsUrlForThisProduct";
                                                }
                                            }
                                        };
                                    }
                                    return null;
                                }
                            },
                            getAdjustedPrice: function (params) {
                                if (params === false) {
                                    return {
                                        decimalValue: {
                                            divide: function (divideParam) {
                                                return divideParam;
                                            }
                                        }
                                    };
                                }
                                return null;
                            },
                            quantityValue: 82973465823,
                            productID: "productId",
                            productName: "productNameDummy"
                        },
                        {
                            product: {
                                getImage: function (params) {
                                    if (params === "large") {
                                        return {
                                            absURL: {
                                                toString: function () {
                                                    return "largeAbsUrlForThisProduct1";
                                                }
                                            }
                                        };
                                    }
                                    return null;
                                }
                            },
                            getAdjustedPrice: function (params) {
                                if (params === false) {
                                    return {
                                        decimalValue: {
                                            divide: function (divideParam) {
                                                return divideParam;
                                            }
                                        }
                                    };
                                }
                                return null;
                            },
                            quantityValue: 8297346582398,
                            productID: "productId1",
                            productName: "productNameDummy1"
                        },
                        {
                            product: {
                                getImage: function (params) {
                                    if (params === "large") {
                                        return {
                                            absURL: {
                                                toString: function () {
                                                    return "largeAbsUrlForThisProduct2";
                                                }
                                            }
                                        };
                                    }
                                    return null;
                                }
                            },
                            getAdjustedPrice: function (params) {
                                if (params === false) {
                                    return {
                                        decimalValue: {
                                            divide: function (divideParam) {
                                                return divideParam;
                                            }
                                        }
                                    };
                                }
                                return null;
                            },
                            quantityValue: 829734658236654,
                            productID: "productId2",
                            productName: "productNameDummy2"
                        }
                    ],
                    iterator: function () {
                        return this;
                    },
                    next: function () {
                        return this.values[this.count];
                    },
                    hasNext: function () {
                        if (this.count > 0) {
                            this.count--;
                            return true;
                        }
                        return false;
                    }
                }
            };
            var purchaseData = talkableHelper.getPurchaseData(order);
            var expectedResult = {
                "customer": {
                    "email": "customerEmail@talkable.com", "first_name": "john", "last_name": "doe", "customer_id": "123"
                },
                "purchase": {
                    "order_date": "10/11/1938",
                    "order_number": 12345534,
                    "subtotal": "decimalStringValue: 21341562354",
                    "coupon_code": ["dummyCode2", "dummyCode1", "dummyCode"],
                    "items": [{
                        "image_url": "largeAbsUrlForThisProduct2", "price": "829734658236654", "product_id": "productId2", "quantity": 829734658236654, "title": "productNameDummy2", "url": "Product-ShowpidproductId2"
                    }, {
                        "image_url": "largeAbsUrlForThisProduct1", "price": "8297346582398", "product_id": "productId1", "quantity": 8297346582398, "title": "productNameDummy1", "url": "Product-ShowpidproductId1"
                    }, {
                        "image_url": "largeAbsUrlForThisProduct", "price": "82973465823", "product_id": "productId", "quantity": 82973465823, "title": "productNameDummy", "url": "Product-ShowpidproductId"
                    }],
                    "shipping_address": "35152",
                    "shipping_zip": "35152"
                }
            };
            assert.equal(purchaseData, JSON.stringify(expectedResult));
        });
    });
});
