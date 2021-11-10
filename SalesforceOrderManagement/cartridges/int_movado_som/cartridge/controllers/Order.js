'use strict';

var server = require('server');
server.extend(module.superModule);
var URLUtils = require('dw/web/URLUtils');
var ProductMgr = require('dw/catalog/ProductMgr');
var Money = require('dw/value/Money');
var Resource = require('dw/web/Resource');
var Site = require('dw/system/Site');
var stringUtils = require('*/cartridge/scripts/helpers/stringUtils');
var csrfProtection = require('*/cartridge/scripts/middleware/csrf');
var userLoggedIn = require('*/cartridge/scripts/middleware/userLoggedIn');
var consentTracking = require('*/cartridge/scripts/middleware/consentTracking');

server.replace(
    'History',
    consentTracking.consent,
    server.middleware.https,
    userLoggedIn.validateLoggedIn,
    function (req, res, next) {

        // Customer Email
        var emailAddress = req.currentCustomer.profile.email;
        var SalesforceModel = require('*/cartridge/scripts/SalesforceService/models/SalesforceModel');

        var orders = SalesforceModel.getOrdersByCustomerEmail({
            emailAddress: emailAddress,
            salesChannel: Site.getCurrent().getID()
        });

        var breadcrumbs = [
            {
                htmlValue: Resource.msg('global.home', 'common', null),
                url: URLUtils.home().toString()
            },
            {
                htmlValue: Resource.msg('page.title.myaccount', 'account', null),
                url: URLUtils.url('Account-Show').toString()
            }
        ];


        if (orders.ok && orders.object && orders.object.orders) {
            var ProductImageDIS = require('*/cartridge/scripts/helpers/ProductImageDIS');
            var formatCurrency = require('*/cartridge/scripts/util/formatting').formatCurrency;

            for (var i = 0; i < orders.object.orders.length; i++) {

                // Currency Format
                if (orders.object.orders[i].total) {
                    orders.object.orders[i].total = formatCurrency(orders.object.orders[i].total, orders.object.orders[i].currencyISO);
                }

                var product = ProductMgr.getProduct(orders.object.orders[i].productCode);
                var firstImage = new ProductImageDIS(product, 'tile150');
                if (firstImage) {
                    orders.object.orders[i].imageURL = firstImage.getURL();
                    orders.object.orders[i].imageAlt = firstImage.getAlt();
                    orders.object.orders[i].imageTitle = firstImage.getTitle();
                } else {
                    orders.object.orders[i].imageURL = '';
                    orders.object.orders[i].imageTitle = '';
                    orders.object.orders[i].imageAlt = '';
                }

                if (orders.object.orders[i].status && orders.object.orders[i].status === 'Sent to SAP') {
                    orders.object.orders[i].status = Resource.msg('label.order.defaultOrderStatus', 'confirmation', null);
                }
            }

            res.render('account/order/history', { 
                orders: orders.object.orders,
                orderFilter: req.querystring.orderFilter,
                accountlanding: false,
                breadcrumbs: breadcrumbs
            });
        }
        else {
            res.render('account/order/history', { 
                orders: {},
                orderFilter: req.querystring.orderFilter,
                accountlanding: false,
                breadcrumbs: breadcrumbs
            });
        }


        next();
    }
);

server.replace(
    'Details',
    consentTracking.consent,
    server.middleware.https,
    userLoggedIn.validateLoggedIn,
    function (req, res, next) {
        var OrderMgr = require('dw/order/OrderMgr');
        var OrderModel = require('*/cartridge/models/order');
        var Locale = require('dw/util/Locale');

        var order = OrderMgr.getOrder(req.querystring.orderID);
        var orderCustomerNo = req.currentCustomer.profile.customerNo;
        var currentCustomerNo = !empty(order) ? order.customer.profile.customerNo : '';
        var breadcrumbs = [
            {
                htmlValue: Resource.msg('global.home', 'common', null),
                url: URLUtils.home().toString()
            },
            {
                htmlValue: Resource.msg('page.title.myaccount', 'account', null),
                url: URLUtils.url('Account-Show').toString()
            },
            {
                htmlValue: Resource.msg('label.orderhistory', 'account', null),
                url: URLUtils.url('Order-History').toString()
            }
        ];

        if (order && orderCustomerNo === currentCustomerNo) {
            var config = {
                numberOfLineItems: '*'
            };

            var currentLocale = Locale.getLocale(req.locale.id);

            var orderModel = new OrderModel(
                order,
                { config: config, countryCode: currentLocale.country, containerView: 'order' }
            );
            var exitLinkText = Resource.msg('link.orderdetails.orderhistory', 'account', null);
            var exitLinkUrl =
                URLUtils.https('Order-History', 'orderFilter', req.querystring.orderFilter);
            res.render('account/orderDetails', {
                order: orderModel,
                exitLinkText: exitLinkText,
                exitLinkUrl: exitLinkUrl,
                breadcrumbs: breadcrumbs
            });
        } else {
            res.redirect(URLUtils.url('Account-Show'));
        }
        next();
    }
);

server.append(
    'Track',
    consentTracking.consent,
    server.middleware.https,
    csrfProtection.validateRequest,
    csrfProtection.generateToken,
    function (req, res, next) {
        this.on('route:BeforeComplete', function (req, res) {

            var emailAddress = req.querystring.trackOrderEmail;
            var SalesforceModel = require('*/cartridge/scripts/SalesforceService/models/SalesforceModel');

            var orders = SalesforceModel.getOrdersByCustomerEmail({
                emailAddress: emailAddress,
                salesChannel: Site.getCurrent().getID()
            });

            var ordersArray = !empty(orders.object.orders) ? orders.object.orders : '';
            var orderNumberParam = req.querystring.trackOrderNumber;
            if (!empty(ordersArray) && !empty(orderNumberParam)) {
                var filteredOrder = ordersArray.filter(function (orderObject) {
                    return orderObject.num == orderNumberParam
                });
            }
            var orderStaus = {
                omsOrderStaus : !empty(filteredOrder) && filteredOrder.length > -1 ?  filteredOrder[0] : null
            } 
            var viewData = res.getViewData();
            res.setViewData(orderStaus);
            var test = res.getViewData();
            var test = 123;
        });

        next();
    }
);

module.exports = server.exports();
