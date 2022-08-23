'use strict';

var server = require('server');

var backInStockNotificationHelper = require('*/cartridge/scripts/helpers/backInStockNotificationHelper');
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

module.exports = server.exports();