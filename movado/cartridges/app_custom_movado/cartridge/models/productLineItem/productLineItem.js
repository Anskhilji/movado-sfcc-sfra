'use strict';

var Site = require('dw/system/Site');

var productDecorators = require('*/cartridge/models/product/decorators/index');
var productLineItemDecorators = require('*/cartridge/models/productLineItem/decorators/index');
var productCustomHelper = require('*/cartridge/scripts/helpers/productCustomHelper');

var isClydeEnabled = !empty(Site.current.preferences.custom.isClydeEnabled) ? Site.current.preferences.custom.isClydeEnabled : false;

/**
 * Decorate product with product line item information
 * @param {Object} product - Product Model to be decorated
 * @param {dw.catalog.Product} apiProduct - Product information returned by the script API
 * @param {Object} options - Options passed in from the factory
 * @property {dw.catalog.ProductVarationModel} options.variationModel - Variation model returned by the API
 * @property {Object} options.lineItemOptions - Options provided on the query string
 * @property {dw.catalog.ProductOptionModel} options.currentOptionModel - Options model returned by the API
 * @property {dw.util.Collection} options.promotions - Active promotions for a given product
 * @property {number} options.quantity - Current selected quantity
 * @property {Object} options.variables - Variables passed in on the query string
 *
 * @returns {Object} - Decorated product model
 */
module.exports = function productLineItem(product, apiProduct, options) {
    productDecorators.base(product, apiProduct, options.productType);
    productDecorators.price(product, apiProduct, options.promotions, false, options.currentOptionModel);
    productDecorators.images(product, apiProduct, { types: ['tile150', 'small'], quantity: 'single' });
    productDecorators.variationAttributes(product, options.variationModel, {
        attributes: 'selected'
    });
    productDecorators.availability(product, options.quantity, apiProduct.minOrderQuantity.value, apiProduct.availabilityModel);

    productLineItemDecorators.quantity(product, options.quantity);
    productLineItemDecorators.gift(product, options.lineItem);
    productLineItemDecorators.appliedPromotions(product, options.lineItem);
    productLineItemDecorators.renderedPromotions(product); // must get applied promotions first
    productLineItemDecorators.uuid(product, options.lineItem);
    productLineItemDecorators.orderable(product, apiProduct, options.quantity);
    productLineItemDecorators.shipment(product, options.lineItem);
    productLineItemDecorators.bonusProductLineItem(product, options.lineItem);
    productLineItemDecorators.priceTotal(product, options.lineItem, options.quantity);
    productLineItemDecorators.quantityOptions(product, options.lineItem, options.quantity);
    productLineItemDecorators.options(product, options.lineItemOptions);
    productLineItemDecorators.bonusProductLineItemUUID(product, options.lineItem);
    productLineItemDecorators.preOrderUUID(product, options.lineItem);
    productLineItemDecorators.discountBonusLineItems(product, options.lineItem.UUID);
    productLineItemDecorators.mgProductLineItemCutomAttr(product, options.lineItem);

    var isWatchTile = productCustomHelper.getIsWatchTile(apiProduct);
    var plpCustomUrl = productCustomHelper.getPLPCustomURL(apiProduct);
    var pulseIDPreviewURL = productCustomHelper.getPulseIDPreviewURL(options.lineItem);
    var productATSValue = productCustomHelper.getProductATSValue(apiProduct);

    /**
     * Custom Start:  Clyde Integration
     */
    if (isClydeEnabled) {
        productLineItemDecorators.lineItemText(product, options.lineItem);
    }
    /**
     * Custom End:
     */

    Object.defineProperty(product, 'bonusProductText', {
        enumerable: true,
        value: !empty(apiProduct.custom.bonusProductText) ? apiProduct.custom.bonusProductText : ''
    });
    
    Object.defineProperty(product, 'isBonusProductText', {
        enumerable: true,
        value: !empty(apiProduct.custom.bonusProductText) ? true : false
    });

    Object.defineProperty(product, 'giftPid', {
        enumerable: true,
        value: options.lineItem.custom.giftPid ? options.lineItem.custom.giftPid : ''
    });
    
    Object.defineProperty(product, 'giftParentUUID', {
        enumerable: true,
        value: options.lineItem.custom.giftParentUUID ? options.lineItem.custom.giftParentUUID : ''
    });

    Object.defineProperty(product, 'familyName', {
        enumerable: true,
        value: !empty(apiProduct.custom.familyName) ? apiProduct.custom.familyName[0] : ''
    });

    if (!empty(isWatchTile)) {
        Object.defineProperty(product, 'isWatchTile', {
            enumerable: true,
            value: isWatchTile
        });
    }

    if (!empty(product)) {
        Object.defineProperty(product, 'isPulseIDEngravingEnabled', {
            enumerable: true,
            value: !empty(apiProduct.custom.enablepulseIDEngraving) ? apiProduct.custom.enablepulseIDEngraving : ''
        });
    }

    if (!empty(plpCustomUrl)) {
        Object.defineProperty(product, 'plpCustomUrl', {
            enumerable: true,
            value: plpCustomUrl
        });
    }

    if (!empty(pulseIDPreviewURL)) {
        Object.defineProperty(product, 'pulseIDPreviewURL', {
            enumerable: true,
            value: pulseIDPreviewURL
        });
    }

    if (!empty(productATSValue)) {
        Object.defineProperty(product, 'productATSValue', {
            enumerable: true,
            value: productATSValue
        });
    }
    return product;
};
