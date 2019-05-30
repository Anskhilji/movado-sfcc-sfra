
'use strict';

var collections = require('*/cartridge/scripts/util/collections');
var ProductFactory = require('*/cartridge/scripts/factories/product');
var StringUtils = require('dw/util/StringUtils');
var Calendar = require('dw/util/Calendar');
var decorators = require('*/cartridge/models/product/decorators/index');
var URLUtils = require('dw/web/URLUtils');

function formatDate(dateToBeFormatted, pattern) {
    return StringUtils.formatCalendar(new Calendar(dateToBeFormatted), pattern);
}

function createProductListItemsObject(allListItems, view) {
    var listItems = [];

    collections.forEach(allListItems, function (item) {
        if (!item.product) { return; }
        var params = {
            pid: item.productID,
            quantity: 1,
            variables: null,
            pview: 'productListItem',
            containerView: view,
            listItem: item,
            options: null
        };
        var newListItem = ProductFactory.get(params);
        newListItem.productID = item.productID;
        newListItem.priceTotal = {
            nonAdjustedPrice: newListItem.price.list ? newListItem.price.list.value : 'N/A',
            price: newListItem.price.sales ? newListItem.price.sales.value : 'N/A'
        };
        newListItem.quantityOptions = {
            minOrderQuantity: 1,
            maxOrderQuantity: 1
        };
        var productObj = Object.create(null);
        decorators.images(productObj, item.product, { types: ['tile150'], quantity: 'single' });
        newListItem.quantity = 1;
        newListItem.ID = item.getID();
        newListItem.UUID = item.productID;
        newListItem.creationDate = formatDate((item.custom.registrationDate ? item.custom.registrationDate : item.creationDate), 'MM/dd/yyyy');
        newListItem.productImage = productObj.images.tile150[0];
        newListItem.productUrl = URLUtils.url('Product-Show', 'pid', newListItem.UUID).relative().toString();
        listItems.push(newListItem);
    });
    return listItems;
}

function ProductListItems(productListItems, view) {
    if (productListItems.empty != true) {
        this.items = createProductListItemsObject(productListItems, view);
    } else {
        this.items = [];
    }
}

module.exports = ProductListItems;
