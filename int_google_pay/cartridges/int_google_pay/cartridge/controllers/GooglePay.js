'use strict';

var server = require('server');

var BasketMgr = require('dw/order/BasketMgr');
var Transaction = require('dw/system/Transaction');
var URLUtils = require('dw/web/URLUtils');

var basketCalculationHelpers = require('*/cartridge/scripts/helpers/basketCalculationHelpers');
var cartHelper = require('*/cartridge/scripts/cart/cartHelpers');
var googlePayHelper = require('*/cartridge/scripts/helpers/googlePayHelpers.js');


server.post('GetTransactionInfo',
    server.middleware.https,
    function (req, res, next) {
        var currentBasket = BasketMgr.getCurrentOrNewBasket();
        if (!empty(currentBasket)) {
            var Locale = require('dw/util/Locale');
            var currentLocale = Locale.getLocale(req.locale.id);
            var test = req.form.shippingAddress;
            var transactionInfo = {
                countryCode: 'US',
                currencyCode: session.currency.currencyCode,
                totalPriceLabel: 'Total Price'
            }
            var displayItems = [];
            if (req.form.includeShippingDetails && !empty(req.form.includeShippingDetails) && (req.form.includeShippingDetails != 'false')) {
                var shippingMethods = googlePayHelper.getShippingMethods(currentBasket, req.form.selectedShippingMethod, req.form.shippingAddress);
                transactionInfo.newShippingOptionParameters = shippingMethods.defaultShippingMethods;
                displayItems.push(shippingMethods.selectedMethodObject);
            }

            switch (req.form.googlePayEntryPoint) {
                case 'Product-Show':
                    googlePayHelper.addProductToCart(currentBasket, req.form.pid);
                    currentBasket = BasketMgr.getCurrentOrNewBasket();
                    transactionInfo.totalPriceStatus = 'ESTIMATED';
                    transactionInfo.totalPrice = currentBasket.totalNetPrice.value.toString();
                    break;

                case 'Cart-Show':
                    transactionInfo.totalPriceStatus = 'ESTIMATED';
                    Transaction.wrap(function () {
                        cartHelper.ensureAllShipmentsHaveMethods(currentBasket);
                        basketCalculationHelpers.calculateTotals(currentBasket);
                    })
                    transactionInfo.totalPrice = currentBasket.totalNetPrice.value.toString();
                    break;

                default:
                    transactionInfo.totalPriceStatus = 'FINAL';
                    transactionInfo.totalPrice = currentBasket.totalGrossPrice.value.toString();
                    break;

            }
            var subTotal = {
                label: 'Subtotal',
                type: 'SUBTOTAL',
                price: currentBasket.totalNetPrice.value.toString()
            };
            var taxTotal = {
                label: 'Tax',
                type: 'TAX',
                price: currentBasket.totalTax.value.toString()
            };
            displayItems.push(subTotal);
            displayItems.push(taxTotal);
            transactionInfo.displayItems = displayItems;
            res.json({
                transactionInfo: transactionInfo,
                error: false
            });
        } else {
            res.json({
                error: true
            });
        }
        next();
    }
);


server.get('RenderButton',
    server.middleware.https,
    function (req, res, next) {
        var googlePayMerchantID = googlePayHelper.getGooglePayMerchantID();
        var googlePayEnvironment = googlePayHelper.getGooglePayEnvironment();
        var googlePayButtonColor = googlePayHelper.getGooglePayButtonColor();
        var googlePayButtonType = googlePayHelper.getGooglePayButtonType();
        var isEnabledGooglePayCustomSize = googlePayHelper.isEnabledGooglePayCustomSize();
        var googlePayMerchantName = googlePayHelper.getAdyenMerchantID();
        var isGooglePayEnabled = googlePayHelper.isGooglePayEnabled();
        var googlePayEntryPoint = req.querystring.googlePayEntryPoint;
        var pid = req.querystring.pid;

        var actionURL = URLUtils.url('GooglePay-GetTransactionInfo');
        var processingURL = URLUtils.url('GooglePay-ExpressCheckout');

        var googlePayConfigs = {
            googlePayMerchantID: googlePayMerchantID,
            googlePayEnvironment: googlePayEnvironment.value,
            googlePayButtonColor: googlePayButtonColor.value,
            googlePayButtonType: googlePayButtonType.value,
            isEnabledGooglePayCustomSize: isEnabledGooglePayCustomSize,
            googlePayMerchantName: googlePayMerchantName,
            isGooglePayEnabled: isGooglePayEnabled,
            actionURL: actionURL,
            googlePayEntryPoint: googlePayEntryPoint,
            pid: pid,
            processingURL:processingURL
        }
        res.render('/googlePay/googlePayButton', googlePayConfigs);

        next();
    }
);


server.post('ExpressCheckout',
    server.middleware.https,
    function (req, res, next) {
        var currentBasket =  BasketMgr.getCurrentOrNewBasket();
        var googlePayResponse = JSON.parse(req.form.googlePayResponse);
        var selectedShippingMethod = googlePayResponse.shippingOptionData.id;
        var shippingAddressData = googlePayResponse.shippingAddress;
        googlePayHelper.setShippingAndBillingAddress(currentBasket, selectedShippingMethod, shippingAddressData, currentBasket.defaultShipment);
        


    }
);

module.exports = server.exports();