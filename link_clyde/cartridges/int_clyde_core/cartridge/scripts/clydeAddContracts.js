'use strict';

/* eslint no-param-reassign: ["error", { "props": false }] */
/* eslint operator-assignment: ["error", "never"] */
/* eslint no-use-before-define: ["error", {"functions": false}]*/

var ProductMgr = require('dw/catalog/ProductMgr');
var Transaction = require('dw/system/Transaction');
var Logger = require('dw/system/Logger');

/**
 * adds clyde contract to cart.
 *
 *@param {number} quantity - quantity of the product.
 * @param {Object} params - form data as params.
 * @param {Object} shipment - shipment.
 * @param {Object} cart - this cart object to add clyde.
 * @param {Object} productLineItems - all the product line items of the cart.
 * @param {string} productId - product sku
 */
function addContractsToCart(quantity, params, shipment, cart, productLineItems, productId) {
    var clydeSku;
    var clydePrice;
    if (typeof params.clydeContractSku === 'object') {
        clydeSku = params.clydeContractSku.stringValue ? params.clydeContractSku.stringValue : '';
        clydePrice = params.clydeContractPrice.stringValue ? params.clydeContractPrice.stringValue : '';
    } else {
        clydeSku = params.clydeContractSku ? params.clydeContractSku : '';
        clydePrice = params.clydeContractPrice ? params.clydeContractPrice : '';
    }
    addContracts(clydeSku, clydePrice, cart, productId, productLineItems, quantity, shipment);
}
/**
 * get product contract ID.
 *
 *@param {string} productId - ID of the product.
 * @param {string} clydeSku - SKU of clyde contract.
 * @param {string} clydePrice - price of clyde contract.
 * @returns {string} Returns productContractID.
 */
function getProductContractID(productId, clydeSku, clydePrice) {
    var delimiter = '_';
    return productId + delimiter + clydeSku + delimiter + clydePrice;
}
/**
 * add contracts.
 *
 * @param {string} clydeSku - SKU of clyde contract.
 * @param {string} clydePrice - price of clyde contract.
 * @param {Object} cart - cart objectt.
 * @param {string} productId - SKU of product.
 * @param {Object} productLineItems - productLineItems of cart.
 * @param {number} quantity - quantity of the product.
 * @param {Object} shipment - shipment object.
 */
function addContracts(clydeSku, clydePrice, cart, productId, productLineItems, quantity, shipment) {
    if (clydeSku) {
        var contractProductListObj = [];
        var parsedValue;
        var contractProductList = cart.custom.clydeContractProductList ? cart.custom.clydeContractProductList : '';
        var clydeQuantity = 1;
        var clydeTotalPrice = 0;
        var isExistingContract = false;
        var currentClydeProductID;
        var currentContractID = getProductContractID(productId, clydeSku, clydePrice);
        if (contractProductList) {
            try {
                parsedValue = JSON.parse(contractProductList);
                for (var i = 0; i < parsedValue.length; i++) {
                    contractProductListObj.push(parsedValue[i]);
                    if (parsedValue[i].clydeContactID === currentContractID) {
                        isExistingContract = true;
                        currentClydeProductID = parsedValue[i].clydeProductID;
                        clydeQuantity = clydeQuantity + parsedValue[i].quantity;
                        clydeTotalPrice = clydeTotalPrice + (parsedValue[i].totalPrice * clydeQuantity);
                    }
                }
            } catch (e) {
                Logger.error('Error occurred while parsing contract products list ', e);
            }
        }

        var priceNumber = Number(clydePrice);
        var totalPrice = priceNumber * quantity;
        var warrantyPeriod = clydeSku.substring(clydeSku.length - 2);
        var contractDisplayName = warrantyPeriod + ' warranty for: ' + ProductMgr.getProduct(productId).name;
        var currentClydeProduct;
        var totalQuantity;

        if (isExistingContract) {
            existingContract(productLineItems, clydeTotalPrice, clydeQuantity, currentClydeProductID, contractDisplayName);
            totalQuantity = clydeQuantity;
        } else {
            currentClydeProduct = addNewContractProduct(parsedValue, contractDisplayName, quantity, priceNumber, cart, shipment);
            totalQuantity = quantity;
        }

        var itemObject = {
            clydeContactID: currentContractID,
            clydeProductID: currentClydeProduct || '',
            clydeSku: clydeSku,
            eachPrice: priceNumber,
            productSku: productId,
            quantity: quantity,
            totalPrice: totalPrice,
            totalQuantity: totalQuantity
        };

        clydeContractProductList(contractProductListObj, itemObject, cart, currentContractID, quantity);
    }
}
/**
 * save clyde Contract Product List in cart custom attribute
 *
 *@param {Object} contractProductListObj - object of contracts and products.
 * @param {Object} itemObject - object of all the necessary items.
 * @param {Object} cart - this cart object to add clyde.
 * @param {number} currentContractID - current contract ID.
 * @param {number} quantity - quantity of the product.
 */
