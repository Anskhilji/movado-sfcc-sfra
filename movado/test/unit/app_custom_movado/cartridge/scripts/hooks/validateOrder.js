'use strict';

var assert = require('chai').assert;
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var ArrayList = require('../../../../../mocks/dw.util.Collection');
var checkoutHelpers = require('../../../../../../../storefront-reference-architecture/test/mocks/helpers/checkoutHelpers');

var productLineItems1 = new ArrayList([{
    product: {
        online: true,
        availabilityModel: {
            getAvailabilityLevels: function () {
                return {
                    notAvailable: {
                        value: 0
                    }
                };
            }
        }
    },
    custom: {},
    productID: 'someID',
    quantityValue: 2
}]);

var productLineItems2 = new ArrayList([{
    product: {
        online: false,
        availabilityModel: {
            getAvailabilityLevels: function () {
                return {
                    notAvailable: {
                        value: 0
                    }
                };
            }
        }
    },
    custom: {},
    productID: 'someID',
    quantityValue: 2
}]);

var productLineItems3 = new ArrayList([{
    product: {
        online: true,
        availabilityModel: {
            getAvailabilityLevels: function () {
                return {
                    notAvailable: {
                        value: 0
                    }
                };
            }
        }
    },
    custom: {
        fromStoreId: new ArrayList([{}])
    },
    productID: 'someID',
    quantityValue: 2
}]);

var lineItemContainer = {
    totalTax: {
        available: false
    },
    merchandizeTotalPrice: {
        available: true
    },
    productLineItems: productLineItems1,
    couponLineItems: new ArrayList([{
        valid: true
    }])
};
var affirmHelper={
    CheckCart: function(){
        return {
            status: {
                error: false
            }
        }
    }
}

