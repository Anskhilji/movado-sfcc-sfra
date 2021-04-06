'use strict';

var server = require('server');


var backInStockHelpers = require('*/cartridge/scripts/helpers/backInStockHelpers');

server.post('Subscribe',
    server.middleware.https,
    function (req, res, next) {
        var form = req.form;
        var result = {
            success: false,
            isValidEmail: false
        };
        if (!empty(form)) {
            if (backInStockHelpers.isValidEmail(form.email)) {
                result.isValidEmail = true;
                if (!empty(form.pid)) {
                    var backInStockObj = {
                        email: form.email,
                        productID: form.pid,
                        enabledMarketing: !empty(form.enabledMarketing) && (form.enabledMarketing == 'true' || form.enabledMarketing == true) ? true : false
                    }
                    result.success = backInStockHelpers.saveBackInStockNotificationObj(backInStockObj);
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