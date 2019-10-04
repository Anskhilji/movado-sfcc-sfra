function create(order) {
    var shipment,
        prodLineItemIt,
        masterID,
        category,
        brand,
        productLineItem,
        product,
        lineItems = [];

    var ProductMgr = require('dw/catalog/ProductMgr');
    var RCUtilities = require('*/cartridge/scripts/riskified/util/RCUtilities');
    var orderShipmentIt = order.getShipments().iterator();

    var regex = "([\"\'\\\/])";
    var regExp = new RegExp(regex, 'gi');

    while (orderShipmentIt.hasNext()) {
        shipment = orderShipmentIt.next();

        prodLineItemIt = shipment.getProductLineItems().iterator();
        masterID = null;

        while (prodLineItemIt.hasNext()) {
            productLineItem = prodLineItemIt.next();
            product = ProductMgr.getProduct(productLineItem.productID);
            brand = product.getBrand();
            category = product.getPrimaryCategory();

            if (product.isVariant() && !empty(product.getVariationModel().getMaster())) {
                var masterProduct = product.getVariationModel().getMaster();
                masterID = masterProduct.getID();

                if (empty(brand)) {
                    brand = masterProduct.getBrand();
                }
                if (empty(category)) {
                    category = masterProduct.getPrimaryCategory();
                }
            } else {
                masterID = product.getID();
            }

            lineItems.push({
                title      : RCUtilities.escape(productLineItem.productName, regExp, '', true),
                price      : getPrice(productLineItem.adjustedPrice.decimalValue.get()),
                product_id : masterID,
                quantity   : productLineItem.quantity.value,
                sku        : productLineItem.productID,
                brand      : RCUtilities.escape(brand, regExp, '', true),
                category   : category ? category.getDisplayName() : ''
            });
        }
    }

    return lineItems;
}
function createFromContainer(order) {
    var shipment,
        prodLineItemIt,
        masterID,
        category,
        brand,
        productLineItem,
        product,
        lineItems = [];
    
    var EMBOSSED = 'Embossed';
    var ENGRAVED = 'Engraved';
    var GIFTWRAPPED = 'GiftWrapped';

    var ProductMgr = require('dw/catalog/ProductMgr');
    var RCUtilities = require('*/cartridge/scripts/riskified/util/RCUtilities');

    var regex = "([\"\'\\\/])";
    var regExp = new RegExp(regex, 'gi');

    var productLineItems = order.getAllProductLineItems().iterator();

    while (productLineItems.hasNext()) {
        productLineItem = productLineItems.next();
        masterID = null;
        
        product = productLineItem.getProduct();

        if (productLineItem.optionProductLineItem && 
        		(	(productLineItem.optionID == EMBOSSED && productLineItem.parent.custom.embossMessageLine1) || 
        			(productLineItem.optionID == ENGRAVED && productLineItem.parent.custom.engraveMessageLine1) ||
        			(productLineItem.optionID == GIFTWRAPPED && productLineItem.parent.custom.giftWrapOption) ) ) {
        	var warrantyName = productLineItem.parent.productName + ' | ' + productLineItem.productName;
            lineItems.push({
                title      : RCUtilities.escape(warrantyName, regExp, '', true),
                price      : getPrice(productLineItem.adjustedPrice.decimalValue.get()),
                product_id : productLineItem.optionValueID,
                quantity   : productLineItem.quantity.value,
                sku        : productLineItem.optionValueID,
                brand      : '',
                category   : ''
            });

        } else if (product && (product.bundle || product.bundled) ){
        	lineItems.push({
                title      : RCUtilities.escape(productLineItem.productName, regExp, '', true),
                price      : getPrice(productLineItem.adjustedPrice.decimalValue ? productLineItem.adjustedPrice.decimalValue.get() : 0),
                product_id : productLineItem.productID,
                quantity   : productLineItem.quantity.value,
                sku        : productLineItem.productID,
                brand      : product.brand,
                category   : (product.getPrimaryCategory() ? product.getPrimaryCategory().getDisplayName() : '')
            });
        } else if(product){
    		brand = product.getBrand();
            category = product.getPrimaryCategory();
    
            if (product.isVariant() && !empty(product.getVariationModel().getMaster())) {
                var masterProduct = product.getVariationModel().getMaster();
                masterID = masterProduct.getID();
    
                if (empty(brand)) {
                    brand = masterProduct.getBrand();
                }
                if (empty(category)) {
                    category = masterProduct.getPrimaryCategory();
                }
            } else {
                masterID = product.getID();
            }
    
            lineItems.push({
                title      : RCUtilities.escape(productLineItem.productName, regExp, '', true),
                price      : getPrice(productLineItem.adjustedPrice.decimalValue.get()),
                product_id : masterID,
                quantity   : productLineItem.quantity.value,
                sku        : productLineItem.productID,
                brand      : RCUtilities.escape(brand, regExp, '', true),
                category   : category ? category.getDisplayName() : ''
            });
        }
    }
    
    var giftCertIterator = order.getGiftCertificateLineItems().iterator();
	while (giftCertIterator.hasNext()){
		var giftCert = giftCertIterator.next();
		lineItems.push({
			title:  "Gift certificate",
			price: giftCert.getPriceValue(),
			product_id: "Gift certificate",
			quantity: 1,
			sku: "Gift certificate",
			requires_shipping: false
		});
	}
    
    return lineItems;
}

function getPrice(price){
	return new Number(price).toFixed(2);
}

exports.create = create;
exports.createFromContainer = createFromContainer;
