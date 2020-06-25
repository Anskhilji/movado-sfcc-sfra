'use strict';

var server = require('server');
server.extend(module.superModule);

var Site = require('dw/system/Site');

server.append(
    'AddAddress',
    function (req, res, next) {
        // Custom Start: Get all esw supported countries
        var countries = Site.current.getCustomPreferenceValue('eswAllCountries');
        // Custom End
        res.setViewData({
            countries : countries
        });
        next();
    }
);

server.append(
    'EditAddress',
    function (req, res, next) {
        var CustomerMgr = require('dw/customer/CustomerMgr');
        var AddressModel = require('*/cartridge/models/address');

        var addressId = req.querystring.addressId;
        var customer = CustomerMgr.getCustomerByCustomerNumber(
            req.currentCustomer.profile.customerNo
        );
        var addressBook = customer.getProfile().getAddressBook();
        var rawAddress = addressBook.getAddress(addressId);
        var addressModel = new AddressModel(rawAddress);

        // Custom Start: Get all esw supported countries and selected country
        var countries = Site.current.getCustomPreferenceValue('eswAllCountries');
        var countryCode = addressModel.address.countryCode.value;
        // Custom End
        res.setViewData({
            countries : countries,
            countryCode : countryCode
        });
        next();
    }
);

server.append('SaveAddress', function (req, res, next) {
    var CustomerMgr = require('dw/customer/CustomerMgr');
    var Transaction = require('dw/system/Transaction');

    var addressForm = server.forms.getForm('address');
    var addressFormObj = addressForm.toObject();
    addressFormObj.addressForm = addressForm;
    var customer = CustomerMgr.getCustomerByCustomerNumber(
        req.currentCustomer.profile.customerNo
    );
    var addressBook = customer.getProfile().getAddressBook();
    if (addressForm.valid) {
        this.on('route:BeforeComplete', function () { // eslint-disable-line no-shadow
            var formInfo = res.getViewData();
            Transaction.wrap(function () {
                var address = req.querystring.addressId
                    ? addressBook.getAddress(req.querystring.addressId)
                    : addressBook.createAddress(formInfo.addressId);
                if (address) {
                    // Custom Start: Improve condition to check if state code is null
                    address.setStateCode(formInfo.states.stateCode || '');
                    // Custom End
                }
            });
        });
    }
    return next();
});

module.exports = server.exports();
