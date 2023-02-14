'use strict';

var cartHelpers = module.superModule;
var ProductMgr = require('dw/catalog/ProductMgr');
var Resource = require('dw/web/Resource');

var collections = require('*/cartridge/scripts/util/collections');
var productHelper = require('*/cartridge/scripts/helpers/productHelpers');

/**
 * This function is copied from storefront base cartridge to override Movado specific changes and restore SFRA functionality.
 * Filter all the product line items matching productId and
 * has the same bundled items or options in the cart
 * @param {dw.catalog.Product} product - Product object
 * @param {string} productId - Product ID to match
 * @param {dw.util.Collection<dw.order.ProductLineItem>} productLineItems - Collection of the Cart's
 *     product line items
 * @param {string[]} childProducts - the products' sub-products
 * @param {SelectedOption[]} options - product options
 * @return {dw.order.ProductLineItem[]} - Filtered all the product line item matching productId and
 *     has the same bundled items or options
 */
cartHelpers.getExistingProductLineItemsInCart = function getExistingProductLineItemsInCart(product, productId, productLineItems, childProducts, options) {
    var matchingProductsObj = cartHelpers.getMatchingProducts(productId, productLineItems);
    var matchingProducts = matchingProductsObj.matchingProducts;
    var productLineItemsInCart = matchingProducts.filter(function (matchingProduct) {
        return product.bundle
            ? allBundleItemsSame(matchingProduct.bundledProductLineItems, childProducts)
            : cartHelpers.hasSameOptions(matchingProduct.optionProductLineItems, options || []);
    });

    return productLineItemsInCart;
}

/**
 * This function is copied from storefront base cartridge to override Movado specific changes and restore SFRA functionality.
 * Filter the product line item matching productId and
 * has the same bundled items or options in the cart
 * @param {dw.catalog.Product} product - Product object
 * @param {string} productId - Product ID to match
 * @param {dw.util.Collection<dw.order.ProductLineItem>} productLineItems - Collection of the Cart's
 *     product line items
 * @param {string[]} childProducts - the products' sub-products
 * @param {SelectedOption[]} options - product options
 * @return {dw.order.ProductLineItem} - get the first product line item matching productId and
 *     has the same bundled items or options
 */
cartHelpers.getExistingProductLineItemInCart = function getExistingProductLineItemInCart(product, productId, productLineItems, childProducts, options) {
    return cartHelpers.getExistingProductLineItemsInCart(product, productId, productLineItems, childProducts, options)[0];
}

/** 
 * This function is copied from storefront base cartridge to override Movado specific changes and restore SFRA functionality.
 * Determines whether a product's current options are the same as those just selected   
 *  
 * @param {dw.util.Collection} existingOptions - Options currently associated with this product 
 * @param {SelectedOption[]} selectedOptions - Product options just selected    
 * @return {boolean} - Whether a product's current options are the same as those just selected  
 */ 
cartHelpers.hasSameOptions = function hasSameOptions(existingOptions, selectedOptions) { 
    var selected = {};  
    for (var i = 0, j = selectedOptions.length; i < j; i++) {   
        selected[selectedOptions[i].optionId] = selectedOptions[i].selectedValueId; 
    }   
    return collections.every(existingOptions, function (option) {   
        return option.optionValueID === selected[option.optionID];  
    }); 
}

/**
 * This function is copied from storefront base cartridge to override Movado specific changes and restore SFRA functionality.
 * Adds a product to the cart. If the product is already in the cart it increases the quantity of
 * that product.
 * @param {dw.order.Basket} currentBasket - Current users's basket
 * @param {string} productId - the productId of the product being added to the cart
 * @param {number} quantity - the number of products to the cart
 * @param {string[]} childProducts - the products' sub-products
 * @param {SelectedOption[]} options - product options
 *  @return {Object} returns an error object
 */
cartHelpers.addProductToCart = function addProductToCart(currentBasket, productId, quantity, childProducts, options) {
    var availableToSell;
    var defaultShipment = currentBasket.defaultShipment;
    var perpetual;
    var product = ProductMgr.getProduct(productId);
    var productInCart;
    var productLineItems = currentBasket.productLineItems;
    var productQuantityInCart;
    var quantityToSet;
    var optionModel;
    if (product && product.optionModel) {
        optionModel = productHelper.getCurrentOptionModel(product.optionModel, options);
    }
    var result = {
        error: false,
        message: Resource.msg('text.alert.addedtobasket', 'product', null)
    };

    var totalQtyRequested = 0;
    var canBeAdded = false;

    if (product.bundle) {
        canBeAdded = cartHelpers.checkBundledProductCanBeAdded(childProducts, productLineItems, quantity);
    } else {
        totalQtyRequested = quantity + cartHelpers.getQtyAlreadyInCart(productId, productLineItems);
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
            product.name
        );
        return result;
    }

    productInCart = cartHelpers.getExistingProductLineItemInCart(product, productId, productLineItems, childProducts, options);

    if (productInCart && empty(productInCart.custom.giftParentUUID)) {
        productQuantityInCart = productInCart.quantity.value;
        quantityToSet = quantity ? quantity + productQuantityInCart : productQuantityInCart + 1;
        availableToSell = productInCart.product.availabilityModel.inventoryRecord.ATS.value;

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
        productLineItem = cartHelpers.addLineItem(
            currentBasket,
            product,
            quantity,
            childProducts,
            optionModel,
            defaultShipment
        );

        result.uuid = productLineItem.UUID;
    }

    return result;
}

module.exports = cartHelpers;
