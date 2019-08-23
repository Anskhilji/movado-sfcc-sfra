'use strict';

var server = require('server');
server.extend(module.superModule);

/**
 * Extends Account-SubmitRegistration controller to send account data to Yotpo for Swell Loyalty
 */
server.append('SubmitRegistration', function (req, res, next) {
    this.on('route:BeforeComplete', function (req, res) { // eslint-disable-line no-shadow
        var registrationForm = res.getViewData();

        if (registrationForm.success) {
            var CustomerMgr = require('dw/customer/CustomerMgr');

            var email = registrationForm.email;
            var customerAPI = CustomerMgr.getCustomerByLogin(email);

            if (customerAPI) {
                var SwellExporter = require('int_yotpo/cartridge/scripts/yotpo/swell/export/SwellExporter');
                SwellExporter.exportCustomer({
                    customerNo: customerAPI.profile.customerNo
                });
            }
        }
    });

    return next();
});

/**
 * Extends Account-SaveProfile controller to send account data to Yotpo for Swell Loyalty
 */
server.append('SaveProfile', function (req, res, next) {
    this.on('route:BeforeComplete', function (req, res) { // eslint-disable-line no-shadow
        var viewData = res.getViewData();

        if (viewData.success) {
            var SwellExporter = require('int_yotpo/cartridge/scripts/yotpo/swell/export/SwellExporter');
            SwellExporter.exportCustomer({
                customerNo: req.currentCustomer.profile.customerNo
            });
        }
    });

    return next();
});

module.exports = server.exports();
