'use strict';

var Transaction = require('dw/system/Transaction');
var Resource = require('dw/web/Resource');
var ProductListMgr = require('dw/customer/ProductListMgr');

function validateAndSaveProduct(productId, customer) {
    var serverErrors = [];
    var productMgr = require('dw/catalog/ProductMgr');
    var myWatchesType = require('dw/customer/ProductList').TYPE_CUSTOM_1;
    var product = productMgr.getProduct(productId);

    if (!product || product == null) {
        serverErrors.push(
				Resource.msg('text.myWatches.alert.productNotFound', 'account', null)
	        );
        return { serverErrors: serverErrors, error: true };
    }
    var matchFound = false;
    if (customer && customer.isAuthenticated()) {
        var productLists = ProductListMgr.getProductLists(customer, myWatchesType);
        if (productLists && !productLists.empty) {
            var productList = productLists.iterator().next();
            var alreadyAddedItems = productList.getItems();
            for (var i = 0; i < alreadyAddedItems.length; i++) {
	        	if (alreadyAddedItems[i].productID === productId) {
	        		matchFound = true;
	        		break;
	        	}
	        }
            if (matchFound) {
                serverErrors.push(
						Resource.msg('text.myWatches.alert.alreadyExists', 'account', null)
			        );
                return { serverErrors: serverErrors, error: true };
            }
            Transaction.wrap(function () {
    			var item = productList.createProductItem(product);
    			item.custom.registrationDate = item.creationDate;
    		});
        } else {
			// create product list
            var productList = Transaction.wrap(function () {
		          return ProductListMgr.createProductList(customer, myWatchesType);
		        });
            Transaction.wrap(function () {
    			var item = productList.createProductItem(product);
    			item.custom.registrationDate = item.creationDate;
    		});
        }
    }		else {
        serverErrors.push(
				Resource.msg('text.myWatches.alert.customerNotAuthenticated', 'account', null)
	        );
        return { serverErrors: serverErrors, error: true };
    }

    return { serverErrors: serverErrors, error: false };
}

module.exports = {
    validateAndSaveProduct: validateAndSaveProduct
};
