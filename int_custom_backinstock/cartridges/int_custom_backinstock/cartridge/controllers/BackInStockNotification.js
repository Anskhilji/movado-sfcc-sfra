'use strict';

var server = require('server');

var backInStockNotificationHelper = require('*/cartridge/scripts/helpers/backInStockNotificationHelper');

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
            }
        }
        res.json({
            result: result
        });
        return next();
    }
);

module.exports = server.exports();