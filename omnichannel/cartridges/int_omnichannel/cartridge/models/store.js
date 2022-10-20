'use strict';

var baseStores = module.superModule;

module.exports = function store(storeObject) {
    baseStores.call(this, storeObject);
    if (storeObject.custom.distance) {
        this.distance = storeObject.custom.distance;
    }

    return this;
};