function clydeContractProductList(contractProductListObj, itemObject, cart, currentContractID, quantity) {
    var contractExists = false;

    if (contractProductListObj.length > 0) {
        for (var i = 0; i < contractProductListObj.length; i++) {
            if (contractProductListObj[i].clydeContactID === currentContractID) {
                contractProductListObj[i].quantity = contractProductListObj[i].quantity + quantity;
                contractExists = true;
            }
        }

        if (!contractExists) {
            contractProductListObj.push(itemObject);
        }
    } else {
        contractProductListObj.push(itemObject);
    }

    Transaction.wrap(function () {
        cart.custom.clydeContractProductList = JSON.stringify(contractProductListObj);
        /**
         * Custom Start: Clyde Integration. Logic to handle apple pay scenario
         */
        session.custom.clydeContractProductList = JSON.stringify(contractProductListObj);
        /**
         * Custom End:
         */
    });
}
/**
 * updates existing contracts quantity and price to cart.
 *
 *@param {Object} productLineItems - all the product line items of the cart.
 *@param {number} clydeTotalPrice - contract total price multiply of quantity
 *@param {number} clydeQuantity - quantity of the clyde contract.
 * @param {number} currentClydeProductID - current clyde product ID.
 * @param {string} contractDisplayName - Name of the product to be displayed on the cart page.
 */
function existingContract(productLineItems, clydeTotalPrice, clydeQuantity, currentClydeProductID, contractDisplayName) {
    for (var x = 0; x < productLineItems.length; x++) {
        var existingProductID = productLineItems[x].productID;
        if (existingProductID === currentClydeProductID) {
            productLineItems[x].setQuantityValue(clydeQuantity);
            productLineItems[x].setProductName(contractDisplayName);
            productLineItems[x].setLineItemText(contractDisplayName);
            productLineItems[x].setPriceValue(clydeTotalPrice);
            break;
        }
    }
}
/**
 * adds new clyde contract product to cart.
 *
 *@param {Object} parsedValue - parsed contract product list json object.
 * @param {string} contractDisplayName - Name of the product to be displayed on the cart page.
 * @param {number} quantity - quantity of the contract.
 * @param {number} priceNumber - price of the clyde contract.
 * @param {Object} cart - cart object
 * @param {Object} shipment - shipment object.
 * @returns {string} Returns current clyde product.
 */
function addNewContractProduct(parsedValue, contractDisplayName, quantity, priceNumber, cart, shipment) {
    var productLineItem;
    var addThisClydeProduct = parsedValue && parsedValue.length > 0 ? parsedValue.length : 0;
    var productList = clydeProductList();
    var productNo = productList[addThisClydeProduct];
    var currentClydeProduct = 'clydeproduct' + productNo;
    var clydeproductToAdd = ProductMgr.getProduct(currentClydeProduct);
    productLineItem = cart.createProductLineItem(clydeproductToAdd, null, shipment);
    productLineItem.setLineItemText(contractDisplayName);
    productLineItem.setPriceValue(priceNumber);
    productLineItem.setProductName(contractDisplayName);
    productLineItem.setQuantityValue(quantity);

    return currentClydeProduct;
}
/**
 * dummy clyde product lists numbers.
 * @returns {Object} Returns array object of numbers for clyde dummy products list.
 */
