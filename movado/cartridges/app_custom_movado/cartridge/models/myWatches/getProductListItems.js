'use strict';

var ProductListItemsModel = require('*/cartridge/models/myWatches/productListItems');
var myWatchesType = require('dw/customer/ProductList').TYPE_CUSTOM_1;
var ProductListMgr = require('dw/customer/ProductListMgr');

function getProductLists(customer) {
    var productLists;

    if (customer.authenticated) {
        productLists = ProductListMgr.getProductLists(customer, myWatchesType);
    }
    return productLists;
}

function getProductListItems(customer) {
    var productLists = getProductLists(customer);

    this.items = (productLists && productLists.length > 0) ? new ProductListItemsModel(productLists[0].items, 'basket').items : null;
    this.itemsID = (productLists && productLists.length > 0) ? productLists[0].ID : null;
}
module.exports = getProductListItems;
