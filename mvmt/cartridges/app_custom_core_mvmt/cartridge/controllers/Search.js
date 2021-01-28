'use strict';

var server = require('server');
var page = module.superModule;
server.extend(page);

var URLUtils = require('dw/web/URLUtils');

var productCustomHelpers = require('*/cartridge/scripts/helpers/productCustomHelpers');
var ProductMgr = require('dw/catalog/ProductMgr');
var marketingProductsData = [];

server.append(
    'Show',
    function (req, res, next) {
        var viewData = res.getViewData();
        if(viewData.productSearch && viewData.productSearch.category && viewData.productSearch.category.id) {
            for (var i = 0; i < viewData.productSearch.productIds.length; i++) {
                var apiProduct = ProductMgr.getProduct(viewData.productSearch.productIds[i].productID);
                var quantity = 0;
                marketingProductsData.push(productCustomHelpers.getMarketingProducts(apiProduct, quantity));
            }
            viewData.marketingProductData = JSON.stringify(marketingProductsData);
            var watchesPlpCategory = viewData.productSearch.category.raw.parent.parent.ID;
            viewData = {
                relativeURL: URLUtils.url('Search-Show','cgid', viewData.productSearch.category.id),
                watchesPlpCategory: watchesPlpCategory
            };
        }
        res.setViewData(viewData);
        next();
    }
);

server.append(
    'ShowContent',
    function (req, res, next) {
        var viewData = res.getViewData();
        if (viewData.folderID) {
            viewData = {
                relativeURL: URLUtils.url('Search-ShowContent','fdid', viewData.folderID)
            };
        }
        res.setViewData(viewData);
        next();
    }
);


module.exports = server.exports();