function clydeProductList() {
    var productList = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20'];
    return productList;
}
/**
 * updates clyde contract quantity and prices to cart.
 *
 * @param {Object} cart - this cart object to add clyde.
 */
function updateContracts(cart) {
    var contractProductList = cart.custom.clydeContractProductList ? cart.custom.clydeContractProductList : '';
    var productSku;
    var deletedContractUUIDs = [];
    var updateProductLineItemObject;
    if (contractProductList) {
        try {
            var parsedValue = JSON.parse(contractProductList);
            for (var i = 0; i < parsedValue.length; i++) {
                var items = parsedValue[i];
                productSku = items.productSku;
                var price = items.eachPrice;
                var productQuantities = cart.getProductQuantities();
                var productQuantitiesIt = productQuantities.keySet().iterator();
                var productQuantity = 0;
                var contractQuantity = 0;
                var contractPrice = 0;
                var contractPriceByProduct = 0;
                var productPriceByContract = 0;

                if (parsedValue.length > 1) {
                    while (productQuantitiesIt.hasNext()) {
                        var prod = productQuantitiesIt.next();
                        if (prod.ID === productSku) {
                            productQuantity = productQuantities.get(prod).value;
                        } else if (prod.ID === items.clydeProductID) {
                            contractQuantity = productQuantities.get(prod).value;
                        }
                        if (contractQuantity < productQuantity) {
                            contractPrice = price * contractQuantity;
                            contractPriceByProduct = price * productQuantity;
                            updateProductLineItemObject = updateProductLineItem(cart, contractQuantity, contractPrice, items.clydeProductID, contractPriceByProduct, productSku);
                            if (!empty(updateProductLineItemObject.deletedContractUUID)) {
                                deletedContractUUIDs.push(updateProductLineItemObject.deletedContractUUID);
                            }
                            if (updateProductLineItemObject.breakLoop) {
                                break;
                            }
                        } else {
                            contractPrice = price * productQuantity;
                            productPriceByContract = price * contractQuantity;
                            updateProductLineItemObject = updateProductLineItem(cart, productQuantity, contractPrice, items.clydeProductID, productPriceByContract, productSku);
                            if (!empty(updateProductLineItemObject.deletedContractUUID)) {
                                deletedContractUUIDs.push(updateProductLineItemObject.deletedContractUUID);
                            }
                            if (updateProductLineItemObject.breakLoop) {
                                break;
                            }
                        }
                    }
                } else {
                    while (productQuantitiesIt.hasNext()) {
                        var prod = productQuantitiesIt.next();
                        if (prod.ID === productSku) {
                            productQuantity = productQuantities.get(prod).value;
                        } else if (prod.ID === items.clydeProductID) {
                            contractQuantity = productQuantities.get(prod).value;
                        }
                    }
    
                    if (contractQuantity <= productQuantity) {
                        contractPrice = price * contractQuantity;
                        contractPriceByProduct = price * productQuantity;
                        updateProductLineItemObject = updateProductLineItem(cart, contractQuantity, contractPrice, items.clydeProductID, contractPriceByProduct, productSku);
                        if (!empty(updateProductLineItemObject.deletedContractUUID)) {
                            deletedContractUUIDs.push(updateProductLineItemObject.deletedContractUUID);
                        }
                    } else {
                        contractPrice = price * productQuantity;
                        productPriceByContract = price * contractQuantity;
                        updateProductLineItemObject = updateProductLineItem(cart, productQuantity, contractPrice, items.clydeProductID, productPriceByContract, productSku);
                        if (!empty(updateProductLineItemObject.deletedContractUUID)) {
                            deletedContractUUIDs.push(updateProductLineItemObject.deletedContractUUID);
                        }
                    }
                }
            }
        } catch (e) {
            Logger.error('Error occurred while parsing contract products list ' + e);
        }

        emptyCartCustomAttribute(cart);
        return deletedContractUUIDs;
    }
}
/**
 * updates ProductLine Item.
 * @param {Object} cart - this cart object to add clyde.
 * @param {number} contractQuantity - quantity of the contract.
 * @param {Object} contractPrice - price value of contract.
 * @param {string} contractProductID - contract product ID.
 * @return {string} deletedContractUUID - contract id which deleted
 */
