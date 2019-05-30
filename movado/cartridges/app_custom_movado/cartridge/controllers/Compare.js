'use strict';

var server = require('server');
var Resource = require('dw/web/Resource');
var URLUtils = require('dw/web/URLUtils');
var Site = require('dw/system/Site');
var collections = require('*/cartridge/scripts/util/collections');
var productFactory = require('*/cartridge/scripts/factories/product');
var CompareAttributesModel = require('*/cartridge/models/compareAttributes');
var page = module.superModule;
server.extend(page);

var MAX_SLOTS = 3;
// removed code related to category
server.replace('Show', function (req, res, next) {
    var compareProductsForm = req.querystring;
    var pids = Object.keys(compareProductsForm)
        .filter(function (key) { return key.indexOf('pid') === 0; })
        .map(function (pid) { return compareProductsForm[pid]; });
    var products = pids.map(function (pid) {
        return productFactory.get({ pid: pid });
    });
    res.render('product/comparison', {
        pids: pids,
        attributes: (new CompareAttributesModel(products)).slice(0),
        compare: Resource.msg('compare.compare', 'common', null),
        backToResults: Resource.msg('compare.backToResults', 'common', null),
        updateUrl: URLUtils.url('Compare-ProductListFormation').toString()
    });
    return next();
});

server.get('Bar', function (req, res, next) {
    var viewDataInitial = {
        productsToCompare: [],
        resources: {
            compare_items: Resource.msg('compare.compare_items', 'common', null),
            select2: Resource.msg('text.productcompare.select2', 'product', null),
            clear_all: Resource.msg('compare.clear_all', 'common', null)
        },
        actionUrl: URLUtils.url('Compare-Show').toString(),
        updateUrl: URLUtils.url('Compare-ProductListFormation').toString(),
        showCompareBar: false
    };

    var urlAction = req.querystring.urlAction;

    var viewData = req.session.raw.custom.viewData != null ? req.session.raw.custom.viewData : viewDataInitial;
    viewData = updateProductViewData(viewData);
	// check for urlAction exist in pageListForCompare is site Preference
    if (urlAction) {
        viewData.showCompareBar = checkComparePageList(urlAction);
    } else {
        viewData.showCompareBar = false;
    }
    req.session.raw.custom.viewData = viewData;
    res.render('product/compareBar', {
        viewData: viewData
    });

    return next();
});

server.post('ProductListFormation', function (req, res, next) {
    var compareAction = req.form.compareAction;
    var pid = req.form.pid;
    var imgSrc = req.form.imgSrc;
    var viewDataInitial = {
        productsToCompare: [],
        resources: {
            compare_items: Resource.msg('compare.compare_items', 'common', null),
            select2: Resource.msg('text.productcompare.select2', 'product', null),
            clear_all: Resource.msg('compare.clear_all', 'common', null)
        },
        actionUrl: URLUtils.url('Compare-Show').toString(),
        updateUrl: URLUtils.url('Compare-ProductListFormation').toString(),
        showCompareBar: false
    };

    var viewData = req.session.raw.custom.viewData != null ? req.session.raw.custom.viewData : viewDataInitial;

    viewData = updateProductViewData(viewData, compareAction, pid, imgSrc);
    req.session.raw.custom.viewData = viewData;

    res.json({
        viewData: viewData
    });

    return next();
});


function updateProductViewData(viewData, compareAction, pid, imgSrc) {
    if (compareAction && compareAction === 'clearall') {
        viewData.productsToCompare = [];
    } else if (compareAction && compareAction === 'selected' && pid && imgSrc) {
        if (viewData.productsToCompare.length < MAX_SLOTS) {
            viewData.productsToCompare.push({
                pid: pid,
                imgSrc: imgSrc
            });
        }
    }	else if (compareAction && compareAction === 'deselected' && pid) {
        viewData.productsToCompare = viewData.productsToCompare.filter(function (product) {
            return product.pid !== pid;
	  });
    }

    return viewData;
}


function checkComparePageList(urlAction) {
    var pageListForCompare = Site.getCurrent().preferences.custom.pageListForCompare;
    for (var i = 0; i < pageListForCompare.length; i++) {
        if (urlAction === pageListForCompare[i]) {
            return true;
        }
    }
    return false;
}

module.exports = server.exports();
