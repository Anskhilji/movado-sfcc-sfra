'use strict';

var server = require('server');

var URLUtils = require('dw/web/URLUtils');

var googlePayHelper = require('*/cartridge/scripts/helpers/googlePayHelpers.js');


server.post('GetTransactionInfo',
    server.middleware.https,
    function (req, res, next) {
        var BasketMgr = require('dw/order/BasketMgr');
        var currentBasket = BasketMgr.getCurrentOrNewBasket();
        if (!empty(currentBasket)) {
            var Locale = require('dw/util/Locale');
            var currentLocale = Locale.getLocale(req.locale.id);
            var transactionInfo =  {
                countryCode: currentLocale.country,
                currencyCode: session.currency.currencyCode
            }

            switch (req.form.googlePayEntryPoint) {
                case 'Product-Show':
                    googlePayHelper.addProductToCart(currentBasket, req.form.pid);
                    transactionInfo.totalPriceStatus = 'ESTIMATED';
                    break;
                
                case 'Cart-Show':
                    transactionInfo.totalPriceStatus = 'ESTIMATED';
                    break;
                    
                default:
                    transactionInfo.totalPriceStatus =  'FINAL';
                    break;
            }

            transactionInfo.totalPrice = currentBasket.totalGrossPrice.value

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
            pid: pid
        }
        res.render('/googlePay/googlePayButton', googlePayConfigs);
            
        next();
    }
);

module.exports = server.exports();