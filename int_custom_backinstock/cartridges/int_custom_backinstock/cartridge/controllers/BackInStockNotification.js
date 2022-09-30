'use strict';

var server = require('server');

var backInStockNotificationHelper = require('*/cartridge/scripts/helpers/backInStockNotificationHelper');
var productHelper = require('*/cartridge/scripts/helpers/productHelpers');
var cacheAtc = require('*/cartridge/scripts/middleware/cache');
var Site = require('dw/system/Site');

server.post('Subscribe',
    server.middleware.https,
    function (req, res, next) {
        var form = req.form;
        var result = {
            success: false,
            isValidEmail: false,
            isAlreadySubscribed: false
        };
        if (!empty(form)) {
            if (backInStockNotificationHelper.isValidEmail(form.email)) {
                result.isValidEmail = true;
                if (!empty(form.pid)) {
                    var backInStockNotificationObj = {
                        email: form.email,
                        productID: form.pid,
                        enabledMarketing: !empty(form.enabledMarketing) && (form.enabledMarketing == 'true' || form.enabledMarketing == true) ? true : false
                    }
                    result.isAlreadySubscribed = backInStockNotificationHelper.isAlreadySubscribed(backInStockNotificationObj);
                    if (!result.isAlreadySubscribed) {
                        result.success = backInStockNotificationHelper.saveBackInStockNotificationObj(backInStockNotificationObj);
                    }
                }
                var requestParams = {
                    email: form.email
                }
                //Custom Start [MSS-1453]: Send Subscriber to Listrak if checkbox is checked
                if ((form.enabledMarketing == 'true' || form.enabledMarketing == true) && Site.current.preferences.custom.Listrak_Cartridge_Enabled) {
                    var ltkApi = require('*/cartridge/scripts/api/ListrakAPI');
                    var ltkConstants = require('*/cartridge/scripts/utils/ListrakConstants');
                    requestParams.source = ltkConstants.Source.BackInStock;
                    requestParams.event = ltkConstants.Event.BackInStock;
                    requestParams.subscribe = ltkConstants.Subscribe.BackInStock;
                    ltkApi.sendSubscriberToListrak(requestParams);
                } else {
                    var SFMCApi = require('int_custom_marketing_cloud/cartridge/scripts/api/SFMCApi');
                    SFMCApi.sendSubscriberToSFMC(requestParams);
                }
                //Custom End: 
            }
        }
        res.json({
            result: result
        });
        return next();
    }
);

// Show back-in stock notification as Remote Include
server.get('ShowBackInStock', cacheAtc.applyAtcSensitiveCache, function (req, res, next) {
    var showProductPageHelperResult = productHelper.showProductPage(req.querystring, req.pageMetaData);
    var productId = req.querystring.pid;
    var template = null;

    if (Site.getCurrent().preferences.custom.enableBackInStock && !Site.getCurrent().preferences.custom.Listrak_EnableBackInStockSms && !Site.getCurrent().preferences.custom.Listrak_EnableBackInStockEmail) {
        template = 'product/backInStockNotificationForm';
    } else if (Site.getCurrent().preferences.custom.Listrak_Cartridge_Enabled) {
        if (Site.getCurrent().preferences.custom.Listrak_EnableBackInStockSms || Site.getCurrent().preferences.custom.Listrak_EnableBackInStockEmail) {
            template = 'product/listrackBackInstockForm';
        } else {
            template = 'product/backInStockNotificationForm';
        }
    } else {
        template = 'product/backInStockNotificationForm';
    }

    res.render(template, {
        product: showProductPageHelperResult.product,
        productId: productId
    });

    next();
});

module.exports = server.exports();