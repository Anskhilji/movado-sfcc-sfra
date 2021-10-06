/* global describe, it*/
'use strict';

/* eslint-disable no-use-before-define */
/* eslint-disable no-unused-vars */

var assert = require('chai').assert;

global.empty = function (obj) {
    if (obj === null || obj === undefined || obj === '' || (typeof (obj) !== 'function' && obj.length !== undefined && obj.length === 0)) {
        return true;
    }
    return false;
};

describe('ProductProperties', function () {
    var prdFunction = require('../../../../../../../cartridges/bc_clyde/cartridge/scripts/factories/products/attributeFilters.js');
    var product = {
        ID: 'SKU789',
        name: 'Clyde Couch',
        manufacturer: 'Clyde Couch Co.',
        barcode: 'couch99',
        shortDescription: 'Test shortDescription',
        price: 43.45,
        imageLink: 'clydeimagehosting.com/SKU789',
        image: 'large',
        attributes: {
            size: 'loveseat',
            color: 'purple'
        },
        master: {
            ID: 'MasterTestId',
            name: 'Master Normal Product',
            manufacturer: 'Clyde Couch Co.',
            shortDescription: 'Test shortDescription',
            primary_category: 'primary',
            classification_category: 'classification',
            regular_category: ['regular']
        },
        getVariationModel: function () {
            var self = this;
            return {
                getMaster: function () {
                    return self.master ? master : null;
                }
            };
        },
        getShortDescription: function () {
            var self = this;
            return {
                toString: function () {
                    return {
                        replace: function () {
                            return self.shortDescription;
                        }
                    };
                }
            };
        },
        getHttpsURL: function () {
            var self = this;
            return {
                toString: function () {
                    return self.imageLink;
                }
            };
        },
        getImage: function (image) {
            var self = this;
            return {
                getHttpsURL: function () {
                    return {
                        toString: function () {
                            return self.imageLink;
                        }
                    };
                }
            };
        },
        getPrimaryCategory: function () {
            var self = this;
            return {
                displayName: self.master.primary_category,
                ID: self.master.primary_category
            };
        },
        getClassificationCategory: function () {
            var self = this;
            return {
                displayName: self.classification_category,
                ID: self.classification_category
            };
        },
        getManufacturerName: function () {
            var self = this;
            return self.manufacturer;
        },
        getPriceModel: function () {
            var self = this;
            return self.price ? {
                getPrice: function () {
                    return {
                        valueOrNull: self.price
                    };
                }
            } : null;
        }
    };
    var VM = product.getVariationModel();
    var master = VM.getMaster();
    it('should return value for id function', function () {
        assert.equal(prdFunction.productPropertyFunctions.id(product, VM, master), 'SKU789');
    });
    it('should return value for title function', function () {
        assert.equal(prdFunction.productPropertyFunctions.title(product, VM, master), 'Clyde Couch');
    });
    it('should return value for description function', function () {
        assert.equal(prdFunction.productPropertyFunctions.description(product, VM, master), 'Test shortDescription');
    });
    it('should return value for category function', function () {
        assert.equal(prdFunction.productPropertyFunctions.category(product, VM, master), 'primary');
    });
    it('should return value for manufacturer function', function () {
        assert.equal(prdFunction.productPropertyFunctions.manufacturer(product, VM, master), 'Clyde Couch Co.');
    });
    it('should return value for image function', function () {
        assert.equal(prdFunction.productPropertyFunctions.image(product), 'clydeimagehosting.com/SKU789');
    });
    it('should return value for price function', function () {
        assert.equal(prdFunction.productPropertyFunctions.price(product), 43.45);
    });
});
