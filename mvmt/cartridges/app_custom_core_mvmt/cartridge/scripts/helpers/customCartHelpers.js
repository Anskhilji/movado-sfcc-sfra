'use strict';
var basecustomCartHelpers = module.superModule;
var collections = require('*/cartridge/scripts/util/collections');
var productFactory = require('*/cartridge/scripts/factories/product');
var EMBOSSED = 'Embossed';
var ENGRAVED = 'Engraved';
var Resource = require('dw/web/Resource');

function createAddtoCartProdObj(lineItemCtnr, productUUID, embossedMessage, engravedMessage){
	var productGtmArray={};
    var variant;
    var variantID = '';
    var BasketMgr = require('dw/order/BasketMgr');
    var currentBasket = BasketMgr.getCurrentBasket();

	collections.forEach(lineItemCtnr.productLineItems, function (pli) {

        if (pli.UUID == productUUID) {
            var productID = pli.product.ID;
            var productModel = productFactory.get({pid: productID});
            var productPrice = pli.price.decimalValue ? pli.price.decimalValue.toString() : '0.0';
            if(pli.product.variant) {
                variantID = pli.product.ID;
            }
            variant=getProductOptions(embossedMessage,engravedMessage)
                    productGtmArray={
                        "id" : productID,
                        "name" : pli.product.name,
                        "brand" : pli.product.brand,
                        "category" : pli.product.variant && pli.product.masterProduct.primaryCategory ? pli.product.masterProduct.primaryCategory.ID
                                : (pli.product.primaryCategory ? pli.product.primaryCategory.ID : ''),
                        "variant" : variant,
                        "productType" : productModel.productType,
                        "quantity" : productModel.quantities[0].value,
                        "price" : productPrice,
                        "variantID" : variantID,
                        "currency" : pli.product.priceModel.price.currencyCode,
                        "list" : Resource.msg('gtm.list.pdp.value','cart',null)
                    };
                    if (currentBasket) {
                        var cartItems = currentBasket.allProductLineItems;
                        collections.forEach(cartItems, function (cartItem) {
                            if (cartItem.product != null && cartItem.product.optionModel != null) {
                                var productModel = productFactory.get({pid: cartItem.productID});
                                var productPrice = productModel.price && productModel.price.sales ? productModel.price.sales.decimalPrice : (productModel.price && productModel.price.list ? productModel.price.list.decimalPrice : '');
                                productGtmArray.cartProductID = cartItem.productID;
                                productGtmArray.cartProductName = cartItem.productName;
                                productGtmArray.cartProductQuantity = currentBasket.productQuantityTotal;
                                productGtmArray.cartProductPrice = productPrice;
                            }
                        });
                    }
                }
        });

        return productGtmArray;
}

/**
 *
 * @param categoryObj
 * @returns
 */
function getBasketParameters() {
    var BasketMgr = require('dw/order/BasketMgr');
    var currentBasket = BasketMgr.getCurrentBasket();
    var cartJSON = [];
    if (currentBasket) {
        var cartItems = currentBasket.allProductLineItems;
        collections.forEach(cartItems, function (cartItem) {
            if (cartItem.product != null && cartItem.product.optionModel != null) {
                var productModel = productFactory.get({pid: cartItem.productID});
                var productPrice = productModel.price && productModel.price.sales ? productModel.price.sales.decimalPrice : (productModel.price && productModel.price.list ? productModel.price.list.decimalPrice : '');
                cartJSON.push({
                    id: cartItem.productID,
                    name: cartItem.productName,
                    price: productPrice,
                    quantity:currentBasket.productQuantityTotal,
                    });
            }
        });
    }
    return cartJSON;
}

function getProductOptions(embossedMessage,engravedMessage){
	var variant;
	if (embossedMessage!= undefined && engravedMessage != undefined) {
		variant = EMBOSSED +','+ENGRAVED ;
    } else if (engravedMessage != undefined) {
    	variant = ENGRAVED;
    }
    else if (embossedMessage != undefined) {
    	variant = EMBOSSED;
    }else{
    	variant = '';
    }
	return variant;
}

basecustomCartHelpers.createAddtoCartProdObj = createAddtoCartProdObj;
basecustomCartHelpers.getProductOptions = getProductOptions;

module.exports = basecustomCartHelpers;