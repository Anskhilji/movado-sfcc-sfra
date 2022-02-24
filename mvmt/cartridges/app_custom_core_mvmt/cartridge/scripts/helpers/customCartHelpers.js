'use strict';
var movadoCustomCartHelpers = module.superModule;
var Logger = require('dw/system/Logger');
var collections = require('*/cartridge/scripts/util/collections');
var productFactory = require('*/cartridge/scripts/factories/product');
var ProductMgr = require('dw/catalog/ProductMgr');
var EMBOSSED = 'Embossed';
var ENGRAVED = 'Engraved';
var Resource = require('dw/web/Resource');

var stringUtils = require('*/cartridge/scripts/helpers/stringUtils');

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
            var productObj = ProductMgr.getProduct(productID);
            var jewelryType = '';
            var watchGender = '';
            if (productObj.custom.watchGender && productObj.custom.watchGender.length) {
                watchGender = productObj.custom.watchGender[0];
            }
            if (!empty(productObj.custom.jewelryType)) {
                jewelryType = productObj.custom.jewelryType;
            }
            var customCategory = watchGender + " " + jewelryType;
            // Custom Start: Push current basket values in array.
            variant = getVaraintSize(pli);
            productGtmArray={
                "id" : productID,
                "name" : stringUtils.removeSingleQuotes(pli.product.name),
                "brand" : stringUtils.removeSingleQuotes(pli.product.brand),
                "category" : pli.product.variant && pli.product.masterProduct.primaryCategory ? stringUtils.removeSingleQuotes(pli.product.masterProduct.primaryCategory.ID)
                        : (pli.product.primaryCategory ? stringUtils.removeSingleQuotes(pli.product.primaryCategory.ID) : ''),
                "variant" : variant,
                "productType" : productModel.productType,
                "quantity" : productModel.quantities[0].value,
                "price" : productPrice,
                "variantID" : variantID,
                "currency" : pli.product.priceModel.price.currencyCode,
                "list" : Resource.msg('gtm.list.pdp.value','cart',null),
                "cartObj" : cartJSON,
                "customCategory" : customCategory
            };
        }
    });

    return productGtmArray;
}

function getVaraintSize(pli) {
    var variantSize = '';
    collections.forEach(pli.product.variationModel.productVariationAttributes, function(variationAttribute) {
        if (variationAttribute.displayName.equalsIgnoreCase('Size')) {
            variantSize = pli.product.variationModel.getSelectedValue(variationAttribute) ? pli.product.variationModel.getSelectedValue(variationAttribute).displayValue : '';
        } else {
            variantSize = '';
        }
    });
    return variantSize
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
                var productPrice = productModel.price && productModel.price.sales ? productModel.price.sales.value : (productModel.price && productModel.price.list ? productModel.price.list.value : '');
                cartJSON.push({
                    id: cartItem.productID,
                    name: stringUtils.removeSingleQuotes(cartItem.productName),
                    price: productPrice,
                    quantity:cartItem.quantityValue, 
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

//Custom Start : Added mvmt specific attributes in removeFromCart
function removeFromCartGTMObj(productLineItems){
    var cartItemObj = [];
    var variant = '';
    var displayValue = '';
    try {
        collections.forEach(productLineItems, function (pli) {
            if (!empty(pli)){
                variant = getProductOptions(pli.custom.embossMessageLine1,pli.custom.engraveMessageLine1);
                var price = pli.price.decimalValue ? pli.price.decimalValue.toString() : '0.0';
                var productObj = !empty(ProductMgr.getProduct(pli.product.ID)) ? ProductMgr.getProduct(pli.product.ID) : '';
                var jewelryType = '';
                var watchGender = '';
                if (productObj.custom.watchGender && productObj.custom.watchGender.length) {
                    watchGender = productObj.custom.watchGender[0];
                }
                if (!empty(productObj.custom.jewelryType)) {
                    jewelryType = productObj.custom.jewelryType;
                }
                var customCategory = watchGender + " " + jewelryType;
                collections.forEach(pli.product.variationModel.productVariationAttributes, function(variationAttributes) {
                    if (variationAttributes.displayName.equalsIgnoreCase('Size')) {
                        displayValue = pli.product.variationModel.getSelectedValue(variationAttributes) ? pli.product.variationModel.getSelectedValue(variationAttributes).displayValue : '';
                    } else {
                        displayValue = '';
                    }
                });
        
                cartItemObj.push({
                    'name': stringUtils.removeSingleQuotes(pli.product.name),
                    'id': pli.product.ID,
                    'price': price,
                    'category': customCategory,
                    'sku' : pli.product.ID,
                    'variantID' : pli.product.variant ? pli.product.ID : '',
                    'brand': pli.product.brand,
                    'currentCategory': !empty(pli.product.categories) ? stringUtils.removeSingleQuotes(pli.product.categories[0].displayName) : '',
                    'productType': (pli.product.variant && pli.product.masterProduct.primaryCategory)? pli.product.masterProduct.primaryCategory.displayName : (pli.product.primaryCategory ? pli.product.primaryCategory.displayName : ''),
                    'variant': displayValue,
                    'quantity':pli.quantityValue
                     });
                displayValue = '';
            }
            else{
                return '';
            }
        });
    } catch (ex) {
        Logger.error('(customCartHelper~removeFromCartGTMObj) -> Error occured while generting remove cart impression and error is:{0} at line {1} in file {2}', ex.toString(), ex.lineNumber, ex.fileName);
    }
   
    return cartItemObj;
}

movadoCustomCartHelpers.createAddtoCartProdObj = createAddtoCartProdObj;
movadoCustomCartHelpers.getProductOptions = getProductOptions;
movadoCustomCartHelpers.removeFromCartGTMObj = removeFromCartGTMObj;

module.exports = movadoCustomCartHelpers;