describe('validate order', function () {
    var validateOrderHook = proxyquire('../../../../../../cartridges/app_custom_movado/cartridge/scripts/hooks/validateOrder', {
        
        '*/cartridge/scripts/utils/affirmHelper': affirmHelper,
        
        'dw/web/Resource': {
            msg: function (param) {
                return param;
            }
        },
        '*/cartridge/scripts/helpers/basketValidationHelpers': proxyquire('../../../../../../../storefront-reference-architecture/cartridges/app_storefront_base/cartridge/scripts/helpers/basketValidationHelpers', {
            'dw/catalog/ProductInventoryMgr': {
                getInventoryList: function () {
                    return {
                        getRecord: function () {
                            return {
                                ATS: {
                                    value: 3
                                }
                            };
                        }
                    };
                }
            },
            'dw/web/Resource': {
                msg: function (param) {
                    return param;
                }
            },
            '*/cartridge/scripts/util/collections': proxyquire('../../../../../../../storefront-reference-architecture/cartridges/app_storefront_base/cartridge/scripts/util/collections', {
                'dw/util/ArrayList': ArrayList
            }),
            'dw/catalog/StoreMgr': {
                getStore: function () {
                    return {
                        custom: {
                            inventoryListId: 'someID'
                        }
                    };
                }
            },
            '*/cartridge/scripts/checkout/checkoutHelpers': checkoutHelpers
        })
    });

    it('should validate a valid basket', function () {
        lineItemContainer.shipments = new ArrayList([{ shippingAddress: { address1: 'some street' } }]);
        var result = validateOrderHook.validateOrder(lineItemContainer, false);
        assert.isFalse(result.error);
        assert.equal(result.message, null);
    });

    it('should invalidate a null basket', function () {
        var result = validateOrderHook.validateOrder(null, false);
        assert.isTrue(result.error);
        assert.equal(result.message, 'error.cart.expired');
    });

    it('should invalidate a basket without total tax', function () {
        var result = validateOrderHook.validateOrder(lineItemContainer, true);
        assert.isTrue(result.error);
        assert.equal(result.message, 'error.invalid.tax');
    });

    it('should invalidate a basket with merchandize Total Price not available', function () {
        lineItemContainer.merchandizeTotalPrice.available = false;
        var result = validateOrderHook.validateOrder(lineItemContainer, false);
        assert.isTrue(result.error);
        assert.equal(result.message, 'error.cart.or.checkout.error');
        lineItemContainer.merchandizeTotalPrice.available = true;
    });

    it('should invalidate a basket when product not online', function () {
        lineItemContainer.productLineItems = productLineItems2;
        var result = validateOrderHook.validateOrder(lineItemContainer, false);
        assert.isTrue(result.error);
        assert.equal(result.message, 'error.cart.or.checkout.error');
        lineItemContainer.productLineItems = productLineItems1;
    });

    it('should validate a basket when product has inStore inventory', function () {
        lineItemContainer.productLineItems = productLineItems3;
        var result = validateOrderHook.validateOrder(lineItemContainer, false);
        assert.isFalse(result.error);
        assert.equal(result.message, null);
        lineItemContainer.productLineItems = productLineItems1;
    });

    it('should invalidate a basket with invalid coupons', function () {
        lineItemContainer.couponLineItems = new ArrayList([{ valid: false }]);
        var result = validateOrderHook.validateOrder(lineItemContainer, false);
        assert.isTrue(result.error);
        assert.equal(result.message, 'error.invalid.coupon');
        lineItemContainer.couponLineItems = new ArrayList([{ valid: true }]);
    });

    it('should invalidate a basket with no productLineItems', function () {
        lineItemContainer.productLineItems = new ArrayList([]);
        var result = validateOrderHook.validateOrder(lineItemContainer, false);
        assert.isTrue(result.error);
        assert.equal(result.message, null);
        lineItemContainer.productLineItems = productLineItems1;
    });

    it('should invalidate a basket with incomplete shipping address', function () {
        lineItemContainer.shipments = new ArrayList([{ shippingAddress: {} }]);
        var result = validateOrderHook.validateOrder(lineItemContainer, false);
        assert.isTrue(result.error);
        assert.equal(result.message, 'error.card.invalid.shipments');
    });
    
});
describe('validate order with Affirm condition', function () {
    var validateOrderHook = proxyquire('../../../../../../cartridges/app_custom_movado/cartridge/scripts/hooks/validateOrder', {
        
        '*/cartridge/scripts/utils/affirmHelper': {
            CheckCart: function(){
                return {
                    status: {
                        error: true
                    }
                }
            }
        },
        
        'dw/web/Resource': {
            msg: function (param) {
                return param;
            }
        },
        '*/cartridge/scripts/helpers/basketValidationHelpers': proxyquire('../../../../../../../storefront-reference-architecture/cartridges/app_storefront_base/cartridge/scripts/helpers/basketValidationHelpers', {
            'dw/catalog/ProductInventoryMgr': {
                getInventoryList: function () {
                    return {
                        getRecord: function () {
                            return {
                                ATS: {
                                    value: 3
                                }
                            };
                        }
                    };
                }
            },
            'dw/web/Resource': {
                msg: function (param) {
                    return param;
                }
            },
            '*/cartridge/scripts/util/collections': proxyquire('../../../../../../../storefront-reference-architecture/cartridges/app_storefront_base/cartridge/scripts/util/collections', {
                'dw/util/ArrayList': ArrayList
            }),
            'dw/catalog/StoreMgr': {
                getStore: function () {
                    return {
                        custom: {
                            inventoryListId: 'someID'
                        }
                    };
                }
            },
            '*/cartridge/scripts/checkout/checkoutHelpers': checkoutHelpers
        })
    });
    it('Affirm error condition', function () {
        lineItemContainer.shipments = new ArrayList([{ shippingAddress: {} }]);
        var result = validateOrderHook.validateOrder(lineItemContainer, false);
        assert.isTrue(result.error);
        assert.equal(result.message, 'error.technical');
    });
});
