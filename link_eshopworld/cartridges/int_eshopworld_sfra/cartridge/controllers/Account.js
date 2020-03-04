'use strict';

var server = require('server');
server.extend(module.superModule);

server.append(
    'Login',
    function (req, res, next) {
        var viewData = res.getViewData();
        var URLUtils = require('dw/web/URLUtils');
        var authenticatedCustomer = viewData.authenticatedCustomer;
        if (authenticatedCustomer && authenticatedCustomer.authenticated) {
            var checkoutLogin = req.querystring.checkoutLogin;
            var eswHelper = require('*/cartridge/scripts/helper/eswHelper').getEswHelper();
            if (eswHelper.getEShopWorldModuleEnabled()) {
                res.json({
                    success: true,
                    redirectUrl: checkoutLogin
                        ? URLUtils.https('EShopWorld-PreOrderRequest').toString()
                        : URLUtils.url('Account-Show').toString()
                });
            }
        }
        res.setViewData(viewData);
        return next();
    }
);
module.exports = server.exports();
