'use strict';

var decorators = require('*/cartridge/models/product/decorators/index');
var Site = require('dw/system/Site');

/**
 * Decorate product with full product information
 * @param {Object} product - Product Model to be decorated
 * @param {dw.catalog.Product} apiProduct - Product information returned by the script API
 * @param {Object} options - Options passed in from the factory
 * @property {dw.catalog.ProductVarationModel} options.variationModel - Variation model returned by the API
 * @property {Object} options.options - Options provided on the query string
 * @property {dw.catalog.ProductOptionModel} options.optionModel - Options model returned by the API
 * @property {dw.util.Collection} options.promotions - Active promotions for a given product
 * @property {number} options.quantity - Current selected quantity
 * @property {Object} options.variables - Variables passed in on the query string
 *
 * @returns {Object} - Decorated product model
 */
module.exports = function fullProduct(product, apiProduct, options) {
    var isEswEnabled = !empty(Site.current.getCustomPreferenceValue('eswEshopworldModuleEnabled')) ? Site.current.getCustomPreferenceValue('eswEshopworldModuleEnabled') : false;
    var productCustomHelper = require('*/cartridge/scripts/helpers/productCustomHelper');
    var productCustomHelpers = require('*/cartridge/scripts/helpers/productCustomHelpers');
    var collectionName = productCustomHelper.getCollectionName(apiProduct);
    var pdpContentAssetHTML = productCustomHelper.getPDPContentAssetHTML(apiProduct);
    var detailAndSpecAttributes = productCustomHelpers.getPdpDetailAndSpecsAttributes(apiProduct);
    var pdpMarketingContentAssetHTML = productCustomHelper.getPDPMarketingContentAssetHTML(apiProduct);
    var yotpoReviewsCustomAttribute = productCustomHelper.getYotpoReviewsCustomAttribute(apiProduct);

    decorators.base(product, apiProduct, options.productType);
    decorators.price(product, apiProduct, options.promotions, false, options.optionModel);
    decorators.mgattributes(product, apiProduct);

    if (options.variationModel) {
        // Custom Start: Define view type 'gallery' for DIS
        decorators.images(product, options.variationModel, { types: ['pdp533','tile532X300','tile640','tile520','tile533','tile300','tile150','tile156','zoom830','zoom1660','gallery','tile300X375','tile512X640','tile256','tile300X300','pdp600','tile100','tile126','pdp700','pdp453','tile512'], quantity: 'all' });
    } else {
     // Custom Start: Define view type for 'gallery' for DIS
        decorators.images(product, apiProduct, { types: ['pdp533','tile260xtile340','tile532X300','tile640','tile520','tile533','tile300','tile150','tile156','zoom830','zoom1660','gallery','tile300X375','tile512X640','tile256','tile300X300','pdp600','tile100','tile126','pdp700','pdp453','tile512'], quantity: 'all' });
    }
    decorators.emailImage(product, apiProduct, { types: ['tile150'], quantity: 'single' });
    decorators.quantity(product, apiProduct, options.quantity);
    decorators.variationAttributes(product, options.variationModel, {
        attributes: '*',
        endPoint: 'Variation'
    });
    decorators.description(product, apiProduct);
    decorators.ratings(product);
    decorators.promotions(product, options.promotions);
    decorators.attributes(product, apiProduct.attributeModel);
    decorators.availability(product, options.quantity, apiProduct.minOrderQuantity.value, apiProduct.availabilityModel);
    decorators.options(product, options.optionModel, options.variables, options.quantity);
    decorators.quantitySelector(product, apiProduct.stepQuantity.value, options.variables, options.options);

    var category = apiProduct.getPrimaryCategory();
    if (!category && options.productType !== 'master') {
        if(apiProduct.variant){
            category = apiProduct.getMasterProduct().getPrimaryCategory();
        }
    }

    if (category) {
        decorators.sizeChart(product, category.custom.sizeChartID);
    }

    //Custom Start: Adding esw latest cartridge code
    if (isEswEnabled) {
        var eswHelper = require('*/cartridge/scripts/helper/eswHelper').getEswHelper();
        Object.defineProperty(product, 'isProductRestricted', {
            enumerable: true,
            value: eswHelper.isProductRestricted(apiProduct.custom)
        });
    }
    // Custom end
    Object.defineProperty(product, 'pdpVideoConfigs', {
        enumerable: true,
        value: productCustomHelper.getPdpVideoConfigs(apiProduct)
    });

    decorators.currentUrl(product, options.variationModel, options.optionModel, 'Product-Show', apiProduct.ID, options.quantity);
    decorators.readyToOrder(product, options.variationModel);
    decorators.online(product, apiProduct);
    decorators.raw(product, apiProduct);
    decorators.pageMetaData(product, apiProduct);
    decorators.template(product, apiProduct);


    Object.defineProperty(product, 'collectionName', {
        enumerable: true,
        value: collectionName
    });

    if (pdpMarketingContentAssetHTML) {
        Object.defineProperty(product, 'pdpMarketingContentAssetHTML', {
            enumerable: true,
            value: pdpMarketingContentAssetHTML
        });
    }

    if (!empty(yotpoReviewsCustomAttribute)) {
        Object.defineProperty(product, 'yotpoReviewsCustomAttribute', {
            enumerable: true,
            value: yotpoReviewsCustomAttribute
        });
    }

    if (!empty(detailAndSpecAttributes)) {
        Object.defineProperty(product, 'pdpDetailedAttributes', {
            enumerable: true,
            value: detailAndSpecAttributes.pdpDetailAttributes
        });
    }

    if (!empty(detailAndSpecAttributes)) {
        Object.defineProperty(product, 'pdpSpecsAttributes', {
            enumerable: true,
            value: detailAndSpecAttributes.pdpSpecAttributes
        });
    }

    if (pdpContentAssetHTML) {
        Object.defineProperty(product, 'pdpContentAssetHTML', {
            enumerable: true,
            value: pdpContentAssetHTML
        });
    }

    return product;
};
