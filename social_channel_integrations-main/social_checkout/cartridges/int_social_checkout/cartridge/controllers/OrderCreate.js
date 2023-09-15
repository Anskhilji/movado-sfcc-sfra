'use strict';

var server = require('server');

var customCartHelpers = require('*/cartridge/scripts/helpers/customCartHelpers');
var Logger = require('dw/system/Logger').getLogger('int_checkout', 'OrderCreate');
var orderCreateHelper = require('*/cartridge/scripts/util/OrderCreateHelper');
var OrderUtilCode = require('~/cartridge/scripts/util/OrderUtilCode');

var ReponseCode = OrderUtilCode.RESPONSE_CODE;
var CONTROLLER = 'OrderCreate';

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
    var BasketMgr = require('dw/order/BasketMgr');
    var Calendar = require('dw/util/Calendar');
    var CustomerMgr = require('dw/customer/CustomerMgr');
    var Money = require('dw/value/Money');
    var OrderMgr = require('dw/order/OrderMgr');
    var PaymentMgr = require('dw/order/PaymentMgr');
    var PaymentTransaction = require('dw/order/PaymentTransaction');
    var ProductInventoryMgr = require('dw/catalog/ProductInventoryMgr');
    var StringUtils = require('dw/util/StringUtils');
    var Transaction = require('dw/system/Transaction');
    var Site = require('dw/system/Site');
    var socialInventoryList = null;
    var inTransaction = false;
    var isGuest = true;
    var orderCustomer = null;
    var orderJSON = null;
    var controllerName = CONTROLLER + '-Social';

    session.custom.isSocial = true;

    // validate access token
    if (orderCreateHelper.checkAccessToken(req) === ReponseCode.INVALID_ACCESS_TOKEN) {
        res.json(ReponseCode.INVALID_ACCESS_TOKEN);
        response.setStatus(400);
        return next();
    }

    // get  order JSON string
    var orderReqStr = request.httpParameterMap.getRequestBodyAsString();

    // log order JSON
    Logger.debug('{0} orderJSON: {1}', controllerName, (orderReqStr || ''));

    try {
        orderJSON = JSON.parse(orderReqStr);
    } catch (e) {
        Logger.error(e.toString() + ' in ' + e.fileName + ':' + e.lineNumber);
        res.json({
            error: true,
            msg: 'Unable to parse order json'
        });
        response.setStatus(400);
        return next();
    }

    // if debug flag has been set, exit early
    if (Object.hasOwnProperty.call(orderJSON, 'debug') && orderJSON.debug) {
        res.json(ReponseCode.DEBUG_SUCCESS);
        return next();
    }

    // get customer Info
    var customerInfo = orderJSON.customer;
    if (Object.hasOwnProperty.call(customerInfo, 'customer_no') && customerInfo.customer_no) {
        orderCustomer = CustomerMgr.getCustomerByCustomerNumber(customerInfo.customer_no);
        if (orderCustomer === null) {
            res.json({
                error: true,
                msg: 'Customer with customerNo: ' + customerInfo.customer_no + ' was not found.'
            });
            response.setStatus(400);
            return next();
        }
    } else {
        isGuest = true;
    }

    // check channel inventory list
    var tiktokInvListID = orderCreateHelper.getSitePreference('tiktokInventoryListID');
    if (tiktokInvListID.length > 0) {
        socialInventoryList = ProductInventoryMgr.getInventoryList(tiktokInvListID);
        if (socialInventoryList == null) {
            res.json({
                error: true,
                msg: "Inventory list doesn't exist for this social channel"
            });
            response.setStatus(400);
            return next();
        }
    } else {
        // get default inventory list assigned
        socialInventoryList = ProductInventoryMgr.getInventoryList();
        if (socialInventoryList == null) {
            res.json({
                error: true,
                msg: 'No Inventory assigned to the site'
            });
            response.setStatus(400);
            return next();
        }
    }

    // check if order exists only if retry parameter is passed and true to prevent dedup
    if (Object.hasOwnProperty.call(orderJSON, 'c_externalOrderId') && orderJSON.c_externalOrderId) {
        var externalOrderExists = orderCreateHelper.orderExists(orderJSON.c_externalOrderId);
        if (externalOrderExists) {
            res.json(externalOrderExists);
            response.setStatus(400);
            return next();
        }
    }

    // get default promotion ID for TikTok
    var defaultPromoID = orderCreateHelper.getSitePreference('tiktokDefaultPromoID');
    if (defaultPromoID.length === 0) {
        defaultPromoID = 'TikTokPromo';
    }

    try {
        // create Basket for order
        var socialBasket = BasketMgr.getCurrentOrNewBasket();


        Transaction.begin();
        inTransaction = true;

        // set customer info
        if (!isGuest && customerInfo.customer_no) {
            socialBasket.setCustomerNo(customerInfo.customer_no);
        }

        // set customer email
        var customerEmail = orderCreateHelper.getSitePreference('tiktokCustomerEmail');
        if (Object.hasOwnProperty.call(customerInfo, 'customer_email') && customerInfo.customer_email) {
            customerEmail = customerInfo.customer_email;
        }
        socialBasket.setCustomerEmail(customerEmail);

        // customer name must be set from the customer profile or order billing address
        var customerObject = orderCreateHelper.getCustomerName(socialBasket, orderJSON, orderCustomer);
        if (customerObject && customerObject.firstName && customerObject.lastName) {
            socialBasket.setCustomerName(customerObject.firstName + ' ' + customerObject.lastName);
        }

        var jsonShipment = Object.hasOwnProperty.call(orderJSON, 'shipment') ? orderJSON.shipment : null;
        var jsonShippingAddress = jsonShipment && Object.hasOwnProperty.call(jsonShipment, 'shipping_address') ? jsonShipment.shipping_address : null;

        // create billing address
        orderCreateHelper.setBillingAddress(socialBasket, customerInfo.billing_address, jsonShippingAddress, customerObject);

        // create shipping address using default shipment
        var shipment = orderCreateHelper.setShippingAddress(socialBasket, orderJSON.shipment);

        // Create product line items and set cost
        var itemStockInfo = orderCreateHelper.addItemsToBasket(socialBasket, shipment, orderJSON.product_lineitems, socialInventoryList, defaultPromoID);


        // Custom Start: add logic to remove null clyde warrenty from basket
        customCartHelpers.removeNullClydeWarrantyLineItemAndEngraving(socialBasket);
        // Custom End

        // check item availability
        if (itemStockInfo.error === true) {
            Transaction.rollback();
            res.json(itemStockInfo);
            response.setStatus(400);
            return next();
        }

        // set shipping method
        orderCreateHelper.setShippingMethod(shipment, orderJSON.shipment);

        if (Object.hasOwnProperty.call(orderJSON, 'totals')) {
            // Set shipping cost
            if (Object.hasOwnProperty.call(orderJSON.totals, 'adjusted_shipping_total')) {
                orderCreateHelper.setShippingCost(shipment, orderJSON.totals.adjusted_shipping_total);
            }

            // add order level price adjustment
            if (Object.hasOwnProperty.call(orderJSON.totals, 'price_adjustments')) {
                orderCreateHelper.applyPriceAdjustments(defaultPromoID, orderJSON.totals.price_adjustments, socialBasket, socialBasket);
            }
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
        paymentMethod = orderCreateHelper.getSitePreference('tiktokPaymentMethod');
        if (paymentMethod.length < 1) {
            if (Object.hasOwnProperty.call(orderJSON, 'payment') && Object.hasOwnProperty.call(orderJSON.payment, 'payment_method')) {
                paymentMethod = orderJSON.payment.payment_method;
            } else {
                res.json({
                    error: true,
                    msg: 'TikTok Payment Method ID is missing in Site preferences'
                });
                response.setStatus(400);
                return next();
            }
        }

        var opi = socialBasket.createPaymentInstrument(paymentMethod, amount);
        opi.paymentTransaction.setPaymentProcessor(PaymentMgr.getPaymentMethod(paymentMethod).paymentProcessor);
        opi.paymentTransaction.setType(PaymentTransaction.TYPE_CAPTURE);

        // Set channel type for reporting
        socialBasket.setChannelType(socialBasket.CHANNEL_TYPE_TIKTOK);

        // create order
        var order = OrderMgr.createOrder(socialBasket);

        // Tie customer record to the order
        if (!isGuest && orderCustomer) {
            order.setCustomer(orderCustomer);
        }

        var placeOrderStatus = OrderMgr.placeOrder(order);
        if (placeOrderStatus.error) {
            OrderMgr.failOrder(order, false);
            res.json({
                error: true,
                success: 'Failed order. Order #' + order.orderNo
            });
            response.setStatus(400);
            return next();
        }
        order.custom.externalChannelOrderStatus = OrderUtilCode.EXTERNAL_ORDER_STATUS.NEW;

        if (Object.hasOwnProperty.call(orderJSON, 'c_buyerNote')) {
            order.custom.buyerNote = orderJSON.c_buyerNote;
        }

        if (Object.hasOwnProperty.call(orderJSON, 'c_orderNote')) {
            order.custom.orderNote = orderJSON.c_orderNote;
            var timestamp = StringUtils.formatCalendar(new Calendar(), "yyyy-MM-dd'T'HH:mm:ss'Z'");
            var noteData = {};
            noteData.orderNote = orderJSON.c_orderNote;
            noteData.noteData = timestamp;
            var noteHistory = JSON.parse('{"orderNoteData":[]}');
            noteHistory.orderNoteData.push(noteData);
            order.custom.orderNoteHistory = JSON.stringify(noteHistory);
        }

        if (Object.hasOwnProperty.call(orderJSON, 'c_orderTag')) {
            order.custom.orderTag = orderJSON.c_orderTag;
        }

        if (Object.hasOwnProperty.call(orderJSON, 'c_externalOrderId')) {
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
            msg: 'Success Order Created with  order #' + order.orderNo
        });
        return next();
    } catch (e) {
        if (inTransaction) Transaction.rollback();
        var errorMessage = e.toString() + ' in ' + e.fileName + ':' + e.lineNumber;
        Logger.error(errorMessage);
        res.json({
            error: true,
            msg: 'Exception: ' + errorMessage
        });
        response.setStatus(400);
        return next();
    }
});

module.exports = server.exports();
