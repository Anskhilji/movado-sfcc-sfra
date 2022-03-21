// all file change difference with MSS-1671 v2Cartridge

'use strict';

var ProductMgr = require('dw/catalog/ProductMgr');
var Transaction = require('dw/system/Transaction');
var Resource = require('dw/web/Resource');
var Logger = require('dw/system/Logger');
var URLUtils = require('dw/web/URLUtils');

var clydeConstants = require('*/cartridge/scripts/utils/clydeConstants');


/**
 * get selected option id for clyde warranty items.
 *
 * @param {Object} params - The params which contains product id.
 * @param {string} productId - product sku
 * @return {Object} result - The resilt holding information
 */
function getClydeSelectedOptionProduct(params, productId) {
    var result = {
        optionProduct: '',
        clydeSKUID: ''
    };
    try {
        var clydeSku;
        if (typeof params.clydeContractSku === 'object') {
            clydeSku = params.clydeContractSku.stringValue ? params.clydeContractSku.stringValue : '';
        } else {
            clydeSku = params.clydeContractSku ? params.clydeContractSku : '';
        }

        if (!empty(clydeSku)) {
            var product = ProductMgr.getProduct(productId);
            if (!empty(product)) {
                var optionModel = product.optionModel;
                var clydeWarrantyOption = optionModel.getOption(clydeConstants.CLYDE_OPTION_PRODUCT_ID);
                var optionValue = optionModel.getOptionValue(clydeWarrantyOption, clydeSku);
                if (!empty(optionValue)) {
                    optionModel.setSelectedOptionValue(clydeWarrantyOption, optionValue);
                    result.optionProduct = optionModel;
                    result.clydeSKUID = clydeSku;
                    return result;
                }
            }
        }
    } catch (ex) {
        Logger.error('(clydeaddContracts~getClydeSelectedOptionProduct) -> Error occured while trying to get option product and error is : {0} at line number {1}', ex, ex.lineNumber);
    }

    return result;
}

/**
 * adds clyde contract custom attributes.
 *
 *@param {string} clydeSKU - The SKU of selected Clyde contract.
 * @param {Object} basket - The current customer basket.
 * @param {string} productId - product sku
 */
function addClydeContractAttributes(clydeSKU, basket, productId) {
    var productLineItemItr = basket.getAllProductLineItems().iterator();
    while (productLineItemItr.hasNext()) {
        var productLineItem = productLineItemItr.next();
        if (!empty(productLineItem.optionID)) {
            if (productLineItem.optionID === clydeConstants.CLYDE_OPTION_PRODUCT_ID && productLineItem.optionValueID === clydeConstants.CLYDE_OPTION_NONE) {
                basket.removeProductLineItem(productLineItem);
            }
        }
        if (productLineItem.productID === productId && !empty(clydeSKU)) {
            var optionLineItemsItr = productLineItem.getOptionProductLineItems().iterator();
            while (optionLineItemsItr.hasNext()) {
                var optionLineItem = optionLineItemsItr.next();
                if (optionLineItem.optionValueID === clydeSKU) {
                    optionLineItem.setTaxClassID(clydeConstants.CLYDE_OPTION_PRODUCT_TAX_ID);
                    // Custom Start: Remove clyde SKU from setLineItemText
                    optionLineItem.setLineItemText(clydeConstants.CLYDE_OPTION_TEXT + ' ' + productLineItem.productName);
                    // Custom End
                    optionLineItem.custom.clydeAssociatedProductSku = productId;
                    optionLineItem.custom.ClydeContractSku = clydeSKU;
                    productLineItem.custom.clydeAssociatedContractSku = clydeSKU;
                }
            }
        }
    }
}

/**
 * Function used to update clyde product options
 * @param {string} productId - The id of product which need's to be updated
 * @param {dw.order.Basket} basket - The current basket of customer
 */
