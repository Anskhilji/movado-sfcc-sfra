'use strict';

var productHelpers = require('app_storefront_base/cartridge/scripts/helpers/productHelpers');

productHelpers.showProductPage = function (querystring, reqPageMetaData) {
    var ABTestMgr = require('dw/campaign/ABTestMgr');
    var URLUtils = require('dw/web/URLUtils');
    var pageMetaHelper = require('*/cartridge/scripts/helpers/pageMetaHelper');
    var ProductFactory = require('*/cartridge/scripts/factories/product');

    var product = ProductFactory.get(querystring);
    var addToCartUrl = URLUtils.url('Cart-AddProduct');
    var breadcrumbs = productHelpers.getAllBreadcrumbs(null, product.id, []).reverse();
    
    var template;
    if (ABTestMgr.isParticipant('MovadoRedesignPDPABTest','Control')) {
        template = (product.template) ? product.template : 'product/old/productDetails';
    } else if (ABTestMgr.isParticipant('MovadoRedesignPDPABTest','render-modern-design')) {
        template = (product.template) ? product.template : 'product/modern/productDetails';
    } else if (ABTestMgr.isParticipant('MovadoRedesignPDPABTest','render-traditional-design')){
        template = (product.template) ? product.template : 'product/traditional/productDetails';
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
