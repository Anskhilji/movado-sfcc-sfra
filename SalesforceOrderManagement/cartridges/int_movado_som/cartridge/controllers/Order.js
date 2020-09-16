'use strict';

var server = require('server');
server.extend(module.superModule);
var URLUtils = require('dw/web/URLUtils');
var ProductMgr = require('dw/catalog/ProductMgr');
var Money = require('dw/value/Money');
var Resource = require('dw/web/Resource');
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
            emailAddress: emailAddress
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
                    orders.object.orders[i].status = 'Processing';
                }
            }

            res.render('orderhistory/list', { 
                orders: orders.object.orders,
                orderFilter: req.querystring.orderFilter,
                accountlanding: false,
                breadcrumbs: breadcrumbs
            });
        }
        else {
            res.render('orderhistory/list', { 
                orders: {},
                orderFilter: req.querystring.orderFilter,
                accountlanding: false,
                breadcrumbs: breadcrumbs
            });
        }


        next();
    }
);

module.exports = server.exports();
