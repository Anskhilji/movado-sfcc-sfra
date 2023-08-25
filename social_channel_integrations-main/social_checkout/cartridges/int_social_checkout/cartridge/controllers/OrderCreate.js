'use strict';

var server = require('server');
var customCartHelpers = require('*/cartridge/scripts/helpers/customCartHelpers');
var orderCreateHelper = require('*/cartridge/scripts/util/OrderCreateHelper');
var OrderUtilCode = require("~/cartridge/scripts/util/OrderUtilCode");

var ReponseCode = OrderUtilCode.RESPONES_CODE;
/**
 * OrderCreate-PlaceOrder : The CheckoutServices-PlaceOrder endpoint places the order
 * @name CheckoutServices-PlaceOrder
 * @function
 * @memberof CheckoutServices
 * @param {middleware} - server.middleware.https
 * @param {category} - sensitive
 * @param {returns} - json
 * @param {serverfunction} - post
 */


server.post('Social', function (req, res, next) {
	/* Local API Includes */
	var CustomerMgr = require('dw/customer/CustomerMgr');
    var ProductInventoryMgr = require ('dw/catalog/ProductInventoryMgr');
    var BasketMgr = require('dw/order/BasketMgr');
    var Transaction = require('dw/system/Transaction');
    var Site = require('dw/system/Site');
	var Shipment = require('dw/order/Shipment');
    var PaymentInstrument = require('dw/order/PaymentInstrument');
    var Money = require('dw/value/Money');
    var OrderMgr = require('dw/order/OrderMgr');
    var PaymentMgr = require('dw/order/PaymentMgr');
	var Order = require('dw/order/Order');
    var socialInventoryList =  null;
	var inTransaction = false;
    var isGuest = true;
    var customer =null;
    var  orderJSON  = null;

    session.custom.isSocial=true;


    //validate access token
    if (orderCreateHelper.checkAccessToken(req) ==  ReponseCode.INVALID_ACCESS_TOKEN) {
        res.json(ReponseCode.INVALID_ACCESS_TOKEN);
        response.setStatus(400);
        return next();
    }

    //get  order JSON string
    var orderReqStr = request.httpParameterMap.getRequestBodyAsString();

    try {
        orderJSON = JSON.parse(orderReqStr);
    } catch (e) {
        res.json({
            error: true,
            msg: "Unable to parse order json"
        });
        response.setStatus(400);
        return next();

    }

    // get customer Info
    var customerInfo = orderJSON.customer;
    if  (customerInfo.hasOwnProperty ('customer_no')) {
        customer = CustomerMgr.getCustomerByCustomerNumber(customerInfo.customer_no);
		if (customer === null) {
            res.json({
                error: true,
                msg: "Customer with customerNo: " + customerInfo.customer_no + " was not found."
            });
            response.setStatus(400);
            return next();
		}
    }
    else {
        isGuest  = true;
    }

    //check channel inventory list
    var tiktokInvListID = orderCreateHelper.getSitePreference("tiktokInventoryListID");
    if (tiktokInvListID.length > 0 ) {
        socialInventoryList = ProductInventoryMgr.getInventoryList(tiktokInvListID);
        if (socialInventoryList == null) {
            res.json({
                error: true,
                msg: "Inventory list doesn't exist for this social channel"
            });
            response.setStatus(400);
            return next();
        }
    }
    else {
        //get default inventory list assigned
        socialInventoryList = ProductInventoryMgr.getInventoryList();
        if (socialInventoryList == null) {
            res.json({
                error: true,
                msg: "No Inventory assigned to the site"
            });
            response.setStatus(400);
            return next();
        }
    }
    //check if order exists only if retry parameter is passed and true to prevent dedup
    //if(orderJSON.hasOwnProperty('retry') && orderJSON.retry && orderJSON.hasOwnProperty('c_externalOrderId')){
        var externalOrderExists = orderCreateHelper.orderExists(orderJSON.c_externalOrderId);
        if (externalOrderExists != null) {
            res.json(externalOrderExists);
            response.setStatus(400);
            return next();
        }
    //}

    //get default promotion ID for TikTok
    var defaultPromoID = orderCreateHelper.getSitePreference("tiktokDefaultPromoID");
    if (defaultPromoID.length == 0) {
        defaultPromoID = "TikTokPromo";
    }

    try {
        //create Basket for order
        var socialBasket = BasketMgr.getCurrentOrNewBasket();


        Transaction.begin();
        inTransaction = true;

        //set customer info
        if (!isGuest) {
            socialBasket.setCustomerNo(customerInfo.customer_no);
        }
        var customerEmail = orderCreateHelper.getSitePreference("tiktokCustomerEmail");
        var customerName = orderCreateHelper.getSitePreference("tiktokCustomerName");
        if (customerInfo.hasOwnProperty("customer_email")) {
            customerEmail = customerInfo.customer_email;
        }
        if (customerInfo.hasOwnProperty("customer_name")) {
            customerName = customerInfo.customer_name;
        }
        socialBasket.setCustomerEmail(customerEmail);
        //socialBasket.setCustomerName(customerName);

        // Create billing address
        orderCreateHelper.setBillingAddress (socialBasket, customerInfo.billing_address)

		//create shipping address using default shipment
        var shipment = orderCreateHelper.setShippingAddress (socialBasket, orderJSON.shipment);

		// Create product line items and set cost
        var itemStockInfo = orderCreateHelper.addItemsToBasket(socialBasket,shipment,  orderJSON.product_lineitems, socialInventoryList, defaultPromoID);

        // Custom Start: add logic to remove null clyde warrenty from basket
        customCartHelpers.removeNullClydeWarrantyLineItemAndEngraving(socialBasket);
        // Custom End

        //check item availability
        if (itemStockInfo.error == true) {
            Transaction.rollback();
            res.json(itemStockInfo);
            response.setStatus(400);
            return next();
        }

        //set shipping method
        orderCreateHelper.setShippingMethod (shipment, orderJSON.shipment);

        // Set shipping cost
        orderCreateHelper.setShippingCost(shipment, orderJSON.totals.adjusted_shipping_total);

        //add order level price adjustment
        if (orderJSON.totals.hasOwnProperty('price_adjustments')) {
            orderCreateHelper.applyPriceAdjustments(defaultPromoID, orderJSON.totals.price_adjustments, socialBasket,socialBasket);
        }

        // remove auto applied promotion
        orderCreateHelper.removePriceAdjustments(socialBasket, defaultPromoID);

        // Update totals and do not call calculate hook since it will override prices, promotions, and taxes
		socialBasket.updateTotals();
		socialBasket.updateOrderLevelPriceAdjustmentTax();


        // Add basket currency, credit card payment instrument, and payment transaction
	    socialBasket.removeAllPaymentInstruments();
	    var currency = orderJSON.currency;
		var amount = new Money(socialBasket.getTotalGrossPrice().getValue(), currency);



        var paymentMethod = null;
        paymentMethod =  orderCreateHelper.getSitePreference("tiktokPaymentMethod");
        if (paymentMethod.length < 1) {
            if(orderJSON.hasOwnProperty('payment') && orderJSON.payment.hasOwnProperty('payment_method')){
                paymentMethod = rderJSON.payment.payment_method;
            }
            else {
                res.json({
                    error: true,
                    msg: "TikTok Payment Method ID is missing in Site preferences"
                });
                response.setStatus(400);
                return next();
            }
        }

        var opi = socialBasket.createPaymentInstrument(paymentMethod, amount);
        opi.paymentTransaction.setPaymentProcessor(PaymentMgr.getPaymentMethod(paymentMethod).paymentProcessor);
        opi.paymentTransaction.setType(dw.order.PaymentTransaction.TYPE_CAPTURE);

		// Set channel type for reporting
		socialBasket.setChannelType(socialBasket.CHANNEL_TYPE_TIKTOK);

        //create order
        var order = OrderMgr.createOrder(socialBasket);

        // Tie customer record to the order
        if (!isGuest) {
	        order.setCustomer(customer);
        }

        var placeOrderStatus = OrderMgr.placeOrder(order);
        if (placeOrderStatus.error) {
            OrderMgr.failOrder(order, false);
            res.json({
                error: true,
                success: "Failed order. Order #" + order.orderNo
            });
            response.setStatus(400);
            return next();
        }
        order.custom.externalChannelOrderStatus = OrderUtilCode.EXTERNAL_ORDER_STATUS.NEW;

        if(orderJSON.hasOwnProperty('c_buyerNote')){
            order.custom.buyerNote = orderJSON.c_buyerNote;
        }

        if(orderJSON.hasOwnProperty('c_orderNote')){
            order.custom.orderNote = orderJSON.c_orderNote;

            var StringUtils = require('dw/util/StringUtils');
            var timestamp = StringUtils.formatCalendar(new dw.util.Calendar(),  "yyyy-MM-dd'T'HH:mm:ss'Z'");
            var noteData = new Object();
            noteData.orderNote = orderJSON.c_orderNote;
            noteData.noteData = timestamp;
            var noteHistory = JSON.parse("{\"orderNoteData\":[]}");
            noteHistory.orderNoteData.push(noteData);
            order.custom.orderNoteHistory = JSON.stringify(noteHistory);
        }

        if(orderJSON.hasOwnProperty('c_orderTag')){
            order.custom.orderTag = orderJSON.c_orderTag;
        }

        if(orderJSON.hasOwnProperty('c_externalOrderId')){
            order.custom.externalOrderId = orderJSON.c_externalOrderId;
        }


        // Salesforce Order Management attributes
        if ('SOMIntegrationEnabled' in Site.getCurrent().preferences.custom && Site.getCurrent().preferences.custom.SOMIntegrationEnabled) {
            var populateOrderJSON = require('*/cartridge/scripts/jobs/populateOrderJSON');
            var somLog = require('dw/system/Logger').getLogger('SOM', 'CheckoutServices');
            try {
                var order = OrderMgr.getOrder(order.orderNo);
                Transaction.wrap(function () {
                    populateOrderJSON.populateByOrder(order);
                });
            } catch (exSOM) {
                somLog.error('SOM attribute process failed: ' + exSOM.message + ',exSOM: ' + JSON.stringify(exSOM));
            }
        }
        // End Salesforce Order Management

        Transaction.commit();
		inTransaction = false;
        res.json({
            error: false,
            orderNo: order.orderNo,
            orderItems: itemStockInfo.itemInfo,
            c_externalChannelOrderStatus: order.getStatus().getDisplayValue(),
            shippingStatus: order.getShippingStatus().getDisplayValue(),
            msg: "Success Order Created with  order #"+ order.orderNo
        });
        return next();
    } catch (e) {
        if (inTransaction) Transaction.rollback();

        res.json({
            error: true,
            msg: "Exception: " + e
        });
        response.setStatus(400);
        return next();
    }

});

module.exports = server.exports();
