'use strict';

var server = require('server');
var consentTracking = require('*/cartridge/scripts/middleware/consentTracking');
var csrfProtection = require('*/cartridge/scripts/middleware/csrf');
var wishlistCustomHelper = require('*/cartridge/scripts/helpers/wishlistCustomHelper');
var productListHelper = require('*/cartridge/scripts/productList/productListHelpers');
var Resource = require('dw/web/Resource');

var page = module.superModule;
server.extend(page);

server.get('ShowIcon', function (req, res, next) {
    var wishlistGtmObj = JSON.parse(req.querystring.gtmObj);
    var page = req.querystring.page;
    if (page == 'tile') {
        renderTemplate = 'product/components/wishListIcon';
    } else {
        renderTemplate = 'product/components/wishListButton';
    }
    var display = {};
    display.wishlists = req.querystring.wishlists;
    res.render(renderTemplate, {
        loggedIn: req.currentCustomer.raw.authenticated,
        wishlistGtmObj: wishlistGtmObj,
        display: display
    });
    next();
});

server.append('Show', consentTracking.consent, server.middleware.https, csrfProtection.generateToken, function (req, res, next) {
	 var viewData = res.getViewData();
	 var items = viewData.wishlist.items;
	 var productAddGtmObj = [];
	 for (var i = 0; i < items.length; i++) {
	 productAddGtmObj.push({
     name: items[i].name,
     id: items[i].pid,
     price: items[i].priceObj && items[i].priceObj.list ? items[i].priceObj.list.value : (items[i].priceObj && items[i].priceObj.sales ? items[i].priceObj.sales.value : ''),
     currency: items[i].priceObj.list != null ? items[i].priceObj.list.currency : (items[i].priceObj && items[i].priceObj.sales ? items[i].priceObj.sales.currency : ''),
     brand: items[i].brand,
     category: '',
     variant: wishlistCustomHelper.getProductVariants(items[i].options),
     list: Resource.msg('gtm.list.wishlist.value', 'wishlist', null)
 });
	 }
	 res.setViewData({
		 productAddGtmObj: productAddGtmObj
	    });
	 next();
});

server.replace('AddProduct', function (req, res, next) {
    var list = productListHelper.getList(req.currentCustomer.raw, { type: 10 });
    var pid = req.form.pid;
    var optionId = req.form.optionId || null;
    var optionVal = req.form.optionVal || null;
    var options = req.form.options ? JSON.parse(req.form.options) : [];

    var config = {
        qty: 1,
        optionId: optionId,
        optionValue: optionVal,
        req: req,
        type: 10,
        options: options
    };
    var errMsg = productListHelper.itemExists(list, pid, config) ? Resource.msg('wishlist.addtowishlist.exist.msg', 'wishlist', null) :
        Resource.msg('wishlist.addtowishlist.failure.msg', 'wishlist', null);

    var success = productListHelper.addItem(list, pid, config);
    if (success) {
        res.json({
            success: true,
            pid: pid,
            msg: Resource.msg('wishlist.addtowishlist.success.msg', 'wishlist', null)
        });
    } else {
        res.json({
            error: true,
            pid: pid,
            msg: errMsg
        });
    }
    next();
});

server.replace('EditProductListItem', function (req, res, next) {
    var ProductMgr = require('dw/catalog/ProductMgr');
    var collections = require('*/cartridge/scripts/util/collections');
    var requestUuid = req.form.uuid;
    var newProductId = req.form.pid;
    var options = req.form.options ? JSON.parse(req.form.options) : [];

    var config = {
        qty: 1,
        options: options
    };

    var productList = productListHelper.getList(req.currentCustomer.raw, { type: 10 });
    var requestListItem = collections.find(productList.items, function (item) {
        return item.UUID === requestUuid;
    });
    var previousProductId = requestListItem.productID;

    var newItemExist = productListHelper.getItemFromList(productList, newProductId);

    if (!newItemExist) {
        if (newItemExist.UUID !== requestUuid) {
            productListHelper.removeItem(req.currentCustomer.raw, previousProductId, { req: req, type: 10 });
        }
    } else {
        try {
            var Transaction = require('dw/system/Transaction');
            Transaction.wrap(function () {
                var previousItem = productListHelper.getItemFromList(productList, previousProductId);
                productList.removeItem(previousItem);

                var apiProduct = ProductMgr.getProduct(newProductId);

                if (!apiProduct.variationGroup && apiProduct) {
                    productListHelper.addItem(productList, newProductId, config);
                }
            });
        } catch (e) {
            res.json({
                error: true
            });
            return next();
        }
    }

    res.json({
        success: true
    });

    return next();
});

server.append('MoreList', function (req, res, next) {
    var viewData = res.getViewData();
    var items = viewData.wishlist.items;
    var productAddGtmObj = [];
    for (var i = 0; i < items.length; i++) {
        productAddGtmObj.push({
            name: items[i].name,
            id: items[i].pid,
            price: items[i].priceObj && items[i].priceObj.list ? items[i].priceObj.list.value : (items[i].priceObj && items[i].priceObj.sales ? items[i].priceObj.sales.value : ''),
            currency: items[i].priceObj.list != null ? items[i].priceObj.list.currency : (items[i].priceObj && items[i].priceObj.sales ? items[i].priceObj.sales.currency : ''),
            brand: items[i].brand,
            category: '',
            variant: wishlistCustomHelper.getProductVariants(items[i].options),
            list: Resource.msg('gtm.list.wishlist.value', 'wishlist', null)
        });
    }

    res.setViewData({
        productAddGtmObj: productAddGtmObj
    });
    next();
});

module.exports = server.exports();
