'use strict';
var movadoCustomCartHelpers = module.superModule;
var collections = require('*/cartridge/scripts/util/collections');
var productFactory = require('*/cartridge/scripts/factories/product');
var EMBOSSED = 'Embossed';
var ENGRAVED = 'Engraved';
var Resource = require('dw/web/Resource');

function createAddtoCartProdObj(lineItemCtnr, productUUID, embossedMessage, engravedMessage){
    var productGtmArray={};
    var variant;
    var variantID = '';
    var cartJSON = getBasketParameters();

    collections.forEach(lineItemCtnr.productLineItems, function (pli) {

        if (pli.UUID == productUUID) {
           var productID = pli.product.ID;
            var productModel = productFactory.get({pid: productID});
            var productPrice = pli.price.decimalValue ? pli.price.decimalValue.toString() : '0.0';
            if(pli.product.variant) {
                variantID = pli.product.ID;
            }
            // Custom Start: Push current basket values in array.
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
                        "list" : Resource.msg('gtm.list.pdp.value','cart',null),
                        "cartObj" : cartJSON
                    };
                }
        });

        return productGtmArray;
}
// Custom Start: create a funtion to get basket parameters.

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

// Custom End

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

function removeFromCartGTMObj(productLineItems){
    var cartItemObj = [];
    var variant = '';
    var displayValue = '';
    collections.forEach(productLineItems, function (pli) {
		variant = getProductOptions(pli.custom.embossMessageLine1,pli.custom.engraveMessageLine1);
        var price = pli.price.decimalValue ? pli.price.decimalValue.toString() : '0.0';

        collections.forEach(pli.product.variationModel.productVariationAttributes, function(variationAttributes) {
            if (variationAttributes.displayName.equalsIgnoreCase('Size')) {
                displayValue = pli.product.variationModel.getSelectedValue(variationAttributes).displayValue;
            } else {
                displayValue = '';
            }
        });

     	cartItemObj.push({
            'name': pli.product.name,
            'id': pli.product.ID,
            'price': price,
            'category': pli.product.categories[0].ID,
            'sku' : pli.product.ID,
            'variantID' : pli.product.variant ? pli.product.ID : '',
            'brand': pli.product.brand,
            'currentCategory': pli.product.categories[0].displayName,
            'productType': (pli.product.variant && pli.product.masterProduct.primaryCategory)? pli.product.masterProduct.primaryCategory.displayName : (pli.product.primaryCategory ? pli.product.primaryCategory.displayName : ''),
            'variant': displayValue,
            'quantity':pli.quantityValue
             });
        displayValue = '';
     	});
	 return cartItemObj;

}

movadoCustomCartHelpers.createAddtoCartProdObj = createAddtoCartProdObj;
movadoCustomCartHelpers.getProductOptions = getProductOptions;
movadoCustomCartHelpers.removeFromCartGTMObj = removeFromCartGTMObj;

module.exports = movadoCustomCartHelpers;