'use strict';

var productHelpers = require('app_storefront_base/cartridge/scripts/helpers/productHelpers');

productHelpers.showProductPage = function (querystring, reqPageMetaData) {
    var URLUtils = require('dw/web/URLUtils');
    var ProductFactory = require('*/cartridge/scripts/factories/product');
    var pageMetaHelper = require('*/cartridge/scripts/helpers/pageMetaHelper');
    var ABTestMgr = require('dw/campaign/ABTestMgr');

    var params = querystring;
    var product = ProductFactory.get(params);
    var addToCartUrl = URLUtils.url('Cart-AddProduct');
    var breadcrumbs = productHelpers.getAllBreadcrumbs(null, product.id, []).reverse();
    
    var template;
    if (ABTestMgr.isParticipant('MovadoRedesignPDPABTest','Control')) {
        template = (product.template) ? product.template : 'product/old/productDetails';
    } else if (ABTestMgr.isParticipant('MovadoRedesignPDPABTest','render-modern-design')) {
        template = (product.template) ? product.template : 'product/productDetails';
    } else {
        template = (product.template) ? product.template : 'product/old/productDetails';
    }

    if (product.productType === 'bundle') {
        template = 'product/bundleDetails';
    } else if (product.productType === 'set') {
        template = 'product/setDetails';
    }
    
    pageMetaHelper.setPageMetaData(reqPageMetaData, product);
    pageMetaHelper.setPageMetaTags(reqPageMetaData, product);

    return {
        template: template,
        product: product,
        addToCartUrl: addToCartUrl,
        resources: productHelpers.getResources(),
        breadcrumbs: breadcrumbs
    };
}

module.exports = productHelpers;
