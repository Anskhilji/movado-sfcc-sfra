'use strict';
var server = require('server');

server.get('Start', server.middleware.https, function (req, res, next) {
    require('dw/system/Site');
    if (dw.system.Site.current.preferences.custom.Listrak_Cartridge_Enabled)	{
        var Transaction = require('dw/system/Transaction');
        var URLUtils = require('dw/web/URLUtils');
        var BasketMgr = require('dw/order/BasketMgr');
        var Product = require('*/cartridge/scripts/objects/ltkProduct.js');
        var LTKSCA = require('~/cartridge/controllers/ltkSendSca.js');

        var Logger = require('dw/system/Logger');
        var logger = Logger.getLogger('Listrak', 'LTK');

        var basket = BasketMgr.getCurrentOrNewBasket();
	    var productList = request.httpParameterMap.pid;
	    var orderItems;
	    if (basket.allProductLineItems.length > 0)	    	{ orderItems = basket.getAllProductLineItems(); }

	    var utils = require('dw/crypto/Encoding');
	    var decoded = utils.fromBase64(productList).toString();
	    var list = decoded.split(',');
        try		{
            Transaction.begin();
            var productLineItem;
		    var shipment = basket.getDefaultShipment();
		    var skipAdd = false;
		    for (var i = 0; i < list.length; i++)		    {
		    	var prodSku = list[i].split('*');
		    	var quantity = parseInt(prodSku[1]); // eslint-disable-line radix
		    	if (orderItems != null)		    	{
		        	for (var index = 0; index < orderItems.length; index++)		        	{
		        		var orderItem = orderItems[index];
		        		var product = orderItem.getProduct();
		        		if (product != null)		        		{
		        			var prd = new Product.ltkProduct();
		        			prd.LoadProduct(product);
			        		if (prd.sku === prodSku[0])			        			{ skipAdd = true; }
		        		}
		        	}
	        	}
	        	if (skipAdd === false)	        	{
	        		productLineItem = basket.createProductLineItem(prodSku[0], shipment);
	        		productLineItem.setQuantityValue(quantity);
	        	}	        	else	        		{ skipAdd = false; }
		    }
		    LTKSCA.SendSCA();
		    var cartUrl = URLUtils.url('Cart-Show');
            var parameterMap = request.getHttpParameterMap();
            parameterMap.getParameterNames().toArray().forEach(function (paramName) {
                cartUrl.append(paramName, parameterMap.get(paramName).toString());
            });
            Transaction.commit();
            response.redirect(cartUrl);
        }		catch (e)		{
            Transaction.rollback();
            logger.error('Problem with building the cart: ' + request.httpParameterMap.pid + ' ' + e.message);
            response.redirect(URLUtils.url('Cart-Show'));
            return;
        }
    }
});

module.exports = server.exports();