function updateProductLineItem(cart, contractQuantity, contractPrice, contractProductID, contractTotalPrice, productSku) {
    var productLineItems = cart.getAllProductLineItems().iterator();
    var updateProductLineItemObj;
    while (productLineItems.hasNext()) {
        var productLineItem = productLineItems.next();
        var product = productLineItem.product;
        if (product != null && product.ID === contractProductID) {
            if (contractQuantity === 0) {
                updateProductLineItemObj = {
                    deletedContractUUID: productLineItem.getUUID()
                };
                cart.removeProductLineItem(productLineItem);
                updateCartCustomAttr(cart, contractProductID, 0);
                break;
            } else {
                productLineItem.setQuantityValue(Number(contractQuantity));
                productLineItem.setPriceValue(contractPrice);
                updateCartCustomAttr(cart, contractProductID, contractQuantity);
                break;
            }
        }
    }
    return updateProductLineItemObj;
}
/**
 * updates Cart Custom Attribute.
 * @param {Object} cart - this cart object to add clyde.
 * @param {string} contractProductID - contract Product ID.
 * @param {number} quantity - quantity of the contract.
 */
function updateCartCustomAttr(cart, contractProductID, quantity) {
    var contractProductList = cart.custom.clydeContractProductList ? cart.custom.clydeContractProductList : '';
    var newContractProductList = [];
    var parsedValue;
    try {
        parsedValue = JSON.parse(contractProductList);
        for (var i = 0; i < parsedValue.length; i++) {
            if (parsedValue[i].clydeProductID !== contractProductID) {
                newContractProductList.push(parsedValue[i]);
            } else if (parsedValue[i].clydeProductID === contractProductID && quantity !== 0) {
                parsedValue[i].totalQuantity = quantity;
                newContractProductList.push(parsedValue[i]);
            }
        }
        Transaction.wrap(function () {
            cart.custom.clydeContractProductList = JSON.stringify(newContractProductList);
            /**
             * Custom Start: Clyde Integration. Logic to handle apple pay scenario
             */
            session.custom.clydeContractProductList = JSON.stringify(newContractProductList);
            /**
             * Custom End:
             */
        });
    } catch (e) {
        Logger.error('Error occurred while parsing contract products list ' + e);
    }
}
/**
 * empty Cart CustomAttribute when the line items are removed from the cart.
 *
 * @param {Object} cart - this cart object to add clyde.
 */
function emptyCartCustomAttribute(cart) {
    var productLineItems = cart.getAllProductLineItems().iterator();

    if (!productLineItems.hasNext()) {
        cart.custom.clydeContractProductList = JSON.stringify('');
    }
}
/**
 * creates order custom attribue.
 * @param {Object} contractProductList - object with contract Product Lists.
 * @param {Object} order - Order object.
 */
function createOrderCustomAttr(contractProductList, order) {
    if (contractProductList) {
        try {
            var parsedValue = JSON.parse(contractProductList);
            var contractjsonObj = [];

            for (var i = 0; i < parsedValue.length; i++) {
                var productId = parsedValue[i].productSku;
                var contractSku = parsedValue[i].clydeSku;
                var contractPrice = parsedValue[i].eachPrice;
                var quantity = parsedValue[i].totalQuantity;

                var items = {
                    productId: productId,
                    contractSku: contractSku,
                    contractPrice: contractPrice,
                    quantity: quantity
                };
                contractjsonObj.push(items);
            }

            Transaction.wrap(function () {
                order.custom.isContainClydeContract = true;
                order.custom.clydeContractProductMapping = JSON.stringify(contractjsonObj);
            });
        } catch (e) {
            Logger.error('Error occurred while parsing contract products list' + e);
        }
    }
}

module.exports = {
    addContractsToCart: addContractsToCart,
    updateContracts: updateContracts,
    createOrderCustomAttr: createOrderCustomAttr
};

