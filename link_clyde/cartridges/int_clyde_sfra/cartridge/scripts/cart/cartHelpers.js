'use strict';

var base = module.superModule;
var ProductMgr = require('dw/catalog/ProductMgr');
var Resource = require('dw/web/Resource');
var productHelper = require('*/cartridge/scripts/helpers/productHelpers');
var addClydeContract = require('*/cartridge/scripts/clydeAddContracts.js');

/**
 * Adds a product to the cart. If the product is already in the cart it increases the quantity of
 * that product.
 * @param {dw.order.Basket} currentBasket - Current users's basket
 * @param {string} productId - the productId of the product being added to the cart
 * @param {number} quantity - the number of products to the cart
 * @param {string[]} childProducts - the products' sub-products
 * @param {SelectedOption[]} options - product options
 * @param {Object} form - form object data
 *  @return {Object} returns an error object
 */
function addProductToCart(currentBasket, productId, quantity, childProducts, options, form) {
    var availableToSell;
    var defaultShipment = currentBasket.defaultShipment;
    var perpetual;
    var product = ProductMgr.getProduct(productId);
    var productInCart;
    var productLineItems = currentBasket.productLineItems;
    var productQuantityInCart;
    var quantityToSet;
    var optionModel = productHelper.getCurrentOptionModel(product.optionModel, options);
    var result = {
        error: false,
        message: Resource.msg('text.alert.addedtobasket', 'product', null)
    };

    var totalQtyRequested = 0;
    var canBeAdded = false;

    if (product.bundle) {
        canBeAdded = base.checkBundledProductCanBeAdded(childProducts, productLineItems, quantity);
    } else {
        totalQtyRequested = quantity + base.getQtyAlreadyInCart(productId, productLineItems);
        perpetual = product.availabilityModel.inventoryRecord.perpetual;
        canBeAdded =
            (perpetual
            || totalQtyRequested <= product.availabilityModel.inventoryRecord.ATS.value);
    }

    if (!canBeAdded) {
        result.error = true;
        result.message = Resource.msgf(
            'error.alert.selected.quantity.cannot.be.added.for',
            'product',
            null,
            product.availabilityModel.inventoryRecord.ATS.value,
            product.name
        );
        return result;
    }

    productInCart = base.getExistingProductLineItemInCart(
        product, productId, productLineItems, childProducts, options);

    if (productInCart) {
        productQuantityInCart = productInCart.quantity.value;
        quantityToSet = quantity ? quantity + productQuantityInCart : productQuantityInCart + 1;
        availableToSell = productInCart.product.availabilityModel.inventoryRecord.ATS.value;
        addClydeContract.addContractsToCart(quantity, form, defaultShipment, currentBasket, productLineItems, productId);

        if (availableToSell >= quantityToSet || perpetual) {
            productInCart.setQuantityValue(quantityToSet);
            result.uuid = productInCart.UUID;
        } else {
            result.error = true;
            result.message = availableToSell === productQuantityInCart
                ? Resource.msg('error.alert.max.quantity.in.cart', 'product', null)
                : Resource.msg('error.alert.selected.quantity.cannot.be.added', 'product', null);
        }
    } else {
        var productLineItem;
        productLineItem = base.addLineItem(
            currentBasket,
            product,
            quantity,
            childProducts,
            optionModel,
            defaultShipment
        );
        addClydeContract.addContractsToCart(quantity, form, defaultShipment, currentBasket, productLineItems, productId);

        result.uuid = productLineItem.UUID;
    }

    return result;
}


module.exports = {
    addLineItem: base.addLineItem,
    addProductToCart: addProductToCart,
    checkBundledProductCanBeAdded: base.checkBundledProductCanBeAdded,
    ensureAllShipmentsHaveMethods: base.ensureAllShipmentsHaveMethods,
    getQtyAlreadyInCart: base.getQtyAlreadyInCart,
    getNewBonusDiscountLineItem: base.getNewBonusDiscountLineItem,
    getExistingProductLineItemInCart: base.getExistingProductLineItemInCart,
    getExistingProductLineItemsInCart: base.getExistingProductLineItemsInCart,
    getMatchingProducts: base.getMatchingProducts,
    allBundleItemsSame: base.allBundleItemsSame,
    hasSameOptions: base.hasSameOptions,
    BONUS_PRODUCTS_PAGE_SIZE: base.BONUS_PRODUCTS_PAGE_SIZE,
    updateBundleProducts: base.updateBundleProducts,
    getReportingUrlAddToCart: base.getReportingUrlAddToCart
};
