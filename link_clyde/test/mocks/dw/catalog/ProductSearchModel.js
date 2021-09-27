'use strict';

/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */

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
            displayName: self.primary_category,
            ID: self.primary_category
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

var searchModel = function () {};

var ProductHits = function () {
    this.hits = product;
};

ProductHits.prototype.hasNext = function () {
    return this.hits.length > 0;
};
ProductHits.prototype.next = function () {
    var self = this;
    return {
        getRepresentedProducts: function () {
            return {
                toArray: function () {
                    return self.hits.shift();
                }
            };
        }
    };
};

searchModel.prototype.setRecursiveCategorySearch = function () {

};

searchModel.prototype.setOrderableProductsOnly = function () {

};

searchModel.prototype.setCategoryID = function () {

};

searchModel.prototype.setPriceMin = function () {

};

searchModel.prototype.addHitTypeRefinement = function () {

};

searchModel.prototype.search = function () {

};

searchModel.prototype.getProductSearchHits = function () {
    return new ProductHits();
};

module.exports = searchModel;