function updateClydeProductOption(productId, basket) {
    var productLineItemItr = basket.getAllProductLineItems().iterator();
    try {
        while (productLineItemItr.hasNext()) {
            var productLineItem = productLineItemItr.next();

            if (productLineItem.productID === productId && !empty(productLineItem.optionID)) {
                if (productLineItem.optionID === clydeConstants.CLYDE_OPTION_PRODUCT_ID) {
                    var clydeSKU = productLineItem.optionValueID;
                    addClydeContractAttributes(clydeSKU, basket, productId);
                }
            }
        }
    } catch (ex) {
        Logger.error('(clydeaddContracts~updateClydeProductOption) -> Error occured while updating option product and error is : {0} at line number {1}', ex, ex.lineNumber);
    }
}

/**
 * Function used to set clyde contracts into cart
 * @param {string} productId - The product id
 * @param {string} clydeSKU - clyde sku contract
 * @param {dw.order.Basket} basket - The basket of current customer
 * @returns {Object} result - The result containg information
 */
function setClydeCartContracts(productId, clydeSKU, basket) {
    var params = {
        clydeContractSku: clydeSKU
    };
    var result = {
        error: false
    };
    try {
        var productLineItemItr = basket.getAllProductLineItems().iterator();
        while (productLineItemItr.hasNext()) {
            var productLineItem = productLineItemItr.next();
            if (productLineItem.productID === productId && !empty(clydeSKU)) {
                var clydeOptionProduct = getClydeSelectedOptionProduct(params, productId);
                if (!empty(clydeOptionProduct.optionProduct)) {
                    Transaction.wrap(function () { // eslint-disable-line no-loop-func
                        var clydeWarrantyOption = clydeOptionProduct.optionProduct;
                        var quantity = productLineItem.quantityValue;
                        var position = productLineItem.position;
                        basket.removeProductLineItem(productLineItem);
                        // Creating new line item
                        var product = ProductMgr.getProduct(productId);
                        var newLineItem = basket.createProductLineItem(product, clydeWarrantyOption, basket.getDefaultShipment());
                        newLineItem.setQuantityValue(quantity);
                        newLineItem.setPosition(position);
                    });
                } else {
                    result.error = true;
                    result.message = Resource.msg('error.cannot.update.product', 'cart', null);
                }
                break;
            }
        }

        if (!result.error) {
            Transaction.wrap(function () {
                addClydeContractAttributes(clydeSKU, basket, productId);
            });
            result.redirectURL = URLUtils.https('Cart-Show');
        }
    } catch (ex) {
        Logger.error('(clydeaddContracts~setClydeCartContracts) -> Error occured while trying to set option product and error is : {0} at line number {1}', ex, ex.lineNumber);
        result.error = true;
        result.message = Resource.msg('error.cannot.update.product', 'cart', null);
    }

    return result;
}

/**
 * creates order custom attribue.
 * @param {Object} order - Order object.
 */
function createOrderCustomAttr(order) {
    var contractjsonObj = [];
    var currentOrder = order;
    if (currentOrder) {
        var productLineItemsItr = currentOrder.getAllProductLineItems().iterator();
        try {
            while (productLineItemsItr.hasNext()) {
                var productLineItem = productLineItemsItr.next();
                if (!empty(productLineItem.optionID)) {
                    if (productLineItem.optionID === clydeConstants.CLYDE_OPTION_PRODUCT_ID) {
                        var clydeItem = {
                            productId: productLineItem.custom.clydeAssociatedProductSku,
                            contractSku: productLineItem.custom.ClydeContractSku,
                            contractPrice: productLineItem.getPriceValue(),
                            quantity: productLineItem.quantityValue
                        };
                        contractjsonObj.push(clydeItem);
                    }
                }
            }
            if (contractjsonObj.length > 0) {
                Transaction.wrap(function () {
                    currentOrder.custom.isContainClydeContract = true;
                    currentOrder.custom.clydeContractProductMapping = JSON.stringify(contractjsonObj);
                });
            }
        } catch (e) {
            Logger.error('Error occurred while trying to save contract products list into order' + e);
        }
    }
}

module.exports = {
    createOrderCustomAttr: createOrderCustomAttr,
    getClydeSelectedOptionProduct: getClydeSelectedOptionProduct,
    addClydeContractAttributes: addClydeContractAttributes,
    setClydeCartContracts: setClydeCartContracts,
    updateClydeProductOption: updateClydeProductOption
};
